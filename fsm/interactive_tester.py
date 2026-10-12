"""
fsm/interactive_tester.py
=========================
Interactive CLI Test Bench for the Hybrid Moore-EFSM Verification Engine:
  * Ingests 4-Sensor Tuple (cECG, Audio, Actigraphy, Impedance) in {-1, 0, 1}
  * Applies Temporal Persistence (EFSM) & Quadratic Concordance Gating
  * Emits strictly one of:
      [ TRUE_POSITIVE (TP) ]  OR  [ TRUE_NEGATIVE (TN) ]
  * Displays real-time state transition traces and edge actuation commands.
"""

from __future__ import annotations
import os
import sys
from typing import Optional, Tuple

if __name__ == "__main__" and __package__ is None:
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from fsm.types import BinaryOutcome, FSMDiagnosticReport, FSMState, ActionTrigger
    from fsm.engine import HybridMooreEFSM
else:
    from .types import BinaryOutcome, FSMDiagnosticReport, FSMState, ActionTrigger
    from .engine import HybridMooreEFSM


GROUND_TRUTH_MENU = [
    ("1", "NORMAL_BASELINE", "Normal Baseline Sleep (Negative)"),
    ("2", "ARTIFACT_SPILL", "Accidental Bed Fluid Spill (Negative / Artifact)"),
    ("3", "ARTIFACT_POSTURAL_SHIFT", "Isolated Postural Body Shift (Negative / Artifact)"),
    ("4", "SUDOMOTOR_DIAPHORESIS", "Sudomotor Cold Sweat Diaphoresis (Positive - Fan ON)"),
    ("5", "NOCTURNAL_SHIVERING", "Nocturnal Clonic Shivering Tremor (Positive - Fan OFF)"),
    ("6", "AUTONOMIC_VAGAL_SURGE", "Autonomic Vagal Surge / HRV Rise (Positive)"),
    ("7", "PRE_EMESIS", "Pre-Emesis Warning Cascade (Positive - Bed Elevate 30°)"),
    ("8", "ACTIVE_EMESIS", "Active Emesis Event (Positive - Emergency Alarm)"),
]


def print_banner():
    print("\n" + "=" * 90)
    print("  HYBRID MOORE-EFSM CLINICAL VERIFICATION TEST BENCH")
    print("  Data Path: 4-Sensor Raw -> DSP -> Fusion -> FSM -> [ TRUE_POSITIVE | TRUE_NEGATIVE ]")
    print("=" * 90)


def print_ground_truth_options():
    print("\nSelect Ground Truth Reference Label:")
    for num, lbl, desc in GROUND_TRUTH_MENU:
        print(f"  [{num}] {desc}")


def parse_ground_truth(choice: str) -> Optional[str]:
    c = choice.strip().lower()
    for num, lbl, desc in GROUND_TRUTH_MENU:
        if c == num or c == lbl.lower():
            return lbl
    if c in ("normal", "sleep", "baseline"):
        return "NORMAL_BASELINE"
    elif c in ("spill", "water", "fluid"):
        return "ARTIFACT_SPILL"
    elif c in ("shift", "roll", "movement"):
        return "ARTIFACT_POSTURAL_SHIFT"
    elif c in ("sweat", "diaphoresis"):
        return "SUDOMOTOR_DIAPHORESIS"
    elif c in ("shiver", "shivering"):
        return "NOCTURNAL_SHIVERING"
    elif c in ("vagal", "surge"):
        return "AUTONOMIC_VAGAL_SURGE"
    elif c in ("pre", "pre-emesis"):
        return "PRE_EMESIS"
    elif c in ("emesis", "active"):
        return "ACTIVE_EMESIS"
    return None


def parse_4_tuple(raw: str) -> Optional[Tuple[int, int, int, int]]:
    cleaned = raw.strip()
    if cleaned.startswith("(") and cleaned.endswith(")"):
        cleaned = cleaned[1:-1]
    elif cleaned.startswith("[") and cleaned.endswith("]"):
        cleaned = cleaned[1:-1]

    parts = [p.strip() for p in cleaned.split(",") if p.strip()]
    if len(parts) == 1 and " " in parts[0]:
        parts = [p.strip() for p in parts[0].split(" ") if p.strip()]

    if len(parts) != 4:
        return None

    def ptoken(tok: str) -> int:
        t = tok.strip().lower()
        if t in ("-1", "1-", "low", "l"):
            return -1
        elif t in ("1", "+1", "high", "h"):
            return 1
        return 0

    return (ptoken(parts[0]), ptoken(parts[1]), ptoken(parts[2]), ptoken(parts[3]))


