# Telemedicine Multi-Modal Biomedical DSP & Hybrid Moore-EFSM Framework

An open-source, edge-ready, lightweight Python research prototype and streaming digital signal processing (DSP) pipeline for wearable-free, real-time health monitoring and false-positive-resistant clinical event classification in Ambient Assisted Living (AAL) and Telemedicine.

---

## 1. Project Directory Structure

```
telemedicine/
├── common/                     # Shared DSP filters and Telemetry serializers
│   ├── __init__.py
│   ├── biquad.py              # Direct Form II Transposed Biquad & SOS IIR filters
│   ├── telemetry.py           # HL7 CDA R2 XML, HL7 v2 ORU^R01, ISO-8601 JSON, MQTT & REST stubs
│   └── test_telemetry.py      # Unit tests for HL7 Clinical Documentation logging
│
├── cecg/                       # Capacitive ECG (cECG) - 250 Hz
│   ├── __init__.py
│   ├── spec.py                # Trinary {-1, 0, 1} clinical ranges (40-130 BPM, RMSSD 10-150 ms)
│   ├── dsp.py                 # 0.5-40 Hz Butterworth Bandpass & Pan-Tompkins QRS R-Peak detector
│   ├── generator.py           # Multi-Gaussian P-Q-R-S-T synthetic generator
│   ├── interactive_tester.py  # Standalone CLI interactive test bench for cECG
│   └── test_cecg.py           # Unit tests
│
├── actigraphy/                 # Piezoelectric Actigraphy - 50 Hz
│   ├── __init__.py
│   ├── spec.py                # Trinary {-1, 0, 1} clinical ranges (0.002 - 0.130 g)
│   ├── dsp.py                 # Vector magnitude, 1-15 Hz bandpass & 3-6 Hz clonic shivering analyzer
│   ├── generator.py           # 3-axis accelerometer synthesizer (respiratory sway, shivering, macro shift)
│   ├── interactive_tester.py  # Standalone CLI interactive test bench for Actigraphy
│   └── test_actigraphy.py     # Unit tests
│
├── impedance/                  # E-Textile Impedance / EDA - 20 Hz
│   ├── __init__.py
│   ├── spec.py                # Trinary {-1, 0, 1} clinical ranges (1.0 - 50.0 uS)
│   ├── dsp.py                 # EMA tonic baseline, delta-G & slew rate differentiator (Spill vs Sweat)
│   ├── generator.py           # Phasic skin conductance & step spill synthesizer
│   ├── interactive_tester.py  # Standalone CLI interactive test bench for Impedance
│   └── test_impedance.py      # Unit tests
│
├── audio/                      # Acoustic Phonoenterography - 4000 Hz
│   ├── __init__.py
│   ├── spec.py                # Trinary {-1, 0, 1} clinical ranges (0.00001 - 0.08000 V²)
│   ├── dsp.py                 # 100-2000 Hz bandpass, Short-Time Energy & Epigastric Retch Burst detector
│   ├── generator.py           # Enteric murmur, ambient noise, and resonant retching synthesizer
│   ├── interactive_tester.py  # Standalone CLI interactive test bench for Audio
│   └── test_audio.py          # Unit tests
│
├── multimodal/                 # Multi-Modal 4-Category Classifier (TP / TN / FP / FN)
│   ├── __init__.py
│   ├── types.py               # Enums for TP/TN/FP/FN & Ground Truth Clinical Labels
│   ├── classifier.py          # Master 4-sensor data fusion evaluator
│   ├── metrics.py             # 2x2 Confusion Matrix tracker (Sensitivity, Specificity, FAR, F1)
│   ├── benchmark.py           # Automated 15-case clinical benchmark suite
│   ├── interactive_tester.py  # Standalone CLI interactive test bench with Ground Truth selection
│   └── test_multimodal.py     # Unit tests
│
├── fsm/                        # Hybrid Moore-EFSM Clinical Verification Engine (Strict TP / TN Output)
│   ├── __init__.py
│   ├── types.py               # Strict BinaryOutcome (TRUE_POSITIVE / TRUE_NEGATIVE) & FSM Reports
│   ├── arbitrator.py          # Quadratic cross-modal concordance arbitrator & artifact suppressor
│   ├── engine.py              # Extended Timed Statechart / Hybrid Moore-EFSM engine
│   ├── interactive_tester.py  # Standalone CLI interactive test bench with transition traces
│   └── test_fsm.py            # Unit tests verifying strict binary outcome convergence
│
├── fusion.py                   # 4x4 Cross-Modal Fusion Matrix & Micro-Diagnostic FSM Engine
├── interactive_tester.py       # Master 4-Sensor Tuple {-1, 0, 1} Test Bench & 81-Permutation Evaluator
├── main.py                     # 60-Second Real-Time End-to-End Simulation
└── README.md                   # System documentation
```

