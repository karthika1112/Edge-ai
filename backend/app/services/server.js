/**
 * EdgeShield AI — Node.js Edge Server v2.1.0
 *
 * Fully offline, local-first industrial AI platform.
 * No cloud API required. All processing happens on the edge device.
 *
 * Architecture:
 *   - JSON flat-file database (edgeshield.json) — fully local, no SQL server needed
 *   - WebSocket broadcast — local network only
 *   - AI Engine — rule-based + statistical, runs on-device
 *   - Security Monitor — local OT/ICS threat detection
 *   - Telemetry Driver — simulation | (future) mqtt | opcua | modbus
 */

import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { TelemetryDriver } from './telemetryDriver.js';
import { analyzeTelemetry } from './aiEngine.js';
import { SecurityMonitor } from './securityMonitor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Configuration ─────────────────────────────────────────────────────────────
// Load .env if present, otherwise fall back to secure defaults
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && !key.startsWith('#') && vals.length > 0) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  });
}

const SECRET_KEY       = process.env.JWT_SECRET       || 'edgeshield-edge-ai-secure-key-2024';
const TELEMETRY_MODE   = process.env.TELEMETRY_MODE   || 'simulation';
const TELEMETRY_MS     = parseInt(process.env.TELEMETRY_INTERVAL_MS || '1000');
const EDGE_VERSION     = process.env.EDGE_AI_VERSION  || '2.1.0';
const PORT             = parseInt(process.env.PORT    || '8000');
const serverStartTime  = Date.now();

// ─── Database ──────────────────────────────────────────────────────────────────
const DB_FILE = path.join(__dirname, 'edgeshield.json');

const initialData = {
  users: [
    {
      email: 'operator@edgeshield.ai',
      password: bcrypt.hashSync('password123', 10),
      role: 'Administrator',
      name: 'Aishwarya R',
      dept: 'Security'
    }
  ],
  machines: [
    { id: 'MC-101', name: 'CNC Milling Machine M1',    type: 'CNC Milling', location: 'Zone 1', dept: 'Production',  status: 'Healthy', health: 96, temp: 42.5, vibration: 0.4,  voltage: 415, pressure: 0.0,   current: 12.4, rpm: 1800, energy: 12.5, failure_prob: 2.1,  rul: 240 },
    { id: 'MC-104', name: 'Rotary Compressor RC-2',     type: 'Compressor',  location: 'Zone 1', dept: 'Maintenance', status: 'Healthy', health: 94, temp: 48.2, vibration: 0.5,  voltage: 415, pressure: 6.2,   current: 15.8, rpm: 1450, energy: 14.1, failure_prob: 3.4,  rul: 220 },
    { id: 'MC-105', name: 'Conveyor Drive System C5',   type: 'Conveyor',    location: 'Zone 3', dept: 'Logistics',   status: 'Healthy', health: 91, temp: 39.8, vibration: 0.8,  voltage: 415, pressure: 0.0,   current: 8.5,  rpm: 120,  energy: 6.8,  failure_prob: 4.8,  rul: 180 },
    { id: 'MC-106', name: 'Hydraulic Press HP-3',       type: 'Press',       location: 'Zone 4', dept: 'Stamping',    status: 'Healthy', health: 82, temp: 48.6, vibration: 1.1,  voltage: 415, pressure: 185.0, current: 24.1, rpm: 0,    energy: 18.2, failure_prob: 15.0, rul: 120 },
    { id: 'MC-107', name: 'CNC-07 Milling Machine',     type: 'CNC Milling', location: 'Zone 2', dept: 'Production',  status: 'Healthy', health: 95, temp: 44.2, vibration: 0.35, voltage: 415, pressure: 0.0,   current: 11.2, rpm: 1600, energy: 10.5, failure_prob: 1.8,  rul: 260 },
    { id: 'MC-108', name: 'Spindle Motor SM-09',        type: 'Spindle',     location: 'Zone 2', dept: 'Machining',   status: 'Healthy', health: 87, temp: 52.1, vibration: 1.4,  voltage: 415, pressure: 0.0,   current: 18.5, rpm: 3000, energy: 15.4, failure_prob: 12.0, rul: 160 }
  ],
  alerts:       [],
  auditLogs:    [],
  reports:      [],
  settings:     { healthWarnThreshold: 80, healthCritThreshold: 50, predictSensitivity: 85, aiEnabled: true },
  cyberDevices: [
    { id: 'DEV-PLC01', name: 'Ventilation PLC Controller',  ip: '10.227.100.10',  type: 'PLC',     status: 'Online',  trustScore: 98, riskLevel: 'Low',      machine: 'CNC Milling Machine M1',  mac: '00:1A:2B:3C:4D:5E', firmware: 'v1.4.2-b',    packetsSec: 42,  errorRate: 0.0  },
    { id: 'DEV-GW04',  name: 'Zone 4 Security Gateway',      ip: '10.227.100.1',   type: 'Gateway', status: 'Online',  trustScore: 99, riskLevel: 'Low',      machine: 'N/A',                     mac: '00:1A:2B:9F:8E:7D', firmware: 'v3.1.0-sec',  packetsSec: 154, errorRate: 0.01 },
    { id: 'DEV-PLC04', name: 'Compressor Controller PLC',    ip: '10.227.100.14',  type: 'PLC',     status: 'Warning', trustScore: 52, riskLevel: 'Critical', machine: 'Rotary Compressor RC-2',  mac: '00:1A:2B:4E:5D:6C', firmware: 'v1.2.9-legacy', packetsSec: 230, errorRate: 8.5 },
    { id: 'DEV-MTR09', name: 'Spindle Controller Module',    ip: '10.227.102.25',  type: 'Motor',   status: 'Warning', trustScore: 78, riskLevel: 'Warning',  machine: 'Spindle Motor SM-09',     mac: '00:1A:2B:1A:2B:3C', firmware: 'v1.5.0-b',    packetsSec: 65,  errorRate: 2.1  }
  ]
};

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

