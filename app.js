/*
  Telemedicine AAL Clinical Monitoring Web Application Engine
  Handles Role Selection, Authentication, Multi-Patient Dashboards,
  Live 4-Channel Bio-Signal Oscilloscopes, HL7 CDA XML Generation,
  Clinician Session Reports, Doctor Advice Dispatching, and Scenario Simulation.
*/

// === MODAL HELPERS ===
// All modal visibility is controlled ONLY via inline style.display so that
// the CSS .hidden class (display:none !important) never interferes.

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(function(m) {
    m.style.display = 'none';
  });
}

function openModal(id) {
  closeAllModals();
  var m = document.getElementById(id);
  if (m) {
    m.style.display = 'flex';
    // Remove hidden class just in case it was set in HTML
    m.classList.remove('hidden');
  }
  return m;
}

function openDoctorLogin(e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  var m = openModal('modal-doctor-login');
  if (m) {
    var inp = document.getElementById('doc-email');
    if (inp) setTimeout(function() { inp.focus(); }, 50);
  }
}

function openPatientLogin(e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  var m = openModal('modal-patient-login');
  if (m) {
    var inp = document.getElementById('patient-name');
    if (inp) setTimeout(function() { inp.focus(); }, 50);
  }
}

function openForgotPass(e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  openModal('modal-forgot-pass');
}

function loginDoctorDirectly(e) {
  if (e) e.stopPropagation();
  if (window.appShowDoctorPortal) {
    closeAllModals();
    window.appShowDoctorPortal('dr.smith@telemed-aal.org');
  } else {
    openDoctorLogin(e);
  }
}

function loginPatientDirectly(e) {
  if (e) e.stopPropagation();
  if (window.appShowPatientPortal) {
    closeAllModals();
    window.appShowPatientPortal('AAL Patient 0042');
  } else {
    openPatientLogin(e);
  }
}

// Expose all to global scope so inline onclick attributes work
window.closeAllModals    = closeAllModals;
window.openModal         = openModal;
window.openDoctorLogin   = openDoctorLogin;
window.openPatientLogin  = openPatientLogin;
window.openForgotPass    = openForgotPass;
window.loginDoctorDirectly  = loginDoctorDirectly;
window.loginPatientDirectly = loginPatientDirectly;


