"""
audio/dsp.py
============
Real-Time Acoustic Phonoenterography Processor (4000 Hz):
  1. 100 - 2000 Hz 2nd-order Butterworth bandpass filter
  2. Short-Time Energy (STE): Sliding RMS energy over time frames
  3. Zero-Crossing Rate (ZCR) for spectral brightness estimation
  4. Epigastric retch / gag acoustic burst detector with adaptive noise floor tracking
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
class AudioMetrics:
    timestamp_s: float
    acoustic_short_time_energy: float
    acoustic_zcr: float
    acoustic_burst_detected: bool


class AcousticProcessor:
    """
    Real-Time Acoustic Phonoenterography Processor (4000 Hz).
    """

    def __init__(self, fs: int = 4000) -> None:
        self.fs = fs
        nyq = 0.5 * fs
        sos_bp = signal.butter(2, [100.0 / nyq, 1900.0 / nyq], btype="bandpass", output="sos")
        self.bandpass = StreamingSOSFilter(sos_bp)

        # Baseline noise floor tracker (EMA)
        self.noise_floor_energy: float = 0.0002
        self.energy_history: Deque[float] = collections.deque(maxlen=15)

    def reset(self) -> None:
        self.bandpass.reset()
        self.noise_floor_energy = 0.0002
        self.energy_history.clear()

    def process_samples(self, audio_raw: np.ndarray, timestamp_s: float = 0.0) -> AudioMetrics:
        """
        Processes audio block.
        audio_raw: array of audio amplitude samples.
        """
        if len(audio_raw) == 0:
            return AudioMetrics(
                timestamp_s=timestamp_s,
                acoustic_short_time_energy=0.0,
                acoustic_zcr=0.0,
                acoustic_burst_detected=False,
            )

        # 1. Bandpass filter
        filtered = self.bandpass.process_array(audio_raw)

        # 2. Short-Time Energy (STE)
        energy = float(np.mean(filtered ** 2))
        self.energy_history.append(energy)

        # Update noise floor slowly during quiet periods
        if energy < self.noise_floor_energy * 2.0:
            self.noise_floor_energy = 0.98 * self.noise_floor_energy + 0.02 * energy

        # 3. Zero-Crossing Rate (ZCR)
        signs = np.sign(filtered)
        signs[signs == 0] = 1
        zcr = float(np.mean(np.abs(np.diff(signs)) > 0))

        # 4. Acoustic Retch Burst Detection:
        # Pre-emesis epigastric sounds produce sharp energy spikes
        is_burst = (energy > 0.002) and (energy > 4.0 * self.noise_floor_energy or energy > 0.01)

        return AudioMetrics(
            timestamp_s=timestamp_s,
            acoustic_short_time_energy=energy,
            acoustic_zcr=zcr,
            acoustic_burst_detected=is_burst,
        )
