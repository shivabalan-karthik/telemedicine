"""
audio/spec.py
=============
Acoustic Phonoenterography Level Catalog and Specifications:
  * Sampling rate: 4000 Hz (ICBHI / CirCor DigiScope Audio)
  * Trinary {-1, 0, 1} input levels:
      - LOW (-1): Dead Silence / Ambient Floor (Energy: 0.00001 - 0.00010 V^2)
      - MEDIUM/NORMAL (0): Normal Peristaltic Murmur (Energy: 0.00015 - 0.00080 V^2)
      - HIGH (1): Pre-Emesis Retching Spikes / Epigastric Bursts (Energy: 0.00500 - 0.08000 V^2)
"""

from __future__ import annotations
import enum
from dataclasses import dataclass
from typing import Dict


class AudioLevel(int, enum.Enum):
    LOW = -1
    NORMAL = 0
    HIGH = 1


@dataclass(frozen=True)
class AudioLevelSpec:
    level: AudioLevel
    code_str: str
    display_title: str
    clinical_description: str
    range_str: str
    min_energy_v2: float
    max_energy_v2: float
    default_energy_v2: float


AUDIO_SPECS: Dict[AudioLevel, AudioLevelSpec] = {
    AudioLevel.LOW: AudioLevelSpec(
        level=AudioLevel.LOW,
        code_str="-1",
        display_title="LOW (-1): Dead Silence / Ambient Floor",
        clinical_description="Quiet bedroom background, subtle hypoactive sound",
        range_str="Energy: 0.00001 - 0.00010 V^2",
        min_energy_v2=0.00001,
        max_energy_v2=0.00010,
        default_energy_v2=0.00005,
    ),
    AudioLevel.NORMAL: AudioLevelSpec(
        level=AudioLevel.NORMAL,
        code_str="0",
        display_title="NORMAL (0): Normal Peristaltic Murmur",
        clinical_description="Normal quiet enteric rumbling and gentle breathing airflow",
        range_str="Energy: 0.00015 - 0.00080 V^2",
        min_energy_v2=0.00015,
        max_energy_v2=0.00080,
        default_energy_v2=0.00035,
    ),
    AudioLevel.HIGH: AudioLevelSpec(
        level=AudioLevel.HIGH,
        code_str="1",
        display_title="HIGH (1): Pre-Emesis Retching Spikes",
        clinical_description="Sharp resonant acoustic sound bursts (200-800 Hz) from retching/gagging",
        range_str="Energy: 0.00500 - 0.08000 V^2",
        min_energy_v2=0.00500,
        max_energy_v2=0.08000,
        default_energy_v2=0.02500,
    ),
}

SAMPLING_RATE_HZ: int = 4000
PHYSICAL_UNITS: str = "Normalized Audio Units (V)"
DATASET_NAME: str = "ICBHI Respiratory / CirCor DigiScope Acoustic Audio"
DATASET_URL: str = "https://physionet.org/content/circor-digiscope/1.0.3/"
