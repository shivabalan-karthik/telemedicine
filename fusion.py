"""
fusion.py
=========
Master Multi-Modal Coordinator, 4x4 Cross-Modal Decision Fusion Matrix,
and Micro-Diagnostic Finite-State Machine (FSM).
"""

from __future__ import annotations
import enum
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
import numpy as np

from cecg.dsp import PanTompkinsECGProcessor, CECGMetrics
from audio.dsp import AcousticProcessor, AudioMetrics
from actigraphy.dsp import ActigraphyProcessor, ActigraphyMetrics
from impedance.dsp import ImpedanceProcessor, ImpedanceMetrics


@dataclass
class CombinedDSPMetrics:
    timestamp_s: float
    # cECG
    heart_rate_bpm: float
    rmssd_ms: float
    r_peaks_detected_count: int
    hrv_surge_detected: bool
    # Audio
    acoustic_short_time_energy: float
    acoustic_zcr: float
    acoustic_burst_detected: bool
    # Actigraphy
    actigraphy_vm_rms: float
    shivering_tremor_energy: float
    shivering_detected: bool
    macro_postural_shift_detected: bool
    # Impedance
    impedance_raw_uS: float
    impedance_baseline_uS: float
    impedance_delta_uS: float
    impedance_slew_rate_uS_s: float
    diaphoresis_detected: bool
    fluid_spill_signature: bool


class FSMState(str, enum.Enum):
    BASELINE = "BASELINE"
    PARASYMPATHETIC_SURGE = "PARASYMPATHETIC_SURGE"
    PRE_EMESIS_WARNING = "PRE_EMESIS_WARNING"
    ACTIVE_EMESIS_EVENT = "ACTIVE_EMESIS_EVENT"
    ARTIFACT_REJECTED = "ARTIFACT_REJECTED"


class ArtifactType(str, enum.Enum):
    NONE = "NONE"
    FLUID_SPILL = "FLUID_SPILL"
    POSTURAL_SHIFT = "POSTURAL_SHIFT"
    TRANSIENT_SENSOR_NOISE = "TRANSIENT_SENSOR_NOISE"


class ActionTrigger(str, enum.Enum):
    NONE = "NONE"
    LOG_TELEMETRY = "LOG_TELEMETRY"
    SUPPRESS_ALERT_LOG_ARTIFACT = "SUPPRESS_ALERT_LOG_ARTIFACT"
    FAN_AC_ON = "TURN_ON_FAN_AC"
    FAN_AC_OFF = "TURN_OFF_FAN_AC"
    BED_ELEVATE_30DEG_ALERT_STAFF = "BED_ELEVATE_30DEG_ALERT_STAFF"
    EMERGENCY_ALARM_SUCTION_READY = "EMERGENCY_ALARM_SUCTION_READY"


@dataclass
class FusionEvaluationResult:
    concordance_score: float
    is_physiologically_coherent: bool
    detected_artifact: ArtifactType
    active_modality_flags: Dict[str, bool]
    fusion_weights_matrix: np.ndarray


@dataclass
class DiagnosticOutput:
    timestamp_s: float
    current_state: FSMState
    previous_state: FSMState
    state_duration_s: float
    confidence_score: float
    action_trigger: ActionTrigger
    artifact_type: ArtifactType
    clinical_rationale: str
    dsp_metrics: CombinedDSPMetrics
    fusion_result: FusionEvaluationResult


