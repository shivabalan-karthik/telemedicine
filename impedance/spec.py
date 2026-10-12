"""
impedance/spec.py
=================
E-Textile Impedance / EDA Level Catalog and Specifications:
  * Sampling rate: 20 Hz (WESAD Multimodal EDA)
  * Trinary {-1, 0, 1} input levels:
      - LOW (-1): Dry Contact (Conductance: 1.0 - 2.5 uS, Delta < 0.5 uS)
      - MEDIUM/NORMAL (0): Normal Baseline Skin Contact (Conductance: 3.0 - 5.5 uS, Delta ~ 0.0 uS, NO SWEAT)
      - HIGH (1): Active SWEATING Diaphoresis (+6 to +15 uS) or Bed Fluid Spill (+45 uS)
"""

from __future__ import annotations
import enum
from dataclasses import dataclass
from typing import Dict


class ImpedanceLevel(int, enum.Enum):
    LOW = -1
    NORMAL = 0
    HIGH = 1


@dataclass(frozen=True)
class ImpedanceLevelSpec:
    level: ImpedanceLevel
    code_str: str
    display_title: str
    clinical_description: str
    range_str: str
    min_val_us: float
    max_val_us: float
    default_val_us: float


IMPEDANCE_SPECS: Dict[ImpedanceLevel, ImpedanceLevelSpec] = {
    ImpedanceLevel.LOW: ImpedanceLevelSpec(
        level=ImpedanceLevel.LOW,
        code_str="-1",
        display_title="LOW (-1): Dry Contact",
        clinical_description="Dry textile contact, very low baseline conductance",
        range_str="Conductance: 1.0 - 2.5 uS (Delta < 0.5 uS)",
        min_val_us=1.0,
        max_val_us=2.5,
        default_val_us=2.0,
    ),
    ImpedanceLevel.NORMAL: ImpedanceLevelSpec(
        level=ImpedanceLevel.NORMAL,
        code_str="0",
        display_title="NORMAL (0): Normal Baseline Skin Contact (NO SWEAT)",
        clinical_description="Stable normal tonic skin conductance baseline (3.5 uS, Delta ~ 0.0 uS)",
        range_str="Conductance: 3.0 - 5.5 uS (Delta ~ 0.0 uS)",
        min_val_us=3.0,
        max_val_us=5.5,
        default_val_us=3.5,
    ),
    ImpedanceLevel.HIGH: ImpedanceLevelSpec(
        level=ImpedanceLevel.HIGH,
        code_str="1",
        display_title="HIGH (1): Active SWEATING Diaphoresis / Spill",
        clinical_description="Sudomotor cold sweat diaphoresis (+10.5 uS) or accidental fluid spill (+45 uS)",
        range_str="Conductance: 10.0 - 50.0 uS (Delta: +6.0 to +45.0 uS)",
        min_val_us=10.0,
        max_val_us=50.0,
        default_val_us=14.0,
    ),
}

SAMPLING_RATE_HZ: int = 20
PHYSICAL_UNITS: str = "microSiemens (uS)"
DATASET_NAME: str = "WESAD Multimodal EDA / Sudomotor E-Textile Impedance"
DATASET_URL: str = "https://archive.ics.uci.edu/dataset/465/wesad"
