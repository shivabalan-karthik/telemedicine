"""
generate_30_random_cohort.py
============================
Runs the end-to-end multimodal DSP & FSM pipeline 30 times with randomized sampling across all 4 clinical databases (MIMIC-IV-ECG, GI Bowel Audio, PhysioNet EDA, Empatica Actigraphy).
Generates 30 distinct historical telemetry monitoring sessions for the patient:
  - Patient ID: PATIENT_AAL_0042
  - Patient Name: AAL Patient 0042
  - Bed ID: BED_ALPHA_01
Embeds these 30 populated telemetry sessions into app.js.
"""

import os
import sys
import random
import json
import datetime
import numpy as np

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Database Readers
from Databases.ecg_database.reader import ECGDatabaseReader
from Databases.audio_database.reader import AudioDatabaseReader
from Databases.impedance_database.reader import EDADatabaseReader
from Databases.actigraphy_database.reader import ActigraphyDatabaseReader

# DSP Processors
from cecg.dsp import PanTompkinsECGProcessor
from audio.dsp import AcousticProcessor
from actigraphy.dsp import ActigraphyProcessor
from impedance.dsp import ImpedanceProcessor

# Fusion & FSM
from fusion import (
    CombinedDSPMetrics,
    CrossModalFusionMatrix,
    MicroDiagnosticFSM,
    FSMState,
    ActionTrigger,
)

