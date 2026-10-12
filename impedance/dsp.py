"""
impedance/dsp.py
================
E-Textile Impedance / Skin Conductance (EDA) DSP Processor:
  1. Exponential Moving Average (EMA) tonic baseline tracker
  2. Phasic delta-conductance: dG = G(t) - G_tonic
  3. First-order derivative slew-rate differentiator: dG / dt (uS/s)
  4. Spill vs. Diaphoresis Disambiguation:
     - Fluid spill: Slew rate > 20 uS/s or sudden massive step jump > 30 uS
     - Cold sweat diaphoresis: Slew rate 0.5 - 12 uS/s with smooth physiological rise (dG in [4, 25] uS)
"""

from __future__ import annotations
from dataclasses import dataclass
import numpy as np


@dataclass
class ImpedanceMetrics:
    timestamp_s: float
    impedance_raw_uS: float
    impedance_baseline_uS: float
    impedance_delta_uS: float
    impedance_slew_rate_uS_s: float
    diaphoresis_detected: bool
    fluid_spill_signature: bool


class ImpedanceProcessor:
    """
    E-Textile Impedance / Skin Conductance (EDA) Processor (20 Hz).
    """

    def __init__(self, fs: int = 20) -> None:
        self.fs = fs
        self.baseline_uS: float = 3.5
        self.ema_alpha: float = 0.02
        self.prev_sample_uS: float = 3.5
        self.spill_latch: bool = False

    def reset(self) -> None:
        self.baseline_uS = 3.5
        self.prev_sample_uS = 3.5
        self.spill_latch = False

    def process_samples(self, imp_raw: np.ndarray, timestamp_s: float = 0.0) -> ImpedanceMetrics:
        """
        Processes impedance sample block.
        imp_raw: array of conductance in microSiemens (uS).
        """
        if len(imp_raw) == 0:
            return ImpedanceMetrics(
                timestamp_s=timestamp_s,
                impedance_raw_uS=self.prev_sample_uS,
                impedance_baseline_uS=self.baseline_uS,
                impedance_delta_uS=0.0,
                impedance_slew_rate_uS_s=0.0,
                diaphoresis_detected=False,
                fluid_spill_signature=False,
            )

        current_val = float(imp_raw[-1])
        dt = float(len(imp_raw)) / float(self.fs)

        # 1. Slew rate calculation (uS / second)
        slew_rate = abs(current_val - self.prev_sample_uS) / max(dt, 1e-4)

        # 2. Phasic delta conductance
        delta_uS = current_val - self.baseline_uS

        # 3. Disambiguation logic:
        # Extreme slew rate (>20 uS/s) or massive step jump indicates liquid spill
        if slew_rate > 20.0 or (delta_uS > 30.0 and slew_rate > 8.0):
            self.spill_latch = True
        elif delta_uS < 5.0:
            self.spill_latch = False

        is_spill = self.spill_latch or (delta_uS > 35.0)

        # Cold sweat diaphoresis: delta_uS >= 4.0 uS with physiological amplitude (< 25 uS) and not a spill
        is_diaphoresis = (4.0 <= delta_uS <= 25.0) and (not is_spill)

        # Update baseline slowly ONLY during quiet non-spill / non-sweat states
        if not is_spill and not is_diaphoresis and abs(delta_uS) < 1.0:
            for val in imp_raw:
                self.baseline_uS = (1.0 - self.ema_alpha) * self.baseline_uS + self.ema_alpha * float(val)

        self.prev_sample_uS = current_val

        return ImpedanceMetrics(
            timestamp_s=timestamp_s,
            impedance_raw_uS=current_val,
            impedance_baseline_uS=self.baseline_uS,
            impedance_delta_uS=delta_uS,
            impedance_slew_rate_uS_s=slew_rate,
            diaphoresis_detected=is_diaphoresis,
            fluid_spill_signature=is_spill,
        )
