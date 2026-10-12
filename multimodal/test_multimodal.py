"""
multimodal/test_multimodal.py
=============================
Unit tests for MultiModal combined classification:
  - Asserts True Positive (TP) on clinical events (Pre-Emesis, Sudomotor Diaphoresis, Nocturnal Shivering)
  - Asserts True Negative (TN) on normal sleep and non-clinical artifacts (Fluid Spills, Postural Shifts)
  - Asserts False Positive (FP) when artifact triggers false alarm under normal ground truth
  - Asserts False Negative (FN) when sensor misses event under positive ground truth
  - Verifies 2x2 Confusion Matrix statistics
"""

import unittest
from multimodal.types import ClassificationCategory, GroundTruthLabel
from multimodal.classifier import MultiModalClassifier
from multimodal.metrics import ConfusionMatrixTracker


class TestMultiModalClassification(unittest.TestCase):

    def setUp(self):
        self.classifier = MultiModalClassifier(frame_dt_s=0.2)
        self.tracker = ConfusionMatrixTracker()

    def test_true_negative_normal_sleep(self):
        # Normal baseline tuple vs Normal ground truth
        res = self.classifier.evaluate_synthesized_tuple(
            (0, 0, -1, 0), ground_truth=GroundTruthLabel.NORMAL_BASELINE, n_frames=20
        )
        self.assertEqual(res.classification, ClassificationCategory.TRUE_NEGATIVE)
        self.assertFalse(res.is_system_positive)
        self.assertFalse(res.is_ground_truth_positive)

    def test_true_negative_spill_artifact_rejection(self):
        # Fluid spill on bed vs ARTIFACT_SPILL ground truth
        res = self.classifier.evaluate_synthesized_tuple(
            (0, -1, -1, 1), ground_truth=GroundTruthLabel.ARTIFACT_SPILL, n_frames=20
        )
        self.assertEqual(res.classification, ClassificationCategory.TRUE_NEGATIVE)
        self.assertEqual(res.fsm_state, "ARTIFACT_REJECTED")

    def test_true_positive_sudomotor_diaphoresis(self):
        # Sweating tuple (0, 0, -1, 1) vs SUDOMOTOR_DIAPHORESIS ground truth
        res = self.classifier.evaluate_synthesized_tuple(
            (0, 0, -1, 1), ground_truth=GroundTruthLabel.SUDOMOTOR_DIAPHORESIS, n_frames=20
        )
        self.assertEqual(res.classification, ClassificationCategory.TRUE_POSITIVE)
        self.assertTrue(res.sweating_flag)
        self.assertEqual(res.action_trigger, "TURN_ON_FAN_AC")

    def test_true_positive_nocturnal_shivering(self):
        # Shivering tuple (0, 0, 1, 0) vs NOCTURNAL_SHIVERING ground truth
        res = self.classifier.evaluate_synthesized_tuple(
            (0, 0, 1, 0), ground_truth=GroundTruthLabel.NOCTURNAL_SHIVERING, n_frames=20
        )
        self.assertEqual(res.classification, ClassificationCategory.TRUE_POSITIVE)
        self.assertTrue(res.shivering_flag)
        self.assertEqual(res.action_trigger, "TURN_OFF_FAN_AC")

    def test_true_positive_pre_emesis_cascade(self):
        # Multi-modal pre-emesis cascade (1, 1, 1, 1) vs PRE_EMESIS ground truth
        res = self.classifier.evaluate_synthesized_tuple(
            (1, 1, 1, 1), ground_truth=GroundTruthLabel.PRE_EMESIS, n_frames=20
        )
        self.assertEqual(res.classification, ClassificationCategory.TRUE_POSITIVE)
        self.assertEqual(res.fsm_state, "PRE_EMESIS_WARNING")

    def test_false_positive_scenario(self):
        # Simulated test where system activates pre-emesis triad (1, 1, 1, 1) but ground truth was NORMAL_BASELINE
        res = self.classifier.evaluate_synthesized_tuple(
            (1, 1, 1, 1), ground_truth=GroundTruthLabel.NORMAL_BASELINE, n_frames=20
        )
        self.assertEqual(res.classification, ClassificationCategory.FALSE_POSITIVE)

    def test_false_negative_scenario(self):
        # Quiet tuple (0, 0, -1, 0) where ground truth was actually an active PRE_EMESIS event
        res = self.classifier.evaluate_synthesized_tuple(
            (0, 0, -1, 0), ground_truth=GroundTruthLabel.PRE_EMESIS, n_frames=20
        )
        self.assertEqual(res.classification, ClassificationCategory.FALSE_NEGATIVE)

    def test_confusion_matrix_tracker_math(self):
        self.tracker.record(ClassificationCategory.TRUE_POSITIVE)
        self.tracker.record(ClassificationCategory.TRUE_POSITIVE)
        self.tracker.record(ClassificationCategory.TRUE_NEGATIVE)
        self.tracker.record(ClassificationCategory.TRUE_NEGATIVE)
        self.tracker.record(ClassificationCategory.FALSE_POSITIVE)
        self.tracker.record(ClassificationCategory.FALSE_NEGATIVE)

        stats = self.tracker.compute_stats()
        self.assertEqual(stats.tp, 2)
        self.assertEqual(stats.tn, 2)
        self.assertEqual(stats.fp, 1)
        self.assertEqual(stats.fn, 1)
        self.assertEqual(stats.total, 6)

        # Sensitivity = TP / (TP + FN) = 2 / 3 = 0.667
        self.assertAlmostEqual(stats.sensitivity, 2.0 / 3.0, places=3)
        # Specificity = TN / (TN + FP) = 2 / 3 = 0.667
        self.assertAlmostEqual(stats.specificity, 2.0 / 3.0, places=3)
        # Precision = TP / (TP + FP) = 2 / 3 = 0.667
        self.assertAlmostEqual(stats.precision, 2.0 / 3.0, places=3)


if __name__ == "__main__":
    unittest.main()
