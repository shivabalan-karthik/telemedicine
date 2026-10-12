"""
impedance/generator.py
======================
20 Hz E-Textile Impedance / Skin Conductance (EDA) Synthetic Signal Generator:
  * Tonic baseline (~3.5 uS)
  * Smooth physiological exponential rise for cold sweat diaphoresis (slew rate ~ 2.0 uS/s)
  * Instantaneous high-slew step jump for accidental bed fluid spills (>45 uS)
"""

from __future__ import annotations
import math
from typing import Optional
import numpy as np

try:
    from impedance.spec import ImpedanceLevel, IMPEDANCE_SPECS, SAMPLING_RATE_HZ
except ImportError:
    from .spec import ImpedanceLevel, IMPEDANCE_SPECS, SAMPLING_RATE_HZ


class ImpedanceSignalGenerator:
    """
    Synthesizes sample-accurate 20 Hz E-textile skin conductance signals in microSiemens (uS).
    """

    def __init__(self, fs: int = SAMPLING_RATE_HZ, seed: int = 42) -> None:
        self.fs = fs
        self.rng = np.random.default_rng(seed)
        self.current_time_s = 0.0
        self.current_conductance_uS = 3.5

    def generate_chunk(
        self,
        duration_s: float = 0.2,
        level: ImpedanceLevel = ImpedanceLevel.NORMAL,
        is_fluid_spill: bool = False,
    ) -> np.ndarray:
        n_samples = int(round(duration_s * self.fs))
        spec = IMPEDANCE_SPECS[level]

        if is_fluid_spill:
            # Sudden step jump of 45 uS
            self.current_conductance_uS = 45.0
        elif level == ImpedanceLevel.HIGH:
            # Smooth physiological rise towards target (14 uS)
            self.current_conductance_uS += 0.15 * (spec.default_val_us - self.current_conductance_uS)
        elif level == ImpedanceLevel.LOW:
            self.current_conductance_uS += 0.15 * (spec.default_val_us - self.current_conductance_uS)
        else:
            self.current_conductance_uS += 0.15 * (spec.default_val_us - self.current_conductance_uS)

        noise = self.rng.normal(0.0, 0.02, n_samples)
        samples = (np.full(n_samples, self.current_conductance_uS) + noise).astype(np.float32)

        self.current_time_s += duration_s
        return samples
