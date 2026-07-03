"""
EdgeShield AI — Python FastAPI Production Server
Edge AI Edition v2.1.0

All AI processing is local. No cloud API required.
Database: SQLite (fully embedded, no server needed)
WebSockets: Local broadcast only
"""

import os
import time
import random
import threading
import json
import asyncio
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from contextlib import asynccontextmanager

from app.database.database import engine, Base, get_db, SessionLocal
from app.models import models
from app.security import auth
from ai_models.ai_engine import analyze_telemetry
from app.websocket.telemetry_driver import TelemetryDriver
from app.security.security_monitor import SecurityMonitor

# Tables will be initialized inside the lifespan context manager.

# ─── Configuration from environment (with sensible defaults) ─────────────────
TELEMETRY_MODE     = os.getenv("TELEMETRY_MODE", "simulation")
TELEMETRY_INTERVAL = float(os.getenv("TELEMETRY_INTERVAL_MS", "1000")) / 1000.0
EDGE_AI_VERSION    = os.getenv("EDGE_AI_VERSION", "2.1.0")

# ─── Load or initialize app_settings from SQLite ─────────────────────────────
def _load_settings(db: Session) -> dict:
    defaults = {
        "healthWarnThreshold": 80,
        "healthCritThreshold": 50,
        "predictSensitivity":  85,
        "aiEnabled":           True
    }
    settings = {}
    for key, default in defaults.items():
        row = db.query(models.Settings).filter(models.Settings.key == key).first()
        if row:
            val = row.value
            if isinstance(default, bool):
                settings[key] = val.lower() == 'true'
            elif isinstance(default, int):
                settings[key] = int(val)
            else:
                settings[key] = val
        else:
            # Seed with default
            db.add(models.Settings(key=key, value=str(default)))
            settings[key] = default
    db.commit()
    return settings

def _save_settings(db: Session, settings: dict):
    for key, value in settings.items():
        row = db.query(models.Settings).filter(models.Settings.key == key).first()
        if row:
            row.value = str(value)
        else:
            db.add(models.Settings(key=key, value=str(value)))
    db.commit()

# ─── Default cyber devices ────────────────────────────────────────────────────
DEFAULT_CYBER_DEVICES = [
    { "id": 'DEV-PLC01', "name": 'Ventilation PLC Controller',   "ip": '10.227.100.10',  "type": 'PLC',     "status": 'Online',   "trust_score": 98, "risk_level": 'Low',      "machine": 'CNC Milling Machine M1',   "mac": '00:1A:2B:3C:4D:5E', "firmware": 'v1.4.2-b',   "packets_sec": 42,  "error_rate": 0.0  },
    { "id": 'DEV-GW04',  "name": 'Zone 4 Security Gateway',       "ip": '10.227.100.1',   "type": 'Gateway', "status": 'Online',   "trust_score": 99, "risk_level": 'Low',      "machine": 'N/A',                      "mac": '00:1A:2B:9F:8E:7D', "firmware": 'v3.1.0-sec', "packets_sec": 154, "error_rate": 0.01 },
    { "id": 'DEV-PLC04', "name": 'Compressor Controller PLC',     "ip": '10.227.100.14',  "type": 'PLC',     "status": 'Warning',  "trust_score": 52, "risk_level": 'Critical', "machine": 'Rotary Compressor RC-2',   "mac": '00:1A:2B:4E:5D:6C', "firmware": 'v1.2.9-legacy', "packets_sec": 230, "error_rate": 8.5 },
    { "id": 'DEV-MTR09', "name": 'Spindle Controller Module',     "ip": '10.227.102.25',  "type": 'Motor',   "status": 'Warning',  "trust_score": 78, "risk_level": 'Warning',  "machine": 'Spindle Motor SM-09',      "mac": '00:1A:2B:1A:2B:3C', "firmware": 'v1.5.0-b',   "packets_sec": 65,  "error_rate": 2.1  }
]

