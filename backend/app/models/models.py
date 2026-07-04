from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.sql import func
from app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    dept = Column(String, nullable=True)
    name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Machine(Base):
    __tablename__ = "machines"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    location = Column(String, nullable=False)
    dept = Column(String, nullable=False)
    status = Column(String, default="Healthy")
    health = Column(Integer, default=100)
    temp = Column(Float, default=40.0)
    vibration = Column(Float, default=0.5)
    voltage = Column(Float, default=415.0)
    pressure = Column(Float, default=0.0)
    current = Column(Float, default=10.0)
    rpm = Column(Integer, default=1500)
    energy = Column(Float, default=15.0)
    failure_prob = Column(Float, default=2.0)
    rul = Column(Integer, default=240)

class SensorLog(Base):
    __tablename__ = "sensor_logs"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(String, ForeignKey("machines.id"), nullable=False)
    temp = Column(Float)
    vibration = Column(Float)
    current = Column(Float)
    rpm = Column(Integer)
    pressure = Column(Float)
    energy = Column(Float, default=0.0)
    voltage = Column(Float, default=415.0)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    machine = Column(String, nullable=False)
    machine_id = Column(String, nullable=False)
    type = Column(String, nullable=False)
    priority = Column(String, default="Warning")
    summary = Column(String, nullable=False)
    status = Column(String, default="Open")
    timestamp = Column(String, nullable=True)
    ai_explanation = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    assigned_to = Column(String, default="Unassigned")
    affected = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    format = Column(String, nullable=False)
    department = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

# ─── Edge AI Persistence Tables ───────────────────────────────────────────────

class Settings(Base):
    """Persists AI configuration thresholds to SQLite — survives server restarts."""
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(String, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class CyberDevice(Base):
    """Persists OT/ICS device state to SQLite — survives server restarts."""
    __tablename__ = "cyber_devices"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    ip = Column(String, nullable=True)
    type = Column(String, nullable=True)
    mac = Column(String, nullable=True)
    firmware = Column(String, nullable=True)
    machine = Column(String, nullable=True)
    risk_level = Column(String, default="Low")
    trust_score = Column(Integer, default=100)
    packets_sec = Column(Integer, default=0)
    error_rate = Column(Float, default=0.0)
    status = Column(String, default="Online")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class AuditLog(Base):
    """Records every operator action for compliance and forensic audit trails."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    operator_email = Column(String, nullable=True)
    action_type = Column(String, nullable=False)
    target_id = Column(String, nullable=True)
    detail = Column(Text, nullable=True)