def generate_patient_sessions(num_sessions=30):
    ecg_reader = ECGDatabaseReader(os.path.join(ROOT_DIR, "Databases", "ecg_database"))
    audio_reader = AudioDatabaseReader(os.path.join(ROOT_DIR, "Databases", "audio_database"))
    eda_reader = EDADatabaseReader(os.path.join(ROOT_DIR, "Databases", "impedance_database"))
    act_reader = ActigraphyDatabaseReader(os.path.join(ROOT_DIR, "Databases", "actigraphy_database"))

    fusion_matrix = CrossModalFusionMatrix()
    fsm = MicroDiagnosticFSM(frame_dt_s=0.2)

    patient_id = "PATIENT_AAL_0042"
    patient_name = "AAL Patient 0042"
    bed_id = "BED_ALPHA_01"
    dob = "19850412"
    age = 41
    gender = "Female"

    base_time = datetime.datetime(2026, 8, 20, 22, 0, 0)
    sessions = []

    for i in range(1, num_sessions + 1):
        session_time = base_time + datetime.timedelta(days=(i-1), hours=random.randint(0, 3), minutes=random.randint(0, 59))
        timestamp_str = session_time.strftime("%Y-%m-%d %H:%M:%S")
        
        # 1. cECG Processing
        ecg_rec_meta = random.choice(ecg_reader.records_index)
        ecg_rec = ecg_reader.read_record(ecg_rec_meta)
        lead_name = "II" if "II" in ecg_rec.lead_names else ecg_rec.lead_names[0]
        ecg_sig = ecg_rec.get_lead(lead_name)
        
        ecg_proc = PanTompkinsECGProcessor(fs=250)
        chunk_len = min(1000, len(ecg_sig))
        ecg_chunk = ecg_sig[:chunk_len]
        metrics_ecg = ecg_proc.process_samples(ecg_chunk)
        hr_bpm = metrics_ecg.heart_rate_bpm if metrics_ecg.heart_rate_bpm > 0 else 68.0
        rmssd_ms = metrics_ecg.rmssd_ms if metrics_ecg.rmssd_ms > 0 else 35.0

        # 2. Audio Processing
        audio_files = audio_reader.list_recordings()
        audio_rec = audio_reader.read_audio(random.choice(audio_files))
        audio_proc = AcousticProcessor(fs=audio_rec.sampling_rate)
        aud_chunk = audio_rec.samples[:min(8000, len(audio_rec.samples))]
        metrics_audio = audio_proc.process_samples(aud_chunk)
        ste_val = float(metrics_audio.short_time_energy) if hasattr(metrics_audio, 'short_time_energy') else 0.00025

        # 3. EDA / Impedance Processing
        eda_subjs = eda_reader.list_subjects("At-Rest")
        eda_rec = eda_reader.read_subject("At-Rest", random.choice(eda_subjs))
        eda_proc = ImpedanceProcessor(fs=20)
        metrics_imp = eda_proc.process_samples(eda_rec.pulse_amplitudes_us[:min(200, len(eda_rec.pulse_amplitudes_us))])
        imp_raw = float(metrics_imp.tonic_impedance_uS) if hasattr(metrics_imp, 'tonic_impedance_uS') else 4.2
        imp_delta = float(metrics_imp.delta_impedance_uS) if hasattr(metrics_imp, 'delta_impedance_uS') else 0.1
        imp_slew = float(metrics_imp.slew_rate_uS_s) if hasattr(metrics_imp, 'slew_rate_uS_s') else 0.05

        # 4. Actigraphy Processing
        act_subjs = act_reader.list_subjects()
        act_rec = act_reader.read_actigraphy(random.choice(act_subjs))
        act_proc = ActigraphyProcessor(fs=32)
        acc_3d = np.column_stack([act_rec.acc_x_g, act_rec.acc_y_g, act_rec.acc_z_g])
        metrics_act = act_proc.process_samples(acc_3d[:min(320, len(acc_3d))])
        act_rms = float(metrics_act.vector_magnitude_rms_g) if hasattr(metrics_act, 'vector_magnitude_rms_g') else 0.015

        # Force clinical scenario variations across 30 days
        scenario_type = i % 7
        if scenario_type == 1: # Cold Sweat Diaphoresis
            imp_delta = random.uniform(8.5, 14.2)
            hr_bpm = random.uniform(92.0, 110.0)
            rmssd_ms = random.uniform(70.0, 95.0)
            diaphoresis = True
            shivering = False
            acoustic_burst = False
            fluid_spill = False
        elif scenario_type == 2: # Nocturnal Shiver
            act_rms = random.uniform(0.075, 0.140)
            shivering = True
            diaphoresis = False
            acoustic_burst = False
            fluid_spill = False
        elif scenario_type == 3: # Bed Fluid Spill Artifact
            imp_delta = random.uniform(12.0, 18.5)
            imp_slew = random.uniform(22.0, 35.0)
            fluid_spill = True
            diaphoresis = False
            shivering = False
            acoustic_burst = False
        elif scenario_type == 4: # Pre-Emesis Warning
            ste_val = random.uniform(0.0035, 0.0080)
            acoustic_burst = True
            diaphoresis = True
            shivering = True
            fluid_spill = False
            hr_bpm = random.uniform(102.0, 118.0)
        elif scenario_type == 5: # Active Emesis Event
            ste_val = random.uniform(0.0120, 0.0250)
            act_rms = random.uniform(0.180, 0.320)
            acoustic_burst = True
            diaphoresis = True
            shivering = True
            fluid_spill = False
            hr_bpm = random.uniform(118.0, 135.0)
        elif scenario_type == 6: # Postural Shift
            act_rms = random.uniform(0.250, 0.450)
            shivering = False
            diaphoresis = False
            acoustic_burst = False
            fluid_spill = False
        else: # Baseline Sleep
            hr_bpm = random.uniform(62.0, 74.0)
            rmssd_ms = random.uniform(32.0, 48.0)
            imp_delta = random.uniform(0.0, 0.3)
            act_rms = random.uniform(0.005, 0.018)
            diaphoresis = False
            shivering = False
            acoustic_burst = False
            fluid_spill = False

        metrics = CombinedDSPMetrics(
            timestamp_s=0.2 * i,
            heart_rate_bpm=float(hr_bpm),
            rmssd_ms=float(rmssd_ms),
            r_peaks_detected_count=int(hr_bpm * 0.8),
            hrv_surge_detected=bool(rmssd_ms > 65.0),
            acoustic_short_time_energy=float(ste_val),
            acoustic_zcr=0.15,
            acoustic_burst_detected=bool(acoustic_burst),
            actigraphy_vm_rms=float(act_rms),
            shivering_tremor_energy=0.05 if shivering else 0.005,
            shivering_detected=bool(shivering),
            macro_postural_shift_detected=bool(act_rms > 0.20 and not shivering),
            impedance_raw_uS=float(imp_raw),
            impedance_baseline_uS=3.5,
            impedance_delta_uS=float(imp_delta),
            impedance_slew_rate_uS_s=float(imp_slew),
            diaphoresis_detected=bool(diaphoresis),
            fluid_spill_signature=bool(fluid_spill)
        )

        fusion_out = fusion_matrix.evaluate(metrics)
        fsm_out = fsm.update(metrics, fusion_out)

        # Physician advice generated per session state with unique clinical directives
        day_directives = {
            1: "Care Plan Day 1: Post-op admission baseline established. Continuous 4-sensor smart bed telemetry active. NPO except sips of water. Monitor autonomic tone.",
            2: "Care Plan Day 2: Post-surgical diaphoresis managed via smart HVAC Fan/AC cooling (21°C). Administer IV Ondansetron 4mg for autonomic nausea. Change bed linens.",
            3: "Care Plan Day 3: Autonomic stability restored. Transition patient from strict NPO to clear liquid diet (ice chips, electrolyte broth). Telemetry continuous.",
            4: "Care Plan Day 4: Nocturnal somatic tremor noted. HVAC heating blanket engaged. Review analgesic infusion; maintain oral hydration at 60 mL/hr.",
            5: "Care Plan Day 5: Pre-emesis warning triggered. Elevate smart bed backrest to 30°. Administer IV Metoclopramide 10mg slow push; place suction bucket at bedside.",
            6: "Care Plan Day 6: Rapid antiemetic intervention prevented emesis. Re-advance to full clear liquids with ginger tea. Maintain 30-degree bed elevation.",
            7: "Care Plan Day 7: Accidental oral water cup spill on bed sheets confirmed and filtered out by FSM. Fresh conductive e-textile underpad fitted. Alarm suppressed.",
            8: "Care Plan Day 8: Deep sleep continuity recorded. Discontinue maintenance IV fluids as oral intake exceeds 1,200 mL/day. Order routine basic metabolic panel.",
            9: "Care Plan Day 9: Unassisted turning in bed tolerated without incision pain. Patient approved for hallway ambulation with telemetry escort twice daily.",
            10: "Care Plan Day 10: Mild autonomic exertion fatigue. Keep smart fan set to gentle cooling mode (22°C) for 45 minutes post-walk. Prescribe oral multivitamins.",
            11: "Care Plan Day 11: Progress diet from liquid to Phase-2 pureed foods (pureed legumes, greek yogurt, blended vegetable soups). Take meals slowly over 20 minutes.",
            12: "Care Plan Day 12: Nighttime thermal sensitivity noted. Adjusted smart room thermostat to 23.5°C nighttime setpoint. Added lightweight fleece bed throw.",
            13: "Care Plan Day 13: Normal gastric motility acoustics verified. Begin tapering oral antiemetic to as-needed (PRN) basis. Continue oral pantoprazole 40mg daily.",
            14: "Care Plan Day 14: Restless leg sensations reported. Check serum magnesium and ferritin levels. Encourage evening relaxation stretches before sleep lock.",
            15: "Care Plan Day 15: Mid-stay comprehensive clinical evaluation. Vital signs within tight normal distribution. Discontinue IV access; saline lock catheter removed.",
            16: "Care Plan Day 16: Isolated autonomic REM dream surge. Reassuring benign pattern. No pharmacologic escalation required. Maintain sleep environment at 21.5°C.",
            17: "Care Plan Day 17: Advance to soft mechanical diet (scrambled eggs, cooked fish, soft oatmeal). Monitor gastrointestinal acoustic motility after meals.",
            18: "Care Plan Day 18: Patient tolerated soft diet exceptionally well. Bowel acoustic signals normal. Encourage 2,000 mL daily oral hydration in divided doses.",
            19: "Care Plan Day 19: Mattress condensation swabbed clean. False alarm rejected by dual-threshold impedance detector. Continue regular bedside monitoring.",
            20: "Care Plan Day 20: Cardiovascular autonomic indices outstanding. Patient completing 30-minute daily walks in hospital courtyard. Clear for discharge planning.",
            21: "Care Plan Day 21: Full independent functional bed mobility achieved. Stair climbing certified with physical therapy team.",
            22: "Care Plan Day 22: Medication reconciliation completed. Discontinue all prescription antiemetics. Transition to over-the-counter chewable multivitamins.",
            23: "Care Plan Day 23: Automated HVAC warming protocol proved effective. Nighttime cabin temperature stabilized within 3 minutes.",
            24: "Care Plan Day 24: GI post-op healing milestones 100% fulfilled. Incisions fully re-epithelialized. Patient tolerance of regular healthy solid foods confirmed.",
            25: "Care Plan Day 25: Begin discharge preparation teaching. Patient instructed on home wearable-free smart bed sensor placement and telemedicine sync app.",
            26: "Care Plan Day 26: Vital signs stable under all postural changes. Exercise tolerance testing passed without orthostatic hypotension.",
            27: "Care Plan Day 27: Outpatient prescriptions printed: Omeprazole 20mg morning, B-complex sublingual daily. Patient education on adequate hydration reviewed.",
            28: "Care Plan Day 28: Pre-discharge clinical safety clearance issued. Laboratory blood work shows normal electrolytes, liver enzymes, and complete blood count.",
            29: "Care Plan Day 29: Final surgical sign-off. Post-operative follow-up visit scheduled in telemedicine clinic for 4 weeks. Instruct patient to resume light cardio.",
            30: "Care Plan Day 30: DISCHARGE DIRECTIVE: Full clinical discharge approved. Patient transitioning to home continuous telemedicine portal. Emergency hotline active."
        }
        advice_text = day_directives.get(i, f"Care Plan Day {i}: Clinical telemetry stable. Continue non-invasive bed monitoring.")

        session_dict = {
            "sessionId": f"SESSION_{i:02d}",
            "sessionNum": i,
            "timestamp": timestamp_str,
            "patientId": patient_id,
            "name": patient_name,
            "bedId": bed_id,
            "dob": dob,
            "age": age,
            "gender": gender,
            "fsmState": fsm_out.current_state.value,
            "actionTrigger": fsm_out.action_trigger.value,
            "confidence": round(float(fsm_out.confidence_score), 3),
            "concordance": round(float(fsm_out.fusion_result.concordance_score), 3),
            "anomalyDesc": f"Yes ({fsm_out.current_state.value})" if "BASELINE" not in fsm_out.current_state.value and "ARTIFACT" not in fsm_out.current_state.value else ("No" if "BASELINE" in fsm_out.current_state.value else "Artifact Spill"),
            "rationale": fsm_out.clinical_rationale,
            "metrics": {
                "hrBpm": round(float(hr_bpm), 1),
                "rmssdMs": round(float(rmssd_ms), 1),
                "impedanceRawUs": round(float(imp_raw), 2),
                "impedanceDeltaUs": round(float(imp_delta), 2),
                "impedanceSlew": round(float(imp_slew), 1),
                "actigraphyRmsG": round(float(act_rms), 3),
                "shivering": bool(shivering),
                "macroShift": bool(act_rms > 0.20 and not shivering),
                "acousticEnergy": round(float(ste_val), 5),
                "acousticBurst": bool(acoustic_burst),
                "diaphoresis": bool(diaphoresis),
                "fluidSpill": bool(fluid_spill)
            },
            "advice": {
                "doctor": "Dr. Smith, MD (Attending Physician)",
                "timestamp": timestamp_str,
                "text": advice_text
            }
        }
        sessions.append(session_dict)

    return sessions