document.addEventListener('DOMContentLoaded', () => {
  // Global Application State
  const state = {
    currentUserRole: null, // 'doctor' or 'patient'
    currentDoctorEmail: null,
    currentPatientId: null,
    selectedPatientId: 'PATIENT_AAL_0042',
    activeScenario: 'baseline',
    
    // Multi-Patient Monitored Cohort
    patients: [
        {
            "id": "PATIENT_AAL_0000",
            "name": "AAL Patient 0000 (Random Dummy)",
            "bedId": "BED_SIM_00",
            "dob": "19910101",
            "age": 35,
            "gender": "Male",
            "fsmState": "ARTIFACT_REJECTED",
            "actionTrigger": "REJECT_FALSE_ALARM",
            "confidence": 0.987,
            "concordance": 0.908,
            "anomalyDesc": "Artifact Spill (Suppressed)",
            "rationale": "Day 30 Automated Simulation Testbed Run: Synthetic saline fluid spill injection (slew rate 35 uS/s). FSM false-alarm rejection validated.",
            "metrics": {
                "hrBpm": 105.0,
                "rmssdMs": 85.0,
                "impedanceRawUs": 25.0,
                "impedanceDeltaUs": 18.0,
                "impedanceSlew": 25.0,
                "actigraphyRmsG": 0.012,
                "shivering": false,
                "macroShift": false,
                "acousticEnergy": 0.00025,
                "acousticBurst": false,
                "diaphoresis": false,
                "fluidSpill": true
            },
            "adviceHistory": [
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-19 22:30:00",
                    "text": "Engineering Directive Day 30: Verification Test Suite 05: Fluid spill artifact discriminator rejected false alarm without nurse disruption. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-18 20:27:00",
                    "text": "Engineering Directive Day 29: Verification Test Suite 04: Tri-modal fusion confidence reached 98.7%. Nurse alert emitted accurately. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-17 22:45:00",
                    "text": "Engineering Directive Day 28: Verification Test Suite 03: Shivering detector matched target 8-12 Hz tremor bandwidth. Fan shutoff confirmed. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-16 21:37:00",
                    "text": "Engineering Directive Day 27: Verification Test Suite 02: Closed-loop HVAC relay response confirmed. Relay latency within 200 ms ISO spec. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-15 20:49:00",
                    "text": "Engineering Directive Day 26: Verification Test Suite 01: Baseline sensor calibration passed with 99.8% signal-to-noise ratio. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-14 22:37:00",
                    "text": "Engineering Directive Day 25: Verification Test Suite 05: Fluid spill artifact discriminator rejected false alarm without nurse disruption. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-13 21:31:00",
                    "text": "Engineering Directive Day 24: Verification Test Suite 04: Tri-modal fusion confidence reached 98.7%. Nurse alert emitted accurately. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-12 21:20:00",
                    "text": "Engineering Directive Day 23: Verification Test Suite 03: Shivering detector matched target 8-12 Hz tremor bandwidth. Fan shutoff confirmed. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-11 20:38:00",
                    "text": "Engineering Directive Day 22: Verification Test Suite 02: Closed-loop HVAC relay response confirmed. Relay latency within 200 ms ISO spec. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-10 21:17:00",
                    "text": "Engineering Directive Day 21: Verification Test Suite 01: Baseline sensor calibration passed with 99.8% signal-to-noise ratio. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-09 21:31:00",
                    "text": "Engineering Directive Day 20: Verification Test Suite 05: Fluid spill artifact discriminator rejected false alarm without nurse disruption. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-08 21:38:00",
                    "text": "Engineering Directive Day 19: Verification Test Suite 04: Tri-modal fusion confidence reached 98.7%. Nurse alert emitted accurately. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-07 22:39:00",
                    "text": "Engineering Directive Day 18: Verification Test Suite 03: Shivering detector matched target 8-12 Hz tremor bandwidth. Fan shutoff confirmed. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-06 21:16:00",
                    "text": "Engineering Directive Day 17: Verification Test Suite 02: Closed-loop HVAC relay response confirmed. Relay latency within 200 ms ISO spec. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-05 20:26:00",
                    "text": "Engineering Directive Day 16: Verification Test Suite 01: Baseline sensor calibration passed with 99.8% signal-to-noise ratio. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-04 22:22:00",
                    "text": "Engineering Directive Day 15: Verification Test Suite 05: Fluid spill artifact discriminator rejected false alarm without nurse disruption. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-03 20:10:00",
                    "text": "Engineering Directive Day 14: Verification Test Suite 04: Tri-modal fusion confidence reached 98.7%. Nurse alert emitted accurately. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-02 21:21:00",
                    "text": "Engineering Directive Day 13: Verification Test Suite 03: Shivering detector matched target 8-12 Hz tremor bandwidth. Fan shutoff confirmed. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-09-01 21:20:00",
                    "text": "Engineering Directive Day 12: Verification Test Suite 02: Closed-loop HVAC relay response confirmed. Relay latency within 200 ms ISO spec. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-08-31 21:43:00",
                    "text": "Engineering Directive Day 11: Verification Test Suite 01: Baseline sensor calibration passed with 99.8% signal-to-noise ratio. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-08-30 20:23:00",
                    "text": "Engineering Directive Day 10: Verification Test Suite 05: Fluid spill artifact discriminator rejected false alarm without nurse disruption. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-08-29 20:30:00",
                    "text": "Engineering Directive Day 9: Verification Test Suite 04: Tri-modal fusion confidence reached 98.7%. Nurse alert emitted accurately. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-08-28 21:49:00",
                    "text": "Engineering Directive Day 8: Verification Test Suite 03: Shivering detector matched target 8-12 Hz tremor bandwidth. Fan shutoff confirmed. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-08-27 20:35:00",
                    "text": "Engineering Directive Day 7: Verification Test Suite 02: Closed-loop HVAC relay response confirmed. Relay latency within 200 ms ISO spec. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-08-26 20:15:00",
                    "text": "Engineering Directive Day 6: Verification Test Suite 01: Baseline sensor calibration passed with 99.8% signal-to-noise ratio. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-08-25 22:20:00",
                    "text": "Engineering Directive Day 5: Verification Test Suite 05: Fluid spill artifact discriminator rejected false alarm without nurse disruption. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-08-24 20:34:00",
                    "text": "Engineering Directive Day 4: Verification Test Suite 04: Tri-modal fusion confidence reached 98.7%. Nurse alert emitted accurately. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-08-23 21:17:00",
                    "text": "Engineering Directive Day 3: Verification Test Suite 03: Shivering detector matched target 8-12 Hz tremor bandwidth. Fan shutoff confirmed. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-08-22 22:45:00",
                    "text": "Engineering Directive Day 2: Verification Test Suite 02: Closed-loop HVAC relay response confirmed. Relay latency within 200 ms ISO spec. System uptime 100% on Bed BED_SIM_00."
                },
                {
                    "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                    "timestamp": "2026-08-21 21:24:00",
                    "text": "Engineering Directive Day 1: Verification Test Suite 01: Baseline sensor calibration passed with 99.8% signal-to-noise ratio. System uptime 100% on Bed BED_SIM_00."
                }
            ],
            "sessions": [
                {
                    "sessionId": "SESSION_01",
                    "sessionNum": 1,
                    "timestamp": "2026-08-21 21:24:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.979,
                    "concordance": 0.901,
                    "anomalyDesc": "No",
                    "rationale": "Day 1 Automated Simulation Testbed Run: Simulated sleep baseline test: sensor impedance and Pan-Tompkins QRS calibrated at 250 Hz.",
                    "metrics": {
                        "hrBpm": 68.0,
                        "rmssdMs": 38.0,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-08-21 21:24:00",
                        "text": "Engineering Directive Day 1: Verification Test Suite 01: Baseline sensor calibration passed with 99.8% signal-to-noise ratio. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_02",
                    "sessionNum": 2,
                    "timestamp": "2026-08-22 22:45:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.969,
                    "concordance": 0.932,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 2 Automated Simulation Testbed Run: Injected synthetic diaphoresis pulse (+11.2 uS). Smart HVAC Fan/AC relay triggered in 120 ms.",
                    "metrics": {
                        "hrBpm": 96.0,
                        "rmssdMs": 75.0,
                        "impedanceRawUs": 15.0,
                        "impedanceDeltaUs": 10.5,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-08-22 22:45:00",
                        "text": "Engineering Directive Day 2: Verification Test Suite 02: Closed-loop HVAC relay response confirmed. Relay latency within 200 ms ISO spec. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_03",
                    "sessionNum": 3,
                    "timestamp": "2026-08-23 21:17:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.982,
                    "concordance": 0.955,
                    "anomalyDesc": "Nocturnal Somatic Shiver",
                    "rationale": "Day 3 Automated Simulation Testbed Run: Injected 0.13g micro-shiver harmonic actigraphy. HVAC heating shutoff command validated.",
                    "metrics": {
                        "hrBpm": 68.0,
                        "rmssdMs": 38.0,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.12,
                        "shivering": true,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-08-23 21:17:00",
                        "text": "Engineering Directive Day 3: Verification Test Suite 03: Shivering detector matched target 8-12 Hz tremor bandwidth. Fan shutoff confirmed. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_04",
                    "sessionNum": 4,
                    "timestamp": "2026-08-24 20:34:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "PRE_EMESIS_WARNING",
                    "actionTrigger": "ALERT_NURSE_PRE_EMESIS",
                    "confidence": 0.973,
                    "concordance": 0.926,
                    "anomalyDesc": "Yes (PRE_EMESIS_WARNING - Prodrome)",
                    "rationale": "Day 4 Automated Simulation Testbed Run: Synthetic multi-modal emetic cascade: HR surge + EDA spike + enteric retch burst injected.",
                    "metrics": {
                        "hrBpm": 105.0,
                        "rmssdMs": 85.0,
                        "impedanceRawUs": 25.0,
                        "impedanceDeltaUs": 18.0,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.008,
                        "acousticBurst": true,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-08-24 20:34:00",
                        "text": "Engineering Directive Day 4: Verification Test Suite 04: Tri-modal fusion confidence reached 98.7%. Nurse alert emitted accurately. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_05",
                    "sessionNum": 5,
                    "timestamp": "2026-08-25 22:20:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "ARTIFACT_REJECTED",
                    "actionTrigger": "REJECT_FALSE_ALARM",
                    "confidence": 0.973,
                    "concordance": 0.966,
                    "anomalyDesc": "Artifact Spill (Suppressed)",
                    "rationale": "Day 5 Automated Simulation Testbed Run: Synthetic saline fluid spill injection (slew rate 35 uS/s). FSM false-alarm rejection validated.",
                    "metrics": {
                        "hrBpm": 105.0,
                        "rmssdMs": 85.0,
                        "impedanceRawUs": 25.0,
                        "impedanceDeltaUs": 18.0,
                        "impedanceSlew": 25.0,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": true
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-08-25 22:20:00",
                        "text": "Engineering Directive Day 5: Verification Test Suite 05: Fluid spill artifact discriminator rejected false alarm without nurse disruption. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_06",
                    "sessionNum": 6,
                    "timestamp": "2026-08-26 20:15:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.963,
                    "concordance": 0.914,
                    "anomalyDesc": "No",
                    "rationale": "Day 6 Automated Simulation Testbed Run: Simulated sleep baseline test: sensor impedance and Pan-Tompkins QRS calibrated at 250 Hz.",
                    "metrics": {
                        "hrBpm": 68.0,
                        "rmssdMs": 38.0,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-08-26 20:15:00",
                        "text": "Engineering Directive Day 6: Verification Test Suite 01: Baseline sensor calibration passed with 99.8% signal-to-noise ratio. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_07",
                    "sessionNum": 7,
                    "timestamp": "2026-08-27 20:35:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.962,
                    "concordance": 0.946,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 7 Automated Simulation Testbed Run: Injected synthetic diaphoresis pulse (+11.2 uS). Smart HVAC Fan/AC relay triggered in 120 ms.",
                    "metrics": {
                        "hrBpm": 96.0,
                        "rmssdMs": 75.0,
                        "impedanceRawUs": 15.0,
                        "impedanceDeltaUs": 10.5,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-08-27 20:35:00",
                        "text": "Engineering Directive Day 7: Verification Test Suite 02: Closed-loop HVAC relay response confirmed. Relay latency within 200 ms ISO spec. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_08",
                    "sessionNum": 8,
                    "timestamp": "2026-08-28 21:49:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.971,
                    "concordance": 0.919,
                    "anomalyDesc": "Nocturnal Somatic Shiver",
                    "rationale": "Day 8 Automated Simulation Testbed Run: Injected 0.13g micro-shiver harmonic actigraphy. HVAC heating shutoff command validated.",
                    "metrics": {
                        "hrBpm": 68.0,
                        "rmssdMs": 38.0,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.12,
                        "shivering": true,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-08-28 21:49:00",
                        "text": "Engineering Directive Day 8: Verification Test Suite 03: Shivering detector matched target 8-12 Hz tremor bandwidth. Fan shutoff confirmed. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_09",
                    "sessionNum": 9,
                    "timestamp": "2026-08-29 20:30:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "PRE_EMESIS_WARNING",
                    "actionTrigger": "ALERT_NURSE_PRE_EMESIS",
                    "confidence": 0.986,
                    "concordance": 0.919,
                    "anomalyDesc": "Yes (PRE_EMESIS_WARNING - Prodrome)",
                    "rationale": "Day 9 Automated Simulation Testbed Run: Synthetic multi-modal emetic cascade: HR surge + EDA spike + enteric retch burst injected.",
                    "metrics": {
                        "hrBpm": 105.0,
                        "rmssdMs": 85.0,
                        "impedanceRawUs": 25.0,
                        "impedanceDeltaUs": 18.0,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.008,
                        "acousticBurst": true,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-08-29 20:30:00",
                        "text": "Engineering Directive Day 9: Verification Test Suite 04: Tri-modal fusion confidence reached 98.7%. Nurse alert emitted accurately. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_10",
                    "sessionNum": 10,
                    "timestamp": "2026-08-30 20:23:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "ARTIFACT_REJECTED",
                    "actionTrigger": "REJECT_FALSE_ALARM",
                    "confidence": 0.985,
                    "concordance": 0.952,
                    "anomalyDesc": "Artifact Spill (Suppressed)",
                    "rationale": "Day 10 Automated Simulation Testbed Run: Synthetic saline fluid spill injection (slew rate 35 uS/s). FSM false-alarm rejection validated.",
                    "metrics": {
                        "hrBpm": 105.0,
                        "rmssdMs": 85.0,
                        "impedanceRawUs": 25.0,
                        "impedanceDeltaUs": 18.0,
                        "impedanceSlew": 25.0,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": true
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-08-30 20:23:00",
                        "text": "Engineering Directive Day 10: Verification Test Suite 05: Fluid spill artifact discriminator rejected false alarm without nurse disruption. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_11",
                    "sessionNum": 11,
                    "timestamp": "2026-08-31 21:43:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.97,
                    "concordance": 0.952,
                    "anomalyDesc": "No",
                    "rationale": "Day 11 Automated Simulation Testbed Run: Simulated sleep baseline test: sensor impedance and Pan-Tompkins QRS calibrated at 250 Hz.",
                    "metrics": {
                        "hrBpm": 68.0,
                        "rmssdMs": 38.0,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-08-31 21:43:00",
                        "text": "Engineering Directive Day 11: Verification Test Suite 01: Baseline sensor calibration passed with 99.8% signal-to-noise ratio. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_12",
                    "sessionNum": 12,
                    "timestamp": "2026-09-01 21:20:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.984,
                    "concordance": 0.91,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 12 Automated Simulation Testbed Run: Injected synthetic diaphoresis pulse (+11.2 uS). Smart HVAC Fan/AC relay triggered in 120 ms.",
                    "metrics": {
                        "hrBpm": 96.0,
                        "rmssdMs": 75.0,
                        "impedanceRawUs": 15.0,
                        "impedanceDeltaUs": 10.5,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-01 21:20:00",
                        "text": "Engineering Directive Day 12: Verification Test Suite 02: Closed-loop HVAC relay response confirmed. Relay latency within 200 ms ISO spec. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_13",
                    "sessionNum": 13,
                    "timestamp": "2026-09-02 21:21:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.966,
                    "concordance": 0.955,
                    "anomalyDesc": "Nocturnal Somatic Shiver",
                    "rationale": "Day 13 Automated Simulation Testbed Run: Injected 0.13g micro-shiver harmonic actigraphy. HVAC heating shutoff command validated.",
                    "metrics": {
                        "hrBpm": 68.0,
                        "rmssdMs": 38.0,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.12,
                        "shivering": true,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-02 21:21:00",
                        "text": "Engineering Directive Day 13: Verification Test Suite 03: Shivering detector matched target 8-12 Hz tremor bandwidth. Fan shutoff confirmed. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_14",
                    "sessionNum": 14,
                    "timestamp": "2026-09-03 20:10:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "PRE_EMESIS_WARNING",
                    "actionTrigger": "ALERT_NURSE_PRE_EMESIS",
                    "confidence": 0.962,
                    "concordance": 0.941,
                    "anomalyDesc": "Yes (PRE_EMESIS_WARNING - Prodrome)",
                    "rationale": "Day 14 Automated Simulation Testbed Run: Synthetic multi-modal emetic cascade: HR surge + EDA spike + enteric retch burst injected.",
                    "metrics": {
                        "hrBpm": 105.0,
                        "rmssdMs": 85.0,
                        "impedanceRawUs": 25.0,
                        "impedanceDeltaUs": 18.0,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.008,
                        "acousticBurst": true,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-03 20:10:00",
                        "text": "Engineering Directive Day 14: Verification Test Suite 04: Tri-modal fusion confidence reached 98.7%. Nurse alert emitted accurately. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_15",
                    "sessionNum": 15,
                    "timestamp": "2026-09-04 22:22:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "ARTIFACT_REJECTED",
                    "actionTrigger": "REJECT_FALSE_ALARM",
                    "confidence": 0.976,
                    "concordance": 0.946,
                    "anomalyDesc": "Artifact Spill (Suppressed)",
                    "rationale": "Day 15 Automated Simulation Testbed Run: Synthetic saline fluid spill injection (slew rate 35 uS/s). FSM false-alarm rejection validated.",
                    "metrics": {
                        "hrBpm": 105.0,
                        "rmssdMs": 85.0,
                        "impedanceRawUs": 25.0,
                        "impedanceDeltaUs": 18.0,
                        "impedanceSlew": 25.0,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": true
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-04 22:22:00",
                        "text": "Engineering Directive Day 15: Verification Test Suite 05: Fluid spill artifact discriminator rejected false alarm without nurse disruption. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_16",
                    "sessionNum": 16,
                    "timestamp": "2026-09-05 20:26:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.963,
                    "concordance": 0.947,
                    "anomalyDesc": "No",
                    "rationale": "Day 16 Automated Simulation Testbed Run: Simulated sleep baseline test: sensor impedance and Pan-Tompkins QRS calibrated at 250 Hz.",
                    "metrics": {
                        "hrBpm": 68.0,
                        "rmssdMs": 38.0,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-05 20:26:00",
                        "text": "Engineering Directive Day 16: Verification Test Suite 01: Baseline sensor calibration passed with 99.8% signal-to-noise ratio. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_17",
                    "sessionNum": 17,
                    "timestamp": "2026-09-06 21:16:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.966,
                    "concordance": 0.958,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 17 Automated Simulation Testbed Run: Injected synthetic diaphoresis pulse (+11.2 uS). Smart HVAC Fan/AC relay triggered in 120 ms.",
                    "metrics": {
                        "hrBpm": 96.0,
                        "rmssdMs": 75.0,
                        "impedanceRawUs": 15.0,
                        "impedanceDeltaUs": 10.5,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-06 21:16:00",
                        "text": "Engineering Directive Day 17: Verification Test Suite 02: Closed-loop HVAC relay response confirmed. Relay latency within 200 ms ISO spec. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_18",
                    "sessionNum": 18,
                    "timestamp": "2026-09-07 22:39:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.983,
                    "concordance": 0.967,
                    "anomalyDesc": "Nocturnal Somatic Shiver",
                    "rationale": "Day 18 Automated Simulation Testbed Run: Injected 0.13g micro-shiver harmonic actigraphy. HVAC heating shutoff command validated.",
                    "metrics": {
                        "hrBpm": 68.0,
                        "rmssdMs": 38.0,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.12,
                        "shivering": true,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-07 22:39:00",
                        "text": "Engineering Directive Day 18: Verification Test Suite 03: Shivering detector matched target 8-12 Hz tremor bandwidth. Fan shutoff confirmed. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_19",
                    "sessionNum": 19,
                    "timestamp": "2026-09-08 21:38:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "PRE_EMESIS_WARNING",
                    "actionTrigger": "ALERT_NURSE_PRE_EMESIS",
                    "confidence": 0.986,
                    "concordance": 0.908,
                    "anomalyDesc": "Yes (PRE_EMESIS_WARNING - Prodrome)",
                    "rationale": "Day 19 Automated Simulation Testbed Run: Synthetic multi-modal emetic cascade: HR surge + EDA spike + enteric retch burst injected.",
                    "metrics": {
                        "hrBpm": 105.0,
                        "rmssdMs": 85.0,
                        "impedanceRawUs": 25.0,
                        "impedanceDeltaUs": 18.0,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.008,
                        "acousticBurst": true,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-08 21:38:00",
                        "text": "Engineering Directive Day 19: Verification Test Suite 04: Tri-modal fusion confidence reached 98.7%. Nurse alert emitted accurately. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_20",
                    "sessionNum": 20,
                    "timestamp": "2026-09-09 21:31:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "ARTIFACT_REJECTED",
                    "actionTrigger": "REJECT_FALSE_ALARM",
                    "confidence": 0.978,
                    "concordance": 0.959,
                    "anomalyDesc": "Artifact Spill (Suppressed)",
                    "rationale": "Day 20 Automated Simulation Testbed Run: Synthetic saline fluid spill injection (slew rate 35 uS/s). FSM false-alarm rejection validated.",
                    "metrics": {
                        "hrBpm": 105.0,
                        "rmssdMs": 85.0,
                        "impedanceRawUs": 25.0,
                        "impedanceDeltaUs": 18.0,
                        "impedanceSlew": 25.0,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": true
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-09 21:31:00",
                        "text": "Engineering Directive Day 20: Verification Test Suite 05: Fluid spill artifact discriminator rejected false alarm without nurse disruption. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_21",
                    "sessionNum": 21,
                    "timestamp": "2026-09-10 21:17:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.969,
                    "concordance": 0.918,
                    "anomalyDesc": "No",
                    "rationale": "Day 21 Automated Simulation Testbed Run: Simulated sleep baseline test: sensor impedance and Pan-Tompkins QRS calibrated at 250 Hz.",
                    "metrics": {
                        "hrBpm": 68.0,
                        "rmssdMs": 38.0,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-10 21:17:00",
                        "text": "Engineering Directive Day 21: Verification Test Suite 01: Baseline sensor calibration passed with 99.8% signal-to-noise ratio. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_22",
                    "sessionNum": 22,
                    "timestamp": "2026-09-11 20:38:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.963,
                    "concordance": 0.959,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 22 Automated Simulation Testbed Run: Injected synthetic diaphoresis pulse (+11.2 uS). Smart HVAC Fan/AC relay triggered in 120 ms.",
                    "metrics": {
                        "hrBpm": 96.0,
                        "rmssdMs": 75.0,
                        "impedanceRawUs": 15.0,
                        "impedanceDeltaUs": 10.5,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-11 20:38:00",
                        "text": "Engineering Directive Day 22: Verification Test Suite 02: Closed-loop HVAC relay response confirmed. Relay latency within 200 ms ISO spec. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_23",
                    "sessionNum": 23,
                    "timestamp": "2026-09-12 21:20:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.96,
                    "concordance": 0.912,
                    "anomalyDesc": "Nocturnal Somatic Shiver",
                    "rationale": "Day 23 Automated Simulation Testbed Run: Injected 0.13g micro-shiver harmonic actigraphy. HVAC heating shutoff command validated.",
                    "metrics": {
                        "hrBpm": 68.0,
                        "rmssdMs": 38.0,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.12,
                        "shivering": true,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-12 21:20:00",
                        "text": "Engineering Directive Day 23: Verification Test Suite 03: Shivering detector matched target 8-12 Hz tremor bandwidth. Fan shutoff confirmed. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_24",
                    "sessionNum": 24,
                    "timestamp": "2026-09-13 21:31:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "PRE_EMESIS_WARNING",
                    "actionTrigger": "ALERT_NURSE_PRE_EMESIS",
                    "confidence": 0.964,
                    "concordance": 0.906,
                    "anomalyDesc": "Yes (PRE_EMESIS_WARNING - Prodrome)",
                    "rationale": "Day 24 Automated Simulation Testbed Run: Synthetic multi-modal emetic cascade: HR surge + EDA spike + enteric retch burst injected.",
                    "metrics": {
                        "hrBpm": 105.0,
                        "rmssdMs": 85.0,
                        "impedanceRawUs": 25.0,
                        "impedanceDeltaUs": 18.0,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.008,
                        "acousticBurst": true,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-13 21:31:00",
                        "text": "Engineering Directive Day 24: Verification Test Suite 04: Tri-modal fusion confidence reached 98.7%. Nurse alert emitted accurately. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_25",
                    "sessionNum": 25,
                    "timestamp": "2026-09-14 22:37:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "ARTIFACT_REJECTED",
                    "actionTrigger": "REJECT_FALSE_ALARM",
                    "confidence": 0.979,
                    "concordance": 0.941,
                    "anomalyDesc": "Artifact Spill (Suppressed)",
                    "rationale": "Day 25 Automated Simulation Testbed Run: Synthetic saline fluid spill injection (slew rate 35 uS/s). FSM false-alarm rejection validated.",
                    "metrics": {
                        "hrBpm": 105.0,
                        "rmssdMs": 85.0,
                        "impedanceRawUs": 25.0,
                        "impedanceDeltaUs": 18.0,
                        "impedanceSlew": 25.0,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": true
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-14 22:37:00",
                        "text": "Engineering Directive Day 25: Verification Test Suite 05: Fluid spill artifact discriminator rejected false alarm without nurse disruption. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_26",
                    "sessionNum": 26,
                    "timestamp": "2026-09-15 20:49:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.966,
                    "concordance": 0.923,
                    "anomalyDesc": "No",
                    "rationale": "Day 26 Automated Simulation Testbed Run: Simulated sleep baseline test: sensor impedance and Pan-Tompkins QRS calibrated at 250 Hz.",
                    "metrics": {
                        "hrBpm": 68.0,
                        "rmssdMs": 38.0,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-15 20:49:00",
                        "text": "Engineering Directive Day 26: Verification Test Suite 01: Baseline sensor calibration passed with 99.8% signal-to-noise ratio. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_27",
                    "sessionNum": 27,
                    "timestamp": "2026-09-16 21:37:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.982,
                    "concordance": 0.918,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 27 Automated Simulation Testbed Run: Injected synthetic diaphoresis pulse (+11.2 uS). Smart HVAC Fan/AC relay triggered in 120 ms.",
                    "metrics": {
                        "hrBpm": 96.0,
                        "rmssdMs": 75.0,
                        "impedanceRawUs": 15.0,
                        "impedanceDeltaUs": 10.5,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-16 21:37:00",
                        "text": "Engineering Directive Day 27: Verification Test Suite 02: Closed-loop HVAC relay response confirmed. Relay latency within 200 ms ISO spec. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_28",
                    "sessionNum": 28,
                    "timestamp": "2026-09-17 22:45:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.988,
                    "concordance": 0.939,
                    "anomalyDesc": "Nocturnal Somatic Shiver",
                    "rationale": "Day 28 Automated Simulation Testbed Run: Injected 0.13g micro-shiver harmonic actigraphy. HVAC heating shutoff command validated.",
                    "metrics": {
                        "hrBpm": 68.0,
                        "rmssdMs": 38.0,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.12,
                        "shivering": true,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-17 22:45:00",
                        "text": "Engineering Directive Day 28: Verification Test Suite 03: Shivering detector matched target 8-12 Hz tremor bandwidth. Fan shutoff confirmed. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_29",
                    "sessionNum": 29,
                    "timestamp": "2026-09-18 20:27:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "PRE_EMESIS_WARNING",
                    "actionTrigger": "ALERT_NURSE_PRE_EMESIS",
                    "confidence": 0.984,
                    "concordance": 0.932,
                    "anomalyDesc": "Yes (PRE_EMESIS_WARNING - Prodrome)",
                    "rationale": "Day 29 Automated Simulation Testbed Run: Synthetic multi-modal emetic cascade: HR surge + EDA spike + enteric retch burst injected.",
                    "metrics": {
                        "hrBpm": 105.0,
                        "rmssdMs": 85.0,
                        "impedanceRawUs": 25.0,
                        "impedanceDeltaUs": 18.0,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.008,
                        "acousticBurst": true,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-18 20:27:00",
                        "text": "Engineering Directive Day 29: Verification Test Suite 04: Tri-modal fusion confidence reached 98.7%. Nurse alert emitted accurately. System uptime 100% on Bed BED_SIM_00."
                    }
                },
                {
                    "sessionId": "SESSION_30",
                    "sessionNum": 30,
                    "timestamp": "2026-09-19 22:30:00",
                    "patientId": "PATIENT_AAL_0000",
                    "name": "AAL Patient 0000 (Random Dummy)",
                    "bedId": "BED_SIM_00",
                    "dob": "19910101",
                    "age": 35,
                    "gender": "Male",
                    "fsmState": "ARTIFACT_REJECTED",
                    "actionTrigger": "REJECT_FALSE_ALARM",
                    "confidence": 0.987,
                    "concordance": 0.908,
                    "anomalyDesc": "Artifact Spill (Suppressed)",
                    "rationale": "Day 30 Automated Simulation Testbed Run: Synthetic saline fluid spill injection (slew rate 35 uS/s). FSM false-alarm rejection validated.",
                    "metrics": {
                        "hrBpm": 105.0,
                        "rmssdMs": 85.0,
                        "impedanceRawUs": 25.0,
                        "impedanceDeltaUs": 18.0,
                        "impedanceSlew": 25.0,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": true
                    },
                    "advice": {
                        "doctor": "Biomedical Systems Engineering Lead (Automated Testbed)",
                        "timestamp": "2026-09-19 22:30:00",
                        "text": "Engineering Directive Day 30: Verification Test Suite 05: Fluid spill artifact discriminator rejected false alarm without nurse disruption. System uptime 100% on Bed BED_SIM_00."
                    }
                }
            ]
        },
        {
            "id": "PATIENT_AAL_0042",
            "name": "AAL Patient 0042 (Elena Rostova)",
            "bedId": "BED_ALPHA_01",
            "dob": "19850412",
            "age": 41,
            "gender": "Female",
            "fsmState": "BASELINE",
            "actionTrigger": "LOG_TELEMETRY",
            "confidence": 0.98,
            "concordance": 0.912,
            "anomalyDesc": "No",
            "rationale": "Post-op Day 30: Final 30-day longitudinal telemedicine monitoring session concluded. System health integrity 100%.",
            "metrics": {
                "hrBpm": 65.0,
                "rmssdMs": 43.5,
                "impedanceRawUs": 3.96,
                "impedanceDeltaUs": 0.03,
                "impedanceSlew": 0.08,
                "actigraphyRmsG": 0.011,
                "shivering": false,
                "macroShift": false,
                "acousticEnergy": 0.0003,
                "acousticBurst": false,
                "diaphoresis": false,
                "fluidSpill": false
            },
            "adviceHistory": [
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-19 21:43:00",
                    "text": "Care Plan Day 30: DISCHARGE DIRECTIVE: Full clinical discharge approved. Patient transitioning to home continuous telemedicine portal. Emergency hotline active if required."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-18 21:27:00",
                    "text": "Care Plan Day 29: Final surgical sign-off. Post-operative follow-up visit scheduled in telemedicine clinic for 4 weeks. Instruct patient to resume light cardio activities."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-17 22:44:00",
                    "text": "Care Plan Day 28: Pre-discharge clinical safety clearance issued. Laboratory blood work shows normal electrolytes, liver enzymes, and complete blood count."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD (Clinical Specialist)",
                    "timestamp": "2026-09-16 20:42:00",
                    "text": "Care Plan Day 27: Outpatient prescriptions printed: Omeprazole 20mg morning, B-complex sublingual daily. Patient education on adequate hydration reviewed."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-15 20:17:00",
                    "text": "Care Plan Day 26: Vital signs stable under all postural changes. Exercise tolerance testing passed without orthostatic hypotension."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-14 20:18:00",
                    "text": "Care Plan Day 25: Begin discharge preparation teaching. Patient instructed on home wearable-free smart bed sensor placement and telemedicine sync app."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-13 20:18:00",
                    "text": "Care Plan Day 24: GI post-op healing milestones 100% fulfilled. Incisions fully re-epithelialized. Patient tolerance of regular healthy solid foods confirmed."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN (Bedside Lead)",
                    "timestamp": "2026-09-12 21:45:00",
                    "text": "Care Plan Day 23: Automated HVAC warming protocol proved effective. Nighttime cabin temperature stabilized within 3 minutes."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD (Clinical Specialist)",
                    "timestamp": "2026-09-11 20:22:00",
                    "text": "Care Plan Day 22: Medication reconciliation completed. Discontinue all prescription antiemetics. Transition to over-the-counter chewable multivitamins and calcium citrate."
                },
                {
                    "doctor": "Physical Therapist James Thorne, DPT",
                    "timestamp": "2026-09-10 21:35:00",
                    "text": "Care Plan Day 21: Full independent functional bed mobility achieved. Stair climbing certified with physical therapy team."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-09 21:49:00",
                    "text": "Care Plan Day 20: Cardiovascular autonomic indices outstanding. Patient completing 30-minute daily walks in hospital courtyard. Clear for discharge planning phase."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN (Bedside Lead)",
                    "timestamp": "2026-09-08 22:31:00",
                    "text": "Care Plan Day 19: Mattress condensation swabbed clean. False alarm rejected by dual-threshold impedance detector. Continue regular bedside monitoring."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-07 22:45:00",
                    "text": "Care Plan Day 18: Patient tolerated soft diet exceptionally well. Bowel acoustic signals normal. Encourage 2,000 mL daily oral hydration in divided doses."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-06 21:25:00",
                    "text": "Care Plan Day 17: Advance to soft mechanical diet (scrambled eggs, cooked fish, soft oatmeal). Monitor gastrointestinal acoustic motility after lunch and dinner."
                },
                {
                    "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                    "timestamp": "2026-09-05 20:25:00",
                    "text": "Care Plan Day 16: Isolated autonomic REM dream surge. Reassuring benign pattern. No pharmacologic escalation required. Maintain sleep environment at 21.5\u00b0C."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-04 21:43:00",
                    "text": "Care Plan Day 15: Mid-stay comprehensive clinical evaluation. Vital signs within tight normal distribution. Discontinue IV access; saline lock catheter removed."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-03 22:40:00",
                    "text": "Care Plan Day 14: Restless leg sensations reported. Check serum magnesium and ferritin levels. Encourage evening relaxation stretches before sleep lock."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD (Clinical Specialist)",
                    "timestamp": "2026-09-02 21:15:00",
                    "text": "Care Plan Day 13: Normal gastric motility acoustics verified. Begin tapering oral antiemetic to as-needed (PRN) basis. Continue oral pantoprazole 40mg daily."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN (Bedside Lead)",
                    "timestamp": "2026-09-01 22:50:00",
                    "text": "Care Plan Day 12: Nighttime thermal sensitivity noted. Adjusted smart room thermostat to 23.5\u00b0C nighttime setpoint. Added lightweight fleece bed throw."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-08-31 21:37:00",
                    "text": "Care Plan Day 11: Progress diet from liquid to Phase-2 pureed foods (pureed legumes, greek yogurt, blended vegetable soups). Take meals slowly over 20-minute periods."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-08-30 22:27:00",
                    "text": "Care Plan Day 10: Mild autonomic exertion fatigue. Keep smart fan set to gentle cooling mode (22\u00b0C) for 45 minutes post-walk. Prescribe oral multivitamin supplement."
                },
                {
                    "doctor": "Physical Therapist James Thorne, DPT",
                    "timestamp": "2026-08-29 21:12:00",
                    "text": "Care Plan Day 9: Unassisted turning in bed tolerated without incision pain. Patient approved for hallway ambulation with telemetry escort twice daily."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-08-28 20:46:00",
                    "text": "Care Plan Day 8: Excellent sleep continuity recorded. Discontinue maintenance IV fluids as oral intake exceeds 1,200 mL/day. Order routine basic metabolic panel (BMP)."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN (Bedside Lead)",
                    "timestamp": "2026-08-27 21:12:00",
                    "text": "Care Plan Day 7: Accidental oral water cup spill on bed sheets confirmed and filtered out by FSM. Fresh conductive e-textile underpad fitted. Alarm correctly suppressed."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-08-26 22:45:00",
                    "text": "Care Plan Day 6: Rapid antiemetic intervention prevented emesis. Re-advance to full clear liquids with ginger tea. Maintain 30-degree bed elevation during liquid intake."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-08-25 20:24:00",
                    "text": "Care Plan Day 5: CRITICAL DIRECTIVE: Pre-emesis warning triggered. Elevate smart bed backrest to 30\u00b0 immediately. Administer IV Metoclopramide 10mg slow push; place suction bucket at bedside."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD (Clinical Specialist)",
                    "timestamp": "2026-08-24 20:50:00",
                    "text": "Care Plan Day 4: Micro-tremor detected consistent with room draft. HVAC heating blanket placed. Review analgesic infusion; maintain oral hydration at 60 mL/hr."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-08-23 22:45:00",
                    "text": "Care Plan Day 3: Autonomic stability restored. Transition patient from strict NPO to clear liquid diet (ice chips, electrolyte broth). Keep telemetry active."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-08-22 22:25:00",
                    "text": "Care Plan Day 2: Post-surgical diaphoresis episode managed via HVAC Fan/AC cooling. Administer IV Ondansetron 4mg for mild autonomic nausea. Change patient gown and linens."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-08-21 22:27:00",
                    "text": "Care Plan Day 1: Admit to smart bed Bed-Alpha-01. Initiate continuous multimodal telemetry. NPO except sips of water. Monitor autonomic tone for vagal vasovagal post-op shifts."
                }
            ],
            "sessions": [
                {
                    "sessionId": "SESSION_01",
                    "sessionNum": 1,
                    "timestamp": "2026-08-21 22:27:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.978,
                    "concordance": 0.967,
                    "anomalyDesc": "No",
                    "rationale": "Post-op Day 1 admission baseline calibrated. Laparoscopic port sites clean; baseline resting telemetry stable.",
                    "metrics": {
                        "hrBpm": 72.4,
                        "rmssdMs": 38.2,
                        "impedanceRawUs": 4.1,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-08-21 22:27:00",
                        "text": "Care Plan Day 1: Admit to smart bed Bed-Alpha-01. Initiate continuous multimodal telemetry. NPO except sips of water. Monitor autonomic tone for vagal vasovagal post-op shifts."
                    }
                },
                {
                    "sessionId": "SESSION_02",
                    "sessionNum": 2,
                    "timestamp": "2026-08-22 22:25:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.99,
                    "concordance": 0.906,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Post-op Day 2: Transient sudomotor cold sweat diaphoresis detected (+8.4 uS rise with high HRV). Smart HVAC cooling engaged at 21\u00b0C.",
                    "metrics": {
                        "hrBpm": 94.6,
                        "rmssdMs": 76.5,
                        "impedanceRawUs": 12.8,
                        "impedanceDeltaUs": 8.4,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.024,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-08-22 22:25:00",
                        "text": "Care Plan Day 2: Post-surgical diaphoresis episode managed via HVAC Fan/AC cooling. Administer IV Ondansetron 4mg for mild autonomic nausea. Change patient gown and linens."
                    }
                },
                {
                    "sessionId": "SESSION_03",
                    "sessionNum": 3,
                    "timestamp": "2026-08-23 22:45:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.986,
                    "concordance": 0.918,
                    "anomalyDesc": "No",
                    "rationale": "Post-op Day 3: Normal restorative nocturnal sleep. Autonomic tonus recovered to baseline. Skin conductance stable at 4.3 uS.",
                    "metrics": {
                        "hrBpm": 68.9,
                        "rmssdMs": 36.4,
                        "impedanceRawUs": 4.3,
                        "impedanceDeltaUs": 0.1,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00028,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-08-23 22:45:00",
                        "text": "Care Plan Day 3: Autonomic stability restored. Transition patient from strict NPO to clear liquid diet (ice chips, electrolyte broth). Keep telemetry active."
                    }
                },
                {
                    "sessionId": "SESSION_04",
                    "sessionNum": 4,
                    "timestamp": "2026-08-24 20:50:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.965,
                    "concordance": 0.945,
                    "anomalyDesc": "Nocturnal Somatic Shiver",
                    "rationale": "Post-op Day 4: Low-amplitude nocturnal somatic tremor detected (0.085g) during early morning ambient cooling. Shiver response mitigated.",
                    "metrics": {
                        "hrBpm": 70.2,
                        "rmssdMs": 34.1,
                        "impedanceRawUs": 4.05,
                        "impedanceDeltaUs": 0.08,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.085,
                        "shivering": true,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD (Clinical Specialist)",
                        "timestamp": "2026-08-24 20:50:00",
                        "text": "Care Plan Day 4: Micro-tremor detected consistent with room draft. HVAC heating blanket placed. Review analgesic infusion; maintain oral hydration at 60 mL/hr."
                    }
                },
                {
                    "sessionId": "SESSION_05",
                    "sessionNum": 5,
                    "timestamp": "2026-08-25 20:24:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "PRE_EMESIS_WARNING",
                    "actionTrigger": "ALERT_NURSE_PRE_EMESIS",
                    "confidence": 0.986,
                    "concordance": 0.954,
                    "anomalyDesc": "Yes (PRE_EMESIS_WARNING - Prodrome)",
                    "rationale": "Post-op Day 5: Prodromal gastric emesis cascade alert: sharp EDA rise (+9.2 uS) paired with gastric retch acoustic bursts (0.0068 V\u00b2).",
                    "metrics": {
                        "hrBpm": 102.5,
                        "rmssdMs": 84.2,
                        "impedanceRawUs": 13.5,
                        "impedanceDeltaUs": 9.2,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.048,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0068,
                        "acousticBurst": true,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-08-25 20:24:00",
                        "text": "Care Plan Day 5: CRITICAL DIRECTIVE: Pre-emesis warning triggered. Elevate smart bed backrest to 30\u00b0 immediately. Administer IV Metoclopramide 10mg slow push; place suction bucket at bedside."
                    }
                },
                {
                    "sessionId": "SESSION_06",
                    "sessionNum": 6,
                    "timestamp": "2026-08-26 22:45:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.96,
                    "concordance": 0.908,
                    "anomalyDesc": "No",
                    "rationale": "Post-op Day 6: Emesis averted successfully. Gastric motility normalized with quiescent enterophonic acoustic background.",
                    "metrics": {
                        "hrBpm": 71.0,
                        "rmssdMs": 37.0,
                        "impedanceRawUs": 4.25,
                        "impedanceDeltaUs": 0.12,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00032,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-08-26 22:45:00",
                        "text": "Care Plan Day 6: Rapid antiemetic intervention prevented emesis. Re-advance to full clear liquids with ginger tea. Maintain 30-degree bed elevation during liquid intake."
                    }
                },
                {
                    "sessionId": "SESSION_07",
                    "sessionNum": 7,
                    "timestamp": "2026-08-27 21:12:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "ARTIFACT_REJECTED",
                    "actionTrigger": "REJECT_FALSE_ALARM",
                    "confidence": 0.966,
                    "concordance": 0.93,
                    "anomalyDesc": "Artifact Spill (Suppressed)",
                    "rationale": "Post-op Day 7: Sudden high slew-rate impedance jump (>20 uS/s) without autonomic tachycardia or acoustic burst. Fluid spill artifact rejected.",
                    "metrics": {
                        "hrBpm": 73.1,
                        "rmssdMs": 35.8,
                        "impedanceRawUs": 22.4,
                        "impedanceDeltaUs": 18.2,
                        "impedanceSlew": 25.0,
                        "actigraphyRmsG": 0.022,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": true
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN (Bedside Lead)",
                        "timestamp": "2026-08-27 21:12:00",
                        "text": "Care Plan Day 7: Accidental oral water cup spill on bed sheets confirmed and filtered out by FSM. Fresh conductive e-textile underpad fitted. Alarm correctly suppressed."
                    }
                },
                {
                    "sessionId": "SESSION_08",
                    "sessionNum": 8,
                    "timestamp": "2026-08-28 20:46:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.967,
                    "concordance": 0.906,
                    "anomalyDesc": "No",
                    "rationale": "Post-op Day 8: Uninterrupted 7-hour deep sleep profile. Autonomic RMSSD 39.5 ms, EDA tonic conductance 4.15 uS.",
                    "metrics": {
                        "hrBpm": 66.8,
                        "rmssdMs": 39.5,
                        "impedanceRawUs": 4.15,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.014,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00035,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-08-28 20:46:00",
                        "text": "Care Plan Day 8: Excellent sleep continuity recorded. Discontinue maintenance IV fluids as oral intake exceeds 1,200 mL/day. Order routine basic metabolic panel (BMP)."
                    }
                },
                {
                    "sessionId": "SESSION_09",
                    "sessionNum": 9,
                    "timestamp": "2026-08-29 21:12:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "POSTURAL_SHIFT",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.979,
                    "concordance": 0.943,
                    "anomalyDesc": "Postural Shift",
                    "rationale": "Post-op Day 9: Macro postural adjustment recorded (0.28g actigraphy vector) during patient repositioning from supine to lateral decubitus.",
                    "metrics": {
                        "hrBpm": 74.2,
                        "rmssdMs": 33.5,
                        "impedanceRawUs": 4.4,
                        "impedanceDeltaUs": 0.15,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.28,
                        "shivering": false,
                        "macroShift": true,
                        "acousticEnergy": 0.0004,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Physical Therapist James Thorne, DPT",
                        "timestamp": "2026-08-29 21:12:00",
                        "text": "Care Plan Day 9: Unassisted turning in bed tolerated without incision pain. Patient approved for hallway ambulation with telemetry escort twice daily."
                    }
                },
                {
                    "sessionId": "SESSION_10",
                    "sessionNum": 10,
                    "timestamp": "2026-08-30 22:27:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.978,
                    "concordance": 0.914,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Post-op Day 10: Mild diaphoresis surge recorded post-ambulation. Automatic HVAC smart cooling engaged to restore thermal homeostasis.",
                    "metrics": {
                        "hrBpm": 92.1,
                        "rmssdMs": 74.0,
                        "impedanceRawUs": 11.2,
                        "impedanceDeltaUs": 6.9,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.03,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00028,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-08-30 22:27:00",
                        "text": "Care Plan Day 10: Mild autonomic exertion fatigue. Keep smart fan set to gentle cooling mode (22\u00b0C) for 45 minutes post-walk. Prescribe oral multivitamin supplement."
                    }
                },
                {
                    "sessionId": "SESSION_11",
                    "sessionNum": 11,
                    "timestamp": "2026-08-31 21:37:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.986,
                    "concordance": 0.938,
                    "anomalyDesc": "No",
                    "rationale": "Post-op Day 11: Stable resting biometrics. Surgical incisional healing inspected; no erythema or exudate.",
                    "metrics": {
                        "hrBpm": 67.5,
                        "rmssdMs": 38.0,
                        "impedanceRawUs": 4.2,
                        "impedanceDeltaUs": 0.06,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00031,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-08-31 21:37:00",
                        "text": "Care Plan Day 11: Progress diet from liquid to Phase-2 pureed foods (pureed legumes, greek yogurt, blended vegetable soups). Take meals slowly over 20-minute periods."
                    }
                },
                {
                    "sessionId": "SESSION_12",
                    "sessionNum": 12,
                    "timestamp": "2026-09-01 22:50:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.97,
                    "concordance": 0.961,
                    "anomalyDesc": "Nocturnal Somatic Shiver",
                    "rationale": "Post-op Day 12: Nocturnal shivering tremor detected at 03:15 AM. FSM executed Fan/AC shutdown to prevent hypothermia.",
                    "metrics": {
                        "hrBpm": 65.4,
                        "rmssdMs": 40.1,
                        "impedanceRawUs": 3.95,
                        "impedanceDeltaUs": 0.04,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.092,
                        "shivering": true,
                        "macroShift": false,
                        "acousticEnergy": 0.00019,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN (Bedside Lead)",
                        "timestamp": "2026-09-01 22:50:00",
                        "text": "Care Plan Day 12: Nighttime thermal sensitivity noted. Adjusted smart room thermostat to 23.5\u00b0C nighttime setpoint. Added lightweight fleece bed throw."
                    }
                },
                {
                    "sessionId": "SESSION_13",
                    "sessionNum": 13,
                    "timestamp": "2026-09-02 21:15:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.973,
                    "concordance": 0.901,
                    "anomalyDesc": "No",
                    "rationale": "Post-op Day 13: Stable nocturnal cardiorespiratory sync. Acoustic phonogram demonstrates rhythmic gastric peristalsis.",
                    "metrics": {
                        "hrBpm": 68.2,
                        "rmssdMs": 36.9,
                        "impedanceRawUs": 4.18,
                        "impedanceDeltaUs": 0.08,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.013,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00034,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD (Clinical Specialist)",
                        "timestamp": "2026-09-02 21:15:00",
                        "text": "Care Plan Day 13: Normal gastric motility acoustics verified. Begin tapering oral antiemetic to as-needed (PRN) basis. Continue oral pantoprazole 40mg daily."
                    }
                },
                {
                    "sessionId": "SESSION_14",
                    "sessionNum": 14,
                    "timestamp": "2026-09-03 22:40:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "POSTURAL_SHIFT",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.988,
                    "concordance": 0.941,
                    "anomalyDesc": "Postural Shift",
                    "rationale": "Post-op Day 14: Frequent bed repositioning between 01:00 and 02:00 AM. Sleep efficiency 84%.",
                    "metrics": {
                        "hrBpm": 76.8,
                        "rmssdMs": 32.1,
                        "impedanceRawUs": 4.35,
                        "impedanceDeltaUs": 0.12,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.32,
                        "shivering": false,
                        "macroShift": true,
                        "acousticEnergy": 0.00045,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-03 22:40:00",
                        "text": "Care Plan Day 14: Restless leg sensations reported. Check serum magnesium and ferritin levels. Encourage evening relaxation stretches before sleep lock."
                    }
                },
                {
                    "sessionId": "SESSION_15",
                    "sessionNum": 15,
                    "timestamp": "2026-09-04 21:43:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.968,
                    "concordance": 0.919,
                    "anomalyDesc": "No",
                    "rationale": "Post-op Day 15: Mid-point monitoring review: Vagal HRV and tonic skin conductance demonstrate complete surgical recovery.",
                    "metrics": {
                        "hrBpm": 69.1,
                        "rmssdMs": 37.8,
                        "impedanceRawUs": 4.08,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00029,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-04 21:43:00",
                        "text": "Care Plan Day 15: Mid-stay comprehensive clinical evaluation. Vital signs within tight normal distribution. Discontinue IV access; saline lock catheter removed."
                    }
                },
                {
                    "sessionId": "SESSION_16",
                    "sessionNum": 16,
                    "timestamp": "2026-09-05 20:25:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.988,
                    "concordance": 0.92,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Post-op Day 16: Sudomotor transient sweat spike (+6.5 uS) during rem sleep dream cycle. Fan/AC engaged for 12 minutes.",
                    "metrics": {
                        "hrBpm": 90.4,
                        "rmssdMs": 71.2,
                        "impedanceRawUs": 10.8,
                        "impedanceDeltaUs": 6.5,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.028,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00026,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                        "timestamp": "2026-09-05 20:25:00",
                        "text": "Care Plan Day 16: Isolated autonomic REM dream surge. Reassuring benign pattern. No pharmacologic escalation required. Maintain sleep environment at 21.5\u00b0C."
                    }
                },
                {
                    "sessionId": "SESSION_17",
                    "sessionNum": 17,
                    "timestamp": "2026-09-06 21:25:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.964,
                    "concordance": 0.964,
                    "anomalyDesc": "No",
                    "rationale": "Post-op Day 17: Smooth resting heart rate trajectory. EDA baseline steady at 4.12 uS without reactive surges.",
                    "metrics": {
                        "hrBpm": 67.0,
                        "rmssdMs": 39.0,
                        "impedanceRawUs": 4.12,
                        "impedanceDeltaUs": 0.04,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.011,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00033,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-06 21:25:00",
                        "text": "Care Plan Day 17: Advance to soft mechanical diet (scrambled eggs, cooked fish, soft oatmeal). Monitor gastrointestinal acoustic motility after lunch and dinner."
                    }
                },
                {
                    "sessionId": "SESSION_18",
                    "sessionNum": 18,
                    "timestamp": "2026-09-07 22:45:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.983,
                    "concordance": 0.906,
                    "anomalyDesc": "No",
                    "rationale": "Post-op Day 18: Enteric motility index robust. Acoustic short-time energy at 0.00038 V2 confirms healthy postprandial peristalsis.",
                    "metrics": {
                        "hrBpm": 66.2,
                        "rmssdMs": 41.2,
                        "impedanceRawUs": 4.05,
                        "impedanceDeltaUs": 0.06,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.014,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00038,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-07 22:45:00",
                        "text": "Care Plan Day 18: Patient tolerated soft diet exceptionally well. Bowel acoustic signals normal. Encourage 2,000 mL daily oral hydration in divided doses."
                    }
                },
                {
                    "sessionId": "SESSION_19",
                    "sessionNum": 19,
                    "timestamp": "2026-09-08 22:31:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "ARTIFACT_REJECTED",
                    "actionTrigger": "REJECT_FALSE_ALARM",
                    "confidence": 0.987,
                    "concordance": 0.97,
                    "anomalyDesc": "Artifact Spill (Suppressed)",
                    "rationale": "Post-op Day 19: Spilled ice pack condensation on smart mattress sheet. Slew rate 28 uS/s correctly identified as external wetness.",
                    "metrics": {
                        "hrBpm": 71.5,
                        "rmssdMs": 36.0,
                        "impedanceRawUs": 24.1,
                        "impedanceDeltaUs": 19.8,
                        "impedanceSlew": 25.0,
                        "actigraphyRmsG": 0.019,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": true
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN (Bedside Lead)",
                        "timestamp": "2026-09-08 22:31:00",
                        "text": "Care Plan Day 19: Mattress condensation swabbed clean. False alarm rejected by dual-threshold impedance detector. Continue regular bedside monitoring."
                    }
                },
                {
                    "sessionId": "SESSION_20",
                    "sessionNum": 20,
                    "timestamp": "2026-09-09 21:49:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.976,
                    "concordance": 0.907,
                    "anomalyDesc": "No",
                    "rationale": "Post-op Day 20: Optimal physiological resting state. High parasympathetic vagal tone (RMSSD 42.0 ms), steady sinus rhythm.",
                    "metrics": {
                        "hrBpm": 65.8,
                        "rmssdMs": 42.0,
                        "impedanceRawUs": 4.02,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-09 21:49:00",
                        "text": "Care Plan Day 20: Cardiovascular autonomic indices outstanding. Patient completing 30-minute daily walks in hospital courtyard. Clear for discharge planning phase."
                    }
                },
                {
                    "sessionId": "SESSION_21",
                    "sessionNum": 21,
                    "timestamp": "2026-09-10 21:35:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "POSTURAL_SHIFT",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.974,
                    "concordance": 0.906,
                    "anomalyDesc": "Postural Shift",
                    "rationale": "Post-op Day 21: Active midnight position change. Zero nocturnal diaphoresis or emetic prodrome detected.",
                    "metrics": {
                        "hrBpm": 75.0,
                        "rmssdMs": 34.0,
                        "impedanceRawUs": 4.2,
                        "impedanceDeltaUs": 0.09,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.31,
                        "shivering": false,
                        "macroShift": true,
                        "acousticEnergy": 0.00042,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Physical Therapist James Thorne, DPT",
                        "timestamp": "2026-09-10 21:35:00",
                        "text": "Care Plan Day 21: Full independent functional bed mobility achieved. Stair climbing certified with physical therapy team."
                    }
                },
                {
                    "sessionId": "SESSION_22",
                    "sessionNum": 22,
                    "timestamp": "2026-09-11 20:22:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.963,
                    "concordance": 0.937,
                    "anomalyDesc": "No",
                    "rationale": "Post-op Day 22: Full night restorative telemetry. Mean heart rate 67.8 BPM, actigraphy RMS 0.015g.",
                    "metrics": {
                        "hrBpm": 67.8,
                        "rmssdMs": 38.5,
                        "impedanceRawUs": 4.11,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00029,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD (Clinical Specialist)",
                        "timestamp": "2026-09-11 20:22:00",
                        "text": "Care Plan Day 22: Medication reconciliation completed. Discontinue all prescription antiemetics. Transition to over-the-counter chewable multivitamins and calcium citrate."
                    }
                },
                {
                    "sessionId": "SESSION_23",
                    "sessionNum": 23,
                    "timestamp": "2026-09-12 21:45:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.969,
                    "concordance": 0.917,
                    "anomalyDesc": "Nocturnal Somatic Shiver",
                    "rationale": "Post-op Day 23: Transient micro-shiver detected at 04:00 AM due to early autumn air front. Heating auto-triggered.",
                    "metrics": {
                        "hrBpm": 68.9,
                        "rmssdMs": 36.2,
                        "impedanceRawUs": 4.14,
                        "impedanceDeltaUs": 0.07,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.088,
                        "shivering": true,
                        "macroShift": false,
                        "acousticEnergy": 0.00021,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN (Bedside Lead)",
                        "timestamp": "2026-09-12 21:45:00",
                        "text": "Care Plan Day 23: Automated HVAC warming protocol proved effective. Nighttime cabin temperature stabilized within 3 minutes."
                    }
                },
                {
                    "sessionId": "SESSION_24",
                    "sessionNum": 24,
                    "timestamp": "2026-09-13 20:18:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.986,
                    "concordance": 0.931,
                    "anomalyDesc": "No",
                    "rationale": "Post-op Day 24: Normal acoustic enteric patterns. Absence of any abnormal autonomic discharge.",
                    "metrics": {
                        "hrBpm": 66.4,
                        "rmssdMs": 40.5,
                        "impedanceRawUs": 4.06,
                        "impedanceDeltaUs": 0.04,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.013,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00035,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-13 20:18:00",
                        "text": "Care Plan Day 24: GI post-op healing milestones 100% fulfilled. Incisions fully re-epithelialized. Patient tolerance of regular healthy solid foods confirmed."
                    }
                },
                {
                    "sessionId": "SESSION_25",
                    "sessionNum": 25,
                    "timestamp": "2026-09-14 20:18:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.972,
                    "concordance": 0.959,
                    "anomalyDesc": "No",
                    "rationale": "Post-op Day 25: Excellent nocturnal autonomic balance. Zero crisis events over preceding 96 hours.",
                    "metrics": {
                        "hrBpm": 65.1,
                        "rmssdMs": 43.1,
                        "impedanceRawUs": 3.98,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.01,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00031,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-14 20:18:00",
                        "text": "Care Plan Day 25: Begin discharge preparation teaching. Patient instructed on home wearable-free smart bed sensor placement and telemedicine sync app."
                    }
                },
                {
                    "sessionId": "SESSION_26",
                    "sessionNum": 26,
                    "timestamp": "2026-09-15 20:17:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "POSTURAL_SHIFT",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.969,
                    "concordance": 0.967,
                    "anomalyDesc": "Postural Shift",
                    "rationale": "Post-op Day 26: Normal sleep cycle position shifting. Cardiac rhythm regular with uniform P-QRS-T morphology.",
                    "metrics": {
                        "hrBpm": 73.5,
                        "rmssdMs": 35.2,
                        "impedanceRawUs": 4.15,
                        "impedanceDeltaUs": 0.08,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.275,
                        "shivering": false,
                        "macroShift": true,
                        "acousticEnergy": 0.00038,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-15 20:17:00",
                        "text": "Care Plan Day 26: Vital signs stable under all postural changes. Exercise tolerance testing passed without orthostatic hypotension."
                    }
                },
                {
                    "sessionId": "SESSION_27",
                    "sessionNum": 27,
                    "timestamp": "2026-09-16 20:42:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.96,
                    "concordance": 0.936,
                    "anomalyDesc": "No",
                    "rationale": "Post-op Day 27: Consistent physiological stability across all 4 sensor streams: ECG, EDA, Piezo, Enteric Acoustics.",
                    "metrics": {
                        "hrBpm": 66.0,
                        "rmssdMs": 41.8,
                        "impedanceRawUs": 4.01,
                        "impedanceDeltaUs": 0.04,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00032,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD (Clinical Specialist)",
                        "timestamp": "2026-09-16 20:42:00",
                        "text": "Care Plan Day 27: Outpatient prescriptions printed: Omeprazole 20mg morning, B-complex sublingual daily. Patient education on adequate hydration reviewed."
                    }
                },
                {
                    "sessionId": "SESSION_28",
                    "sessionNum": 28,
                    "timestamp": "2026-09-17 22:44:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.983,
                    "concordance": 0.911,
                    "anomalyDesc": "No",
                    "rationale": "Post-op Day 28: Continuous monitoring demonstrates robust homeostatic regulation. Sleep score 96/100.",
                    "metrics": {
                        "hrBpm": 65.5,
                        "rmssdMs": 42.5,
                        "impedanceRawUs": 3.97,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.011,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-17 22:44:00",
                        "text": "Care Plan Day 28: Pre-discharge clinical safety clearance issued. Laboratory blood work shows normal electrolytes, liver enzymes, and complete blood count."
                    }
                },
                {
                    "sessionId": "SESSION_29",
                    "sessionNum": 29,
                    "timestamp": "2026-09-18 21:27:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.986,
                    "concordance": 0.904,
                    "anomalyDesc": "No",
                    "rationale": "Post-op Day 29: Optimal resting parameters. No residual nausea, diaphoresis, or autonomic instability.",
                    "metrics": {
                        "hrBpm": 64.8,
                        "rmssdMs": 44.0,
                        "impedanceRawUs": 3.95,
                        "impedanceDeltaUs": 0.02,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.01,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00029,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-18 21:27:00",
                        "text": "Care Plan Day 29: Final surgical sign-off. Post-operative follow-up visit scheduled in telemedicine clinic for 4 weeks. Instruct patient to resume light cardio activities."
                    }
                },
                {
                    "sessionId": "SESSION_30",
                    "sessionNum": 30,
                    "timestamp": "2026-09-19 21:43:00",
                    "patientId": "PATIENT_AAL_0042",
                    "name": "AAL Patient 0042 (Elena Rostova)",
                    "bedId": "BED_ALPHA_01",
                    "dob": "19850412",
                    "age": 41,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.98,
                    "concordance": 0.912,
                    "anomalyDesc": "No",
                    "rationale": "Post-op Day 30: Final 30-day longitudinal telemedicine monitoring session concluded. System health integrity 100%.",
                    "metrics": {
                        "hrBpm": 65.0,
                        "rmssdMs": 43.5,
                        "impedanceRawUs": 3.96,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.011,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-19 21:43:00",
                        "text": "Care Plan Day 30: DISCHARGE DIRECTIVE: Full clinical discharge approved. Patient transitioning to home continuous telemedicine portal. Emergency hotline active if required."
                    }
                }
            ]
        },
        {
            "id": "PATIENT_AAL_0019",
            "name": "AAL Patient 0019 (Marcus Vance)",
            "bedId": "BED_BETA_02",
            "dob": "19580623",
            "age": 68,
            "gender": "Male",
            "fsmState": "BASELINE",
            "actionTrigger": "LOG_TELEMETRY",
            "confidence": 0.971,
            "concordance": 0.904,
            "anomalyDesc": "No",
            "rationale": "Day 30 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.28 uS; resting HRV RMSSD 37.1 ms.",
            "metrics": {
                "hrBpm": 70.4,
                "rmssdMs": 37.1,
                "impedanceRawUs": 5.28,
                "impedanceDeltaUs": 0.08,
                "impedanceSlew": 0.08,
                "actigraphyRmsG": 0.015,
                "shivering": false,
                "macroShift": false,
                "acousticEnergy": 0.00025,
                "acousticBurst": false,
                "diaphoresis": false,
                "fluidSpill": false
            },
            "adviceHistory": [
                {
                    "doctor": "Dr. Alan Turing, MD (Endocrinologist)",
                    "timestamp": "2026-09-19 22:17:00",
                    "text": "Care Plan Day 30: Telemetry baseline stable on Day 30. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                    "timestamp": "2026-09-18 21:25:00",
                    "text": "Care Plan Day 29: Telemetry baseline stable on Day 29. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-17 22:33:00",
                    "text": "Care Plan Day 28: Telemetry baseline stable on Day 28. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Nurse Lead Linda Croft, RN",
                    "timestamp": "2026-09-16 22:21:00",
                    "text": "Care Plan Day 27: Telemetry baseline stable on Day 27. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Dr. Alan Turing, MD (Endocrinologist)",
                    "timestamp": "2026-09-15 22:15:00",
                    "text": "Care Plan Day 26: Telemetry baseline stable on Day 26. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                    "timestamp": "2026-09-14 20:19:00",
                    "text": "Care Plan Day 25: Telemetry baseline stable on Day 25. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-13 20:13:00",
                    "text": "Care Plan Day 24: Telemetry baseline stable on Day 24. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-12 20:41:00",
                    "text": "Care Plan Day 23: Peripheral diabetic paresthesia repositioning. Prescribe Gabapentin 300mg at bedtime. Encourage evening lower-limb calf massage."
                },
                {
                    "doctor": "Dr. Alan Turing, MD (Endocrinologist)",
                    "timestamp": "2026-09-11 22:21:00",
                    "text": "Care Plan Day 22: Telemetry baseline stable on Day 22. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                    "timestamp": "2026-09-10 21:41:00",
                    "text": "Care Plan Day 21: Telemetry baseline stable on Day 21. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                    "timestamp": "2026-09-09 22:48:00",
                    "text": "Care Plan Day 20: Autonomic neuropathy sweat burst noted. Maintain bedroom HVAC cooling at 20-21\u00b0C. Check capillary blood glucose (target 110-140 mg/dL). Titrate evening Clonidine to 0.1mg."
                },
                {
                    "doctor": "Nurse Lead Linda Croft, RN",
                    "timestamp": "2026-09-08 22:24:00",
                    "text": "Care Plan Day 19: Telemetry baseline stable on Day 19. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Nurse Lead Linda Croft, RN",
                    "timestamp": "2026-09-07 20:15:00",
                    "text": "Care Plan Day 18: Thermal rebound shivering noted. Replace chilled sheets with warm dry cotton linen. Ensure hydration with warm chamomile tea."
                },
                {
                    "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                    "timestamp": "2026-09-06 22:40:00",
                    "text": "Care Plan Day 17: Telemetry baseline stable on Day 17. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-05 22:27:00",
                    "text": "Care Plan Day 16: Telemetry baseline stable on Day 16. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Nurse Lead Linda Croft, RN",
                    "timestamp": "2026-09-04 21:35:00",
                    "text": "Care Plan Day 15: Telemetry baseline stable on Day 15. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                    "timestamp": "2026-09-03 22:39:00",
                    "text": "Care Plan Day 14: Autonomic neuropathy sweat burst noted. Maintain bedroom HVAC cooling at 20-21\u00b0C. Check capillary blood glucose (target 110-140 mg/dL). Titrate evening Clonidine to 0.1mg."
                },
                {
                    "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                    "timestamp": "2026-09-02 22:37:00",
                    "text": "Care Plan Day 13: Telemetry baseline stable on Day 13. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-01 20:13:00",
                    "text": "Care Plan Day 12: Telemetry baseline stable on Day 12. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-08-31 21:13:00",
                    "text": "Care Plan Day 11: Peripheral diabetic paresthesia repositioning. Prescribe Gabapentin 300mg at bedtime. Encourage evening lower-limb calf massage."
                },
                {
                    "doctor": "Dr. Alan Turing, MD (Endocrinologist)",
                    "timestamp": "2026-08-30 21:36:00",
                    "text": "Care Plan Day 10: Telemetry baseline stable on Day 10. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                    "timestamp": "2026-08-29 21:15:00",
                    "text": "Care Plan Day 9: Autonomic neuropathy sweat burst noted. Maintain bedroom HVAC cooling at 20-21\u00b0C. Check capillary blood glucose (target 110-140 mg/dL). Titrate evening Clonidine to 0.1mg."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-08-28 21:17:00",
                    "text": "Care Plan Day 8: Telemetry baseline stable on Day 8. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Nurse Lead Linda Croft, RN",
                    "timestamp": "2026-08-27 20:27:00",
                    "text": "Care Plan Day 7: Thermal rebound shivering noted. Replace chilled sheets with warm dry cotton linen. Ensure hydration with warm chamomile tea."
                },
                {
                    "doctor": "Dr. Alan Turing, MD (Endocrinologist)",
                    "timestamp": "2026-08-26 22:30:00",
                    "text": "Care Plan Day 6: Telemetry baseline stable on Day 6. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                    "timestamp": "2026-08-25 20:28:00",
                    "text": "Care Plan Day 5: Autonomic neuropathy sweat burst noted. Maintain bedroom HVAC cooling at 20-21\u00b0C. Check capillary blood glucose (target 110-140 mg/dL). Titrate evening Clonidine to 0.1mg."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-08-24 21:48:00",
                    "text": "Care Plan Day 4: Telemetry baseline stable on Day 4. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Nurse Lead Linda Croft, RN",
                    "timestamp": "2026-08-23 20:45:00",
                    "text": "Care Plan Day 3: Telemetry baseline stable on Day 3. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                },
                {
                    "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                    "timestamp": "2026-08-22 22:43:00",
                    "text": "Care Plan Day 2: Autonomic neuropathy sweat burst noted. Maintain bedroom HVAC cooling at 20-21\u00b0C. Check capillary blood glucose (target 110-140 mg/dL). Titrate evening Clonidine to 0.1mg."
                },
                {
                    "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                    "timestamp": "2026-08-21 20:45:00",
                    "text": "Care Plan Day 1: Telemetry baseline stable on Day 1. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                }
            ],
            "sessions": [
                {
                    "sessionId": "SESSION_01",
                    "sessionNum": 1,
                    "timestamp": "2026-08-21 20:45:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.964,
                    "concordance": 0.906,
                    "anomalyDesc": "No",
                    "rationale": "Day 1 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.31 uS; resting HRV RMSSD 44.8 ms.",
                    "metrics": {
                        "hrBpm": 71.4,
                        "rmssdMs": 44.8,
                        "impedanceRawUs": 5.31,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                        "timestamp": "2026-08-21 20:45:00",
                        "text": "Care Plan Day 1: Telemetry baseline stable on Day 1. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_02",
                    "sessionNum": 2,
                    "timestamp": "2026-08-22 22:43:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.97,
                    "concordance": 0.91,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 2 Telemetry: Nocturnal cholinergic autonomic surge with profuse diaphoresis (+11.5 uS rise at 06:30). Smart HVAC Fan/AC cooling engaged at 21\u00b0C.",
                    "metrics": {
                        "hrBpm": 98.8,
                        "rmssdMs": 81.7,
                        "impedanceRawUs": 27.52,
                        "impedanceDeltaUs": 11.52,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                        "timestamp": "2026-08-22 22:43:00",
                        "text": "Care Plan Day 2: Autonomic neuropathy sweat burst noted. Maintain bedroom HVAC cooling at 20-21\u00b0C. Check capillary blood glucose (target 110-140 mg/dL). Titrate evening Clonidine to 0.1mg."
                    }
                },
                {
                    "sessionId": "SESSION_03",
                    "sessionNum": 3,
                    "timestamp": "2026-08-23 20:45:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.98,
                    "concordance": 0.962,
                    "anomalyDesc": "No",
                    "rationale": "Day 3 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.44 uS; resting HRV RMSSD 38.9 ms.",
                    "metrics": {
                        "hrBpm": 73.7,
                        "rmssdMs": 38.9,
                        "impedanceRawUs": 5.44,
                        "impedanceDeltaUs": 0.13,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Nurse Lead Linda Croft, RN",
                        "timestamp": "2026-08-23 20:45:00",
                        "text": "Care Plan Day 3: Telemetry baseline stable on Day 3. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_04",
                    "sessionNum": 4,
                    "timestamp": "2026-08-24 21:48:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.986,
                    "concordance": 0.914,
                    "anomalyDesc": "No",
                    "rationale": "Day 4 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.42 uS; resting HRV RMSSD 42.5 ms.",
                    "metrics": {
                        "hrBpm": 71.5,
                        "rmssdMs": 42.5,
                        "impedanceRawUs": 5.42,
                        "impedanceDeltaUs": 0.09,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-08-24 21:48:00",
                        "text": "Care Plan Day 4: Telemetry baseline stable on Day 4. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_05",
                    "sessionNum": 5,
                    "timestamp": "2026-08-25 20:28:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.968,
                    "concordance": 0.924,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 5 Telemetry: Nocturnal cholinergic autonomic surge with profuse diaphoresis (+11.8 uS rise at 15:30). Smart HVAC Fan/AC cooling engaged at 21\u00b0C.",
                    "metrics": {
                        "hrBpm": 98.0,
                        "rmssdMs": 79.1,
                        "impedanceRawUs": 27.79,
                        "impedanceDeltaUs": 11.79,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                        "timestamp": "2026-08-25 20:28:00",
                        "text": "Care Plan Day 5: Autonomic neuropathy sweat burst noted. Maintain bedroom HVAC cooling at 20-21\u00b0C. Check capillary blood glucose (target 110-140 mg/dL). Titrate evening Clonidine to 0.1mg."
                    }
                },
                {
                    "sessionId": "SESSION_06",
                    "sessionNum": 6,
                    "timestamp": "2026-08-26 22:30:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.988,
                    "concordance": 0.934,
                    "anomalyDesc": "No",
                    "rationale": "Day 6 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.34 uS; resting HRV RMSSD 40.5 ms.",
                    "metrics": {
                        "hrBpm": 67.0,
                        "rmssdMs": 40.5,
                        "impedanceRawUs": 5.34,
                        "impedanceDeltaUs": 0.11,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Alan Turing, MD (Endocrinologist)",
                        "timestamp": "2026-08-26 22:30:00",
                        "text": "Care Plan Day 6: Telemetry baseline stable on Day 6. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_07",
                    "sessionNum": 7,
                    "timestamp": "2026-08-27 20:27:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.962,
                    "concordance": 0.92,
                    "anomalyDesc": "No",
                    "rationale": "Day 7 Telemetry: Post-cooling somatic shivering micro-tremor detected at early dawn. HVAC Fan/AC turned off to prevent thermal drop.",
                    "metrics": {
                        "hrBpm": 69.6,
                        "rmssdMs": 42.4,
                        "impedanceRawUs": 5.2,
                        "impedanceDeltaUs": 0.1,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Nurse Lead Linda Croft, RN",
                        "timestamp": "2026-08-27 20:27:00",
                        "text": "Care Plan Day 7: Thermal rebound shivering noted. Replace chilled sheets with warm dry cotton linen. Ensure hydration with warm chamomile tea."
                    }
                },
                {
                    "sessionId": "SESSION_08",
                    "sessionNum": 8,
                    "timestamp": "2026-08-28 21:17:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.979,
                    "concordance": 0.93,
                    "anomalyDesc": "No",
                    "rationale": "Day 8 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.40 uS; resting HRV RMSSD 38.2 ms.",
                    "metrics": {
                        "hrBpm": 73.5,
                        "rmssdMs": 38.2,
                        "impedanceRawUs": 5.4,
                        "impedanceDeltaUs": 0.11,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-08-28 21:17:00",
                        "text": "Care Plan Day 8: Telemetry baseline stable on Day 8. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_09",
                    "sessionNum": 9,
                    "timestamp": "2026-08-29 21:15:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.966,
                    "concordance": 0.969,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 9 Telemetry: Nocturnal cholinergic autonomic surge with profuse diaphoresis (+12.7 uS rise at 03:30). Smart HVAC Fan/AC cooling engaged at 21\u00b0C.",
                    "metrics": {
                        "hrBpm": 96.4,
                        "rmssdMs": 81.7,
                        "impedanceRawUs": 28.73,
                        "impedanceDeltaUs": 12.73,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                        "timestamp": "2026-08-29 21:15:00",
                        "text": "Care Plan Day 9: Autonomic neuropathy sweat burst noted. Maintain bedroom HVAC cooling at 20-21\u00b0C. Check capillary blood glucose (target 110-140 mg/dL). Titrate evening Clonidine to 0.1mg."
                    }
                },
                {
                    "sessionId": "SESSION_10",
                    "sessionNum": 10,
                    "timestamp": "2026-08-30 21:36:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.977,
                    "concordance": 0.936,
                    "anomalyDesc": "No",
                    "rationale": "Day 10 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.49 uS; resting HRV RMSSD 36.1 ms.",
                    "metrics": {
                        "hrBpm": 67.0,
                        "rmssdMs": 36.1,
                        "impedanceRawUs": 5.49,
                        "impedanceDeltaUs": 0.07,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Alan Turing, MD (Endocrinologist)",
                        "timestamp": "2026-08-30 21:36:00",
                        "text": "Care Plan Day 10: Telemetry baseline stable on Day 10. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_11",
                    "sessionNum": 11,
                    "timestamp": "2026-08-31 21:13:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "POSTURAL_SHIFT",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.98,
                    "concordance": 0.956,
                    "anomalyDesc": "Postural Shift",
                    "rationale": "Day 11 Telemetry: Frequent restless leg repositioning detected (actigraphy vector 0.29g). Sinus rhythm normal with no autonomic arrhythmias.",
                    "metrics": {
                        "hrBpm": 80.0,
                        "rmssdMs": 36.4,
                        "impedanceRawUs": 5.0,
                        "impedanceDeltaUs": 0.2,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.29,
                        "shivering": false,
                        "macroShift": true,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-08-31 21:13:00",
                        "text": "Care Plan Day 11: Peripheral diabetic paresthesia repositioning. Prescribe Gabapentin 300mg at bedtime. Encourage evening lower-limb calf massage."
                    }
                },
                {
                    "sessionId": "SESSION_12",
                    "sessionNum": 12,
                    "timestamp": "2026-09-01 20:13:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.984,
                    "concordance": 0.954,
                    "anomalyDesc": "No",
                    "rationale": "Day 12 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.38 uS; resting HRV RMSSD 38.4 ms.",
                    "metrics": {
                        "hrBpm": 71.6,
                        "rmssdMs": 38.4,
                        "impedanceRawUs": 5.38,
                        "impedanceDeltaUs": 0.12,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-01 20:13:00",
                        "text": "Care Plan Day 12: Telemetry baseline stable on Day 12. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_13",
                    "sessionNum": 13,
                    "timestamp": "2026-09-02 22:37:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.974,
                    "concordance": 0.967,
                    "anomalyDesc": "No",
                    "rationale": "Day 13 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.44 uS; resting HRV RMSSD 37.0 ms.",
                    "metrics": {
                        "hrBpm": 68.1,
                        "rmssdMs": 37.0,
                        "impedanceRawUs": 5.44,
                        "impedanceDeltaUs": 0.13,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                        "timestamp": "2026-09-02 22:37:00",
                        "text": "Care Plan Day 13: Telemetry baseline stable on Day 13. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_14",
                    "sessionNum": 14,
                    "timestamp": "2026-09-03 22:39:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.966,
                    "concordance": 0.926,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 14 Telemetry: Nocturnal cholinergic autonomic surge with profuse diaphoresis (+11.4 uS rise at 18:30). Smart HVAC Fan/AC cooling engaged at 21\u00b0C.",
                    "metrics": {
                        "hrBpm": 99.2,
                        "rmssdMs": 80.2,
                        "impedanceRawUs": 27.36,
                        "impedanceDeltaUs": 11.36,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                        "timestamp": "2026-09-03 22:39:00",
                        "text": "Care Plan Day 14: Autonomic neuropathy sweat burst noted. Maintain bedroom HVAC cooling at 20-21\u00b0C. Check capillary blood glucose (target 110-140 mg/dL). Titrate evening Clonidine to 0.1mg."
                    }
                },
                {
                    "sessionId": "SESSION_15",
                    "sessionNum": 15,
                    "timestamp": "2026-09-04 21:35:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.979,
                    "concordance": 0.918,
                    "anomalyDesc": "No",
                    "rationale": "Day 15 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.20 uS; resting HRV RMSSD 39.2 ms.",
                    "metrics": {
                        "hrBpm": 73.4,
                        "rmssdMs": 39.2,
                        "impedanceRawUs": 5.2,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Nurse Lead Linda Croft, RN",
                        "timestamp": "2026-09-04 21:35:00",
                        "text": "Care Plan Day 15: Telemetry baseline stable on Day 15. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_16",
                    "sessionNum": 16,
                    "timestamp": "2026-09-05 22:27:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.97,
                    "concordance": 0.953,
                    "anomalyDesc": "No",
                    "rationale": "Day 16 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.20 uS; resting HRV RMSSD 41.0 ms.",
                    "metrics": {
                        "hrBpm": 71.6,
                        "rmssdMs": 41.0,
                        "impedanceRawUs": 5.2,
                        "impedanceDeltaUs": 0.02,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-05 22:27:00",
                        "text": "Care Plan Day 16: Telemetry baseline stable on Day 16. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_17",
                    "sessionNum": 17,
                    "timestamp": "2026-09-06 22:40:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.972,
                    "concordance": 0.909,
                    "anomalyDesc": "No",
                    "rationale": "Day 17 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.30 uS; resting HRV RMSSD 42.0 ms.",
                    "metrics": {
                        "hrBpm": 72.7,
                        "rmssdMs": 42.0,
                        "impedanceRawUs": 5.3,
                        "impedanceDeltaUs": 0.09,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                        "timestamp": "2026-09-06 22:40:00",
                        "text": "Care Plan Day 17: Telemetry baseline stable on Day 17. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_18",
                    "sessionNum": 18,
                    "timestamp": "2026-09-07 20:15:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.976,
                    "concordance": 0.937,
                    "anomalyDesc": "No",
                    "rationale": "Day 18 Telemetry: Post-cooling somatic shivering micro-tremor detected at early dawn. HVAC Fan/AC turned off to prevent thermal drop.",
                    "metrics": {
                        "hrBpm": 71.6,
                        "rmssdMs": 39.6,
                        "impedanceRawUs": 5.2,
                        "impedanceDeltaUs": 0.1,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Nurse Lead Linda Croft, RN",
                        "timestamp": "2026-09-07 20:15:00",
                        "text": "Care Plan Day 18: Thermal rebound shivering noted. Replace chilled sheets with warm dry cotton linen. Ensure hydration with warm chamomile tea."
                    }
                },
                {
                    "sessionId": "SESSION_19",
                    "sessionNum": 19,
                    "timestamp": "2026-09-08 22:24:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.974,
                    "concordance": 0.909,
                    "anomalyDesc": "No",
                    "rationale": "Day 19 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.31 uS; resting HRV RMSSD 41.7 ms.",
                    "metrics": {
                        "hrBpm": 67.3,
                        "rmssdMs": 41.7,
                        "impedanceRawUs": 5.31,
                        "impedanceDeltaUs": 0.08,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Nurse Lead Linda Croft, RN",
                        "timestamp": "2026-09-08 22:24:00",
                        "text": "Care Plan Day 19: Telemetry baseline stable on Day 19. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_20",
                    "sessionNum": 20,
                    "timestamp": "2026-09-09 22:48:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.988,
                    "concordance": 0.916,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 20 Telemetry: Nocturnal cholinergic autonomic surge with profuse diaphoresis (+11.3 uS rise at 12:30). Smart HVAC Fan/AC cooling engaged at 21\u00b0C.",
                    "metrics": {
                        "hrBpm": 99.5,
                        "rmssdMs": 83.2,
                        "impedanceRawUs": 27.28,
                        "impedanceDeltaUs": 11.28,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                        "timestamp": "2026-09-09 22:48:00",
                        "text": "Care Plan Day 20: Autonomic neuropathy sweat burst noted. Maintain bedroom HVAC cooling at 20-21\u00b0C. Check capillary blood glucose (target 110-140 mg/dL). Titrate evening Clonidine to 0.1mg."
                    }
                },
                {
                    "sessionId": "SESSION_21",
                    "sessionNum": 21,
                    "timestamp": "2026-09-10 21:41:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.973,
                    "concordance": 0.948,
                    "anomalyDesc": "No",
                    "rationale": "Day 21 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.34 uS; resting HRV RMSSD 43.2 ms.",
                    "metrics": {
                        "hrBpm": 68.9,
                        "rmssdMs": 43.2,
                        "impedanceRawUs": 5.34,
                        "impedanceDeltaUs": 0.06,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                        "timestamp": "2026-09-10 21:41:00",
                        "text": "Care Plan Day 21: Telemetry baseline stable on Day 21. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_22",
                    "sessionNum": 22,
                    "timestamp": "2026-09-11 22:21:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.971,
                    "concordance": 0.927,
                    "anomalyDesc": "No",
                    "rationale": "Day 22 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.47 uS; resting HRV RMSSD 44.0 ms.",
                    "metrics": {
                        "hrBpm": 69.1,
                        "rmssdMs": 44.0,
                        "impedanceRawUs": 5.47,
                        "impedanceDeltaUs": 0.08,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Alan Turing, MD (Endocrinologist)",
                        "timestamp": "2026-09-11 22:21:00",
                        "text": "Care Plan Day 22: Telemetry baseline stable on Day 22. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_23",
                    "sessionNum": 23,
                    "timestamp": "2026-09-12 20:41:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "POSTURAL_SHIFT",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.967,
                    "concordance": 0.959,
                    "anomalyDesc": "Postural Shift",
                    "rationale": "Day 23 Telemetry: Frequent restless leg repositioning detected (actigraphy vector 0.29g). Sinus rhythm normal with no autonomic arrhythmias.",
                    "metrics": {
                        "hrBpm": 79.5,
                        "rmssdMs": 36.3,
                        "impedanceRawUs": 5.0,
                        "impedanceDeltaUs": 0.2,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.29,
                        "shivering": false,
                        "macroShift": true,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-12 20:41:00",
                        "text": "Care Plan Day 23: Peripheral diabetic paresthesia repositioning. Prescribe Gabapentin 300mg at bedtime. Encourage evening lower-limb calf massage."
                    }
                },
                {
                    "sessionId": "SESSION_24",
                    "sessionNum": 24,
                    "timestamp": "2026-09-13 20:13:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.967,
                    "concordance": 0.969,
                    "anomalyDesc": "No",
                    "rationale": "Day 24 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.28 uS; resting HRV RMSSD 36.2 ms.",
                    "metrics": {
                        "hrBpm": 69.7,
                        "rmssdMs": 36.2,
                        "impedanceRawUs": 5.28,
                        "impedanceDeltaUs": 0.1,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-13 20:13:00",
                        "text": "Care Plan Day 24: Telemetry baseline stable on Day 24. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_25",
                    "sessionNum": 25,
                    "timestamp": "2026-09-14 20:19:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.965,
                    "concordance": 0.918,
                    "anomalyDesc": "No",
                    "rationale": "Day 25 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.29 uS; resting HRV RMSSD 36.0 ms.",
                    "metrics": {
                        "hrBpm": 70.0,
                        "rmssdMs": 36.0,
                        "impedanceRawUs": 5.29,
                        "impedanceDeltaUs": 0.14,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                        "timestamp": "2026-09-14 20:19:00",
                        "text": "Care Plan Day 25: Telemetry baseline stable on Day 25. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_26",
                    "sessionNum": 26,
                    "timestamp": "2026-09-15 22:15:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.978,
                    "concordance": 0.904,
                    "anomalyDesc": "No",
                    "rationale": "Day 26 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.39 uS; resting HRV RMSSD 40.7 ms.",
                    "metrics": {
                        "hrBpm": 72.7,
                        "rmssdMs": 40.7,
                        "impedanceRawUs": 5.39,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Alan Turing, MD (Endocrinologist)",
                        "timestamp": "2026-09-15 22:15:00",
                        "text": "Care Plan Day 26: Telemetry baseline stable on Day 26. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_27",
                    "sessionNum": 27,
                    "timestamp": "2026-09-16 22:21:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.98,
                    "concordance": 0.915,
                    "anomalyDesc": "No",
                    "rationale": "Day 27 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.36 uS; resting HRV RMSSD 39.9 ms.",
                    "metrics": {
                        "hrBpm": 68.6,
                        "rmssdMs": 39.9,
                        "impedanceRawUs": 5.36,
                        "impedanceDeltaUs": 0.1,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Nurse Lead Linda Croft, RN",
                        "timestamp": "2026-09-16 22:21:00",
                        "text": "Care Plan Day 27: Telemetry baseline stable on Day 27. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_28",
                    "sessionNum": 28,
                    "timestamp": "2026-09-17 22:33:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.976,
                    "concordance": 0.911,
                    "anomalyDesc": "No",
                    "rationale": "Day 28 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.45 uS; resting HRV RMSSD 40.3 ms.",
                    "metrics": {
                        "hrBpm": 70.5,
                        "rmssdMs": 40.3,
                        "impedanceRawUs": 5.45,
                        "impedanceDeltaUs": 0.13,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-17 22:33:00",
                        "text": "Care Plan Day 28: Telemetry baseline stable on Day 28. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_29",
                    "sessionNum": 29,
                    "timestamp": "2026-09-18 21:25:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.961,
                    "concordance": 0.96,
                    "anomalyDesc": "No",
                    "rationale": "Day 29 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.49 uS; resting HRV RMSSD 41.4 ms.",
                    "metrics": {
                        "hrBpm": 73.3,
                        "rmssdMs": 41.4,
                        "impedanceRawUs": 5.49,
                        "impedanceDeltaUs": 0.1,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Marcus Vance, MD (Consulting Neurologist)",
                        "timestamp": "2026-09-18 21:25:00",
                        "text": "Care Plan Day 29: Telemetry baseline stable on Day 29. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                },
                {
                    "sessionId": "SESSION_30",
                    "sessionNum": 30,
                    "timestamp": "2026-09-19 22:17:00",
                    "patientId": "PATIENT_AAL_0019",
                    "name": "AAL Patient 0019 (Marcus Vance)",
                    "bedId": "BED_BETA_02",
                    "dob": "19580623",
                    "age": 68,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.971,
                    "concordance": 0.904,
                    "anomalyDesc": "No",
                    "rationale": "Day 30 Telemetry: Continuous monitoring shows stable nighttime autonomic profile. Skin conductance steady at 5.28 uS; resting HRV RMSSD 37.1 ms.",
                    "metrics": {
                        "hrBpm": 70.4,
                        "rmssdMs": 37.1,
                        "impedanceRawUs": 5.28,
                        "impedanceDeltaUs": 0.08,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00025,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Alan Turing, MD (Endocrinologist)",
                        "timestamp": "2026-09-19 22:17:00",
                        "text": "Care Plan Day 30: Telemetry baseline stable on Day 30. Continue continuous non-invasive bed monitoring. Fasting blood sugar stable at 118 mg/dL. Maintain daytime hydration at 2L daily."
                    }
                }
            ]
        },
        {
            "id": "PATIENT_AAL_0078",
            "name": "AAL Patient 0078 (Grace Chen)",
            "bedId": "BED_GAMMA_03",
            "dob": "19471109",
            "age": 79,
            "gender": "Female",
            "fsmState": "BASELINE",
            "actionTrigger": "LOG_TELEMETRY",
            "confidence": 0.971,
            "concordance": 0.924,
            "anomalyDesc": "No",
            "rationale": "Day 30 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 4.05 uS. No hypothermia tremors or micro-arousals.",
            "metrics": {
                "hrBpm": 65.3,
                "rmssdMs": 39.6,
                "impedanceRawUs": 4.05,
                "impedanceDeltaUs": 0.06,
                "impedanceSlew": 0.08,
                "actigraphyRmsG": 0.012,
                "shivering": false,
                "macroShift": false,
                "acousticEnergy": 0.0002,
                "acousticBurst": false,
                "diaphoresis": false,
                "fluidSpill": false
            },
            "adviceHistory": [
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-09-19 20:19:00",
                    "text": "Care Plan Day 30: Continuous geriatric telemetry stable on Day 30. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                    "timestamp": "2026-09-18 21:50:00",
                    "text": "Care Plan Day 29: Continuous geriatric telemetry stable on Day 29. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-17 21:47:00",
                    "text": "Care Plan Day 28: Continuous geriatric telemetry stable on Day 28. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-16 21:47:00",
                    "text": "Care Plan Day 27: Mild post-medication vasodilation flush. Fan cooling activated at 22\u00b0C. Check blood pressure; monitor orthostatic vital signs upon morning rise."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-09-15 21:45:00",
                    "text": "Care Plan Day 26: Continuous geriatric telemetry stable on Day 26. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                    "timestamp": "2026-09-14 22:26:00",
                    "text": "Care Plan Day 25: Continuous geriatric telemetry stable on Day 25. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-13 22:46:00",
                    "text": "Care Plan Day 24: Continuous geriatric telemetry stable on Day 24. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-09-12 21:14:00",
                    "text": "Care Plan Day 23: Continuous geriatric telemetry stable on Day 23. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                    "timestamp": "2026-09-11 21:33:00",
                    "text": "Care Plan Day 22: Shivering episode recorded at 02:40 AM. Engage smart bed forced-air heating layer. Keep ambient room at 24\u00b0C. Check oral temperature (ensure > 36.5\u00b0C)."
                },
                {
                    "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                    "timestamp": "2026-09-10 21:24:00",
                    "text": "Care Plan Day 21: Continuous geriatric telemetry stable on Day 21. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-09-09 20:50:00",
                    "text": "Care Plan Day 20: Geriatric repositioning assistance provided. Support knees and lumbar spine with ergonomic lateral wedge pillows. Apply moisturising skin barrier."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-09-08 21:44:00",
                    "text": "Care Plan Day 19: Continuous geriatric telemetry stable on Day 19. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-09-07 20:41:00",
                    "text": "Care Plan Day 18: Continuous geriatric telemetry stable on Day 18. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                    "timestamp": "2026-09-06 22:35:00",
                    "text": "Care Plan Day 17: Shivering episode recorded at 02:40 AM. Engage smart bed forced-air heating layer. Keep ambient room at 24\u00b0C. Check oral temperature (ensure > 36.5\u00b0C)."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-05 21:16:00",
                    "text": "Care Plan Day 16: Continuous geriatric telemetry stable on Day 16. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-04 21:25:00",
                    "text": "Care Plan Day 15: Mild post-medication vasodilation flush. Fan cooling activated at 22\u00b0C. Check blood pressure; monitor orthostatic vital signs upon morning rise."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-09-03 20:44:00",
                    "text": "Care Plan Day 14: Continuous geriatric telemetry stable on Day 14. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                    "timestamp": "2026-09-02 21:14:00",
                    "text": "Care Plan Day 13: Shivering episode recorded at 02:40 AM. Engage smart bed forced-air heating layer. Keep ambient room at 24\u00b0C. Check oral temperature (ensure > 36.5\u00b0C)."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-01 21:40:00",
                    "text": "Care Plan Day 12: Continuous geriatric telemetry stable on Day 12. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-08-31 20:24:00",
                    "text": "Care Plan Day 11: Continuous geriatric telemetry stable on Day 11. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                    "timestamp": "2026-08-30 20:25:00",
                    "text": "Care Plan Day 10: Shivering episode recorded at 02:40 AM. Engage smart bed forced-air heating layer. Keep ambient room at 24\u00b0C. Check oral temperature (ensure > 36.5\u00b0C)."
                },
                {
                    "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                    "timestamp": "2026-08-29 21:48:00",
                    "text": "Care Plan Day 9: Continuous geriatric telemetry stable on Day 9. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-08-28 21:47:00",
                    "text": "Care Plan Day 8: Geriatric repositioning assistance provided. Support knees and lumbar spine with ergonomic lateral wedge pillows. Apply moisturising skin barrier."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-08-27 22:21:00",
                    "text": "Care Plan Day 7: Continuous geriatric telemetry stable on Day 7. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                    "timestamp": "2026-08-26 21:35:00",
                    "text": "Care Plan Day 6: Shivering episode recorded at 02:40 AM. Engage smart bed forced-air heating layer. Keep ambient room at 24\u00b0C. Check oral temperature (ensure > 36.5\u00b0C)."
                },
                {
                    "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                    "timestamp": "2026-08-25 21:40:00",
                    "text": "Care Plan Day 5: Continuous geriatric telemetry stable on Day 5. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-08-24 22:35:00",
                    "text": "Care Plan Day 4: Continuous geriatric telemetry stable on Day 4. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                    "timestamp": "2026-08-23 21:15:00",
                    "text": "Care Plan Day 3: Shivering episode recorded at 02:40 AM. Engage smart bed forced-air heating layer. Keep ambient room at 24\u00b0C. Check oral temperature (ensure > 36.5\u00b0C)."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-08-22 22:14:00",
                    "text": "Care Plan Day 2: Continuous geriatric telemetry stable on Day 2. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                },
                {
                    "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                    "timestamp": "2026-08-21 21:21:00",
                    "text": "Care Plan Day 1: Shivering episode recorded at 02:40 AM. Engage smart bed forced-air heating layer. Keep ambient room at 24\u00b0C. Check oral temperature (ensure > 36.5\u00b0C)."
                }
            ],
            "sessions": [
                {
                    "sessionId": "SESSION_01",
                    "sessionNum": 1,
                    "timestamp": "2026-08-21 21:21:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.967,
                    "concordance": 0.95,
                    "anomalyDesc": "Nocturnal Somatic Shiver",
                    "rationale": "Day 1 Telemetry: Nocturnal neuromuscular shivering micro-tremor (0.142 g actigraphy, band 8-12 Hz) detected at 03:16 AM. Core temperature vulnerability; Fan/AC suppressed.",
                    "metrics": {
                        "hrBpm": 73.2,
                        "rmssdMs": 37.6,
                        "impedanceRawUs": 3.8,
                        "impedanceDeltaUs": 0.15,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.142,
                        "shivering": true,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                        "timestamp": "2026-08-21 21:21:00",
                        "text": "Care Plan Day 1: Shivering episode recorded at 02:40 AM. Engage smart bed forced-air heating layer. Keep ambient room at 24\u00b0C. Check oral temperature (ensure > 36.5\u00b0C)."
                    }
                },
                {
                    "sessionId": "SESSION_02",
                    "sessionNum": 2,
                    "timestamp": "2026-08-22 22:14:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.975,
                    "concordance": 0.918,
                    "anomalyDesc": "No",
                    "rationale": "Day 2 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 4.08 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 64.8,
                        "rmssdMs": 35.5,
                        "impedanceRawUs": 4.08,
                        "impedanceDeltaUs": 0.02,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-08-22 22:14:00",
                        "text": "Care Plan Day 2: Continuous geriatric telemetry stable on Day 2. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_03",
                    "sessionNum": 3,
                    "timestamp": "2026-08-23 21:15:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.975,
                    "concordance": 0.946,
                    "anomalyDesc": "Nocturnal Somatic Shiver",
                    "rationale": "Day 3 Telemetry: Nocturnal neuromuscular shivering micro-tremor (0.142 g actigraphy, band 8-12 Hz) detected at 03:18 AM. Core temperature vulnerability; Fan/AC suppressed.",
                    "metrics": {
                        "hrBpm": 73.2,
                        "rmssdMs": 34.5,
                        "impedanceRawUs": 3.8,
                        "impedanceDeltaUs": 0.15,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.142,
                        "shivering": true,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                        "timestamp": "2026-08-23 21:15:00",
                        "text": "Care Plan Day 3: Shivering episode recorded at 02:40 AM. Engage smart bed forced-air heating layer. Keep ambient room at 24\u00b0C. Check oral temperature (ensure > 36.5\u00b0C)."
                    }
                },
                {
                    "sessionId": "SESSION_04",
                    "sessionNum": 4,
                    "timestamp": "2026-08-24 22:35:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.972,
                    "concordance": 0.965,
                    "anomalyDesc": "No",
                    "rationale": "Day 4 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 4.06 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 67.2,
                        "rmssdMs": 34.5,
                        "impedanceRawUs": 4.06,
                        "impedanceDeltaUs": 0.02,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-08-24 22:35:00",
                        "text": "Care Plan Day 4: Continuous geriatric telemetry stable on Day 4. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_05",
                    "sessionNum": 5,
                    "timestamp": "2026-08-25 21:40:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.982,
                    "concordance": 0.927,
                    "anomalyDesc": "No",
                    "rationale": "Day 5 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 3.98 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 66.6,
                        "rmssdMs": 39.4,
                        "impedanceRawUs": 3.98,
                        "impedanceDeltaUs": 0.08,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                        "timestamp": "2026-08-25 21:40:00",
                        "text": "Care Plan Day 5: Continuous geriatric telemetry stable on Day 5. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_06",
                    "sessionNum": 6,
                    "timestamp": "2026-08-26 21:35:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.987,
                    "concordance": 0.901,
                    "anomalyDesc": "Nocturnal Somatic Shiver",
                    "rationale": "Day 6 Telemetry: Nocturnal neuromuscular shivering micro-tremor (0.142 g actigraphy, band 8-12 Hz) detected at 03:21 AM. Core temperature vulnerability; Fan/AC suppressed.",
                    "metrics": {
                        "hrBpm": 71.2,
                        "rmssdMs": 35.1,
                        "impedanceRawUs": 3.8,
                        "impedanceDeltaUs": 0.15,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.142,
                        "shivering": true,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                        "timestamp": "2026-08-26 21:35:00",
                        "text": "Care Plan Day 6: Shivering episode recorded at 02:40 AM. Engage smart bed forced-air heating layer. Keep ambient room at 24\u00b0C. Check oral temperature (ensure > 36.5\u00b0C)."
                    }
                },
                {
                    "sessionId": "SESSION_07",
                    "sessionNum": 7,
                    "timestamp": "2026-08-27 22:21:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.966,
                    "concordance": 0.914,
                    "anomalyDesc": "No",
                    "rationale": "Day 7 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 4.00 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 69.7,
                        "rmssdMs": 33.9,
                        "impedanceRawUs": 4.0,
                        "impedanceDeltaUs": 0.07,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-08-27 22:21:00",
                        "text": "Care Plan Day 7: Continuous geriatric telemetry stable on Day 7. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_08",
                    "sessionNum": 8,
                    "timestamp": "2026-08-28 21:47:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "POSTURAL_SHIFT",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.966,
                    "concordance": 0.969,
                    "anomalyDesc": "No",
                    "rationale": "Day 8 Telemetry: Nocturnal positional adjustment recorded (0.26g vector magnitude). Joint stiffness and slow turning velocity logged by smart bed piezo array.",
                    "metrics": {
                        "hrBpm": 75.6,
                        "rmssdMs": 32.3,
                        "impedanceRawUs": 4.0,
                        "impedanceDeltaUs": 0.1,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-08-28 21:47:00",
                        "text": "Care Plan Day 8: Geriatric repositioning assistance provided. Support knees and lumbar spine with ergonomic lateral wedge pillows. Apply moisturising skin barrier."
                    }
                },
                {
                    "sessionId": "SESSION_09",
                    "sessionNum": 9,
                    "timestamp": "2026-08-29 21:48:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.982,
                    "concordance": 0.907,
                    "anomalyDesc": "No",
                    "rationale": "Day 9 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 3.99 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 67.2,
                        "rmssdMs": 35.1,
                        "impedanceRawUs": 3.99,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                        "timestamp": "2026-08-29 21:48:00",
                        "text": "Care Plan Day 9: Continuous geriatric telemetry stable on Day 9. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_10",
                    "sessionNum": 10,
                    "timestamp": "2026-08-30 20:25:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.974,
                    "concordance": 0.906,
                    "anomalyDesc": "Nocturnal Somatic Shiver",
                    "rationale": "Day 10 Telemetry: Nocturnal neuromuscular shivering micro-tremor (0.142 g actigraphy, band 8-12 Hz) detected at 03:25 AM. Core temperature vulnerability; Fan/AC suppressed.",
                    "metrics": {
                        "hrBpm": 71.1,
                        "rmssdMs": 35.2,
                        "impedanceRawUs": 3.8,
                        "impedanceDeltaUs": 0.15,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.142,
                        "shivering": true,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                        "timestamp": "2026-08-30 20:25:00",
                        "text": "Care Plan Day 10: Shivering episode recorded at 02:40 AM. Engage smart bed forced-air heating layer. Keep ambient room at 24\u00b0C. Check oral temperature (ensure > 36.5\u00b0C)."
                    }
                },
                {
                    "sessionId": "SESSION_11",
                    "sessionNum": 11,
                    "timestamp": "2026-08-31 20:24:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.971,
                    "concordance": 0.922,
                    "anomalyDesc": "No",
                    "rationale": "Day 11 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 4.01 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 66.1,
                        "rmssdMs": 38.5,
                        "impedanceRawUs": 4.01,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-08-31 20:24:00",
                        "text": "Care Plan Day 11: Continuous geriatric telemetry stable on Day 11. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_12",
                    "sessionNum": 12,
                    "timestamp": "2026-09-01 21:40:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.974,
                    "concordance": 0.961,
                    "anomalyDesc": "No",
                    "rationale": "Day 12 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 4.02 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 64.8,
                        "rmssdMs": 38.0,
                        "impedanceRawUs": 4.02,
                        "impedanceDeltaUs": 0.02,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-01 21:40:00",
                        "text": "Care Plan Day 12: Continuous geriatric telemetry stable on Day 12. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_13",
                    "sessionNum": 13,
                    "timestamp": "2026-09-02 21:14:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.979,
                    "concordance": 0.928,
                    "anomalyDesc": "Nocturnal Somatic Shiver",
                    "rationale": "Day 13 Telemetry: Nocturnal neuromuscular shivering micro-tremor (0.142 g actigraphy, band 8-12 Hz) detected at 03:28 AM. Core temperature vulnerability; Fan/AC suppressed.",
                    "metrics": {
                        "hrBpm": 73.2,
                        "rmssdMs": 37.8,
                        "impedanceRawUs": 3.8,
                        "impedanceDeltaUs": 0.15,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.142,
                        "shivering": true,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                        "timestamp": "2026-09-02 21:14:00",
                        "text": "Care Plan Day 13: Shivering episode recorded at 02:40 AM. Engage smart bed forced-air heating layer. Keep ambient room at 24\u00b0C. Check oral temperature (ensure > 36.5\u00b0C)."
                    }
                },
                {
                    "sessionId": "SESSION_14",
                    "sessionNum": 14,
                    "timestamp": "2026-09-03 20:44:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.987,
                    "concordance": 0.969,
                    "anomalyDesc": "No",
                    "rationale": "Day 14 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 4.05 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 69.5,
                        "rmssdMs": 33.8,
                        "impedanceRawUs": 4.05,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-09-03 20:44:00",
                        "text": "Care Plan Day 14: Continuous geriatric telemetry stable on Day 14. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_15",
                    "sessionNum": 15,
                    "timestamp": "2026-09-04 21:25:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.968,
                    "concordance": 0.947,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 15 Telemetry: Transient mild sudomotor warm flush (+7.2 uS tonic rise). HVAC cooling Fan engaged for 15 minutes to prevent discomfort.",
                    "metrics": {
                        "hrBpm": 89.7,
                        "rmssdMs": 73.8,
                        "impedanceRawUs": 11.5,
                        "impedanceDeltaUs": 7.2,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-04 21:25:00",
                        "text": "Care Plan Day 15: Mild post-medication vasodilation flush. Fan cooling activated at 22\u00b0C. Check blood pressure; monitor orthostatic vital signs upon morning rise."
                    }
                },
                {
                    "sessionId": "SESSION_16",
                    "sessionNum": 16,
                    "timestamp": "2026-09-05 21:16:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.963,
                    "concordance": 0.935,
                    "anomalyDesc": "No",
                    "rationale": "Day 16 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 3.96 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 66.5,
                        "rmssdMs": 37.8,
                        "impedanceRawUs": 3.96,
                        "impedanceDeltaUs": 0.02,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-05 21:16:00",
                        "text": "Care Plan Day 16: Continuous geriatric telemetry stable on Day 16. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_17",
                    "sessionNum": 17,
                    "timestamp": "2026-09-06 22:35:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.97,
                    "concordance": 0.96,
                    "anomalyDesc": "Nocturnal Somatic Shiver",
                    "rationale": "Day 17 Telemetry: Nocturnal neuromuscular shivering micro-tremor (0.142 g actigraphy, band 8-12 Hz) detected at 03:32 AM. Core temperature vulnerability; Fan/AC suppressed.",
                    "metrics": {
                        "hrBpm": 70.4,
                        "rmssdMs": 34.7,
                        "impedanceRawUs": 3.8,
                        "impedanceDeltaUs": 0.15,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.142,
                        "shivering": true,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                        "timestamp": "2026-09-06 22:35:00",
                        "text": "Care Plan Day 17: Shivering episode recorded at 02:40 AM. Engage smart bed forced-air heating layer. Keep ambient room at 24\u00b0C. Check oral temperature (ensure > 36.5\u00b0C)."
                    }
                },
                {
                    "sessionId": "SESSION_18",
                    "sessionNum": 18,
                    "timestamp": "2026-09-07 20:41:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.975,
                    "concordance": 0.945,
                    "anomalyDesc": "No",
                    "rationale": "Day 18 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 4.06 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 64.8,
                        "rmssdMs": 36.8,
                        "impedanceRawUs": 4.06,
                        "impedanceDeltaUs": 0.02,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-09-07 20:41:00",
                        "text": "Care Plan Day 18: Continuous geriatric telemetry stable on Day 18. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_19",
                    "sessionNum": 19,
                    "timestamp": "2026-09-08 21:44:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.982,
                    "concordance": 0.956,
                    "anomalyDesc": "No",
                    "rationale": "Day 19 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 4.09 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 67.7,
                        "rmssdMs": 35.2,
                        "impedanceRawUs": 4.09,
                        "impedanceDeltaUs": 0.1,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-09-08 21:44:00",
                        "text": "Care Plan Day 19: Continuous geriatric telemetry stable on Day 19. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_20",
                    "sessionNum": 20,
                    "timestamp": "2026-09-09 20:50:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "POSTURAL_SHIFT",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.973,
                    "concordance": 0.935,
                    "anomalyDesc": "No",
                    "rationale": "Day 20 Telemetry: Nocturnal positional adjustment recorded (0.26g vector magnitude). Joint stiffness and slow turning velocity logged by smart bed piezo array.",
                    "metrics": {
                        "hrBpm": 77.4,
                        "rmssdMs": 34.5,
                        "impedanceRawUs": 4.0,
                        "impedanceDeltaUs": 0.1,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-09-09 20:50:00",
                        "text": "Care Plan Day 20: Geriatric repositioning assistance provided. Support knees and lumbar spine with ergonomic lateral wedge pillows. Apply moisturising skin barrier."
                    }
                },
                {
                    "sessionId": "SESSION_21",
                    "sessionNum": 21,
                    "timestamp": "2026-09-10 21:24:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.961,
                    "concordance": 0.925,
                    "anomalyDesc": "No",
                    "rationale": "Day 21 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 4.09 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 69.9,
                        "rmssdMs": 37.8,
                        "impedanceRawUs": 4.09,
                        "impedanceDeltaUs": 0.06,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                        "timestamp": "2026-09-10 21:24:00",
                        "text": "Care Plan Day 21: Continuous geriatric telemetry stable on Day 21. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_22",
                    "sessionNum": 22,
                    "timestamp": "2026-09-11 21:33:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "TURN_OFF_FAN_AC",
                    "confidence": 0.98,
                    "concordance": 0.92,
                    "anomalyDesc": "Nocturnal Somatic Shiver",
                    "rationale": "Day 22 Telemetry: Nocturnal neuromuscular shivering micro-tremor (0.142 g actigraphy, band 8-12 Hz) detected at 03:37 AM. Core temperature vulnerability; Fan/AC suppressed.",
                    "metrics": {
                        "hrBpm": 70.4,
                        "rmssdMs": 34.7,
                        "impedanceRawUs": 3.8,
                        "impedanceDeltaUs": 0.15,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.142,
                        "shivering": true,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                        "timestamp": "2026-09-11 21:33:00",
                        "text": "Care Plan Day 22: Shivering episode recorded at 02:40 AM. Engage smart bed forced-air heating layer. Keep ambient room at 24\u00b0C. Check oral temperature (ensure > 36.5\u00b0C)."
                    }
                },
                {
                    "sessionId": "SESSION_23",
                    "sessionNum": 23,
                    "timestamp": "2026-09-12 21:14:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.98,
                    "concordance": 0.922,
                    "anomalyDesc": "No",
                    "rationale": "Day 23 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 4.05 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 66.3,
                        "rmssdMs": 36.6,
                        "impedanceRawUs": 4.05,
                        "impedanceDeltaUs": 0.08,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-09-12 21:14:00",
                        "text": "Care Plan Day 23: Continuous geriatric telemetry stable on Day 23. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_24",
                    "sessionNum": 24,
                    "timestamp": "2026-09-13 22:46:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.984,
                    "concordance": 0.946,
                    "anomalyDesc": "No",
                    "rationale": "Day 24 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 4.07 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 66.5,
                        "rmssdMs": 39.8,
                        "impedanceRawUs": 4.07,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-13 22:46:00",
                        "text": "Care Plan Day 24: Continuous geriatric telemetry stable on Day 24. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_25",
                    "sessionNum": 25,
                    "timestamp": "2026-09-14 22:26:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.968,
                    "concordance": 0.919,
                    "anomalyDesc": "No",
                    "rationale": "Day 25 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 4.08 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 64.3,
                        "rmssdMs": 40.7,
                        "impedanceRawUs": 4.08,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                        "timestamp": "2026-09-14 22:26:00",
                        "text": "Care Plan Day 25: Continuous geriatric telemetry stable on Day 25. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_26",
                    "sessionNum": 26,
                    "timestamp": "2026-09-15 21:45:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.966,
                    "concordance": 0.928,
                    "anomalyDesc": "No",
                    "rationale": "Day 26 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 4.05 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 67.6,
                        "rmssdMs": 35.9,
                        "impedanceRawUs": 4.05,
                        "impedanceDeltaUs": 0.02,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-09-15 21:45:00",
                        "text": "Care Plan Day 26: Continuous geriatric telemetry stable on Day 26. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_27",
                    "sessionNum": 27,
                    "timestamp": "2026-09-16 21:47:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.989,
                    "concordance": 0.92,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 27 Telemetry: Transient mild sudomotor warm flush (+7.2 uS tonic rise). HVAC cooling Fan engaged for 15 minutes to prevent discomfort.",
                    "metrics": {
                        "hrBpm": 90.3,
                        "rmssdMs": 72.6,
                        "impedanceRawUs": 11.5,
                        "impedanceDeltaUs": 7.2,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-16 21:47:00",
                        "text": "Care Plan Day 27: Mild post-medication vasodilation flush. Fan cooling activated at 22\u00b0C. Check blood pressure; monitor orthostatic vital signs upon morning rise."
                    }
                },
                {
                    "sessionId": "SESSION_28",
                    "sessionNum": 28,
                    "timestamp": "2026-09-17 21:47:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.981,
                    "concordance": 0.921,
                    "anomalyDesc": "No",
                    "rationale": "Day 28 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 3.95 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 66.3,
                        "rmssdMs": 39.7,
                        "impedanceRawUs": 3.95,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-17 21:47:00",
                        "text": "Care Plan Day 28: Continuous geriatric telemetry stable on Day 28. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_29",
                    "sessionNum": 29,
                    "timestamp": "2026-09-18 21:50:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.968,
                    "concordance": 0.913,
                    "anomalyDesc": "No",
                    "rationale": "Day 29 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 4.03 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 69.6,
                        "rmssdMs": 33.6,
                        "impedanceRawUs": 4.03,
                        "impedanceDeltaUs": 0.06,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Evelyn Reed, MD (Geriatric Specialist)",
                        "timestamp": "2026-09-18 21:50:00",
                        "text": "Care Plan Day 29: Continuous geriatric telemetry stable on Day 29. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                },
                {
                    "sessionId": "SESSION_30",
                    "sessionNum": 30,
                    "timestamp": "2026-09-19 20:19:00",
                    "patientId": "PATIENT_AAL_0078",
                    "name": "AAL Patient 0078 (Grace Chen)",
                    "bedId": "BED_GAMMA_03",
                    "dob": "19471109",
                    "age": 79,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.971,
                    "concordance": 0.924,
                    "anomalyDesc": "No",
                    "rationale": "Day 30 Telemetry: Restful nocturnal sleep recorded. Piezo actigraphy calm (0.012g), EDA steady at 4.05 uS. No hypothermia tremors or micro-arousals.",
                    "metrics": {
                        "hrBpm": 65.3,
                        "rmssdMs": 39.6,
                        "impedanceRawUs": 4.05,
                        "impedanceDeltaUs": 0.06,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0002,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-09-19 20:19:00",
                        "text": "Care Plan Day 30: Continuous geriatric telemetry stable on Day 30. Patient resting comfortably. Nutritional high-calorie supplement tolerated with evening snack. Continue gentle morning mobility."
                    }
                }
            ]
        },
        {
            "id": "PATIENT_AAL_0105",
            "name": "AAL Patient 0105 (David Kalu)",
            "bedId": "BED_DELTA_04",
            "dob": "19730214",
            "age": 53,
            "gender": "Male",
            "fsmState": "BASELINE",
            "actionTrigger": "LOG_TELEMETRY",
            "confidence": 0.97,
            "concordance": 0.927,
            "anomalyDesc": "No",
            "rationale": "Day 30 Telemetry: Quiescent gastric phonogram (STE 0.00039 V2). Heart rate and tonic skin conductance within safe baseline range (71.7 BPM).",
            "metrics": {
                "hrBpm": 71.7,
                "rmssdMs": 36.8,
                "impedanceRawUs": 4.42,
                "impedanceDeltaUs": 0.11,
                "impedanceSlew": 0.08,
                "actigraphyRmsG": 0.018,
                "shivering": false,
                "macroShift": false,
                "acousticEnergy": 0.00039,
                "acousticBurst": false,
                "diaphoresis": false,
                "fluidSpill": false
            },
            "adviceHistory": [
                {
                    "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                    "timestamp": "2026-09-19 21:46:00",
                    "text": "Care Plan Day 30: Oncology recovery day 30: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-18 22:35:00",
                    "text": "Care Plan Day 29: Oncology recovery day 29: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-17 20:27:00",
                    "text": "Care Plan Day 28: Oncology recovery day 28: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-09-16 21:32:00",
                    "text": "Care Plan Day 27: Oncology recovery day 27: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                    "timestamp": "2026-09-15 20:21:00",
                    "text": "Care Plan Day 26: Oncology recovery day 26: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-14 20:34:00",
                    "text": "Care Plan Day 25: Oncology recovery day 25: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-13 21:45:00",
                    "text": "Care Plan Day 24: Oncology recovery day 24: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-09-12 20:27:00",
                    "text": "Care Plan Day 23: Oncology recovery day 23: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                    "timestamp": "2026-09-11 22:46:00",
                    "text": "Care Plan Day 22: Oncology recovery day 22: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-10 21:35:00",
                    "text": "Care Plan Day 21: Oncology recovery day 21: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-09 20:23:00",
                    "text": "Care Plan Day 20: Oncology recovery day 20: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-09-08 20:39:00",
                    "text": "Care Plan Day 19: Autonomic cold sweat episode managed with HVAC cooling. Add Aprepitant (Emend) 80mg oral capsule for delayed chemotherapy-induced nausea prevention."
                },
                {
                    "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                    "timestamp": "2026-09-07 20:31:00",
                    "text": "Care Plan Day 18: Oncology recovery day 18: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-06 20:21:00",
                    "text": "Care Plan Day 17: Oncology recovery day 17: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-05 20:27:00",
                    "text": "Care Plan Day 16: Oncology recovery day 16: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-09-04 21:26:00",
                    "text": "Care Plan Day 15: Oncology recovery day 15: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                    "timestamp": "2026-09-03 21:47:00",
                    "text": "Care Plan Day 14: Oncology recovery day 14: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-02 20:19:00",
                    "text": "Care Plan Day 13: Oncology recovery day 13: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-09-01 21:42:00",
                    "text": "Care Plan Day 12: Autonomic cold sweat episode managed with HVAC cooling. Add Aprepitant (Emend) 80mg oral capsule for delayed chemotherapy-induced nausea prevention."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-08-31 22:30:00",
                    "text": "Care Plan Day 11: Oncology recovery day 11: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                    "timestamp": "2026-08-30 22:37:00",
                    "text": "Care Plan Day 10: Oncology recovery day 10: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-08-29 21:34:00",
                    "text": "Care Plan Day 9: Oncology recovery day 9: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                    "timestamp": "2026-08-28 20:31:00",
                    "text": "Care Plan Day 8: PRE-EMESIS CRISIS TRIGGERED! Elevate head of bed to 45\u00b0. Administer IV Ondansetron 8mg + Dexamethasone 4mg IV push stat. Suction ready."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-08-27 20:34:00",
                    "text": "Care Plan Day 7: Oncology recovery day 7: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-08-26 22:14:00",
                    "text": "Care Plan Day 6: Autonomic cold sweat episode managed with HVAC cooling. Add Aprepitant (Emend) 80mg oral capsule for delayed chemotherapy-induced nausea prevention."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-08-25 22:39:00",
                    "text": "Care Plan Day 5: Oncology recovery day 5: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                    "timestamp": "2026-08-24 20:36:00",
                    "text": "Care Plan Day 4: PRE-EMESIS CRISIS TRIGGERED! Elevate head of bed to 45\u00b0. Administer IV Ondansetron 8mg + Dexamethasone 4mg IV push stat. Suction ready."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-08-23 20:40:00",
                    "text": "Care Plan Day 3: Oncology recovery day 3: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-08-22 22:12:00",
                    "text": "Care Plan Day 2: ACTIVE EMESIS PROTOCOL EXECUTED. Rapid response bedside care. Oral cavity cleared with gentle suction. IV Lorazepam 0.5mg administered for anticipatory nausea. Full linen change."
                },
                {
                    "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                    "timestamp": "2026-08-21 21:28:00",
                    "text": "Care Plan Day 1: PRE-EMESIS CRISIS TRIGGERED! Elevate head of bed to 45\u00b0. Administer IV Ondansetron 8mg + Dexamethasone 4mg IV push stat. Suction ready."
                }
            ],
            "sessions": [
                {
                    "sessionId": "SESSION_01",
                    "sessionNum": 1,
                    "timestamp": "2026-08-21 21:28:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "PRE_EMESIS_WARNING",
                    "actionTrigger": "ALERT_NURSE_PRE_EMESIS",
                    "confidence": 0.979,
                    "concordance": 0.961,
                    "anomalyDesc": "Yes (PRE_EMESIS_WARNING - Prodrome)",
                    "rationale": "Day 1 Telemetry: Acute chemo-induced pre-emesis cascade: tachycardic autonomic surge (109.2 BPM), sudomotor sweat (+9.5 uS), and gastric acoustic burst.",
                    "metrics": {
                        "hrBpm": 109.2,
                        "rmssdMs": 90.1,
                        "impedanceRawUs": 23.75,
                        "impedanceDeltaUs": 9.55,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.01138,
                        "acousticBurst": true,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                        "timestamp": "2026-08-21 21:28:00",
                        "text": "Care Plan Day 1: PRE-EMESIS CRISIS TRIGGERED! Elevate head of bed to 45\u00b0. Administer IV Ondansetron 8mg + Dexamethasone 4mg IV push stat. Suction ready."
                    }
                },
                {
                    "sessionId": "SESSION_02",
                    "sessionNum": 2,
                    "timestamp": "2026-08-22 22:12:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "ACTIVE_EMESIS_EVENT",
                    "actionTrigger": "DISPATCH_RAPID_RESPONSE",
                    "confidence": 0.976,
                    "concordance": 0.929,
                    "anomalyDesc": "Yes (ACTIVE_EMESIS_EVENT - Crisis)",
                    "rationale": "Day 2 Telemetry: Active emetic ejection event verified across audio, actigraphy retch spasms, and massive EDA discharge. Rapid nursing intervention executed.",
                    "metrics": {
                        "hrBpm": 124.0,
                        "rmssdMs": 96.0,
                        "impedanceRawUs": 22.0,
                        "impedanceDeltaUs": 14.5,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.28,
                        "shivering": false,
                        "macroShift": true,
                        "acousticEnergy": 0.0185,
                        "acousticBurst": true,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-08-22 22:12:00",
                        "text": "Care Plan Day 2: ACTIVE EMESIS PROTOCOL EXECUTED. Rapid response bedside care. Oral cavity cleared with gentle suction. IV Lorazepam 0.5mg administered for anticipatory nausea. Full linen change."
                    }
                },
                {
                    "sessionId": "SESSION_03",
                    "sessionNum": 3,
                    "timestamp": "2026-08-23 20:40:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.975,
                    "concordance": 0.964,
                    "anomalyDesc": "No",
                    "rationale": "Day 3 Telemetry: Quiescent gastric phonogram (STE 0.00036 V2). Heart rate and tonic skin conductance within safe baseline range (67.6 BPM).",
                    "metrics": {
                        "hrBpm": 67.6,
                        "rmssdMs": 41.7,
                        "impedanceRawUs": 4.32,
                        "impedanceDeltaUs": 0.04,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00036,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-08-23 20:40:00",
                        "text": "Care Plan Day 3: Oncology recovery day 3: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_04",
                    "sessionNum": 4,
                    "timestamp": "2026-08-24 20:36:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "PRE_EMESIS_WARNING",
                    "actionTrigger": "ALERT_NURSE_PRE_EMESIS",
                    "confidence": 0.985,
                    "concordance": 0.961,
                    "anomalyDesc": "Yes (PRE_EMESIS_WARNING - Prodrome)",
                    "rationale": "Day 4 Telemetry: Acute chemo-induced pre-emesis cascade: tachycardic autonomic surge (110.6 BPM), sudomotor sweat (+10.4 uS), and gastric acoustic burst.",
                    "metrics": {
                        "hrBpm": 110.6,
                        "rmssdMs": 95.7,
                        "impedanceRawUs": 24.65,
                        "impedanceDeltaUs": 10.45,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00902,
                        "acousticBurst": true,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                        "timestamp": "2026-08-24 20:36:00",
                        "text": "Care Plan Day 4: PRE-EMESIS CRISIS TRIGGERED! Elevate head of bed to 45\u00b0. Administer IV Ondansetron 8mg + Dexamethasone 4mg IV push stat. Suction ready."
                    }
                },
                {
                    "sessionId": "SESSION_05",
                    "sessionNum": 5,
                    "timestamp": "2026-08-25 22:39:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.981,
                    "concordance": 0.946,
                    "anomalyDesc": "No",
                    "rationale": "Day 5 Telemetry: Quiescent gastric phonogram (STE 0.00040 V2). Heart rate and tonic skin conductance within safe baseline range (67.0 BPM).",
                    "metrics": {
                        "hrBpm": 67.0,
                        "rmssdMs": 42.3,
                        "impedanceRawUs": 4.47,
                        "impedanceDeltaUs": 0.1,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0004,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-08-25 22:39:00",
                        "text": "Care Plan Day 5: Oncology recovery day 5: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_06",
                    "sessionNum": 6,
                    "timestamp": "2026-08-26 22:14:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.98,
                    "concordance": 0.904,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 6 Telemetry: Isolated autonomic diaphoresis surge without gastric acoustic spike (impedance delta +8.7 uS). HVAC Fan/AC engaged.",
                    "metrics": {
                        "hrBpm": 93.7,
                        "rmssdMs": 73.9,
                        "impedanceRawUs": 20.65,
                        "impedanceDeltaUs": 8.65,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-08-26 22:14:00",
                        "text": "Care Plan Day 6: Autonomic cold sweat episode managed with HVAC cooling. Add Aprepitant (Emend) 80mg oral capsule for delayed chemotherapy-induced nausea prevention."
                    }
                },
                {
                    "sessionId": "SESSION_07",
                    "sessionNum": 7,
                    "timestamp": "2026-08-27 20:34:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.962,
                    "concordance": 0.933,
                    "anomalyDesc": "No",
                    "rationale": "Day 7 Telemetry: Quiescent gastric phonogram (STE 0.00037 V2). Heart rate and tonic skin conductance within safe baseline range (70.6 BPM).",
                    "metrics": {
                        "hrBpm": 70.6,
                        "rmssdMs": 42.3,
                        "impedanceRawUs": 4.49,
                        "impedanceDeltaUs": 0.11,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00037,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-08-27 20:34:00",
                        "text": "Care Plan Day 7: Oncology recovery day 7: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_08",
                    "sessionNum": 8,
                    "timestamp": "2026-08-28 20:31:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "PRE_EMESIS_WARNING",
                    "actionTrigger": "ALERT_NURSE_PRE_EMESIS",
                    "confidence": 0.966,
                    "concordance": 0.96,
                    "anomalyDesc": "Yes (PRE_EMESIS_WARNING - Prodrome)",
                    "rationale": "Day 8 Telemetry: Acute chemo-induced pre-emesis cascade: tachycardic autonomic surge (111.9 BPM), sudomotor sweat (+9.8 uS), and gastric acoustic burst.",
                    "metrics": {
                        "hrBpm": 111.9,
                        "rmssdMs": 95.2,
                        "impedanceRawUs": 23.96,
                        "impedanceDeltaUs": 9.76,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0114,
                        "acousticBurst": true,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                        "timestamp": "2026-08-28 20:31:00",
                        "text": "Care Plan Day 8: PRE-EMESIS CRISIS TRIGGERED! Elevate head of bed to 45\u00b0. Administer IV Ondansetron 8mg + Dexamethasone 4mg IV push stat. Suction ready."
                    }
                },
                {
                    "sessionId": "SESSION_09",
                    "sessionNum": 9,
                    "timestamp": "2026-08-29 21:34:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.977,
                    "concordance": 0.956,
                    "anomalyDesc": "No",
                    "rationale": "Day 9 Telemetry: Quiescent gastric phonogram (STE 0.00038 V2). Heart rate and tonic skin conductance within safe baseline range (67.0 BPM).",
                    "metrics": {
                        "hrBpm": 67.0,
                        "rmssdMs": 39.2,
                        "impedanceRawUs": 4.52,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00038,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-08-29 21:34:00",
                        "text": "Care Plan Day 9: Oncology recovery day 9: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_10",
                    "sessionNum": 10,
                    "timestamp": "2026-08-30 22:37:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.976,
                    "concordance": 0.902,
                    "anomalyDesc": "No",
                    "rationale": "Day 10 Telemetry: Quiescent gastric phonogram (STE 0.00036 V2). Heart rate and tonic skin conductance within safe baseline range (67.4 BPM).",
                    "metrics": {
                        "hrBpm": 67.4,
                        "rmssdMs": 41.4,
                        "impedanceRawUs": 4.4,
                        "impedanceDeltaUs": 0.12,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00036,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                        "timestamp": "2026-08-30 22:37:00",
                        "text": "Care Plan Day 10: Oncology recovery day 10: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_11",
                    "sessionNum": 11,
                    "timestamp": "2026-08-31 22:30:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.975,
                    "concordance": 0.938,
                    "anomalyDesc": "No",
                    "rationale": "Day 11 Telemetry: Quiescent gastric phonogram (STE 0.00036 V2). Heart rate and tonic skin conductance within safe baseline range (72.3 BPM).",
                    "metrics": {
                        "hrBpm": 72.3,
                        "rmssdMs": 35.3,
                        "impedanceRawUs": 4.49,
                        "impedanceDeltaUs": 0.04,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00036,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-08-31 22:30:00",
                        "text": "Care Plan Day 11: Oncology recovery day 11: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_12",
                    "sessionNum": 12,
                    "timestamp": "2026-09-01 21:42:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.983,
                    "concordance": 0.953,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 12 Telemetry: Isolated autonomic diaphoresis surge without gastric acoustic spike (impedance delta +8.4 uS). HVAC Fan/AC engaged.",
                    "metrics": {
                        "hrBpm": 95.7,
                        "rmssdMs": 72.0,
                        "impedanceRawUs": 20.42,
                        "impedanceDeltaUs": 8.42,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-09-01 21:42:00",
                        "text": "Care Plan Day 12: Autonomic cold sweat episode managed with HVAC cooling. Add Aprepitant (Emend) 80mg oral capsule for delayed chemotherapy-induced nausea prevention."
                    }
                },
                {
                    "sessionId": "SESSION_13",
                    "sessionNum": 13,
                    "timestamp": "2026-09-02 20:19:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.988,
                    "concordance": 0.955,
                    "anomalyDesc": "No",
                    "rationale": "Day 13 Telemetry: Quiescent gastric phonogram (STE 0.00039 V2). Heart rate and tonic skin conductance within safe baseline range (71.3 BPM).",
                    "metrics": {
                        "hrBpm": 71.3,
                        "rmssdMs": 41.5,
                        "impedanceRawUs": 4.32,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00039,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-02 20:19:00",
                        "text": "Care Plan Day 13: Oncology recovery day 13: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_14",
                    "sessionNum": 14,
                    "timestamp": "2026-09-03 21:47:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.96,
                    "concordance": 0.926,
                    "anomalyDesc": "No",
                    "rationale": "Day 14 Telemetry: Quiescent gastric phonogram (STE 0.00040 V2). Heart rate and tonic skin conductance within safe baseline range (66.3 BPM).",
                    "metrics": {
                        "hrBpm": 66.3,
                        "rmssdMs": 42.9,
                        "impedanceRawUs": 4.59,
                        "impedanceDeltaUs": 0.11,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0004,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                        "timestamp": "2026-09-03 21:47:00",
                        "text": "Care Plan Day 14: Oncology recovery day 14: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_15",
                    "sessionNum": 15,
                    "timestamp": "2026-09-04 21:26:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.984,
                    "concordance": 0.911,
                    "anomalyDesc": "No",
                    "rationale": "Day 15 Telemetry: Quiescent gastric phonogram (STE 0.00039 V2). Heart rate and tonic skin conductance within safe baseline range (66.1 BPM).",
                    "metrics": {
                        "hrBpm": 66.1,
                        "rmssdMs": 36.3,
                        "impedanceRawUs": 4.4,
                        "impedanceDeltaUs": 0.07,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00039,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-09-04 21:26:00",
                        "text": "Care Plan Day 15: Oncology recovery day 15: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_16",
                    "sessionNum": 16,
                    "timestamp": "2026-09-05 20:27:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.989,
                    "concordance": 0.969,
                    "anomalyDesc": "No",
                    "rationale": "Day 16 Telemetry: Quiescent gastric phonogram (STE 0.00039 V2). Heart rate and tonic skin conductance within safe baseline range (67.9 BPM).",
                    "metrics": {
                        "hrBpm": 67.9,
                        "rmssdMs": 40.3,
                        "impedanceRawUs": 4.43,
                        "impedanceDeltaUs": 0.08,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00039,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-05 20:27:00",
                        "text": "Care Plan Day 16: Oncology recovery day 16: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_17",
                    "sessionNum": 17,
                    "timestamp": "2026-09-06 20:21:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.987,
                    "concordance": 0.958,
                    "anomalyDesc": "No",
                    "rationale": "Day 17 Telemetry: Quiescent gastric phonogram (STE 0.00035 V2). Heart rate and tonic skin conductance within safe baseline range (68.5 BPM).",
                    "metrics": {
                        "hrBpm": 68.5,
                        "rmssdMs": 42.3,
                        "impedanceRawUs": 4.53,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00035,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-06 20:21:00",
                        "text": "Care Plan Day 17: Oncology recovery day 17: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_18",
                    "sessionNum": 18,
                    "timestamp": "2026-09-07 20:31:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.988,
                    "concordance": 0.969,
                    "anomalyDesc": "No",
                    "rationale": "Day 18 Telemetry: Quiescent gastric phonogram (STE 0.00037 V2). Heart rate and tonic skin conductance within safe baseline range (71.8 BPM).",
                    "metrics": {
                        "hrBpm": 71.8,
                        "rmssdMs": 40.4,
                        "impedanceRawUs": 4.33,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00037,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                        "timestamp": "2026-09-07 20:31:00",
                        "text": "Care Plan Day 18: Oncology recovery day 18: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_19",
                    "sessionNum": 19,
                    "timestamp": "2026-09-08 20:39:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.969,
                    "concordance": 0.966,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 19 Telemetry: Isolated autonomic diaphoresis surge without gastric acoustic spike (impedance delta +8.9 uS). HVAC Fan/AC engaged.",
                    "metrics": {
                        "hrBpm": 93.5,
                        "rmssdMs": 72.6,
                        "impedanceRawUs": 20.89,
                        "impedanceDeltaUs": 8.89,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-09-08 20:39:00",
                        "text": "Care Plan Day 19: Autonomic cold sweat episode managed with HVAC cooling. Add Aprepitant (Emend) 80mg oral capsule for delayed chemotherapy-induced nausea prevention."
                    }
                },
                {
                    "sessionId": "SESSION_20",
                    "sessionNum": 20,
                    "timestamp": "2026-09-09 20:23:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.967,
                    "concordance": 0.963,
                    "anomalyDesc": "No",
                    "rationale": "Day 20 Telemetry: Quiescent gastric phonogram (STE 0.00037 V2). Heart rate and tonic skin conductance within safe baseline range (68.1 BPM).",
                    "metrics": {
                        "hrBpm": 68.1,
                        "rmssdMs": 42.2,
                        "impedanceRawUs": 4.51,
                        "impedanceDeltaUs": 0.07,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00037,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-09 20:23:00",
                        "text": "Care Plan Day 20: Oncology recovery day 20: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_21",
                    "sessionNum": 21,
                    "timestamp": "2026-09-10 21:35:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.981,
                    "concordance": 0.945,
                    "anomalyDesc": "No",
                    "rationale": "Day 21 Telemetry: Quiescent gastric phonogram (STE 0.00040 V2). Heart rate and tonic skin conductance within safe baseline range (72.2 BPM).",
                    "metrics": {
                        "hrBpm": 72.2,
                        "rmssdMs": 40.5,
                        "impedanceRawUs": 4.51,
                        "impedanceDeltaUs": 0.1,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0004,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-10 21:35:00",
                        "text": "Care Plan Day 21: Oncology recovery day 21: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_22",
                    "sessionNum": 22,
                    "timestamp": "2026-09-11 22:46:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.971,
                    "concordance": 0.927,
                    "anomalyDesc": "No",
                    "rationale": "Day 22 Telemetry: Quiescent gastric phonogram (STE 0.00040 V2). Heart rate and tonic skin conductance within safe baseline range (71.3 BPM).",
                    "metrics": {
                        "hrBpm": 71.3,
                        "rmssdMs": 35.9,
                        "impedanceRawUs": 4.31,
                        "impedanceDeltaUs": 0.06,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0004,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                        "timestamp": "2026-09-11 22:46:00",
                        "text": "Care Plan Day 22: Oncology recovery day 22: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_23",
                    "sessionNum": 23,
                    "timestamp": "2026-09-12 20:27:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.988,
                    "concordance": 0.935,
                    "anomalyDesc": "No",
                    "rationale": "Day 23 Telemetry: Quiescent gastric phonogram (STE 0.00039 V2). Heart rate and tonic skin conductance within safe baseline range (69.2 BPM).",
                    "metrics": {
                        "hrBpm": 69.2,
                        "rmssdMs": 38.4,
                        "impedanceRawUs": 4.55,
                        "impedanceDeltaUs": 0.06,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00039,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-09-12 20:27:00",
                        "text": "Care Plan Day 23: Oncology recovery day 23: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_24",
                    "sessionNum": 24,
                    "timestamp": "2026-09-13 21:45:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.983,
                    "concordance": 0.916,
                    "anomalyDesc": "No",
                    "rationale": "Day 24 Telemetry: Quiescent gastric phonogram (STE 0.00038 V2). Heart rate and tonic skin conductance within safe baseline range (70.6 BPM).",
                    "metrics": {
                        "hrBpm": 70.6,
                        "rmssdMs": 34.9,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.08,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00038,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-13 21:45:00",
                        "text": "Care Plan Day 24: Oncology recovery day 24: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_25",
                    "sessionNum": 25,
                    "timestamp": "2026-09-14 20:34:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.981,
                    "concordance": 0.953,
                    "anomalyDesc": "No",
                    "rationale": "Day 25 Telemetry: Quiescent gastric phonogram (STE 0.00039 V2). Heart rate and tonic skin conductance within safe baseline range (72.7 BPM).",
                    "metrics": {
                        "hrBpm": 72.7,
                        "rmssdMs": 38.8,
                        "impedanceRawUs": 4.44,
                        "impedanceDeltaUs": 0.1,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00039,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-14 20:34:00",
                        "text": "Care Plan Day 25: Oncology recovery day 25: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_26",
                    "sessionNum": 26,
                    "timestamp": "2026-09-15 20:21:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.973,
                    "concordance": 0.902,
                    "anomalyDesc": "No",
                    "rationale": "Day 26 Telemetry: Quiescent gastric phonogram (STE 0.00038 V2). Heart rate and tonic skin conductance within safe baseline range (70.4 BPM).",
                    "metrics": {
                        "hrBpm": 70.4,
                        "rmssdMs": 39.7,
                        "impedanceRawUs": 4.38,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00038,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                        "timestamp": "2026-09-15 20:21:00",
                        "text": "Care Plan Day 26: Oncology recovery day 26: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_27",
                    "sessionNum": 27,
                    "timestamp": "2026-09-16 21:32:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.976,
                    "concordance": 0.931,
                    "anomalyDesc": "No",
                    "rationale": "Day 27 Telemetry: Quiescent gastric phonogram (STE 0.00039 V2). Heart rate and tonic skin conductance within safe baseline range (73.0 BPM).",
                    "metrics": {
                        "hrBpm": 73.0,
                        "rmssdMs": 36.3,
                        "impedanceRawUs": 4.52,
                        "impedanceDeltaUs": 0.12,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00039,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-09-16 21:32:00",
                        "text": "Care Plan Day 27: Oncology recovery day 27: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_28",
                    "sessionNum": 28,
                    "timestamp": "2026-09-17 20:27:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.961,
                    "concordance": 0.905,
                    "anomalyDesc": "No",
                    "rationale": "Day 28 Telemetry: Quiescent gastric phonogram (STE 0.00039 V2). Heart rate and tonic skin conductance within safe baseline range (66.9 BPM).",
                    "metrics": {
                        "hrBpm": 66.9,
                        "rmssdMs": 41.2,
                        "impedanceRawUs": 4.37,
                        "impedanceDeltaUs": 0.11,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00039,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-17 20:27:00",
                        "text": "Care Plan Day 28: Oncology recovery day 28: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_29",
                    "sessionNum": 29,
                    "timestamp": "2026-09-18 22:35:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.976,
                    "concordance": 0.916,
                    "anomalyDesc": "No",
                    "rationale": "Day 29 Telemetry: Quiescent gastric phonogram (STE 0.00037 V2). Heart rate and tonic skin conductance within safe baseline range (67.1 BPM).",
                    "metrics": {
                        "hrBpm": 67.1,
                        "rmssdMs": 40.2,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.04,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00037,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-18 22:35:00",
                        "text": "Care Plan Day 29: Oncology recovery day 29: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                },
                {
                    "sessionId": "SESSION_30",
                    "sessionNum": 30,
                    "timestamp": "2026-09-19 21:46:00",
                    "patientId": "PATIENT_AAL_0105",
                    "name": "AAL Patient 0105 (David Kalu)",
                    "bedId": "BED_DELTA_04",
                    "dob": "19730214",
                    "age": 53,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.97,
                    "concordance": 0.927,
                    "anomalyDesc": "No",
                    "rationale": "Day 30 Telemetry: Quiescent gastric phonogram (STE 0.00039 V2). Heart rate and tonic skin conductance within safe baseline range (71.7 BPM).",
                    "metrics": {
                        "hrBpm": 71.7,
                        "rmssdMs": 36.8,
                        "impedanceRawUs": 4.42,
                        "impedanceDeltaUs": 0.11,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.018,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00039,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Nathan Cole, MD (Medical Oncology)",
                        "timestamp": "2026-09-19 21:46:00",
                        "text": "Care Plan Day 30: Oncology recovery day 30: zero nausea episodes. Diet progressed to electrolyte sports beverages and saltine crackers. Blood counts showing steady recovery."
                    }
                }
            ]
        },
        {
            "id": "PATIENT_AAL_0133",
            "name": "AAL Patient 0133 (Sarah Jenkins)",
            "bedId": "BED_EPSILON_05",
            "dob": "19900830",
            "age": 36,
            "gender": "Female",
            "fsmState": "BASELINE",
            "actionTrigger": "LOG_TELEMETRY",
            "confidence": 0.985,
            "concordance": 0.963,
            "anomalyDesc": "No",
            "rationale": "Day 30 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 63.7 BPM, actigraphy calm (0.013g), EDA 4.27 uS.",
            "metrics": {
                "hrBpm": 63.7,
                "rmssdMs": 47.1,
                "impedanceRawUs": 4.27,
                "impedanceDeltaUs": 0.05,
                "impedanceSlew": 0.08,
                "actigraphyRmsG": 0.013,
                "shivering": false,
                "macroShift": false,
                "acousticEnergy": 0.00022,
                "acousticBurst": false,
                "diaphoresis": false,
                "fluidSpill": false
            },
            "adviceHistory": [
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-19 20:34:00",
                    "text": "Care Plan Day 30: Restorative sleep telemetry verified on Day 30. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                    "timestamp": "2026-09-18 20:16:00",
                    "text": "Care Plan Day 29: Restorative sleep telemetry verified on Day 29. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-17 21:35:00",
                    "text": "Care Plan Day 28: Restorative sleep telemetry verified on Day 28. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-09-16 22:39:00",
                    "text": "Care Plan Day 27: Restorative sleep telemetry verified on Day 27. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                    "timestamp": "2026-09-15 20:17:00",
                    "text": "Care Plan Day 26: Nocturnal restlessness turning noted. CPAP mask seal inspected (pressure set at 10 cm H2O). Elevate head of smart bed to 15 degrees to optimize upper airway patency."
                },
                {
                    "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                    "timestamp": "2026-09-14 21:35:00",
                    "text": "Care Plan Day 25: Restorative sleep telemetry verified on Day 25. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-13 21:24:00",
                    "text": "Care Plan Day 24: Restorative sleep telemetry verified on Day 24. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-09-12 21:38:00",
                    "text": "Care Plan Day 23: Restorative sleep telemetry verified on Day 23. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-11 22:45:00",
                    "text": "Care Plan Day 22: Restorative sleep telemetry verified on Day 22. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                    "timestamp": "2026-09-10 22:27:00",
                    "text": "Care Plan Day 21: Nocturnal restlessness turning noted. CPAP mask seal inspected (pressure set at 10 cm H2O). Elevate head of smart bed to 15 degrees to optimize upper airway patency."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-09 22:17:00",
                    "text": "Care Plan Day 20: Restorative sleep telemetry verified on Day 20. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-08 21:42:00",
                    "text": "Care Plan Day 19: REM-associated sympathetic surge. Ambient cooling engaged. Review daytime caffeine intake (limit after 14:00). Sleep architecture showing 18% REM ratio."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-07 20:10:00",
                    "text": "Care Plan Day 18: Restorative sleep telemetry verified on Day 18. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                    "timestamp": "2026-09-06 22:21:00",
                    "text": "Care Plan Day 17: Nocturnal restlessness turning noted. CPAP mask seal inspected (pressure set at 10 cm H2O). Elevate head of smart bed to 15 degrees to optimize upper airway patency."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-05 22:32:00",
                    "text": "Care Plan Day 16: Restorative sleep telemetry verified on Day 16. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-09-04 22:23:00",
                    "text": "Care Plan Day 15: Restorative sleep telemetry verified on Day 15. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-03 22:35:00",
                    "text": "Care Plan Day 14: Restorative sleep telemetry verified on Day 14. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                    "timestamp": "2026-09-02 22:36:00",
                    "text": "Care Plan Day 13: Restorative sleep telemetry verified on Day 13. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                    "timestamp": "2026-09-01 22:14:00",
                    "text": "Care Plan Day 12: Nocturnal restlessness turning noted. CPAP mask seal inspected (pressure set at 10 cm H2O). Elevate head of smart bed to 15 degrees to optimize upper airway patency."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-08-31 22:50:00",
                    "text": "Care Plan Day 11: Restorative sleep telemetry verified on Day 11. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-08-30 22:38:00",
                    "text": "Care Plan Day 10: Restorative sleep telemetry verified on Day 10. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                    "timestamp": "2026-08-29 22:36:00",
                    "text": "Care Plan Day 9: Restorative sleep telemetry verified on Day 9. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                    "timestamp": "2026-08-28 20:39:00",
                    "text": "Care Plan Day 8: Nocturnal restlessness turning noted. CPAP mask seal inspected (pressure set at 10 cm H2O). Elevate head of smart bed to 15 degrees to optimize upper airway patency."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-08-27 20:12:00",
                    "text": "Care Plan Day 7: Restorative sleep telemetry verified on Day 7. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-08-26 21:35:00",
                    "text": "Care Plan Day 6: REM-associated sympathetic surge. Ambient cooling engaged. Review daytime caffeine intake (limit after 14:00). Sleep architecture showing 18% REM ratio."
                },
                {
                    "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                    "timestamp": "2026-08-25 22:50:00",
                    "text": "Care Plan Day 5: Restorative sleep telemetry verified on Day 5. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                    "timestamp": "2026-08-24 21:26:00",
                    "text": "Care Plan Day 4: Nocturnal restlessness turning noted. CPAP mask seal inspected (pressure set at 10 cm H2O). Elevate head of smart bed to 15 degrees to optimize upper airway patency."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-08-23 20:17:00",
                    "text": "Care Plan Day 3: Restorative sleep telemetry verified on Day 3. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-08-22 22:20:00",
                    "text": "Care Plan Day 2: Restorative sleep telemetry verified on Day 2. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                },
                {
                    "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                    "timestamp": "2026-08-21 21:31:00",
                    "text": "Care Plan Day 1: Nocturnal restlessness turning noted. CPAP mask seal inspected (pressure set at 10 cm H2O). Elevate head of smart bed to 15 degrees to optimize upper airway patency."
                }
            ],
            "sessions": [
                {
                    "sessionId": "SESSION_01",
                    "sessionNum": 1,
                    "timestamp": "2026-08-21 21:31:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "POSTURAL_SHIFT",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.964,
                    "concordance": 0.968,
                    "anomalyDesc": "Postural Shift",
                    "rationale": "Day 1 Telemetry: Significant macro postural turnaround detected (0.377 g piezo actigraphy RMS). Arousal index moderate; no respiratory crisis.",
                    "metrics": {
                        "hrBpm": 81.1,
                        "rmssdMs": 36.8,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.18,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.377,
                        "shivering": false,
                        "macroShift": true,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                        "timestamp": "2026-08-21 21:31:00",
                        "text": "Care Plan Day 1: Nocturnal restlessness turning noted. CPAP mask seal inspected (pressure set at 10 cm H2O). Elevate head of smart bed to 15 degrees to optimize upper airway patency."
                    }
                },
                {
                    "sessionId": "SESSION_02",
                    "sessionNum": 2,
                    "timestamp": "2026-08-22 22:20:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.974,
                    "concordance": 0.957,
                    "anomalyDesc": "No",
                    "rationale": "Day 2 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 63.2 BPM, actigraphy calm (0.013g), EDA 4.29 uS.",
                    "metrics": {
                        "hrBpm": 63.2,
                        "rmssdMs": 42.7,
                        "impedanceRawUs": 4.29,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.013,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-08-22 22:20:00",
                        "text": "Care Plan Day 2: Restorative sleep telemetry verified on Day 2. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_03",
                    "sessionNum": 3,
                    "timestamp": "2026-08-23 20:17:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.971,
                    "concordance": 0.904,
                    "anomalyDesc": "No",
                    "rationale": "Day 3 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 67.7 BPM, actigraphy calm (0.015g), EDA 4.24 uS.",
                    "metrics": {
                        "hrBpm": 67.7,
                        "rmssdMs": 40.4,
                        "impedanceRawUs": 4.24,
                        "impedanceDeltaUs": 0.07,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-08-23 20:17:00",
                        "text": "Care Plan Day 3: Restorative sleep telemetry verified on Day 3. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_04",
                    "sessionNum": 4,
                    "timestamp": "2026-08-24 21:26:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "POSTURAL_SHIFT",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.965,
                    "concordance": 0.915,
                    "anomalyDesc": "Postural Shift",
                    "rationale": "Day 4 Telemetry: Significant macro postural turnaround detected (0.348 g piezo actigraphy RMS). Arousal index moderate; no respiratory crisis.",
                    "metrics": {
                        "hrBpm": 80.2,
                        "rmssdMs": 36.4,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.18,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.348,
                        "shivering": false,
                        "macroShift": true,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                        "timestamp": "2026-08-24 21:26:00",
                        "text": "Care Plan Day 4: Nocturnal restlessness turning noted. CPAP mask seal inspected (pressure set at 10 cm H2O). Elevate head of smart bed to 15 degrees to optimize upper airway patency."
                    }
                },
                {
                    "sessionId": "SESSION_05",
                    "sessionNum": 5,
                    "timestamp": "2026-08-25 22:50:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.972,
                    "concordance": 0.96,
                    "anomalyDesc": "No",
                    "rationale": "Day 5 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 62.5 BPM, actigraphy calm (0.013g), EDA 4.33 uS.",
                    "metrics": {
                        "hrBpm": 62.5,
                        "rmssdMs": 44.7,
                        "impedanceRawUs": 4.33,
                        "impedanceDeltaUs": 0.07,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.013,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                        "timestamp": "2026-08-25 22:50:00",
                        "text": "Care Plan Day 5: Restorative sleep telemetry verified on Day 5. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_06",
                    "sessionNum": 6,
                    "timestamp": "2026-08-26 21:35:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.987,
                    "concordance": 0.963,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 6 Telemetry: Autonomic micro-arousal with brief diaphoresis (+6.8 uS). Room HVAC cooling engaged at 21.5\u00b0C.",
                    "metrics": {
                        "hrBpm": 93.4,
                        "rmssdMs": 73.2,
                        "impedanceRawUs": 11.2,
                        "impedanceDeltaUs": 6.8,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.025,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-08-26 21:35:00",
                        "text": "Care Plan Day 6: REM-associated sympathetic surge. Ambient cooling engaged. Review daytime caffeine intake (limit after 14:00). Sleep architecture showing 18% REM ratio."
                    }
                },
                {
                    "sessionId": "SESSION_07",
                    "sessionNum": 7,
                    "timestamp": "2026-08-27 20:12:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.972,
                    "concordance": 0.937,
                    "anomalyDesc": "No",
                    "rationale": "Day 7 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 64.7 BPM, actigraphy calm (0.012g), EDA 4.34 uS.",
                    "metrics": {
                        "hrBpm": 64.7,
                        "rmssdMs": 41.4,
                        "impedanceRawUs": 4.34,
                        "impedanceDeltaUs": 0.02,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-08-27 20:12:00",
                        "text": "Care Plan Day 7: Restorative sleep telemetry verified on Day 7. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_08",
                    "sessionNum": 8,
                    "timestamp": "2026-08-28 20:39:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "POSTURAL_SHIFT",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.974,
                    "concordance": 0.9,
                    "anomalyDesc": "Postural Shift",
                    "rationale": "Day 8 Telemetry: Significant macro postural turnaround detected (0.385 g piezo actigraphy RMS). Arousal index moderate; no respiratory crisis.",
                    "metrics": {
                        "hrBpm": 83.2,
                        "rmssdMs": 35.9,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.18,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.385,
                        "shivering": false,
                        "macroShift": true,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                        "timestamp": "2026-08-28 20:39:00",
                        "text": "Care Plan Day 8: Nocturnal restlessness turning noted. CPAP mask seal inspected (pressure set at 10 cm H2O). Elevate head of smart bed to 15 degrees to optimize upper airway patency."
                    }
                },
                {
                    "sessionId": "SESSION_09",
                    "sessionNum": 9,
                    "timestamp": "2026-08-29 22:36:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.981,
                    "concordance": 0.902,
                    "anomalyDesc": "No",
                    "rationale": "Day 9 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 62.9 BPM, actigraphy calm (0.015g), EDA 4.21 uS.",
                    "metrics": {
                        "hrBpm": 62.9,
                        "rmssdMs": 41.9,
                        "impedanceRawUs": 4.21,
                        "impedanceDeltaUs": 0.01,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                        "timestamp": "2026-08-29 22:36:00",
                        "text": "Care Plan Day 9: Restorative sleep telemetry verified on Day 9. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_10",
                    "sessionNum": 10,
                    "timestamp": "2026-08-30 22:38:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.985,
                    "concordance": 0.909,
                    "anomalyDesc": "No",
                    "rationale": "Day 10 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 65.9 BPM, actigraphy calm (0.012g), EDA 4.21 uS.",
                    "metrics": {
                        "hrBpm": 65.9,
                        "rmssdMs": 42.1,
                        "impedanceRawUs": 4.21,
                        "impedanceDeltaUs": 0.06,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.012,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-08-30 22:38:00",
                        "text": "Care Plan Day 10: Restorative sleep telemetry verified on Day 10. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_11",
                    "sessionNum": 11,
                    "timestamp": "2026-08-31 22:50:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.984,
                    "concordance": 0.936,
                    "anomalyDesc": "No",
                    "rationale": "Day 11 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 65.2 BPM, actigraphy calm (0.015g), EDA 4.26 uS.",
                    "metrics": {
                        "hrBpm": 65.2,
                        "rmssdMs": 44.1,
                        "impedanceRawUs": 4.26,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-08-31 22:50:00",
                        "text": "Care Plan Day 11: Restorative sleep telemetry verified on Day 11. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_12",
                    "sessionNum": 12,
                    "timestamp": "2026-09-01 22:14:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "POSTURAL_SHIFT",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.967,
                    "concordance": 0.916,
                    "anomalyDesc": "Postural Shift",
                    "rationale": "Day 12 Telemetry: Significant macro postural turnaround detected (0.374 g piezo actigraphy RMS). Arousal index moderate; no respiratory crisis.",
                    "metrics": {
                        "hrBpm": 82.3,
                        "rmssdMs": 35.8,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.18,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.374,
                        "shivering": false,
                        "macroShift": true,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                        "timestamp": "2026-09-01 22:14:00",
                        "text": "Care Plan Day 12: Nocturnal restlessness turning noted. CPAP mask seal inspected (pressure set at 10 cm H2O). Elevate head of smart bed to 15 degrees to optimize upper airway patency."
                    }
                },
                {
                    "sessionId": "SESSION_13",
                    "sessionNum": 13,
                    "timestamp": "2026-09-02 22:36:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.961,
                    "concordance": 0.93,
                    "anomalyDesc": "No",
                    "rationale": "Day 13 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 67.7 BPM, actigraphy calm (0.015g), EDA 4.30 uS.",
                    "metrics": {
                        "hrBpm": 67.7,
                        "rmssdMs": 46.6,
                        "impedanceRawUs": 4.3,
                        "impedanceDeltaUs": 0.02,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                        "timestamp": "2026-09-02 22:36:00",
                        "text": "Care Plan Day 13: Restorative sleep telemetry verified on Day 13. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_14",
                    "sessionNum": 14,
                    "timestamp": "2026-09-03 22:35:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.967,
                    "concordance": 0.943,
                    "anomalyDesc": "No",
                    "rationale": "Day 14 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 62.8 BPM, actigraphy calm (0.013g), EDA 4.25 uS.",
                    "metrics": {
                        "hrBpm": 62.8,
                        "rmssdMs": 43.7,
                        "impedanceRawUs": 4.25,
                        "impedanceDeltaUs": 0.07,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.013,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-03 22:35:00",
                        "text": "Care Plan Day 14: Restorative sleep telemetry verified on Day 14. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_15",
                    "sessionNum": 15,
                    "timestamp": "2026-09-04 22:23:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.985,
                    "concordance": 0.946,
                    "anomalyDesc": "No",
                    "rationale": "Day 15 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 64.5 BPM, actigraphy calm (0.013g), EDA 4.20 uS.",
                    "metrics": {
                        "hrBpm": 64.5,
                        "rmssdMs": 44.7,
                        "impedanceRawUs": 4.2,
                        "impedanceDeltaUs": 0.06,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.013,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-09-04 22:23:00",
                        "text": "Care Plan Day 15: Restorative sleep telemetry verified on Day 15. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_16",
                    "sessionNum": 16,
                    "timestamp": "2026-09-05 22:32:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.965,
                    "concordance": 0.939,
                    "anomalyDesc": "No",
                    "rationale": "Day 16 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 66.6 BPM, actigraphy calm (0.014g), EDA 4.28 uS.",
                    "metrics": {
                        "hrBpm": 66.6,
                        "rmssdMs": 46.1,
                        "impedanceRawUs": 4.28,
                        "impedanceDeltaUs": 0.04,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.014,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-05 22:32:00",
                        "text": "Care Plan Day 16: Restorative sleep telemetry verified on Day 16. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_17",
                    "sessionNum": 17,
                    "timestamp": "2026-09-06 22:21:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "POSTURAL_SHIFT",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.987,
                    "concordance": 0.962,
                    "anomalyDesc": "Postural Shift",
                    "rationale": "Day 17 Telemetry: Significant macro postural turnaround detected (0.354 g piezo actigraphy RMS). Arousal index moderate; no respiratory crisis.",
                    "metrics": {
                        "hrBpm": 80.5,
                        "rmssdMs": 35.6,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.18,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.354,
                        "shivering": false,
                        "macroShift": true,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                        "timestamp": "2026-09-06 22:21:00",
                        "text": "Care Plan Day 17: Nocturnal restlessness turning noted. CPAP mask seal inspected (pressure set at 10 cm H2O). Elevate head of smart bed to 15 degrees to optimize upper airway patency."
                    }
                },
                {
                    "sessionId": "SESSION_18",
                    "sessionNum": 18,
                    "timestamp": "2026-09-07 20:10:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.987,
                    "concordance": 0.907,
                    "anomalyDesc": "No",
                    "rationale": "Day 18 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 64.4 BPM, actigraphy calm (0.013g), EDA 4.35 uS.",
                    "metrics": {
                        "hrBpm": 64.4,
                        "rmssdMs": 41.2,
                        "impedanceRawUs": 4.35,
                        "impedanceDeltaUs": 0.02,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.013,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-07 20:10:00",
                        "text": "Care Plan Day 18: Restorative sleep telemetry verified on Day 18. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_19",
                    "sessionNum": 19,
                    "timestamp": "2026-09-08 21:42:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.986,
                    "concordance": 0.919,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 19 Telemetry: Autonomic micro-arousal with brief diaphoresis (+6.8 uS). Room HVAC cooling engaged at 21.5\u00b0C.",
                    "metrics": {
                        "hrBpm": 90.7,
                        "rmssdMs": 74.1,
                        "impedanceRawUs": 11.2,
                        "impedanceDeltaUs": 6.8,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.025,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-08 21:42:00",
                        "text": "Care Plan Day 19: REM-associated sympathetic surge. Ambient cooling engaged. Review daytime caffeine intake (limit after 14:00). Sleep architecture showing 18% REM ratio."
                    }
                },
                {
                    "sessionId": "SESSION_20",
                    "sessionNum": 20,
                    "timestamp": "2026-09-09 22:17:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.974,
                    "concordance": 0.917,
                    "anomalyDesc": "No",
                    "rationale": "Day 20 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 63.0 BPM, actigraphy calm (0.013g), EDA 4.23 uS.",
                    "metrics": {
                        "hrBpm": 63.0,
                        "rmssdMs": 41.8,
                        "impedanceRawUs": 4.23,
                        "impedanceDeltaUs": 0.02,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.013,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-09 22:17:00",
                        "text": "Care Plan Day 20: Restorative sleep telemetry verified on Day 20. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_21",
                    "sessionNum": 21,
                    "timestamp": "2026-09-10 22:27:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "POSTURAL_SHIFT",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.985,
                    "concordance": 0.964,
                    "anomalyDesc": "Postural Shift",
                    "rationale": "Day 21 Telemetry: Significant macro postural turnaround detected (0.354 g piezo actigraphy RMS). Arousal index moderate; no respiratory crisis.",
                    "metrics": {
                        "hrBpm": 81.2,
                        "rmssdMs": 34.6,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.18,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.354,
                        "shivering": false,
                        "macroShift": true,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                        "timestamp": "2026-09-10 22:27:00",
                        "text": "Care Plan Day 21: Nocturnal restlessness turning noted. CPAP mask seal inspected (pressure set at 10 cm H2O). Elevate head of smart bed to 15 degrees to optimize upper airway patency."
                    }
                },
                {
                    "sessionId": "SESSION_22",
                    "sessionNum": 22,
                    "timestamp": "2026-09-11 22:45:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.978,
                    "concordance": 0.915,
                    "anomalyDesc": "No",
                    "rationale": "Day 22 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 65.8 BPM, actigraphy calm (0.013g), EDA 4.24 uS.",
                    "metrics": {
                        "hrBpm": 65.8,
                        "rmssdMs": 48.0,
                        "impedanceRawUs": 4.24,
                        "impedanceDeltaUs": 0.08,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.013,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-11 22:45:00",
                        "text": "Care Plan Day 22: Restorative sleep telemetry verified on Day 22. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_23",
                    "sessionNum": 23,
                    "timestamp": "2026-09-12 21:38:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.988,
                    "concordance": 0.969,
                    "anomalyDesc": "No",
                    "rationale": "Day 23 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 66.4 BPM, actigraphy calm (0.015g), EDA 4.22 uS.",
                    "metrics": {
                        "hrBpm": 66.4,
                        "rmssdMs": 42.4,
                        "impedanceRawUs": 4.22,
                        "impedanceDeltaUs": 0.07,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-09-12 21:38:00",
                        "text": "Care Plan Day 23: Restorative sleep telemetry verified on Day 23. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_24",
                    "sessionNum": 24,
                    "timestamp": "2026-09-13 21:24:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.963,
                    "concordance": 0.9,
                    "anomalyDesc": "No",
                    "rationale": "Day 24 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 62.3 BPM, actigraphy calm (0.014g), EDA 4.29 uS.",
                    "metrics": {
                        "hrBpm": 62.3,
                        "rmssdMs": 46.9,
                        "impedanceRawUs": 4.29,
                        "impedanceDeltaUs": 0.06,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.014,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-13 21:24:00",
                        "text": "Care Plan Day 24: Restorative sleep telemetry verified on Day 24. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_25",
                    "sessionNum": 25,
                    "timestamp": "2026-09-14 21:35:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.96,
                    "concordance": 0.964,
                    "anomalyDesc": "No",
                    "rationale": "Day 25 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 63.7 BPM, actigraphy calm (0.014g), EDA 4.30 uS.",
                    "metrics": {
                        "hrBpm": 63.7,
                        "rmssdMs": 41.0,
                        "impedanceRawUs": 4.3,
                        "impedanceDeltaUs": 0.07,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.014,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                        "timestamp": "2026-09-14 21:35:00",
                        "text": "Care Plan Day 25: Restorative sleep telemetry verified on Day 25. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_26",
                    "sessionNum": 26,
                    "timestamp": "2026-09-15 20:17:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "POSTURAL_SHIFT",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.985,
                    "concordance": 0.927,
                    "anomalyDesc": "Postural Shift",
                    "rationale": "Day 26 Telemetry: Significant macro postural turnaround detected (0.365 g piezo actigraphy RMS). Arousal index moderate; no respiratory crisis.",
                    "metrics": {
                        "hrBpm": 82.9,
                        "rmssdMs": 34.4,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.18,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.365,
                        "shivering": false,
                        "macroShift": true,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                        "timestamp": "2026-09-15 20:17:00",
                        "text": "Care Plan Day 26: Nocturnal restlessness turning noted. CPAP mask seal inspected (pressure set at 10 cm H2O). Elevate head of smart bed to 15 degrees to optimize upper airway patency."
                    }
                },
                {
                    "sessionId": "SESSION_27",
                    "sessionNum": 27,
                    "timestamp": "2026-09-16 22:39:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.965,
                    "concordance": 0.912,
                    "anomalyDesc": "No",
                    "rationale": "Day 27 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 67.3 BPM, actigraphy calm (0.013g), EDA 4.19 uS.",
                    "metrics": {
                        "hrBpm": 67.3,
                        "rmssdMs": 46.0,
                        "impedanceRawUs": 4.19,
                        "impedanceDeltaUs": 0.06,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.013,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-09-16 22:39:00",
                        "text": "Care Plan Day 27: Restorative sleep telemetry verified on Day 27. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_28",
                    "sessionNum": 28,
                    "timestamp": "2026-09-17 21:35:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.977,
                    "concordance": 0.962,
                    "anomalyDesc": "No",
                    "rationale": "Day 28 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 65.9 BPM, actigraphy calm (0.015g), EDA 4.16 uS.",
                    "metrics": {
                        "hrBpm": 65.9,
                        "rmssdMs": 41.9,
                        "impedanceRawUs": 4.16,
                        "impedanceDeltaUs": 0.07,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.015,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-17 21:35:00",
                        "text": "Care Plan Day 28: Restorative sleep telemetry verified on Day 28. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_29",
                    "sessionNum": 29,
                    "timestamp": "2026-09-18 20:16:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.979,
                    "concordance": 0.945,
                    "anomalyDesc": "No",
                    "rationale": "Day 29 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 67.5 BPM, actigraphy calm (0.013g), EDA 4.26 uS.",
                    "metrics": {
                        "hrBpm": 67.5,
                        "rmssdMs": 42.0,
                        "impedanceRawUs": 4.26,
                        "impedanceDeltaUs": 0.07,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.013,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Arthur Pendelton, MD (Sleep Medicine)",
                        "timestamp": "2026-09-18 20:16:00",
                        "text": "Care Plan Day 29: Restorative sleep telemetry verified on Day 29. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                },
                {
                    "sessionId": "SESSION_30",
                    "sessionNum": 30,
                    "timestamp": "2026-09-19 20:34:00",
                    "patientId": "PATIENT_AAL_0133",
                    "name": "AAL Patient 0133 (Sarah Jenkins)",
                    "bedId": "BED_EPSILON_05",
                    "dob": "19900830",
                    "age": 36,
                    "gender": "Female",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.985,
                    "concordance": 0.963,
                    "anomalyDesc": "No",
                    "rationale": "Day 30 Telemetry: Deep consolidated slow-wave sleep. Heart rate steady at 63.7 BPM, actigraphy calm (0.013g), EDA 4.27 uS.",
                    "metrics": {
                        "hrBpm": 63.7,
                        "rmssdMs": 47.1,
                        "impedanceRawUs": 4.27,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.013,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.00022,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-19 20:34:00",
                        "text": "Care Plan Day 30: Restorative sleep telemetry verified on Day 30. CPAP compliance 100% (7.4 hours uninterrupted). Daytime alertness improved; patient cleared for active rehabilitation."
                    }
                }
            ]
        },
        {
            "id": "PATIENT_AAL_0150",
            "name": "AAL Patient 0150 (Robert Sterling)",
            "bedId": "BED_ZETA_06",
            "dob": "19640519",
            "age": 62,
            "gender": "Male",
            "fsmState": "BASELINE",
            "actionTrigger": "LOG_TELEMETRY",
            "confidence": 0.981,
            "concordance": 0.902,
            "anomalyDesc": "No",
            "rationale": "Day 30 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 70.7 BPM, EDA: 4.41 uS).",
            "metrics": {
                "hrBpm": 70.7,
                "rmssdMs": 41.0,
                "impedanceRawUs": 4.41,
                "impedanceDeltaUs": 0.02,
                "impedanceSlew": 0.08,
                "actigraphyRmsG": 0.016,
                "shivering": false,
                "macroShift": false,
                "acousticEnergy": 0.0003,
                "acousticBurst": false,
                "diaphoresis": false,
                "fluidSpill": false
            },
            "adviceHistory": [
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-09-19 22:17:00",
                    "text": "Care Plan Day 30: Gastroenteritis resolution continuing smoothly on Day 30. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-18 21:46:00",
                    "text": "Care Plan Day 29: Gastroenteritis resolution continuing smoothly on Day 29. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-17 20:38:00",
                    "text": "Care Plan Day 28: Gastroenteritis resolution continuing smoothly on Day 28. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-09-16 20:17:00",
                    "text": "Care Plan Day 27: Gastroenteritis resolution continuing smoothly on Day 27. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-09-15 22:40:00",
                    "text": "Care Plan Day 26: Gastroenteritis resolution continuing smoothly on Day 26. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-14 20:30:00",
                    "text": "Care Plan Day 25: Gastroenteritis resolution continuing smoothly on Day 25. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-13 21:31:00",
                    "text": "Care Plan Day 24: Gastroenteritis resolution continuing smoothly on Day 24. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-09-12 20:39:00",
                    "text": "Care Plan Day 23: Gastroenteritis resolution continuing smoothly on Day 23. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-09-11 20:45:00",
                    "text": "Care Plan Day 22: Bedside water spill identified and false alarm suppressed by FSM algorithm. Linens exchanged. Remind patient to use spill-proof hydration tumbler with straw."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-10 20:15:00",
                    "text": "Care Plan Day 21: Gastroenteritis resolution continuing smoothly on Day 21. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-09 22:28:00",
                    "text": "Care Plan Day 20: Gastroenteritis resolution continuing smoothly on Day 20. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-09-08 20:47:00",
                    "text": "Care Plan Day 19: Gastroenteritis resolution continuing smoothly on Day 19. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-09-07 21:26:00",
                    "text": "Care Plan Day 18: Gastroenteritis resolution continuing smoothly on Day 18. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-06 20:11:00",
                    "text": "Care Plan Day 17: Gastroenteritis resolution continuing smoothly on Day 17. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-05 21:20:00",
                    "text": "Care Plan Day 16: Gastroenteritis resolution continuing smoothly on Day 16. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-09-04 22:22:00",
                    "text": "Care Plan Day 15: Gastroenteritis resolution continuing smoothly on Day 15. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-03 20:17:00",
                    "text": "Care Plan Day 14: Defervescence diaphoresis managed. Patient afebrile at 37.0\u00b0C. Oral rehydration solution (WHO formulation) 1.5 liters consumed. Bowel cramps subsiding."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-09-02 20:31:00",
                    "text": "Care Plan Day 13: Gastroenteritis resolution continuing smoothly on Day 13. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-09-01 22:44:00",
                    "text": "Care Plan Day 12: Gastroenteritis resolution continuing smoothly on Day 12. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-08-31 21:47:00",
                    "text": "Care Plan Day 11: Bedside water spill identified and false alarm suppressed by FSM algorithm. Linens exchanged. Remind patient to use spill-proof hydration tumbler with straw."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-08-30 20:22:00",
                    "text": "Care Plan Day 10: Gastroenteritis resolution continuing smoothly on Day 10. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-08-29 20:30:00",
                    "text": "Care Plan Day 9: Gastroenteritis resolution continuing smoothly on Day 9. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-08-28 21:41:00",
                    "text": "Care Plan Day 8: Gastroenteritis resolution continuing smoothly on Day 8. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-08-27 20:14:00",
                    "text": "Care Plan Day 7: Gastroenteritis resolution continuing smoothly on Day 7. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-08-26 21:12:00",
                    "text": "Care Plan Day 6: Gastroenteritis resolution continuing smoothly on Day 6. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                    "timestamp": "2026-08-25 22:26:00",
                    "text": "Care Plan Day 5: Defervescence diaphoresis managed. Patient afebrile at 37.0\u00b0C. Oral rehydration solution (WHO formulation) 1.5 liters consumed. Bowel cramps subsiding."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-08-24 22:19:00",
                    "text": "Care Plan Day 4: Gastroenteritis resolution continuing smoothly on Day 4. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Charge Nurse Linda Croft, RN",
                    "timestamp": "2026-08-23 21:41:00",
                    "text": "Care Plan Day 3: Bedside water spill identified and false alarm suppressed by FSM algorithm. Linens exchanged. Remind patient to use spill-proof hydration tumbler with straw."
                },
                {
                    "doctor": "Dr. Rajesh Patel, PharmD",
                    "timestamp": "2026-08-22 20:21:00",
                    "text": "Care Plan Day 2: Gastroenteritis resolution continuing smoothly on Day 2. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                },
                {
                    "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                    "timestamp": "2026-08-21 22:22:00",
                    "text": "Care Plan Day 1: CRISIS ADMISSION: Acute viral gastroenteritis. IV fluid resuscitation with Normal Saline 1,000 mL bolus. IV Promethazine 12.5mg given. New sterile mattress fitted."
                }
            ],
            "sessions": [
                {
                    "sessionId": "SESSION_01",
                    "sessionNum": 1,
                    "timestamp": "2026-08-21 22:22:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "ACTIVE_EMESIS_EVENT",
                    "actionTrigger": "DISPATCH_RAPID_RESPONSE",
                    "confidence": 0.967,
                    "concordance": 0.901,
                    "anomalyDesc": "Yes (ACTIVE_EMESIS_EVENT - Crisis)",
                    "rationale": "Day 1 Telemetry: Admission day: acute gastrointestinal crisis with projectile emesis and mattress liquid soak. Emergency nursing response dispatched.",
                    "metrics": {
                        "hrBpm": 128.0,
                        "rmssdMs": 98.0,
                        "impedanceRawUs": 24.5,
                        "impedanceDeltaUs": 18.2,
                        "impedanceSlew": 25.0,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": true,
                        "diaphoresis": true,
                        "fluidSpill": true
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-08-21 22:22:00",
                        "text": "Care Plan Day 1: CRISIS ADMISSION: Acute viral gastroenteritis. IV fluid resuscitation with Normal Saline 1,000 mL bolus. IV Promethazine 12.5mg given. New sterile mattress fitted."
                    }
                },
                {
                    "sessionId": "SESSION_02",
                    "sessionNum": 2,
                    "timestamp": "2026-08-22 20:21:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.975,
                    "concordance": 0.909,
                    "anomalyDesc": "No",
                    "rationale": "Day 2 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 67.7 BPM, EDA: 4.46 uS).",
                    "metrics": {
                        "hrBpm": 67.7,
                        "rmssdMs": 42.2,
                        "impedanceRawUs": 4.46,
                        "impedanceDeltaUs": 0.08,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-08-22 20:21:00",
                        "text": "Care Plan Day 2: Gastroenteritis resolution continuing smoothly on Day 2. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_03",
                    "sessionNum": 3,
                    "timestamp": "2026-08-23 21:41:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "ARTIFACT_REJECTED",
                    "actionTrigger": "REJECT_FALSE_ALARM",
                    "confidence": 0.984,
                    "concordance": 0.963,
                    "anomalyDesc": "Artifact Spill (Suppressed)",
                    "rationale": "Day 3 Telemetry: Accidental electrolyte water cup spill on mattress e-textile. Very high slew rate (32 uS/s) with calm biometrics. Spill artifact rejected.",
                    "metrics": {
                        "hrBpm": 75.6,
                        "rmssdMs": 38.5,
                        "impedanceRawUs": 26.0,
                        "impedanceDeltaUs": 20.5,
                        "impedanceSlew": 25.0,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": true
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-08-23 21:41:00",
                        "text": "Care Plan Day 3: Bedside water spill identified and false alarm suppressed by FSM algorithm. Linens exchanged. Remind patient to use spill-proof hydration tumbler with straw."
                    }
                },
                {
                    "sessionId": "SESSION_04",
                    "sessionNum": 4,
                    "timestamp": "2026-08-24 22:19:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.965,
                    "concordance": 0.916,
                    "anomalyDesc": "No",
                    "rationale": "Day 4 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 70.6 BPM, EDA: 4.55 uS).",
                    "metrics": {
                        "hrBpm": 70.6,
                        "rmssdMs": 43.7,
                        "impedanceRawUs": 4.55,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-08-24 22:19:00",
                        "text": "Care Plan Day 4: Gastroenteritis resolution continuing smoothly on Day 4. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_05",
                    "sessionNum": 5,
                    "timestamp": "2026-08-25 22:26:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.978,
                    "concordance": 0.959,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 5 Telemetry: Post-fever defervescence cold sweat diaphoresis (+8.5 uS at 01:20 AM). Automated Fan/AC cooling activated.",
                    "metrics": {
                        "hrBpm": 97.2,
                        "rmssdMs": 77.0,
                        "impedanceRawUs": 13.5,
                        "impedanceDeltaUs": 8.5,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-08-25 22:26:00",
                        "text": "Care Plan Day 5: Defervescence diaphoresis managed. Patient afebrile at 37.0\u00b0C. Oral rehydration solution (WHO formulation) 1.5 liters consumed. Bowel cramps subsiding."
                    }
                },
                {
                    "sessionId": "SESSION_06",
                    "sessionNum": 6,
                    "timestamp": "2026-08-26 21:12:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.97,
                    "concordance": 0.909,
                    "anomalyDesc": "No",
                    "rationale": "Day 6 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 65.6 BPM, EDA: 4.59 uS).",
                    "metrics": {
                        "hrBpm": 65.6,
                        "rmssdMs": 38.1,
                        "impedanceRawUs": 4.59,
                        "impedanceDeltaUs": 0.08,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-08-26 21:12:00",
                        "text": "Care Plan Day 6: Gastroenteritis resolution continuing smoothly on Day 6. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_07",
                    "sessionNum": 7,
                    "timestamp": "2026-08-27 20:14:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.968,
                    "concordance": 0.958,
                    "anomalyDesc": "No",
                    "rationale": "Day 7 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 69.1 BPM, EDA: 4.39 uS).",
                    "metrics": {
                        "hrBpm": 69.1,
                        "rmssdMs": 44.3,
                        "impedanceRawUs": 4.39,
                        "impedanceDeltaUs": 0.04,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-08-27 20:14:00",
                        "text": "Care Plan Day 7: Gastroenteritis resolution continuing smoothly on Day 7. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_08",
                    "sessionNum": 8,
                    "timestamp": "2026-08-28 21:41:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.963,
                    "concordance": 0.913,
                    "anomalyDesc": "No",
                    "rationale": "Day 8 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 67.1 BPM, EDA: 4.57 uS).",
                    "metrics": {
                        "hrBpm": 67.1,
                        "rmssdMs": 43.7,
                        "impedanceRawUs": 4.57,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-08-28 21:41:00",
                        "text": "Care Plan Day 8: Gastroenteritis resolution continuing smoothly on Day 8. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_09",
                    "sessionNum": 9,
                    "timestamp": "2026-08-29 20:30:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.967,
                    "concordance": 0.953,
                    "anomalyDesc": "No",
                    "rationale": "Day 9 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 65.7 BPM, EDA: 4.49 uS).",
                    "metrics": {
                        "hrBpm": 65.7,
                        "rmssdMs": 41.8,
                        "impedanceRawUs": 4.49,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-08-29 20:30:00",
                        "text": "Care Plan Day 9: Gastroenteritis resolution continuing smoothly on Day 9. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_10",
                    "sessionNum": 10,
                    "timestamp": "2026-08-30 20:22:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.972,
                    "concordance": 0.965,
                    "anomalyDesc": "No",
                    "rationale": "Day 10 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 68.6 BPM, EDA: 4.40 uS).",
                    "metrics": {
                        "hrBpm": 68.6,
                        "rmssdMs": 44.2,
                        "impedanceRawUs": 4.4,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-08-30 20:22:00",
                        "text": "Care Plan Day 10: Gastroenteritis resolution continuing smoothly on Day 10. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_11",
                    "sessionNum": 11,
                    "timestamp": "2026-08-31 21:47:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "ARTIFACT_REJECTED",
                    "actionTrigger": "REJECT_FALSE_ALARM",
                    "confidence": 0.974,
                    "concordance": 0.965,
                    "anomalyDesc": "Artifact Spill (Suppressed)",
                    "rationale": "Day 11 Telemetry: Accidental electrolyte water cup spill on mattress e-textile. Very high slew rate (32 uS/s) with calm biometrics. Spill artifact rejected.",
                    "metrics": {
                        "hrBpm": 75.8,
                        "rmssdMs": 38.6,
                        "impedanceRawUs": 26.0,
                        "impedanceDeltaUs": 20.5,
                        "impedanceSlew": 25.0,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": true
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-08-31 21:47:00",
                        "text": "Care Plan Day 11: Bedside water spill identified and false alarm suppressed by FSM algorithm. Linens exchanged. Remind patient to use spill-proof hydration tumbler with straw."
                    }
                },
                {
                    "sessionId": "SESSION_12",
                    "sessionNum": 12,
                    "timestamp": "2026-09-01 22:44:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.984,
                    "concordance": 0.953,
                    "anomalyDesc": "No",
                    "rationale": "Day 12 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 65.2 BPM, EDA: 4.56 uS).",
                    "metrics": {
                        "hrBpm": 65.2,
                        "rmssdMs": 41.1,
                        "impedanceRawUs": 4.56,
                        "impedanceDeltaUs": 0.02,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-01 22:44:00",
                        "text": "Care Plan Day 12: Gastroenteritis resolution continuing smoothly on Day 12. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_13",
                    "sessionNum": 13,
                    "timestamp": "2026-09-02 20:31:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.973,
                    "concordance": 0.932,
                    "anomalyDesc": "No",
                    "rationale": "Day 13 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 68.3 BPM, EDA: 4.41 uS).",
                    "metrics": {
                        "hrBpm": 68.3,
                        "rmssdMs": 38.6,
                        "impedanceRawUs": 4.41,
                        "impedanceDeltaUs": 0.06,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-02 20:31:00",
                        "text": "Care Plan Day 13: Gastroenteritis resolution continuing smoothly on Day 13. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_14",
                    "sessionNum": 14,
                    "timestamp": "2026-09-03 20:17:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "PARASYMPATHETIC_SURGE",
                    "actionTrigger": "TURN_ON_FAN_AC",
                    "confidence": 0.97,
                    "concordance": 0.915,
                    "anomalyDesc": "Yes (PARASYMPATHETIC_SURGE - Cold Sweat)",
                    "rationale": "Day 14 Telemetry: Post-fever defervescence cold sweat diaphoresis (+8.5 uS at 01:20 AM). Automated Fan/AC cooling activated.",
                    "metrics": {
                        "hrBpm": 95.9,
                        "rmssdMs": 76.0,
                        "impedanceRawUs": 13.5,
                        "impedanceDeltaUs": 8.5,
                        "impedanceSlew": 1.5,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": true,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-03 20:17:00",
                        "text": "Care Plan Day 14: Defervescence diaphoresis managed. Patient afebrile at 37.0\u00b0C. Oral rehydration solution (WHO formulation) 1.5 liters consumed. Bowel cramps subsiding."
                    }
                },
                {
                    "sessionId": "SESSION_15",
                    "sessionNum": 15,
                    "timestamp": "2026-09-04 22:22:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.963,
                    "concordance": 0.951,
                    "anomalyDesc": "No",
                    "rationale": "Day 15 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 65.1 BPM, EDA: 4.46 uS).",
                    "metrics": {
                        "hrBpm": 65.1,
                        "rmssdMs": 42.6,
                        "impedanceRawUs": 4.46,
                        "impedanceDeltaUs": 0.06,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-09-04 22:22:00",
                        "text": "Care Plan Day 15: Gastroenteritis resolution continuing smoothly on Day 15. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_16",
                    "sessionNum": 16,
                    "timestamp": "2026-09-05 21:20:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.966,
                    "concordance": 0.925,
                    "anomalyDesc": "No",
                    "rationale": "Day 16 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 69.2 BPM, EDA: 4.39 uS).",
                    "metrics": {
                        "hrBpm": 69.2,
                        "rmssdMs": 37.7,
                        "impedanceRawUs": 4.39,
                        "impedanceDeltaUs": 0.04,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-05 21:20:00",
                        "text": "Care Plan Day 16: Gastroenteritis resolution continuing smoothly on Day 16. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_17",
                    "sessionNum": 17,
                    "timestamp": "2026-09-06 20:11:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.972,
                    "concordance": 0.931,
                    "anomalyDesc": "No",
                    "rationale": "Day 17 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 66.8 BPM, EDA: 4.60 uS).",
                    "metrics": {
                        "hrBpm": 66.8,
                        "rmssdMs": 37.5,
                        "impedanceRawUs": 4.6,
                        "impedanceDeltaUs": 0.08,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-06 20:11:00",
                        "text": "Care Plan Day 17: Gastroenteritis resolution continuing smoothly on Day 17. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_18",
                    "sessionNum": 18,
                    "timestamp": "2026-09-07 21:26:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.963,
                    "concordance": 0.926,
                    "anomalyDesc": "No",
                    "rationale": "Day 18 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 68.1 BPM, EDA: 4.51 uS).",
                    "metrics": {
                        "hrBpm": 68.1,
                        "rmssdMs": 36.4,
                        "impedanceRawUs": 4.51,
                        "impedanceDeltaUs": 0.05,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-09-07 21:26:00",
                        "text": "Care Plan Day 18: Gastroenteritis resolution continuing smoothly on Day 18. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_19",
                    "sessionNum": 19,
                    "timestamp": "2026-09-08 20:47:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.989,
                    "concordance": 0.914,
                    "anomalyDesc": "No",
                    "rationale": "Day 19 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 70.8 BPM, EDA: 4.42 uS).",
                    "metrics": {
                        "hrBpm": 70.8,
                        "rmssdMs": 38.1,
                        "impedanceRawUs": 4.42,
                        "impedanceDeltaUs": 0.06,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-09-08 20:47:00",
                        "text": "Care Plan Day 19: Gastroenteritis resolution continuing smoothly on Day 19. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_20",
                    "sessionNum": 20,
                    "timestamp": "2026-09-09 22:28:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.974,
                    "concordance": 0.963,
                    "anomalyDesc": "No",
                    "rationale": "Day 20 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 66.1 BPM, EDA: 4.35 uS).",
                    "metrics": {
                        "hrBpm": 66.1,
                        "rmssdMs": 39.8,
                        "impedanceRawUs": 4.35,
                        "impedanceDeltaUs": 0.02,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-09 22:28:00",
                        "text": "Care Plan Day 20: Gastroenteritis resolution continuing smoothly on Day 20. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_21",
                    "sessionNum": 21,
                    "timestamp": "2026-09-10 20:15:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.968,
                    "concordance": 0.92,
                    "anomalyDesc": "No",
                    "rationale": "Day 21 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 67.6 BPM, EDA: 4.54 uS).",
                    "metrics": {
                        "hrBpm": 67.6,
                        "rmssdMs": 39.2,
                        "impedanceRawUs": 4.54,
                        "impedanceDeltaUs": 0.09,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-10 20:15:00",
                        "text": "Care Plan Day 21: Gastroenteritis resolution continuing smoothly on Day 21. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_22",
                    "sessionNum": 22,
                    "timestamp": "2026-09-11 20:45:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "ARTIFACT_REJECTED",
                    "actionTrigger": "REJECT_FALSE_ALARM",
                    "confidence": 0.967,
                    "concordance": 0.928,
                    "anomalyDesc": "Artifact Spill (Suppressed)",
                    "rationale": "Day 22 Telemetry: Accidental electrolyte water cup spill on mattress e-textile. Very high slew rate (32 uS/s) with calm biometrics. Spill artifact rejected.",
                    "metrics": {
                        "hrBpm": 74.4,
                        "rmssdMs": 39.4,
                        "impedanceRawUs": 26.0,
                        "impedanceDeltaUs": 20.5,
                        "impedanceSlew": 25.0,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": true
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-09-11 20:45:00",
                        "text": "Care Plan Day 22: Bedside water spill identified and false alarm suppressed by FSM algorithm. Linens exchanged. Remind patient to use spill-proof hydration tumbler with straw."
                    }
                },
                {
                    "sessionId": "SESSION_23",
                    "sessionNum": 23,
                    "timestamp": "2026-09-12 20:39:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.962,
                    "concordance": 0.929,
                    "anomalyDesc": "No",
                    "rationale": "Day 23 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 68.5 BPM, EDA: 4.50 uS).",
                    "metrics": {
                        "hrBpm": 68.5,
                        "rmssdMs": 41.0,
                        "impedanceRawUs": 4.5,
                        "impedanceDeltaUs": 0.08,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-09-12 20:39:00",
                        "text": "Care Plan Day 23: Gastroenteritis resolution continuing smoothly on Day 23. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_24",
                    "sessionNum": 24,
                    "timestamp": "2026-09-13 21:31:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.965,
                    "concordance": 0.917,
                    "anomalyDesc": "No",
                    "rationale": "Day 24 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 65.2 BPM, EDA: 4.45 uS).",
                    "metrics": {
                        "hrBpm": 65.2,
                        "rmssdMs": 42.8,
                        "impedanceRawUs": 4.45,
                        "impedanceDeltaUs": 0.07,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-13 21:31:00",
                        "text": "Care Plan Day 24: Gastroenteritis resolution continuing smoothly on Day 24. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_25",
                    "sessionNum": 25,
                    "timestamp": "2026-09-14 20:30:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.981,
                    "concordance": 0.907,
                    "anomalyDesc": "No",
                    "rationale": "Day 25 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 69.1 BPM, EDA: 4.54 uS).",
                    "metrics": {
                        "hrBpm": 69.1,
                        "rmssdMs": 42.3,
                        "impedanceRawUs": 4.54,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-14 20:30:00",
                        "text": "Care Plan Day 25: Gastroenteritis resolution continuing smoothly on Day 25. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_26",
                    "sessionNum": 26,
                    "timestamp": "2026-09-15 22:40:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.987,
                    "concordance": 0.908,
                    "anomalyDesc": "No",
                    "rationale": "Day 26 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 66.4 BPM, EDA: 4.51 uS).",
                    "metrics": {
                        "hrBpm": 66.4,
                        "rmssdMs": 42.1,
                        "impedanceRawUs": 4.51,
                        "impedanceDeltaUs": 0.1,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-09-15 22:40:00",
                        "text": "Care Plan Day 26: Gastroenteritis resolution continuing smoothly on Day 26. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_27",
                    "sessionNum": 27,
                    "timestamp": "2026-09-16 20:17:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.976,
                    "concordance": 0.912,
                    "anomalyDesc": "No",
                    "rationale": "Day 27 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 65.0 BPM, EDA: 4.58 uS).",
                    "metrics": {
                        "hrBpm": 65.0,
                        "rmssdMs": 38.4,
                        "impedanceRawUs": 4.58,
                        "impedanceDeltaUs": 0.1,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Charge Nurse Linda Croft, RN",
                        "timestamp": "2026-09-16 20:17:00",
                        "text": "Care Plan Day 27: Gastroenteritis resolution continuing smoothly on Day 27. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_28",
                    "sessionNum": 28,
                    "timestamp": "2026-09-17 20:38:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.972,
                    "concordance": 0.954,
                    "anomalyDesc": "No",
                    "rationale": "Day 28 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 68.0 BPM, EDA: 4.57 uS).",
                    "metrics": {
                        "hrBpm": 68.0,
                        "rmssdMs": 37.8,
                        "impedanceRawUs": 4.57,
                        "impedanceDeltaUs": 0.03,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Sarah Smith, MD (Attending Physician)",
                        "timestamp": "2026-09-17 20:38:00",
                        "text": "Care Plan Day 28: Gastroenteritis resolution continuing smoothly on Day 28. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_29",
                    "sessionNum": 29,
                    "timestamp": "2026-09-18 21:46:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.968,
                    "concordance": 0.955,
                    "anomalyDesc": "No",
                    "rationale": "Day 29 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 69.5 BPM, EDA: 4.53 uS).",
                    "metrics": {
                        "hrBpm": 69.5,
                        "rmssdMs": 36.6,
                        "impedanceRawUs": 4.53,
                        "impedanceDeltaUs": 0.04,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Emily Chen, MD (Gastroenterology)",
                        "timestamp": "2026-09-18 21:46:00",
                        "text": "Care Plan Day 29: Gastroenteritis resolution continuing smoothly on Day 29. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                },
                {
                    "sessionId": "SESSION_30",
                    "sessionNum": 30,
                    "timestamp": "2026-09-19 22:17:00",
                    "patientId": "PATIENT_AAL_0150",
                    "name": "AAL Patient 0150 (Robert Sterling)",
                    "bedId": "BED_ZETA_06",
                    "dob": "19640519",
                    "age": 62,
                    "gender": "Male",
                    "fsmState": "BASELINE",
                    "actionTrigger": "LOG_TELEMETRY",
                    "confidence": 0.981,
                    "concordance": 0.902,
                    "anomalyDesc": "No",
                    "rationale": "Day 30 Telemetry: Normal gastrointestinal recovery trajectory. Enteric sounds calm, biometrics within normal limits (HR: 70.7 BPM, EDA: 4.41 uS).",
                    "metrics": {
                        "hrBpm": 70.7,
                        "rmssdMs": 41.0,
                        "impedanceRawUs": 4.41,
                        "impedanceDeltaUs": 0.02,
                        "impedanceSlew": 0.08,
                        "actigraphyRmsG": 0.016,
                        "shivering": false,
                        "macroShift": false,
                        "acousticEnergy": 0.0003,
                        "acousticBurst": false,
                        "diaphoresis": false,
                        "fluidSpill": false
                    },
                    "advice": {
                        "doctor": "Dr. Rajesh Patel, PharmD",
                        "timestamp": "2026-09-19 22:17:00",
                        "text": "Care Plan Day 30: Gastroenteritis resolution continuing smoothly on Day 30. Stool frequency normalized. Patient tolerating BRAT diet (bananas, rice, applesauce, toast). Laboratory panel unremarkable."
                    }
                }
            ]
        }
    ]
  };

  // DOM Cache
  const views = {
    landing: document.getElementById('view-landing'),
    doctorPortal: document.getElementById('view-doctor-portal'),
    patientPortal: document.getElementById('view-patient-portal')
  };

  const userStatus = document.getElementById('user-status');
  const userDisplayName = document.getElementById('user-display-name');
  const btnLogout = document.getElementById('btn-logout');

  // Bind Event Listeners for All Triggers
  const triggers = [
    { id: 'btn-header-doctor-login', fn: openDoctorLogin },
    { id: 'btn-header-patient-login', fn: openPatientLogin },
    { id: 'card-doctor-role', fn: openDoctorLogin },
    { id: 'btn-open-doctor-login', fn: openDoctorLogin },
    { id: 'card-patient-role', fn: openPatientLogin },
    { id: 'btn-open-patient-login', fn: openPatientLogin },
    { id: 'link-forgot-pass', fn: openForgotPass }
  ];

  triggers.forEach(t => {
    const el = document.getElementById(t.id);
    if (el) {
      el.addEventListener('click', (e) => {
        if (e.preventDefault) e.preventDefault();
        t.fn(e);
      });
    }
  });

  // Modal Close Buttons & Overlay Backdrop Click
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (e.stopPropagation) e.stopPropagation();
      closeAllModals();
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeAllModals();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  // Doctor Login Form Submission
  const formDoctorLogin = document.getElementById('form-doctor-login');
  if (formDoctorLogin) {
    formDoctorLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('doc-email').value.trim() || 'dr.smith@telemed-aal.org';
      state.currentUserRole = 'doctor';
      state.currentDoctorEmail = email;
      
      closeAllModals();
      showDoctorPortal(email);
    });
  }

  // Patient Login Form Submission
  const formPatientLogin = document.getElementById('form-patient-login');
  if (formPatientLogin) {
    formPatientLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('patient-name').value.trim() || 'AAL Patient 0042';
      state.currentUserRole = 'patient';
      state.currentPatientId = 'PATIENT_AAL_0042';
      
      closeAllModals();
      showPatientPortal(name);
    });
  }

  // Forgot Password Form Submission
  const formForgotPass = document.getElementById('form-forgot-pass');
  if (formForgotPass) {
    formForgotPass.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Secure password reset instructions sent to your email.');
      closeAllModals();
    });
  }

  // Logout Handler
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      state.currentUserRole = null;
      state.currentDoctorEmail = null;
      state.currentPatientId = null;
      
      views.doctorPortal.classList.add('hidden');
      views.patientPortal.classList.add('hidden');
      views.landing.classList.remove('hidden');
      userStatus.classList.add('hidden');
      btnLogout.classList.add('hidden');
      
      const headerActions = document.getElementById('header-login-actions');
      if (headerActions) headerActions.classList.remove('hidden');
    });
  }

  // Doctor Portal Tab Switching
  document.querySelectorAll('#view-doctor-portal .nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#view-doctor-portal .nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetId = tab.getAttribute('data-tab');
      document.querySelectorAll('#view-doctor-portal .tab-content').forEach(c => c.classList.add('hidden'));
      document.getElementById(targetId).classList.remove('hidden');

      if (targetId === 'doc-tab-telemetry') {
        renderWaveforms();
        renderTelemetryLogs();
      } else if (targetId === 'doc-tab-advice') {
        populateAdvicePatientSelect();
        renderAdviceHistory();
      }
    });
  });

  // Patient Portal Tab Switching
  document.querySelectorAll('#view-patient-portal .nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#view-patient-portal .nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetId = tab.getAttribute('data-tab');
      document.querySelectorAll('#view-patient-portal .tab-content').forEach(c => c.classList.add('hidden'));
      document.getElementById(targetId).classList.remove('hidden');
    });
  });

  // Show Doctor Portal View
  function showDoctorPortal(email) {
    views.landing.classList.add('hidden');
    views.patientPortal.classList.add('hidden');
    views.doctorPortal.classList.remove('hidden');

    userDisplayName.textContent = `Dr. ${email.split('@')[0]} (Attending Physician)`;
    userStatus.classList.remove('hidden');
    btnLogout.classList.remove('hidden');
    
    const headerActions = document.getElementById('header-login-actions');
    if (headerActions) headerActions.classList.add('hidden');

    renderPatientsGrid();
    populateAdvicePatientSelect();
    renderWaveforms();
    renderTelemetryLogs();
  }

  // Show Patient Portal View
  function showPatientPortal(name) {
    views.landing.classList.add('hidden');
    views.doctorPortal.classList.add('hidden');
    views.patientPortal.classList.remove('hidden');

    userDisplayName.textContent = `${name} (Patient Portal)`;
    userStatus.classList.remove('hidden');
    btnLogout.classList.remove('hidden');
    
    const headerActions = document.getElementById('header-login-actions');
    if (headerActions) headerActions.classList.add('hidden');

    renderPatientPortalData();
  }

  // Render Doctor Dashboard 1: All Patients Grid
  function renderPatientsGrid() {
    const container = document.getElementById('patients-cards-container');
    if (!container) return;
    container.innerHTML = '';
    
    const countEl = document.getElementById('cohort-count');
    if (countEl) countEl.textContent = `${state.patients.length} Monitored Beds`;

    state.patients.forEach(p => {
      const card = document.createElement('div');
      card.className = 'patient-card';
      
      let badgeClass = 'badge-baseline';
      if (p.fsmState.includes('SURGE')) badgeClass = 'badge-surge';
      else if (p.fsmState.includes('WARNING')) badgeClass = 'badge-warning';
      else if (p.fsmState.includes('ACTIVE_EMESIS') || p.fsmState.includes('EMESIS')) badgeClass = 'badge-danger';
      else if (p.fsmState.includes('ARTIFACT')) badgeClass = 'badge-artifact';
      else if (p.metrics && p.metrics.shivering) badgeClass = 'badge-warning';

      card.innerHTML = `
        <div class="patient-card-header">
          <div>
            <div class="patient-name">${p.name}</div>
            <div class="patient-bed">${p.bedId} | Age ${p.age} ${p.gender}</div>
          </div>
          <span class="badge ${badgeClass}">${p.fsmState}</span>
        </div>

        <div style="font-size: 0.85rem; margin-bottom: 0.85rem; background: rgba(0,0,0,0.2); padding: 0.65rem; border-radius: var(--radius-sm);">
          <strong>Action Trigger:</strong> <span style="color: var(--primary-cyan);">${p.actionTrigger}</span><br>
          <strong>Clinical Anomaly:</strong> ${p.anomalyDesc}<br>
          <strong>Concordance:</strong> ${(p.concordance * 100).toFixed(1)}% | <strong>Confidence:</strong> ${(p.confidence * 100).toFixed(1)}%
        </div>

        <div class="metrics-mini-grid">
          <div class="metric-box">
            <div class="metric-box-title">cECG (HR)</div>
            <div class="metric-box-val" style="color: var(--primary-cyan);">${p.metrics.hrBpm.toFixed(1)} <span style="font-size: 0.7rem;">BPM</span></div>
          </div>
          <div class="metric-box">
            <div class="metric-box-title">RMSSD</div>
            <div class="metric-box-val" style="color: var(--accent-purple);">${p.metrics.rmssdMs.toFixed(1)} <span style="font-size: 0.7rem;">ms</span></div>
          </div>
          <div class="metric-box">
            <div class="metric-box-title">EDA (Skin)</div>
            <div class="metric-box-val" style="color: var(--status-warning);">${p.metrics.impedanceRawUs.toFixed(1)} <span style="font-size: 0.7rem;">uS</span></div>
          </div>
          <div class="metric-box">
            <div class="metric-box-title">Actigraphy</div>
            <div class="metric-box-val" style="color: var(--status-normal);">${p.metrics.actigraphyRmsG.toFixed(3)} <span style="font-size: 0.7rem;">g</span></div>
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
          <button class="btn btn-secondary btn-inspect" style="flex: 1; font-size: 0.8rem; padding: 0.4rem;" data-id="${p.id}">Inspect Oscilloscope &amp; HL7 →</button>
        </div>
      `;

      card.querySelector('.btn-inspect').addEventListener('click', (e) => {
        e.stopPropagation();
        state.selectedPatientId = p.id;
        state.selectedSessionIdx = undefined;
        
        // Switch to Tab 2
        document.querySelectorAll('#view-doctor-portal .nav-tab').forEach(t => t.classList.remove('active'));
        const tab2 = document.querySelector('#view-doctor-portal .nav-tab[data-tab="doc-tab-telemetry"]');
        if (tab2) tab2.classList.add('active');

        document.querySelectorAll('#view-doctor-portal .tab-content').forEach(c => c.classList.add('hidden'));
        const content2 = document.getElementById('doc-tab-telemetry');
        if (content2) content2.classList.remove('hidden');

        renderWaveforms();
        renderTelemetryLogs();
      });

      container.appendChild(card);
    });
  }

  // Populate Advice Patient Selection Dropdown
  function populateAdvicePatientSelect() {
    const select = document.getElementById('select-advice-patient');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '';

    state.patients.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.bedId} - Current State: ${p.fsmState})`;
      select.appendChild(opt);
    });

    if (currentVal && state.patients.some(p => p.id === currentVal)) {
      select.value = currentVal;
    } else if (state.selectedPatientId) {
      select.value = state.selectedPatientId;
    } else if (state.patients[0]) {
      select.value = state.patients[0].id;
    }

    select.onchange = () => {
      renderAdviceHistory();
    };

    renderAdviceHistory();
  }

  // Dispatch Physician Advice Form Submission
  const formAdvice = document.getElementById('form-dispatch-advice');
  if (formAdvice) {
    formAdvice.addEventListener('submit', (e) => {
      e.preventDefault();
      const patientId = document.getElementById('select-advice-patient').value;
      const text = document.getElementById('input-advice-text').value.trim();
      
      const p = state.patients.find(item => item.id === patientId);
      if (p) {
        p.adviceHistory.unshift({
          doctor: state.currentDoctorEmail || 'Dr. Smith, MD (Attending Physician)',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          text: text
        });
        alert(`Physician advice successfully dispatched to ${p.name}!`);
        document.getElementById('input-advice-text').value = '';
        renderAdviceHistory();
        renderPatientPortalData();
      }
    });
  }

  // Render Doctor Advice History for the Targeted Patient
  function renderAdviceHistory() {
    const container = document.getElementById('advice-history-items');
    if (!container) return;
    container.innerHTML = '';

    const select = document.getElementById('select-advice-patient');
    const targetPatientId = select && select.value ? select.value : (state.selectedPatientId || (state.patients[0] && state.patients[0].id));
    
    const targetPatient = state.patients.find(p => p.id === targetPatientId) || state.patients[0];
    if (!targetPatient) return;

    // Update heading to reflect the targeted patient
    const heading = document.querySelector('.advice-history-list h3');
    if (heading) {
      heading.textContent = `Dispatched Advice Log History (${targetPatient.name} - ${targetPatient.bedId})`;
    }

    const patientAdvice = targetPatient.adviceHistory || [];

    if (patientAdvice.length === 0) {
      container.innerHTML = `<div style="color: var(--text-dim); font-size: 0.88rem; padding: 1.25rem; background: rgba(0,0,0,0.25); border-radius: 8px;">No clinical advice dispatched for ${targetPatient.name} yet.</div>`;
      return;
    }

    patientAdvice.forEach(item => {
      const el = document.createElement('div');
      el.className = 'advice-item-card';
      el.innerHTML = `
        <div class="advice-item-meta">
          <span><strong>Target:</strong> ${targetPatient.name} (${targetPatient.bedId}) | <strong>Sender:</strong> ${item.doctor}</span>
          <span>${item.timestamp}</span>
        </div>
        <div style="font-size: 0.9rem; color: #f1f5f9;">${item.text}</div>
      `;
      container.appendChild(el);
    });
  }

  // Render Patient Portal Data
  function renderPatientPortalData() {
    const p = state.patients.find(item => item.id === state.currentPatientId) || state.patients[0];

    const bedEl = document.getElementById('patient-my-bed');
    if (bedEl) bedEl.textContent = p.bedId;
    
    const statusEl = document.getElementById('patient-my-status');
    if (statusEl) statusEl.textContent = p.fsmState;
    
    const hrEl = document.getElementById('patient-val-hr');
    if (hrEl) hrEl.textContent = `${p.metrics.hrBpm.toFixed(1)} BPM (RMSSD: ${p.metrics.rmssdMs.toFixed(1)} ms)`;
    
    const impEl = document.getElementById('patient-val-imp');
    if (impEl) impEl.textContent = `${p.metrics.impedanceRawUs.toFixed(2)} uS (Delta: ${p.metrics.impedanceDeltaUs >= 0 ? '+' : ''}${p.metrics.impedanceDeltaUs.toFixed(2)} uS)`;
    
    const accEl = document.getElementById('patient-val-acc');
    if (accEl) accEl.textContent = `${p.metrics.actigraphyRmsG.toFixed(3)} g (Shivering: ${p.metrics.shivering})`;
    
    const audEl = document.getElementById('patient-val-aud');
    if (audEl) audEl.textContent = `${p.metrics.acousticEnergy.toFixed(5)} V² (Retch Burst: ${p.metrics.acousticBurst})`;

    // Render 30 Daily Telemetry Logs Timeline in Patient Portal
    const eventsContainer = document.getElementById('patient-events-history');
    if (eventsContainer) {
      if (p.sessions && p.sessions.length > 0) {
        eventsContainer.innerHTML = p.sessions.slice().reverse().map(s => `=== DAILY TELEMEDICINE MONITORING LOG [${s.sessionId} - ${s.timestamp}] ===
Patient ID: ${s.patientId} | Bed ID: ${s.bedId}
FSM State:  ${s.fsmState} | Trigger: ${s.actionTrigger}
Biometrics: HR: ${s.metrics.hrBpm.toFixed(1)} BPM | EDA: ${s.metrics.impedanceRawUs.toFixed(2)} uS | Actigraphy: ${s.metrics.actigraphyRmsG.toFixed(3)} g | Audio STE: ${s.metrics.acousticEnergy.toFixed(5)} V²
Clinical Note: ${s.rationale}
--------------------------------------------------------------------------------`).join('\n\n');
      } else {
        eventsContainer.innerHTML = `=== DAILY TELEMEDICINE MONITORING LOG ===
Patient ID: ${p.id} | Bed ID: ${p.bedId}
FSM State:  ${p.fsmState} | Trigger: ${p.actionTrigger}
Biometrics: HR: ${p.metrics.hrBpm.toFixed(1)} BPM | EDA: ${p.metrics.impedanceRawUs.toFixed(2)} uS
Clinical Note: ${p.rationale}`;
      }
    }

    // Render Received Advice in Patient Portal
    const rxAdviceContainer = document.getElementById('patient-received-advice-container');
    if (rxAdviceContainer) {
      rxAdviceContainer.innerHTML = '';
      if (p.adviceHistory.length === 0) {
        rxAdviceContainer.innerHTML = '<div style="color: var(--text-dim); font-size: 0.9rem;">No active doctor directives issued today. Continue normal bed rest.</div>';
      } else {
        p.adviceHistory.forEach(adv => {
          const item = document.createElement('div');
          item.style.cssText = 'background: rgba(0,0,0,0.3); border-left: 3px solid var(--primary-cyan); padding: 0.85rem 1rem; margin-bottom: 0.75rem; border-radius: 0 8px 8px 0;';
          item.innerHTML = `
            <div style="font-size: 0.78rem; color: var(--primary-cyan); margin-bottom: 0.35rem;">
              <strong>${adv.doctor}</strong> — ${adv.timestamp}
            </div>
            <div style="font-size: 0.9rem; color: #fff;">${adv.text}</div>
          `;
          rxAdviceContainer.appendChild(item);
        });
      }
    }
  }

  // Populate Active Patient Selector in Doctor Dashboard 2
  function populateDoctorPatientSelect() {
    const select = document.getElementById('selected-patient-badge');
    if (!select || select.tagName !== 'SELECT') return;

    const currentId = state.selectedPatientId || (state.patients[0] && state.patients[0].id);

    select.innerHTML = '';
    state.patients.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      const cleanName = p.name.replace(/^AAL Patient \d+\s*/, '').replace(/[()]/g, '').trim() || p.name;
      opt.textContent = `${p.id} (${p.bedId}) — ${cleanName}`;
      if (p.id === currentId) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    select.value = currentId;

    select.onchange = (e) => {
      state.selectedPatientId = e.target.value;
      state.selectedSessionIdx = undefined;
      renderTelemetryLogs();
      renderWaveforms();
      renderPatientsGrid();
    };
  }

  // Populate Telemetry Session Dropdown in Doctor Dashboard 2
  function populateSessionSelect() {
    const select = document.getElementById('select-telemetry-session');
    if (!select) return;
    const p = state.patients.find(item => item.id === state.selectedPatientId) || state.patients[0];
    if (!p || !p.sessions) return;

    select.innerHTML = '';
    p.sessions.forEach((s, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `Session ${s.sessionNum} (${s.timestamp.split(' ')[0]}) - ${s.fsmState}`;
      if (idx === (state.selectedSessionIdx !== undefined ? state.selectedSessionIdx : p.sessions.length - 1)) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    select.onchange = (e) => {
      state.selectedSessionIdx = parseInt(e.target.value, 10);
      renderTelemetryLogs();
      renderWaveforms();
    };
  }

  // Render Doctor Dashboard 2: Telemetry & HL7 Logs
  function renderTelemetryLogs() {
    populateDoctorPatientSelect();
    populateSessionSelect();
    const p = state.patients.find(item => item.id === state.selectedPatientId) || state.patients[0];
    const s = (p.sessions && p.sessions.length > 0)
      ? p.sessions[state.selectedSessionIdx !== undefined ? state.selectedSessionIdx : p.sessions.length - 1]
      : p;

    const patientSelect = document.getElementById('selected-patient-badge');
    if (patientSelect && patientSelect.tagName === 'SELECT') {
      patientSelect.value = p.id;
    } else if (patientSelect) {
      patientSelect.textContent = `${s.name} (${s.bedId}) - ${s.sessionId}`;
    }

    const labelHr = document.getElementById('label-hr-bpm');
    if (labelHr) labelHr.textContent = `${s.metrics.hrBpm.toFixed(1)} BPM / ${s.metrics.rmssdMs.toFixed(1)} ms`;

    const labelAudio = document.getElementById('label-audio-energy');
    if (labelAudio) labelAudio.textContent = `STE: ${s.metrics.acousticEnergy.toFixed(5)} V²`;

    const labelImp = document.getElementById('label-impedance');
    if (labelImp) labelImp.textContent = `${s.metrics.impedanceRawUs.toFixed(2)} uS (${s.metrics.impedanceDeltaUs >= 0 ? '+' : ''}${s.metrics.impedanceDeltaUs.toFixed(2)} uS)`;

    const labelAcc = document.getElementById('label-actigraphy');
    if (labelAcc) labelAcc.textContent = `${s.metrics.actigraphyRmsG.toFixed(3)} g (${s.metrics.shivering ? 'Shiver' : 'Resting'})`;

    // Render Clinician Telemetry Session Summary Report
    const reportOut = document.getElementById('clinician-report-output');
    if (reportOut) {
      reportOut.innerHTML = `================================================================================
  CLINICIAN TELEMETRY SESSION SUMMARY REPORT (ISO/HL7 27931 COMPLIANT)
================================================================================
PATIENT IDENTIFICATION:
  - Patient ID:       ${p.id}
  - Full Name:        ${p.name}
  - DOB / Age / Sex:  ${p.dob} | ${p.age} Yrs | ${p.gender}
  - Bed ID:           ${p.bedId}
  - Monitoring Status:CONTINUOUS NON-INVASIVE WEARABLE-FREE SMART BED

1. ECG & CARDIAC AUTONOMIC ANALYSIS:
  - Resampled Rate:   250 Hz (Pan-Tompkins QRS Algorithm)
  - Heart Rate:       ${s.metrics.hrBpm.toFixed(1)} BPM [LOINC 8867-4]
  - HRV RMSSD:        ${s.metrics.rmssdMs.toFixed(1)} ms  [LOINC 80404-7]
  - Autonomic State:  ${s.metrics.hrBpm > 90 ? 'ELEVATED SYMPATHETIC TONUS' : 'NORMAL RESTING RHYTHM'}

2. E-TEXTILE SKIN CONDUCTANCE (EDA / DISP):
  - Sampling Rate:    20 Hz
  - Tonic Conductance:${s.metrics.impedanceRawUs.toFixed(2)} uS [LOINC 29280-5]
  - Delta Rise (dG):  ${s.metrics.impedanceDeltaUs >= 0 ? '+' : ''}${s.metrics.impedanceDeltaUs.toFixed(2)} uS
  - Slew Rate:        ${s.metrics.impedanceSlew ? s.metrics.impedanceSlew.toFixed(2) : '0.10'} uS/s
  - Diaphoresis Event:${s.metrics.diaphoresis ? 'CONFIRMED SUDOMOTOR COLD SWEAT' : 'NONE'}

3. PIEZOELECTRIC ACTIGRAPHY & MOTION:
  - Sampling Rate:    50 Hz
  - Movement Vector:  ${s.metrics.actigraphyRmsG.toFixed(3)} g [LOINC 69420-8]
  - Tremor / Shiver:  ${s.metrics.shivering ? 'NOCTURNAL NEUROMUSCULAR SHIVER DETECTED' : 'RESTING POSITION'}

4. PHONOENTEROGRAPHY GASTRIC ACOUSTICS:
  - Sampling Rate:    4,000 Hz
  - Acoustic STE:     ${s.metrics.acousticEnergy.toFixed(5)} V² [LOINC 80001-1]
  - Retching Spike:   ${s.metrics.acousticBurst ? 'ACOUSTIC RETCH BURST CONFIRMED' : 'NORMAL MOTILITY'}

5. HYBRID MOORE-EFSM DIAGNOSTIC INTEGRITY:
  - State Machine Code: [${s.fsmState}] [LOINC 75325-1]
  - Action Trigger:    [${s.actionTrigger}] [LOINC 74213-0]
  - Fusion Confidence: ${(s.confidence * 100).toFixed(1)}% | Concordance: ${(s.concordance * 100).toFixed(1)}%
  - Clinical Summary:  ${s.rationale}
================================================================================`;
    }

    // Render HL7 CDA Release 2 XML Document
    const xmlOut = document.getElementById('hl7-xml-output');
    if (xmlOut) {
      xmlOut.textContent = `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <realmCode code="US"/>
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <templateId root="2.16.840.1.113883.10.20.22.1.1"/>
  <id root="2.16.840.1.113883.19.5" extension="TELEMED-AAL-${Date.now()}"/>
  <code code="34133-9" codeSystem="2.16.840.1.113883.6.1" displayName="Clinical Telemetry Log"/>
  <title>Telemedicine AAL Clinical Telemetry Summary Report</title>
  <effectiveTime value="${new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14)}"/>
  <confidentialityCode code="N" codeSystem="2.16.840.1.113883.5.25"/>
  <recordTarget>
    <patientRole>
      <id root="2.16.840.1.113883.19.5" extension="${p.id}"/>
      <patient>
        <name><given>${p.name}</given></name>
        <administrativeGenderCode code="${p.gender[0]}"/>
        <birthTime value="${p.dob}"/>
      </patient>
    </patientRole>
  </recordTarget>
  <component>
    <structuredBody>
      <component>
        <section>
          <code code="8716-3" codeSystem="2.16.840.1.113883.6.1" displayName="VITAL SIGNS TELEMETRY"/>
          <text>
            State: ${s.fsmState} | Heart Rate: ${s.metrics.hrBpm.toFixed(1)} BPM | EDA: ${s.metrics.impedanceRawUs.toFixed(2)} uS
          </text>
          <entry>
            <observation classCode="OBS" moodCode="EVN">
              <code code="8867-4" displayName="Heart Rate"/>
              <value xsi:type="PQ" value="${s.metrics.hrBpm.toFixed(1)}" unit="bpm"/>
            </observation>
          </entry>
          <entry>
            <observation classCode="OBS" moodCode="EVN">
              <code code="29280-5" displayName="Skin Electrical Conductance"/>
              <value xsi:type="PQ" value="${s.metrics.impedanceRawUs.toFixed(2)}" unit="uS"/>
            </observation>
          </entry>
          <entry>
            <observation classCode="OBS" moodCode="EVN">
              <code code="75325-1" displayName="Symptom Diagnostic Event Status"/>
              <value xsi:type="ST">${s.fsmState}</value>
            </observation>
          </entry>
        </section>
      </component>
    </structuredBody>
  </component>
</ClinicalDocument>`;
    }

    // Render HL7 v2.5 ORU^R01 Stream
    const v2Out = document.getElementById('hl7-v2-output');
    if (v2Out) {
      v2Out.textContent = `MSH|^~\\&|TELEMED_AAL|BEDSIDE_HUB|CLINICAL_PORTAL|HOSPITAL_SYS|${new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14)}||ORU^R01|MSG${Date.now()}|P|2.5
PID|1||${p.id}^^^TELEMED||${p.name.split(' ')[1] || p.name}^${p.name.split(' ')[0]}||${p.dob}|${p.gender[0]}
OBR|1||LOG${Date.now()}|34133-9^Clinical Telemetry Log^LN|||${new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14)}
OBX|1|NM|8867-4^Heart Rate^LN||${s.metrics.hrBpm.toFixed(1)}|bpm||||F
OBX|2|NM|29280-5^Skin Conductance^LN||${s.metrics.impedanceRawUs.toFixed(2)}|uS||||F
OBX|3|ST|75325-1^FSM Diagnostic State^LN||${s.fsmState}|||||F
OBX|4|ST|74213-0^Clinical Action Trigger^LN||${s.actionTrigger}|||||F`;
    }
  }

  // Live Oscilloscope Waveform Animation Canvas Engine
  let animId = null;
  function renderWaveforms() {
    if (animId) cancelAnimationFrame(animId);

    const canvasEcg = document.getElementById('canvas-ecg');
    const canvasAudio = document.getElementById('canvas-audio');
    const canvasImp = document.getElementById('canvas-impedance');
    const canvasAcc = document.getElementById('canvas-actigraphy');

    if (!canvasEcg || !canvasAudio || !canvasImp || !canvasAcc) return;

    let t = 0;
    function animate() {
      t += 0.05;
      const p = state.patients.find(item => item.id === state.selectedPatientId) || state.patients[0];
      const s = (p.sessions && p.sessions.length > 0)
        ? p.sessions[state.selectedSessionIdx !== undefined ? state.selectedSessionIdx : p.sessions.length - 1]
        : p;

      // 1. cECG Waveform (P-QRS-T synth)
      drawCanvasWaveform(canvasEcg, '#00f2fe', (x) => {
        const period = (250 / (s.metrics.hrBpm / 60));
        const phase = (x + t * 40) % period;
        if (phase > 20 && phase < 35) return Math.sin((phase - 20) / 15 * Math.PI) * 1.5; // QRS Peak
        if (phase > 45 && phase < 65) return Math.sin((phase - 45) / 20 * Math.PI) * 0.3; // T wave
        return (Math.random() - 0.5) * 0.05;
      });

      // 2. Audio Waveform
      drawCanvasWaveform(canvasAudio, '#e100ff', (x) => {
        const noise = (Math.random() - 0.5) * (s.metrics.acousticBurst ? 0.8 : 0.15);
        const burst = s.metrics.acousticBurst ? Math.sin(x * 0.1 + t * 5) * 0.5 : 0;
        return noise + burst;
      });

      // 3. Impedance Waveform
      drawCanvasWaveform(canvasImp, '#ffab00', (x) => {
        const base = (s.metrics.impedanceRawUs / 20);
        const delta = Math.sin(x * 0.02 + t) * (s.metrics.impedanceDeltaUs / 15);
        return base + delta;
      });

      // 4. Actigraphy Waveform
      drawCanvasWaveform(canvasAcc, '#00e676', (x) => {
        const shiver = s.metrics.shivering ? Math.sin(x * 0.3 + t * 10) * 0.6 : 0;
        const motion = (Math.random() - 0.5) * s.metrics.actigraphyRmsG * 3;
        return shiver + motion;
      });

      animId = requestAnimationFrame(animate);
    }

    animate();
  }

  function drawCanvasWaveform(canvas, color, signalFn) {
    const ctx = canvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fillRect(0, 0, w, h);

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw Signal Line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.beginPath();

    for (let x = 0; x < w; x++) {
      const y = (h / 2) - (signalFn(x) * (h / 3));
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Doctor Portal Physiology Scenario Simulator
  document.querySelectorAll('.sim-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sim-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeScenario = btn.getAttribute('data-scenario');
    });
  });

  // Check Now Button: Injects selected scenario specifically into PATIENT_AAL_0000 (Random Dummy)
  const btnCheckNow = document.getElementById('btn-sim-check-now');
  if (btnCheckNow) {
    btnCheckNow.addEventListener('click', () => {
      const scenario = state.activeScenario || 'baseline';
      let p = state.patients.find(item => item.id === 'PATIENT_AAL_0000');
      if (!p) p = state.patients[0];

      if (scenario === 'baseline') {
        p.fsmState = 'BASELINE';
        p.actionTrigger = 'LOG_TELEMETRY';
        p.confidence = 0.990;
        p.concordance = 0.985;
        p.anomalyDesc = 'Resting Sleep Baseline';
        p.metrics.hrBpm = 65.0;
        p.metrics.rmssdMs = 35.0;
        p.metrics.impedanceRawUs = 4.2;
        p.metrics.impedanceDeltaUs = 0.0;
        p.metrics.impedanceSlew = 0.05;
        p.metrics.actigraphyRmsG = 0.010;
        p.metrics.shivering = false;
        p.metrics.macroShift = false;
        p.metrics.diaphoresis = false;
        p.metrics.acousticBurst = false;
        p.metrics.fluidSpill = false;
        p.rationale = 'Stable resting sleep baseline state. All biometric parameters within non-pathological thresholds.';
      } else if (scenario === 'sweat') {
        p.fsmState = 'PARASYMPATHETIC_SURGE';
        p.actionTrigger = 'TURN_ON_FAN_AC';
        p.confidence = 0.965;
        p.concordance = 0.920;
        p.anomalyDesc = 'Sudomotor Cold Sweat Diaphoresis';
        p.metrics.hrBpm = 95.0;
        p.metrics.rmssdMs = 75.0;
        p.metrics.impedanceRawUs = 16.5;
        p.metrics.impedanceDeltaUs = 10.5;
        p.metrics.impedanceSlew = 1.80;
        p.metrics.actigraphyRmsG = 0.038;
        p.metrics.shivering = false;
        p.metrics.macroShift = false;
        p.metrics.diaphoresis = true;
        p.metrics.acousticBurst = false;
        p.metrics.fluidSpill = false;
        p.rationale = 'Sudomotor cold sweat diaphoresis detected (+10.5 uS physiological rise). Turning ON Fan/AC to provide cooling comfort.';
      } else if (scenario === 'shiver') {
        p.fsmState = 'BASELINE';
        p.actionTrigger = 'TURN_OFF_FAN_AC';
        p.confidence = 0.945;
        p.concordance = 0.890;
        p.anomalyDesc = 'Nocturnal Somatic Tremor / Shiver';
        p.metrics.hrBpm = 78.0;
        p.metrics.rmssdMs = 42.0;
        p.metrics.impedanceRawUs = 4.1;
        p.metrics.impedanceDeltaUs = 0.1;
        p.metrics.impedanceSlew = 0.05;
        p.metrics.actigraphyRmsG = 0.085;
        p.metrics.shivering = true;
        p.metrics.macroShift = false;
        p.metrics.diaphoresis = false;
        p.metrics.acousticBurst = false;
        p.metrics.fluidSpill = false;
        p.rationale = 'Neuromuscular shivering detected (0.085g). Turning OFF Fan/AC to prevent hypothermia.';
      } else if (scenario === 'spill') {
        p.fsmState = 'ARTIFACT_DISCARD';
        p.actionTrigger = 'SUPPRESS_ALARM_ARTIFACT';
        p.confidence = 0.890;
        p.concordance = 0.120;
        p.anomalyDesc = 'Conductive Fluid Spill on Bed Textile';
        p.metrics.hrBpm = 72.0;
        p.metrics.rmssdMs = 36.0;
        p.metrics.impedanceRawUs = 19.5;
        p.metrics.impedanceDeltaUs = 14.5;
        p.metrics.impedanceSlew = 25.0;
        p.metrics.actigraphyRmsG = 0.015;
        p.metrics.shivering = false;
        p.metrics.macroShift = false;
        p.metrics.diaphoresis = false;
        p.metrics.acousticBurst = false;
        p.metrics.fluidSpill = true;
        p.rationale = 'Accidental fluid spill detected on bed textile (dG = +14.5 uS, Slew = 25.0 uS/s). Suppressing false alarm.';
      } else if (scenario === 'shift') {
        p.fsmState = 'ARTIFACT_DISCARD';
        p.actionTrigger = 'SUPPRESS_ALARM_ARTIFACT';
        p.confidence = 0.920;
        p.concordance = 0.110;
        p.anomalyDesc = 'Gross Biomechanical Bed Repositioning';
        p.metrics.hrBpm = 84.0;
        p.metrics.rmssdMs = 42.0;
        p.metrics.impedanceRawUs = 5.0;
        p.metrics.impedanceDeltaUs = 0.2;
        p.metrics.impedanceSlew = 0.10;
        p.metrics.actigraphyRmsG = 0.450;
        p.metrics.shivering = false;
        p.metrics.macroShift = true;
        p.metrics.diaphoresis = false;
        p.metrics.acousticBurst = false;
        p.metrics.fluidSpill = false;
        p.rationale = 'Large postural movement acceleration (0.450g) without autonomic concordance. Suppressing false alarm.';
      } else if (scenario === 'pre_emesis') {
        p.fsmState = 'PRE_EMESIS_WARNING';
        p.actionTrigger = 'ALERT_NURSE_PRE_EMESIS';
        p.confidence = 0.985;
        p.concordance = 0.960;
        p.anomalyDesc = 'Prodromal Gastrointestinal Emesis Cascade';
        p.metrics.hrBpm = 105.0;
        p.metrics.rmssdMs = 88.0;
        p.metrics.impedanceRawUs = 15.0;
        p.metrics.impedanceDeltaUs = 8.5;
        p.metrics.impedanceSlew = 1.60;
        p.metrics.actigraphyRmsG = 0.082;
        p.metrics.acousticEnergy = 0.0085;
        p.metrics.shivering = false;
        p.metrics.macroShift = false;
        p.metrics.diaphoresis = true;
        p.metrics.acousticBurst = true;
        p.metrics.fluidSpill = false;
        p.rationale = 'PRE-EMESIS CASCADE CONFIRMED! Acoustic retching spikes + cold sweat diaphoresis. Elevating bed 30 deg to prevent pulmonary aspiration; alerting nurse.';
      } else if (scenario === 'emesis') {
        p.fsmState = 'ACTIVE_EMESIS_EVENT';
        p.actionTrigger = 'DISPATCH_RAPID_RESPONSE';
        p.confidence = 0.995;
        p.concordance = 0.990;
        p.anomalyDesc = 'Acute Emesis Crisis & Liquid Saturation';
        p.metrics.hrBpm = 125.0;
        p.metrics.rmssdMs = 95.0;
        p.metrics.impedanceRawUs = 26.0;
        p.metrics.impedanceDeltaUs = 18.0;
        p.metrics.impedanceSlew = 3.50;
        p.metrics.actigraphyRmsG = 0.250;
        p.metrics.acousticEnergy = 0.0250;
        p.metrics.shivering = false;
        p.metrics.macroShift = false;
        p.metrics.diaphoresis = true;
        p.metrics.acousticBurst = true;
        p.metrics.fluidSpill = true;
        p.rationale = 'ACTIVE EMESIS IN PROGRESS! High acoustic retch bursts paired with electrolytic fluid drop. Triggering priority caregiver alert and emergency suction prep.';
      }

      // Append newly simulated session into patient 0000's history
      if (!p.sessions) p.sessions = [];
      const sessionCount = p.sessions.length + 1;
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      p.sessions.push({
        sessionId: `SIM_0000_${sessionCount.toString().padStart(2, '0')}`,
        sessionNum: sessionCount,
        timestamp: nowStr,
        patientId: p.id,
        name: p.name,
        bedId: p.bedId,
        dob: p.dob,
        age: p.age,
        gender: p.gender,
        fsmState: p.fsmState,
        actionTrigger: p.actionTrigger,
        confidence: p.confidence,
        concordance: p.concordance,
        anomalyDesc: p.anomalyDesc,
        rationale: p.rationale,
        metrics: JSON.parse(JSON.stringify(p.metrics)),
        advice: {
          doctor: 'Dr. Smith, MD (Attending Physician)',
          timestamp: nowStr,
          text: `[SIMULATION] Event [${p.fsmState}] injected. Automated FSM action: ${p.actionTrigger}.`
        }
      });

      // Target Patient 0000 and switch to Dashboard 2
      state.selectedPatientId = 'PATIENT_AAL_0000';
      state.selectedSessionIdx = p.sessions.length - 1;

      // Switch to Dashboard 2
      document.querySelectorAll('#view-doctor-portal .nav-tab').forEach(t => t.classList.remove('active'));
      const tab2 = document.querySelector('#view-doctor-portal .nav-tab[data-tab="doc-tab-telemetry"]');
      if (tab2) tab2.classList.add('active');

      document.querySelectorAll('#view-doctor-portal .tab-content').forEach(c => c.classList.add('hidden'));
      const content2 = document.getElementById('doc-tab-telemetry');
      if (content2) content2.classList.remove('hidden');

      renderPatientsGrid();
      renderWaveforms();
      renderTelemetryLogs();
      renderPatientPortalData();

      // Visual feedback on Check Now button
      const originalHtml = btnCheckNow.innerHTML;
      btnCheckNow.innerHTML = '<span>✓ Injected on 0000!</span>';
      btnCheckNow.style.background = 'linear-gradient(135deg, #00e676 0%, #00b0ff 100%)';
      setTimeout(() => {
        btnCheckNow.innerHTML = originalHtml;
        btnCheckNow.style.background = 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)';
      }, 1600);
    });
  }

  // Copy HL7 XML Button Handler
  const btnCopyXml = document.getElementById('btn-copy-cda');
  if (btnCopyXml) {
    btnCopyXml.addEventListener('click', () => {
      const xmlText = document.getElementById('hl7-xml-output').textContent;
      navigator.clipboard.writeText(xmlText).then(() => {
        alert('HL7 CDA Release 2 XML document copied to clipboard!');
      });
    });
  }

  // Refresh Clinician Report Button
  const btnRefreshReport = document.getElementById('btn-refresh-report');
  if (btnRefreshReport) {
    btnRefreshReport.addEventListener('click', () => {
      renderTelemetryLogs();
    });
  }

  renderAdviceHistory();
});