def _load_cyber_devices(db: Session) -> list:
    """Load cyber devices from SQLite, or seed from defaults if empty."""
    rows = db.query(models.CyberDevice).all()
    if not rows:
        for d in DEFAULT_CYBER_DEVICES:
            db.add(models.CyberDevice(**d))
        db.commit()
        rows = db.query(models.CyberDevice).all()
    return [_device_to_dict(r) for r in rows]

def _save_cyber_devices(db: Session, devices: list):
    """Upsert cyber device list into SQLite."""
    for d in devices:
        row = db.query(models.CyberDevice).filter(models.CyberDevice.id == d["id"]).first()
        if row:
            row.risk_level   = d.get("riskLevel", d.get("risk_level", "Low"))
            row.trust_score  = d.get("trustScore", d.get("trust_score", 100))
            row.packets_sec  = d.get("packetsSec", d.get("packets_sec", 0))
            row.error_rate   = d.get("errorRate", d.get("error_rate", 0.0))
            row.status       = d.get("status", "Online")
        else:
            db.add(models.CyberDevice(
                id          = d["id"],
                name        = d.get("name", ""),
                ip          = d.get("ip", ""),
                type        = d.get("type", ""),
                mac         = d.get("mac", ""),
                firmware    = d.get("firmware", ""),
                machine     = d.get("machine", ""),
                risk_level  = d.get("riskLevel", d.get("risk_level", "Low")),
                trust_score = d.get("trustScore", d.get("trust_score", 100)),
                packets_sec = d.get("packetsSec", d.get("packets_sec", 0)),
                error_rate  = d.get("errorRate", d.get("error_rate", 0.0)),
                status      = d.get("status", "Online"),
            ))
    db.commit()

def _device_to_dict(d) -> dict:
    if isinstance(d, dict):
        return d
    return {
        "id":          d.id,
        "name":        d.name,
        "ip":          d.ip,
        "type":        d.type,
        "mac":         d.mac,
        "firmware":    d.firmware,
        "machine":     d.machine,
        "riskLevel":   d.risk_level,
        "trustScore":  d.trust_score,
        "packetsSec":  d.packets_sec,
        "errorRate":   d.error_rate,
        "status":      d.status
    }

def _write_audit(db: Session, operator: str, action: str, target: str, detail: str):
    db.add(models.AuditLog(
        operator_email=operator,
        action_type=action,
        target_id=target,
        detail=detail
    ))
    db.commit()

# ─── Seed database with defaults ─────────────────────────────────────────────
def seed_database():
    db = SessionLocal()
    try:
        admin_user = db.query(models.User).filter(models.User.email == "operator@edgeshield.ai").first()
        if not admin_user:
            hashed_pw = auth.get_password_hash("password123")
            db.add(models.User(
                email="operator@edgeshield.ai",
                hashed_password=hashed_pw,
                role="Administrator",
                dept="Security",
                name="Aishwarya R"
            ))
            db.commit()

        default_machines = [
            {"id": 'MC-101', "name": 'CNC Milling Machine M1',    "type": 'CNC Milling', "location": 'Zone 1', "dept": 'Production',  "status": 'Healthy', "health": 96, "temp": 42.5, "vibration": 0.4,  "voltage": 415.0, "pressure": 0.0,   "current": 12.4, "rpm": 1800, "energy": 12.5, "failure_prob": 2.1,  "rul": 240},
            {"id": 'MC-104', "name": 'Rotary Compressor RC-2',     "type": 'Compressor',  "location": 'Zone 1', "dept": 'Maintenance', "status": 'Healthy', "health": 94, "temp": 48.2, "vibration": 0.5,  "voltage": 415.0, "pressure": 6.2,   "current": 15.8, "rpm": 1450, "energy": 14.1, "failure_prob": 3.4,  "rul": 220},
            {"id": 'MC-105', "name": 'Conveyor Drive System C5',   "type": 'Conveyor',    "location": 'Zone 3', "dept": 'Logistics',   "status": 'Healthy', "health": 91, "temp": 39.8, "vibration": 0.8,  "voltage": 415.0, "pressure": 0.0,   "current": 8.5,  "rpm": 120,  "energy": 6.8,  "failure_prob": 4.8,  "rul": 180},
            {"id": 'MC-106', "name": 'Hydraulic Press HP-3',       "type": 'Press',       "location": 'Zone 4', "dept": 'Stamping',    "status": 'Healthy', "health": 82, "temp": 48.6, "vibration": 1.1,  "voltage": 415.0, "pressure": 185.0, "current": 24.1, "rpm": 0,    "energy": 18.2, "failure_prob": 15.0, "rul": 120},
            {"id": 'MC-107', "name": 'CNC-07 Milling Machine',     "type": 'CNC Milling', "location": 'Zone 2', "dept": 'Production',  "status": 'Healthy', "health": 95, "temp": 44.2, "vibration": 0.35, "voltage": 415.0, "pressure": 0.0,   "current": 11.2, "rpm": 1600, "energy": 10.5, "failure_prob": 1.8,  "rul": 260},
            {"id": 'MC-108', "name": 'Spindle Motor SM-09',        "type": 'Spindle',     "location": 'Zone 2', "dept": 'Machining',   "status": 'Healthy', "health": 87, "temp": 52.1, "vibration": 1.4,  "voltage": 415.0, "pressure": 0.0,   "current": 18.5, "rpm": 3000, "energy": 15.4, "failure_prob": 12.0, "rul": 160},
        ]
        for m_info in default_machines:
            if not db.query(models.Machine).filter(models.Machine.id == m_info["id"]).first():
                db.add(models.Machine(**m_info))
        db.commit()
    finally:
        db.close()
