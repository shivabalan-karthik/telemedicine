"""
cecg/test_cecg.py
=================
Unit tests for cECG Pan-Tompkins QRS detector and HRV feature extraction.
"""

import unittest
import numpy as np
from cecg.dsp import PanTompkinsECGProcessor
from cecg.generator import CECGSignalGenerator
from cecg.spec import CECGLevel, CECG_SPECS


class TestCECGModule(unittest.TestCase):

    def setUp(self):
        self.processor = PanTompkinsECGProcessor(fs=250)
        self.generator = CECGSignalGenerator(fs=250, seed=42)

    def test_normal_heart_rate_detection(self):
        target_hr = 65.0
        # Stream 8 seconds of data (40 frames of 0.2s)
        for _ in range(40):
            samples = self.generator.generate_chunk(duration_s=0.2, custom_hr=target_hr)
            metrics = self.processor.process_samples(samples)

        # Ensure estimated heart rate is close to target 65 BPM (within +- 6 BPM)
        self.assertAlmostEqual(metrics.heart_rate_bpm, target_hr, delta=6.0)
        self.assertGreater(metrics.rmssd_ms, 15.0)

    def test_bradycardia_detection(self):
        target_hr = 45.0
        for _ in range(50):
            samples = self.generator.generate_chunk(duration_s=0.2, custom_hr=target_hr)
            metrics = self.processor.process_samples(samples)

        self.assertLess(metrics.heart_rate_bpm, 55.0)


if __name__ == "__main__":
    unittest.main()
