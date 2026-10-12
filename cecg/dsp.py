"""
cecg/dsp.py
===========
Streaming Real-Time Pan-Tompkins QRS Peak Detector & HRV (RMSSD) Analyzer:
  1. Bandpass filter: 0.5 - 40 Hz 2nd-order Butterworth
  2. 5-point Derivative: y[n] = (1/8T) * [2x[n] + x[n-1] - x[n-3] - 2x[n-4]]
  3. Nonlinear Squaring: y[n] = (x[n])^2
  4. Moving Window Integration (MWI): ~150 ms sliding window
  5. Dual Adaptive Thresholding (Signal Peak SPKI & Noise Peak NPKI)
  6. Physiological 250 ms Refractory Blanking
  7. Sliding Window RMSSD (HRV) & Heart Rate (BPM) calculation
"""

from __future__ import annotations
import collections
from dataclasses import dataclass
from typing import Deque, List, Optional, Tuple
import numpy as np
from scipy import signal

try:
    from common.biquad import StreamingSOSFilter
except ImportError:
    from ..common.biquad import StreamingSOSFilter


@dataclass
class CECGMetrics:
    timestamp_s: float
    heart_rate_bpm: float
    rmssd_ms: float
    r_peaks_detected_count: int
    hrv_surge_detected: bool


class PanTompkinsECGProcessor:
    """
    Real-Time Pan-Tompkins QRS Peak Detector & HRV (RMSSD) Analyzer.
    Sampling rate: 250 Hz
    """

    def __init__(self, fs: int = 250) -> None:
        self.fs = fs

        # Design 0.5 - 40 Hz 2nd-order Butterworth bandpass filter
        nyq = 0.5 * fs
        sos_bp = signal.butter(2, [0.5 / nyq, 40.0 / nyq], btype="bandpass", output="sos")
        self.bandpass = StreamingSOSFilter(sos_bp)

        # Derivative circular buffer (5 samples)
        self._diff_buf: Deque[float] = collections.deque([0.0] * 5, maxlen=5)

        # MWI Window length (150 ms = 37 samples at 250 Hz)
        self.mwi_window_len = int(round(0.150 * fs))
        self._mwi_buf: Deque[float] = collections.deque([0.0] * self.mwi_window_len, maxlen=self.mwi_window_len)
        self._mwi_sum: float = 0.0

        # Peak detection local maximum state registers
        self._prev_mwi: float = 0.0
        self._prev_prev_mwi: float = 0.0
        self._first_peak_seen: bool = False

        # Pan-Tompkins Adaptive Thresholds
        self.spki: float = 1.0    # Signal Peak Level
        self.npki: float = 0.05   # Noise Peak Level
        self.threshold1: float = 0.28
        self.threshold2: float = 0.14

        # Refractory period tracker (250 ms blanking = 62 samples)
        self.refractory_samples = int(round(0.250 * fs))
        self.samples_since_last_r_peak = 0

        # RR Interval Buffer (stores last 20 normal-to-normal RR intervals in seconds)
        self.rr_intervals_s: Deque[float] = collections.deque(maxlen=20)
        self._current_hr_bpm: float = 65.0
        self._current_rmssd_ms: float = 30.0

    def reset(self) -> None:
        self.bandpass.reset()
        self._diff_buf = collections.deque([0.0] * 5, maxlen=5)
        self._mwi_buf = collections.deque([0.0] * self.mwi_window_len, maxlen=self.mwi_window_len)
        self._mwi_sum = 0.0
        self._prev_mwi = 0.0
        self._prev_prev_mwi = 0.0
        self._first_peak_seen = False
        self.spki = 1.0
        self.npki = 0.05
        self.threshold1 = 0.28
        self.threshold2 = 0.14
        self.samples_since_last_r_peak = 0
        self.rr_intervals_s.clear()
        self._current_hr_bpm = 65.0
        self._current_rmssd_ms = 30.0

    def process_samples(self, ecg_raw: np.ndarray, timestamp_s: float = 0.0) -> CECGMetrics:
        """
        Processes a block of cECG samples.
        Returns CECGMetrics with instantaneous HR, RMSSD, peak counts, and vagal surge flags.
        """
        r_peaks_found = 0

        for x in ecg_raw:
            # 1. Bandpass filter
            x_bp = self.bandpass.process_sample(float(x))

            # 2. 5-point Derivative
            self._diff_buf.append(x_bp)
            d = (2.0 * self._diff_buf[4] + self._diff_buf[3] - self._diff_buf[1] - 2.0 * self._diff_buf[0]) * (self.fs / 8.0)

            # 3. Squaring
            d_sq = d * d

            # 4. Moving Window Integration (MWI) in O(1) via running sum
            oldest_mwi = self._mwi_buf[0]
            self._mwi_buf.append(d_sq)
            self._mwi_sum = self._mwi_sum - oldest_mwi + d_sq
            mwi_val = self._mwi_sum / self.mwi_window_len

            # 5. Local Maximum Finding & Dual Adaptive Thresholding
            self.samples_since_last_r_peak += 1

            if (self._prev_mwi > self._prev_prev_mwi) and (self._prev_mwi >= mwi_val):
                peak_val = self._prev_mwi
                if (not self._first_peak_seen or self.samples_since_last_r_peak > self.refractory_samples) and (peak_val > self.threshold1):
                    # Confirmed R-Peak
                    r_peaks_found += 1
                    if self._first_peak_seen:
                        rr_interval = self.samples_since_last_r_peak / float(self.fs)
                        # Physiological validity gating (0.35s to 1.8s -> 33 to 171 BPM)
                        if 0.35 <= rr_interval <= 1.8:
                            self.rr_intervals_s.append(rr_interval)
                            inst_hr = 60.0 / rr_interval
                            self._current_hr_bpm = 0.8 * self._current_hr_bpm + 0.2 * inst_hr
                    else:
                        self._first_peak_seen = True

                    # Update Signal Peak Level (SPKI)
                    self.spki = 0.125 * peak_val + 0.875 * self.spki
                    self.samples_since_last_r_peak = 0
                else:
                    # Update Noise Peak Level (NPKI)
                    if peak_val > 0.005:
                        self.npki = 0.125 * peak_val + 0.875 * self.npki

                # Update Adaptive Decision Thresholds
                self.threshold1 = self.npki + 0.25 * (self.spki - self.npki)
                self.threshold2 = 0.5 * self.threshold1

            self._prev_prev_mwi = self._prev_mwi
            self._prev_mwi = mwi_val

        # 6. Calculate Sliding RMSSD (Root Mean Square of Successive RR Differences)
        if len(self.rr_intervals_s) >= 4:
            rr_arr = np.array(self.rr_intervals_s) * 1000.0  # Convert to ms
            diff_rr = np.diff(rr_arr)
            rmssd = float(np.sqrt(np.mean(diff_rr ** 2)))
            self._current_rmssd_ms = 0.85 * self._current_rmssd_ms + 0.15 * rmssd

        # Parasympathetic surge criterion: RMSSD > 55 ms or elevated HR with high HRV
        hrv_surge = (self._current_rmssd_ms > 55.0) or (self._current_hr_bpm >= 80.0 and self._current_rmssd_ms > 45.0)

        return CECGMetrics(
            timestamp_s=timestamp_s,
            heart_rate_bpm=float(self._current_hr_bpm),
            rmssd_ms=float(self._current_rmssd_ms),
            r_peaks_detected_count=r_peaks_found,
            hrv_surge_detected=hrv_surge,
        )
