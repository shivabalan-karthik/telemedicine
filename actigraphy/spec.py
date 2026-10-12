"""
actigraphy/spec.py
==================
Piezoelectric Actigraphy Level Catalog and Specifications:
  * Sampling rate: 50 Hz (PhysioNet Sleep-Acc)
  * Trinary {-1, 0, 1} input levels:
      - LOW (-1): Deep Stillness / Near-Motionless (RMS: 0.002 - 0.008 g)
      - MEDIUM/NORMAL (0): Calm Sleep / Gentle Respiration (RMS: 0.006 - 0.012 g @ 0.25 Hz; Shiver = False)
      - HIGH (1): Active 4 Hz Clonic Shivering Tremor (RMS: 0.050 - 0.130 g @ 4.2 Hz; Shiver = True)
"""

from __future__ import annotations
import enum
from dataclasses import dataclass
from typing import Dict


class ActigraphyLevel(int, enum.Enum):
    LOW = -1
    NORMAL = 0
    HIGH = 1


@dataclass(frozen=True)
class ActigraphyLevelSpec:
    level: ActigraphyLevel
    code_str: str
    display_title: str
    clinical_description: str
    range_str: str
    min_rms_g: float
    max_rms_g: float
    default_rms_g: float
    target_freq_hz: float


ACTIGRAPHY_SPECS: Dict[ActigraphyLevel, ActigraphyLevelSpec] = {
    ActigraphyLevel.LOW: ActigraphyLevelSpec(
        level=ActigraphyLevel.LOW,
        code_str="-1",
        display_title="LOW (-1): Deep Stillness / Near-Motionless",
        clinical_description="Patient motionless in deep sleep, minimal respiratory artifact",
        range_str="RMS: 0.002 - 0.008 g (sub-threshold noise floor)",
        min_rms_g=0.002,
        max_rms_g=0.008,
        default_rms_g=0.005,
        target_freq_hz=0.0,
    ),
    ActigraphyLevel.NORMAL: ActigraphyLevelSpec(
        level=ActigraphyLevel.NORMAL,
        code_str="0",
        display_title="NORMAL (0): Calm Sleep / Gentle Breathing (NO SHIVER)",
        clinical_description="Quiet sleep baseline with gentle 0.25 Hz respiratory chest sway; filtered RMS below shiver threshold",
        range_str="RMS: 0.006 - 0.012 g (below 0.04g shiver cutoff)",
        min_rms_g=0.006,
        max_rms_g=0.012,
        default_rms_g=0.010,
        target_freq_hz=0.25,
    ),
    ActigraphyLevel.HIGH: ActigraphyLevelSpec(
        level=ActigraphyLevel.HIGH,
        code_str="1",
        display_title="HIGH (1): Active 4.2 Hz SHIVERING Tremor",
        clinical_description="Sustained clonic shivering tremor (4.2 Hz) within 1-15 Hz bandpass; triggers fan shutdown to prevent hypothermia",
        range_str="RMS (filtered): 0.050 - 0.130 g (~0.067g)",
        min_rms_g=0.050,
        max_rms_g=0.130,
        default_rms_g=0.095,
        target_freq_hz=4.2,
    ),
}

SAMPLING_RATE_HZ: int = 50
PHYSICAL_UNITS: str = "g (Earth Gravitational Units)"
DATASET_NAME: str = "PhysioNet Sleep-Acc Tri-axial Piezoelectric Actigraphy"
DATASET_URL: str = "https://physionet.org/content/sleep-acc/1.0.0/"
