"""
test_81_permutations.py
=======================
Exhaustive Unit Test Suite for All 81 Sensor Permutations:
  Asserts that 100.0% of the 81 combinations of (cECG, Audio, Actigraphy, Impedance) in {-1, 0, 1}^4
  deterministically match the Master Clinical Truth Table specification:
    - Expected FSM State
    - Expected Moore Action Trigger
    - Strict Binary Outcome (TRUE_POSITIVE or TRUE_NEGATIVE)
"""

import unittest
from truth_table_81 import MASTER_TRUTH_TABLE_81, PermutationCaseSpec
from fsm.engine import HybridMooreEFSM
from fsm.types import BinaryOutcome, FSMState, ActionTrigger


class TestAll81Permutations(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.fsm = HybridMooreEFSM(frame_dt_s=0.2, min_persistence_frames=3)

    def test_golden_baseline_0_0_0_0(self):
        """Verifies that (0,0,0,0) is strictly the Golden Baseline (patient in absolutely stable state)."""
        report = self.fsm.evaluate_synthesized_tuple((0, 0, 0, 0), ground_truth_label="NORMAL_BASELINE", n_frames=20)
        self.assertEqual(report.fsm_state, FSMState.BASELINE)
        self.assertEqual(report.action_trigger, ActionTrigger.LOG_TELEMETRY)
        self.assertEqual(report.outcome, BinaryOutcome.TRUE_NEGATIVE)
        self.assertFalse(report.shivering_flag)
        self.assertFalse(report.sweating_flag)
        self.assertFalse(report.spill_flag)
        self.assertFalse(report.macro_shift_flag)

    def test_all_81_permutations_exhaustive(self):
        """Iterates through all 81 permutations and verifies 100% compliance with Master Truth Table."""
        total_cases = len(MASTER_TRUTH_TABLE_81)
        passed_cases = 0
        failures = []

        for tup, spec in MASTER_TRUTH_TABLE_81.items():
            self.fsm.reset()
            gt = "POSITIVE" if spec.strict_binary_outcome == "TRUE_POSITIVE" else "NEGATIVE"
            if spec.expected_fsm_state == "ARTIFACT_REJECTED":
                gt = "ARTIFACT_SPILL" if "Spill" in spec.scenario_name else "ARTIFACT_POSTURAL_SHIFT"

            report = self.fsm.evaluate_synthesized_tuple(tup, ground_truth_label=gt, n_frames=20)

            # Check outcome
            outcome_match = (report.outcome.value == spec.strict_binary_outcome)
            state_match = (report.fsm_state.value == spec.expected_fsm_state)
            action_match = (report.action_trigger.value == spec.expected_action_trigger)

            if outcome_match and state_match and action_match:
                passed_cases += 1
            else:
                failures.append(
                    f"FAIL on {spec.case_id} {spec.tuple_str}: Expected [State={spec.expected_fsm_state}, Action={spec.expected_action_trigger}, Outcome={spec.strict_binary_outcome}], "
                    f"Got [State={report.fsm_state.value}, Action={report.action_trigger.value}, Outcome={report.outcome.value}]"
                )

        if failures:
            print(f"\nDiscrepancies found in {len(failures)} cases:")
            for f in failures[:10]:
                print(f"  * {f}")

        accuracy = (passed_cases / total_cases) * 100.0
        self.assertEqual(passed_cases, total_cases, f"Expected 100.0% accuracy across all 81 cases, achieved {accuracy:.1f}% ({passed_cases}/{total_cases})")


if __name__ == "__main__":
    unittest.main()
