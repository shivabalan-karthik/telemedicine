"""
cecg/generator.py
=================
250 Hz Capacitive Non-Contact ECG Synthetic Signal Generator:
  * Multi-Gaussian cardiac waveform (P, Q, R, S, T waves)
  * Modulated heart rate and respiratory sinus arrhythmia (RSA)
  * Realistic capacitive coupling thermal noise, 50 Hz powerline hum, and motion artifact
"""

from __future__ import annotations
import math
from typing import Generator, List, Optional
import numpy as np

try:
    from cecg.spec import CECGLevel, CECG_SPECS, SAMPLING_RATE_HZ
except ImportError:
    from .spec import CECGLevel, CECG_SPECS, SAMPLING_RATE_HZ


class CECGSignalGenerator:
    """
    Synthesizes sample-accurate 250 Hz cECG signals.
    """

    def __init__(self, fs: int = SAMPLING_RATE_HZ, seed: int = 42) -> None:
        self.fs = fs
        self.rng = np.random.default_rng(seed)
        self.phase = 0.0
        self.current_hr_bpm = 65.0
        self.current_time_s = 0.0

    def generate_sample(
        self,
        t: float,
        target_hr: float = 65.0,
        add_motion_artifact: bool = False,
    ) -> float:
        dt = 1.0 / self.fs
        if target_hr >= 80.0:
            # Autonomic vagal surge / high HRV modulation (RMSSD > 75 ms)
            dyn_hr = target_hr + 12.0 * math.sin(2.0 * math.pi * 0.35 * t)
        else:
            dyn_hr = target_hr + 0.6 * math.sin(2.0 * math.pi * 0.15 * t)

        # Smoothly track target heart rate
        self.current_hr_bpm += 0.05 * (dyn_hr - self.current_hr_bpm)
        freq_hz = self.current_hr_bpm / 60.0
        self.phase = (self.phase + 2.0 * math.pi * freq_hz * dt) % (2.0 * math.pi)

        # Multi-Gaussian ECG Waveform (amplitude, width, center offset)
        theta = self.phase - math.pi
        gaussians = [
            (0.18, 0.08, -math.pi / 3.0),   # P-wave
            (-0.15, 0.03, -math.pi / 12.0), # Q-wave
            (1.45, 0.02, 0.0),              # R-wave
            (-0.35, 0.04, math.pi / 14.0),  # S-wave
            (0.32, 0.18, math.pi / 2.2),    # T-wave
        ]

        val = 0.0
        for a, b, theta0 in gaussians:
            dtheta = (theta - theta0 + math.pi) % (2.0 * math.pi) - math.pi
            val += a * math.exp(-0.5 * (dtheta / b) ** 2)

        # Respiratory sinus wander (0.25 Hz)
        resp_wander = 0.12 * math.sin(2.0 * math.pi * 0.25 * t)
        # Powerline 50 Hz hum
        hum = 0.04 * math.sin(2.0 * math.pi * 50.0 * t)
        # Thermal/capacitive noise
        noise = self.rng.normal(0.0, 0.02)

        motion = 0.0
        if add_motion_artifact:
            motion = 0.65 * math.sin(2.0 * math.pi * 1.8 * t)

        return float(val + resp_wander + hum + noise + motion)

    def generate_chunk(
        self,
        duration_s: float = 0.2,
        level: CECGLevel = CECGLevel.NORMAL,
        custom_hr: Optional[float] = None,
        add_motion_artifact: bool = False,
    ) -> np.ndarray:
        target_hr = custom_hr if custom_hr is not None else CECG_SPECS[level].default_hr_bpm
        n_samples = int(round(duration_s * self.fs))
        samples = np.empty(n_samples, dtype=np.float32)

        for i in range(n_samples):
            t = self.current_time_s + i * (1.0 / self.fs)
            samples[i] = self.generate_sample(t, target_hr, add_motion_artifact)

        self.current_time_s += duration_s
        return samples
