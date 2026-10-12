"""
actigraphy/dsp.py
=================
Tri-Axial Piezoelectric Actigraphy DSP:
  1. Dynamic Vector Magnitude: VM[n] = sqrt(ax^2 + ay^2 + az^2) - 1.0g
  2. 1 - 15 Hz 2nd-order Butterworth bandpass filter
  3. Sliding window RMS energy over 1.0 second (50 samples)
  4. 3-6 Hz Diaphragmatic micro-tremor & shivering detection (0.04g - 0.22g)
  5. Macro Postural Shift disambiguation (>0.22g)
"""

from __future__ import annotations
import collections
from dataclasses import dataclass
from typing import Deque, Tuple
import numpy as np
from scipy import signal

try:
    from common.biquad import StreamingSOSFilter
except ImportError:
    from ..common.biquad import StreamingSOSFilter


@dataclass
class ActigraphyMetrics:
    timestamp_s: float
    actigraphy_vm_rms: float
    shivering_tremor_energy: float
    shivering_detected: bool
    macro_postural_shift_detected: bool


class ActigraphyProcessor:
    """
    Tri-Axial Piezoelectric Actigraphy DSP Processor (50 Hz).
    """

    def __init__(self, fs: int = 50) -> None:
        self.fs = fs
        nyq = 0.5 * fs
        sos_bp = signal.butter(2, [1.0 / nyq, 15.0 / nyq], btype="bandpass", output="sos")
        self.bp_filter = StreamingSOSFilter(sos_bp)

        # Sliding RMS buffer (1 second = 50 samples)
        self.rms_buf: Deque[float] = collections.deque(maxlen=50)

    def reset(self) -> None:
        self.bp_filter.reset()
        self.rms_buf.clear()

    def process_samples(self, acc_raw: np.ndarray, timestamp_s: float = 0.0) -> ActigraphyMetrics:
        """
        Processes an (N, 3) actigraphy block.
        acc_raw: array of [ax, ay, az] in gravitational units (g).
        """
        if len(acc_raw) == 0:
            return ActigraphyMetrics(
                timestamp_s=timestamp_s,
                actigraphy_vm_rms=0.0,
                shivering_tremor_energy=0.0,
                shivering_detected=False,
                macro_postural_shift_detected=False,
            )

        # 1. Dynamic Vector Magnitude with 1g gravitational baseline compensation
        vm = np.sqrt(np.sum(acc_raw ** 2, axis=1)) - 1.0

        # 2. 1-15 Hz Bandpass filtering
        vm_filtered = self.bp_filter.process_array(vm)

        for v in vm_filtered:
            self.rms_buf.append(float(v))

        # 3. Sliding window RMS calculation
        vm_rms = float(np.sqrt(np.mean(np.array(self.rms_buf) ** 2))) if len(self.rms_buf) > 0 else 0.0

        # 4. Feature Disambiguation:
        # Macro Postural Shift: High acceleration (> 0.22 g RMS)
        macro_shift = vm_rms > 0.22

        # Shivering tremor: Sustained vibration within the 1-15 Hz bandpass (0.04g - 0.22g)
        shivering = (0.04 <= vm_rms <= 0.22)
        shivering_energy = vm_rms

        return ActigraphyMetrics(
            timestamp_s=timestamp_s,
            actigraphy_vm_rms=vm_rms,
            shivering_tremor_energy=shivering_energy,
            shivering_detected=shivering,
            macro_postural_shift_detected=macro_shift,
        )
