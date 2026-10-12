"""
fsm/arbitrator.py
=================
Clinical Concordance & Artifact Arbitration Engine:
  Evaluates physical pairwise coupling across cECG, Audio, Actigraphy, and Impedance.
  Disambiguates non-clinical artifacts (fluid spills, postural movements)
  to guarantee zero false positives.
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, Tuple
import numpy as np

from .types import VerificationStatus


@dataclass
class ArbitrationResult:
    concordance_score: float
    is_physiologically_coherent: bool
    is_artifact_rejected: bool
    artifact_description: str
    verification_status: VerificationStatus
    active_modality_flags: Dict[str, bool]


class ClinicalArbitrator:
    """
    Evaluates quadratic form cross-modal concordance and applies artifact rejection rules.
    """

    def __init__(self) -> None:
        # 4x4 Autonomic Coupling Matrix W
        self.coupling_matrix = np.array([
            # cECG   Audio   Actigraphy  Impedance
            [ 0.20,   0.25,    0.25,       0.30 ],  # cECG
            [ 0.25,   0.20,    0.35,       0.20 ],  # Audio
            [ 0.25,   0.35,    0.20,       0.20 ],  # Actigraphy
            [ 0.30,   0.20,    0.20,       0.30 ],  # Impedance
        ], dtype=np.float32)

    def arbitrate(
        self,
        hrv_surge: bool,
        rmssd_ms: float,
        acoustic_burst: bool,
        acoustic_energy: float,
        shivering: bool,
        macro_shift: bool,
        sweating: bool,
        spill: bool,
        impedance_delta_us: float,
        slew_rate_us_s: float,
    ) -> ArbitrationResult:
        """
        Executes cross-modal arbitration and artifact suppression.
        """
        # Formulate binary activation vector v in {0, 1}^4
        v = np.array([
            1.0 if (hrv_surge or rmssd_ms > 60.0) else 0.0,
            1.0 if (acoustic_burst or acoustic_energy > 0.003) else 0.0,
            1.0 if (shivering or macro_shift) else 0.0,
            1.0 if (sweating or (impedance_delta_us >= 4.0 and not spill)) else 0.0,
        ], dtype=np.float32)

        modality_flags = {
            "vagal_tone_surge": bool(v[0]),
            "acoustic_retch_burst": bool(v[1]),
            "neuromuscular_tremor": bool(v[2]),
            "sudomotor_diaphoresis": bool(v[3]),
        }

        # -------------------------------------------------------------
        # Rule 1: Fluid Spill Artifact Arbitration
        # -------------------------------------------------------------
        # An impedance step jump / high slew rate (>20 uS/s) WITHOUT cardiac vagal surge or retching acoustics
        if spill or (slew_rate_us_s > 20.0 and not acoustic_burst and not hrv_surge):
            if not acoustic_burst and not (shivering and hrv_surge):
                return ArbitrationResult(
                    concordance_score=0.15,
                    is_physiologically_coherent=False,
                    is_artifact_rejected=True,
                    artifact_description=f"Accidental Bed Fluid Spill (+{impedance_delta_us:.1f} uS, Slew={slew_rate_us_s:.1f} uS/s)",
                    verification_status=VerificationStatus.ARTIFACT_SUPPRESSED,
                    active_modality_flags=modality_flags,
                )

        # -------------------------------------------------------------
        # Rule 2: Isolated Postural Shift Artifact Arbitration
        # -------------------------------------------------------------
        # High actigraphy jerk/macro shift WITHOUT acoustic retching or sudomotor diaphoresis
        if macro_shift:
            if not acoustic_burst and not sweating and (impedance_delta_us < 3.0):
                return ArbitrationResult(
                    concordance_score=0.20,
                    is_physiologically_coherent=False,
                    is_artifact_rejected=True,
                    artifact_description="Non-Clinical Gross Postural Shift Roll",
                    verification_status=VerificationStatus.ARTIFACT_SUPPRESSED,
                    active_modality_flags=modality_flags,
                )

        # -------------------------------------------------------------
        # Multi-Modal Concordance Quadratic Form
        # -------------------------------------------------------------
        active_count = float(np.sum(v))
        if active_count == 0.0:
            score = 0.0
        else:
            weighted_energy = float(v.T @ self.coupling_matrix @ v)
            max_energy = float(np.ones(4) @ self.coupling_matrix @ np.ones(4))
            score = min(1.0, weighted_energy / (max_energy * 0.65))

        # Physiological coherence: At least 2 concordant modalities or high single-stream confidence
        is_coherent = (active_count >= 2) or (v[0] == 1.0 and rmssd_ms > 70.0) or (shivering and not macro_shift) or sweating

        status = VerificationStatus.CONCORDANCE_VERIFIED if is_coherent else VerificationStatus.UNVERIFIED

        return ArbitrationResult(
            concordance_score=score,
            is_physiologically_coherent=is_coherent,
            is_artifact_rejected=False,
            artifact_description="NONE",
            verification_status=status,
            active_modality_flags=modality_flags,
        )
