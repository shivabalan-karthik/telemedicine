"""
run_multimodal_database_pipeline.py
===================================
End-to-End Multimodal Clinical Pipeline Runner:
1. Draws randomized real-world data from each of the 4 clinical databases:
   - cECG Database (MIMIC-IV-ECG 12-Lead WFDB format)
   - Audio Database (Gastrointestinal Phonoenterography WAV recordings)
   - Impedance Database (PhysioNet Electrodermal Activity Pulses)
   - Actigraphy Database (Empatica E4 3-Axis Accelerometer Traces)
2. Runs each through its dedicated DSP Subsystem:
   - cecg/dsp.py (Pan-Tompkins QRS detector + HRV RMSSD analyzer)
   - audio/dsp.py (Butterworth Biquad + Short-Time Energy + ZCR)
   - actigraphy/dsp.py (Vector Magnitude RMS + Tremor / Shiver detector)
   - impedance/dsp.py (EMA tonic baseline + Phasic delta + Slew-rate discriminator)
3. Evaluates through Multimodal 4x4 Cross-Modal Decision Fusion Matrix.
4. Steps through Micro-Diagnostic Finite-State Machine (FSM).
5. Dispatches formatted ISO-8601 JSON Edge Telemetry with clinical rationale.
"""

from __future__ import annotations
import os
import sys
import random
import time
import numpy as np
from scipy import signal

# Ensure local imports work cleanly
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
    MultiModalDSPPipeline,
    FSMState,
    ArtifactType,
    ActionTrigger,
)

# Telemetry
from common.telemetry import TelemetryFormatter


def print_header(title: str) -> None:
    print("\n" + "=" * 95)
    print(f"  {title}")
    print("=" * 95)