const getDB   = ()     => JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
const saveDB  = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// ─── Database migration / upgrade ─────────────────────────────────────────────
const dbCheck  = getDB();
let dbUpgraded = false;

if (!dbCheck.machines.some(m => m.id === 'MC-107')) {
  dbCheck.machines.push(initialData.machines[4]);
  dbUpgraded = true;
}
if (!dbCheck.machines.some(m => m.id === 'MC-108')) {
  dbCheck.machines.push(initialData.machines[5]);
  dbUpgraded = true;
}
if (!dbCheck.settings) {
  dbCheck.settings = initialData.settings;
  dbUpgraded = true;
}
if (!dbCheck.cyberDevices || dbCheck.cyberDevices.length === 0) {
  dbCheck.cyberDevices = initialData.cyberDevices;
  dbUpgraded = true;
}
if (!dbCheck.auditLogs) {
  dbCheck.auditLogs = [];
  dbUpgraded = true;
}
// Ensure machines have energy and voltage fields (upgrade existing records)
dbCheck.machines = dbCheck.machines.map(m => ({
  energy: 15.0, voltage: 415, ...m
}));
if (dbUpgraded) saveDB(dbCheck);

// ─── Audit log helper ──────────────────────────────────────────────────────────
const writeAudit = (db, operator, action, target, detail) => {
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.push({
    id:        db.auditLogs.length + 1,
    timestamp: new Date().toISOString(),
    operator:  operator || 'system',
    action,
    target:    target || '',
    detail:    detail || ''
  });
};

// ─── Telemetry history cache (keeps last 10 readings per machine) ──────────────
const telemetryHistory = {};  // { machineId: [reading, ...] (newest first, max 10) }
const pushHistory = (machineId, reading) => {
  if (!telemetryHistory[machineId]) telemetryHistory[machineId] = [];
  telemetryHistory[machineId].unshift(reading);
  if (telemetryHistory[machineId].length > 10) telemetryHistory[machineId].pop();
};

// ─── Express + WebSocket server ────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ noServer: true });

app.use(cors());
app.use(express.json());

// ─── Auth middlewares ──────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ detail: 'Access token missing.' });
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ detail: 'Invalid or expired access token.' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'Administrator')
    return res.status(403).json({ detail: 'Operation restricted to Administrator role.' });
  next();
};

// ─── REST Routes ───────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({
    status:      'running',
    application: 'EdgeShield AI',
    version:     EDGE_VERSION,
    mode:        TELEMETRY_MODE,
    cloud:       false,
    message:     'EdgeShield AI Edge Server is running. No cloud required.'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', database: 'connected', websocket: 'active' });
});

