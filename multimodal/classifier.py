"""
multimodal/classifier.py
========================
Multi-Modal Classification Engine:
  Combines raw streaming data from 4 sensor modalities:
    1. Capacitive ECG (cECG)
    2. Acoustic Phonoenterography (Audio)
    3. Piezoelectric Actigraphy
    4. E-Textile Impedance / EDA
  Processes with Direct Form II Biquad DSP, 4x4 Fusion Matrix, and Micro-FSM.
  Evaluates against Ground Truth to yield:
    - TRUE_POSITIVE (TP)
    - TRUE_NEGATIVE (TN)
    - FALSE_POSITIVE (FP)
    - FALSE_NEGATIVE (FN)
"""

from __future__ import annotations
from typing import Optional, Tuple
import numpy as np

from cecg.spec import CECGLevel, CECG_SPECS
from audio.spec import AudioLevel, AUDIO_SPECS
from actigraphy.spec import ActigraphyLevel, ACTIGRAPHY_SPECS
from impedance.spec import ImpedanceLevel, IMPEDANCE_SPECS

from cecg.generator import CECGSignalGenerator
from audio.generator import AudioSignalGenerator
from actigraphy.generator import ActigraphySignalGenerator
from impedance.generator import ImpedanceSignalGenerator

from fusion import (
    ActionTrigger,
    ArtifactType,
    CrossModalFusionMatrix,
    DiagnosticOutput,
    FSMState,
    MicroDiagnosticFSM,
    MultiModalDSPPipeline,
)

from .types import (
    ClassificationCategory,
    GROUND_TRUTH_IS_POSITIVE,
    GroundTruthLabel,
    MultiModalEvaluationResult,
)


