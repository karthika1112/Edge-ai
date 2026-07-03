import random
from datetime import datetime

class TelemetryDriver:
    """
    Edge AI Telemetry Driver — pluggable data ingestion layer.

    Supported modes:
        'simulation' — built-in scripted sensor simulation (default, no hardware needed)
        'mqtt'       — swap to mqtt_driver.py for real MQTT broker integration
        'opcua'      — swap to opcua_driver.py for OPC-UA server integration
        'modbus'     — swap to modbus_driver.py for Modbus TCP/RTU integration

    To switch from simulation to real hardware, change the mode parameter and
    ensure the corresponding protocol driver is configured in backend/protocols/.
    The AI engine, alert system, WebSocket broadcast, and dashboard remain unchanged.
    """

    # Baseline energy/voltage references per machine
    MACHINE_BASELINES = {
        'MC-101': {'energy': 12.5, 'voltage': 415.0},
        'MC-104': {'energy': 14.1, 'voltage': 415.0},
        'MC-105': {'energy': 6.8,  'voltage': 415.0},
        'MC-106': {'energy': 18.2, 'voltage': 415.0},
        'MC-107': {'energy': 10.5, 'voltage': 415.0},
        'MC-108': {'energy': 15.4, 'voltage': 415.0},
    }

    def __init__(self, mode='simulation'):
        """
        Args:
            mode: str — one of 'simulation', 'mqtt', 'opcua', 'modbus'
        """
        self.mode = mode
        self._mqtt_client = None
        self._opcua_client = None
        self._modbus_client = None

    async def connect(self, config=None):
        """
        Establish connection to the telemetry source.
        In simulation mode this is a no-op.
        For real hardware, pass a config dict with host/port/credentials.
        """
        if self.mode == 'simulation':
            return True
        elif self.mode == 'mqtt':
            return await self._connect_mqtt(config or {})
        elif self.mode == 'opcua':
            return await self._connect_opcua(config or {})
        elif self.mode == 'modbus':
            return await self._connect_modbus(config or {})
        return False

    async def fetch_telemetry_tick(self, machines, demo_time):
        """
        Fetch one tick of telemetry for all machines.

        Returns:
            list[dict] — one telemetry dict per machine with keys:
                id, name, type, location, dept, temp, vibration, current,
                rpm, pressure, voltage, energy, timestamp
        """
        if self.mode == 'simulation':
            return self._simulate(machines, demo_time)
        elif self.mode == 'mqtt':
            return await self._fetch_mqtt(machines)
        elif self.mode == 'opcua':
            return await self._fetch_opcua(machines)
        elif self.mode == 'modbus':
            return await self._fetch_modbus(machines)
        return []

    # ─── SIMULATION MODE ──────────────────────────────────────────────────────

    def _simulate(self, machines, demo_time):
        """Built-in scripted sensor simulation with realistic failure scenarios."""
        updated = []
        for m in machines:
            m_id      = m.id
            temp      = float(m.temp)
            vibration = float(m.vibration)
            current   = float(m.current)
            rpm       = int(m.rpm)
            pressure  = float(m.pressure)
            baseline  = self.MACHINE_BASELINES.get(m_id, {'energy': 15.0, 'voltage': 415.0})
            voltage   = float(m.voltage)
            energy    = float(m.energy)

            temp_change    = random.uniform(-0.4, 0.4)
            vib_change     = random.uniform(-0.075, 0.075)
            current_change = random.uniform(-0.15, 0.15)
            rpm_change     = random.randint(-7, 7) if rpm > 0 else 0
            press_change   = random.uniform(-0.15, 0.15) if pressure > 0 else 0

            # MC-107 scheduled bearing-fault degradation scenario
            if m_id == 'MC-107':
                if demo_time > 20:
                    temp_change    = random.uniform(1.2, 2.8)
                    vib_change     = random.uniform(0.05, 0.12)
                    rpm_change     = random.randint(10, 25)
                    current_change = random.uniform(0.3, 0.8)
                else:
                    temp      = min(temp, 46.0)
                    vibration = min(vibration, 0.45)

            # MC-104 scheduled compressor-fault degradation scenario
            if m_id == 'MC-104':
                if demo_time > 15:
                    temp_change    = random.uniform(1.0, 2.5)
                    vib_change     = random.uniform(0.15, 0.4)
                    press_change   = random.uniform(-0.4, 0.4)
                    current_change = random.uniform(0.2, 0.6)
                else:
                    temp      = min(temp, 49.0)
                    vibration = min(vibration, 0.5)

            final_temp    = round(max(20.0, temp + temp_change), 1)
            final_vib     = round(max(0.05, vibration + vib_change), 2)
            final_current = round(max(1.0, current + current_change), 1)
            final_rpm     = max(0, rpm + rpm_change)
            final_press   = round(max(0.0, pressure + press_change), 1)
            # Energy fluctuates ±3% from baseline
            final_energy  = round(max(0.1, baseline['energy'] * (1 + random.uniform(-0.03, 0.03))), 2)

            updated.append({
                "id":        m_id,
                "name":      m.name,
                "type":      m.type,
                "location":  m.location,
                "dept":      m.dept,
                "voltage":   voltage,
                "energy":    final_energy,
                "temp":      final_temp,
                "vibration": final_vib,
                "current":   final_current,
                "rpm":       final_rpm,
                "pressure":  final_press,
                "timestamp": datetime.now().isoformat()
            })
        return updated

    # ─── MQTT PROTOCOL STUB ───────────────────────────────────────────────────

    async def _connect_mqtt(self, config):
        """
        STUB — Connect to an MQTT broker for real machine telemetry.

        To implement:
            pip install asyncio-mqtt paho-mqtt
            config = {
                "host": "192.168.1.100",
                "port": 1883,
                "username": "edge_user",
                "password": "secret",
                "topics": {
                    "MC-101": "factory/zone1/cnc1/telemetry",
                    "MC-104": "factory/zone1/compressor/telemetry"
                }
            }
            from backend.protocols.mqtt_driver import MQTTDriver
            self._mqtt_client = MQTTDriver(config)
            return await self._mqtt_client.connect()
        """
        raise NotImplementedError(
            "MQTT integration not yet configured. "
            "See backend/protocols/mqtt_driver.py for implementation guide."
        )

    async def _fetch_mqtt(self, machines):
        """STUB — Fetch latest MQTT topic payloads for all machines."""
        raise NotImplementedError("MQTT fetch not implemented. Use mode='simulation' for now.")

    # ─── OPC-UA PROTOCOL STUB ─────────────────────────────────────────────────

    async def _connect_opcua(self, config):
        """
        STUB — Connect to an OPC-UA server (common in Siemens/ABB SCADA systems).

        To implement:
            pip install asyncua
            config = {
                "endpoint": "opc.tcp://192.168.1.50:4840/freeopcua/server/",
                "namespace": 2,
                "node_ids": {
                    "MC-101_temp":      "ns=2;i=1001",
                    "MC-101_vibration": "ns=2;i=1002",
                }
            }
            from backend.protocols.opcua_driver import OPCUADriver
            self._opcua_client = OPCUADriver(config)
            return await self._opcua_client.connect()
        """
        raise NotImplementedError(
            "OPC-UA integration not yet configured. "
            "See backend/protocols/opcua_driver.py for implementation guide."
        )

    async def _fetch_opcua(self, machines):
        """STUB — Read OPC-UA node values for all machine telemetry points."""
        raise NotImplementedError("OPC-UA fetch not implemented. Use mode='simulation' for now.")

    # ─── MODBUS PROTOCOL STUB ─────────────────────────────────────────────────

    async def _connect_modbus(self, config):
        """
        STUB — Connect to a Modbus TCP/RTU device (PLCs, drives, sensors).

        To implement:
            pip install pymodbus
            config = {
                "host": "192.168.1.200",
                "port": 502,
                "unit_id": 1,
                "register_map": {
                    "MC-101_temp":      {"register": 100, "scale": 0.1},
                    "MC-101_vibration": {"register": 101, "scale": 0.01},
                    "MC-101_current":   {"register": 102, "scale": 0.1},
                    "MC-101_rpm":       {"register": 103, "scale": 1},
                }
            }
            from backend.protocols.modbus_driver import ModbusDriver
            self._modbus_client = ModbusDriver(config)
            return await self._modbus_client.connect()
        """
        raise NotImplementedError(
            "Modbus integration not yet configured. "
            "See backend/protocols/modbus_driver.py for implementation guide."
        )

    async def _fetch_modbus(self, machines):
        """STUB — Read Modbus holding registers for all machine telemetry points."""
        raise NotImplementedError("Modbus fetch not implemented. Use mode='simulation' for now.")
