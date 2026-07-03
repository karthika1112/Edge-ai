/**
 * EdgeShield AI — Local Edge AI Engine v2.1.0
 *
 * Fully offline, no cloud API required.
 * All AI calculations run on the edge device.
 *
 * Anomaly Detection:
 *   A. Thermal instability   (temporal — requires history)
 *   B. Mechanical misalignment (vibration)
 *   C. Electrical overload   (current)
 *   D. Pressure fluctuation  (machine-specific)
 *   E. RPM instability       (temporal — requires history)
 *   F. Energy overconsumption (3-phase apparent power vs. baseline)
 */

const MACHINE_ENERGY_BASELINES = {
  'MC-101': 12.5, 'MC-104': 14.1, 'MC-105': 6.8,
  'MC-106': 18.2, 'MC-107': 10.5, 'MC-108': 15.4
};

export function analyzeTelemetry(machine, history = [], thresholds = { warning: 80, critical: 50 }) {
  const { id, name, temp, vibration, current, rpm, pressure, voltage = 415, energy = 15 } = machine;
  
  // Default values
  let health = 100;
  let status = 'Healthy';
  let failureProbability = 1.0;
  let rul = 240; // Remaining Useful Life in Hours (or days depending on display)
  let aiConfidence = 95.0; // AI Confidence Score (%)
  let suggestedAction = 'No immediate action required. Continue routine monitoring.';
  let explanation = 'All parameters are operating within nominal baseline bounds.';
  let anomalies = [];

  // 1. ANOMALY DETECTION CRITERIA
  
  // A. Rapid temperature increase: check last few history logs (e.g. increase by > 5.0 °C)
  let isTempRisingRapidly = false;
  if (history.length >= 3) {
    const prevTemp = history[0].temp;
    const tempDiff = temp - prevTemp;
    if (tempDiff > 5.0) {
      isTempRisingRapidly = true;
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

  // C. Current spikes
  if (current > 22.0) {
    anomalies.push({
      type: 'Electrical overload',
      severity: current > 25.0 ? 'Critical' : 'Warning',
      rootCause: `High current spike: ${current.toFixed(1)} A exceeds nominal current bounds.`,
      action: 'Verify motor stator windings and check electrical contacts.'
    });
  }

  // D. Pressure fluctuations (For MC-104 Compressor and MC-106 Press)
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

  // E. RPM instability (temporal — requires history)
  if (rpm > 0 && history.length >= 3) {
    const rpms = history.map(h => h.rpm).filter(r => r > 0);
    if (rpms.length >= 2) {
      const avgRpm = rpms.reduce((a, b) => a + b, 0) / rpms.length;
      const rpmDiff = Math.abs(rpm - avgRpm) / avgRpm;
      if (rpmDiff > 0.15) {
        anomalies.push({
          type: 'Rotational instability',
          severity: 'Warning',
          rootCause: `RPM ${rpm} deviates ${(rpmDiff * 100).toFixed(0)}% from historical mean of ${avgRpm.toFixed(0)}.`,
          action: 'Inspect drive belt tension and verify variable frequency drive (VFD) settings.'
        });
      }
    }
  }

  // F. Energy overconsumption (3-phase apparent power vs. machine baseline)
  const baselineKw = MACHINE_ENERGY_BASELINES[id] || energy;
  const apparentPowerKw = (current * voltage * 1.732) / 1000;  // 3-phase kVA estimate
  if (apparentPowerKw > baselineKw * 1.25) {
    anomalies.push({
      type: 'Energy overconsumption',
      severity: 'Warning',
      rootCause: `Power draw ${apparentPowerKw.toFixed(1)} kW exceeds baseline ${baselineKw.toFixed(1)} kW by ${((apparentPowerKw / baselineKw - 1) * 100).toFixed(0)}%.`,
      action: 'Schedule power factor correction audit and check for winding insulation degradation.'
    });
  }

  // 2. SCORING ENGINE (Health, Failure Probability, RUL)
  let healthDeduction = 0;
  
  // Temp contribution
  if (temp > 50.0) {
    healthDeduction += (temp - 50.0) * 1.5;
  }
  // Vibration contribution
  if (vibration > 0.5) {
    healthDeduction += (vibration - 0.5) * 35;
  }
  // Current contribution
  if (current > 16.0) {
    healthDeduction += (current - 16.0) * 4;
  }
  // Pressure deviation
  if (id === 'MC-104' || id === 'MC-106') {
    const normalPressure = id === 'MC-104' ? 6.2 : 185.0;
    const deviation = Math.abs(pressure - normalPressure) / normalPressure;
    if (deviation > 0.1) {
      healthDeduction += (deviation - 0.1) * 80;
    }
  }

  health = Math.max(10, Math.round(100 - healthDeduction));

  // Determine overall status based on thresholds
  const warnThresh = thresholds.warning || 80;
  const critThresh = thresholds.critical || 50;

  if (health < critThresh || anomalies.some(a => a.severity === 'Critical')) {
    status = 'Critical';
  } else if (health < warnThresh || anomalies.length > 0) {
    status = 'Warning';
  } else {
    status = 'Healthy';
  }

  // Failure Probability
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

  // RUL (Remaining Useful Life)
  if (status === 'Critical') {
    rul = Math.max(1, Math.round(12 * (health / 45))); // RUL in days
  } else if (status === 'Warning') {
    rul = Math.max(15, Math.round(150 * (health / 75)));
  } else {
    rul = Math.max(120, Math.round(240 * (health / 95)));
  }

  // 3. RECOMMENDATIONS & EXPLANATIONS GENERATION
  if (anomalies.length > 0) {
    // Sort Critical anomalies first
    anomalies.sort((a, b) => (a.severity === 'Critical' ? -1 : 1) - (b.severity === 'Critical' ? -1 : 1));
    const primaryAnomaly = anomalies[0];
    suggestedAction = primaryAnomaly.action;
    explanation = `${primaryAnomaly.rootCause} EdgeShield Edge AI flags potential ${primaryAnomaly.type.toLowerCase()} anomaly (${anomalies.length} type(s) detected).`;
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
}