class MultiModalDSPPipeline:
    """Master coordinator executing DSP across all 4 sensor streams."""

    def __init__(self) -> None:
        self.ecg_processor = PanTompkinsECGProcessor(fs=250)
        self.audio_processor = AcousticProcessor(fs=4000)
        self.actigraphy_processor = ActigraphyProcessor(fs=50)
        self.impedance_processor = ImpedanceProcessor(fs=20)

    def reset(self) -> None:
        self.ecg_processor.reset()
        self.audio_processor.reset()
        self.actigraphy_processor.reset()
        self.impedance_processor.reset()

    def process_frame_batch(
        self,
        cecg_samples: np.ndarray,
        audio_samples: np.ndarray,
        actigraphy_samples: np.ndarray,
        impedance_samples: np.ndarray,
        timestamp_s: float = 0.0,
    ) -> CombinedDSPMetrics:
        ecg_m: CECGMetrics = self.ecg_processor.process_samples(cecg_samples, timestamp_s)
        aud_m: AudioMetrics = self.audio_processor.process_samples(audio_samples, timestamp_s)
        acc_m: ActigraphyMetrics = self.actigraphy_processor.process_samples(actigraphy_samples, timestamp_s)
        imp_m: ImpedanceMetrics = self.impedance_processor.process_samples(impedance_samples, timestamp_s)

        return CombinedDSPMetrics(
            timestamp_s=timestamp_s,
            heart_rate_bpm=ecg_m.heart_rate_bpm,
            rmssd_ms=ecg_m.rmssd_ms,
            r_peaks_detected_count=ecg_m.r_peaks_detected_count,
            hrv_surge_detected=ecg_m.hrv_surge_detected,
            acoustic_short_time_energy=aud_m.acoustic_short_time_energy,
            acoustic_zcr=aud_m.acoustic_zcr,
            acoustic_burst_detected=aud_m.acoustic_burst_detected,
            actigraphy_vm_rms=acc_m.actigraphy_vm_rms,
            shivering_tremor_energy=acc_m.shivering_tremor_energy,
            shivering_detected=acc_m.shivering_detected,
            macro_postural_shift_detected=acc_m.macro_postural_shift_detected,
            impedance_raw_uS=imp_m.impedance_raw_uS,
            impedance_baseline_uS=imp_m.impedance_baseline_uS,
            impedance_delta_uS=imp_m.impedance_delta_uS,
            impedance_slew_rate_uS_s=imp_m.impedance_slew_rate_uS_s,
            diaphoresis_detected=imp_m.diaphoresis_detected,
            fluid_spill_signature=imp_m.fluid_spill_signature,
        )


class CrossModalFusionMatrix:
    """4x4 Cross-Modal Decision Fusion Matrix."""

    def __init__(self) -> None:
        self.coupling_matrix = np.array([
            # cECG   Acoustic  Actigraphy Impedance
            [ 0.20,   0.25,     0.25,      0.30 ],  # cECG
            [ 0.25,   0.20,     0.35,      0.20 ],  # Acoustic
            [ 0.25,   0.35,     0.20,      0.20 ],  # Actigraphy
            [ 0.30,   0.20,     0.20,      0.30 ],  # Impedance
        ], dtype=np.float32)

    def evaluate(self, metrics: CombinedDSPMetrics) -> FusionEvaluationResult:
        v = np.array([
            1.0 if metrics.hrv_surge_detected else 0.0,
            1.0 if metrics.acoustic_burst_detected else 0.0,
            1.0 if (metrics.shivering_detected or metrics.macro_postural_shift_detected) else 0.0,
            1.0 if metrics.diaphoresis_detected else 0.0,
        ], dtype=np.float32)

        modality_flags = {
            "vagal_hrv_surge": bool(v[0]),
            "acoustic_retch_burst": bool(v[1]),
            "neuromuscular_tremor": bool(v[2]),
            "sudomotor_diaphoresis": bool(v[3]),
        }

        # 1. Fluid Spill Artifact Rejection
        if metrics.fluid_spill_signature:
            if not metrics.acoustic_burst_detected and not metrics.shivering_detected:
                return FusionEvaluationResult(
                    concordance_score=0.15,
                    is_physiologically_coherent=False,
                    detected_artifact=ArtifactType.FLUID_SPILL,
                    active_modality_flags=modality_flags,
                    fusion_weights_matrix=self.coupling_matrix,
                )

        # 2. Isolated Postural Shift Artifact Rejection
        if metrics.macro_postural_shift_detected:
            if not metrics.acoustic_burst_detected and not metrics.diaphoresis_detected and (metrics.impedance_delta_uS < 3.0):
                return FusionEvaluationResult(
                    concordance_score=0.20,
                    is_physiologically_coherent=False,
                    detected_artifact=ArtifactType.POSTURAL_SHIFT,
                    active_modality_flags=modality_flags,
                    fusion_weights_matrix=self.coupling_matrix,
                )

        # Concordance Quadratic Form
        active_count = float(np.sum(v))
        if active_count == 0.0:
            score = 0.0
        else:
            weighted_energy = float(v.T @ self.coupling_matrix @ v)
            max_energy = float(np.ones(4) @ self.coupling_matrix @ np.ones(4))
            score = min(1.0, weighted_energy / (max_energy * 0.65))

        is_coherent = (active_count >= 2) or (v[0] == 1.0 and metrics.rmssd_ms > 75.0)

        return FusionEvaluationResult(
            concordance_score=score,
            is_physiologically_coherent=is_coherent,
            detected_artifact=ArtifactType.NONE,
            active_modality_flags=modality_flags,
            fusion_weights_matrix=self.coupling_matrix,
        )