def run_ecg_subsystem():
    print_header("PHASE 1: cECG DATABASE -> cECG DSP -> MULTIMODAL FUSION -> FSM")
    ecg_reader = ECGDatabaseReader(os.path.join(ROOT_DIR, "Databases", "ecg_database"))
    records = ecg_reader.records_index
    if not records:
        print("[!] No ECG records found.")
        return None

    # Pick a random ECG record
    chosen_meta = random.choice(records)
    rec = ecg_reader.read_record(chosen_meta)
    print(f"[>] Selected Record: Study ID {rec.study_id} (Patient {rec.subject_id})")
    print(f"    Available Leads: {', '.join(rec.lead_names)} | Duration: {rec.duration_sec:.1f}s | Fs: {rec.sampling_rate} Hz")

    lead_name = "II" if "II" in rec.lead_names else rec.lead_names[0]
    lead_sig = rec.get_lead(lead_name)
    print(f"[>] Extracting Lead '{lead_name}' ({len(lead_sig)} raw samples)")

    # Resample 500 Hz -> 250 Hz for PanTompkins processor
    target_fs = 250
    num_target = int(len(lead_sig) * (target_fs / rec.sampling_rate))
    resampled_ecg = signal.resample(lead_sig, num_target)

    # Stream through PanTompkins processor in 0.2s chunks (50 samples @ 250 Hz)
    processor = PanTompkinsECGProcessor(fs=target_fs)
    fusion = CrossModalFusionMatrix()
    fsm = MicroDiagnosticFSM(frame_dt_s=0.2)

    chunk_size = 50  # 0.2s
    num_chunks = min(len(resampled_ecg) // chunk_size, 25)

    print("\n[+] Streaming chunks through cECG DSP -> Multimodal Fusion -> FSM:")
    print(f"{'Chunk':<7} | {'Time (s)':<10} | {'HR (BPM)':<10} | {'RMSSD (ms)':<12} | {'Vagal Surge':<13} | {'FSM State':<22} | {'Confidence'}")
    print("-" * 95)

    for i in range(num_chunks):
        chunk = resampled_ecg[i * chunk_size : (i + 1) * chunk_size]
        t_s = (i + 1) * 0.2
        ecg_m = processor.process_samples(chunk, timestamp_s=t_s)

        # Package combined metrics (other modalities nominal baseline)
        comb_m = CombinedDSPMetrics(
            timestamp_s=t_s,
            heart_rate_bpm=ecg_m.heart_rate_bpm,
            rmssd_ms=ecg_m.rmssd_ms,
            r_peaks_detected_count=ecg_m.r_peaks_detected_count,
            hrv_surge_detected=ecg_m.hrv_surge_detected,
            acoustic_short_time_energy=0.0001,
            acoustic_zcr=0.05,
            acoustic_burst_detected=False,
            actigraphy_vm_rms=0.008,
            shivering_tremor_energy=0.001,
            shivering_detected=False,
            macro_postural_shift_detected=False,
            impedance_raw_uS=3.5,
            impedance_baseline_uS=3.5,
            impedance_delta_uS=0.0,
            impedance_slew_rate_uS_s=0.0,
            diaphoresis_detected=False,
            fluid_spill_signature=False,
        )

        fres = fusion.evaluate(comb_m)
        diag = fsm.update(comb_m, fres)

        if i % 3 == 0 or i == num_chunks - 1 or ecg_m.r_peaks_detected_count > 0:
            vagal_str = "YES (SURGE)" if ecg_m.hrv_surge_detected else "NO"
            print(f"#{i+1:<6} | {t_s:<10.1f} | {ecg_m.heart_rate_bpm:<10.1f} | {ecg_m.rmssd_ms:<12.1f} | {vagal_str:<13} | {diag.current_state.value:<22} | {diag.confidence_score*100:.1f}%")

    print(f"\n[OK] cECG Subsystem execution complete: Final State = {fsm.current_state.value}")
    return resampled_ecg


def run_audio_subsystem():
    print_header("PHASE 2: AUDIO DATABASE -> ACOUSTIC DSP -> MULTIMODAL FUSION -> FSM")
    audio_reader = AudioDatabaseReader(os.path.join(ROOT_DIR, "Databases", "audio_database"))
    recordings = audio_reader.list_recordings()
    if not recordings:
        print("[!] No Audio recordings found.")
        return None

    chosen_wav = random.choice(recordings)
    rec = audio_reader.read_audio(chosen_wav)
    print(f"[>] Selected Audio Recording: {rec.filename}")
    print(f"    Duration: {rec.duration_sec:.1f}s ({rec.duration_sec/60.0:.2f} min) | Fs: {rec.sampling_rate} Hz | RMS: {np.sqrt(np.mean(rec.samples**2)):.4f}")

    # Resample 48000 Hz -> 4000 Hz
    target_fs = 4000
    downsample_factor = 12  # 48000 / 12 = 4000
    resampled_audio = rec.samples[::downsample_factor]

    # Process 5 seconds (25 frames of 0.2s = 800 samples each)
    processor = AcousticProcessor(fs=target_fs)
    fusion = CrossModalFusionMatrix()
    fsm = MicroDiagnosticFSM(frame_dt_s=0.2)

    chunk_size = 800  # 0.2s @ 4000 Hz
    num_chunks = min(len(resampled_audio) // chunk_size, 25)

    print("\n[+] Streaming chunks through Acoustic DSP -> Multimodal Fusion -> FSM:")
    print(f"{'Chunk':<7} | {'Time (s)':<10} | {'Short-Time Energy':<19} | {'ZCR':<10} | {'Burst Detected':<16} | {'FSM State':<22}")
    print("-" * 95)

    for i in range(num_chunks):
        chunk = resampled_audio[i * chunk_size : (i + 1) * chunk_size]
        t_s = (i + 1) * 0.2
        aud_m = processor.process_samples(chunk, timestamp_s=t_s)

        comb_m = CombinedDSPMetrics(
            timestamp_s=t_s,
            heart_rate_bpm=68.0,
            rmssd_ms=32.0,
            r_peaks_detected_count=0,
            hrv_surge_detected=False,
            acoustic_short_time_energy=aud_m.acoustic_short_time_energy,
            acoustic_zcr=aud_m.acoustic_zcr,
            acoustic_burst_detected=aud_m.acoustic_burst_detected,
            actigraphy_vm_rms=0.007,
            shivering_tremor_energy=0.001,
            shivering_detected=False,
            macro_postural_shift_detected=False,
            impedance_raw_uS=3.5,
            impedance_baseline_uS=3.5,
            impedance_delta_uS=0.0,
            impedance_slew_rate_uS_s=0.0,
            diaphoresis_detected=False,
            fluid_spill_signature=False,
        )

        fres = fusion.evaluate(comb_m)
        diag = fsm.update(comb_m, fres)

        if i % 3 == 0 or i == num_chunks - 1 or aud_m.acoustic_burst_detected:
            burst_str = "YES (BURST)" if aud_m.acoustic_burst_detected else "NO"
            print(f"#{i+1:<6} | {t_s:<10.1f} | {aud_m.acoustic_short_time_energy:<19.6f} | {aud_m.acoustic_zcr:<10.4f} | {burst_str:<16} | {diag.current_state.value:<22}")

    print(f"\n[OK] Audio Subsystem execution complete: Final State = {fsm.current_state.value}")
    return resampled_audio


def run_impedance_subsystem():
    print_header("PHASE 3: IMPEDANCE DATABASE -> EDA DSP -> MULTIMODAL FUSION -> FSM")
    eda_reader = EDADatabaseReader(os.path.join(ROOT_DIR, "Databases", "impedance_database"))
    cohort = random.choice(eda_reader.COHORTS)
    subjects = eda_reader.list_subjects(cohort)
    chosen_sub = random.choice(subjects)

    rec = eda_reader.read_subject(cohort, chosen_sub)
    print(f"[>] Selected Cohort: {cohort} | Subject #{rec.subject_id:02d}")
    print(f"    Total Pulses: {rec.total_pulses} | Duration: {rec.duration_s:.1f}s | Mean Amp: {rec.pulse_amplitudes_us.mean():.4f} uS")

    # Synthesize continuous 20 Hz conductance stream from pulse times & amplitudes
    fs = 20
    duration_s = 5.0  # 5 second simulation window
    total_samples = int(duration_s * fs)
    time_arr = np.linspace(0, duration_s, total_samples)

    # Tonic baseline ~ 4.0 uS + decay pulses
    baseline = 4.0
    conductance = np.full(total_samples, baseline)

    # Inject physiological sudomotor pulse if subject has pulses
    if len(rec.pulse_amplitudes_us) > 0:
        amp = float(rec.pulse_amplitudes_us[0]) * 10.0  # scaled microSiemens
        pulse_peak_idx = int(1.5 * fs)
        for idx in range(pulse_peak_idx, total_samples):
            dt = (idx - pulse_peak_idx) / float(fs)
            conductance[idx] += amp * np.exp(-dt / 2.0)

    processor = ImpedanceProcessor(fs=fs)
    fusion = CrossModalFusionMatrix()
    fsm = MicroDiagnosticFSM(frame_dt_s=0.2)

    chunk_size = 4  # 0.2s @ 20 Hz = 4 samples
    num_chunks = len(conductance) // chunk_size

    print("\n[+] Streaming chunks through Impedance DSP -> Multimodal Fusion -> FSM:")
    print(f"{'Chunk':<7} | {'Time (s)':<10} | {'Conductance (uS)':<18} | {'Delta (uS)':<12} | {'Slew Rate (uS/s)':<18} | {'Diaphoresis':<13} | {'FSM State':<22}")
    print("-" * 105)

    for i in range(num_chunks):
        chunk = conductance[i * chunk_size : (i + 1) * chunk_size]
        t_s = (i + 1) * 0.2
        imp_m = processor.process_samples(chunk, timestamp_s=t_s)

        comb_m = CombinedDSPMetrics(
            timestamp_s=t_s,
            heart_rate_bpm=66.0,
            rmssd_ms=28.0,
            r_peaks_detected_count=0,
            hrv_surge_detected=False,
            acoustic_short_time_energy=0.0001,
            acoustic_zcr=0.05,
            acoustic_burst_detected=False,
            actigraphy_vm_rms=0.008,
            shivering_tremor_energy=0.001,
            shivering_detected=False,
            macro_postural_shift_detected=False,
            impedance_raw_uS=imp_m.impedance_raw_uS,
            impedance_baseline_uS=imp_m.impedance_baseline_uS,
            impedance_delta_uS=imp_m.impedance_delta_uS,
            impedance_slew_rate_uS_s=imp_m.impedance_slew_rate_uS_s,
            diaphoresis_detected=imp_m.diaphoresis_detected,
            fluid_spill_signature=imp_m.fluid_spill_signature,
        )

        fres = fusion.evaluate(comb_m)
        diag = fsm.update(comb_m, fres)

        if i % 3 == 0 or i == num_chunks - 1 or imp_m.diaphoresis_detected:
            diaph_str = "DETECTED" if imp_m.diaphoresis_detected else "NO"
            print(f"#{i+1:<6} | {t_s:<10.1f} | {imp_m.impedance_raw_uS:<18.4f} | {imp_m.impedance_delta_uS:<12.4f} | {imp_m.impedance_slew_rate_uS_s:<18.4f} | {diaph_str:<13} | {diag.current_state.value:<22}")

    print(f"\n[OK] Impedance Subsystem execution complete: Final State = {fsm.current_state.value}")
    return conductance


def run_actigraphy_subsystem():
    print_header("PHASE 4: ACTIGRAPHY DATABASE -> PIEZO ACC DSP -> MULTIMODAL FUSION -> FSM")
    acc_reader = ActigraphyDatabaseReader(os.path.join(ROOT_DIR, "Databases", "actigraphy_database"))
    subjects = acc_reader.list_subjects()
    chosen_sub = random.choice(subjects)

    rec = acc_reader.read_actigraphy(chosen_sub)
    print(f"[>] Selected Subject: {rec.subject_id} | Sampling Rate: {rec.sampling_rate} Hz")
    print(f"    Recorded Duration: {rec.duration_sec:.1f}s ({rec.duration_sec/60.0:.1f} min) | Total Samples: {rec.num_samples:,}")
    if rec.demographics:
        print(f"    Demographics: Age {rec.demographics.get('Age')}, Gender {rec.demographics.get('Gender')}, Ethnicity: {rec.demographics.get('Ethnic Background')}, Resilience: {rec.demographics.get('CD-RISC')}")

    # Stack 3D accelerometer data [ax, ay, az]
    acc_data = np.stack([rec.acc_x_g, rec.acc_y_g, rec.acc_z_g], axis=1)

    # Resample 32 Hz -> 50 Hz for ActigraphyProcessor
    target_fs = 50
    duration_s = 5.0
    n_in = int(duration_s * rec.sampling_rate)
    n_out = int(duration_s * target_fs)
    acc_slice = acc_data[:n_in]
    resampled_acc = signal.resample(acc_slice, n_out, axis=0)

    processor = ActigraphyProcessor(fs=target_fs)
    fusion = CrossModalFusionMatrix()
    fsm = MicroDiagnosticFSM(frame_dt_s=0.2)

    chunk_size = 10  # 0.2s @ 50 Hz = 10 samples
    num_chunks = len(resampled_acc) // chunk_size

    print("\n[+] Streaming chunks through Actigraphy DSP -> Multimodal Fusion -> FSM:")
    print(f"{'Chunk':<7} | {'Time (s)':<10} | {'VM RMS (g)':<14} | {'Tremor Energy':<16} | {'Shiver':<10} | {'Macro Shift':<13} | {'FSM State':<22}")
    print("-" * 105)

    for i in range(num_chunks):
        chunk = resampled_acc[i * chunk_size : (i + 1) * chunk_size]
        t_s = (i + 1) * 0.2
        acc_m = processor.process_samples(chunk, timestamp_s=t_s)

        comb_m = CombinedDSPMetrics(
            timestamp_s=t_s,
            heart_rate_bpm=65.0,
            rmssd_ms=30.0,
            r_peaks_detected_count=0,
            hrv_surge_detected=False,
            acoustic_short_time_energy=0.0001,
            acoustic_zcr=0.05,
            acoustic_burst_detected=False,
            actigraphy_vm_rms=acc_m.actigraphy_vm_rms,
            shivering_tremor_energy=acc_m.shivering_tremor_energy,
            shivering_detected=acc_m.shivering_detected,
            macro_postural_shift_detected=acc_m.macro_postural_shift_detected,
            impedance_raw_uS=3.5,
            impedance_baseline_uS=3.5,
            impedance_delta_uS=0.0,
            impedance_slew_rate_uS_s=0.0,
            diaphoresis_detected=False,
            fluid_spill_signature=False,
        )

        fres = fusion.evaluate(comb_m)
        diag = fsm.update(comb_m, fres)

        if i % 3 == 0 or i == num_chunks - 1 or acc_m.shivering_detected or acc_m.macro_postural_shift_detected:
            shiver_str = "YES" if acc_m.shivering_detected else "NO"
            shift_str = "YES" if acc_m.macro_postural_shift_detected else "NO"
            print(f"#{i+1:<6} | {t_s:<10.1f} | {acc_m.actigraphy_vm_rms:<14.4f} | {acc_m.shivering_tremor_energy:<16.4f} | {shiver_str:<10} | {shift_str:<13} | {diag.current_state.value:<22}")

    print(f"\n[OK] Actigraphy Subsystem execution complete: Final State = {fsm.current_state.value}")
    return resampled_acc


def run_full_multimodal_live_fusion():
    print_header("PHASE 5: SYNCHRONIZED 4-SENSOR MULTIMODAL STREAM WITH TELEMETRY LOG")
    print("Combining simultaneous patient streams from all 4 databases into the Master Multi-Modal Pipeline...")

    # Load 1 random record from each database
    ecg_reader = ECGDatabaseReader(os.path.join(ROOT_DIR, "Databases", "ecg_database"))
    aud_reader = AudioDatabaseReader(os.path.join(ROOT_DIR, "Databases", "audio_database"))
    imp_reader = EDADatabaseReader(os.path.join(ROOT_DIR, "Databases", "impedance_database"))
    acc_reader = ActigraphyDatabaseReader(os.path.join(ROOT_DIR, "Databases", "actigraphy_database"))

    ecg_rec = ecg_reader.read_record(random.choice(ecg_reader.records_index))
    aud_rec = aud_reader.read_audio(random.choice(aud_reader.list_recordings()))
    imp_cohort = random.choice(imp_reader.COHORTS)
    imp_rec = imp_reader.read_subject(imp_cohort, random.choice(imp_reader.list_subjects(imp_cohort)))
    acc_rec = acc_reader.read_actigraphy(random.choice(acc_reader.list_subjects()))

    print(f"  * cECG Stream:        Patient {ecg_rec.subject_id} (Study {ecg_rec.study_id})")
    print(f"  * Audio Stream:       {aud_rec.filename}")
    print(f"  * Impedance Stream:   Cohort '{imp_cohort}', Subject #{imp_rec.subject_id}")
    print(f"  * Actigraphy Stream:  Subject {acc_rec.subject_id} (Resilience CD-RISC: {acc_rec.demographics.get('CD-RISC') if acc_rec.demographics else 'N/A'})")

    # Resample all 4 to their expected pipeline rates:
    # ECG: 250 Hz, Audio: 4000 Hz, Actigraphy: 50 Hz, Impedance: 20 Hz
    sim_duration_s = 6.0
    frame_dt_s = 0.2
    total_frames = int(sim_duration_s / frame_dt_s)

    # 1. ECG
    ecg_lead = ecg_rec.get_lead("II" if "II" in ecg_rec.lead_names else ecg_rec.lead_names[0])
    ecg_pts = int(sim_duration_s * 250)
    ecg_stream = signal.resample(ecg_lead[:int(sim_duration_s * ecg_rec.sampling_rate)], ecg_pts)

    # 2. Audio
    aud_pts = int(sim_duration_s * 4000)
    aud_stream = signal.resample(aud_rec.samples[:int(sim_duration_s * aud_rec.sampling_rate)], aud_pts)

    # 3. Actigraphy (N, 3)
    acc_3d = np.stack([acc_rec.acc_x_g, acc_rec.acc_y_g, acc_rec.acc_z_g], axis=1)
    acc_pts = int(sim_duration_s * 50)
    acc_stream = signal.resample(acc_3d[:int(sim_duration_s * acc_rec.sampling_rate)], acc_pts, axis=0)

    # 4. Impedance
    imp_pts = int(sim_duration_s * 20)
    imp_base = 3.8
    imp_stream = np.full(imp_pts, imp_base)
    # inject subject's amplitude peak
    if len(imp_rec.pulse_amplitudes_us) > 0:
        amp_scale = float(imp_rec.pulse_amplitudes_us[0]) * 15.0
        peak_idx = int(2.0 * 20)
        for j in range(peak_idx, imp_pts):
            dt = (j - peak_idx) / 20.0
            imp_stream[j] += amp_scale * np.exp(-dt / 1.5)

    # Initialize Master Pipeline, Fusion Matrix, FSM, and Telemetry Formatter
    pipeline = MultiModalDSPPipeline()
    fusion = CrossModalFusionMatrix()
    fsm = MicroDiagnosticFSM(frame_dt_s=frame_dt_s)
    formatter = TelemetryFormatter(
        patient_id=f"PATIENT_{ecg_rec.subject_id}",
        bed_id="SMART_BED_ICU_03"
    )

    print("\n[+] Processing 30 Synchronized Multimodal Frames through Fusion & FSM:")
    print(f"{'Time':<8} | {'HR / RMSSD':<16} | {'Acoustic':<12} | {'Actigraphy':<12} | {'Conductance':<13} | {'Concordance':<13} | {'FSM State':<22} | {'Action Trigger'}")
    print("-" * 125)

    sample_payload = None

    for frame in range(total_frames):
        t_s = (frame + 1) * frame_dt_s

        ecg_chunk = ecg_stream[frame * 50 : (frame + 1) * 50]
        aud_chunk = aud_stream[frame * 800 : (frame + 1) * 800]
        acc_chunk = acc_stream[frame * 10 : (frame + 1) * 10]
        imp_chunk = imp_stream[frame * 4 : (frame + 1) * 4]

        # Process through DSP
        dsp_metrics = pipeline.process_frame_batch(
            ecg_chunk, aud_chunk, acc_chunk, imp_chunk, timestamp_s=t_s
        )

        # 4x4 Cross-Modal Fusion
        fres = fusion.evaluate(dsp_metrics)

        # Step FSM
        diag = fsm.update(dsp_metrics, fres)

        # Format Telemetry
        payload = formatter.format_payload(
            timestamp_s=t_s,
            current_state=diag.current_state.value,
            previous_state=diag.previous_state.value,
            state_duration_s=diag.state_duration_s,
            confidence_score=diag.confidence_score,
            action_trigger=diag.action_trigger.value,
            artifact_type=diag.artifact_type.value,
            clinical_rationale=diag.clinical_rationale,
            concordance_score=diag.fusion_result.concordance_score,
            dsp_metrics=dsp_metrics,
        )

        sample_payload = payload

        if frame % 3 == 0 or frame == total_frames - 1 or diag.action_trigger != ActionTrigger.LOG_TELEMETRY:
            hr_str = f"{dsp_metrics.heart_rate_bpm:.1f}B / {dsp_metrics.rmssd_ms:.1f}ms"
            aud_str = f"{dsp_metrics.acoustic_short_time_energy:.5f}"
            acc_str = f"{dsp_metrics.actigraphy_vm_rms:.3f}g"
            imp_str = f"{dsp_metrics.impedance_raw_uS:.2f}uS (+{dsp_metrics.impedance_delta_uS:.2f})"
            conc_str = f"{fres.concordance_score * 100:.1f}%"
            print(f"t={t_s:4.1f}s  | {hr_str:<16} | {aud_str:<12} | {acc_str:<12} | {imp_str:<13} | {conc_str:<13} | {diag.current_state.value:<22} | {diag.action_trigger.value}")

    print_header("FINAL CLINICAL EDGE TELEMETRY LOG")
    if sample_payload:
        print(sample_payload.format_clinical_log())


def run_pipeline():
    print("\n" + "=" * 95)
    print("  TELEMEDICINE MULTIMODAL REAL-WORLD DATABASE INTEGRATION & AUDIT RUNNER")
    print("  Validating: ECG -> Audio -> Impedance -> Actigraphy -> Multimodal Fusion -> FSM")
    print("=" * 95)

    run_ecg_subsystem()
    run_audio_subsystem()
    run_impedance_subsystem()
    run_actigraphy_subsystem()
    run_full_multimodal_live_fusion()

    print("\n" + "=" * 95)
    print("  [SUCCESS] All 4 databases successfully executed end-to-end through DSP, Multimodal, and FSM!")
    print("=" * 95 + "\n")


if __name__ == "__main__":
    run_pipeline()
