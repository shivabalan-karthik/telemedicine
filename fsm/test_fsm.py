"""
fsm/test_fsm.py
===============
Unit tests for the Hybrid Moore-EFSM Clinical Verification Engine:
  - Asserts strict BinaryOutcome resolution (only TRUE_POSITIVE or TRUE_NEGATIVE)
  - Asserts TRUE_POSITIVE on confirmed clinical events (Pre-Emesis, Sudomotor Diaphoresis, Nocturnal Shivering)
  - Asserts TRUE_NEGATIVE on normal sleep and non-clinical artifacts (Fluid Spills, Postural Movements)
  - Validates Moore machine deterministic action trigger mapping
  - Validates EFSM temporal persistence gate
"""

import unittest
from fsm.types import BinaryOutcome, FSMState, ActionTrigger, VerificationStatus
from fsm.engine import HybridMooreEFSM
from fsm.arbitrator import ClinicalArbitrator


class TestHybridMooreEFSM(unittest.TestCase):

    def setUp(self):
        self.fsm = HybridMooreEFSM(frame_dt_s=0.2, min_persistence_frames=3)
        self.arbitrator = ClinicalArbitrator()

    def test_strict_binary_outcome_type(self):
        """Verifies that all evaluated conditions return strictly either TRUE_POSITIVE or TRUE_NEGATIVE."""
        tuples_and_gt = [
            ((0, 0, -1, 0), "NORMAL_BASELINE"),
            ((0, -1, -1, 1), "ARTIFACT_SPILL"),
            ((0, -1, 1, 0), "ARTIFACT_POSTURAL_SHIFT"),
            ((0, 0, -1, 1), "SUDOMOTOR_DIAPHORESIS"),
            ((0, 0, 1, 0), "NOCTURNAL_SHIVERING"),
            ((1, 0, 0, 1), "AUTONOMIC_VAGAL_SURGE"),
            ((1, 1, 0, 1), "PRE_EMESIS"),
            ((1, 1, 1, 1), "ACTIVE_EMESIS"),
        ]

        for tup, gt in tuples_and_gt:
            report = self.fsm.evaluate_synthesized_tuple(tup, ground_truth_label=gt, n_frames=20)
            self.assertIn(report.outcome, [BinaryOutcome.TRUE_POSITIVE, BinaryOutcome.TRUE_NEGATIVE])

    def test_true_positive_sudomotor_diaphoresis(self):
        """Sudomotor cold sweat triggers FAN_ON and resolves strictly to TRUE_POSITIVE."""
        report = self.fsm.evaluate_synthesized_tuple(
            (0, 0, -1, 1), ground_truth_label="SUDOMOTOR_DIAPHORESIS", n_frames=20
        )
        self.assertEqual(report.outcome, BinaryOutcome.TRUE_POSITIVE)
        self.assertEqual(report.action_trigger, ActionTrigger.FAN_AC_ON)
        self.assertTrue(report.sweating_flag)

    def test_true_positive_nocturnal_shivering(self):
        """4.2 Hz shivering tremor triggers FAN_OFF and resolves strictly to TRUE_POSITIVE."""
        report = self.fsm.evaluate_synthesized_tuple(
            (0, 0, 1, 0), ground_truth_label="NOCTURNAL_SHIVERING", n_frames=20
        )
        self.assertEqual(report.outcome, BinaryOutcome.TRUE_POSITIVE)
        self.assertEqual(report.action_trigger, ActionTrigger.FAN_AC_OFF)
        self.assertTrue(report.shivering_flag)

    def test_true_positive_pre_emesis_aspiration_protection(self):
        """Pre-emesis triad (1, 1, 0, 1) triggers BED_ELEVATE_30DEG and resolves strictly to TRUE_POSITIVE."""
        report = self.fsm.evaluate_synthesized_tuple(
            (1, 1, 0, 1), ground_truth_label="PRE_EMESIS", n_frames=20
        )
        self.assertEqual(report.outcome, BinaryOutcome.TRUE_POSITIVE)
        self.assertEqual(report.fsm_state, FSMState.PRE_EMESIS_WARNING)
        self.assertEqual(report.action_trigger, ActionTrigger.BED_ELEVATE_30DEG_ALERT_STAFF)

    def test_true_positive_active_emesis_event(self):
        """Active emesis (1, 1, 1, 1) triggers EMERGENCY_ALARM and resolves strictly to TRUE_POSITIVE."""
        report = self.fsm.evaluate_synthesized_tuple(
            (1, 1, 1, 1), ground_truth_label="ACTIVE_EMESIS", n_frames=20
        )
        self.assertEqual(report.outcome, BinaryOutcome.TRUE_POSITIVE)
        self.assertEqual(report.fsm_state, FSMState.ACTIVE_EMESIS_EVENT)
        self.assertEqual(report.action_trigger, ActionTrigger.EMERGENCY_ALARM_SUCTION_READY)

    def test_true_negative_fluid_spill_artifact_rejection(self):
        """Fluid spill step jump is rejected by arbitrator and resolves strictly to TRUE_NEGATIVE."""
        report = self.fsm.evaluate_synthesized_tuple(
            (0, -1, -1, 1), ground_truth_label="ARTIFACT_SPILL", n_frames=20
        )
        self.assertEqual(report.outcome, BinaryOutcome.TRUE_NEGATIVE)
        self.assertEqual(report.fsm_state, FSMState.ARTIFACT_REJECTED)
        self.assertEqual(report.action_trigger, ActionTrigger.SUPPRESS_ALERT_LOG_ARTIFACT)

    def test_true_negative_postural_shift_artifact_rejection(self):
        """Gross postural body shift is rejected and resolves strictly to TRUE_NEGATIVE."""
        report = self.fsm.evaluate_synthesized_tuple(
            (0, -1, 1, 0), ground_truth_label="ARTIFACT_POSTURAL_SHIFT", n_frames=20
        )
        self.assertEqual(report.outcome, BinaryOutcome.TRUE_NEGATIVE)
        self.assertEqual(report.fsm_state, FSMState.ARTIFACT_REJECTED)
        self.assertEqual(report.action_trigger, ActionTrigger.SUPPRESS_ALERT_LOG_ARTIFACT)

    def test_efsm_persistence_filter_satisfaction(self):
        """Checks that EFSM transitions require multi-frame persistence."""
        fsm_short = HybridMooreEFSM(frame_dt_s=0.2, min_persistence_frames=3)
        # 1 frame alone should not flip state immediately
        rep_1 = fsm_short.evaluate_synthesized_tuple((1, 1, 0, 1), ground_truth_label="PRE_EMESIS", n_frames=1)
        self.assertEqual(rep_1.fsm_state, FSMState.BASELINE)

        # 20 frames sustains persistence and completes transition
        rep_20 = fsm_short.evaluate_synthesized_tuple((1, 1, 0, 1), ground_truth_label="PRE_EMESIS", n_frames=20)
        self.assertEqual(rep_20.fsm_state, FSMState.PRE_EMESIS_WARNING)


if __name__ == "__main__":
    unittest.main()
