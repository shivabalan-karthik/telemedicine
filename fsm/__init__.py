"""
fsm package
===========
Hybrid Moore-EFSM Clinical Verification Engine:
  Continues the multi-modal data path from cECG, Audio, Actigraphy, and Impedance
  to output deterministically and strictly either TRUE_POSITIVE or TRUE_NEGATIVE.
"""

from .types import (
    BinaryOutcome,
    FSMState,
    ActionTrigger,
    VerificationStatus,
    FSMDiagnosticReport,
)
from .arbitrator import ClinicalArbitrator, ArbitrationResult
from .engine import HybridMooreEFSM

__all__ = [
    "BinaryOutcome",
    "FSMState",
    "ActionTrigger",
    "VerificationStatus",
    "FSMDiagnosticReport",
    "ClinicalArbitrator",
    "ArbitrationResult",
    "HybridMooreEFSM",
]
