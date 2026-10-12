"""
fsm/types.py
============
Type definitions, enums, and diagnostic reports for the Hybrid Moore-EFSM
Clinical Verification Engine with Strict Binary Outcome (True Positive / True Negative).
"""

from __future__ import annotations
import enum
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple


class BinaryOutcome(str, enum.Enum):
    """
    Strict Binary Clinical Diagnostic Outcome:
      * TRUE_POSITIVE (TP): Real clinical pathology/event is verified and system executes medical actuation.
      * TRUE_NEGATIVE (TN): Normal sleep or non-clinical artifact verified and alert is suppressed.
    """
    TRUE_POSITIVE = "TRUE_POSITIVE"
    TRUE_NEGATIVE = "TRUE_NEGATIVE"


class FSMState(str, enum.Enum):
    """Deterministic Micro-Diagnostic States in the Hybrid Moore-EFSM."""
    BASELINE = "BASELINE"
    PARASYMPATHETIC_SURGE = "PARASYMPATHETIC_SURGE"
    PRE_EMESIS_WARNING = "PRE_EMESIS_WARNING"
    ACTIVE_EMESIS_EVENT = "ACTIVE_EMESIS_EVENT"
    ARTIFACT_REJECTED = "ARTIFACT_REJECTED"


class ActionTrigger(str, enum.Enum):
    """Moore Machine Edge Actuation Outputs."""
    NONE = "NONE"
    LOG_TELEMETRY = "LOG_TELEMETRY"
    SUPPRESS_ALERT_LOG_ARTIFACT = "SUPPRESS_ALERT_LOG_ARTIFACT"
    FAN_AC_ON = "TURN_ON_FAN_AC"
    FAN_AC_OFF = "TURN_OFF_FAN_AC"
    BED_ELEVATE_30DEG_ALERT_STAFF = "BED_ELEVATE_30DEG_ALERT_STAFF"
    EMERGENCY_ALARM_SUCTION_READY = "EMERGENCY_ALARM_SUCTION_READY"


class VerificationStatus(str, enum.Enum):
    """EFSM Internal Verification Status."""
    UNVERIFIED = "UNVERIFIED"
    CONCORDANCE_VERIFIED = "CONCORDANCE_VERIFIED"
    PERSISTENCE_LATCHED = "PERSISTENCE_LATCHED"
    ARTIFACT_SUPPRESSED = "ARTIFACT_SUPPRESSED"


@dataclass
class FSMDiagnosticReport:
    """
    Complete Diagnostic Payload emitted by the Hybrid Moore-EFSM Engine.
    """
    timestamp_s: float
    input_tuple_str: str
    ground_truth_label: str
    
    # Strict Binary Outcome (TP or TN only)
    outcome: BinaryOutcome
    
    # Internal FSM Execution Details
    fsm_state: FSMState
    previous_state: FSMState
    state_duration_s: float
    persistence_frames: int
    action_trigger: ActionTrigger
    verification_status: VerificationStatus
    confidence_score: float
    concordance_score: float
    
    # Clinical Documentation
    clinical_rationale: str
    transition_trace: List[str]
    
    # Multi-Modal Biometric Metrics
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