# ─── Load persisted state from SQLite (deferred to lifespan startup) ─────────
app_settings = {}
cyber_devices = []

# app will be instantiated below with the lifespan context manager.

# ─── Pydantic schemas ─────────────────────────────────────────────────────────
class LoginPayload(BaseModel):
    email: str
    password: str

class SignUpPayload(BaseModel):
    name: str
    email: str
    password: str
    dept: str

class MachinePayload(BaseModel):
    id: str
    name: str
    type: str
    location: str
    dept: str

class AlertPayload(BaseModel):
    id: str
    machine: str
    machine_id: str
    type: str
    priority: str
    summary: str
    aiExplanation: str
    recommendedAction: str
    assignedTo: str
    affected: str

class SyncPayload(BaseModel):
    alerts: List[AlertPayload]

class ReportPayload(BaseModel):
    title: str
    format: str
    department: str

class SettingsPayload(BaseModel):
    healthWarnThreshold: int
    healthCritThreshold: int
    predictSensitivity:  int
    aiEnabled:           bool

class DeviceQuarantinePayload(BaseModel):
    id: str

class AssignPayload(BaseModel):
    assignedTo: str

# ─── WebSocket Connection Manager ────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        dead = []
        for ws in self.active_connections:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

manager = ConnectionManager()
_main_loop: Optional[asyncio.AbstractEventLoop] = None

# ─── Background telemetry loop ────────────────────────────────────────────────
demo_time        = 0
telemetry_driver = TelemetryDriver(TELEMETRY_MODE)
security_monitor = SecurityMonitor()
server_start_time = time.time()

