"""
main.py
=======
Telemedicine Multi-Modal Biomedical DSP & Micro-Diagnostic FSM Framework:
  60-Second Real-Time End-to-End Simulation Runner.
"""

from __future__ import annotations
import collections
import sys
import time
from typing import Dict, List, Optional
import numpy as np

from common.telemetry import TelemetryFormatter, MQTTPublisherStub, RESTClientStub
from cecg.spec import CECGLevel
from audio.spec import AudioLevel
from actigraphy.spec import ActigraphyLevel
from impedance.spec import ImpedanceLevel

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


def get_simulation_scenario(t: float) -> str:
    if t < 15.0:
        return "BASELINE_SLEEP"
    elif t < 22.0:
        return "ISOLATED_POSTURAL_SHIFT"
    elif t < 30.0:
        return "FLUID_SPILL_ARTIFACT"
    elif t < 42.0:
        return "PARASYMPATHETIC_SURGE"
    elif t < 52.0:
        return "PRE_EMESIS_WARNING"
    else:
        return "ACTIVE_EMESIS_EVENT"


def run_simulation(total_duration_s: float = 60.0, chunk_duration_s: float = 0.2) -> None:
    print("\n" + "=" * 90)
    print("  TELEMEDICINE AAL WEARABLE-FREE BED HEALTH MONITORING FRAMEWORK")
    print("  60-Second Multi-Modal Real-Time Simulation with 4x4 Decision Fusion & Micro-FSM")
    print("=" * 90 + "\n")

    pipeline = MultiModalDSPPipeline()
    fusion = CrossModalFusionMatrix()
    fsm = MicroDiagnosticFSM(frame_dt_s=chunk_duration_s)
    formatter = TelemetryFormatter(patient_id="PATIENT_AAL_0042", bed_id="BED_ALPHA_01")
    last_payload = None
    mqtt_stub = MQTTPublisherStub()
    rest_stub = RESTClientStub()

    gen_ecg = CECGSignalGenerator(seed=42)
    gen_aud = AudioSignalGenerator(seed=42)
    gen_acc = ActigraphySignalGenerator(seed=42)
    gen_imp = ImpedanceSignalGenerator(seed=42)

    total_frames = int(round(total_duration_s / chunk_duration_s))
    dsp_latencies_ms: List[float] = []
    action_counts: Dict[str, int] = collections.defaultdict(int)

    print(f"{'Time (s)':<10} | {'Scenario Phase':<26} | {'FSM State':<26} | {'HR / RMSSD':<16} | {'Action Trigger'}")
    print("-" * 110)

    prev_state: Optional[FSMState] = None

    for frame_idx in range(total_frames):
        t_s = (frame_idx + 1) * chunk_duration_s
        scenario = get_simulation_scenario(t_s)

        # Map scenario to modality levels
        if scenario == "BASELINE_SLEEP":
            ecg_lvl, aud_lvl, acc_lvl, imp_lvl = CECGLevel.NORMAL, AudioLevel.NORMAL, ActigraphyLevel.NORMAL, ImpedanceLevel.NORMAL
            is_shift, is_spill = False, False
        elif scenario == "ISOLATED_POSTURAL_SHIFT":
            ecg_lvl, aud_lvl, acc_lvl, imp_lvl = CECGLevel.NORMAL, AudioLevel.NORMAL, ActigraphyLevel.NORMAL, ImpedanceLevel.NORMAL
            is_shift, is_spill = True, False
        elif scenario == "FLUID_SPILL_ARTIFACT":
            ecg_lvl, aud_lvl, acc_lvl, imp_lvl = CECGLevel.NORMAL, AudioLevel.LOW, ActigraphyLevel.LOW, ImpedanceLevel.HIGH
            is_shift, is_spill = False, True
        elif scenario == "PARASYMPATHETIC_SURGE":
            ecg_lvl, aud_lvl, acc_lvl, imp_lvl = CECGLevel.HIGH, AudioLevel.NORMAL, ActigraphyLevel.NORMAL, ImpedanceLevel.HIGH
            is_shift, is_spill = False, False
        elif scenario == "PRE_EMESIS_WARNING":
            ecg_lvl, aud_lvl, acc_lvl, imp_lvl = CECGLevel.HIGH, AudioLevel.HIGH, ActigraphyLevel.HIGH, ImpedanceLevel.HIGH
            is_shift, is_spill = False, False
        else:  # ACTIVE_EMESIS_EVENT
            ecg_lvl, aud_lvl, acc_lvl, imp_lvl = CECGLevel.HIGH, AudioLevel.HIGH, ActigraphyLevel.HIGH, ImpedanceLevel.HIGH
            is_shift, is_spill = True, False

        t0 = time.perf_counter()

        ecg_samp = gen_ecg.generate_chunk(duration_s=chunk_duration_s, level=ecg_lvl)
        aud_samp = gen_aud.generate_chunk(duration_s=chunk_duration_s, level=aud_lvl)
        acc_samp = gen_acc.generate_chunk(duration_s=chunk_duration_s, level=acc_lvl, is_macro_shift=is_shift)
        imp_samp = gen_imp.generate_chunk(duration_s=chunk_duration_s, level=imp_lvl, is_fluid_spill=is_spill)

        metrics = pipeline.process_frame_batch(ecg_samp, aud_samp, acc_samp, imp_samp, timestamp_s=t_s)
        fres = fusion.evaluate(metrics)
        diag = fsm.update(metrics, fres)

        t_elapsed_ms = (time.perf_counter() - t0) * 1000.0
        dsp_latencies_ms.append(t_elapsed_ms)

        payload = formatter.format_payload(
            timestamp_s=t_s,
            current_state=diag.current_state.value,
            previous_state=diag.previous_state.value,
            state_duration_s=diag.state_duration_s,
            confidence_score=diag.confidence_score,
            action_trigger=diag.action_trigger.value,
            artifact_type=diag.artifact_type.value,
            clinical_rationale=diag.clinical_rationale,
            concordance_score=diag.fusion_result.concordance_score,
            dsp_metrics=metrics,
        )

        mqtt_stub.publish_actuation(payload)
        rest_stub.post_telemetry(payload)
        action_counts[diag.action_trigger.value] += 1

        is_state_change = (diag.current_state != prev_state)
        is_periodic = (int(t_s * 5) % 15 == 0)

        if is_state_change or is_periodic:
            prev_state = diag.current_state
            print(f"\n--- t={t_s:.1f}s [{scenario}] ---")
            print(payload.format_clinical_log())
            last_payload = payload

    print("\n" + "=" * 90)
    print("  SIMULATION SUMMARY REPORT")
    print("=" * 90)
    avg_latency = float(np.mean(dsp_latencies_ms))
    max_latency = float(np.max(dsp_latencies_ms))
    print(f"  * Average DSP Execution Latency: {avg_latency:.3f} ms / frame (Budget: 200.0 ms)")
    print(f"  * Maximum DSP Execution Latency: {max_latency:.3f} ms")
    print(f"  * Real-Time Headroom:            {((200.0 - max_latency) / 200.0) * 100:.1f}%\n")
    print("  * Edge IoT Actuation Triggers Dispatched:")
    for act, cnt in action_counts.items():
        print(f"    - {act:<35}: {cnt} frames ({cnt * chunk_duration_s:.1f} s)")
    print("\n" + "=" * 90)
    print("  [SUCCESS] Telemedicine simulation executed successfully.")
    print("=" * 90 + "\n")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ("--interactive", "-i"):
        from interactive_tester import run_interactive_session
        run_interactive_session()
    else:
        run_simulation()
