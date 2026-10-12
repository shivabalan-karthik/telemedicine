"""
impedance package
=================
E-Textile Impedance / EDA DSP, synthetic signal generation, specifications, and interactive testing.
"""

from .spec import ImpedanceLevel, ImpedanceLevelSpec, IMPEDANCE_SPECS, SAMPLING_RATE_HZ
from .dsp import ImpedanceProcessor, ImpedanceMetrics
from .generator import ImpedanceSignalGenerator

__all__ = [
    "ImpedanceLevel",
    "ImpedanceLevelSpec",
    "IMPEDANCE_SPECS",
    "SAMPLING_RATE_HZ",
    "ImpedanceProcessor",
    "ImpedanceMetrics",
    "ImpedanceSignalGenerator",
]
