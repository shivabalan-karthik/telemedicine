"""
multimodal/types.py
===================
Type definitions and enums for Multi-Modal Classification (TP, TN, FP, FN)
and Ground Truth Clinical / Environmental Scenarios.
"""

from __future__ import annotations
import enum
from dataclasses import dataclass, field
from typing import Dict, Optional, Tuple
import numpy as np


class ClassificationCategory(str, enum.Enum):
    """
    Standard 4-Category Clinical Confusion Matrix Output:
      - TRUE_POSITIVE (TP): Real clinical event is present and correctly detected by system.
      - TRUE_NEGATIVE (TN): Normal sleep or non-clinical artifact correctly suppressed/rejected.
      - FALSE_POSITIVE (FP): Normal sleep or artifact mistakenly triggered a clinical alarm.
      - FALSE_NEGATIVE (FN): Real clinical event occurred but system missed it / failed to alert.
    """
    TRUE_POSITIVE = "TRUE_POSITIVE"
    TRUE_NEGATIVE = "TRUE_NEGATIVE"
    FALSE_POSITIVE = "FALSE_POSITIVE"
    FALSE_NEGATIVE = "FALSE_NEGATIVE"


class GroundTruthLabel(str, enum.Enum):
    """
    Physiological & Environmental Ground Truth Reference Labels:
      * Negative (Non-Pathological):
          - NORMAL_BASELINE: Quiet, healthy resting sleep baseline
          - ARTIFACT_SPILL: Accidental fluid/water spill on bed textile
          - ARTIFACT_POSTURAL_SHIFT: Gross non-clinical body turning / postural roll
      * Positive (Active Pathological / Environmental Actionable States):
          - SUDOMOTOR_DIAPHORESIS: Active cold sweat diaphoresis (Action: TURN_ON_FAN_AC)
          - NOCTURNAL_SHIVERING: 4 Hz neuromuscular shivering tremor (Action: TURN_OFF_FAN_AC)
          - AUTONOMIC_VAGAL_SURGE: Vagal tone surge with high HRV (Action: TURN_ON_FAN_AC)
          - PRE_EMESIS: Retching burst + tremor + diaphoresis triad (Action: BED_ELEVATE_30DEG_ALERT_STAFF)
          - ACTIVE_EMESIS: Violent convulsive contractions & high acoustic discharge (Action: EMERGENCY_ALARM)
    """
    NORMAL_BASELINE = "NORMAL_BASELINE"
    ARTIFACT_SPILL = "ARTIFACT_SPILL"
    ARTIFACT_POSTURAL_SHIFT = "ARTIFACT_POSTURAL_SHIFT"
    SUDOMOTOR_DIAPHORESIS = "SUDOMOTOR_DIAPHORESIS"
    NOCTURNAL_SHIVERING = "NOCTURNAL_SHIVERING"
    AUTONOMIC_VAGAL_SURGE = "AUTONOMIC_VAGAL_SURGE"
    PRE_EMESIS = "PRE_EMESIS"
    ACTIVE_EMESIS = "ACTIVE_EMESIS"


# Ground truth positive/negative mapping dictionary
GROUND_TRUTH_IS_POSITIVE: Dict[GroundTruthLabel, bool] = {
    GroundTruthLabel.NORMAL_BASELINE: False,
    GroundTruthLabel.ARTIFACT_SPILL: False,
    GroundTruthLabel.ARTIFACT_POSTURAL_SHIFT: False,
    GroundTruthLabel.SUDOMOTOR_DIAPHORESIS: True,
    GroundTruthLabel.NOCTURNAL_SHIVERING: True,
    GroundTruthLabel.AUTONOMIC_VAGAL_SURGE: True,
    GroundTruthLabel.PRE_EMESIS: True,
    GroundTruthLabel.ACTIVE_EMESIS: True,
}


@dataclass
class MultiModalEvaluationResult:
    """
    Comprehensive result of combining 4 sensor streams and evaluating against ground truth.
    """
    timestamp_s: float
    input_tuple_str: str
    encoded_levels: Tuple[int, int, int, int]
    ground_truth: GroundTruthLabel
    is_ground_truth_positive: bool
    
    # DSP & Fusion Predictions
    fsm_state: str
    action_trigger: str
    artifact_type: str
    confidence_score: float
    concordance_score: float
    is_system_positive: bool
    
    # Primary Output Category: TP, TN, FP, FN
    classification: ClassificationCategory
    clinical_explanation: str
    
    # Biometric metrics summary
    heart_rate_bpm: float
    rmssd_ms: float
    acoustic_energy: float
    actigraphy_rms_g: float
    impedance_raw_us: float
    impedance_delta_us: float
    shivering_flag: bool
    sweating_flag: bool
    spill_flag: bool
    macro_shift_flag: bool
