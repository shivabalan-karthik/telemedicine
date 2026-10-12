"""
multimodal/interactive_tester.py
================================
Interactive CLI Test Bench for Multi-Modal Classification:
  * Ingests 4-Sensor Tuple (cECG, Audio, Actigraphy, Impedance) in {-1, 0, 1}
  * Prompts for Ground Truth Label (Normal, Spill, Shift, Sweat, Shiver, Surge, Pre-Emesis, Emesis)
  * Combines all 4 streams, executes Direct Form II DSP + 4x4 Fusion + FSM
  * Emits classification into:
      [ TRUE POSITIVE ] | [ TRUE NEGATIVE ] | [ FALSE POSITIVE ] | [ FALSE NEGATIVE ]
  * Updates running 2x2 Confusion Matrix statistics
"""

from __future__ import annotations
import os
import sys
from typing import Optional, Tuple

if __name__ == "__main__" and __package__ is None:
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from multimodal.types import (
        ClassificationCategory,
        GroundTruthLabel,
        MultiModalEvaluationResult,
    )
    from multimodal.metrics import ConfusionMatrixTracker
    from multimodal.classifier import MultiModalClassifier
    from multimodal.benchmark import run_full_benchmark
else:
    from .types import (
        ClassificationCategory,
        GroundTruthLabel,
        MultiModalEvaluationResult,
    )
    from .metrics import ConfusionMatrixTracker
    from .classifier import MultiModalClassifier
    from .benchmark import run_full_benchmark


GROUND_TRUTH_MENU = [
    ("1", GroundTruthLabel.NORMAL_BASELINE, "Normal Baseline Sleep (Negative)"),
    ("2", GroundTruthLabel.ARTIFACT_SPILL, "Accidental Bed Fluid Spill (Negative / Artifact)"),
    ("3", GroundTruthLabel.ARTIFACT_POSTURAL_SHIFT, "Isolated Postural Body Shift (Negative / Artifact)"),
    ("4", GroundTruthLabel.SUDOMOTOR_DIAPHORESIS, "Sudomotor Cold Sweat Diaphoresis (Positive - Fan ON)"),
    ("5", GroundTruthLabel.NOCTURNAL_SHIVERING, "Nocturnal Clonic Shivering Tremor (Positive - Fan OFF)"),
    ("6", GroundTruthLabel.AUTONOMIC_VAGAL_SURGE, "Autonomic Vagal Surge / HRV Rise (Positive)"),
    ("7", GroundTruthLabel.PRE_EMESIS, "Pre-Emesis Warning Cascade (Positive - Bed Elevate 30°)"),
    ("8", GroundTruthLabel.ACTIVE_EMESIS, "Active Emesis Event (Positive - Emergency Alarm)"),
]


def print_banner():
    print("\n" + "=" * 90)
    print("  MULTI-MODAL BIOMEDICAL DSP & 4-CATEGORY CLASSIFICATION TEST BENCH")
    print("  Combines cECG + Audio + Actigraphy + Impedance -> TP / TN / FP / FN")
    print("=" * 90)


def print_ground_truth_options():
    print("\nSelect Ground Truth Reference Label:")
    for num, lbl, desc in GROUND_TRUTH_MENU:
        print(f"  [{num}] {desc}")


def parse_ground_truth(choice: str) -> Optional[GroundTruthLabel]:
    c = choice.strip().lower()
    for num, lbl, desc in GROUND_TRUTH_MENU:
        if c == num or c == lbl.value.lower():
            return lbl
    if c in ("normal", "sleep", "baseline"):
        return GroundTruthLabel.NORMAL_BASELINE
    elif c in ("spill", "water", "fluid"):
        return GroundTruthLabel.ARTIFACT_SPILL
    elif c in ("shift", "roll", "movement"):
        return GroundTruthLabel.ARTIFACT_POSTURAL_SHIFT
    elif c in ("sweat", "diaphoresis"):
        return GroundTruthLabel.SUDOMOTOR_DIAPHORESIS
    elif c in ("shiver", "shivering", "tremor"):
        return GroundTruthLabel.NOCTURNAL_SHIVERING
    elif c in ("vagal", "surge", "hrv"):
        return GroundTruthLabel.AUTONOMIC_VAGAL_SURGE
    elif c in ("pre", "pre-emesis", "warning"):
        return GroundTruthLabel.PRE_EMESIS
    elif c in ("emesis", "vomit", "active"):
        return GroundTruthLabel.ACTIVE_EMESIS
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


