"""
impedance/test_impedance.py
===========================
Unit tests for E-Textile Impedance baseline tracking and sweat vs spill differentiation.
"""

import unittest
import numpy as np
from impedance.dsp import ImpedanceProcessor
from impedance.generator import ImpedanceSignalGenerator
from impedance.spec import ImpedanceLevel


class TestImpedanceModule(unittest.TestCase):

    def setUp(self):
        self.processor = ImpedanceProcessor(fs=20)
        self.generator = ImpedanceSignalGenerator(fs=20, seed=42)

    def test_normal_baseline(self):
        for _ in range(20):
            samples = self.generator.generate_chunk(duration_s=0.2, level=ImpedanceLevel.NORMAL)
            metrics = self.processor.process_samples(samples)

        self.assertFalse(metrics.diaphoresis_detected)
        self.assertFalse(metrics.fluid_spill_signature)
        self.assertAlmostEqual(metrics.impedance_raw_uS, 3.5, delta=0.5)

    def test_sudomotor_sweating_diaphoresis(self):
        for _ in range(20):
            samples = self.generator.generate_chunk(duration_s=0.2, level=ImpedanceLevel.HIGH)
            metrics = self.processor.process_samples(samples)

        self.assertTrue(metrics.diaphoresis_detected)
        self.assertFalse(metrics.fluid_spill_signature)
        self.assertGreater(metrics.impedance_delta_uS, 4.0)

    def test_fluid_spill_detection(self):
        # Step jump of 45 uS
        samples = self.generator.generate_chunk(duration_s=0.2, is_fluid_spill=True)
        metrics = self.processor.process_samples(samples)

        self.assertTrue(metrics.fluid_spill_signature)


if __name__ == "__main__":
    unittest.main()