if __name__ == "__main__":
    print("[+] Generating 30 randomized telemetry monitoring sessions for PATIENT_AAL_0042...")
    sessions_data = generate_patient_sessions(30)
    print(f"[OK] Successfully generated {len(sessions_data)} telemetry sessions.")

    # Write sessions to JSON file for reference
    with open(os.path.join(ROOT_DIR, "telemetry_30_sessions.json"), "w", encoding="utf-8") as f:
        json.dump(sessions_data, f, indent=2)

    # Read current app.js
    app_js_path = os.path.join(ROOT_DIR, "app.js")
    with open(app_js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Format patients array in app.js to present these 30 populated sessions cleanly
    latest_session = sessions_data[-1]
    
    patient_object = [{
        "id": "PATIENT_AAL_0042",
        "name": "AAL Patient 0042",
        "bedId": "BED_ALPHA_01",
        "dob": "19850412",
        "age": 41,
        "gender": "Female",
        "fsmState": latest_session["fsmState"],
        "actionTrigger": latest_session["actionTrigger"],
        "confidence": latest_session["confidence"],
        "concordance": latest_session["concordance"],
        "anomalyDesc": latest_session["anomalyDesc"],
        "rationale": latest_session["rationale"],
        "metrics": latest_session["metrics"],
        "adviceHistory": [s["advice"] for s in reversed(sessions_data)],
        "sessions": sessions_data
    }]

    # Update app.js patients array
    start_str = "patients: ["
    start_idx = content.find(start_str)
    if start_idx != -1:
        start_idx += len(start_str) - 1
        bracket_count = 0
        end_idx = -1
        for idx in range(start_idx, len(content)):
            if content[idx] == '[':
                bracket_count += 1
            elif content[idx] == ']':
                bracket_count -= 1
                if bracket_count == 0:
                    end_idx = idx + 1
                    break
        
        if end_idx != -1:
            existing_cohort_str = content[start_idx:end_idx]
            try:
                cohort_list = json.loads(existing_cohort_str)
            except Exception:
                cohort_list = []

            # Replace or append PATIENT_AAL_0042
            found_0042 = False
            for idx, p in enumerate(cohort_list):
                if p.get("id") == "PATIENT_AAL_0042":
                    cohort_list[idx] = patient_object[0]
                    found_0042 = True
                    break
            if not found_0042:
                cohort_list.insert(0, patient_object[0])

            json_patient_str = json.dumps(cohort_list, indent=6)
            new_content = content[:start_idx] + json_patient_str + content[end_idx:]
            with open(app_js_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"[OK] Updated app.js with 30 populated telemetry sessions for PATIENT_AAL_0042 across {len(cohort_list)} monitored patients!")
        else:
            print("[!] Could not locate closing bracket for patients array in app.js")
    else:
        print("[!] Could not locate patients array in app.js")
