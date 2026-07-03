/**
 * Cybersecurity Threat Monitor for EdgeShield AI
 * Runs local network packet and event analysis on OT infrastructure (PLCs, Gateways)
 */

export class SecurityMonitor {
  constructor() {
    this.threatRegistry = [];
  }

  /**
   * Evaluates OT device network parameters to detect cybersecurity anomalies
   */
  evaluateSecurity(devices, demoTime) {
    const alertsTriggered = [];
    const updatedDevices = devices.map(device => {
      let riskLevel = device.riskLevel || 'Low';
      let trustScore = device.trustScore || 100;
      let packetsSec = device.packetsSec;
      let errorRate = device.errorRate;
      let status = device.status || 'Online';

      // 1. ANOMALY: Unknown/Suspicious MAC or IP address (Unauthorized access attempt)
      // Simulating a threat at demoTime = 25
      if (device.id === 'DEV-PLC04' && demoTime >= 25 && demoTime < 45) {
        riskLevel = 'Critical';
        trustScore = 35;
        packetsSec = 480; // High network activity / flood
        errorRate = 18.5; // Payload corruptions
        status = 'Warning';

        // Trigger once at demoTime = 25
        if (demoTime === 25) {
          alertsTriggered.push({
            id: `ALT-SEC-${Math.floor(Math.random() * 599) + 400}`,
            machine: device.machine !== 'N/A' ? device.machine : 'Rotary Compressor RC-2',
            machine_id: 'MC-104',
            type: 'Cybersecurity',
            priority: 'Critical',
            summary: `High network activity & Unauthorized Modbus payload command overrides on ${device.name} (${device.id}) from host 10.227.100.99`,
            aiExplanation: 'AI models identified a burst of high frequency Modbus TCP commands targeting writable coils on register 4001, combined with a spoofed MAC header.',
            recommendedAction: 'Isolate port 502, quarantine PLC node, and verify firewall policy configurations.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            status: 'Open',
            assignedTo: 'Unassigned',
            affected: 'Modbus Register 4001 / Port 502'
          });
        }
      }

      // 2. ANOMALY: High network activity/scan on Zone 4 gateway
      if (device.id === 'DEV-GW04' && demoTime >= 45 && demoTime < 65) {
        riskLevel = 'Warning';
        trustScore = 70;
        packetsSec = 350;
        errorRate = 4.2;

        if (demoTime === 45) {
          alertsTriggered.push({
            id: `ALT-SEC-${Math.floor(Math.random() * 599) + 400}`,
            machine: 'Smart Assembly Gateway',
            machine_id: 'N/A',
            type: 'Cybersecurity',
            priority: 'Warning',
            summary: `Unusual communication pattern: Port scanning activities flagged on Security Gateway (${device.id})`,
            aiExplanation: 'Sequence of TCP SYN packets scanning ports 22, 80, 443, and 502 in rapid succession (120 scans/sec).',
            recommendedAction: 'Restrict incoming packets from subnet range 10.227.102.* and check access lists.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            status: 'Open',
            assignedTo: 'Unassigned',
            affected: 'Subnet Boundary Access Ports'
          });
        }
      }

      // 3. ANOMALY: Unknown device connection attempt
      if (demoTime === 65 && device.id === 'DEV-PLC01') {
        riskLevel = 'Warning';
        trustScore = 78;
        
        alertsTriggered.push({
          id: `ALT-SEC-${Math.floor(Math.random() * 599) + 400}`,
          machine: device.machine,
          machine_id: 'MC-101',
          type: 'Cybersecurity',
          priority: 'Warning',
          summary: `Unknown device connection attempt matching MAC 00:1A:2B:FF:EE:DD trying to query ${device.name}`,
          aiExplanation: 'MAC address filter mismatch. A non-whitelisted device attempted to negotiate Modbus session handshake.',
          recommendedAction: 'Review MAC authorization table and audit local network switches.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          status: 'Open',
          assignedTo: 'Unassigned',
          affected: 'Device Access Whitelist'
        });
      }

      // Restore device stats to nominal values when anomaly expires
      if (device.id === 'DEV-PLC04' && demoTime >= 45 && riskLevel === 'Critical') {
        riskLevel = 'Low';
        trustScore = 96;
        packetsSec = 45;
        errorRate = 0.0;
        status = 'Online';
      }
      if (device.id === 'DEV-GW04' && demoTime >= 65 && riskLevel === 'Warning') {
        riskLevel = 'Low';
        trustScore = 99;
        packetsSec = 150;
        errorRate = 0.01;
        status = 'Online';
      }

      return {
        ...device,
        riskLevel,
        trustScore,
        packetsSec,
        errorRate,
        status
      };
    });

    return {
      updatedDevices,
      alertsTriggered
    };
  }
}