app.get('/health/edge', (req, res) => {
  res.json({
    edgeAI:          'active',
    telemetryMode:   TELEMETRY_MODE,
    version:         EDGE_VERSION,
    database:        'json_local',
    cloudRequired:   false,
    uptime:          Math.floor((Date.now() - serverStartTime) / 1000),
    wsClients:       wss.clients.size,
    aiFeatures: [
      'Health Scoring', 'Failure Probability', 'Remaining Useful Life',
      'Thermal Instability Detection', 'Vibration Anomaly Detection',
      'Electrical Overload Detection', 'Pressure Fluctuation Detection',
      'RPM Instability Detection', 'Energy Overconsumption Detection',
      'Cybersecurity Threat Detection'
    ],
    protocols:      ['simulation', 'mqtt', 'opcua', 'modbus'],
    activeProtocol: TELEMETRY_MODE
  });
});

// Auth
app.post('/api/signup', (req, res) => {
  const { name, email, password, dept } = req.body;
  if (!email || !password)
    return res.status(400).json({ detail: 'Email and password are required.' });
  const db = getDB();
  if (db.users.some(u => u.email === email))
    return res.status(400).json({ detail: 'Operator email is already registered.' });
  db.users.push({
    email, password: bcrypt.hashSync(password, 10),
    role: dept,
    name: name || email.split('@')[0].toUpperCase(),
    dept: dept
  });
  writeAudit(db, email, 'SIGNUP', email, `New operator registered: ${name}`);
  saveDB(db);
  res.json({ status: 'success', message: 'Operator profile registered successfully.' });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const db   = getDB();
  const user = db.users.find(u => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    writeAudit(db, email, 'LOGIN_FAIL', email, 'Invalid credentials');
    saveDB(db);
    return res.status(401).json({ detail: 'Invalid email or password credentials.' });
  }
  const payload      = { email: user.email, role: user.role, name: user.name, dept: user.dept };
  const accessToken  = jwt.sign(payload, SECRET_KEY, { expiresIn: '30m' });
  const refreshToken = jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' });
  writeAudit(db, email, 'LOGIN', email, 'Operator logged in successfully');
  saveDB(db);
  res.json({ access_token: accessToken, refresh_token: refreshToken, token_type: 'bearer', user });
});

// Me Profile
app.get('/api/me', authenticateToken, (req, res) => {
  res.json({
    email: req.user.email,
    role: req.user.role,
    name: req.user.name || req.user.email.split('@')[0].toUpperCase(),
    dept: req.user.dept
  });
});

// Machines
app.get('/api/machines', authenticateToken, (req, res) => res.json(getDB().machines));

app.post('/api/machines', authenticateToken, requireAdmin, (req, res) => {
  const { id, name, type, location, dept } = req.body;
  const db = getDB();
  if (db.machines.some(m => m.id === id))
    return res.status(400).json({ detail: 'Machine ID already exists.' });
  db.machines.push({ id, name, type, location, dept, status: 'Healthy', health: 100,
    temp: 40.0, vibration: 0.5, voltage: 415, pressure: 0.0, current: 10.0,
    rpm: 1500, energy: 15.0, failure_prob: 2.0, rul: 240 });
  writeAudit(db, req.user?.email, 'MACHINE_ADD', id, `Added machine: ${name}`);
  saveDB(db);
  res.json({ status: 'success', message: `Registered machine ${name}` });
});

// External telemetry push (for MQTT/OPC-UA/Modbus bridge adapters)
app.post('/api/machines/:id/telemetry', authenticateToken, (req, res) => {
  const db = getDB();
  const m  = db.machines.find(m => m.id === req.params.id);
  if (!m) return res.status(404).json({ detail: 'Machine not found.' });
  Object.assign(m, req.body);
  saveDB(db);
  res.json({ status: 'success', message: `Telemetry ingested for ${req.params.id}` });
});

// Alerts
app.get('/api/alerts', authenticateToken, (req, res) => res.json(getDB().alerts.slice().reverse()));

app.post('/api/alerts/:id/acknowledge', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.alerts = db.alerts.map(a => a.id === id ? { ...a, status: 'Acknowledged' } : a);
  writeAudit(db, req.user?.email, 'ACKNOWLEDGE', id, `Alert ${id} acknowledged`);
  saveDB(db);
  res.json({ status: 'success', message: `Alert ${id} acknowledged.` });
});

app.post('/api/alerts/:id/resolve', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.alerts = db.alerts.map(a => a.id === id ? { ...a, status: 'Resolved' } : a);
  writeAudit(db, req.user?.email, 'RESOLVE', id, `Alert ${id} resolved`);
  saveDB(db);
  res.json({ status: 'success', message: `Alert ${id} resolved.` });
});

