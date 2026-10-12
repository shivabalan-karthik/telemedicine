"""
interactive_tester.py
=====================
Telemedicine Multi-Modal Biomedical DSP & Micro-Diagnostic FSM Test Bench:
  Trinary {-1, 0, 1} 4-Sensor Tuple Interactive Testing with 81-Permutation Logging.

Format:
  `(cECG, Audio, Actigraphy, Impedance)`

Input Level Encoding:
  * `-1` -> LOW: Sub-threshold baseline activity (Bradycardia / Silence / Stillness / Dry)
  * `0`  -> MEDIUM/NORMAL: Healthy resting sleep baseline
  * `1`  -> HIGH: Elevated activity (Vagal Surge / Retch Spikes / Shivering / Sweating)
"""

from __future__ import annotations
import csv
import datetime
import itertools
import json
import os
import sys
import time
from typing import Dict, List, Optional, Tuple

from common.telemetry import TelemetryFormatter, TelemetryPayload
from cecg.spec import CECGLevel, CECG_SPECS
from audio.spec import AudioLevel, AUDIO_SPECS
from actigraphy.spec import ActigraphyLevel, ACTIGRAPHY_SPECS
from impedance.spec import ImpedanceLevel, IMPEDANCE_SPECS

from cecg.generator import CECGSignalGenerator
from audio.generator import AudioSignalGenerator
from actigraphy.generator import ActigraphySignalGenerator
from impedance.generator import ImpedanceSignalGenerator

from fusion import (
    ActionTrigger,
    ArtifactType,
    CrossModalFusionMatrix,
    DiagnosticOutput,
    FSMState,
    MicroDiagnosticFSM,
    MultiModalDSPPipeline,
)


LOGS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
JSONL_LOG_PATH = os.path.join(LOGS_DIR, "permutation_history.jsonl")
CSV_LOG_PATH = os.path.join(LOGS_DIR, "permutation_history.csv")


def clear_and_banner() -> None:
    print("\n" + "=" * 90)
    print("  TELEMEDICINE MULTI-MODAL BIOMEDICAL DSP - TRINARY {-1, 0, 1} 4-SENSOR FRAMEWORK")
    print("  Input Format: (cECG, Audio, Actigraphy, Impedance) using {-1, 0, 1}")
    print("=" * 90)


def print_slot_reference_table() -> None:
    print("\nTrinary {-1, 0, 1} 4-Sensor Slot Mapping:")
    print("-------------------------------------------------------------------------------------------------")
    print("  Slot 1: cECG (Cardiac/Vagal)       | -1: 48 BPM (low)   | 0: 65 BPM (NORMAL)  | 1: 95 BPM (vagal surge)")
    print("  Slot 2: Audio (Gastro/Retch)       | -1: 0.00005 V²     | 0: 0.00035 V²       | 1: 0.02500 V² (retching)")
    print("  Slot 3: Actigraphy [SHIVER/MOTION] | -1: 0.005 g (rest) | 0: 0.010 g (sway)   | 1: 0.095 g (SHIVER)")
    print("  Slot 4: Impedance [SWEAT/SPILL]    | -1: 2.0 uS (dry)   | 0: 3.5 uS (tonic)   | 1: 14.0 uS (SWEATING)")
    print("-------------------------------------------------------------------------------------------------")
    print("\nKey 4-Sensor Tuple Examples in {-1, 0, 1} Encoding:")
    print("  1. Normal Sleep Baseline:          (0, 0, -1, 0)   -> LOG_TELEMETRY (Quiet monitoring)")
    print("  2. Pure SWEATING Detection:        (0, 0, -1, 1)   -> TURN_ON_FAN_AC (Cooling patient)")
    print("  3. Pure SHIVERING Detection:       (0, 0, 1, 0)    -> TURN_OFF_FAN_AC (Prevent hypothermia)")
    print("  4. Accidental Fluid Spill on Bed:  (0, -1, -1, 1)  -> SUPPRESS_ALERT (Artifact Rejected)")
    print("  5. Gross Postural Shift Movement:  (0, -1, 1, 0)   -> SUPPRESS_ALERT (Artifact Rejected)")
    print("  6. Pre-Emesis Warning Cascade:     (1, 1, 1, 1)    -> ELEVATE_BED_30DEG + ALERT_NURSE")
    print("  7. Active Emesis Event:            (1, 1, 1, 1)    -> EMERGENCY_ALARM + PREP_SUCTION")
    print("\nCommands:")
    print("  * 'ALL'    -> Evaluates & logs all 81 (3^4) input permutations to CSV & JSONL!")
    print("  * 'help'   -> Show this reference table")
    print("  * 'reset'  -> Reset FSM state")
    print("  * 'quit'   -> Exit test bench\n")