async def telemetry_loop():
    """
    Background asyncio task — runs the local Edge AI processing pipeline.
    1. Fetches telemetry (simulation or real hardware via protocol driver)
    2. Runs local AI engine per machine (health/RUL/failure prediction)
    3. Writes sensor logs to SQLite
    4. Triggers alerts on status changes — written to SQLite
    5. Runs local cybersecurity monitor
    6. Broadcasts live payload to all WebSocket clients
    """
    global demo_time, cyber_devices

    while True:
        try:
            await asyncio.sleep(TELEMETRY_INTERVAL)
            demo_time += 1

            db = SessionLocal()
            alerts_triggered = []
            updated_data     = []

            try:
                machines = db.query(models.Machine).all()

                # 1. Fetch telemetry tick
                raw_telemetry = await telemetry_driver.fetch_telemetry_tick(machines, demo_time)

                # 2. AI analysis per machine (with real history now)
                for m_dict in raw_telemetry:
                    m_obj = db.query(models.Machine).filter(models.Machine.id == m_dict["id"]).first()
                    if not m_obj:
                        continue

                    # Fetch last 10 sensor logs for temporal anomaly detection
                    history = (
                        db.query(models.SensorLog)
                        .filter(models.SensorLog.machine_id == m_obj.id)
                        .order_by(models.SensorLog.id.desc())
                        .limit(10)
                        .all()
                    )

                    ai_results = analyze_telemetry(m_dict, history, {
                        "warning": app_settings.get("healthWarnThreshold", 80),
                        "critical": app_settings.get("healthCritThreshold", 50)
                    })

                    previous_status = m_obj.status

                    # Update machine columns in SQLite
                    m_obj.temp         = m_dict["temp"]
                    m_obj.vibration    = m_dict["vibration"]
                    m_obj.current      = m_dict["current"]
                    m_obj.rpm          = m_dict["rpm"]
                    m_obj.pressure     = m_dict["pressure"]
                    m_obj.voltage      = m_dict.get("voltage", 415.0)
                    m_obj.energy       = m_dict.get("energy", m_obj.energy)
                    m_obj.health       = ai_results["health"]
                    m_obj.status       = ai_results["status"]
                    m_obj.failure_prob = ai_results["failure_prob"]
                    m_obj.rul          = ai_results["rul"]

                    # Write sensor log
                    db.add(models.SensorLog(
                        machine_id = m_obj.id,
                        temp       = m_obj.temp,
                        vibration  = m_obj.vibration,
                        current    = m_obj.current,
                        rpm        = m_obj.rpm,
                        pressure   = m_obj.pressure,
                        energy     = m_obj.energy,
                        voltage    = m_obj.voltage
                    ))

                    # Auto-generate alert on Healthy → Warning/Critical transition
                    if ai_results["status"] != "Healthy" and previous_status == "Healthy":
                        alt_id   = f"ALT-MAINT-{random.randint(400, 999)}"
                        priority = "Critical" if ai_results["status"] == "Critical" else "Warning"
                        ts_str   = datetime.now().strftime("%I:%M:%S %p")

                        db.add(models.Alert(
                            id                 = alt_id,
                            machine            = m_obj.name,
                            machine_id         = m_obj.id,
                            type               = "Predictive Maintenance",
                            priority           = priority,
                            summary            = f"Anomaly detected on {m_obj.name}: {ai_results['explanation']}",
                            ai_explanation     = ai_results["explanation"],
                            recommended_action = ai_results["suggested_action"],
                            timestamp          = ts_str,
                            status             = "Open",
                            assigned_to        = "Unassigned",
                            affected           = "Main Operating Core"
                        ))
                        alerts_triggered.append({
                            "id":                alt_id,
                            "machine":           m_obj.name,
                            "machine_id":        m_obj.id,
                            "type":              "Predictive Maintenance",
                            "priority":          priority,
                            "summary":           f"Anomaly detected on {m_obj.name}: {ai_results['explanation']}",
                            "aiExplanation":     ai_results["explanation"],
                            "recommendedAction": ai_results["suggested_action"],
                            "timestamp":         ts_str,
                            "status":            "Open",
                            "assignedTo":        "Unassigned",
                            "affected":          "Main Operating Core"
                        })

                    updated_data.append({
                        "id":                m_obj.id,
                        "name":              m_obj.name,
                        "type":              m_obj.type,
                        "location":          m_obj.location,
                        "dept":              m_obj.dept,
                        "temp":              m_obj.temp,
                        "vibration":         m_obj.vibration,
                        "rpm":               m_obj.rpm,
                        "pressure":          m_obj.pressure,
                        "current":           m_obj.current,
                        "voltage":           m_obj.voltage,
                        "energy":            m_obj.energy,
                        "health":            m_obj.health,
                        "status":            m_obj.status,
                        "failureProbability": m_obj.failure_prob,
                        "rul":               m_obj.rul,
                        "aiConfidence":      ai_results["ai_confidence"],
                        "suggestedAction":   ai_results["suggested_action"],
                        "explanation":       ai_results["explanation"],
                        "anomalyCount":      len(ai_results.get("anomalies", []))
                    })

                # 3. Cybersecurity local monitor
                sec_results  = security_monitor.evaluate_security(cyber_devices, demo_time)
                cyber_devices = sec_results["updatedDevices"]
                for s_alert in sec_results["alertsTriggered"]:
                    db.add(models.Alert(
                        id                 = s_alert["id"],
                        machine            = s_alert["machine"],
                        machine_id         = s_alert["machine_id"],
                        type               = s_alert["type"],
                        priority           = s_alert["priority"],
                        summary            = s_alert["summary"],
                        ai_explanation     = s_alert["aiExplanation"],
                        recommended_action = s_alert["recommendedAction"],
                        timestamp          = s_alert["timestamp"],
                        status             = s_alert["status"],
                        assigned_to        = s_alert["assignedTo"],
                        affected           = s_alert["affected"]
                    ))
                    alerts_triggered.append(s_alert)

                # 4. Persist updated cyber device state to SQLite every 30 ticks
                if demo_time % 30 == 0:
                    _save_cyber_devices(db, cyber_devices)

                db.commit()

                # 5. Broadcast live payload
                payload = {
                    "timestamp":    time.time(),
                    "machines":     updated_data,
                    "cyberDevices": cyber_devices,
                    "alerts":       alerts_triggered,
                    "edgeStatus": {
                        "mode":        TELEMETRY_MODE,
                        "version":     EDGE_AI_VERSION,
                        "uptime":      int(time.time() - server_start_time),
                        "wsClients":   len(manager.active_connections),
                        "dbStatus":    "connected",
                        "aiEngine":    "active",
                        "cloudDeps":   False
                    }
                }
                await manager.broadcast(json.dumps(payload))

            except Exception as e:
                print(f"[EdgeShield AI] Telemetry loop error: {e}")
            finally:
                db.close()
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"[EdgeShield AI] Telemetry task outer exception: {e}")