app.post('/api/alerts/:id/assign', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { assignedTo } = req.body;
  const db = getDB();
  db.alerts = db.alerts.map(a => a.id === id ? { ...a, assignedTo } : a);
  writeAudit(db, req.user?.email, 'ASSIGN', id, `Alert assigned to ${assignedTo}`);
  saveDB(db);
  res.json({ status: 'success', message: `Alert ${id} assigned to ${assignedTo}.` });
});

app.post('/api/alerts/sync', authenticateToken, (req, res) => {
  const { alerts } = req.body;
  if (!Array.isArray(alerts))
    return res.status(400).json({ detail: 'Invalid alerts sync payload.' });
  const db = getDB();
  let synced = 0;
  alerts.forEach(a => {
    if (!db.alerts.some(existing => existing.id === a.id)) {
      db.alerts.push(a);
      synced++;
    }
  });
  if (synced > 0) {
    writeAudit(db, req.user?.email, 'OFFLINE_SYNC', 'alerts', `Synced ${synced} offline alerts`);
    saveDB(db);
  }
  res.json({ status: 'success', message: `Synchronized ${synced} offline alerts.` });
});

// Reports
app.post('/api/reports', authenticateToken, (req, res) => {
  const { title, format, department } = req.body;
  const db = getDB();
  db.reports.push({ id: db.reports.length + 1, title, format, department, timestamp: new Date().toISOString() });
  writeAudit(db, req.user?.email, 'REPORT_GEN', 'reports', `Generated ${format} report: ${title}`);
  saveDB(db);
  res.json({ status: 'success', message: `Generated ${format} report for ${department}.` });
});

// Cyber Devices
app.get('/api/devices', authenticateToken, (req, res) => res.json(getDB().cyberDevices || []));

app.post('/api/devices/quarantine', authenticateToken, (req, res) => {
  const { id } = req.body;
  const db = getDB();
  db.cyberDevices = (db.cyberDevices || []).map(d => {
    if (d.id !== id) return d;
    const isQuarantined = d.riskLevel === 'Critical';
    return { ...d, riskLevel: isQuarantined ? 'Low' : 'Critical',
      trustScore: isQuarantined ? 99 : 30, status: isQuarantined ? 'Online' : 'Quarantined' };
  });
  writeAudit(db, req.user?.email, 'QUARANTINE', id, `Device ${id} quarantine toggled`);
  saveDB(db);
  res.json({ status: 'success', devices: db.cyberDevices });
});

// Settings
app.get('/api/settings', authenticateToken, (req, res) => {
  res.json(getDB().settings || { healthWarnThreshold: 80, healthCritThreshold: 50, predictSensitivity: 85, aiEnabled: true });
});

app.post('/api/settings', authenticateToken, (req, res) => {
  const { healthWarnThreshold, healthCritThreshold, predictSensitivity, aiEnabled } = req.body;
  const db = getDB();
  db.settings = {
    healthWarnThreshold: parseInt(healthWarnThreshold) || 80,
    healthCritThreshold: parseInt(healthCritThreshold) || 50,
    predictSensitivity:  parseInt(predictSensitivity)  || 85,
    aiEnabled:           aiEnabled !== undefined ? aiEnabled : true
  };
  writeAudit(db, req.user?.email, 'SETTINGS_CHANGE', 'settings',
    `warn=${db.settings.healthWarnThreshold} crit=${db.settings.healthCritThreshold}`);
  saveDB(db);
  res.json({ status: 'success', settings: db.settings });
});

// Audit logs (admin only)
app.get('/api/audit-logs', authenticateToken, requireAdmin, (req, res) => {
  const db = getDB();
  res.json((db.auditLogs || []).slice().reverse().slice(0, 200));
});

// ─── Telemetry simulation loop ─────────────────────────────────────────────────
const telemetryDriver = new TelemetryDriver(TELEMETRY_MODE);
const securityMonitor = new SecurityMonitor();
let demoTime = 0;

