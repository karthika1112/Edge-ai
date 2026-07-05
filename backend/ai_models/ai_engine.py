import random

# Baseline energy ratings per machine type (kW) for energy anomaly detection
MACHINE_ENERGY_BASELINES = {
    'MC-101': 12.5,
    'MC-104': 14.1,
    'MC-105': 6.8,
    'MC-106': 18.2,
    'MC-107': 10.5,
    'MC-108': 15.4,
}

def analyze_telemetry(machine, history=None, thresholds=None):
    """
    Local Edge AI analytics engine — runs entirely on the edge device.
    No cloud API or internet connection required.

    Args:
        machine: dict or ORM object with telemetry fields
        history: list of last N SensorLog dicts (enables temporal anomaly detection)
        thresholds: dict with 'warning' and 'critical' health score keys

    Returns:
        dict: health, status, failure_prob, rul, ai_confidence,
              suggested_action, explanation, anomalies
    """
    if history is None:
        history = []
    if thresholds is None:
        thresholds = {"warning": 80, "critical": 50}

    # ─── Extract telemetry fields (supports ORM model or plain dict) ───────────
    m_id       = machine.id if not isinstance(machine, dict) else machine.get('id', '')
    temp       = float(machine.temp if not isinstance(machine, dict) else machine.get('temp', 40.0))
    vibration  = float(machine.vibration if not isinstance(machine, dict) else machine.get('vibration', 0.5))
    current    = float(machine.current if not isinstance(machine, dict) else machine.get('current', 10.0))
    rpm        = int(machine.rpm if not isinstance(machine, dict) else machine.get('rpm', 1500))
    pressure   = float(machine.pressure if not isinstance(machine, dict) else machine.get('pressure', 0.0))
    voltage    = float(machine.voltage if not isinstance(machine, dict) else machine.get('voltage', 415.0))
    energy     = float(machine.energy if not isinstance(machine, dict) else machine.get('energy', 15.0))

    health             = 100
    status             = 'Healthy'
    failure_probability = 1.0
    rul                = 240
    ai_confidence      = 95.0
    suggested_action   = 'No immediate action required. Continue routine monitoring.'
    explanation        = 'All parameters are operating within nominal baseline bounds.'
    anomalies          = []

    # ─── ANOMALY DETECTION ────────────────────────────────────────────────────

    # A. Thermal instability — requires history (now correctly populated)
    if len(history) >= 3:
        def _get(rec, key, default):
            return rec.get(key, default) if isinstance(rec, dict) else getattr(rec, key, default)
        prev_temp = float(_get(history[0], 'temp', 40.0))
        temp_diff = temp - prev_temp
        if temp_diff > 5.0:
            anomalies.append({
                "type": "Thermal instability",
                "severity": "Critical" if temp_diff > 10.0 else "Warning",
                "rootCause": f"Rapid temperature increase of {temp_diff:.1f}°C over last {len(history)} readings.",
                "action": "Inspect cooling fan, check coolant levels, and verify ventilation ducts."
            })

    # B. Vibration / Mechanical misalignment
    if vibration > 1.0:
        anomalies.append({
            "type": "Mechanical misalignment",
            "severity": "Critical" if vibration > 1.4 else "Warning",
            "rootCause": f"Excessive vibration: {vibration:.2f} g exceeds safety limit of 0.8 g.",
            "action": "Inspect spindle bearing within the next maintenance window." if m_id == 'MC-107'
                      else "Verify rotor eccentricity and balancing load."
        })

    # C. Electrical overload
    if current > 22.0:
        anomalies.append({
            "type": "Electrical overload",
            "severity": "Critical" if current > 25.0 else "Warning",
            "rootCause": f"High current spike: {current:.1f} A exceeds nominal current bounds.",
            "action": "Verify motor stator windings and check electrical contacts."
        })

    # D. Pressure fluctuation (machine-specific)
    if m_id in ['MC-104', 'MC-106']:
        normal_pressure = 6.2 if m_id == 'MC-104' else 185.0
        deviation = abs(pressure - normal_pressure) / max(normal_pressure, 1.0)
        if deviation > 0.25:
            anomalies.append({
                "type": "Pneumatic/Hydraulic fluctuation",
                "severity": "Critical" if deviation > 0.4 else "Warning",
                "rootCause": f"Abnormal pressure: {pressure:.1f} bar deviates {deviation*100:.0f}% from {normal_pressure} bar nominal.",
                "action": "Check hydraulic valve seals, inspect fluid lines, and verify discharge ports."
            })

    # E. RPM instability — temporal check (new: mirrors JS AI engine)
    if len(history) >= 3:
        def _get_rpm(rec):
            return int(rec.get('rpm', 0) if isinstance(rec, dict) else getattr(rec, 'rpm', 0))
        hist_rpms = [_get_rpm(h) for h in history[:5]]
        avg_rpm = sum(hist_rpms) / len(hist_rpms) if hist_rpms else 0
        if avg_rpm > 100 and abs(rpm - avg_rpm) / avg_rpm > 0.15:
            anomalies.append({
                "type": "Rotational instability",
                "severity": "Warning",
                "rootCause": f"RPM {rpm} deviates {abs(rpm-avg_rpm)/avg_rpm*100:.0f}% from historical mean of {avg_rpm:.0f}.",
                "action": "Inspect drive belt tension and verify variable frequency drive (VFD) settings."
            })

    # F. Energy load anomaly — new detection
    baseline_kw = MACHINE_ENERGY_BASELINES.get(m_id, energy)
    apparent_power_kw = (current * voltage * 1.732) / 1000  # 3-phase kVA estimate
    if apparent_power_kw > baseline_kw * 1.25:
        anomalies.append({
            "type": "Energy overconsumption",
            "severity": "Warning",
            "rootCause": f"Power draw {apparent_power_kw:.1f} kW exceeds baseline {baseline_kw:.1f} kW by {(apparent_power_kw/baseline_kw-1)*100:.0f}%.",
            "action": "Schedule power factor correction audit and check for winding insulation degradation."
        })

    # ─── HEALTH SCORING ENGINE ────────────────────────────────────────────────
    health_deduction = 0.0
    if temp > 50.0:
        health_deduction += (temp - 50.0) * 1.5
    if vibration > 0.5:
        health_deduction += (vibration - 0.5) * 35.0
    if current > 16.0:
        health_deduction += (current - 16.0) * 4.0
    if m_id in ['MC-104', 'MC-106']:
        normal_pressure = 6.2 if m_id == 'MC-104' else 185.0
        deviation = abs(pressure - normal_pressure) / max(normal_pressure, 1.0)
        if deviation > 0.1:
            health_deduction += (deviation - 0.1) * 80.0

    health = max(10, int(100 - health_deduction))

    warn_thresh = thresholds.get("warning", 80)
    crit_thresh = thresholds.get("critical", 50)

    if health < crit_thresh or any(a["severity"] == "Critical" for a in anomalies):
        status = 'Critical'
    elif health < warn_thresh or len(anomalies) > 0:
        status = 'Warning'
    else:
        status = 'Healthy'

    # ─── FAILURE PROBABILITY ─────────────────────────────────────────────────
    if status == 'Critical':
        failure_probability = min(99.9, 80.0 + (100.0 - health) * 0.95)
        ai_confidence = max(88.0, 98.0 - random.uniform(0, 2.0))
    elif status == 'Warning':
        failure_probability = min(79.0, 25.0 + (100.0 - health) * 1.25)
        ai_confidence = max(82.0, 93.0 - random.uniform(0, 4.0))
    else:
        failure_probability = max(0.5, float(f"{2.0 + (100.0 - health) * 0.15:.1f}"))
        ai_confidence = max(92.0, 97.0 - random.uniform(0, 1.5))

    # ─── REMAINING USEFUL LIFE (RUL) ─────────────────────────────────────────
    if status == 'Critical':
        rul = max(1, int(12 * (health / 45.0)))
    elif status == 'Warning':
        rul = max(15, int(150 * (health / 75.0)))
    else:
        rul = max(120, int(240 * (health / 95.0)))

    # ─── RECOMMENDATIONS & EXPLANATIONS ─────────────────────────────────────
    if len(anomalies) > 0:
        # Sort by severity (Critical first)
        anomalies.sort(key=lambda a: 0 if a["severity"] == "Critical" else 1)
        suggested_action = anomalies[0]["action"]
        explanation = (
            f"{anomalies[0]['rootCause']} "
            f"IndusGuard Edge AI flags potential {anomalies[0]['type'].lower()} anomaly "
            f"({len(anomalies)} total anomaly type(s) detected)."
        )
    elif status == 'Warning':
        suggested_action = 'Schedule electrical & thermal maintenance audit during next downtime window.'
        explanation = 'Elevated operational parameters detected. Motor operating slightly above baseline benchmarks.'

    return {
        "health": health,
        "status": status,
        "failure_prob": round(failure_probability, 1),
        "rul": rul,
        "ai_confidence": round(ai_confidence, 1),
        "suggested_action": suggested_action,
        "explanation": explanation,
        "anomalies": anomalies
    }
