"""
cecg package
============
Capacitive ECG (cECG) DSP, synthetic signal generation, specifications, and interactive testing.
"""

from .spec import CECGLevel, CECGLevelSpec, CECG_SPECS, SAMPLING_RATE_HZ
from .dsp import PanTompkinsECGProcessor, CECGMetrics
from .generator import CECGSignalGenerator

__all__ = [
    "CECGLevel",
    "CECGLevelSpec",
    "CECG_SPECS",
    "SAMPLING_RATE_HZ",
    "PanTompkinsECGProcessor",
    "CECGMetrics",
    "CECGSignalGenerator",
]