_telemetry_task: Optional[asyncio.Task] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global app_settings, cyber_devices, _telemetry_task

    # ─── Initialize all SQLite tables ────────────────────────────────────────────
    Base.metadata.create_all(bind=engine)

    # ─── Seed database with defaults ─────────────────────────────────────────────
    seed_database()

    # ─── Load settings & devices from DB ──────────────────────────────────────────
    db = SessionLocal()
    try:
        app_settings.update(_load_settings(db))
        cyber_devices.extend(_load_cyber_devices(db))
    finally:
        db.close()

    # Start telemetry loop task on the event loop
    _telemetry_task = asyncio.create_task(telemetry_loop())

    yield

    # Clean up telemetry background task
    if _telemetry_task:
        _telemetry_task.cancel()
        try:
            await _telemetry_task
        except asyncio.CancelledError:
            pass

# ─── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="EdgeShield AI — Edge Processing Server",
    version=EDGE_AI_VERSION,
    description="Fully offline, local-first industrial AI platform. No cloud required.",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ─── REST ENDPOINTS ───────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {
        "status":      "running",
        "application": "EdgeShield AI",
        "version":     EDGE_AI_VERSION,
        "mode":        TELEMETRY_MODE,
        "cloud":       False,
        "message":     "EdgeShield AI Edge Server is running. No cloud required."
    }

@app.get("/health")
def read_health():
    return {"status": "healthy", "database": "connected", "websocket": "active"}

@app.get("/health/edge")
def edge_status():
    """Edge AI processing status endpoint for the dashboard status panel."""
    return {
        "edgeAI":         "active",
        "telemetryMode":  TELEMETRY_MODE,
        "version":        EDGE_AI_VERSION,
        "database":       "sqlite_local",
        "cloudRequired":  False,
        "uptime":         int(time.time() - server_start_time),
        "wsClients":      len(manager.active_connections),
        "aiFeatures":     [
            "Health Scoring",
            "Failure Probability",
            "Remaining Useful Life",
            "Thermal Instability Detection",
            "Vibration Anomaly Detection",
            "Electrical Overload Detection",
            "Pressure Fluctuation Detection",
            "RPM Instability Detection",
            "Energy Overconsumption Detection",
            "Cybersecurity Threat Detection"
        ],
        "protocols":      ["simulation", "mqtt", "opcua", "modbus"],
        "activeProtocol": TELEMETRY_MODE
    }

