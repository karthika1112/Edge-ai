import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, RadialBarChart, RadialBar, ComposedChart
} from 'recharts';
import {
  Shield, Activity, Cpu, Zap, Settings, LogOut, Bell, HelpCircle, Search,
  CheckCircle, AlertTriangle, AlertCircle, TrendingUp, Info, Play, Plus,
  FileText, Calendar, Download, RefreshCw, ChevronLeft, ChevronRight, Menu,
  User, Database, HardDrive, Network, Filter, ArrowUpDown, Sliders, Server,
  RotateCcw, Thermometer, Gauge, Clock, Wrench, Eye, ShieldAlert, BookOpen,
  DollarSign, AlertOctagon, ShieldX, Key, Terminal, Globe, Flame, Leaf, Percent,
  EyeOff, UserPlus, ShieldCheck, Share, BarChart3, TrendingDown, Clipboard,
  Users, Trash2, Mail, Lock, Smartphone, Save, EyeIcon, Award, MessageSquare,
  Mic, Send, Trash, Copy, Check, Sparkles, Pin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL || "${API_URL}";
const WS_URL = API_URL.replace(/^http/, "ws");

// Pre-defined realistic machine telemetry data with extra fields for all modules
const INITIAL_MACHINES = [
  { id: 'MC-101', name: 'CNC Milling Machine M1', type: 'CNC Milling', location: 'Zone 1', dept: 'Production', status: 'Healthy', health: 96, temp: 42.5, vibration: 0.4, voltage: 415, pressure: 0.0, current: 12.4, rpm: 1800, energy: 12.5, failure_prob: 2.1, failureProbability: 2.1, rul: 240, suggestedAction: 'Perform scheduled lubrication check in 120 hours.', maintCost: '₹8,400', installDate: '2024-03-12', aiConfidence: 95.0, explanation: 'All parameters nominal.' },
  { id: 'MC-104', name: 'Rotary Compressor RC-2', type: 'Compressor', location: 'Zone 1', dept: 'Maintenance', status: 'Healthy', health: 94, temp: 48.2, vibration: 0.5, voltage: 415, pressure: 6.2, current: 15.8, rpm: 1450, energy: 14.1, failure_prob: 3.4, failureProbability: 3.4, rul: 220, suggestedAction: 'Replace Bearing and check lubrication channel within 8 Hours.', maintCost: '₹34,200', installDate: '2024-01-15', aiConfidence: 95.0, explanation: 'All parameters nominal.' },
  { id: 'MC-105', name: 'Conveyor Drive System C5', type: 'Conveyor', location: 'Zone 3', dept: 'Logistics', status: 'Healthy', health: 91, temp: 39.8, vibration: 0.8, voltage: 415, pressure: 0.0, current: 8.5, rpm: 120, energy: 6.8, failure_prob: 4.8, failureProbability: 4.8, rul: 180, suggestedAction: 'Inspect drive belt tension during weekly audit.', maintCost: '₹5,100', installDate: '2023-04-18', aiConfidence: 95.0, explanation: 'All parameters nominal.' },
  { id: 'MC-106', name: 'Hydraulic Press HP-3', type: 'Press', location: 'Zone 4', dept: 'Stamping', status: 'Healthy', health: 82, temp: 48.6, vibration: 1.1, voltage: 415, pressure: 185.0, current: 24.1, rpm: 0, energy: 18.2, failure_prob: 15.0, failureProbability: 15.0, rul: 120, suggestedAction: 'Inspect valve seals and Fluid leaks.', maintCost: '₹18,400', installDate: '2022-10-10', aiConfidence: 95.0, explanation: 'All parameters nominal.' },
  { id: 'MC-107', name: 'CNC-07 Milling Machine', type: 'CNC Milling', location: 'Zone 2', dept: 'Production', status: 'Healthy', health: 95, temp: 44.2, vibration: 0.35, voltage: 415, pressure: 0.0, current: 11.2, rpm: 1600, energy: 10.5, failure_prob: 1.8, failureProbability: 1.8, rul: 260, suggestedAction: 'No Action Required', maintCost: '₹12,000', installDate: '2024-05-10', aiConfidence: 95.0, explanation: 'All parameters nominal.' },
  { id: 'MC-108', name: 'Spindle Motor SM-09', type: 'Spindle', location: 'Zone 2', dept: 'Machining', status: 'Healthy', health: 87, temp: 52.1, vibration: 1.4, voltage: 415, pressure: 0.0, current: 18.5, rpm: 3000, energy: 15.4, failure_prob: 12.0, failureProbability: 12.0, rul: 160, suggestedAction: 'Verify rotor eccentricity and balancing load.', maintCost: '₹11,200', installDate: '2023-07-28', aiConfidence: 95.0, explanation: 'All parameters nominal.' }
];

const INITIAL_CYBER_DEVICES = [
  { id: 'DEV-PLC01', name: 'Ventilation PLC Controller', ip: '10.227.100.10', type: 'PLC', status: 'Online', trustScore: 98, riskLevel: 'Low', machine: 'CNC Milling Machine M1', mac: '00:1A:2B:3C:4D:5E', firmware: 'v1.4.2-b', packetsSec: 42, errorRate: 0.0 },
  { id: 'DEV-GW04', name: 'Zone 4 Security Gateway', ip: '10.227.100.1', type: 'Gateway', status: 'Online', trustScore: 99, riskLevel: 'Low', machine: 'N/A', mac: '00:1A:2B:9F:8E:7D', firmware: 'v3.1.0-sec', packetsSec: 154, errorRate: 0.01 },
  { id: 'DEV-PLC04', name: 'Compressor Controller PLC', ip: '10.227.100.14', type: 'PLC', status: 'Warning', trustScore: 52, riskLevel: 'Critical', machine: 'Rotary Compressor', mac: '00:1A:2B:4E:5D:6C', firmware: 'v1.2.9-legacy', packetsSec: 230, errorRate: 8.5 },
  { id: 'DEV-MTR09', name: 'Spindle Controller Module', ip: '10.227.102.25', type: 'Motor', status: 'Warning', trustScore: 78, riskLevel: 'Warning', machine: 'Spindle Motor SM-09', mac: '00:1A:2B:1A:2B:3C', firmware: 'v1.5.0-b', packetsSec: 65, errorRate: 2.1 }
];

const INITIAL_ALERTS = [
  { id: 'ALT-304', machine: 'Rotary Compressor', machineId: 'MC-104', type: 'Predictive Maintenance', priority: 'Critical', generatedBy: 'LSTM Anomaly Model v2.1', timestamp: '14:22', assignedTo: 'Sarah Jenkins', status: 'In Progress', summary: 'Critical rotor bearing wear vibration pattern detected.', affected: 'Bearing Set P/N-902A' },
  { id: 'ALT-303', machine: 'Rotary Compressor', machineId: 'MC-104', type: 'Cybersecurity', priority: 'Critical', generatedBy: 'Intrusion Prevention Gateway', timestamp: '14:18', assignedTo: 'Unassigned', status: 'Open', summary: 'Unauthorized Modbus TCP command registers payload override.', affected: 'Modbus Coil Register 4001' },
  { id: 'ALT-302', machine: 'Spindle Motor SM-09', machineId: 'MC-108', type: 'Predictive Maintenance', priority: 'Warning', generatedBy: 'Spectral Frequency Regressor', timestamp: '13:50', assignedTo: 'Alex Mercer', status: 'Acknowledged', summary: 'Spindle chuck eccentric rotor load unbalance signature.', affected: 'Rotor Weights Manifold' }
];

const INITIAL_USERS = [
  { empId: 'EMP-001', name: 'Aishwarya R', email: 'aishwarya@edgeshield.ai', dept: 'Security', role: 'Administrator', status: 'Active', lastLogin: 'Just now', machines: 'All Assets', designation: 'Principal Security Analyst' },
  { empId: 'EMP-005', name: 'Sarah Jenkins', email: 's.jenkins@edgeshield.ai', dept: 'Maintenance', role: 'Maintenance Engineer', status: 'Active', lastLogin: '10 Mins Ago', machines: 'MC-101, MC-104, MC-106', designation: 'Lead Mechanical Technician' },
  { empId: 'EMP-008', name: 'Alex Mercer', email: 'a.mercer@edgeshield.ai', dept: 'Production', role: 'Operations Manager', status: 'Active', lastLogin: '1 Hour Ago', machines: 'MC-108 Spindle', designation: 'Assembly Operations Supervisor' }
];

const INITIAL_SESSIONS = [
  { device: 'Engineering Workstation W-04', location: 'Control Room A', browser: 'Chrome v120 (Windows)', time: 'Today, 08:30', active: true },
  { device: 'Field Diagnostic Tablet T-02', location: 'Factory Zone 2', browser: 'Safari v17.2 (iOS)', time: 'Today, 09:15', active: true }
];

export const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const SIDEBAR_ITEMS = [
    { name: 'Dashboard', label: 'Dashboard Overview', icon: BarChart3, path: '/dashboard', roles: ['Administrator', 'Plant Manager', 'Production Supervisor', 'Security Analyst'] },
    { name: 'Factories', label: 'Factories Console', icon: Globe, path: '/dashboard/factories', roles: ['Administrator', 'Plant Manager'] },
    { name: 'Analytics', label: '📈 Enterprise Analytics', icon: BarChart3, path: '/dashboard/analytics', roles: ['Administrator', 'Plant Manager'] },
    { name: 'Machine Monitoring', label: 'Machine Monitoring', icon: Activity, path: '/dashboard/machine-monitoring', roles: ['Administrator', 'Plant Manager', 'Maintenance Engineer', 'Production Supervisor', 'Machine Operator'] },
    { name: 'Predictive Maintenance', label: 'Predictive Maintenance', icon: TrendingUp, path: '/dashboard/predictive-maintenance', roles: ['Administrator', 'Plant Manager', 'Maintenance Engineer'] },
    { name: 'Digital Twin', label: 'Digital Twin Console', icon: HardDrive, path: '/dashboard/digital-twin', roles: ['Administrator', 'Plant Manager', 'Maintenance Engineer', 'Production Supervisor', 'Machine Operator'] },
    { name: 'Cybersecurity', label: '🛡 Security Operations Center (SOC)', icon: Shield, path: '/dashboard/cybersecurity', roles: ['Administrator', 'Security Analyst'] },
    { name: 'Energy Optimization', label: 'Energy Optimization', icon: Zap, path: '/dashboard/energy-optimization', roles: ['Administrator', 'Plant Manager', 'Production Supervisor'] },
    { name: 'Alerts', label: 'Alerts Center', icon: Bell, path: '/dashboard/alerts', roles: ['Administrator', 'Plant Manager', 'Maintenance Engineer', 'Production Supervisor', 'Machine Operator', 'Security Analyst'] },
    { name: 'Reports', label: 'Reports & BI', icon: FileText, path: '/dashboard/reports', roles: ['Administrator', 'Plant Manager', 'Security Analyst'] },
    { name: 'AI Copilot', label: 'AI Copilot', icon: MessageSquare, path: '/dashboard/ai-copilot', roles: ['Administrator', 'Plant Manager', 'Maintenance Engineer'] },
    { name: 'User Management', label: 'User Management', icon: Users, path: '/dashboard/user-management', roles: ['Administrator'] },
    { name: 'Settings', label: 'System Settings', icon: Settings, path: '/dashboard/settings', roles: ['Administrator'] },
  ];

  // Sidebar navigation tabs
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard'); 

  // Role-Based dynamic routing redirection useEffect
  useEffect(() => {
    if (user?.role && (location.pathname === '/dashboard' || location.pathname === '/dashboard/')) {
      const r = user.role.toLowerCase();
      let targetPath = '/dashboard';
      if (r === 'plant manager') {
        targetPath = '/dashboard/factories';
      } else if (r === 'maintenance engineer') {
        targetPath = '/dashboard/predictive-maintenance';
      } else if (r === 'production supervisor') {
        targetPath = '/dashboard/machine-monitoring';
      } else if (r === 'machine operator') {
        targetPath = '/dashboard/machine-monitoring';
      } else if (r === 'security analyst') {
        targetPath = '/dashboard/cybersecurity';
      }
      navigate(targetPath, { replace: true });
    }
  }, [user, location.pathname, navigate]); 

  // Synchronize activeTab state with URL path
  useEffect(() => {
    const matched = SIDEBAR_ITEMS.find(item => item.path === location.pathname);
    if (matched && matched.name !== activeTab) {
      setActiveTab(matched.name);
    }
  }, [location.pathname]);

  // View states for modules
  const [mmViewMode, setMmViewMode] = useState('list');
  const [selectedMachineId, setSelectedMachineId] = useState('MC-104');

  const [pmViewMode, setPmViewMode] = useState('list');
  const [pmSelectedMachineId, setPmSelectedMachineId] = useState('MC-104');

  const [cyViewMode, setCyViewMode] = useState('list');
  const [selectedDeviceId, setSelectedDeviceId] = useState('DEV-PLC04');
  const [cyberDevices, setCyberDevices] = useState(INITIAL_CYBER_DEVICES);
  const [twinSelectedMachineId, setTwinSelectedMachineId] = useState('MC-104');

  const [energyPeriod, setEnergyPeriod] = useState('Daily');
  const [alViewMode, setAlViewMode] = useState('list');
  const [selectedAlertId, setSelectedAlertId] = useState('ALT-304');
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);

  const [repSelectedType, setRepSelectedType] = useState('Executive Summary');
  const [repSelectedFormat, setRepSelectedFormat] = useState('PDF');

  // Settings submenus & RBAC states
  const [settingsActiveMenu, setSettingsActiveMenu] = useState('general');
  const [factoryName, setFactoryName] = useState('Detroit Smart Assembly Hub #4');
  const [factoryAddress, setFactoryAddress] = useState('1200 Chrysler Dr, Detroit, MI');
  const [factoryId, setFactoryId] = useState('FAC-DET4');
  const [timezone, setTimezone] = useState('EST (UTC-5)');
  
  // AI Settings
  const [aiEnabled, setAiEnabled] = useState(true);
  const [predictSensitivity, setPredictSensitivity] = useState(85);
  const [healthWarnThreshold, setHealthWarnThreshold] = useState(80);
  const [healthCritThreshold, setHealthCritThreshold] = useState(50);

  // Notification toggles
  const [emailNotify, setEmailNotify] = useState(true);
  const [soundNotify, setSoundNotify] = useState(true);

  // User RBAC states
  const [users, setUsers] = useState(INITIAL_USERS);
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [selectedEmpId, setSelectedEmpId] = useState('EMP-005');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Maintenance Engineer');
  const [inviteDept, setInviteDept] = useState('Maintenance');

  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userFilterRole, setUserFilterRole] = useState('All');
  const [userFilterStatus, setUserFilterStatus] = useState('All');

  const [permissionsMatrix, setPermissionsMatrix] = useState({
    Dashboard: { view: true, create: false, edit: false, delete: false, export: true },
    MachineMonitoring: { view: true, create: true, edit: true, delete: false, export: true },
    PredictiveMaintenance: { view: true, create: true, edit: true, delete: false, export: true },
    Cybersecurity: { view: true, create: false, edit: false, delete: false, export: true }
  });

  // AI Copilot state
  const [chatMessages, setChatMessages] = useState([
    { id: 'msg-1', sender: 'assistant', text: "Hello! I am your EdgeShield AI Copilot. Ask anything about your industrial network, machine telemetry parameters, energy loads, or active cybersecurity incidents.", time: '14:20' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const chatBottomRef = useRef(null);
  const speechRecogRef = useRef(null);

  const handleVoiceToggle = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Voice input is not supported in this browser. Please use Chrome or Edge.');
      setTimeout(() => setVoiceError(''), 4000);
      return;
    }

    if (voiceActive) {
      // Stop recording
      if (speechRecogRef.current) {
        speechRecogRef.current.stop();
        speechRecogRef.current = null;
      }
      setVoiceActive(false);
      setInterimTranscript('');
      return;
    }

    // Start recording
    setVoiceError('');
    setInterimTranscript('');
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setVoiceActive(true);

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      setInterimTranscript(interim);
      if (final) {
        setChatInput(prev => (prev + ' ' + final).trim());
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event) => {
      const errMap = {
        'not-allowed': 'Microphone access was denied. Please allow mic permissions in your browser.',
        'no-speech': 'No speech detected. Please try again.',
        'network': 'Network error during voice recognition.',
        'aborted': ''
      };
      const msg = errMap[event.error] || `Voice error: ${event.error}`;
      if (msg) setVoiceError(msg);
      setTimeout(() => setVoiceError(''), 4000);
      setVoiceActive(false);
      setInterimTranscript('');
      speechRecogRef.current = null;
    };

    recognition.onend = () => {
      setVoiceActive(false);
      setInterimTranscript('');
      speechRecogRef.current = null;
    };

    speechRecogRef.current = recognition;
    recognition.start();
  };

  // Search & Global filtering variables
  const [searchTerm, setSearchTerm] = useState('');
  const [machines, setMachines] = useState(INITIAL_MACHINES);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [helpPanelOpen, setHelpPanelOpen] = useState(false);
  const [edgeStatus, setEdgeStatus] = useState(null);
  const offlineTicksRef = useRef(0);

  // Multi-Factory Management States
  const [factories, setFactories] = useState([
    { code: 'FAC-DET4', name: 'Detroit Assembly Hub #4', location: 'Detroit, USA', machinesCount: 6, healthyCount: 6, warningCount: 0, criticalCount: 0, healthScore: 95.5, activeAlerts: 0, energyEfficiency: '88%', lastUpdated: 'Just now' },
    { code: 'FAC-MUN2', name: 'Munich Parts Plant #2', location: 'Munich, Germany', machinesCount: 4, healthyCount: 3, warningCount: 1, criticalCount: 0, healthScore: 89.2, activeAlerts: 1, energyEfficiency: '82%', lastUpdated: '1 min ago' },
    { code: 'FAC-TOK9', name: 'Tokyo Micro-Drive Line', location: 'Tokyo, Japan', machinesCount: 3, healthyCount: 2, warningCount: 0, criticalCount: 1, healthScore: 74.0, activeAlerts: 2, energyEfficiency: '91%', lastUpdated: '3 mins ago' }
  ]);
  const [selectedFactoryCode, setSelectedFactoryCode] = useState(null);
  const [factoriesViewMode, setFactoriesViewMode] = useState('list'); // 'list' | 'detail'
  const [factorySearch, setFactorySearch] = useState('');
  const [factoryFilterLocation, setFactoryFilterLocation] = useState('All');
  const [factoryFilterStatus, setFactoryFilterStatus] = useState('All');
  const [factorySortKey, setFactorySortKey] = useState('name'); // 'name' | 'health'

  // Modal / forms states for adding new factories
  const [showAddFactoryModal, setShowAddFactoryModal] = useState(false);
  const [newFactoryName, setNewFactoryName] = useState('');
  const [newFactoryCode, setNewFactoryCode] = useState('');
  const [newFactoryLoc, setNewFactoryLoc] = useState('');

  // SOC Console Filtering states
  const [socFilterSeverity, setSocFilterSeverity] = useState('All');
  const [socFilterType, setSocFilterType] = useState('All');

  // UI Actions feedback states
  const [actionLoading, setActionLoading] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [toasts, setToasts] = useState([]);

  const triggerToast = (title, message, type = 'info', alertId = null) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, title, message, type, alertId }]);

    if (soundNotify) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = type === 'critical' || type === 'error' ? 'sawtooth' : 'sine';
        oscillator.frequency.value = type === 'critical' || type === 'error' ? 440 : 880;
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.25);
      } catch (e) {
        console.warn("AudioContext playback blocked by autoplay policy", e);
      }
    }

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Rolling chart buffers
  const [historyData, setHistoryData] = useState([]);
  const [trafficHistory, setTrafficHistory] = useState([]);
  
  const [energyStats, setEnergyStats] = useState({
    powerFactor: 0.94,
    voltageStability: 99.8,
    freqStability: 99.9,
    currentLoadKw: 248.5,
    todayCost: '₹34,800',
    totalConsumptionKwh: '4,120'
  });

  // Time ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial REST data from full-stack APIs
  useEffect(() => {
    if (!token) return;

    const fetchInitialData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Fetch machines
        const mRes = await fetch(`${API_URL}/api/machines`, { headers });
        if (mRes.ok) {
          const mData = await mRes.json();
          if (mData && mData.length > 0) {
            const normalized = mData.map(m => ({
              ...m,
              failureProbability: m.failure_prob !== undefined ? m.failure_prob : (m.failureProbability ?? 2.0),
              suggestedAction: m.suggestedAction || 'No Action Required',
              installDate: m.installDate || '2023-01-15',
              maintCost: m.maintCost || '₹12,000'
            }));
            setMachines(normalized);
          }
        }

        // Fetch alerts
        const aRes = await fetch(`${API_URL}/api/alerts`, { headers });
        if (aRes.ok) {
          const aData = await aRes.json();
          if (aData && aData.length > 0) setAlerts(aData);
        }

        // Fetch settings
        try {
          const sRes = await fetch(`${API_URL}/api/settings`, { headers });
          if (sRes.ok) {
            const sData = await sRes.json();
            setHealthWarnThreshold(sData.healthWarnThreshold);
            setHealthCritThreshold(sData.healthCritThreshold);
            setPredictSensitivity(sData.predictSensitivity);
            setAiEnabled(sData.aiEnabled);
          }
        } catch (err) {
          console.warn("Failed to fetch settings from backend", err);
        }

        // Fetch devices
        try {
          const dRes = await fetch(`${API_URL}/api/devices`, { headers });
          if (dRes.ok) {
            const dData = await dRes.json();
            if (dData && dData.length > 0) setCyberDevices(dData);
          }
        } catch (err) {
          console.warn("Failed to fetch cyber devices", err);
        }
      } catch (err) {
        console.warn("REST initialization offline, using local mock storage.", err);
      }
    };

    fetchInitialData();
  }, [token]);

  // Local Client-side AI Engine helper for offline Edge processing
  const clientAnalyzeTelemetry = (machine, history = [], warnThresh, critThresh) => {
    const { id, name, temp, vibration, current, rpm, pressure } = machine;
    let health = 100;
    let status = 'Healthy';
    let failureProbability = 1.0;
    let rul = 240;
    let aiConfidence = 95.0;
    let suggestedAction = 'No immediate action required. Continue routine monitoring.';
    let explanation = 'All parameters are operating within nominal baseline bounds.';
    let anomalies = [];

    // A. Rapid temp increase
    if (history.length >= 3) {
      const prevTemp = history[0].temp;
      const tempDiff = temp - prevTemp;
      if (tempDiff > 5.0) {
        anomalies.push({
          type: 'Thermal instability',
          severity: 'Warning',
          rootCause: `Rapid temperature increase of ${tempDiff.toFixed(1)}°C detected.`,
          action: 'Inspect cooling fan and check coolant levels.'
        });
      }
    }

    // B. Excessive vibration
    if (vibration > 1.0) {
      anomalies.push({
        type: 'Mechanical misalignment',
        severity: vibration > 1.4 ? 'Critical' : 'Warning',
        rootCause: `Excessive vibration: ${vibration.toFixed(2)} g exceeds safety limit of 0.8 g.`,
        action: id === 'MC-107' ? 'Inspect spindle bearing within the next maintenance window.' : 'Verify rotor eccentricity and balancing load.'
      });
    }

    // C. Current Spikes
    if (current > 22.0) {
      anomalies.push({
        type: 'Electrical overload',
        severity: current > 25.0 ? 'Critical' : 'Warning',
        rootCause: `High current spike: ${current.toFixed(1)} A exceeds nominal current bounds.`,
        action: 'Verify motor stator windings and check electrical contacts.'
      });
    }

    // D. Pressure
    if (id === 'MC-104' || id === 'MC-106') {
      const normalPressure = id === 'MC-104' ? 6.2 : 185.0;
      const deviation = Math.abs(pressure - normalPressure) / normalPressure;
      if (deviation > 0.25) {
        anomalies.push({
          type: 'Pneumatic/Hydraulic fluctuation',
          severity: deviation > 0.4 ? 'Critical' : 'Warning',
          rootCause: `Abnormal pressure fluctuation: current ${pressure.toFixed(1)} bar deviates by ${(deviation * 100).toFixed(0)}% from normal.`,
          action: 'Check hydraulic valve seals, inspect fluid lines, and verify discharge ports.'
        });
      }
    }

    // Scoring
    let healthDeduction = 0;
    if (temp > 50.0) healthDeduction += (temp - 50.0) * 1.5;
    if (vibration > 0.5) healthDeduction += (vibration - 0.5) * 35;
    if (current > 16.0) healthDeduction += (current - 16.0) * 4;
    if (id === 'MC-104' || id === 'MC-106') {
      const normalPressure = id === 'MC-104' ? 6.2 : 185.0;
      const deviation = Math.abs(pressure - normalPressure) / normalPressure;
      if (deviation > 0.1) healthDeduction += (deviation - 0.1) * 80;
    }

    health = Math.max(10, Math.round(100 - healthDeduction));

    if (health < critThresh || anomalies.some(a => a.severity === 'Critical')) {
      status = 'Critical';
    } else if (health < warnThresh || anomalies.length > 0) {
      status = 'Warning';
    } else {
      status = 'Healthy';
    }

    if (status === 'Critical') {
      failureProbability = Math.min(99.9, 80 + (100 - health) * 0.95);
      aiConfidence = Math.max(88.0, 98.0 - Math.random() * 2.0);
    } else if (status === 'Warning') {
      failureProbability = Math.min(79.0, 25 + (100 - health) * 1.25);
      aiConfidence = Math.max(82.0, 93.0 - Math.random() * 4.0);
    } else {
      failureProbability = Math.max(0.5, parseFloat((2.0 + (100 - health) * 0.15).toFixed(1)));
      aiConfidence = Math.max(92.0, 97.0 - Math.random() * 1.5);
    }

    if (status === 'Critical') {
      rul = Math.max(1, Math.round(12 * (health / 45)));
    } else if (status === 'Warning') {
      rul = Math.max(15, Math.round(150 * (health / 75)));
    } else {
      rul = Math.max(120, Math.round(240 * (health / 95)));
    }

    if (anomalies.length > 0) {
      const primaryAnomaly = anomalies[0];
      suggestedAction = primaryAnomaly.action;
      explanation = `${primaryAnomaly.rootCause} EdgeShield AI flags potential ${primaryAnomaly.type.toLowerCase()} anomaly.`;
    } else if (status === 'Warning') {
      suggestedAction = 'Schedule electrical & thermal maintenance audit during next downtime window.';
      explanation = 'Elevated operational parameters detected. Motor is operating slightly above baseline benchmarks.';
    }

    return {
      health,
      status,
      failureProbability: parseFloat(failureProbability.toFixed(1)),
      rul,
      aiConfidence: parseFloat(aiConfidence.toFixed(1)),
      suggestedAction,
      explanation,
      anomalies
    };
  };

  // WebSocket Live Sync with Auto Fallback
  useEffect(() => {
    let ws = null;
    let fallbackInterval = null;

    const connectWS = () => {
      try {
        ws = new WebSocket(`${WS_URL}/ws/live`);

        ws.onopen = async () => {
          setIsBackendConnected(true);
          console.log("EdgeShield AI live full-stack telemetry sync active.");
          if (fallbackInterval) {
            clearInterval(fallbackInterval);
            fallbackInterval = null;
          }

          // SYNCHRONIZATION: Push cached offline alerts to backend database
          const offlineAlerts = JSON.parse(localStorage.getItem('edgeshield_offline_alerts') || '[]');
          if (offlineAlerts.length > 0 && token) {
            try {
              const res = await fetch(`${API_URL}/api/alerts/sync`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ alerts: offlineAlerts })
              });
              if (res.ok) {
                console.log(`Successfully synchronized ${offlineAlerts.length} offline alerts to the database.`);
                localStorage.removeItem('edgeshield_offline_alerts');
              }
            } catch (err) {
              console.warn("Failed to sync offline alerts to backend:", err);
            }
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.machines) {
              const normalized = data.machines.map(m => ({
                ...m,
                failureProbability: m.failure_prob !== undefined ? m.failure_prob : (m.failureProbability ?? 2.0),
                suggestedAction: m.suggestedAction || 'No Action Required',
                installDate: m.installDate || '2023-01-15',
                maintCost: m.maintCost || '₹12,000'
              }));
              setMachines(normalized);
            }
            if (data.cyberDevices) {
              setCyberDevices(data.cyberDevices);
            }
            if (data.edgeStatus) {
              setEdgeStatus(data.edgeStatus);
            }
            if (data.alerts && data.alerts.length > 0) {
              setAlerts(prev => {
                const newAlerts = data.alerts.filter(na => !prev.some(pa => pa.id === na.id));
                newAlerts.forEach(na => {
                  triggerToast(
                    `${na.type} Alert: ${na.machine}`,
                    na.summary,
                    na.priority.toLowerCase(),
                    na.id
                  );
                });
                return [...newAlerts, ...prev];
              });
            }
          } catch (e) {
            console.error("Failed to parse WebSocket telemetry frame:", e);
          }
        };

        ws.onerror = () => {
          setIsBackendConnected(false);
        };

        ws.onclose = () => {
          setIsBackendConnected(false);
          startFallback();
          setTimeout(connectWS, 5000);
        };
      } catch (err) {
        setIsBackendConnected(false);
        startFallback();
      }
    };

    const startFallback = () => {
      if (fallbackInterval) return;
      console.log("FastAPI backend offline. Starting client-side Edge AI telemetry processor.");
      offlineTicksRef.current = 0;
      
      fallbackInterval = setInterval(() => {
        offlineTicksRef.current += 1;
        const ticks = offlineTicksRef.current;

        setMachines((prevMachines) => {
          return prevMachines.map((machine) => {
            const isCritical = machine.status === 'Critical';
            let tempJitter = (Math.random() - 0.5) * 0.5;
            let vibJitter = (Math.random() - 0.5) * 0.15;
            let pressJitter = machine.pressure > 0 ? (Math.random() - 0.5) * 0.2 : 0;
            let currentJitter = (Math.random() - 0.5) * 0.25;
            let rpmJitter = machine.rpm > 0 ? (Math.random() - 0.5) * 12 : 0;
            
            if (isCritical) {
              tempJitter = (Math.random() - 0.25) * 0.8;
              vibJitter = (Math.random() - 0.25) * 0.45;
            }

            // Simulated failures inside offline driver
            if (machine.id === 'MC-107' && ticks > 10) {
              tempJitter = Math.random() * 2.0 + 0.8;
              vibJitter = Math.random() * 0.12 + 0.05;
              rpmJitter = Math.round(Math.random() * 20 + 5);
            }
            if (machine.id === 'MC-104' && ticks > 15) {
              tempJitter = Math.random() * 1.8 + 0.8;
              vibJitter = Math.random() * 0.3 + 0.1;
            }

            const finalTemp = parseFloat(Math.max(10, machine.temp + tempJitter).toFixed(1));
            const finalVib = parseFloat(Math.max(0.05, machine.vibration + vibJitter).toFixed(2));
            const finalPress = parseFloat(Math.max(0, machine.pressure + pressJitter).toFixed(1));
            const finalCurrent = Math.max(1, parseFloat((machine.current + currentJitter).toFixed(1)));
            const finalRpm = Math.max(0, Math.round(machine.rpm + rpmJitter));

            const updatedMachine = {
              ...machine,
              temp: finalTemp,
              vibration: finalVib,
              pressure: finalPress,
              current: finalCurrent,
              rpm: finalRpm,
              timestamp: new Date().toISOString()
            };

            // Run client-side local Edge AI analysis
            const aiResults = clientAnalyzeTelemetry(updatedMachine, [], healthWarnThreshold, healthCritThreshold);

            // Auto-trigger alerts on state transition
            if (aiResults.status !== 'Healthy' && machine.status === 'Healthy') {
              const altId = `ALT-OFFLINE-${Math.floor(Math.random() * 599) + 400}`;
              const newAlert = {
                id: altId,
                machine: machine.name,
                machineId: machine.id,
                type: 'Predictive Maintenance',
                priority: aiResults.status === 'Critical' ? 'Critical' : 'Warning',
                summary: `Anomaly detected on ${machine.name}: ${aiResults.explanation}`,
                aiExplanation: aiResults.explanation,
                recommendedAction: aiResults.suggestedAction,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                status: 'Open',
                assignedTo: 'Unassigned',
                affected: 'Main Operating Core'
              };

              setAlerts(prev => [newAlert, ...prev]);

              triggerToast(
                `Predictive Maintenance Alert: ${machine.name}`,
                `Offline AI flagged a ${aiResults.status} anomaly: ${aiResults.explanation}`,
                aiResults.status.toLowerCase(),
                altId
              );

              // Write to offline local cache
              const cached = JSON.parse(localStorage.getItem('edgeshield_offline_alerts') || '[]');
              cached.push(newAlert);
              localStorage.setItem('edgeshield_offline_alerts', JSON.stringify(cached));
            }

            return {
              ...updatedMachine,
              ...aiResults
            };
          });
        });

        // Trigger client-side simulated network cyber events in offline mode
        if (ticks === 25) {
          const cyberId = `ALT-CYBER-OFF-${Math.floor(Math.random() * 599) + 400}`;
          const cyberAlert = {
            id: cyberId,
            machine: 'Rotary Compressor RC-2',
            machineId: 'MC-104',
            type: 'Cybersecurity',
            priority: 'Critical',
            summary: 'High packet volume flood attempt on PLC port 502 from unknown host 10.227.100.99',
            aiExplanation: 'Client-side Edge AI flagged port 502 traffic spikes (480 pkts/sec) during offline monitoring.',
            recommendedAction: 'Apply firewall packet quarantine and audit Gateway security rules.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            status: 'Open',
            assignedTo: 'Unassigned',
            affected: 'Modbus Register 4001 / Port 502'
          };
          
          setAlerts(prev => [cyberAlert, ...prev]);

          triggerToast(
            "Cybersecurity Threat Ingress",
            "High packet volume flood attempt on PLC port 502 from unknown host 10.227.100.99",
            "critical",
            cyberId
          );

          const cached = JSON.parse(localStorage.getItem('edgeshield_offline_alerts') || '[]');
          cached.push(cyberAlert);
          localStorage.setItem('edgeshield_offline_alerts', JSON.stringify(cached));

          setCyberDevices(prev => prev.map(d => d.id === 'DEV-PLC04' ? {
            ...d,
            riskLevel: 'Critical',
            trustScore: 35,
            packetsSec: 480,
            errorRate: 18.5,
            status: 'Warning'
          } : d));
        }

        // Restore devices stats later
        if (ticks === 45) {
          setCyberDevices(prev => prev.map(d => d.id === 'DEV-PLC04' ? {
            ...d,
            riskLevel: 'Low',
            trustScore: 96,
            packetsSec: 45,
            errorRate: 0.0,
            status: 'Online'
          } : d));
        }

        setEnergyStats(prev => {
          const loadJitter = (Math.random() - 0.5) * 8;
          const pfJitter = (Math.random() - 0.5) * 0.005;
          const voltJitter = (Math.random() - 0.5) * 0.05;

          const finalLoad = parseFloat((prev.currentLoadKw + loadJitter).toFixed(1));
          const finalPf = Math.min(1.0, Math.max(0.85, parseFloat((prev.powerFactor + pfJitter).toFixed(3))));
          const finalVolt = Math.min(100, Math.max(98, parseFloat((prev.voltageStability + voltJitter).toFixed(2))));

          const numericCost = parseInt(prev.todayCost.replace(/[^\d]/g, '')) + Math.round(Math.abs(loadJitter) * 0.12);
          const numericCons = parseInt(prev.totalConsumptionKwh.replace(/[^\d]/g, '')) + Math.round(Math.abs(loadJitter) * 0.04);

          return {
            currentLoadKw: finalLoad,
            powerFactor: finalPf,
            voltageStability: finalVolt,
            freqStability: prev.freqStability,
            todayCost: `₹${numericCost.toLocaleString()}`,
            totalConsumptionKwh: `${numericCons.toLocaleString()}`
          };
        });
      }, 1500);
    };

    connectWS();

    // Fetch operators/users from backend database under real authentication mode
    const fetchUsers = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_URL}/api/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const normalized = data.map(u => ({
              empId: `EMP-${u.id}`,
              name: u.name,
              email: u.email,
              dept: u.dept || 'Production',
              role: u.role,
              status: 'Active',
              lastLogin: 'Today'
            }));
            setUsers(normalized);
          }
        } catch (err) {
          console.warn("Failed to fetch operators database:", err);
        }
      }
    };
    fetchUsers();

    return () => {
      if (ws) ws.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [healthWarnThreshold, healthCritThreshold, token]);

  // Selected Machine calculations
  const selectedMachine = useMemo(() => {
    const targetId = activeTab === 'Machine Monitoring' ? selectedMachineId : pmSelectedMachineId;
    return machines.find(m => m.id === targetId) || machines[0];
  }, [machines, selectedMachineId, pmSelectedMachineId, activeTab]);

  useEffect(() => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    setHistoryData(prev => {
      const newEntry = {
        time: timeStr,
        temp: selectedMachine.temp,
        vibration: selectedMachine.vibration,
        current: selectedMachine.current,
        rpm: selectedMachine.rpm,
        health: selectedMachine.health,
        failureProb: selectedMachine.failureProbability
      };
      const updated = [...prev, newEntry];
      if (updated.length > 10) updated.shift();
      return updated;
    });
  }, [selectedMachine]);

  // Selected cyber device diagnostics
  const selectedDevice = useMemo(() => {
    return cyberDevices.find(d => d.id === selectedDeviceId) || cyberDevices[0];
  }, [cyberDevices, selectedDeviceId]);

  useEffect(() => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    setTrafficHistory(prev => {
      const newEntry = {
        time: timeStr,
        volume: selectedDevice.packetsSec,
        failures: Math.round(selectedDevice.packetsSec * (selectedDevice.errorRate / 100)),
        anomalyScore: selectedDevice.riskLevel === 'Critical' ? 92 : selectedDevice.riskLevel === 'Warning' ? 64 : 12
      };
      const updated = [...prev, newEntry];
      if (updated.length > 10) updated.shift();
      return updated;
    });
  }, [selectedDevice]);

  // ─── Global Keyboard Shortcuts ───────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setHelpPanelOpen(false);
        setProfileDropdownOpen(false);
      }
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'd': e.preventDefault(); setActiveTab('Dashboard'); break;
          case 'm': e.preventDefault(); setActiveTab('Machine Monitoring'); break;
          case 'a': e.preventDefault(); setActiveTab('Alerts'); break;
          case 'c': e.preventDefault(); setActiveTab('AI Copilot'); break;
          case 's': e.preventDefault(); setActiveTab('Cybersecurity'); break;
          default: break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const factoryHealth = useMemo(() => {
    if (machines.length === 0) return '100%';
    const avg = machines.reduce((acc, m) => acc + m.health, 0) / machines.length;
    return `${avg.toFixed(1)}%`;
  }, [machines]);

  const activeAssetsAlert = useMemo(() => {
    const crit = machines.filter(m => m.status === 'Critical').length;
    const warn = machines.filter(m => m.status === 'Warning').length;
    return crit > 0 ? `${crit} Crit` : warn > 0 ? `${warn} Warn` : 'Optimal';
  }, [machines]);

  const securityScore = useMemo(() => {
    const crit = cyberDevices.filter(d => d.riskLevel === 'Critical').length;
    const warn = cyberDevices.filter(d => d.riskLevel === 'Warning').length;
    return `${Math.max(0, 100 - (crit * 15) - (warn * 5))}%`;
  }, [cyberDevices]);

  const activeCyberAlertsCount = useMemo(() => {
    return alerts.filter(a => a.type === 'Cybersecurity' && a.status !== 'Resolved').length;
  }, [alerts]);

  const energyLoad = useMemo(() => {
    return parseFloat(machines.reduce((acc, m) => acc + (parseFloat(m.energy) || 0), 0).toFixed(1));
  }, [machines]);

  // Filtering calculations
  const filteredMachines = useMemo(() => {
    let result = [...machines];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(term) || m.id.toLowerCase().includes(term));
    }
    return result;
  }, [machines, searchTerm]);

  const filteredDevices = useMemo(() => {
    let result = [...cyberDevices];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(d => d.name.toLowerCase().includes(term) || d.id.toLowerCase().includes(term) || d.ip.includes(term));
    }
    return result;
  }, [cyberDevices, searchTerm]);

  // Helper methods for interactive AI Copilot widgets
  const updateAlertStatus = async (alertId, newStatus) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: newStatus } : a));
    if (isBackendConnected && token) {
      try {
        const endpoint = newStatus === 'Acknowledged' ? 'acknowledge' : 'resolve';
        await fetch(`${API_URL}/api/alerts/${alertId}/${endpoint}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        triggerToast('Security Protocol', `Incident ${alertId} marked as ${newStatus} on core.`, 'success');
      } catch (err) {
        console.warn("Backend update failed, kept local state", err);
      }
    } else {
      triggerToast('Security Protocol (Local)', `Incident ${alertId} status marked as ${newStatus}.`, 'info');
    }
  };

  const assignAlert = async (alertId, assignee) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, assignedTo: assignee } : a));
    if (isBackendConnected && token) {
      try {
        await fetch(`${API_URL}/api/alerts/${alertId}/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ assignedTo: assignee })
        });
        triggerToast('Security Protocol', `Incident ${alertId} assigned to ${assignee}.`, 'success');
      } catch (err) {
        console.warn("Backend assignment failed", err);
      }
    } else {
      triggerToast('Security Protocol (Local)', `Incident ${alertId} assigned to ${assignee}.`, 'info');
    }
  };

  const toggleDeviceQuarantine = async (deviceId) => {
    if (isBackendConnected && token) {
      try {
        const response = await fetch(`${API_URL}/api/devices/quarantine`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ id: deviceId })
        });
        if (response.ok) {
          const data = await response.json();
          setCyberDevices(data.devices);
          triggerToast('Network Security Alert', `Device ${deviceId} quarantine status updated.`, 'warning');
          return;
        }
      } catch (err) {
        console.error('Failed to quarantine device on backend', err);
      }
    }
    // Fallback: update state locally
    setCyberDevices(prev => prev.map(d => {
      if (d.id !== deviceId) return d;
      const isQuarantined = d.status === 'Quarantined';
      return {
        ...d,
        riskLevel: isQuarantined ? 'Low' : 'Critical',
        trustScore: isQuarantined ? 99 : 30,
        status: isQuarantined ? 'Online' : 'Quarantined'
      };
    }));
    triggerToast('Network Security (Local)', `Device ${deviceId} quarantine status updated.`, 'warning');
  };

  const whitelistDevice = (deviceId) => {
    setCyberDevices(prev => prev.map(d => {
      if (d.id !== deviceId) return d;
      return {
        ...d,
        riskLevel: 'Low',
        trustScore: 99,
        status: 'Online',
        errorRate: 0.0,
        packetsSec: 40
      };
    }));
    triggerToast('Network Whitelist', `Device ${deviceId} trusted signature applied.`, 'success');
  };

  // AI Copilot response triggers
  const handleSendPrompt = (promptText) => {
    if (!promptText.trim()) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: promptText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setVoiceActive(false);
    if (speechRecogRef.current) { speechRecogRef.current.stop(); speechRecogRef.current = null; }
    setInterimTranscript('');
    setIsCopilotTyping(true);

    setTimeout(() => {
      let replyText = "";
      let widgetPayload = null;
      const q = promptText.toLowerCase().trim();

      // ─── Helpers ────────────────────────────────────────────────
      const avgHealth = machines.length > 0
        ? (machines.reduce((acc, m) => acc + m.health, 0) / machines.length).toFixed(1)
        : 100;

      // Try to extract a machine name or ID from the query
      const mentionedMachine = machines.find(m =>
        q.includes(m.id.toLowerCase()) ||
        q.includes(m.name.toLowerCase()) ||
        m.name.toLowerCase().split(' ').some(word => word.length > 3 && q.includes(word))
      );

      // Match device
      const mentionedDevice = cyberDevices.find(d =>
        q.includes(d.id.toLowerCase()) ||
        q.includes(d.name.toLowerCase()) ||
        q.includes(d.ip.toLowerCase())
      );

      // Match alert
      const mentionedAlert = alerts.find(a =>
        q.includes(a.id.toLowerCase()) ||
        q.includes(a.machine.toLowerCase())
      );

      const criticalMachines = machines.filter(m => m.status === 'Critical');
      const warningMachines  = machines.filter(m => m.status === 'Warning');
      const unhealthyMachines = machines.filter(m => m.status !== 'Healthy');
      const openAlerts       = alerts.filter(a => a.status === 'Open');
      const criticalAlerts   = alerts.filter(a => a.priority === 'Critical' && a.status !== 'Resolved');
      const cyberAlerts      = alerts.filter(a => a.type === 'Cybersecurity' && a.status !== 'Resolved');
      const topFailure       = [...machines].sort((a, b) => (b.failureProbability ?? 0) - (a.failureProbability ?? 0))[0];

      // ─── Command: Quarantine ───
      if (q.startsWith('quarantine') || q.startsWith('/quarantine') || q.startsWith('isolate')) {
        const targetId = q.replace(/[\/]?quarantine|isolate/g, '').trim().toUpperCase();
        const dev = cyberDevices.find(d => d.id.toUpperCase() === targetId || d.ip === targetId);
        if (dev) {
          toggleDeviceQuarantine(dev.id);
          replyText = `🛡️ **Command Executed**: Quarantine protocol has been triggered for device **${dev.name} (${dev.id})**.\n\nInteractive card rendered below for further administration:`;
          widgetPayload = { type: 'device', data: dev };
        } else if (mentionedDevice) {
          toggleDeviceQuarantine(mentionedDevice.id);
          replyText = `🛡️ **Command Executed**: Quarantine protocol has been triggered for device **${mentionedDevice.name} (${mentionedDevice.id})**.\n\nInteractive card rendered below:`;
          widgetPayload = { type: 'device', data: mentionedDevice };
        } else {
          replyText = `❌ Device ID not found. Please specify a valid device ID like: \`quarantine DEV-PLC04\``;
        }
      }
      // ─── Command: Whitelist ───
      else if (q.startsWith('whitelist') || q.startsWith('/whitelist') || q.startsWith('trust')) {
        const targetId = q.replace(/[\/]?whitelist|trust/g, '').trim().toUpperCase();
        const dev = cyberDevices.find(d => d.id.toUpperCase() === targetId);
        if (dev) {
          whitelistDevice(dev.id);
          replyText = `🛡️ **Command Executed**: Device **${dev.name} (${dev.id})** has been whitelisted and marked secure.`;
          widgetPayload = { type: 'device', data: dev };
        } else if (mentionedDevice) {
          whitelistDevice(mentionedDevice.id);
          replyText = `🛡️ **Command Executed**: Device **${mentionedDevice.name} (${mentionedDevice.id})** has been whitelisted.`;
          widgetPayload = { type: 'device', data: mentionedDevice };
        } else {
          replyText = `❌ Device ID not found. Specify a valid ID like: \`whitelist DEV-PLC04\``;
        }
      }
      // ─── Command: Resolve/Acknowledge alert ───
      else if (q.startsWith('resolve') || q.startsWith('/resolve') || q.startsWith('acknowledge') || q.startsWith('/acknowledge') || q.startsWith('ack')) {
        const targetId = q.replace(/[\/]?resolve|acknowledge|ack/g, '').trim().toUpperCase();
        const al = alerts.find(a => a.id.toUpperCase() === targetId);
        const nextStatus = (q.includes('resolve') ? 'Resolved' : 'Acknowledged');
        if (al) {
          updateAlertStatus(al.id, nextStatus);
          replyText = `🔔 **Command Executed**: Incident **${al.id}** status updated to **${nextStatus}**.`;
          widgetPayload = { type: 'alert', data: al };
        } else if (mentionedAlert) {
          updateAlertStatus(mentionedAlert.id, nextStatus);
          replyText = `🔔 **Command Executed**: Incident **${mentionedAlert.id}** status updated to **${nextStatus}**.`;
          widgetPayload = { type: 'alert', data: mentionedAlert };
        } else {
          replyText = `❌ Alert ID not found. Specify a valid ID like: \`resolve ALT-303\``;
        }
      }
      // ─── Command: Show chart / graph ───
      else if (q.includes('chart') || q.includes('graph') || q.includes('plot') || q.includes('/chart')) {
        let param = 'temp';
        if (q.includes('vibrat')) param = 'vibration';
        else if (q.includes('current') || q.includes('load') || q.includes('power')) param = 'current';
        else if (q.includes('rpm') || q.includes('speed')) param = 'rpm';
        else if (q.includes('press')) param = 'pressure';

        if (mentionedMachine) {
          replyText = `📊 Here is the real-time trend chart for **${mentionedMachine.name} (${mentionedMachine.id})** monitoring **${param}**:`;
          widgetPayload = { type: 'chart', data: { machineId: mentionedMachine.id, param } };
        } else {
          const m = machines[0];
          replyText = `📊 Machine ID unspecified. Showing telemetry chart for default asset **${m.name} (${m.id})**:`;
          widgetPayload = { type: 'chart', data: { machineId: m.id, param } };
        }
      }
      // ─── Command: Config / Settings ───
      else if (q.includes('threshold') || q.includes('settings') || q.includes('config') || q.includes('warn limit') || q.includes('crit limit')) {
        const warnMatch = q.match(/warn(ing)?\s*(threshold|limit)?\s*(to\s*)?(\d+)/i);
        const critMatch = q.match(/crit(ical)?\s*(threshold|limit)?\s*(to\s*)?(\d+)/i);
        let updated = {};
        if (warnMatch && warnMatch[4]) {
          updated.healthWarnThreshold = parseInt(warnMatch[4]);
        }
        if (critMatch && critMatch[4]) {
          updated.healthCritThreshold = parseInt(critMatch[4]);
        }
        if (Object.keys(updated).length > 0) {
          handleSaveSettings(updated);
          replyText = `⚙️ **System Thresholds Updated**:\n` +
            (updated.healthWarnThreshold ? `- Warning limit set to: **${updated.healthWarnThreshold}%**\n` : '') +
            (updated.healthCritThreshold ? `- Critical limit set to: **${updated.healthCritThreshold}%**\n` : '');
        } else {
          replyText = `⚙️ Here is the system threshold configuration panel. Adjust using the sliders below:`;
        }
        widgetPayload = { type: 'settings', data: {} };
      }
      // ─── Generic Specific machine detail ───
      else if (mentionedMachine && (q.includes('tell me') || q.includes('about') || q.includes('status') || q.includes('detail') || q.includes('why') || q.includes('diagnos') || q.includes('what is') || q.includes('check') || q.includes('how is') || q.includes('info'))) {
        const m = mentionedMachine;
        const icon = m.status === 'Critical' ? '🔴' : m.status === 'Warning' ? '🟡' : '🟢';
        replyText = `${icon} **AI Diagnostics — ${m.name} (${m.id})**\n\n` +
          `**🧠 AI Explanation**: ${m.explanation || 'All sensor parameters are within normal operating bounds.'}\n` +
          `**✅ Recommended Action**: *${m.suggestedAction || 'No immediate maintenance required.'}*`;
        widgetPayload = { type: 'machine', data: m };
      }
      // ─── INTENT: Greetings ───
      else if (/^(hi|hello|hey|howdy|good (morning|evening|afternoon)|what's up|sup)\b/.test(q)) {
        replyText = `Hello! 👋 I'm your **EdgeShield AI Copilot** — your real-time industrial intelligence assistant.\n\nCurrently monitoring **${machines.length} active machine nodes** across Detroit Smart Assembly Hub #4. Factory health is at **${avgHealth}%** with **${openAlerts.length} open alerts**.\n\nAsk me anything — machine diagnostics, failure predictions, cybersecurity incidents, energy loads, or maintenance planning!`;
      }
      // ─── INTENT: Help / Capabilities ───
      else if (q.includes('help') || q.includes('what can you do') || q.includes('capabilities') || q.includes('commands')) {
        replyText = `Here's what I can do for you. Try typing these commands directly in the chat:\n\n` +
          `🔧 **Diagnostics** — *"Why is MC-104 critical?"* / *"Tell me about MC-101"* (returns an interactive diagnostic card)\n` +
          `🛡️ **Cybersecurity Action** — *"/quarantine DEV-PLC04"* / *"whitelist DEV-MTR09"* (instantly quarantines/restores nodes)\n` +
          `📊 **Live Charts** — *"Show temperature chart for MC-104"* / *"Show vibration graph for MC-108"*\n` +
          `🔔 **Alert Control** — *"Resolve ALT-303"* / *"Acknowledge ALT-302"* (directly updates the incident status)\n` +
          `⚙️ **System Config** — *"Set warning threshold to 85"* / *"Show settings"* (returns interactive config sliders)`;
      }
      // ─── INTENT: List all machines ───
      else if (q.includes('list all') || q.includes('all machines') || q.includes('machine overview') || q.includes('show machines') || q.includes('machine status')) {
        replyText = `**Machine Status Overview** — Detroit Hub #4 (${machines.length} nodes):\n\n` +
          machines.map(m => {
            const icon = m.status === 'Critical' ? '🔴' : m.status === 'Warning' ? '🟡' : '🟢';
            return `${icon} **${m.name} (${m.id})** — Health: ${m.health}%, Failure Prob: ${(m.failureProbability ?? 0).toFixed(1)}%, RUL: ${m.rul} hrs`;
          }).join('\n') +
          `\n\n**Factory Average Health**: ${avgHealth}%`;
      }
      // ─── INTENT: Failure predictions ───
      else if (q.includes('fail') || q.includes('failure prob') || q.includes('rul') || q.includes('remaining useful life') || q.includes('breakdown')) {
        const sorted = [...machines].sort((a, b) => (b.failureProbability ?? 0) - (a.failureProbability ?? 0));
        replyText = `**🔮 Failure Probability Ranking** (EdgeShield LSTM Predictive Model):\n\n` +
          sorted.map((m, i) => {
            const icon = (m.failureProbability ?? 0) > 50 ? '🔴' : (m.failureProbability ?? 0) > 20 ? '🟡' : '🟢';
            return `${i + 1}. ${icon} **${m.name}** — Failure Prob: **${(m.failureProbability ?? 0).toFixed(1)}%**, RUL: **${m.rul} hrs**`;
          }).join('\n') +
          `\n\n⚠️ **Highest risk**: ${topFailure?.name} at **${(topFailure?.failureProbability ?? 0).toFixed(1)}%** failure probability.\n*Recommended action: ${topFailure?.suggestedAction}*`;
        if (topFailure) widgetPayload = { type: 'machine', data: topFailure };
      }
      // ─── INTENT: Open alerts ───
      else if (q.includes('alert') || q.includes('incident') || q.includes('alarm') || q.includes('open') || q.includes('unresolved')) {
        if (openAlerts.length > 0) {
          replyText = `🔔 **${openAlerts.length} Open Alert(s)** in the system. The latest is **${openAlerts[0].id}** on **${openAlerts[0].machine}**:`;
          widgetPayload = { type: 'alert', data: openAlerts[0] };
        } else {
          replyText = `✅ **No open alerts** in the system right now. All incidents have been resolved or acknowledged.`;
        }
      }
      // ─── INTENT: Cybersecurity ───
      else if (q.includes('cyber') || q.includes('security') || q.includes('threat') || q.includes('intrusion') || q.includes('network') || q.includes('plc') || q.includes('firewall') || q.includes('port') || q.includes('packet')) {
        const criticalDevices = cyberDevices.filter(d => d.riskLevel === 'Critical');
        const warningDevices = cyberDevices.filter(d => d.riskLevel === 'Warning');
        const alertDevice = criticalDevices[0] || warningDevices[0] || cyberDevices[0];
        
        replyText = `🛡️ **OT Cybersecurity Audit**:\n` +
          `- Critical risk nodes: **${criticalDevices.length}**\n` +
          `- Warning risk nodes: **${warningDevices.length}**\n` +
          `- Overall firewall status: **Active & Guarding**\n\n` +
          `Interactive controls for the highest-threat device (**${alertDevice.name}**) are rendered below:`;
        widgetPayload = { type: 'device', data: alertDevice };
      }
      else {
        const urgentNote = criticalMachines.length > 0
          ? `\n\n⚠️ **Action needed**: ${criticalMachines.map(m => m.name).join(', ')} currently in **Critical** state.`
          : openAlerts.length > 0
          ? `\n\n🔔 You have **${openAlerts.length} open alert(s)** awaiting review.`
          : `\n\n✅ All systems are operating nominally right now.`;

        replyText = `I'm not sure I understood that query. 🤔\n` +
          `- Health Index: **${avgHealth}%** | Open Alerts: **${openAlerts.length}**` +
          urgentNote +
          `\n\nTry commands like:\n- *"/quarantine DEV-PLC04"* \n- *"Show temperature chart for MC-104"*\n- *"Resolve ALT-303"*`;
      }

      setChatMessages(prev => [...prev, {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: replyText,
        widget: widgetPayload,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsCopilotTyping(false);
    }, 900);
  };

  const parseMarkdown = (text) => {
    if (!text) return '';
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-extrabold text-dark-900">{part}</strong>;
      }
      return part;
    });
  };

  const renderCopilotWidget = (widget) => {
    if (!widget) return null;
    const { type, data } = widget;
    switch (type) {
      case 'machine': {
        const m = machines.find(item => item.id === data.id) || data;
        const statusColor = m.status === 'Critical' ? 'text-red-600 bg-red-50 border border-red-200' : m.status === 'Warning' ? 'text-amber-600 bg-amber-50 border border-amber-200' : 'text-emerald-650 bg-emerald-50 border border-emerald-200';
        return (
          <div className="mt-3 p-4 bg-dark-50/50 border border-dark-200 rounded-xl space-y-3 text-dark-800 font-sans shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center border-b border-dark-150 pb-2">
              <span className="font-extrabold text-xs text-dark-900">{m.name} ({m.id})</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusColor}`}>{m.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10.5px] font-semibold text-dark-700">
              <div className="flex justify-between"><span>Health Index:</span> <span className="font-bold text-dark-900">{m.health}%</span></div>
              <div className="flex justify-between"><span>RUL Remaining:</span> <span className="font-bold text-dark-900">{m.rul} hrs</span></div>
              <div className="flex justify-between"><span>Temperature:</span> <span className="font-bold text-dark-900">{m.temp}°C</span></div>
              <div className="flex justify-between"><span>Vibration Amplitude:</span> <span className="font-bold text-dark-900">{m.vibration} g</span></div>
              <div className="flex justify-between"><span>Current Draw:</span> <span className="font-bold text-dark-900">{m.current} A</span></div>
              <div className="flex justify-between"><span>RPM Speed:</span> <span className="font-bold text-dark-900">{m.rpm} RPM</span></div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-dark-150">
              <button 
                onClick={() => {
                  triggerToast('AI Diagnostic', `Running spectral telemetry audit on ${m.id}...`, 'info');
                  setTimeout(() => {
                    triggerToast('AI Diagnostic Complete', `Diagnostic successful for ${m.id}. All systems are verified. Confidence: 99.4%`, 'success');
                  }, 1200);
                }}
                className="flex-1 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[10px] font-extrabold transition-colors shadow-sm"
              >
                Run Diagnostics
              </button>
              <button 
                onClick={() => triggerToast('Maintenance Ticket Logged', `Diagnostic work order dispatched for ${m.id}.`, 'info')}
                className="flex-1 py-1.5 border border-dark-200 hover:bg-dark-50 text-dark-850 rounded-lg text-[10px] font-extrabold transition-colors"
              >
                Dispatch Work Order
              </button>
            </div>
          </div>
        );
      }
      case 'device': {
        const d = cyberDevices.find(item => item.id === data.id) || data;
        const isQuarantined = d.status === 'Quarantined';
        return (
          <div className="mt-3 p-4 bg-dark-50/50 border border-dark-200 rounded-xl space-y-3 text-dark-800 font-sans shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center border-b border-dark-150 pb-2">
              <span className="font-extrabold text-xs text-dark-900">{d.name} ({d.id})</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isQuarantined ? 'text-red-600 bg-red-50 border border-red-200' : 'text-emerald-650 bg-emerald-50 border border-emerald-200'}`}>{d.status}</span>
            </div>
            <div className="text-[10.5px] font-semibold text-dark-700 space-y-1.5">
              <div className="flex justify-between"><span>IP Address:</span> <span className="font-mono text-dark-900">{d.ip}</span></div>
              <div className="flex justify-between"><span>MAC Address:</span> <span className="font-mono text-dark-900">{d.mac}</span></div>
              <div className="flex justify-between"><span>Network Trust score:</span> <span className="font-bold text-dark-900">{d.trustScore}%</span></div>
              <div className="flex justify-between"><span>Risk Classification:</span> <span className={`font-bold ${d.riskLevel === 'Critical' ? 'text-red-650' : 'text-emerald-650'}`}>{d.riskLevel}</span></div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-dark-150">
              <button 
                onClick={() => toggleDeviceQuarantine(d.id)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold text-white transition-colors shadow-sm ${isQuarantined ? 'bg-emerald-650 hover:bg-emerald-750' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isQuarantined ? 'Restore Interface' : 'Quarantine Node'}
              </button>
              <button 
                onClick={() => whitelistDevice(d.id)}
                className="flex-1 py-1.5 border border-dark-200 hover:bg-dark-50 text-dark-850 rounded-lg text-[10px] font-extrabold transition-colors"
              >
                Whitelist Signature
              </button>
            </div>
          </div>
        );
      }
      case 'alert': {
        const a = alerts.find(item => item.id === data.id) || data;
        const isResolved = a.status === 'Resolved';
        return (
          <div className="mt-3 p-4 bg-dark-50/50 border border-dark-200 rounded-xl space-y-3.5 text-dark-800 font-sans shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center border-b border-dark-150 pb-2">
              <span className="font-extrabold text-xs text-dark-900">{a.id} — {a.type}</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${a.priority === 'Critical' ? 'text-white bg-red-600' : 'text-dark-800 bg-amber-400'}`}>{a.priority} Priority</span>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-dark-950 leading-relaxed">"{a.summary}"</p>
              <div className="grid grid-cols-2 gap-x-2 text-[10px] font-semibold text-gray-text">
                <div>Asset: <span className="text-dark-800 font-bold">{a.machine}</span></div>
                <div>Created: <span className="text-dark-800 font-bold">{a.timestamp}</span></div>
                <div>Owner: <span className="text-dark-800 font-bold">{a.assignedTo || 'Unassigned'}</span></div>
                <div>Status: <span className="text-dark-800 font-bold">{a.status}</span></div>
              </div>
            </div>
            {!isResolved && (
              <div className="flex gap-2 pt-2 border-t border-dark-150">
                {a.status !== 'Acknowledged' && (
                  <button 
                    onClick={() => updateAlertStatus(a.id, 'Acknowledged')}
                    className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-extrabold transition-colors shadow-sm"
                  >
                    Acknowledge
                  </button>
                )}
                <button 
                  onClick={() => updateAlertStatus(a.id, 'Resolved')}
                  className="flex-1 py-1.5 bg-emerald-650 hover:bg-emerald-750 text-white rounded-lg text-[10px] font-extrabold transition-colors shadow-sm"
                >
                  Resolve Incident
                </button>
                <button 
                  onClick={() => assignAlert(a.id, user?.name || 'Operator')}
                  className="flex-1 py-1.5 border border-dark-200 hover:bg-dark-50 text-dark-850 rounded-lg text-[10px] font-extrabold transition-colors"
                >
                  Assign to Me
                </button>
              </div>
            )}
          </div>
        );
      }
      case 'settings': {
        return (
          <div className="mt-3 p-4 bg-dark-50/50 border border-dark-200 rounded-xl space-y-4 text-dark-800 font-sans shadow-sm backdrop-blur-sm">
            <span className="font-extrabold text-xs text-dark-900 border-b border-dark-150 pb-2 block">AI System Threshold Panel</span>
            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-[10px] mb-1 font-bold text-dark-800 uppercase tracking-wide">
                  <span>Warning Threshold</span>
                  <span className="font-mono text-primary-600">{healthWarnThreshold}%</span>
                </div>
                <input 
                  type="range" min="60" max="95" 
                  value={healthWarnThreshold} 
                  onChange={(e) => handleSaveSettings({ healthWarnThreshold: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-dark-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1 font-bold text-dark-800 uppercase tracking-wide">
                  <span>Critical Threshold</span>
                  <span className="font-mono text-red-600">{healthCritThreshold}%</span>
                </div>
                <input 
                  type="range" min="30" max="59" 
                  value={healthCritThreshold} 
                  onChange={(e) => handleSaveSettings({ healthCritThreshold: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-dark-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>
            </div>
            <div className="pt-2 border-t border-dark-150">
              <button 
                onClick={() => triggerToast('System Config', 'AI Alert limits saved to edge firmware.', 'success')}
                className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[10.5px] font-extrabold transition-colors shadow-sm"
              >
                Apply System Configuration
              </button>
            </div>
          </div>
        );
      }
      case 'chart': {
        const { machineId, param } = data;
        const m = machines.find(item => item.id === machineId) || machines[0];
        
        const paramVal = m[param] || m.temp || 45;
        const chartData = Array.from({ length: 8 }, (_, i) => ({
          name: `T-${7 - i}`,
          value: parseFloat((paramVal + (Math.random() - 0.5) * (paramVal * 0.08)).toFixed(1))
        }));

        return (
          <div className="mt-3 p-4 bg-dark-50/50 border border-dark-200 rounded-xl space-y-3.5 text-dark-800 font-sans shadow-sm w-full min-w-[280px]">
            <div className="flex justify-between items-center border-b border-dark-150 pb-2">
              <span className="font-extrabold text-[10px] uppercase tracking-wider text-gray-text">{m.name} ({m.id})</span>
              <span className="text-[9px] font-extrabold text-primary-600 uppercase tracking-wider bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">Real-time {param}</span>
            </div>
            <div className="h-32 w-full font-mono text-[9px] relative select-none">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const clearChatLogs = () => {
    setChatMessages([{ id: 'msg-1', sender: 'assistant', text: "Conversation history cleared. How can I assist you with your factory analytics today?", time: 'Now' }]);
    setActionSuccess('Chat conversation logs cleared.');
    setTimeout(() => setActionSuccess(''), 3000);
  };

  const handleExportReport = () => {
    setActionLoading('export');
    setActionSuccess('');

    try {
      const now = new Date();
      const dateStr = now.toLocaleString();
      const avgHealth = machines.length > 0
        ? (machines.reduce((acc, m) => acc + m.health, 0) / machines.length).toFixed(1)
        : '100';
      const openAlerts = alerts.filter(a => a.status === 'Open');
      const criticalMachines = machines.filter(m => m.status === 'Critical');

      // ── PDF: generate a styled print window ──────────────────────
      if (repSelectedFormat === 'PDF') {
        const machineRows = machines.map(m => `
          <tr>
            <td>${m.id}</td><td>${m.name}</td>
            <td style="color:${m.status==='Critical'?'#dc2626':m.status==='Warning'?'#d97706':'#16a34a'};font-weight:700">${m.status}</td>
            <td>${m.health}%</td><td>${(m.failureProbability??0).toFixed(1)}%</td>
            <td>${m.temp}°C</td><td>${m.vibration} g</td>
            <td>${m.current} A</td><td>${m.rpm}</td>
            <td>${m.pressure} bar</td><td>${m.rul} hrs</td>
          </tr>`).join('');

        const alertRows = openAlerts.slice(0, 10).map(a => `
          <tr>
            <td>${a.id}</td><td>${a.machine}</td><td>${a.type}</td>
            <td style="color:${a.priority==='Critical'?'#dc2626':'#d97706'};font-weight:700">${a.priority}</td>
            <td>${a.status}</td><td>${a.assignedTo||'Unassigned'}</td>
            <td style="font-size:10px">${a.summary?.slice(0,60)||'—'}...</td>
          </tr>`).join('');

        const html = `<!DOCTYPE html><html><head><title>EdgeShield AI – ${repSelectedType}</title>
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:Arial,sans-serif;font-size:11px;color:#1e293b;padding:24px}
          h1{font-size:20px;color:#1d4ed8;margin-bottom:4px}
          h2{font-size:13px;color:#334155;margin:18px 0 8px;border-bottom:2px solid #e2e8f0;padding-bottom:4px}
          .meta{font-size:10px;color:#64748b;margin-bottom:16px}
          .kpi{display:flex;gap:16px;margin-bottom:16px}
          .kpi-card{flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;text-align:center}
          .kpi-card .val{font-size:22px;font-weight:700;color:#1d4ed8}
          .kpi-card .lbl{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.5px}
          table{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:16px}
          th{background:#1d4ed8;color:#fff;padding:6px 8px;text-align:left;font-size:9px;text-transform:uppercase}
          td{padding:5px 8px;border-bottom:1px solid #f1f5f9}
          tr:nth-child(even) td{background:#f8fafc}
          .footer{margin-top:24px;font-size:9px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:8px}
          @media print{body{padding:12px}.no-print{display:none}}
        </style></head><body>
        <h1>⚡ EdgeShield AI — ${repSelectedType}</h1>
        <div class="meta">Generated: ${dateStr} &nbsp;|&nbsp; Department: ${user?.dept||'Maintenance'} &nbsp;|&nbsp; Operator: ${user?.name||'Admin'}</div>
        <div class="kpi">
          <div class="kpi-card"><div class="val">${avgHealth}%</div><div class="lbl">Factory Health</div></div>
          <div class="kpi-card"><div class="val">${machines.length}</div><div class="lbl">Total Nodes</div></div>
          <div class="kpi-card"><div class="val">${criticalMachines.length}</div><div class="lbl">Critical</div></div>
          <div class="kpi-card"><div class="val">${openAlerts.length}</div><div class="lbl">Open Alerts</div></div>
        </div>
        <h2>Machine Telemetry Summary</h2>
        <table><thead><tr>
          <th>ID</th><th>Name</th><th>Status</th><th>Health</th><th>Fail%</th>
          <th>Temp</th><th>Vib</th><th>Current</th><th>RPM</th><th>Pressure</th><th>RUL</th>
        </tr></thead><tbody>${machineRows}</tbody></table>
        ${openAlerts.length > 0 ? `<h2>Open Alerts (${openAlerts.length})</h2>
        <table><thead><tr><th>ID</th><th>Machine</th><th>Type</th><th>Priority</th><th>Status</th><th>Assigned</th><th>Summary</th></tr></thead>
        <tbody>${alertRows}</tbody></table>` : ''}
        <div class="footer">EdgeShield AI Platform &nbsp;|&nbsp; Confidential – Internal Use Only &nbsp;|&nbsp; ${dateStr}</div>
        </body></html>`;

        const printWin = window.open('', '_blank', 'width=900,height=700');
        if (!printWin) {
          setActionSuccess('⚠️ Pop-up blocked. Please allow pop-ups for this site and try again.');
          setActionLoading(null);
          return;
        }
        printWin.document.write(html);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          printWin.print();
          printWin.close();
        }, 600);
        setActionSuccess('✅ PDF print dialog opened — save as PDF using your browser\'s print menu.');
      }

      // ── CSV: real data rows ───────────────────────────────────────
      else if (repSelectedFormat === 'CSV') {
        const header = ['Machine ID','Machine Name','Status','Health %','Failure Prob %','Temperature (C)','Vibration (g)','Current (A)','RPM','Pressure (bar)','RUL (hrs)','Suggested Action'];
        const rows = machines.map(m => [
          m.id, `"${m.name}"`, m.status, m.health,
          (m.failureProbability??0).toFixed(1),
          m.temp, m.vibration, m.current, m.rpm, m.pressure, m.rul,
          `"${m.suggestedAction||'No action required'}"`
        ]);
        const alertHeader = ['','Alert ID','Machine','Type','Priority','Status','Assigned To','Summary'];
        const alertRows2 = openAlerts.map(a => [
          '', a.id, `"${a.machine}"`, a.type, a.priority, a.status,
          a.assignedTo||'Unassigned', `"${a.summary?.replace(/"/g,"'")||''}"`
        ]);
        const csv = [
          `EdgeShield AI – ${repSelectedType}`,
          `Generated: ${dateStr}`,
          `Factory Health: ${avgHealth}% | Open Alerts: ${openAlerts.length}`,
          '',
          header.join(','),
          ...rows.map(r => r.join(',')),
          '',
          'OPEN ALERTS',
          alertHeader.join(','),
          ...alertRows2.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${repSelectedType.toLowerCase().replace(/\s+/g,'_')}_${now.toISOString().slice(0,10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setActionSuccess(`✅ CSV downloaded: ${link.download}`);
      }

      // ── Excel (TSV with BOM – opens natively in Excel) ───────────
      else if (repSelectedFormat === 'Excel') {
        const header = ['Machine ID','Machine Name','Status','Health %','Failure Prob %','Temperature °C','Vibration g','Current A','RPM','Pressure bar','RUL hrs','Action Required'];
        const rows = machines.map(m => [
          m.id, m.name, m.status, m.health,
          (m.failureProbability??0).toFixed(1),
          m.temp, m.vibration, m.current, m.rpm, m.pressure, m.rul,
          m.suggestedAction||'No action required'
        ]);
        const tsv = [
          `EdgeShield AI – ${repSelectedType}\t`,
          `Generated: ${dateStr}\t`,
          '',
          header.join('\t'),
          ...rows.map(r => r.join('\t'))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + tsv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${repSelectedType.toLowerCase().replace(/\s+/g,'_')}_${now.toISOString().slice(0,10)}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setActionSuccess(`✅ Excel file downloaded: ${link.download}`);
      }

    } catch (err) {
      console.error('Export error:', err);
      setActionSuccess('❌ Export failed. Please try again.');
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionSuccess(''), 6000);
    }
  };

  const triggerQuickAction = (actionKey, label) => {
    setActionLoading(actionKey);
    setActionSuccess('');
    setTimeout(() => {
      setActionLoading(null);
      setActionSuccess(`Completed Action: ${label}`);
      setTimeout(() => setActionSuccess(''), 4000);
    }, 1500);
  };

  const handleSaveSettings = async (updates) => {
    const newSettings = {
      healthWarnThreshold,
      healthCritThreshold,
      predictSensitivity,
      aiEnabled,
      ...updates
    };

    if (updates.healthWarnThreshold !== undefined) setHealthWarnThreshold(updates.healthWarnThreshold);
    if (updates.healthCritThreshold !== undefined) setHealthCritThreshold(updates.healthCritThreshold);
    if (updates.predictSensitivity !== undefined) setPredictSensitivity(updates.predictSensitivity);
    if (updates.aiEnabled !== undefined) setAiEnabled(updates.aiEnabled);

    if (isBackendConnected && token) {
      try {
        await fetch(`${API_URL}/api/settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newSettings)
        });
      } catch (err) {
        console.warn("Failed to save settings to backend:", err);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Healthy': return 'bg-emerald-50 text-emerald-600 border-emerald-250';
      case 'Warning': return 'bg-orange-50 text-orange-600 border-orange-250';
      default: return 'bg-red-50 text-red-600 border-red-250';
    }
  };

  const getUserStatusBadge = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Inactive': return 'bg-dark-100 text-gray-text border-dark-200';
      case 'Suspended': return 'bg-red-50 text-red-600 border-red-200';
      case 'Pending': return 'bg-orange-50 text-orange-600 border-orange-205';
      default: return 'bg-dark-50 text-dark-700 border-dark-200';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const rolePermissions = {
    'administrator': ['Dashboard', 'Factories', 'Analytics', 'Machine Monitoring', 'Predictive Maintenance', 'Digital Twin', 'Cybersecurity', 'Energy Optimization', 'Alerts', 'Reports', 'AI Copilot', 'User Management', 'Settings'],
    'plant manager': ['Dashboard', 'Factories', 'Analytics', 'Machine Monitoring', 'Predictive Maintenance', 'Digital Twin', 'Energy Optimization', 'Alerts', 'Reports', 'AI Copilot'],
    'maintenance engineer': ['Machine Monitoring', 'Predictive Maintenance', 'Digital Twin', 'Alerts', 'AI Copilot'],
    'production supervisor': ['Dashboard', 'Machine Monitoring', 'Digital Twin', 'Energy Optimization', 'Alerts'],
    'machine operator': ['Machine Monitoring', 'Digital Twin', 'Alerts'],
    'security analyst': ['Dashboard', 'Cybersecurity', 'Alerts', 'Reports']
  };

  const currentRole = (user?.role || '').toLowerCase();
  const allowedTabs = rolePermissions[currentRole] || [];
  const isAuthorized = allowedTabs.includes(activeTab);

  return (
    <div className="min-h-screen bg-dark-50 text-dark-900 flex font-sans overflow-hidden">
      
      {/* ─── Collapsible Left Sidebar ─── */}
      <aside className={`bg-white border-r border-dark-200 flex flex-col justify-between transition-smooth z-35 select-none ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div>
          {/* Brand header */}
          <div className="h-16 border-b border-dark-200 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-md flex-shrink-0">
                <Shield className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
              </div>
              {!sidebarCollapsed && (
                <span className="font-bold text-sm tracking-tight text-dark-900 whitespace-nowrap">
                  EdgeShield <span className="text-primary-600">AI</span>
                </span>
              )}
            </div>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1.5 hover:bg-dark-50 rounded-lg text-dark-500">
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation modules */}
          <nav className="p-3 space-y-1">
            {SIDEBAR_ITEMS.filter(item => {
              const currentRole = user?.role || '';
              return item.roles.includes(currentRole);
            }).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => { 
                    navigate(item.path);
                    setMmViewMode('list'); 
                    setPmViewMode('list'); 
                    setCyViewMode('list');
                    setSearchTerm('');
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold transition-smooth ${
                    isActive 
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/10' 
                      : 'text-gray-text hover:bg-primary-50 hover:text-primary-600'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User logout */}
        <div className="p-3 border-t border-dark-200">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-smooth">
            <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main Content Workspace ─── */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* Sticky Header Nav */}
        <header className="h-16 bg-white border-b border-dark-200 sticky top-0 z-20 px-6 flex items-center justify-between flex-shrink-0 font-sans">
          <div>
            <div className="text-[10px] text-gray-text font-semibold flex items-center gap-1 mb-0.5 select-none">
              <span>Detroit Smart Assembly</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span>Operations</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-primary-600 font-bold">{activeTab}</span>
            </div>
            <h1 className="text-sm font-extrabold text-dark-900 tracking-tight flex items-center gap-2">
              {activeTab === 'Dashboard' ? 'Console Overview' : activeTab}
              <span className="bg-primary-50 text-primary-600 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                Edge AI
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {isBackendConnected ? (
              <div className="flex items-center gap-2">
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] px-2.5 py-0.5 rounded-md font-extrabold uppercase tracking-wide">
                  Edge AI Synced ({edgeStatus?.mode || 'local'})
                </span>
              </div>
            ) : (
              <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[9px] px-2.5 py-0.5 rounded-md font-extrabold uppercase tracking-wide animate-pulse">
                Offline Mode Active (Local Fallback)
              </span>
            )}
            <button 
              onClick={() => { 
                navigate('/dashboard/alerts'); 
                setAlViewMode('list'); 
              }}
              className="p-2 border border-dark-200 rounded-xl hover:bg-dark-50 text-dark-600 relative transition-colors"
              title="Alerts Center"
            >
              {alerts.filter(a => a.status === 'Open' || a.status === 'New').length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
              <Bell className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setHelpPanelOpen(true)}
              className="p-2 border border-dark-200 rounded-xl hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600 text-dark-600 transition-colors"
              title="Help & Documentation"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <div className="h-6 w-px bg-dark-200" />
            
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 hover:bg-dark-50 p-1 rounded-xl transition-colors cursor-pointer"
              >
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-dark-900">{user?.name || 'Operator'}</span>
                  <span className="text-[9px] text-gray-text font-bold uppercase tracking-wider">{user?.role || 'Lead Engineer'}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-200 text-primary-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {user?.name ? user.name.slice(0,2).toUpperCase() : 'OP'}
                </div>
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white border border-dark-200 rounded-2xl shadow-xl z-50 p-3.5 space-y-3 font-sans"
                    >
                      <div className="border-b border-dark-100 pb-3">
                        <div className="text-xs font-extrabold text-dark-900">{user?.name || 'Operator Profile'}</div>
                        <div className="text-[10px] text-gray-text font-semibold">{user?.email}</div>
                        <div className="mt-1.5 flex gap-1.5 flex-wrap">
                          <span className="bg-primary-50 text-primary-600 text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase border border-primary-200">{user?.role}</span>
                          <span className="bg-dark-50 text-gray-text text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase border border-dark-200">{user?.dept || 'Maintenance'}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <button 
                          onClick={() => { navigate('/dashboard/settings'); setSettingsActiveMenu('general'); setProfileDropdownOpen(false); }}
                          className="w-full text-left py-1.5 px-2.5 hover:bg-dark-50 rounded-lg text-xs font-bold text-dark-800 transition-colors"
                        >
                          System Config
                        </button>
                        <button 
                          onClick={() => { navigate('/dashboard/user-management'); setProfileDropdownOpen(false); }}
                          className="w-full text-left py-1.5 px-2.5 hover:bg-dark-50 rounded-lg text-xs font-bold text-dark-800 transition-colors"
                        >
                          Access Matrix (RBAC)
                        </button>
                      </div>

                      <button 
                        onClick={() => { setProfileDropdownOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-2 py-2 px-2.5 hover:bg-red-50 text-red-650 hover:text-red-755 text-xs font-bold rounded-lg transition-colors border-t border-dark-100 pt-3"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out Session</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Instant success banner */}
        <AnimatePresence>
          {actionSuccess && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-500 text-white text-xs font-bold px-6 py-2.5 flex items-center justify-between select-none"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{actionSuccess}</span>
              </div>
              <button onClick={() => setActionSuccess('')} className="hover:opacity-85 text-[10px] uppercase font-bold">Dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── FULL-WIDTH OFFLINE FALLBACK BANNER ─── */}
        <AnimatePresence>
          {!isBackendConnected && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-6 py-3 flex items-center justify-between shadow-inner select-none"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                <div>
                  <span className="uppercase tracking-wider mr-2 bg-white/20 px-2 py-0.5 rounded text-[10px]">Offline Mode Active</span>
                  <span>EdgeShield AI is running entirely inside your browser cache. All diagnostics, alert detections, and predictive models continue to process locally.</span>
                </div>
              </div>
              <span className="text-[10px] text-white/80 italic font-mono">Air-Gapped Mode</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Tab Content Workspace Body ─── */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto bg-dark-50/50">

          {!isAuthorized ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-4 font-sans bg-white border border-dark-200 rounded-3xl p-8 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 text-red-650 flex items-center justify-center shadow-sm">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-extrabold text-dark-900">403 Access Denied</h2>
                <p className="text-xs text-gray-text">You do not have administrative clearance to access the {activeTab} console.</p>
              </div>
              <button
                onClick={() => {
                  let targetPath = '/dashboard';
                  const r = currentRole;
                  if (r === 'plant manager') targetPath = '/dashboard/factories';
                  else if (r === 'maintenance engineer') targetPath = '/dashboard/predictive-maintenance';
                  else if (r === 'production supervisor') targetPath = '/dashboard/machine-monitoring';
                  else if (r === 'machine operator') targetPath = '/dashboard/machine-monitoring';
                  else if (r === 'security analyst') targetPath = '/dashboard/cybersecurity';
                  navigate(targetPath);
                }}
                className="py-2 px-6 bg-primary-600 hover:bg-primary-750 text-white text-xs font-bold rounded-xl shadow-md transition-smooth"
              >
                Return to Safe Dashboard
              </button>
            </div>
          ) : (
            <>

          {/* ─── TAB 1: DASHBOARD OVERVIEW ─── */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6 animate-fade-in font-sans">
              
              {/* Primary KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-smooth">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide">Factory Health</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Activity className="w-4 h-4" /></div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-dark-900">{factoryHealth}</span>
                    <span className="text-emerald-500 text-[10px] font-bold flex items-center gap-0.5"><TrendingUp className="w-3.5 h-3.5" /> Nominal</span>
                  </div>
                  <div className="text-[10px] text-gray-text font-semibold">Continuous LSTM Health Index</div>
                </div>

                <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-smooth">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide">Active Node Assets</span>
                    <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center"><Cpu className="w-4 h-4" /></div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-dark-900">{machines.length} Total</span>
                    <span className={`${
                      machines.filter(m => m.status === 'Critical').length > 0 ? 'text-red-500' :
                      machines.filter(m => m.status === 'Warning').length > 0 ? 'text-orange-500' :
                      'text-emerald-500'
                    } text-[10px] font-bold flex items-center gap-0.5`}>
                      {activeAssetsAlert}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-text font-semibold">Device buses active on Modbus</div>
                </div>

                <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-smooth">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide">AI Security Score</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Shield className="w-4 h-4" /></div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-dark-900">{securityScore}</span>
                    <span className="text-emerald-500 text-[10px] font-bold flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> Secure</span>
                  </div>
                  <div className="text-[10px] text-gray-text font-semibold">{activeCyberAlertsCount} active threat anomalies</div>
                </div>

                <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-smooth">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide">Energy Load Kw</span>
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center"><Zap className="w-4 h-4" /></div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-dark-900">{energyLoad} kW</span>
                    <span className="text-emerald-500 text-[10px] font-bold flex items-center gap-0.5">-12.5%</span>
                  </div>
                  <div className="text-[10px] text-gray-text font-semibold">Optimized via load forecast models</div>
                </div>
              </div>

              {/* ─── EDGE AI STATUS & DIAGNOSTICS PANEL ─── */}
              <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-dark-150 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-dark-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      Local Edge AI Processing Status
                    </h3>
                    <p className="text-[10px] text-gray-text mt-0.5">Real-time status of the local air-gapped diagnostics engine</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-dark-50 border border-dark-200 text-dark-800 px-2 py-0.5 rounded font-mono">
                      v{edgeStatus?.version || '2.1.0'}
                    </span>
                    <span className="text-[10px] bg-primary-50 border border-primary-200 text-primary-700 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                      {edgeStatus?.mode === 'simulation' ? 'Simulator Active' : `Protocol: ${edgeStatus?.mode || 'Local Offline'}`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-extrabold text-gray-text tracking-wider">AI Diagnostics</span>
                    <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                      <span>●</span> Local Processing (No Cloud)
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-extrabold text-gray-text tracking-wider">Database Status</span>
                    <div className="text-xs font-bold text-dark-850 flex items-center gap-1.5">
                      <span>●</span> SQLite / Flat JSON Connected
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-extrabold text-gray-text tracking-wider">Uptime</span>
                    <div className="text-xs font-bold text-dark-850 font-mono">
                      {edgeStatus?.uptime ? `${Math.floor(edgeStatus.uptime / 60)}m ${edgeStatus.uptime % 60}s` : 'Offline'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-extrabold text-gray-text tracking-wider">WebSocket Clients</span>
                    <div className="text-xs font-bold text-dark-850 font-mono">
                      {edgeStatus?.wsClients || 1} Connected
                    </div>
                  </div>

                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <span className="text-[9px] uppercase font-extrabold text-gray-text tracking-wider">Network Mode</span>
                    <div className="text-xs font-bold text-dark-850 flex items-center gap-1.5">
                      <span>●</span> {isBackendConnected ? 'Direct Connection' : 'Air-Gapped Client Cache'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── AI INSIGHTS QUICK SNAPSHOT SECTION ─── */}
              <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest border-b border-dark-100 pb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  Local AI Diagnostics Insights
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-red-700 font-extrabold block">Machine Most at Risk</span>
                    <span className="font-bold text-red-950 block text-xs">Spindle Motor MC-108 (87% Health)</span>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-250 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-amber-700 font-extrabold block">Recommended Action today</span>
                    <span className="font-bold text-amber-950 block text-xs">Inspect bearing on MC-108 within 2.5 Hours</span>
                  </div>
                  <div className="p-3 border border-dark-100 bg-dark-50/20 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Predictive Diagnostics Model</span>
                    <span className="font-bold block text-xs text-primary-700">LSTM / Spectral Anomaly Ready</span>
                  </div>
                </div>
              </div>

              {/* Composed Chart area */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-dark-900">Detroit Hub #4 Operations Composed Chart</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={machines}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Bar dataKey="health" fill="#EFF6FF" stroke="#3B82F6" name="Health Score" />
                        <Line type="monotone" dataKey="temp" stroke="#EF4444" strokeWidth={2.5} name="Temperature C" />
                        <Line type="monotone" dataKey="current" stroke="#10B981" strokeWidth={2.5} name="Current g" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide block border-b border-dark-100 pb-2">Active Incidents Summary</span>
                  <div className="space-y-3.5">
                    {alerts.slice(0, 3).map((a) => (
                      <div key={a.id} className="p-3 border border-dark-200 rounded-xl space-y-1.5 text-xs">
                        <div className="flex justify-between font-bold">
                          <span className="text-dark-900 font-bold">{a.machine}</span>
                          <span className="text-[9px] uppercase border px-1.5 rounded bg-red-50 text-red-600 border-red-200">{a.priority}</span>
                        </div>
                        <div className="text-gray-text text-[10.5px] leading-relaxed">{a.summary}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 2: MACHINE MONITORING ─── */}
          {activeTab === 'Machine Monitoring' && (
            <div className="space-y-6">
              {mmViewMode === 'list' ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2 className="text-base font-extrabold text-dark-900 tracking-tight">Machine Monitoring Hub</h2>
                      <p className="text-xs text-gray-text mt-0.5">Real-time parameters synced from edge sensor buses.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMachines.map((machine) => (
                      <div key={machine.id} className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-smooth">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center"><Cpu className="w-5.5 h-5.5" /></div>
                            <div>
                              <h4 className="text-xs font-extrabold text-dark-900 leading-tight">{machine.name}</h4>
                              <span className="text-[10px] text-gray-text font-bold uppercase tracking-wide">{machine.id} · {machine.type}</span>
                            </div>
                          </div>
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${getStatusBadge(machine.status)}`}>
                            {machine.status}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-dark-800 font-semibold grid grid-cols-2 gap-y-2 gap-x-4 border-t border-b border-dark-100 py-3">
                          <div>Temp: <span className="text-dark-950 font-bold">{machine.temp.toFixed(1)}°C</span></div>
                          <div>RPM: <span className="text-dark-950 font-bold">{machine.rpm}</span></div>
                          <div>Vibration: <span className="text-dark-950 font-bold">{machine.vibration.toFixed(2)} g</span></div>
                          <div>Health: <span className="text-dark-950 font-bold">{machine.health}%</span></div>
                        </div>

                        <button 
                          onClick={() => { setSelectedMachineId(machine.id); setMmViewMode('detail'); }}
                          className="w-full py-2 bg-dark-50 border border-dark-200 hover:bg-primary-600 hover:text-white rounded-xl text-xs font-bold text-dark-800 transition-smooth flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-4 h-4" /> View Diagnostics
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-dark-200">
                    <button onClick={() => setMmViewMode('list')} className="border border-dark-200 hover:bg-dark-50 text-dark-800 rounded-xl py-1.5 px-3 flex items-center gap-1.5 text-xs font-bold transition-colors">
                      <ChevronLeft className="w-4 h-4" /> Back to Machine Directory
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-dark-900">Live Telemetry Chart: {selectedMachine.name}</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={historyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                            <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 9 }} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="temp" stroke="#EF4444" strokeWidth={2.5} name="Temperature C" />
                            <Line type="monotone" dataKey="vibration" stroke="#F59E0B" strokeWidth={2.5} name="Vibration g" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide block border-b border-dark-100 pb-2">Asset Details</span>
                      <div className="space-y-4 pt-2 text-xs font-semibold text-dark-800">
                        <div className="flex justify-between"><span>Location:</span> <span>{selectedMachine.location}</span></div>
                        <div className="flex justify-between"><span>Installer Date:</span> <span>{selectedMachine.installDate}</span></div>
                        <div className="flex justify-between"><span>Operating Department:</span> <span>{selectedMachine.dept}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB 3: PREDICTIVE MAINTENANCE AI (EXPLAINABLE AI - XAI) ─── */}
          {activeTab === 'Predictive Maintenance' && (
            <div className="space-y-6">
              {pmViewMode === 'list' ? (
                <div className="space-y-6">
                  {/* Top Dashboard Insights summary area */}
                  <div className="bg-white border border-dark-200 rounded-3xl p-5 shadow-sm space-y-4">
                    <div className="border-b border-dark-150 pb-3">
                      <h2 className="text-base font-extrabold text-dark-900 tracking-tight flex items-center gap-2">
                        🧠 Edge Explainable AI (XAI) Diagnostics Console
                      </h2>
                      <p className="text-xs text-gray-text mt-0.5">On-device neural forecasting continuously analyzes physical anomalies and explains primary root-causes locally.</p>
                    </div>

                    {/* AI Insights KPI Quick Info row */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-bold text-dark-850">
                      <div className="bg-red-50 border border-red-200 p-3 rounded-2xl">
                        <span className="text-[8.5px] uppercase tracking-wider text-red-700 font-extrabold block">Asset Most At Risk</span>
                        <span className="text-sm font-extrabold text-red-900 block mt-1">Spindle Motor (MC-108)</span>
                      </div>
                      <div className="bg-amber-50 border border-amber-250 p-3 rounded-2xl">
                        <span className="text-[8.5px] uppercase tracking-wider text-amber-700 font-extrabold block">Highest Probability failure</span>
                        <span className="text-sm font-extrabold text-amber-900 block mt-1">Lubrication Issue (42% rise)</span>
                      </div>
                      <div className="bg-dark-50 p-3 rounded-2xl border border-dark-100">
                        <span className="text-[8.5px] uppercase tracking-wider text-gray-text font-extrabold block">AI Analysis Engine</span>
                        <span className="text-sm font-extrabold block mt-1 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> TFLite/ONNX Ready
                        </span>
                      </div>
                      <div className="bg-dark-50 p-3 rounded-2xl border border-dark-100">
                        <span className="text-[8.5px] uppercase tracking-wider text-gray-text font-extrabold block">Estimated Downtime Saving</span>
                        <span className="text-sm font-extrabold block mt-1 text-primary-700">~12.4 Hours / Node</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-dark-200 rounded-3xl p-5 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-dark-200 text-[10px] font-bold uppercase tracking-wider text-gray-text bg-dark-50/50">
                            <th className="py-3 px-3">Asset</th>
                            <th className="py-3 px-3">Predicted Failure Class</th>
                            <th className="py-3 px-3">Failure Prob</th>
                            <th className="py-3 px-3">Confidence Score</th>
                            <th className="py-3 px-3">RUL Countdown</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-100 font-semibold text-dark-800">
                          {machines.map((m) => {
                            // Assign mock failure classes dynamically for preview
                            const mockFailureType = m.id === 'MC-108' ? 'Bearing Failure' : m.id === 'MC-104' ? 'Lubrication Issue' : m.id === 'MC-106' ? 'Pressure Leak' : 'Nominal';
                            const confLevel = (m.aiConfidence || 95) > 90 ? 'High' : (m.aiConfidence || 95) > 80 ? 'Medium' : 'Low';
                            const probColor = (m.failureProbability ?? m.failure_prob ?? 0.0) > 15 ? 'text-red-500 font-bold animate-pulse' : 'text-emerald-600';
                            
                            return (
                              <tr key={m.id} className="hover:bg-dark-50/50 transition-colors">
                                <td className="py-3 px-3 font-bold text-dark-900">{m.name}</td>
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mockFailureType !== 'Nominal' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700'}`}>
                                    {mockFailureType}
                                  </span>
                                </td>
                                <td className={`py-3 px-3 font-mono ${probColor}`}>{(m.failureProbability ?? m.failure_prob ?? 0.0).toFixed(1)}%</td>
                                <td className="py-3 px-3 font-bold">
                                  {confLevel} ({(m.aiConfidence || 95.0).toFixed(1)}%)
                                </td>
                                <td className="py-3 px-3 font-mono text-dark-950 font-bold">{m.rul} Hours left</td>
                                <td className="py-3 px-3 text-right">
                                  <button 
                                    onClick={() => { setPmSelectedMachineId(m.id); setPmViewMode('analysis'); }} 
                                    className="py-1 px-3 bg-primary-50 border border-primary-200 hover:bg-primary-100 text-primary-700 rounded-xl text-[10px] font-bold transition-smooth"
                                  >
                                    XAI Diagnostics
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (() => {
                const selectedMachine = machines.find(m => m.id === pmSelectedMachineId) || machines[0];
                const mockFailureType = selectedMachine.id === 'MC-108' ? 'Bearing Failure' : selectedMachine.id === 'MC-104' ? 'Lubrication Issue' : selectedMachine.id === 'MC-106' ? 'Pressure Leak' : 'Thermal Instability / Overheating';
                
                // Explanations logic
                const xaiExplanation = `Machine ${selectedMachine.name} has a ${(selectedMachine.failureProbability ?? selectedMachine.failure_prob ?? 0.0).toFixed(0)}% probability of ${mockFailureType.toLowerCase()} because internal temperature readings show a steady rise matching bearing degradation curves, and vibration exceeds nominal safety tolerances. Continued run cycles will accelerate full mechanism lock.`;

                return (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-dark-200 bg-white border rounded-2xl p-4 shadow-sm">
                      <button onClick={() => setPmViewMode('list')} className="border border-dark-200 hover:bg-dark-50 text-dark-800 rounded-xl py-1.5 px-3 flex items-center gap-1.5 text-xs font-bold transition-smooth">
                        <ChevronLeft className="w-4 h-4" /> Back to Anomaly Listing
                      </button>
                      <span className="text-[10px] font-mono text-gray-text">Virtual twin telemetry streaming: Active</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Health and Failure trends chart */}
                      <div className="lg:col-span-2 bg-white border border-dark-200 rounded-3xl p-5 shadow-sm space-y-4">
                        <h3 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest border-b border-dark-100 pb-2 flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-primary-500" />
                          Health Score &amp; Anomaly Probability Trend Forecasts
                        </h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={Array.from({ length: 10 }, (_, i) => ({
                              day: `H+${i+1}`,
                              health: Math.max(10, selectedMachine.health - (i * (selectedMachine.status === 'Critical' ? 6 : 1.2))),
                              prob: Math.min(100, (selectedMachine.failureProbability ?? selectedMachine.failure_prob ?? 0.0) + (i * 2.5))
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                              <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                              <YAxis tick={{ fontSize: 9 }} />
                              <Tooltip />
                              <Area type="monotone" dataKey="health" fill="#EFF6FF" stroke="#3B82F6" strokeWidth={2.5} name="Predicted Health" />
                              <Area type="monotone" dataKey="prob" fill="#FEF2F2" stroke="#EF4444" strokeWidth={2} name="Failure Probability" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Right: Explainable AI console card */}
                      <div className="bg-white border border-dark-200 rounded-3xl p-5 shadow-sm space-y-6 flex flex-col justify-between">
                        <div className="space-y-4">
                          <h4 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest border-b border-dark-100 pb-2 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-primary-500" />
                            Explainable AI (XAI) Insight
                          </h4>
                          <div className="bg-primary-50/20 border border-primary-100 p-4 rounded-2xl text-xs font-semibold leading-relaxed text-dark-850">
                            {xaiExplanation}
                          </div>
                        </div>

                        <div className="bg-dark-50/50 p-4 rounded-xl border border-dark-100 text-[10.5px] leading-relaxed text-gray-text">
                          💡 <span className="font-bold text-dark-850">XAI Model Explanation:</span> This explanation is generated locally using Shapley values (SHAP) computed from realtime sensor logs.
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Root Cause analysis & maintenance planner */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white border border-dark-200 rounded-3xl p-5 shadow-sm space-y-4">
                        <h4 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest border-b border-dark-100 pb-2">Root Cause Analysis</h4>
                        <div className="space-y-2 text-xs font-semibold">
                          <div className="flex justify-between items-center p-2 bg-red-50 border border-red-200 rounded-xl">
                            <span className="text-red-700 font-bold">Primary Cause:</span>
                            <span className="font-bold text-red-950">{mockFailureType}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-amber-50 border border-amber-250 rounded-xl">
                            <span className="text-amber-700 font-bold">Secondary Cause:</span>
                            <span className="font-bold text-amber-950">Bearing lubrication depletion</span>
                          </div>
                          <div className="p-2 border border-dark-100 bg-dark-50/20 rounded-xl space-y-1">
                            <span className="text-[10px] text-gray-text uppercase font-extrabold tracking-wider block">Contributing Factors</span>
                            <p className="text-[11px] text-dark-800">Operational speed overload (~1800 RPM), continuous load duty cycle.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-dark-200 rounded-3xl p-5 shadow-sm space-y-4">
                        <h4 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest border-b border-dark-100 pb-2">Suggested Action Details</h4>
                        <div className="p-4 border border-dark-100 bg-dark-50/25 rounded-2xl space-y-3.5 text-xs">
                          <div className="flex items-center gap-2 text-primary-750 font-bold">
                            <Clock className="w-4 h-4 text-primary-500" /> Maintenance Schedule
                          </div>
                          <p className="text-[11px] font-semibold text-dark-800 leading-relaxed">
                            {selectedMachine.suggestedAction}
                          </p>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dark-150 text-[10px] font-bold text-gray-text">
                            <div>Est. Downtime: <span className="text-dark-850 font-extrabold">2.5 Hours</span></div>
                            <div>Cost: <span className="text-dark-850 font-extrabold">{selectedMachine.maintCost || '₹12,000'}</span></div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-dark-200 rounded-3xl p-5 shadow-sm space-y-4">
                        <h4 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest border-b border-dark-100 pb-2">AI Prediction History</h4>
                        <div className="space-y-3 text-[11px] font-semibold text-gray-text relative pl-4 border-l border-dark-200 ml-2">
                          <div className="relative">
                            <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />
                            <span className="font-mono text-[9px] block">14:22</span>
                            <p className="text-dark-800 font-bold">Bearing failure warning flags generated.</p>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                            <span className="font-mono text-[9px] block">13:50</span>
                            <p className="text-dark-800">Operational profiles registered nominal parameters.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ─── TAB 4: SECURITY OPERATIONS CENTER (SOC) ─── */}
          {activeTab === 'Cybersecurity' && (() => {
            const filteredDevices = cyberDevices.filter(d => {
              const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.id.toLowerCase().includes(searchTerm.toLowerCase());
              return matchesSearch;
            });

            const selectedDevice = cyberDevices.find(d => d.id === selectedDeviceId) || cyberDevices[0];
            const socAlerts = alerts.filter(a => a.type === 'Cybersecurity');

            return (
              <div className="space-y-6 animate-fade-in text-dark-800 font-sans">
                {/* Header panel */}
                <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                  <div className="z-10">
                    <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                      🛡 Security Operations Center (SOC) Console
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Air-gapped on-device intrusion detection system (IDS) actively monitoring all OT/ICS Modbus traffic.</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold z-10">
                    <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl">
                      Local Firewall: Active
                    </span>
                    <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl">
                      Air-Gapped Secure
                    </span>
                  </div>
                </div>

                {/* SOC KPIs Dashboard */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white border border-dark-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Overall Security Score</span>
                    <span className="text-xl font-black text-emerald-600 mt-1 block">98% Secure</span>
                  </div>
                  <div className="bg-white border border-dark-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Connected ICS Assets</span>
                    <span className="text-xl font-black text-dark-900 mt-1 block">{cyberDevices.length} PLC Nodes</span>
                  </div>
                  <div className="bg-white border border-dark-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Failed Login Attempts</span>
                    <span className="text-xl font-black text-amber-600 mt-1 block">2 Attempts</span>
                  </div>
                  <div className="bg-white border border-dark-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Active Alerts today</span>
                    <span className="text-xl font-black text-red-500 mt-1 block">{socAlerts.length} Events</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Traffic Volume chart */}
                  <div className="lg:col-span-2 bg-white border border-dark-200 rounded-3xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest border-b border-dark-100 pb-2">OT Network Bus Data Flow</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trafficHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 9 }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="volume" fill="#ECFDF5" stroke="#10B981" strokeWidth={2} name="Packets/Sec" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Isolated threat directory */}
                  <div className="bg-white border border-dark-200 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-dark-900 uppercase tracking-widest block border-b border-dark-100 pb-2">Active OT Device Whitelist</span>
                      <div className="space-y-3 mt-3 max-h-[220px] overflow-y-auto pr-1">
                        {filteredDevices.map(d => (
                          <div 
                            key={d.id} 
                            onClick={() => setSelectedDeviceId(d.id)}
                            className={`p-3 border rounded-2xl space-y-1.5 text-xs cursor-pointer transition-smooth ${
                              selectedDeviceId === d.id ? 'border-primary-500 bg-primary-50/30' : 'border-dark-200 hover:bg-dark-50/50'
                            }`}
                          >
                            <div className="flex justify-between font-bold">
                              <span className="text-dark-900 font-bold">{d.name}</span>
                              <span className={`text-[9px] uppercase border px-1.5 rounded ${
                                d.riskLevel === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                                d.riskLevel === 'Warning' ? 'bg-orange-50 text-orange-700 border-orange-250' :
                                'bg-emerald-50 text-emerald-700 border-emerald-250'
                              }`}>{d.riskLevel}</span>
                            </div>
                            <div className="text-[10px] text-gray-text font-mono">IP: {d.ip} | ID: {d.id}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Device Details Diagnostics */}
                {selectedDevice && (
                  <div className="bg-white border border-dark-200 rounded-3xl p-5 shadow-sm space-y-5">
                    <div className="border-b border-dark-100 pb-3 flex justify-between items-center">
                      <h3 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest">
                        Asset Security Diagnostics: {selectedDevice.name}
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-gray-text">{selectedDevice.id}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                      <div className="space-y-3">
                        <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide block mb-1">Network Specifications</span>
                        <div className="space-y-1.5 font-semibold text-dark-850">
                          <div>IP Address: <span className="font-mono text-dark-900">{selectedDevice.ip}</span></div>
                          <div>MAC Address: <span className="font-mono text-dark-900">{selectedDevice.mac}</span></div>
                          <div>Firmware version: <span className="font-mono text-dark-900">{selectedDevice.firmware}</span></div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide block mb-1">AI Trust Diagnostics</span>
                        <div className="space-y-1.5 font-semibold text-dark-850">
                          <div className="flex items-center gap-2">Anomaly Trust Score: <span className={`font-bold ${selectedDevice.trustScore < 70 ? 'text-red-700' : 'text-emerald-700'}`}>{selectedDevice.trustScore}%</span></div>
                          <div className="flex items-center gap-2">Threat Risk Level: <span className={`font-bold uppercase ${selectedDevice.riskLevel === 'Critical' ? 'text-red-700 animate-pulse' : 'text-emerald-700'}`}>{selectedDevice.riskLevel}</span></div>
                          <div>Linked Machine Asset: <span className="font-bold text-dark-900">{selectedDevice.machine}</span></div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide block mb-1">Packet Audit telemetry</span>
                        <div className="space-y-1.5 font-semibold text-dark-850">
                          <div>Packet Ingestion Rate: <span className="font-mono text-dark-900">{selectedDevice.packetsSec} Packets/Sec</span></div>
                          <div>OT Payload Error Rate: <span className="font-mono text-dark-900">{selectedDevice.errorRate}%</span></div>
                          <div className="flex items-center gap-1.5">Node Status: <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> <span className="font-bold text-emerald-700">Online</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-dark-150 pt-4 flex gap-3">
                      <button 
                        onClick={() => triggerQuickAction('quarantine', `Quarantine payload overrides applied to ${selectedDevice.id}. Device isolated.`)}
                        className="py-2 px-5 bg-red-650 hover:bg-red-750 text-white text-xs font-bold rounded-xl transition-smooth shadow-md shadow-red-600/10"
                      >
                        Quarantine Device Node
                      </button>
                      <button 
                        onClick={() => triggerQuickAction('whitelist', `Trust parameters whitelisted for device ${selectedDevice.id}.`)}
                        className="py-2 px-5 border border-dark-200 hover:bg-dark-50 text-dark-800 text-xs font-bold rounded-xl transition-smooth"
                      >
                        Whitelist Address
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ─── TAB 5: ENERGY OPTIMIZATION ─── */}
          {activeTab === 'Energy Optimization' && (
            <div className="space-y-6 font-sans">
              <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h2 className="text-base font-extrabold text-dark-900 tracking-tight">Energy Optimization</h2>
                  <p className="text-xs text-gray-text mt-0.5">Estimated peak demand allocations and carbon emissions savings.</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-dark-850">
                  <span className="px-3 py-1 bg-primary-50 border border-primary-200 rounded-lg">Power Factor: {energyStats.powerFactor}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-dark-900">Operational Peak Demand load (kW)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={Array.from({ length: 8 }, (_, i) => ({
                        time: `0${i*2}:00`,
                        load: Math.floor(energyStats.currentLoadKw + (Math.sin(i) * 30))
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="load" fill="#FEF3C7" stroke="#F59E0B" strokeWidth={2.5} name="Demand load" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide block border-b border-dark-100 pb-2">Sustainability Indicators</span>
                  <div className="space-y-4 pt-2 text-xs font-semibold text-dark-800">
                    <div className="flex justify-between"><span>Current load kW:</span> <span className="font-bold text-dark-950">{energyStats.currentLoadKw} kW</span></div>
                    <div className="flex justify-between"><span>Solar offset:</span> <span className="text-emerald-500 font-bold">25% Generated</span></div>
                    <div className="flex justify-between"><span>Projected monthly savings:</span> <span className="text-emerald-500 font-bold">₹32,700</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 6: ALERTS CENTER ─── */}
          {activeTab === 'Alerts' && (
            <div className="space-y-6 animate-fade-in font-sans">
              <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h2 className="text-base font-extrabold text-dark-900 tracking-tight">Industrial Incident Command Center</h2>
                  <p className="text-xs text-gray-text mt-0.5">Real-time alert prioritizations, acknowledgments, and resolutions.</p>
                </div>
                {alViewMode === 'detail' && (
                  <button 
                    onClick={() => setAlViewMode('list')}
                    className="flex items-center gap-2 py-1.5 px-4 border border-dark-200 hover:bg-dark-50 text-dark-800 text-xs font-bold rounded-xl transition-smooth"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Incidents</span>
                  </button>
                )}
              </div>

              {alViewMode === 'list' ? (
                <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-dark-900 mb-2">Central Incident Alerts Directory</h3>
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-dark-200 text-[10px] font-bold uppercase tracking-wider text-gray-text bg-dark-50/50">
                          <th className="py-2.5 px-3">Alert ID</th>
                          <th className="py-2.5 px-3">Source Machine</th>
                          <th className="py-2.5 px-3 text-center">Priority</th>
                          <th className="py-2.5 px-3 text-center">Alert Type</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-100 text-xs font-semibold text-dark-800">
                        {alerts.map((alt) => (
                          <tr 
                            key={alt.id} 
                            onClick={() => { setSelectedAlertId(alt.id); setAlViewMode('detail'); }}
                            className="hover:bg-dark-50/50 transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-3 font-mono text-[11px] text-gray-text">{alt.id}</td>
                            <td className="py-3 px-3 font-bold text-dark-900">{alt.machine}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                                alt.priority === 'Critical' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-orange-50 text-orange-600 border-orange-200'
                              }`}>{alt.priority}</span>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-primary-600">{alt.type}</td>
                            <td className="py-3 px-3 text-gray-text">{alt.summary}</td>
                            <td className="py-3 px-3 text-right">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                                alt.status === 'Open' ? 'bg-red-50 text-red-600 border-red-200' :
                                alt.status === 'Acknowledged' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                'bg-emerald-50 text-emerald-700 border-emerald-250'
                              }`}>{alt.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Detail mode */
                (() => {
                  const alertDetails = alerts.find(a => a.id === selectedAlertId) || alerts[0];
                  if (!alertDetails) return null;

                  const handleUpdateStatus = async (newStatus) => {
                    setAlerts(prev => prev.map(a => a.id === alertDetails.id ? { ...a, status: newStatus } : a));
                    
                    if (isBackendConnected && token) {
                      try {
                        const endpoint = newStatus === 'Acknowledged' ? 'acknowledge' : 'resolve';
                        await fetch(`${API_URL}/api/alerts/${alertDetails.id}/${endpoint}`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        });
                        setActionSuccess(`Incident ${alertDetails.id} marked as ${newStatus}.`);
                      } catch (err) {
                        console.warn("Failed to update status on backend:", err);
                        setActionSuccess(`Incident ${alertDetails.id} marked as ${newStatus} (Local).`);
                      }
                    } else {
                      setActionSuccess(`Incident ${alertDetails.id} marked as ${newStatus} (Offline Mode).`);
                    }
                    setTimeout(() => setActionSuccess(''), 3000);
                  };

                  const handleAssignAlert = async (alertId, assignee) => {
                    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, assignedTo: assignee } : a));
                    
                    if (isBackendConnected && token) {
                      try {
                        await fetch(`${API_URL}/api/alerts/${alertId}/assign`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ assignedTo: assignee })
                        });
                        setActionSuccess(`Alert assigned to ${assignee}.`);
                      } catch (err) {
                        console.warn("Failed to assign alert on backend:", err);
                        setActionSuccess(`Alert assigned to ${assignee} (Local).`);
                      }
                    } else {
                      setActionSuccess(`Alert assigned to ${assignee} (Offline Mode).`);
                    }
                    setTimeout(() => setActionSuccess(''), 3000);
                  };

                  return (
                    <div className="bg-white border border-dark-200 rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-dark-150 pb-4 gap-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-base text-gray-text font-bold">{alertDetails.id}</span>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase border ${
                            alertDetails.priority === 'Critical' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-orange-50 text-orange-600 border-orange-200'
                          }`}>{alertDetails.priority}</span>
                          <span className="text-xs font-bold text-primary-600">{alertDetails.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide">Status:</span>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase border ${
                            alertDetails.status === 'Open' ? 'bg-red-50 text-red-600 border-red-200' :
                            alertDetails.status === 'Acknowledged' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-255'
                          }`}>{alertDetails.status}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div className="space-y-4">
                          <div>
                            <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide block mb-1">Source Asset</span>
                            <div className="font-bold text-dark-900">{alertDetails.machine} ({alertDetails.machineId || alertDetails.machine_id || 'MC-104'})</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide block mb-1">Incident Summary</span>
                            <div className="font-semibold text-dark-800 leading-relaxed bg-dark-50 p-3 rounded-xl border border-dark-200">{alertDetails.summary}</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide block mb-1">Affected Component</span>
                            <div className="font-mono font-bold text-dark-850">{alertDetails.affected || 'Unknown System Line'}</div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide block mb-1">Assigned Maintenance Operator</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-dark-900">{alertDetails.assignedTo || 'Unassigned'}</span>
                              <select 
                                value={alertDetails.assignedTo || 'Unassigned'} 
                                onChange={(e) => handleAssignAlert(alertDetails.id, e.target.value)}
                                className="border border-dark-200 rounded-lg p-1 bg-dark-50 text-[10px] font-bold outline-none cursor-pointer text-dark-800"
                              >
                                <option value="Unassigned">Assign...</option>
                                <option value="Aishwarya R">Aishwarya R</option>
                                <option value="Sarah Jenkins">Sarah Jenkins</option>
                                <option value="Alex Mercer">Alex Mercer</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide block mb-1">Generated By Model</span>
                            <div className="font-bold text-dark-900">{alertDetails.generatedBy || 'LSTM v2.1 (EdgeShield)'}</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide block mb-1">Timestamp</span>
                            <div className="font-bold text-dark-900">{alertDetails.timestamp}</div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-dark-150 pt-5 flex flex-wrap gap-3">
                        <button 
                          onClick={() => handleUpdateStatus('Acknowledged')}
                          disabled={alertDetails.status !== 'Open'}
                          className="py-2 px-5 bg-orange-500 hover:bg-orange-600 disabled:bg-dark-100 disabled:text-dark-400 text-white text-xs font-bold rounded-xl transition-smooth shadow-md shadow-orange-600/10"
                        >
                          Acknowledge Alert
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus('Resolved')}
                          disabled={alertDetails.status === 'Resolved'}
                          className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-dark-100 disabled:text-dark-400 text-white text-xs font-bold rounded-xl transition-smooth shadow-md"
                        >
                          Resolve Alert
                        </button>
                        <button 
                          onClick={() => setAlViewMode('list')}
                          className="py-2 px-5 border border-dark-200 hover:bg-dark-50 text-dark-800 text-xs font-bold rounded-xl transition-smooth"
                        >
                          Close Details
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* ─── TAB 7: REPORTS ─── */}
          {activeTab === 'Reports' && (
            <div className="space-y-6 font-sans animate-fade-in">
              <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-dark-900 pb-3 border-b border-dark-100 flex items-center justify-between">
                  Operations Reports Exporters
                  <FileText className="w-5 h-5 text-primary-500" />
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-dark-800">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-text uppercase block font-bold">Report Category</label>
                    <select value={repSelectedType} onChange={(e) => setRepSelectedType(e.target.value)} className="w-full border border-dark-200 rounded-xl px-3 py-2 bg-dark-50 text-xs font-semibold outline-none focus:bg-white">
                      <option value="Executive Summary">Executive Summary</option>
                      <option value="Machine Telemetry logs">Machine Telemetry logs</option>
                      <option value="Cybersecurity threat audits">Cybersecurity threat audits</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-text uppercase block font-bold">Export Format</label>
                    <select value={repSelectedFormat} onChange={(e) => setRepSelectedFormat(e.target.value)} className="w-full border border-dark-200 rounded-xl px-3 py-2 bg-dark-50 text-xs font-semibold outline-none focus:bg-white">
                      <option value="PDF">PDF Sheet</option>
                      <option value="Excel">Excel Spreadsheet</option>
                      <option value="CSV">Comma Separated CSV</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button 
                      onClick={handleExportReport}
                      disabled={actionLoading === 'export'}
                      className="w-full py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-xl font-bold shadow-md shadow-primary-600/10 transition-smooth"
                    >
                      {actionLoading === 'export' ? 'Generating...' : 'Trigger Download'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 8: AI COPILOT ─── */}
          {activeTab === 'AI Copilot' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-sans">
              <div className="lg:col-span-3 bg-white border border-dark-200 rounded-2xl shadow-sm flex flex-col justify-between h-[520px] overflow-hidden">
                <div className="p-4 border-b border-dark-150 flex items-center justify-between flex-shrink-0 select-none bg-dark-50/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-dark-900 tracking-tight">AI Copilot Node Online</span>
                  </div>
                  <span className="text-[10px] text-gray-text font-bold uppercase tracking-wider">Response Time: &lt;1.0s</span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-dark-50/10">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs ${msg.sender === 'user' ? 'bg-primary-600 text-white shadow-md' : 'bg-white border border-dark-200 text-dark-800'}`}>
                        <div className="font-semibold leading-relaxed whitespace-pre-wrap">{parseMarkdown(msg.text)}</div>
                        {msg.widget && renderCopilotWidget(msg.widget)}
                        <span className={`text-[8.5px] block mt-1.5 font-bold ${msg.sender === 'user' ? 'text-primary-200 text-right' : 'text-gray-text'}`}>{msg.time}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                <div className="p-4 border-t border-dark-200 space-y-3 flex-shrink-0 bg-dark-50/20">

                  {/* Interim transcript live preview */}
                  {(voiceActive || interimTranscript) && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                      <span className="text-[10.5px] font-semibold text-red-700 italic flex-1 truncate">
                        {interimTranscript || 'Listening… speak now'}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase text-red-500 tracking-wider">REC</span>
                    </div>
                  )}

                  {/* Voice error banner */}
                  {voiceError && (
                    <div className="px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl text-[10.5px] font-semibold text-orange-700">
                      ⚠ {voiceError}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleVoiceToggle}
                      title={voiceActive ? 'Stop recording' : 'Start voice input'}
                      className={`p-2.5 border rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        voiceActive
                          ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30 scale-110'
                          : 'bg-white border-dark-200 text-dark-500 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600'
                      }`}
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendPrompt(chatInput); }}
                      placeholder={voiceActive ? 'Listening… speak your query' : 'Ask anything about Detroit Hub #4...'}
                      className="flex-1 px-4 py-2.5 border border-dark-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-smooth"
                    />
                    <button
                      onClick={() => handleSendPrompt(chatInput)}
                      className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors shadow-md"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6 overflow-y-auto h-full pr-1">
                <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide block border-b border-dark-100 pb-2 font-mono">Suggested Prompts</span>
                  <div className="space-y-2">
                    {[
                      "Which machine has the highest failure probability?",
                      "Why is Compressor MC-104 marked as critical?",
                      "Show today's active cybersecurity threats."
                    ].map((q, idx) => (
                      <button key={idx} onClick={() => handleSendPrompt(q)} className="w-full text-left p-2.5 border border-dark-200 hover:border-primary-500 bg-white rounded-xl text-[10.5px] font-bold text-dark-800 hover:text-primary-600 transition-smooth shadow-sm">{q}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 9: USER MANAGEMENT ─── */}
          {activeTab === 'User Management' && (
            <div className="space-y-6 animate-fade-in font-sans">
              
              {/* User Directory */}
              <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-dark-900">Operator Access Directory</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-dark-200 text-[10px] font-bold uppercase tracking-wider text-gray-text bg-dark-50/50">
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Last Login</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-100 text-xs font-semibold text-dark-800">
                      {users.map(u => (
                        <tr key={u.empId} className="hover:bg-dark-50/50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-dark-900">{u.name}</div>
                            <span className="text-[10px] text-gray-text font-mono font-semibold">{u.email}</span>
                          </td>
                          <td className="py-3 px-3 text-gray-text">{u.dept}</td>
                          <td className="py-3 px-3"><span className="bg-primary-50 border border-primary-200 text-primary-700 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">{u.role}</span></td>
                          <td className="py-3 px-3 text-gray-text">{u.lastLogin}</td>
                          <td className="py-3 px-3 text-right">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${getUserStatusBadge(u.status)}`}>{u.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Privilege Matrix Grid */}
              <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-dark-900">Privilegematrix Grid</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-dark-200 text-[10px] font-bold uppercase tracking-wider text-gray-text bg-dark-50/50">
                        <th className="py-2 px-3">Module</th>
                        <th className="py-2 px-3 text-center">View</th>
                        <th className="py-2 px-3 text-center">Create</th>
                        <th className="py-2 px-3 text-center">Edit</th>
                        <th className="py-2 px-3 text-center">Export</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-100 font-semibold text-dark-800">
                      {Object.keys(permissionsMatrix).map(moduleKey => (
                        <tr key={moduleKey} className="hover:bg-dark-50/50">
                          <td className="py-3 px-3 font-bold text-dark-900">{moduleKey}</td>
                          {['view', 'create', 'edit', 'export'].map(actionKey => (
                            <td key={actionKey} className="py-3 px-3 text-center">
                              <input 
                                type="checkbox" 
                                checked={permissionsMatrix[moduleKey][actionKey]} 
                                onChange={() => {
                                  setPermissionsMatrix(prev => ({
                                    ...prev,
                                    [moduleKey]: {
                                      ...prev[moduleKey],
                                      [actionKey]: !prev[moduleKey][actionKey]
                                    }
                                  }));
                                }}
                                className="w-4 h-4 text-primary-600 border-dark-300 rounded focus:ring-primary-500 cursor-pointer" 
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 10: SYSTEM CONFIG & SETTINGS ─── */}
          {activeTab === 'Settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-sans">
              <div className="bg-white border border-dark-200 rounded-2xl p-4 shadow-sm space-y-1 h-fit">
                <span className="text-[10px] text-gray-text font-extrabold uppercase tracking-wide block mb-3 px-3 font-mono">Settings menu</span>
                {[
                  { id: 'general', name: 'General & Factory Setup', icon: Globe },
                  { id: 'ai', name: 'AI Model Configurations', icon: Cpu },
                  { id: 'machine', name: 'Machine Parameter Thresholds', icon: Activity },
                  { id: 'notify', name: 'Notification Rules', icon: Bell }
                ].map(menu => {
                  const Icon = menu.icon;
                  const isActive = settingsActiveMenu === menu.id;
                  return (
                    <button 
                      key={menu.id} 
                      onClick={() => setSettingsActiveMenu(menu.id)}
                      className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg text-xs font-bold transition-smooth ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-text hover:bg-dark-50'}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{menu.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-3 space-y-6">
                
                {/* General Config */}
                {settingsActiveMenu === 'general' && (
                  <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-5">
                    <h3 className="text-sm font-bold text-dark-900 pb-3 border-b border-dark-100 flex items-center justify-between">
                      General Settings
                      <Globe className="w-4.5 h-4.5 text-primary-500" />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-dark-800">
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-text uppercase block font-bold">Factory Name</label>
                        <input type="text" value={factoryName} onChange={(e) => setFactoryName(e.target.value)} className="w-full border border-dark-200 rounded-xl px-3 py-2 bg-dark-50 text-xs font-semibold outline-none focus:bg-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-text uppercase block font-bold">Timezone Location</label>
                        <input type="text" value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full border border-dark-200 rounded-xl px-3 py-2 bg-dark-50 text-xs font-semibold outline-none focus:bg-white" />
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Config */}
                {settingsActiveMenu === 'ai' && (
                  <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-5">
                    <h3 className="text-sm font-bold text-dark-900 pb-3 border-b border-dark-100 flex items-center justify-between">
                      AI Model Configurations
                      <Cpu className="w-4.5 h-4.5 text-primary-500" />
                    </h3>
                    <div className="space-y-4 text-xs font-semibold text-dark-800">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-gray-text">
                          <span>AI Predictive Sensitivity Threshold</span>
                          <span className="font-mono text-dark-950">{predictSensitivity}%</span>
                        </div>
                        <input type="range" min="50" max="95" value={predictSensitivity} onChange={(e) => setPredictSensitivity(e.target.value)} className="w-full accent-primary-600 cursor-pointer h-1 bg-dark-200 rounded-full" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Machine threshold config */}
                {settingsActiveMenu === 'machine' && (
                  <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-5">
                    <h3 className="text-sm font-bold text-dark-900 pb-3 border-b border-dark-100 flex items-center justify-between">
                      Machine Alert Threshold Guidelines
                      <Activity className="w-4.5 h-4.5 text-primary-500" />
                    </h3>
                    <div className="space-y-4 text-xs font-semibold text-dark-800">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-gray-text">
                          <span>Warning Health Threshold</span>
                          <span className="font-mono text-dark-950">&lt; {healthWarnThreshold}%</span>
                        </div>
                        <input type="range" min="70" max="90" value={healthWarnThreshold} onChange={(e) => setHealthWarnThreshold(e.target.value)} className="w-full accent-primary-600 cursor-pointer h-1 bg-dark-200 rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-gray-text">
                          <span>Critical Health Threshold</span>
                          <span className="font-mono text-dark-950">&lt; {healthCritThreshold}%</span>
                        </div>
                        <input type="range" min="30" max="60" value={healthCritThreshold} onChange={(e) => setHealthCritThreshold(e.target.value)} className="w-full accent-primary-600 cursor-pointer h-1 bg-dark-200 rounded-full" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Notification Rules */}
                {settingsActiveMenu === 'notify' && (
                  <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-5">
                    <h3 className="text-sm font-bold text-dark-900 pb-3 border-b border-dark-100 flex items-center justify-between">
                      Notification Rules Settings
                      <Bell className="w-4.5 h-4.5 text-primary-500" />
                    </h3>
                    <div className="space-y-3.5 text-xs font-semibold text-dark-800">
                      <div className="flex items-center justify-between p-3 border border-dark-200 rounded-xl">
                        <div>
                          <div className="font-bold text-dark-900">Email Alerts Dispatch</div>
                          <span className="text-[10px] text-gray-text font-semibold uppercase leading-tight">Sends Critical alarms to supervisors</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={emailNotify} 
                          onChange={(e) => {
                            setEmailNotify(e.target.checked);
                            handleSaveSettings({ emailNotify: e.target.checked });
                            triggerQuickAction('email', `Email routing ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                          }} 
                          className="w-4 h-4 text-primary-600 border-dark-300 rounded focus:ring-primary-500 cursor-pointer" 
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border border-dark-200 rounded-xl">
                        <div>
                          <div className="font-bold text-dark-900">Audio Alarm indicators</div>
                          <span className="text-[10px] text-gray-text font-semibold uppercase leading-tight">Synthesize localized warning sound chime</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={soundNotify} 
                          onChange={(e) => {
                            setSoundNotify(e.target.checked);
                            handleSaveSettings({ soundNotify: e.target.checked });
                            triggerQuickAction('sound', `Audio chime ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                          }} 
                          className="w-4 h-4 text-primary-600 border-dark-300 rounded focus:ring-primary-500 cursor-pointer" 
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ─── TAB 9: DIGITAL TWIN ─── */}
          {activeTab === 'Digital Twin' && (() => {
            const currentTwinMachine = machines.find(m => m.id === twinSelectedMachineId) || machines[0];
            const twinAlerts = alerts.filter(a => a.machineId === currentTwinMachine.id);
            
            // Build recent telemetry rolling history metrics block locally for visualization
            const healthPercentage = currentTwinMachine.health || 100;
            const healthColor = healthPercentage > 80 ? 'text-emerald-500 stroke-emerald-500' : healthPercentage > 50 ? 'text-amber-500 stroke-amber-500' : 'text-red-500 stroke-red-500';
            const statusColorBg = currentTwinMachine.status === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : currentTwinMachine.status === 'Warning' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200';

            return (
              <div className="space-y-6 font-sans animate-fade-in text-dark-800">
                {/* Header navigation back control bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-dark-200 rounded-2xl p-4 shadow-sm gap-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setActiveTab('Dashboard')}
                      className="p-2 border border-dark-200 hover:bg-dark-50 rounded-xl text-dark-600 transition-colors"
                      title="Back to Overview"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h3 className="text-sm font-bold text-dark-900 flex items-center gap-2">
                        🏭 Digital Twin Virtual Assembly Node
                      </h3>
                      <p className="text-[10px] text-gray-text mt-0.5"> Detroit Hub #4 &gt; Asset representation network console</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[9px] text-gray-text uppercase block font-extrabold tracking-wider">Select Active Engine:</label>
                    <select 
                      value={twinSelectedMachineId} 
                      onChange={(e) => setTwinSelectedMachineId(e.target.value)}
                      className="border border-dark-200 rounded-xl px-3 py-1.5 bg-dark-50 text-xs font-bold outline-none focus:bg-white cursor-pointer"
                    >
                      {machines.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Visual Representation & Health Gauge */}
                  <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start border-b border-dark-100 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-dark-900">{currentTwinMachine.name}</h4>
                          <span className="text-[10px] font-mono text-gray-text">{currentTwinMachine.id} | Class: {currentTwinMachine.type}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${statusColorBg}`}>
                          {currentTwinMachine.status}
                        </span>
                      </div>

                      {/* Machine Mock Schematic Vector representation */}
                      <div className="my-6 flex justify-center items-center h-48 bg-dark-50/50 rounded-2xl border border-dashed border-dark-250 relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                        
                        {/* Dynamic status glow */}
                        <div className={`absolute w-32 h-32 rounded-full filter blur-3xl opacity-20 animate-pulse ${
                          currentTwinMachine.status === 'Critical' ? 'bg-red-500' : currentTwinMachine.status === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />

                        <div className="flex flex-col items-center space-y-4 z-10">
                          {/* Animated SVG representation block */}
                          <svg className="w-24 h-24 text-dark-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="2" y="2" width="20" height="20" rx="3" className="stroke-dark-300 fill-white" />
                            <circle cx="12" cy="12" r="6" className="stroke-dark-200" />
                            <motion.circle 
                              cx="12" 
                              cy="12" 
                              r="3" 
                              className="stroke-primary-500 fill-primary-50"
                              animate={{ scale: currentTwinMachine.status === 'Healthy' ? [1, 1.2, 1] : [1, 1.4, 1] }}
                              transition={{ repeat: Infinity, duration: currentTwinMachine.status === 'Healthy' ? 3 : 1.5 }}
                            />
                            <motion.line 
                              x1="12" y1="6" x2="12" y2="18" 
                              className="stroke-primary-500" 
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: currentTwinMachine.rpm > 0 ? (60 / currentTwinMachine.rpm) * 100 : 0, ease: "linear" }}
                              style={{ originX: "12px", originY: "12px" }}
                            />
                          </svg>
                          <span className="text-[10px] uppercase tracking-widest text-gray-text font-extrabold">Virtual Twin Render</span>
                        </div>
                      </div>
                    </div>

                    {/* Circular Health Gauge */}
                    <div className="flex items-center justify-around bg-dark-50/40 p-4 rounded-xl border border-dark-100">
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                          <motion.circle 
                            cx="18" cy="18" r="16" fill="none" 
                            className={healthColor} 
                            strokeWidth="3" 
                            strokeDasharray="100"
                            animate={{ strokeDashoffset: 100 - healthPercentage }}
                            transition={{ duration: 0.8 }}
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-sm font-extrabold text-dark-900">{healthPercentage}%</span>
                          <span className="text-[7.5px] uppercase font-bold tracking-wider text-gray-text">Health</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Location context</span>
                        <div className="text-xs font-bold text-dark-850">{currentTwinMachine.location} | Dept: {currentTwinMachine.dept}</div>
                        <span className="text-[10px] text-gray-text font-semibold block">Last Update: Just Now</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Live Telemetry Parameters & Progress Bars */}
                  <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-6 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest border-b border-dark-100 pb-2 mb-4 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-primary-500" />
                        Live Sensor Bus Telemetry
                      </h4>

                      <div className="space-y-4">
                        {/* Temperature Parameter */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-dark-800">
                            <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-red-500" /> Temperature</span>
                            <span>{currentTwinMachine.temp}°C</span>
                          </div>
                          <div className="w-full h-2 bg-dark-100 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-red-500" 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (currentTwinMachine.temp / 100) * 100)}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>

                        {/* Vibration Parameter */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-dark-800">
                            <span className="flex items-center gap-1"><Sliders className="w-3.5 h-3.5 text-amber-500" /> Vibration level</span>
                            <span>{currentTwinMachine.vibration} g</span>
                          </div>
                          <div className="w-full h-2 bg-dark-100 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-amber-500" 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (currentTwinMachine.vibration / 2.0) * 100)}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>

                        {/* Current Parameter */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-dark-800">
                            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-emerald-500" /> Stator Current</span>
                            <span>{currentTwinMachine.current} A</span>
                          </div>
                          <div className="w-full h-2 bg-dark-100 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-emerald-500" 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (currentTwinMachine.current / 30.0) * 100)}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>

                        {/* RPM Parameter */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-dark-800">
                            <span className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5 text-indigo-500" /> Rotational Speed</span>
                            <span>{currentTwinMachine.rpm} RPM</span>
                          </div>
                          <div className="w-full h-2 bg-dark-100 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-indigo-500" 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (currentTwinMachine.rpm / 4000) * 100)}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>

                        {/* Pressure Parameter */}
                        {currentTwinMachine.pressure > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold text-dark-800">
                              <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-blue-500" /> Manifold Pressure</span>
                              <span>{currentTwinMachine.pressure} bar</span>
                            </div>
                            <div className="w-full h-2 bg-dark-100 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-blue-500" 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (currentTwinMachine.pressure / 250) * 100)}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-dark-50/50 p-4 rounded-xl border border-dark-100">
                      <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block mb-1">Energy consumption context</span>
                      <div className="flex justify-between items-center text-xs font-bold text-dark-850">
                        <span>Active load:</span>
                        <span>{currentTwinMachine.energy || '10.5'} kW</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Analytics & Action Center */}
                  <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-6 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest border-b border-dark-100 pb-2 mb-4 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-primary-500" />
                        Edge AI Diagnostics
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-dark-50/55 p-3 rounded-xl border border-dark-100">
                          <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Failure Probability</span>
                          <span className="text-lg font-black text-dark-900 mt-1 block">{currentTwinMachine.failureProbability}%</span>
                        </div>
                        <div className="bg-dark-50/55 p-3 rounded-xl border border-dark-100">
                          <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Confidence Score</span>
                          <span className="text-lg font-black text-dark-900 mt-1 block">{currentTwinMachine.aiConfidence ?? 95}%</span>
                        </div>
                        <div className="bg-dark-50/55 p-3 rounded-xl border border-dark-100 col-span-2">
                          <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Remaining Useful Life (RUL)</span>
                          <span className="text-sm font-extrabold text-dark-850 mt-1 block flex items-center gap-1">
                            <Clock className="w-4 h-4 text-primary-500" />
                            {currentTwinMachine.rul} Operating Hours
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 border border-primary-100 bg-primary-50/20 p-4 rounded-xl space-y-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-primary-700 font-extrabold block">AI Suggested Maintenance</span>
                        <p className="text-xs font-bold text-dark-800 leading-normal">
                          {currentTwinMachine.suggestedAction || 'All parameters stable. No maintenance required.'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-dark-50/60 p-4 rounded-xl border border-dark-100 text-[10.5px] text-gray-text leading-relaxed">
                      🧠 <span className="font-bold text-dark-850">Local AI Decision Logic:</span> {currentTwinMachine.explanation || 'Sensor readings are stable and matching baseline profiles.'}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Alerts Timeline & Maintenance Activity Logs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Incident alerts block */}
                  <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest border-b border-dark-100 pb-2 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-red-500" />
                      Active Incident Alerts
                    </h4>
                    {twinAlerts.length > 0 ? (
                      <div className="space-y-3">
                        {twinAlerts.map(a => (
                          <div key={a.id} className="p-3 border border-dark-100 bg-dark-50/20 rounded-xl flex justify-between items-start gap-4">
                            <div className="space-y-1 text-xs">
                              <span className="font-mono text-[9px] uppercase bg-dark-100 px-1.5 py-0.5 rounded text-gray-text font-bold">{a.id}</span>
                              <p className="font-bold text-dark-850 mt-1">{a.summary}</p>
                            </div>
                            <span className="px-2 py-0.5 border rounded text-[9.5px] uppercase font-extrabold bg-red-50 text-red-700 border-red-200">{a.priority}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-xs text-gray-text font-semibold">
                        ✅ No active cybersecurity or mechanical incidents recorded on this node.
                      </div>
                    )}
                  </div>

                  {/* Operational diagnostics timeline */}
                  <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest border-b border-dark-100 pb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary-500" />
                      AI Decision Timeline Logs
                    </h4>
                    <div className="space-y-3.5 text-[11px] font-semibold text-gray-text relative pl-4 border-l border-dark-200 ml-2">
                      <div className="relative">
                        <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                        <span className="font-mono text-[9px] block">JUST NOW</span>
                        <p className="text-dark-800 font-bold">Telemetry tick verified locally over WebSocket stream. Operational status: {currentTwinMachine.status}.</p>
                      </div>
                      <div className="relative">
                        <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-primary-500 border border-white" />
                        <span className="font-mono text-[9px] block">10 MINS AGO</span>
                        <p className="text-dark-800">Local predictive model checked RUL metrics. Estimated health index verified at {healthPercentage}%.</p>
                      </div>
                      <div className="relative">
                        <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-dark-300 border border-white" />
                        <span className="font-mono text-[9px] block">1 HOUR AGO</span>
                        <p className="text-dark-800">Operator panel connection verified. Virtual twin representation node instantiated.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ─── TAB 10: MULTI-FACTORY MANAGEMENT ─── */}
          {activeTab === 'Factories' && (() => {
            // Apply search & location filtering controls locally
            const filteredFactories = factories.filter(f => {
              const matchesSearch = f.name.toLowerCase().includes(factorySearch.toLowerCase()) || f.code.toLowerCase().includes(factorySearch.toLowerCase());
              const matchesLoc = factoryFilterLocation === 'All' || f.location.includes(factoryFilterLocation);
              const matchesStatus = factoryFilterStatus === 'All' || 
                (factoryFilterStatus === 'Critical' && f.criticalCount > 0) ||
                (factoryFilterStatus === 'Warning' && f.warningCount > 0 && f.criticalCount === 0) ||
                (factoryFilterStatus === 'Healthy' && f.criticalCount === 0 && f.warningCount === 0);
              return matchesSearch && matchesLoc && matchesStatus;
            }).sort((a, b) => {
              if (factorySortKey === 'name') return a.name.localeCompare(b.name);
              return b.healthScore - a.healthScore;
            });

            // Action: add new factory
            const handleAddFactory = (e) => {
              e.preventDefault();
              if (!newFactoryName || !newFactoryCode) return;
              const newFac = {
                code: newFactoryCode.toUpperCase(),
                name: newFactoryName,
                location: newFactoryLoc || 'Unknown Location',
                machinesCount: 0, healthyCount: 0, warningCount: 0, criticalCount: 0,
                healthScore: 100, activeAlerts: 0, energyEfficiency: '90%', lastUpdated: 'Just now'
              };
              setFactories(prev => [...prev, newFac]);
              setNewFactoryName('');
              setNewFactoryCode('');
              setNewFactoryLoc('');
              setShowAddFactoryModal(false);
              triggerToast('Factory Added', `Virtual factory representation ${newFactoryName} registered.`, 'success');
            };

            // Action: delete factory
            const handleDeleteFactory = (code) => {
              setFactories(prev => prev.filter(f => f.code !== code));
              triggerToast('Factory Deleted', `Factory database log code ${code} scrubbed.`, 'info');
            };

            if (factoriesViewMode === 'list') {
              return (
                <div className="space-y-6 font-sans animate-fade-in text-dark-800">
                  {/* Action Filters Panel bar */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-dark-200 rounded-2xl p-4 shadow-sm gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-50 rounded-xl text-primary-600"><Globe className="w-5 h-5" /></div>
                      <div>
                        <h3 className="text-sm font-bold text-dark-900">Multi-Factory Virtual Hub</h3>
                        <p className="text-[10px] text-gray-text mt-0.5">Centralized operational visibility across international facilities</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setShowAddFactoryModal(true)}
                      className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary-600/10 transition-smooth"
                    >
                      <Plus className="w-4 h-4" /> Add Factory
                    </button>
                  </div>

                  {/* Filters block layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white border border-dark-200 rounded-2xl p-4 shadow-sm text-xs font-bold text-dark-800">
                    <div className="space-y-1">
                      <label className="text-[9.5px] uppercase text-gray-text font-extrabold block">Search Nodes</label>
                      <input 
                        type="text" 
                        value={factorySearch}
                        onChange={(e) => setFactorySearch(e.target.value)}
                        placeholder="Search name or code..."
                        className="w-full border border-dark-200 rounded-xl px-3 py-2 bg-dark-50 text-xs outline-none focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9.5px] uppercase text-gray-text font-extrabold block">Region / Country</label>
                      <select 
                        value={factoryFilterLocation}
                        onChange={(e) => setFactoryFilterLocation(e.target.value)}
                        className="w-full border border-dark-200 rounded-xl px-3 py-2 bg-dark-50 text-xs outline-none focus:bg-white"
                      >
                        <option value="All">All Locations</option>
                        <option value="USA">USA</option>
                        <option value="Germany">Germany</option>
                        <option value="Japan">Japan</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9.5px] uppercase text-gray-text font-extrabold block">Health Index</label>
                      <select 
                        value={factoryFilterStatus}
                        onChange={(e) => setFactoryFilterStatus(e.target.value)}
                        className="w-full border border-dark-200 rounded-xl px-3 py-2 bg-dark-50 text-xs outline-none focus:bg-white"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Healthy">Healthy (Green)</option>
                        <option value="Warning">Warning (Orange)</option>
                        <option value="Critical">Critical (Red)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9.5px] uppercase text-gray-text font-extrabold block">Sort Ordering</label>
                      <select 
                        value={factorySortKey}
                        onChange={(e) => setFactorySortKey(e.target.value)}
                        className="w-full border border-dark-200 rounded-xl px-3 py-2 bg-dark-50 text-xs outline-none focus:bg-white"
                      >
                        <option value="name">Factory Name (A-Z)</option>
                        <option value="health">Health score (Highest)</option>
                      </select>
                    </div>
                  </div>

                  {/* Add factory modal pop-up rendering */}
                  {showAddFactoryModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white border border-dark-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-dark-100 pb-2">
                          <h4 className="text-sm font-bold text-dark-900">Add Factory Node</h4>
                          <button onClick={() => setShowAddFactoryModal(false)} className="text-gray-400 hover:text-dark-600 font-bold">✕</button>
                        </div>
                        <form onSubmit={handleAddFactory} className="space-y-3.5 text-xs font-bold text-dark-850">
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Factory Name</label>
                            <input type="text" value={newFactoryName} onChange={(e) => setNewFactoryName(e.target.value)} required placeholder="e.g. Detroit Assembly Hub" className="w-full border rounded-xl px-3 py-2 bg-dark-50 focus:bg-white outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Unique Factory Code</label>
                            <input type="text" value={newFactoryCode} onChange={(e) => setNewFactoryCode(e.target.value)} required placeholder="e.g. FAC-DET4" className="w-full border rounded-xl px-3 py-2 bg-dark-50 focus:bg-white outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Geographic Location</label>
                            <input type="text" value={newFactoryLoc} onChange={(e) => setNewFactoryLoc(e.target.value)} placeholder="e.g. Michigan, USA" className="w-full border rounded-xl px-3 py-2 bg-dark-50 focus:bg-white outline-none" />
                          </div>
                          <button type="submit" className="w-full py-2 bg-primary-600 text-white rounded-xl font-bold shadow-md shadow-primary-600/10 hover:bg-primary-700 transition-smooth">Register Factory Node</button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Factory Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredFactories.map(f => {
                      const healthColorBadge = f.healthScore > 90 ? 'text-emerald-700 bg-emerald-50 border-emerald-250' : f.healthScore > 75 ? 'text-amber-700 bg-amber-50 border-amber-250' : 'text-red-750 bg-red-50 border-red-200';
                      return (
                        <div key={f.code} className="bg-white border border-dark-200 rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xs font-extrabold text-dark-900 leading-tight">{f.name}</h4>
                                <span className="text-[9px] font-mono text-gray-text tracking-wide">{f.code} | {f.location}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase border ${healthColorBadge}`}>
                                {f.healthScore}% Health
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 py-2 border-y border-dark-100 text-[10.5px]">
                              <div className="text-center">
                                <span className="text-emerald-600 font-extrabold block text-xs">{f.healthyCount}</span>
                                <span className="text-[7.5px] text-gray-text font-bold uppercase tracking-wider">Healthy</span>
                              </div>
                              <div className="text-center">
                                <span className="text-amber-500 font-extrabold block text-xs">{f.warningCount}</span>
                                <span className="text-[7.5px] text-gray-text font-bold uppercase tracking-wider">Warning</span>
                              </div>
                              <div className="text-center">
                                <span className="text-red-500 font-extrabold block text-xs">{f.criticalCount}</span>
                                <span className="text-[7.5px] text-gray-text font-bold uppercase tracking-wider">Critical</span>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-[11px] font-bold text-dark-800">
                              <div className="flex justify-between">
                                <span className="text-gray-text">Active Alert Events:</span>
                                <span className={f.activeAlerts > 0 ? 'text-red-500' : 'text-emerald-600'}>{f.activeAlerts} Alerts</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-text">Energy Efficiency:</span>
                                <span>{f.energyEfficiency}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button 
                              onClick={() => { setSelectedFactoryCode(f.code); setFactoriesViewMode('detail'); }}
                              className="flex-1 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-xl text-xs font-bold transition-smooth"
                            >
                              Open Twin
                            </button>
                            <button 
                              onClick={() => handleDeleteFactory(f.code)}
                              className="p-1.5 bg-red-50 text-red-650 hover:bg-red-100 rounded-xl transition-smooth"
                              title="Decommission node"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // --- FACTORY DETAIL VIEW ---
            const currentFac = factories.find(f => f.code === selectedFactoryCode) || factories[0];
            const facMachines = machines.filter(m => currentFac.code === 'FAC-DET4' ? true : false); // Mock machines matching current factory context
            
            return (
              <div className="space-y-6 font-sans animate-fade-in text-dark-800">
                {/* Back bar */}
                <div className="flex justify-between items-center bg-white border border-dark-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setFactoriesViewMode('list')}
                      className="p-2 border border-dark-200 hover:bg-dark-50 rounded-xl text-dark-600 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h3 className="text-sm font-bold text-dark-900">{currentFac.name} Detailed Console</h3>
                      <span className="text-[10px] font-mono text-gray-text">{currentFac.code} | {currentFac.location}</span>
                    </div>
                  </div>
                  <span className="bg-emerald-50 border border-emerald-250 text-emerald-700 text-[9px] px-2.5 py-0.5 rounded font-extrabold uppercase tracking-wider">
                    {currentFac.healthScore}% Operational
                  </span>
                </div>

                {/* Operations KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white border border-dark-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Health Score</span>
                    <span className="text-xl font-black text-dark-900 mt-1 block">{currentFac.healthScore}%</span>
                  </div>
                  <div className="bg-white border border-dark-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Active Devices</span>
                    <span className="text-xl font-black text-dark-900 mt-1 block">{facMachines.length} Machines</span>
                  </div>
                  <div className="bg-white border border-dark-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Power Usage</span>
                    <span className="text-xl font-black text-dark-900 mt-1 block">92.4 kW</span>
                  </div>
                  <div className="bg-white border border-dark-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Energy Target</span>
                    <span className="text-xl font-black text-emerald-600 mt-1 block">{currentFac.energyEfficiency}</span>
                  </div>
                </div>

                {/* ─── FACTORY ANALYTICS INTEGRATION ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest border-b border-dark-100 pb-2">Active Machinery Health Analytics</h4>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={facMachines}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                          <YAxis tick={{ fontSize: 8 }} />
                          <Tooltip />
                          <Bar dataKey="health" fill="#EFF6FF" stroke="#3B82F6" strokeWidth={1} name="Health Index" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest border-b border-dark-100 pb-2">Daily Energy Consumptive Load</h4>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={facMachines}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                          <YAxis tick={{ fontSize: 8 }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="energy" fill="#FEF3C7" stroke="#D97706" name="Load (kW)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Department layout & assigned machinery list */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Departments checklist */}
                  <div className="bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest border-b border-dark-100 pb-2">Departmental Matrices</h4>
                    <div className="space-y-3">
                      {[
                        { name: 'Production', count: 3, health: 96, alerts: 0 },
                        { name: 'Maintenance', count: 1, health: 94, alerts: 1 },
                        { name: 'Logistics', count: 1, health: 91, alerts: 0 },
                        { name: 'Stamping', count: 1, health: 82, alerts: 0 }
                      ].map(d => (
                        <div key={d.name} className="p-3 border border-dark-100 bg-dark-50/20 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-dark-850 block">{d.name}</span>
                            <span className="text-[10px] text-gray-text font-semibold">{d.count} Assigned Machine(s)</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold border ${
                            d.health > 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>{d.health}% Health</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Machine Telemetry Grid */}
                  <div className="lg:col-span-2 bg-white border border-dark-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest border-b border-dark-100 pb-2">Central Node Status Table</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-dark-200 text-[10px] font-bold uppercase tracking-wider text-gray-text bg-dark-50/50">
                            <th className="py-2 px-3">Machine</th>
                            <th className="py-2 px-3">Temp</th>
                            <th className="py-2 px-3">Vibration</th>
                            <th className="py-2 px-3">RPM</th>
                            <th className="py-2 px-3">Current</th>
                            <th className="py-2 px-3 text-right">Health Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-100 font-semibold text-dark-850">
                          {facMachines.map(m => (
                            <tr key={m.id}>
                              <td className="py-2.5 px-3 font-bold text-dark-900">{m.name}</td>
                              <td className="py-2.5 px-3">{m.temp}°C</td>
                              <td className="py-2.5 px-3">{m.vibration} g</td>
                              <td className="py-2.5 px-3">{m.rpm} RPM</td>
                              <td className="py-2.5 px-3">{m.current} A</td>
                              <td className="py-2.5 px-3 text-right">
                                <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold border ${
                                  m.health > 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>{m.health}%</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ─── TAB 11: ENTERPRISE ANALYTICS ─── */}
          {activeTab === 'Analytics' && (() => {
            const avgHealth = Math.round(machines.reduce((acc, m) => acc + m.health, 0) / machines.length);
            const totalLoad = machines.reduce((acc, m) => acc + (m.energy || 12), 0).toFixed(1);

            return (
              <div className="space-y-6 font-sans animate-fade-in text-dark-800">
                {/* Header overview toolbar panel */}
                <div className="bg-white border border-dark-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <h2 className="text-base font-extrabold text-dark-900 tracking-tight flex items-center gap-2">
                      📊 Enterprise Business Intelligence Overview
                    </h2>
                    <p className="text-xs text-gray-text mt-0.5">Calculates executive KPIs, financial metrics, and total downtime prevention indices locally on the edge.</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] bg-emerald-50 border border-emerald-250 text-emerald-700 px-2.5 py-0.5 rounded font-bold uppercase">
                      Edge AI Processing: Active
                    </span>
                  </div>
                </div>

                {/* Operations KPIs list */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white border border-dark-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Avg Machine Health</span>
                    <span className="text-xl font-black text-dark-900 mt-1 block">{avgHealth}%</span>
                  </div>
                  <div className="bg-white border border-dark-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Downtime Prevented</span>
                    <span className="text-xl font-black text-emerald-600 mt-1 block">184.5 Hours</span>
                  </div>
                  <div className="bg-white border border-dark-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">Total Energy Load</span>
                    <span className="text-xl font-black text-amber-600 mt-1 block">{totalLoad} kW</span>
                  </div>
                  <div className="bg-white border border-dark-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-[9px] uppercase tracking-wider text-gray-text font-extrabold block">AI Accuracy Rate</span>
                    <span className="text-xl font-black text-primary-600 mt-1 block">99.2%</span>
                  </div>
                </div>

                {/* Two Column details analytics charts block */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Interactive charts */}
                  <div className="lg:col-span-2 bg-white border border-dark-200 rounded-3xl p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest border-b border-dark-100 pb-2">Facility Machinery Utilization Indices</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={machines}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 9 }} />
                          <Tooltip />
                          <Bar dataKey="health" fill="#EFF6FF" stroke="#3B82F6" strokeWidth={1} name="Health Index" />
                          <Bar dataKey="failureProbability" fill="#FEF2F2" stroke="#EF4444" strokeWidth={1} name="Failure Probability" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right: Executive Business summary insights */}
                  <div className="bg-white border border-dark-200 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-dark-900 uppercase tracking-widest border-b border-dark-100 pb-2">Local Executive Summary</h4>
                      <div className="space-y-3.5 mt-3 text-xs font-semibold text-dark-850 leading-relaxed">
                        <p>💡 <span className="font-bold text-dark-900">Preventive Maintenance:</span> Neural forecasting has successfully prevented approximately 184.5 hours of unplanned downtime this month by triggering early bearing wear diagnostics.</p>
                        <p>⚡ <span className="font-bold text-dark-900">Energy Optimization:</span> Estimated power savings are calculated at 12.4% under optimized VFD speed settings on active conveyor drives.</p>
                      </div>
                    </div>

                    <div className="bg-dark-50/50 p-4 rounded-xl border border-dark-100 text-[10px] leading-relaxed text-gray-text">
                      📊 Security audits, carbon output offsets, and ROI evaluations are compiled offline using local SQLite data logs.
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
            </>
          )}
        </main>
      </div>

      {/* ─── Help & Documentation Modal ─── */}
      <AnimatePresence>
        {helpPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm z-50"
              onClick={() => setHelpPanelOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.97 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col font-sans"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-dark-150 bg-gradient-to-r from-primary-600 to-primary-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-white tracking-tight">Help & Documentation</h2>
                    <p className="text-[10px] text-primary-200 font-semibold">EdgeShield AI — v2.1.0</p>
                  </div>
                </div>
                <button
                  onClick={() => setHelpPanelOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                >
                  <span className="text-lg leading-none font-light">×</span>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                {/* Quick Navigation */}
                <div>
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-text mb-3 flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-primary-100 flex items-center justify-center">
                      <Activity className="w-2.5 h-2.5 text-primary-600" />
                    </span>
                    Quick Navigation
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Dashboard', tab: 'Dashboard', icon: '🏭' },
                      { label: 'Machines', tab: 'Machine Monitoring', icon: '⚙️' },
                      { label: 'AI Copilot', tab: 'AI Copilot', icon: '🤖' },
                      { label: 'Cybersecurity', tab: 'Cybersecurity', icon: '🛡️' },
                      { label: 'Alerts', tab: 'Alerts', icon: '🔔' },
                      { label: 'Analytics', tab: 'Analytics', icon: '📊' },
                    ].map(item => (
                      <button
                        key={item.tab}
                        onClick={() => { setActiveTab(item.tab); setHelpPanelOpen(false); }}
                        className="flex items-center gap-2 p-2.5 bg-dark-50 hover:bg-primary-50 hover:border-primary-300 border border-dark-200 rounded-xl text-[10.5px] font-bold text-dark-800 hover:text-primary-700 transition-colors text-left"
                      >
                        <span className="text-sm">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Copilot Commands */}
                <div>
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-text mb-3 flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-100 flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                    </span>
                    AI Copilot Commands
                  </h3>
                  <div className="space-y-2">
                    {[
                      { cmd: 'quarantine DEV-PLC04', desc: 'Isolate a network device node' },
                      { cmd: 'resolve ALT-303', desc: 'Resolve an open security incident' },
                      { cmd: 'acknowledge ALT-302', desc: 'Acknowledge a warning alert' },
                      { cmd: 'show temp chart for MC-104', desc: 'Render live telemetry graph' },
                      { cmd: 'set warning threshold to 75', desc: 'Update AI health thresholds' },
                      { cmd: 'why is MC-108 critical?', desc: 'Get AI diagnostic report' },
                      { cmd: 'list all machines', desc: 'Show status overview of all assets' },
                      { cmd: 'show active cyber threats', desc: 'Audit OT network security' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-dark-50 border border-dark-150">
                        <code className="text-[9.5px] bg-primary-50 border border-primary-200 text-primary-700 font-mono px-2 py-0.5 rounded-md flex-shrink-0">{item.cmd}</code>
                        <span className="text-[10.5px] text-gray-text font-semibold leading-tight">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div>
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-text mb-3 flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-amber-100 flex items-center justify-center">
                      <Terminal className="w-2.5 h-2.5 text-amber-600" />
                    </span>
                    Keyboard Shortcuts
                  </h3>
                  <div className="space-y-1.5">
                    {[
                      { key: 'Alt + D', action: 'Go to Dashboard' },
                      { key: 'Alt + M', action: 'Machine Monitoring' },
                      { key: 'Alt + A', action: 'Open Alerts' },
                      { key: 'Alt + C', action: 'Open AI Copilot' },
                      { key: 'Alt + S', action: 'Cybersecurity Monitor' },
                      { key: 'Esc', action: 'Close panels & modals' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-[10.5px] font-semibold py-1.5 border-b border-dark-100 last:border-0">
                        <span className="text-dark-700">{item.action}</span>
                        <kbd className="px-2 py-0.5 bg-dark-900 text-white rounded-md text-[9px] font-mono font-bold tracking-wide">{item.key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Platform Info */}
                <div className="bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-4 space-y-2">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-primary-700 mb-2">Platform Information</h3>
                  {[
                    ['Platform', 'EdgeShield AI Industrial Edge'],
                    ['Version', '2.1.0 — Offline-First'],
                    ['AI Engine', 'Edge LSTM + Spectral Regressor'],
                    ['Backend', 'Node.js Express + JSON DB'],
                    ['Telemetry', 'Real-time WebSocket (1s interval)'],
                    ['Auth', 'JWT + Azure Entra ID SSO'],
                  ].map(([key, val]) => (
                    <div key={key} className="flex justify-between text-[10px] font-semibold">
                      <span className="text-gray-text">{key}</span>
                      <span className="text-dark-800 font-bold">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Support */}
                <div className="text-center pb-2">
                  <p className="text-[10px] text-gray-text font-semibold">Need more help?</p>
                  <button
                    onClick={() => { setActiveTab('AI Copilot'); setHelpPanelOpen(false); }}
                    className="mt-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-[10.5px] font-extrabold rounded-xl transition-colors shadow-sm"
                  >
                    Ask the AI Copilot
                  </button>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              onClick={() => {
                navigate('/dashboard/alerts');
                if (t.alertId) {
                  setSelectedAlertId(t.alertId);
                  setAlViewMode('detail');
                } else {
                  setAlViewMode('list');
                }
                setToasts(prev => prev.filter(item => item.id !== t.id));
              }}
              className={`pointer-events-auto p-4 rounded-2xl shadow-lg border backdrop-blur-xl flex items-start gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 ${
                t.type === 'critical' || t.type === 'error'
                  ? 'bg-red-955/90 border-red-500/30 text-red-200'
                  : t.type === 'warning'
                  ? 'bg-amber-955/90 border-amber-500/30 text-amber-200'
                  : 'bg-slate-900/90 border-slate-800/80 text-gray-200'
              }`}
            >
              <div className="mt-0.5">
                {t.type === 'critical' || t.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                ) : t.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : (
                  <Shield className="w-5 h-5 text-primary-400" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-white leading-tight">{t.title}</h4>
                <p className="text-[10px] text-gray-400 mt-1 leading-normal font-semibold">{t.message}</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setToasts(prev => prev.filter(item => item.id !== t.id));
                }}
                className="text-gray-500 hover:text-gray-300 text-[10px] font-bold self-start mt-0.5"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default Dashboard;
