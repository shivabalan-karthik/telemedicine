"""
actigraphy/test_actigraphy.py
=============================
Unit tests for Actigraphy Vector Magnitude, bandpass filtering, and shivering detection.
"""

import unittest
import numpy as np
from actigraphy.dsp import ActigraphyProcessor
from actigraphy.generator import ActigraphySignalGenerator
from actigraphy.spec import ActigraphyLevel


class TestActigraphyModule(unittest.TestCase):

    def setUp(self):
        self.processor = ActigraphyProcessor(fs=50)
        self.generator = ActigraphySignalGenerator(fs=50, seed=42)

    def test_calm_sleep_no_shivering(self):
        # 0.25 Hz respiratory sway should be attenuated by 1 Hz highpass filter
        for _ in range(25):
            samples = self.generator.generate_chunk(duration_s=0.2, level=ActigraphyLevel.NORMAL)
            metrics = self.processor.process_samples(samples)

        self.assertFalse(metrics.shivering_detected)
        self.assertFalse(metrics.macro_postural_shift_detected)
        self.assertLess(metrics.actigraphy_vm_rms, 0.04)

    def test_shivering_tremor_detection(self):
        # 4.2 Hz clonic tremor should trigger shivering_detected = True
        for _ in range(25):
            samples = self.generator.generate_chunk(duration_s=0.2, level=ActigraphyLevel.HIGH)
            metrics = self.processor.process_samples(samples)

        self.assertTrue(metrics.shivering_detected)
        self.assertFalse(metrics.macro_postural_shift_detected)
        self.assertGreater(metrics.actigraphy_vm_rms, 0.04)
        self.assertLess(metrics.actigraphy_vm_rms, 0.22)

    def test_macro_postural_shift_artifact(self):
        for _ in range(25):
            samples = self.generator.generate_chunk(duration_s=0.2, is_macro_shift=True)
            metrics = self.processor.process_samples(samples)

        self.assertTrue(metrics.macro_postural_shift_detected)


if __name__ == "__main__":
    unittest.main()