def log_permutation_record(tuple_str: str, levels: Tuple[int, int, int, int], diag: DiagnosticOutput, payload: TelemetryPayload) -> None:
    record = {
        "timestamp_iso": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "input_tuple": tuple_str,
        "encoded_levels": {
            "cecg_slot1": levels[0],
            "audio_slot2": levels[1],
            "actigraphy_slot3": levels[2],
            "impedance_slot4": levels[3],
        },
        "fsm_state": diag.current_state.value,
        "confidence_score": round(diag.confidence_score, 3),
        "action_trigger": diag.action_trigger.value,
        "artifact_type": diag.artifact_type.value,
        "concordance_score": round(diag.fusion_result.concordance_score, 3),
        "sensor_metrics": {
            "hr_bpm": round(diag.dsp_metrics.heart_rate_bpm, 1),
            "rmssd_ms": round(diag.dsp_metrics.rmssd_ms, 1),
            "acoustic_energy": round(diag.dsp_metrics.acoustic_short_time_energy, 5),
            "actigraphy_rms_g": round(diag.dsp_metrics.actigraphy_vm_rms, 3),
            "impedance_raw_us": round(diag.dsp_metrics.impedance_raw_uS, 2),
            "impedance_delta_us": round(diag.dsp_metrics.impedance_delta_uS, 2),
            "shivering_flag": diag.dsp_metrics.shivering_detected,
            "sweating_flag": diag.dsp_metrics.diaphoresis_detected,
            "spill_flag": diag.dsp_metrics.fluid_spill_signature,
            "macro_shift_flag": diag.dsp_metrics.macro_postural_shift_detected,
        },
        "clinical_rationale": diag.clinical_rationale,
    }

    with open(JSONL_LOG_PATH, mode="a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

    file_exists = os.path.isfile(CSV_LOG_PATH)
    with open(CSV_LOG_PATH, mode="a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists or os.path.getsize(CSV_LOG_PATH) == 0:
            writer.writerow([
                "timestamp_iso", "input_tuple", "cecg", "audio", "actigraphy", "impedance",
                "fsm_state", "confidence_score", "action_trigger", "artifact_type",
                "concordance", "hr_bpm", "rmssd_ms", "acoustic_energy", "actigraphy_rms_g",
                "impedance_uS", "impedance_delta_uS", "shivering_flag", "sweating_flag",
                "spill_flag", "macro_shift_flag", "clinical_rationale",
            ])
        writer.writerow([
            record["timestamp_iso"], record["input_tuple"], levels[0], levels[1], levels[2], levels[3],
            record["fsm_state"], record["confidence_score"], record["action_trigger"], record["artifact_type"],
            record["concordance_score"], record["sensor_metrics"]["hr_bpm"], record["sensor_metrics"]["rmssd_ms"],
            record["sensor_metrics"]["acoustic_energy"], record["sensor_metrics"]["actigraphy_rms_g"],
            record["sensor_metrics"]["impedance_raw_us"], record["sensor_metrics"]["impedance_delta_us"],
            record["sensor_metrics"]["shivering_flag"], record["sensor_metrics"]["sweating_flag"],
            record["sensor_metrics"]["spill_flag"], record["sensor_metrics"]["macro_shift_flag"],
            record["clinical_rationale"],
        ])


def parse_token(tok: str) -> int:
    t = tok.strip().lower()
    if t in ("-1", "1-", "low", "l"):
        return -1
    elif t in ("1", "+1", "high", "h"):
        return 1
    return 0


def parse_4_sensor_tuple(raw_input: str) -> Optional[Tuple[int, int, int, int]]:
    cleaned = raw_input.strip()
    if cleaned.startswith("(") and cleaned.endswith(")"):
        cleaned = cleaned[1:-1]
    elif cleaned.startswith("[") and cleaned.endswith("]"):
        cleaned = cleaned[1:-1]

    parts = [p.strip() for p in cleaned.split(",") if p.strip()]
    if len(parts) == 1 and " " in parts[0]:
        parts = [p.strip() for p in parts[0].split(" ") if p.strip()]

    if len(parts) != 4:
        return None

    return (parse_token(parts[0]), parse_token(parts[1]), parse_token(parts[2]), parse_token(parts[3]))


def evaluate_tuple(
    tuple_vals: Tuple[int, int, int, int],
    pipeline: MultiModalDSPPipeline,
    fusion: CrossModalFusionMatrix,
    fsm: MicroDiagnosticFSM,
    formatter: TelemetryFormatter,
    n_frames: int = 20,
) -> Tuple[DiagnosticOutput, TelemetryPayload]:
    e_val, a_val, acc_val, imp_val = tuple_vals

    ecg_lvl = CECGLevel(e_val)
    aud_lvl = AudioLevel(a_val)
    acc_lvl = ActigraphyLevel(acc_val)
    imp_lvl = ImpedanceLevel(imp_val)

    # Detect fluid spill condition: high impedance step with quiet audio and normal ecg
    is_spill = (imp_lvl == ImpedanceLevel.HIGH and aud_lvl == AudioLevel.LOW and ecg_lvl == CECGLevel.NORMAL)

    gen_ecg = CECGSignalGenerator(seed=42)
    gen_aud = AudioSignalGenerator(seed=42)
    gen_acc = ActigraphySignalGenerator(seed=42)
    gen_imp = ImpedanceSignalGenerator(seed=42)

    diag = None
    payload = None

    for frame in range(n_frames):
        t_s = (frame + 1) * 0.2
        ecg_samples = gen_ecg.generate_chunk(duration_s=0.2, level=ecg_lvl)
        aud_samples = gen_aud.generate_chunk(duration_s=0.2, level=aud_lvl)
        acc_samples = gen_acc.generate_chunk(duration_s=0.2, level=acc_lvl)
        imp_samples = gen_imp.generate_chunk(duration_s=0.2, level=imp_lvl, is_fluid_spill=is_spill)

        metrics = pipeline.process_frame_batch(ecg_samples, aud_samples, acc_samples, imp_samples, timestamp_s=t_s)
        fres = fusion.evaluate(metrics)
        diag = fsm.update(metrics, fres)

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
            dsp_metrics=metrics,
        )

    return diag, payload


def evaluate_all_81_permutations() -> None:
    print("\n" + "=" * 90)
    print("  RUNNING SYSTEMATIC EVALUATION OF ALL 81 PERMUTATIONS (3^4)...")
    print("=" * 90)

    trinary_vals = [-1, 0, 1]
    all_perms = list(itertools.product(trinary_vals, repeat=4))

    state_counts: Dict[str, int] = {}
    formatter = TelemetryFormatter(patient_id="PATIENT_AAL_0042", bed_id="BED_ALPHA_01")

    print(f"{'#':<4} | {'Permutation Tuple':<20} | {'FSM Diagnostic State':<26} | {'Action Trigger':<32} | {'Confidence'}")
    print("-" * 95)

    for idx, perm in enumerate(all_perms, start=1):
        perm_str = f"({perm[0]}, {perm[1]}, {perm[2]}, {perm[3]})"

        pipeline = MultiModalDSPPipeline()
        fusion = CrossModalFusionMatrix()
        fsm = MicroDiagnosticFSM(frame_dt_s=0.2)

        diag, payload = evaluate_tuple(perm, pipeline, fusion, fsm, formatter, n_frames=20)
        log_permutation_record(perm_str, perm, diag, payload)

        st = diag.current_state.value
        state_counts[st] = state_counts.get(st, 0) + 1

        if idx <= 15 or idx >= 70 or (idx % 10 == 0):
            print(f"{idx:<4} | {perm_str:<20} | {st:<26} | {diag.action_trigger.value:<32} | {diag.confidence_score*100:.1f}%")
        elif idx == 16:
            print(" ...  | (intermediate permutations logging to disk...)")

    print("\n" + "=" * 90)
    print("  81 PERMUTATIONS EVALUATION COMPLETE - CLASSIFICATION DISTRIBUTION:")
    print("-" * 90)
    for st, cnt in sorted(state_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  * {st:<30}: {cnt:2d} permutations ({cnt / 81 * 100:.1f}%)")
    print(f"\n  [SAVED] Full 81 permutations saved to:")
    print(f"    - CSV:   {CSV_LOG_PATH}")
    print(f"    - JSONL: {JSONL_LOG_PATH}")
    print("=" * 90 + "\n")


def run_interactive_session() -> None:
    clear_and_banner()
    print_slot_reference_table()

    pipeline = MultiModalDSPPipeline()
    fusion = CrossModalFusionMatrix()
    fsm = MicroDiagnosticFSM(frame_dt_s=0.2)
    formatter = TelemetryFormatter(patient_id="PATIENT_AAL_0042", bed_id="BED_ALPHA_01")

    while True:
        try:
            cmd = input("\nEnter Trinary Tuple (cECG, Audio, Actigraphy, Impedance) in {-1, 0, 1} > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting. Goodbye!")
            break

        if not cmd:
            continue

        cmd_lower = cmd.lower()
        if cmd_lower in ("quit", "exit", "q"):
            print("\nExiting Test Bench. Goodbye!\n")
            break
        elif cmd_lower in ("help", "h", "?"):
            print_slot_reference_table()
            continue
        elif cmd_lower in ("reset", "r"):
            pipeline.reset()
            fsm.reset()
            print("\n[OK] FSM Engine and DSP Baselines Reset.")
            continue
        elif cmd_lower in ("all", "eval_all", "perms", "permutations"):
            evaluate_all_81_permutations()
            continue

        res = parse_4_sensor_tuple(cmd)
        if res is None:
            print(f"\n[ERROR] Invalid format '{cmd}'. Enter 4 values in {-1, 0, 1}: (cECG, Audio, Actigraphy, Impedance)")
            continue

        tuple_str = f"({res[0]}, {res[1]}, {res[2]}, {res[3]})"
        print(f"\n>> Ingesting Trinary Tuple: {tuple_str} ...")

        diag, payload = evaluate_tuple(res, pipeline, fusion, fsm, formatter, n_frames=20)
        log_permutation_record(tuple_str, res, diag, payload)

        print("\n" + "-" * 90)
        print(f"  EVALUATED 4-SENSOR TRINARY TUPLE: {tuple_str}")
        print("-" * 90)
        print(f"  * Micro-FSM State:       {diag.current_state.value}")
        print(f"  * Diagnostic Confidence: {diag.confidence_score * 100:.1f}%")
        print(f"  * Edge Action Trigger:   {diag.action_trigger.value}")
        print(f"  * Detected Artifact:     {diag.artifact_type.value}")
        print(f"  * Fusion Concordance:    {diag.fusion_result.concordance_score:.3f}")
        print(f"  * Clinical Rationale:    {diag.clinical_rationale}")

        print("\n  EXTRACTED BIOMETRIC SENSOR METRICS:")
        m = diag.dsp_metrics
        print(f"    - [Slot 1] cECG Heart Rate:     {m.heart_rate_bpm:.1f} BPM  |  RMSSD: {m.rmssd_ms:.1f} ms  |  Vagal Surge: {m.hrv_surge_detected}")
        print(f"    - [Slot 2] Acoustic Energy:     {m.acoustic_short_time_energy:.5f}  |  Retch Burst Detected: {m.acoustic_burst_detected}")
        print(f"    - [Slot 3] Actigraphy RMS:      {m.actigraphy_vm_rms:.3f} g  |  Shivering: {m.shivering_detected}  |  Macro Shift: {m.macro_postural_shift_detected}")
        print(f"    - [Slot 4] E-Textile Impedance: {m.impedance_raw_uS:.2f} uS  |  Delta: +{m.impedance_delta_uS:.2f} uS  |  Slew: {m.impedance_slew_rate_uS_s:.2f} uS/s")
        print(f"    - Sudomotor Sweating Flag:     {m.diaphoresis_detected}  |  Fluid Spill Flag: {m.fluid_spill_signature}")

        print(f"\n  [LOGGED] Appended to {CSV_LOG_PATH} & {JSONL_LOG_PATH}")
        print("\n  GENERATED STANDARDIZED JSON TELEMETRY PAYLOAD:")
        print(payload.to_json(indent=2))
        print("-" * 90 + "\n")


if __name__ == "__main__":
    run_interactive_session()
