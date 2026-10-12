"""
audio/generator.py
==================
4000 Hz Acoustic Phonoenterography Synthetic Signal Generator:
  * Ambient background bedroom noise floor
  * Baseline low-frequency enteric bowel rumbling
  * Modulated 380/640 Hz resonant epigastric retch sound bursts
"""

from __future__ import annotations
import math
from typing import Optional
import numpy as np

try:
    from audio.spec import AudioLevel, AUDIO_SPECS, SAMPLING_RATE_HZ
except ImportError:
    from .spec import AudioLevel, AUDIO_SPECS, SAMPLING_RATE_HZ


class AudioSignalGenerator:
    """
    Synthesizes sample-accurate 4000 Hz acoustic phonoenterography signals.
    """

    def __init__(self, fs: int = SAMPLING_RATE_HZ, seed: int = 42) -> None:
        self.fs = fs
        self.rng = np.random.default_rng(seed)
        self.current_time_s = 0.0

    def generate_chunk(
        self,
        duration_s: float = 0.2,
        level: AudioLevel = AudioLevel.NORMAL,
        custom_energy: Optional[float] = None,
    ) -> np.ndarray:
        n_samples = int(round(duration_s * self.fs))
        dt = 1.0 / self.fs
        t_arr = self.current_time_s + np.arange(n_samples) * dt

        spec = AUDIO_SPECS[level]
        energy = custom_energy if custom_energy is not None else spec.default_energy_v2

        if level == AudioLevel.HIGH:
            # Epigastric retch resonance (380 Hz + 640 Hz harmonics)
            amp = np.sqrt(max(energy, 1e-6)) * 2.0
            harmonic = 0.28 * np.sin(2.0 * math.pi * 380.0 * t_arr) + 0.15 * np.sin(2.0 * math.pi * 640.0 * t_arr)
            noise = self.rng.normal(0.0, 0.04, n_samples)
            samples = (amp * harmonic + noise).astype(np.float32)

        elif level == AudioLevel.NORMAL:
            # Low frequency enteric rumble (120 Hz)
            amp = np.sqrt(max(energy, 1e-6)) * 1.5
            rumble = 0.012 * np.sin(2.0 * math.pi * 120.0 * t_arr)
            noise = self.rng.normal(0.0, 0.008, n_samples)
            samples = (amp * rumble + noise).astype(np.float32)

        else:  # LOW (ambient noise floor)
            noise_sigma = np.sqrt(max(energy, 1e-7))
            samples = self.rng.normal(0.0, noise_sigma, n_samples).astype(np.float32)

        self.current_time_s += duration_s
        return samples
