"""
audio/test_audio.py
===================
Unit tests for Acoustic Phonoenterography bandpass filtering, Short-Time Energy, and retch burst detection.
"""

import unittest
import numpy as np
from audio.dsp import AcousticProcessor
from audio.generator import AudioSignalGenerator
from audio.spec import AudioLevel


class TestAudioModule(unittest.TestCase):

    def setUp(self):
        self.processor = AcousticProcessor(fs=4000)
        self.generator = AudioSignalGenerator(fs=4000, seed=42)

    def test_normal_murmur_no_burst(self):
        for _ in range(20):
            samples = self.generator.generate_chunk(duration_s=0.2, level=AudioLevel.NORMAL)
            metrics = self.processor.process_samples(samples)

        self.assertFalse(metrics.acoustic_burst_detected)
        self.assertLess(metrics.acoustic_short_time_energy, 0.002)

    def test_retching_burst_detection(self):
        for _ in range(20):
            samples = self.generator.generate_chunk(duration_s=0.2, level=AudioLevel.HIGH)
            metrics = self.processor.process_samples(samples)

        self.assertTrue(metrics.acoustic_burst_detected)
        self.assertGreater(metrics.acoustic_short_time_energy, 0.002)


if __name__ == "__main__":
    unittest.main()
