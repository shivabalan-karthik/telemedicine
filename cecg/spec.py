"""
cecg/spec.py
============
Capacitive ECG (cECG) Level Catalog and Clinical Specifications:
  * Sampling rate: 250 Hz (PhysioNet cECGDB / MIT-BIH)
  * Trinary {-1, 0, 1} input levels:
      - LOW (-1): Bradycardia / Depressed HRV (HR: 40 - 55 BPM, RMSSD: 10 - 25 ms)
      - MEDIUM/NORMAL (0): Normal Resting Sleep Baseline (HR: 60 - 75 BPM, RMSSD: 28 - 45 ms)
      - HIGH (1): Autonomic Vagal Surge / High HRV (HR: 80 - 130 BPM, RMSSD: 70 - 150 ms)
"""

from __future__ import annotations
import enum
from dataclasses import dataclass
from typing import Dict


class CECGLevel(int, enum.Enum):
    LOW = -1
    NORMAL = 0
    HIGH = 1


@dataclass(frozen=True)
class CECGLevelSpec:
    level: CECGLevel
    code_str: str
    display_title: str
    clinical_description: str
    range_str: str
    min_hr_bpm: float
    max_hr_bpm: float
    default_hr_bpm: float
    default_rmssd_ms: float


CECG_SPECS: Dict[CECGLevel, CECGLevelSpec] = {
    CECGLevel.LOW: CECGLevelSpec(
        level=CECGLevel.LOW,
        code_str="-1",
        display_title="LOW (-1): Bradycardia / Depressed HRV",
        clinical_description="Slow heart rate, low autonomic tone and beat-to-beat variability",
        range_str="HR: 40 - 55 BPM | RMSSD: 10 - 25 ms",
        min_hr_bpm=40.0,
        max_hr_bpm=55.0,
        default_hr_bpm=48.0,
        default_rmssd_ms=18.0,
    ),
    CECGLevel.NORMAL: CECGLevelSpec(
        level=CECGLevel.NORMAL,
        code_str="0",
        display_title="NORMAL (0): Normal Resting Sleep Baseline",
        clinical_description="Healthy autonomic resting sleep state with normal sinus rhythm",
        range_str="HR: 60 - 75 BPM | RMSSD: 28 - 45 ms",
        min_hr_bpm=60.0,
        max_hr_bpm=75.0,
        default_hr_bpm=65.0,
        default_rmssd_ms=35.0,
    ),
    CECGLevel.HIGH: CECGLevelSpec(
        level=CECGLevel.HIGH,
        code_str="1",
        display_title="HIGH (1): Autonomic Vagal Surge / High HRV",
        clinical_description="Profound vagal activation, high beat-to-beat variability, elevated distress rate",
        range_str="HR: 80 - 130 BPM | RMSSD: 70 - 150 ms",
        min_hr_bpm=80.0,
        max_hr_bpm=130.0,
        default_hr_bpm=95.0,
        default_rmssd_ms=88.0,
    ),
}

SAMPLING_RATE_HZ: int = 250
PHYSICAL_UNITS: str = "mV"
DATASET_NAME: str = "PhysioNet Non-Invasive cECGDB / MIT-BIH Arrhythmia"
DATASET_URL: str = "https://physionet.org/content/cecgdb/1.0.0/"