def display_classification_card(res: MultiModalEvaluationResult, tracker: ConfusionMatrixTracker):
    cat_badges = {
        ClassificationCategory.TRUE_POSITIVE: "\033[1m\033[32m[ TRUE POSITIVE (TP) ]\033[0m",
        ClassificationCategory.TRUE_NEGATIVE: "\033[1m\033[36m[ TRUE NEGATIVE (TN) ]\033[0m",
        ClassificationCategory.FALSE_POSITIVE: "\033[1m\033[31m[ FALSE POSITIVE (FP) - FALSE ALARM! ]\033[0m",
        ClassificationCategory.FALSE_NEGATIVE: "\033[1m\033[33m[ FALSE NEGATIVE (FN) - MISSED EVENT! ]\033[0m",
    }

    badge = cat_badges.get(res.classification, f"[{res.classification.value}]")

    print("\n" + "=" * 90)
    print(f"  MULTI-MODAL EVALUATION OUTPUT: {badge}")
    print("=" * 90)
    print(f"  * Input 4-Sensor Tuple:  {res.input_tuple_str} (cECG, Audio, Actigraphy, Impedance)")
    print(f"  * Ground Truth Label:    {res.ground_truth.value} (Positive={res.is_ground_truth_positive})")
    print(f"  * System FSM State:      {res.fsm_state}")
    print(f"  * Edge Action Trigger:   {res.action_trigger}")
    print(f"  * Diagnostic Confidence: {res.confidence_score * 100:.1f}%")
    print(f"  * Fusion Concordance:    {res.concordance_score:.3f}")
    print(f"  * Clinical Explanation:  {res.clinical_explanation}")

    print("\n  EXTRACTED SENSOR BIOMARKERS:")
    print(f"    - cECG Heart Rate:     {res.heart_rate_bpm:.1f} BPM | RMSSD: {res.rmssd_ms:.1f} ms")
    print(f"    - Acoustic STE Energy: {res.acoustic_energy:.5f}")
    print(f"    - Actigraphy RMS:      {res.actigraphy_rms_g:.4f} g | Shivering: {res.shivering_flag}")
    print(f"    - Impedance Conduct:   {res.impedance_raw_us:.2f} uS | Delta: +{res.impedance_delta_us:.2f} uS | Sweating: {res.sweating_flag} | Spill: {res.spill_flag}")

    print("\n" + tracker.render_table() + "\n")


def run_interactive_session():
    print_banner()
    tracker = ConfusionMatrixTracker()
    classifier = MultiModalClassifier(frame_dt_s=0.2)

    while True:
        try:
            cmd = input("\nEnter 4-Sensor Tuple (cECG, Audio, Actigraphy, Impedance) in {-1, 0, 1} (or 'bench' / 'quit') > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting. Goodbye!")
            break

        if not cmd:
            continue
        if cmd.lower() in ("quit", "exit", "q"):
            print("\nExiting Multi-Modal test bench. Goodbye!\n")
            break
        if cmd.lower() in ("bench", "benchmark", "suite"):
            run_full_benchmark(verbose=True)
            continue
        if cmd.lower() in ("reset", "r"):
            tracker.reset()
            classifier.reset()
            print("[OK] Reset Confusion Matrix and DSP state.")
            continue

        tuple_vals = parse_4_tuple(cmd)
        if tuple_vals is None:
            print(f"[ERROR] Invalid format '{cmd}'. Enter 4 values e.g. (0, 0, -1, 1).")
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

        print(f"\n>> Combining 4 sensor streams for Tuple {tuple_vals} vs Ground Truth '{gt_label.value}' ...")
        res = classifier.evaluate_synthesized_tuple(tuple_vals, ground_truth=gt_label, n_frames=20)
        tracker.record(res.classification)
        display_classification_card(res, tracker)


if __name__ == "__main__":
    run_interactive_session()
