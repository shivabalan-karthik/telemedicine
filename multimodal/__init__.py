"""
multimodal package
==================
Multi-Modal Combination & 4-Category Confusion Evaluation (TP, TN, FP, FN):
  Combines cECG, Acoustic Phonoenterography, Actigraphy, and Impedance streams.
"""

from .types import (
    ClassificationCategory,
    GroundTruthLabel,
    GROUND_TRUTH_IS_POSITIVE,
    MultiModalEvaluationResult,
)
from .metrics import ConfusionMatrixStats, ConfusionMatrixTracker
from .classifier import MultiModalClassifier
from .benchmark import BenchmarkTestCase, BENCHMARK_SUITE, run_full_benchmark

__all__ = [
    "ClassificationCategory",
    "GroundTruthLabel",
    "GROUND_TRUTH_IS_POSITIVE",
    "MultiModalEvaluationResult",
    "ConfusionMatrixStats",
    "ConfusionMatrixTracker",
    "MultiModalClassifier",
    "BenchmarkTestCase",
    "BENCHMARK_SUITE",
    "run_full_benchmark",
]