class MultiModalClassifier:
    """
    Master Multi-Modal Classifier combining all 4 sensor streams into 4 confusion categories.
    """

    def __init__(self, frame_dt_s: float = 0.2) -> None:
        self.frame_dt_s = frame_dt_s
        self.pipeline = MultiModalDSPPipeline()
        self.fusion = CrossModalFusionMatrix()
        self.fsm = MicroDiagnosticFSM(frame_dt_s=frame_dt_s)

    def reset(self) -> None:
        self.pipeline.reset()
        self.fsm.reset()

    def evaluate_batch(
        self,
        cecg_samples: np.ndarray,
        audio_samples: np.ndarray,
        actigraphy_samples: np.ndarray,
        impedance_samples: np.ndarray,
        ground_truth: GroundTruthLabel,
        input_tuple_str: str = "(0, 0, 0, 0)",
        encoded_levels: Tuple[int, int, int, int] = (0, 0, 0, 0),
        timestamp_s: float = 0.0,
    ) -> MultiModalEvaluationResult:
        """
        Consumes time-synchronized raw 4-sensor data, executes DSP and FSM,
        and determines TP / TN / FP / FN category against Ground Truth.
        """
        # 1. Process 4-sensor DSP
        dsp_m = self.pipeline.process_frame_batch(
            cecg_samples, audio_samples, actigraphy_samples, impedance_samples, timestamp_s=timestamp_s
        )

        # 2. Evaluate 4x4 Fusion Matrix
        fres = self.fusion.evaluate(dsp_m)

        # 3. Step Micro-Diagnostic FSM
        diag = self.fsm.update(dsp_m, fres)

        # 4. Determine Ground Truth Positive vs Negative
        gt_is_positive = GROUND_TRUTH_IS_POSITIVE[ground_truth]

        # 5. Determine System Positive vs Negative
        # System positive means active clinical/environmental state requiring actuation:
        # e.g., Pre-Emesis Warning, Active Emesis Event, Parasympathetic Surge, or Fan ON/OFF triggers.
        system_is_positive = diag.current_state in (
            FSMState.PRE_EMESIS_WARNING,
            FSMState.ACTIVE_EMESIS_EVENT,
            FSMState.PARASYMPATHETIC_SURGE,
        ) or diag.action_trigger in (
            ActionTrigger.BED_ELEVATE_30DEG_ALERT_STAFF,
            ActionTrigger.EMERGENCY_ALARM_SUCTION_READY,
            ActionTrigger.FAN_AC_ON,
            ActionTrigger.FAN_AC_OFF,
        )

        # If system rejected artifact or stayed in baseline without action, it's negative
        if diag.current_state == FSMState.ARTIFACT_REJECTED or diag.action_trigger in (
            ActionTrigger.LOG_TELEMETRY,
            ActionTrigger.SUPPRESS_ALERT_LOG_ARTIFACT,
            ActionTrigger.NONE,
        ):
            if diag.action_trigger not in (ActionTrigger.FAN_AC_ON, ActionTrigger.FAN_AC_OFF, ActionTrigger.BED_ELEVATE_30DEG_ALERT_STAFF, ActionTrigger.EMERGENCY_ALARM_SUCTION_READY):
                system_is_positive = False

        # 6. Categorize into TP, TN, FP, FN
        if gt_is_positive and system_is_positive:
            classification = ClassificationCategory.TRUE_POSITIVE
            explanation = (
                f"TRUE POSITIVE: Ground truth condition '{ground_truth.value}' occurred and system correctly "
                f"detected state '{diag.current_state.value}' with action '{diag.action_trigger.value}'."
            )
        elif not gt_is_positive and not system_is_positive:
            classification = ClassificationCategory.TRUE_NEGATIVE
            explanation = (
                f"TRUE NEGATIVE: Ground truth non-pathological baseline/artifact '{ground_truth.value}' correctly "
                f"suppressed alerts (State: '{diag.current_state.value}', Action: '{diag.action_trigger.value}')."
            )
        elif not gt_is_positive and system_is_positive:
            classification = ClassificationCategory.FALSE_POSITIVE
            explanation = (
                f"FALSE POSITIVE: Ground truth was non-event/artifact '{ground_truth.value}', but system "
                f"mistakenly raised state '{diag.current_state.value}' and action '{diag.action_trigger.value}'."
            )
        else:  # gt_is_positive and not system_is_positive
            classification = ClassificationCategory.FALSE_NEGATIVE
            explanation = (
                f"FALSE NEGATIVE: True clinical event '{ground_truth.value}' occurred, but system failed "
                f"to trigger alert (remained in '{diag.current_state.value}')."
            )

        return MultiModalEvaluationResult(
            timestamp_s=timestamp_s,
            input_tuple_str=input_tuple_str,
            encoded_levels=encoded_levels,
            ground_truth=ground_truth,
            is_ground_truth_positive=gt_is_positive,
            fsm_state=diag.current_state.value,
            action_trigger=diag.action_trigger.value,
            artifact_type=diag.artifact_type.value,
            confidence_score=diag.confidence_score,
            concordance_score=diag.fusion_result.concordance_score,
            is_system_positive=system_is_positive,
            classification=classification,
            clinical_explanation=explanation,
            heart_rate_bpm=dsp_m.heart_rate_bpm,
            rmssd_ms=dsp_m.rmssd_ms,
            acoustic_energy=dsp_m.acoustic_short_time_energy,
            actigraphy_rms_g=dsp_m.actigraphy_vm_rms,
            impedance_raw_us=dsp_m.impedance_raw_uS,
            impedance_delta_us=dsp_m.impedance_delta_uS,
            shivering_flag=dsp_m.shivering_detected,
            sweating_flag=dsp_m.diaphoresis_detected,
            spill_flag=dsp_m.fluid_spill_signature,
            macro_shift_flag=dsp_m.macro_postural_shift_detected,
        )

    def evaluate_synthesized_tuple(
        self,
        tuple_vals: Tuple[int, int, int, int],
        ground_truth: GroundTruthLabel,
        n_frames: int = 20,
    ) -> MultiModalEvaluationResult:
        """
        Synthesizes 4-sensor waveforms for a trinary tuple and evaluates against Ground Truth.
        """
        e_val, a_val, acc_val, imp_val = tuple_vals
        ecg_lvl = CECGLevel(e_val)
        aud_lvl = AudioLevel(a_val)
        acc_lvl = ActigraphyLevel(acc_val)
        imp_lvl = ImpedanceLevel(imp_val)

        is_spill = (ground_truth == GroundTruthLabel.ARTIFACT_SPILL) or (
            imp_lvl == ImpedanceLevel.HIGH and aud_lvl == AudioLevel.LOW and ecg_lvl == CECGLevel.NORMAL
        )
        is_shift = (ground_truth == GroundTruthLabel.ARTIFACT_POSTURAL_SHIFT)

        gen_ecg = CECGSignalGenerator(seed=42)
        gen_aud = AudioSignalGenerator(seed=42)
        gen_acc = ActigraphySignalGenerator(seed=42)
        gen_imp = ImpedanceSignalGenerator(seed=42)

        last_res = None
        tuple_str = f"({e_val}, {a_val}, {acc_val}, {imp_val})"

        for frame in range(n_frames):
            t_s = (frame + 1) * self.frame_dt_s
            ecg_samp = gen_ecg.generate_chunk(duration_s=self.frame_dt_s, level=ecg_lvl)
            aud_samp = gen_aud.generate_chunk(duration_s=self.frame_dt_s, level=aud_lvl)
            acc_samp = gen_acc.generate_chunk(duration_s=self.frame_dt_s, level=acc_lvl, is_macro_shift=is_shift)
            imp_samp = gen_imp.generate_chunk(duration_s=self.frame_dt_s, level=imp_lvl, is_fluid_spill=is_spill)

            last_res = self.evaluate_batch(
                ecg_samp, aud_samp, acc_samp, imp_samp,
                ground_truth=ground_truth,
                input_tuple_str=tuple_str,
                encoded_levels=tuple_vals,
                timestamp_s=t_s,
            )

        return last_res