---

## 2. Multi-Modal Ground Truth & Strict Binary Outcome Table

| Ground Truth Condition | Expected 4-Sensor Tuple `(cECG, Audio, Actigraphy, Impedance)` | Moore FSM State & Action Trigger | Strict Binary FSM Output |
| :--- | :--- | :--- | :---: |
| **`NORMAL_BASELINE`** | `(0, 0, -1, 0)` or `(0, 0, 0, 0)` | `BASELINE` -> `LOG_TELEMETRY` | **`TRUE_NEGATIVE`** |
| **`ARTIFACT_SPILL`** | `(0, -1, -1, 1)` + step jump | `ARTIFACT_REJECTED` -> `SUPPRESS_ALERT_LOG_ARTIFACT` | **`TRUE_NEGATIVE`** |
| **`ARTIFACT_POSTURAL_SHIFT`** | `(0, -1, 1, 0)` + macro roll | `ARTIFACT_REJECTED` -> `SUPPRESS_ALERT_LOG_ARTIFACT` | **`TRUE_NEGATIVE`** |
| **`SUDOMOTOR_DIAPHORESIS`** | `(0, 0, -1, 1)` ($\Delta G \ge 4\mu\text{S}$) | `PARASYMPATHETIC_SURGE` -> `TURN_ON_FAN_AC` | **`TRUE_POSITIVE`** |
| **`NOCTURNAL_SHIVERING`** | `(0, 0, 1, 0)` (4.2 Hz tremor) | `BASELINE` -> `TURN_OFF_FAN_AC` | **`TRUE_POSITIVE`** |
| **`AUTONOMIC_VAGAL_SURGE`** | `(1, 0, 0, 1)` (RMSSD > 65ms) | `PARASYMPATHETIC_SURGE` -> `TURN_ON_FAN_AC` | **`TRUE_POSITIVE`** |
| **`PRE_EMESIS`** | `(1, 1, 0, 1)` or `(1, 1, 1, 1)` | `PRE_EMESIS_WARNING` -> `BED_ELEVATE_30DEG_ALERT_STAFF` | **`TRUE_POSITIVE`** |
| **`ACTIVE_EMESIS`** | `(1, 1, 1, 1)` + violent motion | `ACTIVE_EMESIS_EVENT` -> `EMERGENCY_ALARM_SUCTION_READY` | **`TRUE_POSITIVE`** |

---

## 3. How to Run

### 1. Run Automated Random Testcase Across All 4 Databases (Database -> DSP -> Multimodal -> FSM -> HL7 Telemetry)
```bash
python randtestcase.py
# Or in PowerShell:
.\randtestcase.ps1
# Or in CMD:
randtestcase.bat
```

### 2. Run the FSM Binary Outcome Interactive Tester
```bash
python fsm/interactive_tester.py
```

### 3. Run the Multi-Modal 4-Category Tester
```bash
python multimodal/interactive_tester.py
```

### 4. Run Standalone Modality Interactive Testers
```bash
python cecg/interactive_tester.py
python actigraphy/interactive_tester.py
python impedance/interactive_tester.py
python audio/interactive_tester.py
```

### 5. Run Root Multi-Modal 4-Sensor Tuple Tester & 81 Permutations
```bash
python interactive_tester.py
```

### 6. Run Full Unit Test Suite (33 Tests)
```bash
python -m unittest discover -s . -p "test_*.py"
```
