"""
multimodal/metrics.py
=====================
Statistical Confusion Matrix Tracker and Clinical Evaluation Metrics:
  * True Positive (TP), True Negative (TN), False Positive (FP), False Negative (FN)
  * Sensitivity / Recall: TP / (TP + FN)
  * Specificity: TN / (TN + FP)
  * Precision / Positive Predictive Value (PPV): TP / (TP + FP)
  * Negative Predictive Value (NPV): TN / (TN + FN)
  * False Alarm Rate (FAR) / False Positive Rate: FP / (FP + TN)
  * F1-Score & Accuracy
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, Optional

from .types import ClassificationCategory


@dataclass
class ConfusionMatrixStats:
    tp: int
    tn: int
    fp: int
    fn: int
    total: int
    sensitivity: float
    specificity: float
    precision: float
    npv: float
    false_alarm_rate: float
    f1_score: float
    accuracy: float


class ConfusionMatrixTracker:
    """
    Tracks streaming classifications and calculates 2x2 confusion matrix performance.
    """

    def __init__(self) -> None:
        self.tp: int = 0
        self.tn: int = 0
        self.fp: int = 0
        self.fn: int = 0

    def reset(self) -> None:
        self.tp = 0
        self.tn = 0
        self.fp = 0
        self.fn = 0

    def record(self, category: ClassificationCategory) -> None:
        if category == ClassificationCategory.TRUE_POSITIVE:
            self.tp += 1
        elif category == ClassificationCategory.TRUE_NEGATIVE:
            self.tn += 1
        elif category == ClassificationCategory.FALSE_POSITIVE:
            self.fp += 1
        elif category == ClassificationCategory.FALSE_NEGATIVE:
            self.fn += 1

    def compute_stats(self) -> ConfusionMatrixStats:
        total = self.tp + self.tn + self.fp + self.fn
        
        sensitivity = (self.tp / (self.tp + self.fn)) if (self.tp + self.fn) > 0 else 1.0
        specificity = (self.tn / (self.tn + self.fp)) if (self.tn + self.fp) > 0 else 1.0
        precision = (self.tp / (self.tp + self.fp)) if (self.tp + self.fp) > 0 else 1.0
        npv = (self.tn / (self.tn + self.fn)) if (self.tn + self.fn) > 0 else 1.0
        false_alarm_rate = (self.fp / (self.fp + self.tn)) if (self.fp + self.tn) > 0 else 0.0
        
        if (precision + sensitivity) > 0:
            f1 = 2.0 * (precision * sensitivity) / (precision + sensitivity)
        else:
            f1 = 0.0
            
        accuracy = ((self.tp + self.tn) / total) if total > 0 else 1.0

        return ConfusionMatrixStats(
            tp=self.tp,
            tn=self.tn,
            fp=self.fp,
            fn=self.fn,
            total=total,
            sensitivity=sensitivity,
            specificity=specificity,
            precision=precision,
            npv=npv,
            false_alarm_rate=false_alarm_rate,
            f1_score=f1,
            accuracy=accuracy,
        )

    def render_table(self) -> str:
        s = self.compute_stats()
        lines = [
            "+" + "-" * 62 + "+",
            "|               MULTI-MODAL 2x2 CONFUSION MATRIX               |",
            "+" + "-" * 62 + "+",
            "|                      |  Ground Truth (+)   |  Ground Truth (-)   |",
            "+" + "-" * 62 + "+",
            f"| System Alert (+)     |  TP = {s.tp:<13} |  FP = {s.fp:<13} |",
            f"| System Suppress (-)  |  FN = {s.fn:<13} |  TN = {s.tn:<13} |",
            "+" + "-" * 62 + "+",
            f"| Total Samples: {s.total:<6} | Sensitivity (Recall): {s.sensitivity * 100:5.1f}%          |",
            f"| Accuracy:      {s.accuracy * 100:5.1f}% | Specificity:          {s.specificity * 100:5.1f}%          |",
            f"| Precision:     {s.precision * 100:5.1f}% | False Alarm Rate (FAR):{s.false_alarm_rate * 100:5.1f}%          |",
            f"| F1-Score:      {s.f1_score:5.3f}  | Negative Pred Value:  {s.npv * 100:5.1f}%          |",
            "+" + "-" * 62 + "+",
        ]
        return "\n".join(lines)