setInterval(async () => {
  demoTime++;
  const db            = getDB();
  const alertsTriggered = [];

  try {
    // 1. Fetch raw telemetry tick (simulation or real hardware)
    const rawMachines = await telemetryDriver.fetchTelemetryTick(db.machines, demoTime);

    // 2. Run local Edge AI engine per machine (with real history now)
    db.machines = rawMachines.map(m => {
      const cfg = db.settings || {};

      // Push to in-memory history cache
      pushHistory(m.id, { temp: m.temp, vibration: m.vibration, current: m.current, rpm: m.rpm });

      const aiResults = analyzeTelemetry(m, telemetryHistory[m.id] || [], {
        warning:  cfg.healthWarnThreshold || 80,
        critical: cfg.healthCritThreshold || 50
      });

      const previousStatus = m.status;

      // Auto-generate alert on Healthy → Warning/Critical
      if (aiResults.status !== 'Healthy' && previousStatus === 'Healthy') {
        const altId   = `ALT-MAINT-${Math.floor(Math.random() * 599) + 400}`;
        const priority = aiResults.status === 'Critical' ? 'Critical' : 'Warning';
        const newAlert = {
          id:                altId,
          machine:           m.name,
          machine_id:        m.id,
          type:              'Predictive Maintenance',
          priority,
          summary:           `Anomaly detected on ${m.name}: ${aiResults.explanation}`,
          aiExplanation:     aiResults.explanation,
          recommendedAction: aiResults.suggestedAction,
          timestamp:         new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          status:            'Open',
          assignedTo:        'Unassigned',
          affected:          'Main Operating Core'
        };
        db.alerts.push(newAlert);
        alertsTriggered.push(newAlert);
      }

      return {
        ...m,
        health:           aiResults.health,
        status:           aiResults.status,
        failureProbability: aiResults.failureProbability,
        failure_prob:     aiResults.failureProbability,
        rul:              aiResults.rul,
        aiConfidence:     aiResults.aiConfidence,
        suggestedAction:  aiResults.suggestedAction,
        explanation:      aiResults.explanation,
        anomalyCount:     (aiResults.anomalies || []).length
      };
    });

    // 3. Local cybersecurity monitor
    const secResult = securityMonitor.evaluateSecurity(db.cyberDevices || [], demoTime);
    db.cyberDevices = secResult.updatedDevices;
    secResult.alertsTriggered.forEach(a => {
      db.alerts.push(a);
      alertsTriggered.push(a);
    });

    saveDB(db);

    // 4. Broadcast live payload with edgeStatus metadata
    const payload = {
      timestamp:    Math.floor(Date.now() / 1000),
      machines:     db.machines,
      cyberDevices: db.cyberDevices,
      alerts:       alertsTriggered,
      edgeStatus: {
        mode:       TELEMETRY_MODE,
        version:    EDGE_VERSION,
        uptime:     Math.floor((Date.now() - serverStartTime) / 1000),
        wsClients:  wss.clients.size,
        dbStatus:   'connected',
        aiEngine:   'active',
        cloudDeps:  false
      }
    };

    wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(JSON.stringify(payload));
    });

  } catch (err) {
    console.error('[EdgeShield AI] Telemetry loop error:', err);
  }
}, TELEMETRY_MS);

// ─── WebSocket handshake ────────────────────────────────────────────────────────
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  if (pathname === '/ws/live-data' || pathname === '/ws/live') {
    wss.handleUpgrade(request, socket, head, ws => wss.emit('connection', ws, request));
  } else {
    socket.destroy();
  }
});

wss.on('connection', ws => {
  const db = getDB();
  ws.send(JSON.stringify({
    timestamp:    Math.floor(Date.now() / 1000),
    machines:     db.machines,
    cyberDevices: db.cyberDevices || [],
    alerts:       [],
    edgeStatus: {
      mode:      TELEMETRY_MODE,
      version:   EDGE_VERSION,
      uptime:    Math.floor((Date.now() - serverStartTime) / 1000),
      wsClients: wss.clients.size,
      dbStatus:  'connected',
      aiEngine:  'active',
      cloudDeps: false
    }
  }));
});

// ─── Start server ──────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n╔═══════════════════════════════════════════════════╗`);
  console.log(`║  EdgeShield AI Edge Server v${EDGE_VERSION}              ║`);
  console.log(`║  http://127.0.0.1:${PORT}                           ║`);
  console.log(`║  Mode: ${TELEMETRY_MODE.padEnd(10)} | Cloud: NONE (Air-gapped) ║`);
  console.log(`║  Database: Local JSON | AI Engine: Active         ║`);
  console.log(`╚═══════════════════════════════════════════════════╝\n`);
});