def display_fsm_card(report: FSMDiagnosticReport):
    if report.outcome == BinaryOutcome.TRUE_POSITIVE:
        badge = "\033[1m\033[32m[ VERIFIED TRUE POSITIVE (TP) ]\033[0m"
    else:
        badge = "\033[1m\033[36m[ VERIFIED TRUE NEGATIVE (TN) ]\033[0m"

    print("\n" + "=" * 90)
    print(f"  FSM VERIFICATION ENGINE RESULT: {badge}")
    print("=" * 90)
    print(f"  * Strict Binary Outcome:   \033[1m{report.outcome.value}\033[0m")
    print(f"  * Input 4-Sensor Tuple:    {report.input_tuple_str} (cECG, Audio, Actigraphy, Impedance)")
    print(f"  * Ground Truth Context:    {report.ground_truth_label}")
    print(f"  * Moore FSM State:         \033[1m\033[33m{report.fsm_state.value}\033[0m")
    print(f"  * Edge Actuation Command:  \033[1m\033[35m{report.action_trigger.value}\033[0m")
    print(f"  * Verification Status:     {report.verification_status.value}")
    print(f"  * Diagnostic Confidence:   {report.confidence_score * 100:.1f}%")
    print(f"  * Cross-Modal Concordance: {report.concordance_score:.3f}")
    print(f"  * Clinical Rationale:      {report.clinical_rationale}")

    if report.transition_trace:
        print("\n  FSM TRANSITION TRACE:")
        for tr in report.transition_trace:
            print(f"    -> {tr}")

    print("\n  EXTRACTED SENSOR BIOMARKERS:")
    print(f"    - cECG Heart Rate:       {report.heart_rate_bpm:.1f} BPM | RMSSD: {report.rmssd_ms:.1f} ms")
    print(f"    - Acoustic STE Energy:   {report.acoustic_energy:.5f}")
    print(f"    - Actigraphy RMS:        {report.actigraphy_rms_g:.4f} g | Shivering: {report.shivering_flag}")
    print(f"    - E-Textile Conductance: {report.impedance_raw_us:.2f} uS | Delta: +{report.impedance_delta_us:.2f} uS | Sweating: {report.sweating_flag} | Spill: {report.spill_flag}")
    print("=" * 90 + "\n")


def run_interactive():
    print_banner()
    fsm_engine = HybridMooreEFSM(frame_dt_s=0.2, min_persistence_frames=3)

    while True:
        try:
            cmd = input("\nEnter 4-Sensor Tuple (cECG, Audio, Actigraphy, Impedance) in {-1, 0, 1} (or 'quit') > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting. Goodbye!")
            break

        if not cmd:
            continue
        if cmd.lower() in ("quit", "exit", "q"):
            print("\nExiting FSM test bench. Goodbye!\n")
            break
        if cmd.lower() in ("reset", "r"):
            fsm_engine.reset()
            print("[OK] FSM Engine and state registers reset.")
            continue

        tuple_vals = parse_4_tuple(cmd)
        if tuple_vals is None:
            print(f"[ERROR] Invalid format '{cmd}'. Enter 4 comma-separated values in {-1, 0, 1}.")
            continue

        print_ground_truth_options()
        try:
            gt_choice = input("Enter Ground Truth [1-8] > ").strip()
        except (KeyboardInterrupt, EOFError):
            break

        gt_label = parse_ground_truth(gt_choice)
        if gt_label is None:
            print("[ERROR] Invalid Ground Truth selection.")
            continue

        print(f"\n>> Executing Hybrid Moore-EFSM Verification for Tuple {tuple_vals} vs Ground Truth '{gt_label}' ...")
        report = fsm_engine.evaluate_synthesized_tuple(tuple_vals, ground_truth_label=gt_label, n_frames=20)
        display_fsm_card(report)


if __name__ == "__main__":
    run_interactive()