@app.post("/api/signup")
def signup(payload: SignUpPayload, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Operator email is already registered.")
    hashed_pw = auth.get_password_hash(payload.password)
    db.add(models.User(
        email=payload.email, hashed_password=hashed_pw,
        name=payload.name, dept=payload.dept, role=payload.dept
    ))
    db.commit()
    _write_audit(db, payload.email, "SIGNUP", payload.email, f"New operator registered: {payload.name}")
    return {"status": "success", "message": "Operator profile registered successfully."}

@app.get("/api/users")
def get_users(db: Session = Depends(get_db), current_user: models.User = Depends(auth.check_admin_privilege)):
    users = db.query(models.User).all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role, "dept": u.dept} for u in users]

@app.post("/api/users")
def create_user(payload: SignUpPayload, db: Session = Depends(get_db), current_user: models.User = Depends(auth.check_admin_privilege)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Operator email is already registered.")
    hashed_pw = auth.get_password_hash(payload.password)
    db.add(models.User(
        email=payload.email, hashed_password=hashed_pw,
        name=payload.name, dept=payload.dept, role=payload.dept
    ))
    db.commit()
    _write_audit(db, current_user.email, "USER_CREATE", payload.email, f"Registered new user operator: {payload.name}")
    return {"status": "success", "message": "User operator created successfully."}

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.check_admin_privilege)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    db.delete(user)
    db.commit()
    _write_audit(db, current_user.email, "USER_DELETE", user.email, f"Deleted operator user: {user.email}")
    return {"status": "success", "message": "Operator deleted successfully."}

@app.post("/api/login")
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not auth.verify_password(payload.password, user.hashed_password):
        _write_audit(db, payload.email, "LOGIN_FAIL", payload.email, "Invalid credentials")
        raise HTTPException(status_code=401, detail="Invalid email or password credentials.")
    access_token  = auth.create_access_token(data={
        "sub": user.email,
        "role": user.role,
        "name": user.name or user.email.split('@')[0].capitalize(),
        "dept": user.dept
    })
    refresh_token = auth.create_refresh_token(data={"sub": user.email})
    _write_audit(db, payload.email, "LOGIN", payload.email, "Operator logged in successfully")
    return {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "token_type":    "bearer",
        "user": {
            "email": user.email, "role": user.role,
            "name":  user.name or user.email.split('@')[0].capitalize(),
            "dept":  user.dept
        }
    }

@app.get("/api/me")
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "email": current_user.email,
        "role": current_user.role,
        "name": current_user.name or current_user.email.split('@')[0].capitalize(),
        "dept": current_user.dept
    }

