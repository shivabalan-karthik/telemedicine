"""
impedance/interactive_tester.py
===============================
Standalone Interactive CLI Tester for E-Textile Impedance / Skin Conductance (EDA):
  * Accepts Trinary {-1, 0, 1} inputs or 'spill' for fluid artifact
  * Calculates phasic delta conductance (dG) and slew-rate differentiator
  * Classifies sudomotor cold sweat diaphoresis vs. accidental fluid spill
  * Logs interactive evaluation records to logs/impedance_test_history.csv
"""

from __future__ import annotations
import csv
import datetime
import os
import sys
from typing import Optional

# Support direct execution
if __name__ == "__main__" and __package__ is None:
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from impedance.spec import ImpedanceLevel, IMPEDANCE_SPECS, SAMPLING_RATE_HZ
    from impedance.dsp import ImpedanceProcessor, ImpedanceMetrics
    from impedance.generator import ImpedanceSignalGenerator
else:
    from .spec import ImpedanceLevel, IMPEDANCE_SPECS, SAMPLING_RATE_HZ
    from .dsp import ImpedanceProcessor, ImpedanceMetrics
    from .generator import ImpedanceSignalGenerator


LOGS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
CSV_LOG_PATH = os.path.join(LOGS_DIR, "impedance_test_history.csv")


def banner() -> None:
    print("\n" + "=" * 80)
    print("  E-TEXTILE IMPEDANCE / SKIN CONDUCTANCE INTERACTIVE TEST BENCH (20 Hz)")
    print("  EMA Baseline Tracker & Sudomotor Diaphoresis vs. Fluid Spill Classifier")
    print("=" * 80)
    print("Input Level Options:")
    print("  * -1 (or 'low')   -> Dry textile contact (2.0 uS)")
    print("  *  0 (or 'med')   -> Normal baseline skin contact (3.5 uS, Delta ~ 0.0 uS, NO SWEAT)")
    print("  *  1 (or 'high')  -> Active SWEATING Diaphoresis (+10.5 uS rise, SWEAT = TRUE)")
    print("  * 'spill'         -> Accidental Bed Fluid Spill (+45 uS sharp step, ARTIFACT = TRUE)")
    print("Commands:")
    print("  * 'reset' -> Reset EMA tonic baseline and spill latch")
    print("  * 'quit'  -> Exit")
    print("=" * 80 + "\n")


def log_record(level_str: str, metrics: ImpedanceMetrics) -> None:
    file_exists = os.path.isfile(CSV_LOG_PATH)
    with open(CSV_LOG_PATH, mode="a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists or os.path.getsize(CSV_LOG_PATH) == 0:
            writer.writerow([
                "timestamp_iso", "input_level", "raw_conductance_us",
                "baseline_us", "delta_us", "slew_rate_us_s",
                "diaphoresis_flag", "fluid_spill_flag"
            ])
        writer.writerow([
            datetime.datetime.now(datetime.timezone.utc).isoformat(),
            level_str,
            round(metrics.impedance_raw_uS, 2),
            round(metrics.impedance_baseline_uS, 2),
            round(metrics.impedance_delta_uS, 2),
            round(metrics.impedance_slew_rate_uS_s, 2),
            metrics.diaphoresis_detected,
            metrics.fluid_spill_signature,
        ])


def parse_input(raw: str) -> Optional[tuple[str, ImpedanceLevel, bool]]:
    t = raw.strip().lower()
    if t in ("-1", "low", "l", "dry"):
        return ("-1", ImpedanceLevel.LOW, False)
    elif t in ("0", "normal", "med", "m", "perfect"):
        return ("0", ImpedanceLevel.NORMAL, False)
    elif t in ("1", "high", "h", "sweat"):
        return ("1", ImpedanceLevel.HIGH, False)
    elif t in ("spill", "water", "fluid", "leak"):
        return ("spill", ImpedanceLevel.HIGH, True)
    return None


def run_interactive():
    banner()
    processor = ImpedanceProcessor(fs=SAMPLING_RATE_HZ)
    generator = ImpedanceSignalGenerator(fs=SAMPLING_RATE_HZ, seed=42)

    while True:
        try:
            cmd = input("Impedance Input {-1, 0, 1, spill} > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting. Goodbye!")
            break

        if not cmd:
            continue
        if cmd.lower() in ("quit", "exit", "q"):
            print("\nExiting Impedance test bench.")
            break
        if cmd.lower() in ("reset", "r"):
            processor.reset()
            generator = ImpedanceSignalGenerator(fs=SAMPLING_RATE_HZ, seed=42)
            print("[OK] Impedance Processor and Generator reset.")
            continue

        res = parse_input(cmd)
        if res is None:
            print("[ERROR] Invalid input. Enter -1, 0, 1 or 'spill'.")
            continue

        level_str, level_enum, is_spill = res
        print(f">> Streaming 20 Hz Impedance for level '{level_str}' (is_fluid_spill={is_spill}) ...")

        # Process 20 frames (4.0s total)
        last_metrics = None
        for frame in range(20):
            samples = generator.generate_chunk(duration_s=0.2, level=level_enum, is_fluid_spill=is_spill)
            t_s = (frame + 1) * 0.2
            last_metrics = processor.process_samples(samples, timestamp_s=t_s)

        log_record(level_str, last_metrics)

        print("\n" + "-" * 60)
        print("  IMPEDANCE DIAGNOSTIC OUTPUT:")
        print(f"  * Raw Skin Conductance:     {last_metrics.impedance_raw_uS:.2f} uS")
        print(f"  * Tonic Baseline Conductance:{last_metrics.impedance_baseline_uS:.2f} uS")
        print(f"  * Phasic Delta Conductance: +{last_metrics.impedance_delta_uS:.2f} uS")
        print(f"  * First-Order Slew Rate:    {last_metrics.impedance_slew_rate_uS_s:.2f} uS/s")
        print(f"  * Sudomotor Sweating Flag:  {'YES -> TURN ON FAN/AC' if last_metrics.diaphoresis_detected else 'NO'}")
        print(f"  * Fluid Spill Signature:    {'YES -> SUPPRESS ALERT (ARTIFACT)' if last_metrics.fluid_spill_signature else 'NO'}")
        print(f"  * Logged to: {CSV_LOG_PATH}")
        print("-" * 60 + "\n")


if __name__ == "__main__":
    run_interactive()
