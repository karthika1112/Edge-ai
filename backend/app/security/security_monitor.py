import random
from datetime import datetime

class SecurityMonitor:
    def __init__(self):
        pass

    def evaluate_security(self, devices, demo_time):
        alerts_triggered = []
        updated_devices = []

        for d in devices:
            d_id = d.get('id', '')
            risk_level = d.get('riskLevel', 'Low')
            trust_score = d.get('trustScore', 100)
            packets_sec = d.get('packetsSec', 0)
            error_rate = d.get('errorRate', 0.0)
            status = d.get('status', 'Online')
            machine = d.get('machine', 'N/A')

            # 1. DEV-PLC04 critical threat
            if d_id == 'DEV-PLC04' and 25 <= demo_time < 45:
                risk_level = 'Critical'
                trust_score = 35
                packets_sec = 480
                error_rate = 18.5
                status = 'Warning'

                if demo_time == 25:
                    alerts_triggered.append({
                        "id": f"ALT-SEC-{random.randint(400, 999)}",
                        "machine": machine if machine != 'N/A' else 'Rotary Compressor RC-2',
                        "machine_id": 'MC-104',
                        "type": 'Cybersecurity',
                        "priority": 'Critical',
                        "summary": f"High network activity & Unauthorized Modbus payload command overrides on PLC Controller ({d_id}) from host 10.227.100.99",
                        "aiExplanation": 'AI models identified a burst of high frequency Modbus TCP commands targeting writable coils on register 4001, combined with a spoofed MAC header.',
                        "recommendedAction": 'Isolate port 502, quarantine PLC node, and verify firewall policy configurations.',
                        "timestamp": datetime.now().strftime("%I:%M:%S %p"),
                        "status": 'Open',
                        "assignedTo": 'Unassigned',
                        "affected": 'Modbus Register 4001 / Port 502'
                    })

            # 2. DEV-GW04 warning scan
            if d_id == 'DEV-GW04' and 45 <= demo_time < 65:
                risk_level = 'Warning'
                trust_score = 70
                packets_sec = 350
                error_rate = 4.2

                if demo_time == 45:
                    alerts_triggered.append({
                        "id": f"ALT-SEC-{random.randint(400, 999)}",
                        "machine": 'Smart Assembly Gateway',
                        "machine_id": 'N/A',
                        "type": 'Cybersecurity',
                        "priority": 'Warning',
                        "summary": f"Unusual communication pattern: Port scanning activities flagged on Security Gateway ({d_id})",
                        "aiExplanation": 'Sequence of TCP SYN packets scanning ports 22, 80, 443, and 502 in rapid succession (120 scans/sec).',
                        "recommendedAction": 'Restrict incoming packets from subnet range 10.227.102.* and check access lists.',
                        "timestamp": datetime.now().strftime("%I:%M:%S %p"),
                        "status": 'Open',
                        "assignedTo": 'Unassigned',
                        "affected": 'Subnet Boundary Access Ports'
                    })

            # 3. DEV-PLC01 unknown device MAC scan
            if demo_time == 65 and d_id == 'DEV-PLC01':
                risk_level = 'Warning'
                trust_score = 78
                alerts_triggered.append({
                    "id": f"ALT-SEC-{random.randint(400, 999)}",
                    "machine": machine,
                    "machine_id": 'MC-101',
                    "type": 'Cybersecurity',
                    "priority": 'Warning',
                    "summary": f"Unknown device connection attempt matching MAC 00:1A:2B:FF:EE:DD trying to query PLC Controller ({d_id})",
                    "aiExplanation": 'MAC address filter mismatch. A non-whitelisted device attempted to negotiate Modbus session handshake.',
                    "recommendedAction": 'Review MAC authorization table and audit local network switches.',
                    "timestamp": datetime.now().strftime("%I:%M:%S %p"),
                    "status": 'Open',
                    "assignedTo": 'Unassigned',
                    "affected": 'Device Access Whitelist'
                })

            # Cleanups/Restorations
            if d_id == 'DEV-PLC04' and demo_time >= 45 and risk_level == 'Critical':
                risk_level = 'Low'
                trust_score = 96
                packets_sec = 45
                error_rate = 0.0
                status = 'Online'
            if d_id == 'DEV-GW04' and demo_time >= 65 and risk_level == 'Warning':
                risk_level = 'Low'
                trust_score = 99
                packets_sec = 150
                error_rate = 0.01
                status = 'Online'

            updated_devices.append({
                "id": d_id,
                "name": d.get('name', ''),
                "ip": d.get('ip', ''),
                "type": d.get('type', ''),
                "mac": d.get('mac', ''),
                "firmware": d.get('firmware', ''),
                "machine": machine,
                "riskLevel": risk_level,
                "trustScore": trust_score,
                "packetsSec": packets_sec,
                "errorRate": error_rate,
                "status": status
            })

        return {
            "updatedDevices": updated_devices,
            "alertsTriggered": alerts_triggered
        }
