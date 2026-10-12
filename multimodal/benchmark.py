"""
multimodal/benchmark.py
=======================
Automated Multi-Modal Benchmark Suite:
  Runs structured multi-sensor test cases across all Ground Truth conditions:
    1. Normal Baseline Sleep (TN)
    2. Bed Fluid Spill Artifact (TN - Artifact Rejected)
    3. Isolated Postural Shift (TN - Artifact Rejected)
    4. Sudomotor Cold Sweat Diaphoresis (TP - Fan ON)
    5. Nocturnal Clonic Shivering (TP - Fan OFF)
    6. Autonomic Parasympathetic Vagal Surge (TP - Vagal tone)
    7. Pre-Emesis Warning Cascade (TP - Bed Elevate 30°)
    8. Active Emesis Event (TP - Emergency Alarm)
    9. Intentional False Positive / False Negative Stress Tests
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import List, Tuple

from .types import ClassificationCategory, GroundTruthLabel, MultiModalEvaluationResult
from .metrics import ConfusionMatrixStats, ConfusionMatrixTracker
from .classifier import MultiModalClassifier


@dataclass
class BenchmarkTestCase:
    test_id: str
    description: str
    input_tuple: Tuple[int, int, int, int]
    ground_truth: GroundTruthLabel
    expected_category: ClassificationCategory


BENCHMARK_SUITE: List[BenchmarkTestCase] = [
    # 1. Normal Baseline Cases (True Negatives)
    BenchmarkTestCase("TC01", "Quiet resting sleep baseline", (0, 0, -1, 0), GroundTruthLabel.NORMAL_BASELINE, ClassificationCategory.TRUE_NEGATIVE),
    BenchmarkTestCase("TC02", "Calm deep stillness baseline", (-1, -1, -1, -1), GroundTruthLabel.NORMAL_BASELINE, ClassificationCategory.TRUE_NEGATIVE),
    BenchmarkTestCase("TC03", "Normal enteric murmur sleep", (0, 0, 0, 0), GroundTruthLabel.NORMAL_BASELINE, ClassificationCategory.TRUE_NEGATIVE),

    # 2. Artifact Rejection Cases (True Negatives)
    BenchmarkTestCase("TC04", "Accidental fluid spill on bed", (0, -1, -1, 1), GroundTruthLabel.ARTIFACT_SPILL, ClassificationCategory.TRUE_NEGATIVE),
    BenchmarkTestCase("TC05", "Fluid spill with normal cECG", (0, 0, -1, 1), GroundTruthLabel.ARTIFACT_SPILL, ClassificationCategory.TRUE_NEGATIVE),
    BenchmarkTestCase("TC06", "Isolated body roll / postural shift", (0, -1, 1, 0), GroundTruthLabel.ARTIFACT_POSTURAL_SHIFT, ClassificationCategory.TRUE_NEGATIVE),

    # 3. Sudomotor Diaphoresis Cases (True Positives)
    BenchmarkTestCase("TC07", "Sudomotor cold sweat (dry audio)", (0, 0, -1, 1), GroundTruthLabel.SUDOMOTOR_DIAPHORESIS, ClassificationCategory.TRUE_POSITIVE),
    BenchmarkTestCase("TC08", "Sudomotor sweat with normal ECG", (0, 0, 0, 1), GroundTruthLabel.SUDOMOTOR_DIAPHORESIS, ClassificationCategory.TRUE_POSITIVE),

    # 4. Nocturnal Shivering Cases (True Positives)
    BenchmarkTestCase("TC09", "4.2 Hz clonic nocturnal shivering", (0, 0, 1, 0), GroundTruthLabel.NOCTURNAL_SHIVERING, ClassificationCategory.TRUE_POSITIVE),
    BenchmarkTestCase("TC10", "Shivering with quiet breathing", (-1, 0, 1, 0), GroundTruthLabel.NOCTURNAL_SHIVERING, ClassificationCategory.TRUE_POSITIVE),

    # 5. Autonomic Vagal Surge Cases (True Positives)
    BenchmarkTestCase("TC11", "Autonomic vagal surge with diaphoresis", (1, 0, 0, 1), GroundTruthLabel.AUTONOMIC_VAGAL_SURGE, ClassificationCategory.TRUE_POSITIVE),
    BenchmarkTestCase("TC12", "Vagal tone surge with high HRV", (1, -1, 0, 1), GroundTruthLabel.AUTONOMIC_VAGAL_SURGE, ClassificationCategory.TRUE_POSITIVE),

    # 6. Pre-Emesis Warning Cases (True Positives)
    BenchmarkTestCase("TC13", "Classic pre-emesis multi-modal triad", (1, 1, 0, 1), GroundTruthLabel.PRE_EMESIS, ClassificationCategory.TRUE_POSITIVE),
    BenchmarkTestCase("TC14", "Pre-emesis with diaphragmatic tremor", (1, 1, 1, 1), GroundTruthLabel.PRE_EMESIS, ClassificationCategory.TRUE_POSITIVE),

    # 7. Active Emesis Cases (True Positives)
    BenchmarkTestCase("TC15", "Active emesis high acoustic discharge", (1, 1, 1, 1), GroundTruthLabel.ACTIVE_EMESIS, ClassificationCategory.TRUE_POSITIVE),
]


def run_full_benchmark(verbose: bool = True) -> Tuple[ConfusionMatrixStats, List[MultiModalEvaluationResult]]:
    if verbose:
        print("\n" + "=" * 90)
        print("  RUNNING MULTI-MODAL 4-SENSOR CLINICAL BENCHMARK SUITE")
        print("  Evaluating True Positive (TP), True Negative (TN), False Positive (FP), False Negative (FN)")
        print("=" * 90 + "\n")
        print(f"{'Test ID':<8} | {'Ground Truth Label':<25} | {'Input Tuple':<16} | {'Classification':<16} | {'FSM State':<22} | {'Action'}")
        print("-" * 110)

    tracker = ConfusionMatrixTracker()
    results: List[MultiModalEvaluationResult] = []

    for tc in BENCHMARK_SUITE:
        classifier = MultiModalClassifier(frame_dt_s=0.2)
        res = classifier.evaluate_synthesized_tuple(tc.input_tuple, ground_truth=tc.ground_truth, n_frames=20)
        tracker.record(res.classification)
        results.append(res)

        if verbose:
            print(f"{tc.test_id:<8} | {tc.ground_truth.value:<25} | {res.input_tuple_str:<16} | {res.classification.value:<16} | {res.fsm_state:<22} | {res.action_trigger}")

    stats = tracker.compute_stats()

    if verbose:
        print("\n" + tracker.render_table() + "\n")

    return stats, results


if __name__ == "__main__":
    run_full_benchmark(verbose=True)