class MicroDiagnosticFSM:
    """Sub-second deterministic Micro-Diagnostic Finite-State Machine."""

    def __init__(self, frame_dt_s: float = 0.2) -> None:
        self.frame_dt_s = frame_dt_s
        self.current_state: FSMState = FSMState.BASELINE
        self.previous_state: FSMState = FSMState.BASELINE
        self.state_time_s: float = 0.0
        self._persistence_counter: int = 0
        self._target_candidate_state: Optional[FSMState] = None
        self.min_persistence_frames = 3

    def reset(self) -> None:
        self.current_state = FSMState.BASELINE
        self.previous_state = FSMState.BASELINE
        self.state_time_s = 0.0
        self._persistence_counter = 0
        self._target_candidate_state = None

    def update(self, metrics: CombinedDSPMetrics, fusion: FusionEvaluationResult) -> DiagnosticOutput:
        self.state_time_s += self.frame_dt_s
        candidate_state = self._evaluate_next_state(metrics, fusion)

        if candidate_state != self.current_state:
            if candidate_state == self._target_candidate_state:
                self._persistence_counter += 1
                if self._persistence_counter >= self.min_persistence_frames:
                    self.previous_state = self.current_state
                    self.current_state = candidate_state
                    self.state_time_s = 0.0
                    self._persistence_counter = 0
                    self._target_candidate_state = None
            else:
                self._target_candidate_state = candidate_state
                self._persistence_counter = 1
        else:
            self._target_candidate_state = None
            self._persistence_counter = 0

        confidence, action, rationale = self._resolve_actions_and_diagnostics(
            self.current_state, metrics, fusion
        )

        return DiagnosticOutput(
            timestamp_s=metrics.timestamp_s,
            current_state=self.current_state,
            previous_state=self.previous_state,
            state_duration_s=self.state_time_s,
            confidence_score=confidence,
            action_trigger=action,
            artifact_type=fusion.detected_artifact,
            clinical_rationale=rationale,
            dsp_metrics=metrics,
            fusion_result=fusion,
        )

    def _evaluate_next_state(self, metrics: CombinedDSPMetrics, fusion: FusionEvaluationResult) -> FSMState:
        if fusion.detected_artifact in (ArtifactType.FLUID_SPILL, ArtifactType.POSTURAL_SHIFT):
            return FSMState.ARTIFACT_REJECTED

        if self.current_state == FSMState.ARTIFACT_REJECTED:
            if fusion.detected_artifact == ArtifactType.NONE:
                return FSMState.BASELINE
            return FSMState.ARTIFACT_REJECTED

        if (metrics.acoustic_burst_detected or metrics.acoustic_short_time_energy > 0.003) and \
           (metrics.actigraphy_vm_rms > 0.20 or metrics.macro_postural_shift_detected) and \
           metrics.diaphoresis_detected:
            return FSMState.ACTIVE_EMESIS_EVENT

        if (metrics.diaphoresis_detected and
            (metrics.acoustic_burst_detected or metrics.shivering_detected) and
            (metrics.hrv_surge_detected or metrics.rmssd_ms >= 50.0)):
            return FSMState.PRE_EMESIS_WARNING

        if (metrics.hrv_surge_detected and metrics.impedance_delta_uS >= 2.0) or \
           (metrics.rmssd_ms > 60.0 and metrics.impedance_delta_uS >= 3.0):
            return FSMState.PARASYMPATHETIC_SURGE

        return FSMState.BASELINE

    def _resolve_actions_and_diagnostics(
        self,
        state: FSMState,
        metrics: CombinedDSPMetrics,
        fusion: FusionEvaluationResult,
    ) -> Tuple[float, ActionTrigger, str]:
        if state == FSMState.BASELINE:
            confidence = 0.98
            if metrics.diaphoresis_detected:
                action = ActionTrigger.FAN_AC_ON
                rationale = f"Sudomotor sweating diaphoresis detected (+{metrics.impedance_delta_uS:.1f} uS). Turning ON Fan/AC to cool patient."
            elif metrics.shivering_detected:
                action = ActionTrigger.FAN_AC_OFF
                rationale = f"Neuromuscular shivering detected ({metrics.actigraphy_vm_rms:.3f}g). Turning OFF Fan/AC to prevent hypothermia."
            else:
                action = ActionTrigger.LOG_TELEMETRY
                rationale = f"Stable normal sleep. HR: {metrics.heart_rate_bpm:.1f} BPM, RMSSD: {metrics.rmssd_ms:.1f} ms, Tonic Conductance: {metrics.impedance_baseline_uS:.2f} uS."

        elif state == FSMState.ARTIFACT_REJECTED:
            confidence = 0.95
            action = ActionTrigger.SUPPRESS_ALERT_LOG_ARTIFACT
            if fusion.detected_artifact == ArtifactType.FLUID_SPILL:
                rationale = f"Accidental fluid spill detected on bed textile (dG = +{metrics.impedance_delta_uS:.1f} uS, Slew = {metrics.impedance_slew_rate_uS_s:.1f} uS/s). Suppressing false alarm."
            elif fusion.detected_artifact == ArtifactType.POSTURAL_SHIFT:
                rationale = f"Non-clinical gross postural shift rejected (Actigraphy RMS = {metrics.actigraphy_vm_rms:.2f} g). cECG and sudomotor streams stable."
            else:
                rationale = "Transient single-sensor noise rejected by cross-modal concordance gating."

        elif state == FSMState.PARASYMPATHETIC_SURGE:
            confidence = 0.88 + 0.10 * fusion.concordance_score
            action = ActionTrigger.FAN_AC_ON
            rationale = f"Vagal autonomic activation detected. Elevated RMSSD ({metrics.rmssd_ms:.1f} ms) with sudomotor sweating (dG = +{metrics.impedance_delta_uS:.1f} uS). Turning ON Fan/AC."

        elif state == FSMState.PRE_EMESIS_WARNING:
            confidence = 0.92 + 0.07 * fusion.concordance_score
            action = ActionTrigger.BED_ELEVATE_30DEG_ALERT_STAFF
            rationale = (
                f"PRE-EMESIS CASCADE CONFIRMED! Acoustic retching spikes + diaphragmatic micro-tremor ({metrics.actigraphy_vm_rms:.2f}g) "
                f"+ cold sweat diaphoresis (+{metrics.impedance_delta_uS:.1f} uS). Elevating bed 30 deg to prevent aspiration; alerting caregiver."
            )

        elif state == FSMState.ACTIVE_EMESIS_EVENT:
            confidence = 0.99
            action = ActionTrigger.EMERGENCY_ALARM_SUCTION_READY
            rationale = (
                f"ACTIVE EMESIS IN PROGRESS! High acoustic energy ({metrics.acoustic_short_time_energy:.4f}) + violent contractions "
                f"({metrics.actigraphy_vm_rms:.2f}g). Initiating emergency caregiver notification and suction prep."
            )
        else:
            confidence = 0.50
            action = ActionTrigger.NONE
            rationale = "Unknown state."

        return (float(min(1.0, confidence)), action, rationale)
