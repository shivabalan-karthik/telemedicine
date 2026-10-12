"""
audio package
=============
Acoustic Phonoenterography DSP, synthetic signal generation, specifications, and interactive testing.
"""

from .spec import AudioLevel, AudioLevelSpec, AUDIO_SPECS, SAMPLING_RATE_HZ
from .dsp import AcousticProcessor, AudioMetrics
from .generator import AudioSignalGenerator

__all__ = [
    "AudioLevel",
    "AudioLevelSpec",
    "AUDIO_SPECS",
    "SAMPLING_RATE_HZ",
    "AcousticProcessor",
    "AudioMetrics",
    "AudioSignalGenerator",
]
