"""
actigraphy/generator.py
=======================
50 Hz Tri-Axial Piezoelectric Actigraphy Synthetic Signal Generator:
  * Baseline 1.0g on Z-axis (patient lying supine)
  * Frequency-aware injection for 1-15 Hz bandpass testing:
      - LOW (-1): Near-DC minimal noise floor (<0.008g)
      - NORMAL (0): 0.25 Hz respiratory chest sway (attenuated by 1 Hz highpass filter -> filtered RMS ~0.008g)
      - HIGH (1): 4.2 Hz clonic shivering tremor (0.095g amplitude -> filtered RMS ~0.067g)
      - MACRO SHIFT: High amplitude sudden body repositioning roll (>0.5g)
"""

from __future__ import annotations
import math
from typing import Optional
import numpy as np

try:
    from actigraphy.spec import ActigraphyLevel, ACTIGRAPHY_SPECS, SAMPLING_RATE_HZ
except ImportError:
    from .spec import ActigraphyLevel, ACTIGRAPHY_SPECS, SAMPLING_RATE_HZ


class ActigraphySignalGenerator:
    """
    Synthesizes sample-accurate 50 Hz 3-axis actigraphy signals [ax, ay, az].
    """

    def __init__(self, fs: int = SAMPLING_RATE_HZ, seed: int = 42) -> None:
        self.fs = fs
        self.rng = np.random.default_rng(seed)
        self.current_time_s = 0.0

    def generate_chunk(
        self,
        duration_s: float = 0.2,
        level: ActigraphyLevel = ActigraphyLevel.NORMAL,
        is_macro_shift: bool = False,
    ) -> np.ndarray:
        n_samples = int(round(duration_s * self.fs))
        dt = 1.0 / self.fs
        t_arr = self.current_time_s + np.arange(n_samples) * dt

        spec = ACTIGRAPHY_SPECS[level]

        if is_macro_shift:
            # Sudden high-amplitude roll/repositioning
            shift_env = 0.85
            ax = shift_env * np.sin(2.0 * math.pi * 1.5 * t_arr) + self.rng.normal(0.0, 0.02, n_samples)
            ay = shift_env * np.cos(2.0 * math.pi * 2.0 * t_arr) + self.rng.normal(0.0, 0.02, n_samples)
            az = 1.0 + shift_env * np.sin(2.0 * math.pi * 1.2 * t_arr) + self.rng.normal(0.0, 0.02, n_samples)

        elif level == ActigraphyLevel.HIGH:
            # 4.2 Hz clonic shivering tremor
            acc_amp = spec.default_rms_g * math.sqrt(2.0)
            freq = spec.target_freq_hz
            ax = acc_amp * np.sin(2.0 * math.pi * freq * t_arr) + self.rng.normal(0.0, 0.004, n_samples)
            ay = acc_amp * np.cos(2.0 * math.pi * freq * t_arr) + self.rng.normal(0.0, 0.004, n_samples)
            az = 1.0 + acc_amp * 0.5 * np.sin(2.0 * math.pi * freq * t_arr) + self.rng.normal(0.0, 0.004, n_samples)

        elif level == ActigraphyLevel.NORMAL:
            # 0.25 Hz slow respiratory sway (falls below 1 Hz bandpass cutoff)
            acc_amp = spec.default_rms_g * math.sqrt(2.0)
            freq = spec.target_freq_hz
            ax = acc_amp * np.sin(2.0 * math.pi * freq * t_arr) + self.rng.normal(0.0, 0.003, n_samples)
            ay = acc_amp * np.cos(2.0 * math.pi * freq * t_arr) + self.rng.normal(0.0, 0.003, n_samples)
            az = 1.0 + self.rng.normal(0.0, 0.003, n_samples)

        else:  # LOW
            ax = self.rng.normal(0.0, spec.default_rms_g, n_samples)
            ay = self.rng.normal(0.0, spec.default_rms_g, n_samples)
            az = 1.0 + self.rng.normal(0.0, spec.default_rms_g, n_samples)

        self.current_time_s += duration_s
        return np.column_stack([ax, ay, az]).astype(np.float32)