@app.get("/api/machines")
def get_machines(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return [
        {
            "id": m.id, "name": m.name, "type": m.type,
            "location": m.location, "dept": m.dept, "status": m.status,
            "health": m.health, "temp": m.temp, "vibration": m.vibration,
            "voltage": m.voltage, "pressure": m.pressure, "current": m.current,
            "rpm": m.rpm, "energy": m.energy, "failure_prob": m.failure_prob,
            "rul": m.rul, "aiConfidence": 95.0,
            "suggestedAction": "No Action Required" if m.status == 'Healthy' else "Inspect components.",
            "explanation": "Nominal startup values."
        }
        for m in db.query(models.Machine).all()
    ]

@app.post("/api/machines")
def create_machine(payload: MachinePayload, db: Session = Depends(get_db),
                   current_user: models.User = Depends(auth.check_admin_privilege)):
    if db.query(models.Machine).filter(models.Machine.id == payload.id).first():
        raise HTTPException(status_code=400, detail="Machine ID already exists.")
    db.add(models.Machine(id=payload.id, name=payload.name, type=payload.type,
                          location=payload.location, dept=payload.dept))
    db.commit()
    _write_audit(db, current_user.email, "MACHINE_ADD", payload.id, f"Added machine: {payload.name}")
    return {"status": "success", "message": f"Registered machine {payload.name}"}

@app.post("/api/machines/{machine_id}/telemetry")
def ingest_telemetry(machine_id: str, payload: dict,
                     db: Session = Depends(get_db),
                     current_user: models.User = Depends(auth.get_current_user)):
    """
    External telemetry push endpoint — for use by MQTT/OPC-UA/Modbus bridge adapters.
    Accepts a JSON payload with temp, vibration, current, rpm, pressure fields.
    """
    m = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not m:
        raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found.")
    db.add(models.SensorLog(
        machine_id=m.id,
        temp=payload.get("temp", m.temp),
        vibration=payload.get("vibration", m.vibration),
        current=payload.get("current", m.current),
        rpm=payload.get("rpm", m.rpm),
        pressure=payload.get("pressure", m.pressure)
    ))
    db.commit()
    return {"status": "success", "message": f"Telemetry logged for {machine_id}"}

@app.get("/api/alerts")
def get_alerts(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return [
        {
            "id": a.id, "machine": a.machine, "machineId": a.machine_id,
            "type": a.type, "priority": a.priority, "summary": a.summary,
            "aiExplanation": a.ai_explanation or "No explanation generated.",
            "recommendedAction": a.recommended_action or "No recommendation.",
            "timestamp": a.timestamp, "status": a.status,
            "assignedTo": a.assigned_to or "Unassigned",
            "affected": a.affected or "System Core"
        }
        for a in db.query(models.Alert).order_by(models.Alert.id.desc()).all()
    ]

@app.post("/api/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db),
                      current_user: models.User = Depends(auth.get_current_user)):
    a = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found.")
    a.status = "Acknowledged"
    db.commit()
    _write_audit(db, current_user.email, "ACKNOWLEDGE", alert_id, f"Alert {alert_id} acknowledged")
    return {"status": "success", "message": f"Alert {alert_id} acknowledged."}

@app.post("/api/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str, db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    a = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found.")
    a.status = "Resolved"
    db.commit()
    _write_audit(db, current_user.email, "RESOLVE", alert_id, f"Alert {alert_id} resolved")
    return {"status": "success", "message": f"Alert {alert_id} resolved."}

@app.post("/api/alerts/{alert_id}/assign")
def assign_alert(alert_id: str, payload: AssignPayload, db: Session = Depends(get_db),
                 current_user: models.User = Depends(auth.get_current_user)):
    a = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found.")
    a.assigned_to = payload.assignedTo
    db.commit()
    _write_audit(db, current_user.email, "ASSIGN", alert_id, f"Alert assigned to {payload.assignedTo}")
    return {"status": "success", "message": f"Alert {alert_id} assigned to {payload.assignedTo}."}

@app.post("/api/alerts/sync")
def sync_alerts(payload: SyncPayload, db: Session = Depends(get_db),
                current_user: models.User = Depends(auth.get_current_user)):
    """Sync alerts generated in browser offline mode back to SQLite."""
    synced = 0
    for s in payload.alerts:
        if not db.query(models.Alert).filter(models.Alert.id == s.id).first():
            db.add(models.Alert(
                id=s.id, machine=s.machine, machine_id=s.machine_id,
                type=s.type, priority=s.priority, summary=s.summary,
                ai_explanation=s.aiExplanation, recommended_action=s.recommendedAction,
                status=s.status, assigned_to=s.assignedTo, affected=s.affected
            ))
            synced += 1
    if synced > 0:
        db.commit()
        _write_audit(db, current_user.email, "OFFLINE_SYNC", "alerts", f"Synced {synced} offline alerts")
    return {"status": "success", "message": f"Synchronized {synced} offline alerts."}

@app.get("/api/devices")
def get_devices(current_user: models.User = Depends(auth.get_current_user)):
    return cyber_devices

@app.post("/api/devices/quarantine")
def quarantine_device(payload: DeviceQuarantinePayload, db: Session = Depends(get_db),
                      current_user: models.User = Depends(auth.get_current_user)):
    global cyber_devices
    for d in cyber_devices:
        if d["id"] == payload.id:
            is_quarantined = d["riskLevel"] == 'Critical'
            d["riskLevel"]  = 'Low'       if is_quarantined else 'Critical'
            d["trustScore"] = 99          if is_quarantined else 30
            d["status"]     = 'Online'    if is_quarantined else 'Quarantined'
    _save_cyber_devices(db, cyber_devices)
    _write_audit(db, current_user.email, "QUARANTINE", payload.id, f"Device {payload.id} quarantine toggled")
    return {"status": "success", "devices": cyber_devices}

@app.get("/api/settings")
def get_settings(current_user: models.User = Depends(auth.get_current_user)):
    return app_settings

@app.post("/api/settings")
def save_settings(payload: SettingsPayload, db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    global app_settings
    app_settings = {
        "healthWarnThreshold": payload.healthWarnThreshold,
        "healthCritThreshold": payload.healthCritThreshold,
        "predictSensitivity":  payload.predictSensitivity,
        "aiEnabled":           payload.aiEnabled
    }
    _save_settings(db, app_settings)
    _write_audit(db, current_user.email, "SETTINGS_CHANGE", "settings",
                 f"warn={payload.healthWarnThreshold} crit={payload.healthCritThreshold}")
    return {"status": "success", "settings": app_settings}

@app.post("/api/reports")
def generate_report(payload: ReportPayload, db: Session = Depends(get_db),
                    current_user: models.User = Depends(auth.get_current_user)):
    db.add(models.Report(title=payload.title, format=payload.format, department=payload.department))
    db.commit()
    _write_audit(db, current_user.email, "REPORT_GEN", "reports",
                 f"Generated {payload.format} report: {payload.title}")
    return {"status": "success", "message": f"Generated {payload.format} report for {payload.department}."}

@app.get("/api/audit-logs")
def get_audit_logs(db: Session = Depends(get_db),
                   current_user: models.User = Depends(auth.check_admin_privilege)):
    """Returns full operator audit trail — admin only."""
    logs = db.query(models.AuditLog).order_by(models.AuditLog.id.desc()).limit(200).all()
    return [
        {
            "id": l.id, "timestamp": str(l.timestamp), "operator": l.operator_email,
            "action": l.action_type, "target": l.target_id, "detail": l.detail
        }
        for l in logs
    ]

# ─── WebSocket Endpoint ───────────────────────────────────────────────────────
@app.websocket("/ws/live-data")
@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    db = SessionLocal()
    try:
        machines = db.query(models.Machine).all()
        machines_data = [
            {
                "id": m.id, "name": m.name, "type": m.type, "location": m.location, "dept": m.dept,
                "temp": m.temp, "vibration": m.vibration, "voltage": m.voltage,
                "pressure": m.pressure, "current": m.current, "rpm": m.rpm, "energy": m.energy,
                "health": m.health, "status": m.status, "failureProbability": m.failure_prob,
                "rul": m.rul, "aiConfidence": 95.0,
                "suggestedAction": "No Action Required" if m.status == 'Healthy' else "Inspect components.",
                "explanation": "Nominal startup values.", "anomalyCount": 0
            }
            for m in machines
        ]
    finally:
        db.close()
    try:
        await websocket.send_text(json.dumps({
            "timestamp":    time.time(),
            "machines":     machines_data,
            "cyberDevices": cyber_devices,
            "alerts":       [],
            "edgeStatus": {
                "mode":       TELEMETRY_MODE,
                "version":    EDGE_AI_VERSION,
                "uptime":     int(time.time() - server_start_time),
                "wsClients":  len(manager.active_connections),
                "dbStatus":   "connected",
                "aiEngine":   "active",
                "cloudDeps":  False
            }
        }))
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
