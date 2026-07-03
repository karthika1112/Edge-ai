"""
EdgeShield AI — MQTT Protocol Driver
=====================================
Plug-in adapter for reading real machine telemetry from an MQTT broker.

SUPPORTED BROKERS:
    - Eclipse Mosquitto (open source, runs locally on the edge device)
    - EMQX (high-performance, runs locally)
    - HiveMQ (can run locally via Docker)
    - Any standard MQTT 3.1.1 / 5.0 broker

INSTALLATION:
    pip install asyncio-mqtt paho-mqtt

USAGE:
    In backend/telemetry_driver.py, change:
        self.mode = 'simulation'
    to:
        self.mode = 'mqtt'

    Then call:
        config = {
            "host":     "192.168.1.100",   # your local MQTT broker
            "port":     1883,
            "username": "edge_user",        # optional
            "password": "secret",           # optional
            "topics": {
                "MC-101": "factory/zone1/cnc1/telemetry",
                "MC-104": "factory/zone1/compressor/telemetry",
                "MC-105": "factory/zone3/conveyor/telemetry",
                "MC-106": "factory/zone4/press/telemetry",
                "MC-107": "factory/zone2/cnc7/telemetry",
                "MC-108": "factory/zone2/spindle/telemetry",
            }
        }
        await driver.connect(config)

EXPECTED MQTT PAYLOAD FORMAT (JSON per topic):
    {
        "machine_id": "MC-101",
        "temp":       42.5,
        "vibration":  0.4,
        "current":    12.4,
        "rpm":        1800,
        "pressure":   0.0,
        "voltage":    415.0,
        "timestamp":  "2025-01-15T09:30:00.000Z"
    }

REAL HARDWARE INTEGRATION NOTES:
    - Each machine's PLC or IoT gateway publishes to its assigned MQTT topic
    - EdgeShield subscribes to all machine topics locally
    - No internet connection required — broker runs on the same edge server
    - For Modbus-to-MQTT bridging, use: https://github.com/irios-things/modbus2mqtt
    - For OPC-UA-to-MQTT bridging, use: https://github.com/node-opcua/node-opcua
"""

from datetime import datetime
from typing import List, Dict, Optional


class MQTTDriver:
    """
    MQTT telemetry driver for EdgeShield AI.
    Implements the same fetch_telemetry_tick() interface as TelemetryDriver.
    """

    def __init__(self, config: dict):
        """
        Args:
            config: dict with keys: host, port, username, password, topics
        """
        self.host     = config.get("host", "localhost")
        self.port     = config.get("port", 1883)
        self.username = config.get("username")
        self.password = config.get("password")
        self.topics   = config.get("topics", {})
        self._client  = None
        self._cache: Dict[str, dict] = {}  # latest message per machine_id

    async def connect(self) -> bool:
        """
        Connect to the MQTT broker and subscribe to all machine topics.

        TO IMPLEMENT — uncomment and install asyncio-mqtt:
        ─────────────────────────────────────────────────
        import asyncio_mqtt as mqtt

        self._client = mqtt.Client(
            hostname=self.host,
            port=self.port,
            username=self.username,
            password=self.password
        )
        await self._client.__aenter__()
        for machine_id, topic in self.topics.items():
            await self._client.subscribe(topic)
        asyncio.create_task(self._listen())
        return True
        """
        raise NotImplementedError(
            "MQTT connect not implemented. "
            "Install asyncio-mqtt and follow the instructions in this file."
        )

    async def _listen(self):
        """
        Background listener — updates cache with latest readings per machine.

        TO IMPLEMENT:
        ─────────────
        import json
        async with self._client.filtered_messages("#") as messages:
            async for msg in messages:
                try:
                    payload = json.loads(msg.payload.decode())
                    machine_id = payload.get("machine_id")
                    if machine_id:
                        self._cache[machine_id] = payload
                except Exception as e:
                    print(f"[MQTT] Parse error: {e}")
        """
        pass

    async def fetch_telemetry_tick(self, machines, tick: int) -> List[dict]:
        """
        Return latest cached MQTT readings for all machines.

        TO IMPLEMENT — replace stub with:
        ──────────────────────────────────
        result = []
        for m in machines:
            m_id = getattr(m, 'id', None) or m.get('id', '')
            cached = self._cache.get(m_id)
            if cached:
                result.append({
                    "id":        m_id,
                    "name":      getattr(m, 'name', '') or m.get('name', ''),
                    "type":      getattr(m, 'type', '') or m.get('type', ''),
                    "location":  getattr(m, 'location', '') or m.get('location', ''),
                    "dept":      getattr(m, 'dept', '') or m.get('dept', ''),
                    "temp":      float(cached.get("temp", 40.0)),
                    "vibration": float(cached.get("vibration", 0.5)),
                    "current":   float(cached.get("current", 10.0)),
                    "rpm":       int(cached.get("rpm", 1500)),
                    "pressure":  float(cached.get("pressure", 0.0)),
                    "voltage":   float(cached.get("voltage", 415.0)),
                    "energy":    float(cached.get("energy", 15.0)),
                    "timestamp": cached.get("timestamp", datetime.now().isoformat())
                })
        return result
        """
        raise NotImplementedError("MQTT fetch not implemented.")
