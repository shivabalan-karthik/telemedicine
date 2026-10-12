"""
common/biquad.py
================
Second-Order IIR (Biquad) Filter using Direct Form II Transposed structure
and Cascaded SOS (Second-Order Sections) filter for strict O(1) per-sample execution.
"""

from __future__ import annotations
from typing import List
import numpy as np


class StreamingBiquadFilter:
    """
    Second-Order IIR (Biquad) Filter using Direct Form II Transposed structure.
    Guarantees O(1) per-sample execution with minimal memory footprint (2 state registers).

    Difference equation:
      y[n] = b0 * x[n] + s1[n-1]
      s1[n] = b1 * x[n] - a1 * y[n] + s2[n-1]
      s2[n] = b2 * x[n] - a2 * y[n]
    """

    def __init__(self, b: np.ndarray, a: np.ndarray) -> None:
        assert len(b) == 3 and len(a) == 3, "Biquad filter requires 3 coefficients for b and a."
        a0 = float(a[0])
        self.b0 = float(b[0]) / a0
        self.b1 = float(b[1]) / a0
        self.b2 = float(b[2]) / a0
        self.a1 = float(a[1]) / a0
        self.a2 = float(a[2]) / a0

        # State registers
        self.s1: float = 0.0
        self.s2: float = 0.0

    def reset(self) -> None:
        """Resets filter memory states to zero."""
        self.s1 = 0.0
        self.s2 = 0.0

    def process_sample(self, x: float) -> float:
        """Processes a single sample x[n] in O(1) time."""
        y = self.b0 * x + self.s1
        self.s1 = self.b1 * x - self.a1 * y + self.s2
        self.s2 = self.b2 * x - self.a2 * y
        return y

    def process_array(self, x_arr: np.ndarray) -> np.ndarray:
        """Processes an array of samples sequentially in O(N) time."""
        out = np.empty_like(x_arr, dtype=np.float32)
        for i in range(len(x_arr)):
            out[i] = self.process_sample(float(x_arr[i]))
        return out


class StreamingSOSFilter:
    """
    Cascaded Second-Order Sections (SOS) IIR Filter for high-order stable filtering.
    """

    def __init__(self, sos: np.ndarray) -> None:
        """
        sos is shape (n_sections, 6), each row: [b0, b1, b2, a0, a1, a2]
        """
        self.sections: List[StreamingBiquadFilter] = []
        for row in sos:
            b = row[0:3]
            a = row[3:6]
            self.sections.append(StreamingBiquadFilter(b, a))

    def reset(self) -> None:
        for sec in self.sections:
            sec.reset()

    def process_sample(self, x: float) -> float:
        val = x
        for sec in self.sections:
            val = sec.process_sample(val)
        return val

    def process_array(self, x_arr: np.ndarray) -> np.ndarray:
        val = x_arr
        for sec in self.sections:
            val = sec.process_array(val)
        return val
