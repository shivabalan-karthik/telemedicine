"""
actigraphy/interactive_tester.py
================================
Standalone Interactive CLI Tester for Piezoelectric Actigraphy:
  * Accepts Trinary {-1, 0, 1} inputs, 'shift' for macro postural repositioning
  * Computes dynamic Vector Magnitude and 1-15 Hz bandpass filtered RMS
  * Disambiguates between normal resting sleep, shivering tremor, and gross movement
  * Logs interactive evaluation records to logs/actigraphy_test_history.csv
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
    from actigraphy.spec import ActigraphyLevel, ACTIGRAPHY_SPECS, SAMPLING_RATE_HZ
    from actigraphy.dsp import ActigraphyProcessor, ActigraphyMetrics
    from actigraphy.generator import ActigraphySignalGenerator
else:
    from .spec import ActigraphyLevel, ACTIGRAPHY_SPECS, SAMPLING_RATE_HZ
    from .dsp import ActigraphyProcessor, ActigraphyMetrics
    from .generator import ActigraphySignalGenerator


LOGS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
CSV_LOG_PATH = os.path.join(LOGS_DIR, "actigraphy_test_history.csv")


def banner() -> None:
    print("\n" + "=" * 80)
    print("  PIEZOELECTRIC ACTIGRAPHY INTERACTIVE TEST BENCH (50 Hz)")
    print("  Vector Magnitude & 1-15 Hz Bandpass Shivering / Postural Shift Analyzer")
    print("=" * 80)
    print("Input Level Options:")
    print("  * -1 (or 'low')   -> Motionless deep sleep (RMS ~0.005 g)")
    print("  *  0 (or 'med')   -> Calm Sleep (0.25 Hz breathing sway, filtered RMS ~0.010 g, NO SHIVER)")
    print("  *  1 (or 'high')  -> Clonic Shivering Tremor (4.2 Hz, filtered RMS ~0.067 g, SHIVER = TRUE)")
    print("  * 'shift'         -> Gross Postural Shift Roll (>0.22 g macro movement artifact)")
    print("Commands:")
    print("  * 'reset' -> Reset filter and sliding RMS window")
    print("  * 'quit'  -> Exit")
    print("=" * 80 + "\n")


def log_record(level_str: str, metrics: ActigraphyMetrics) -> None:
    file_exists = os.path.isfile(CSV_LOG_PATH)
    with open(CSV_LOG_PATH, mode="a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists or os.path.getsize(CSV_LOG_PATH) == 0:
            writer.writerow([
                "timestamp_iso", "input_level", "vm_rms_g",
                "shivering_flag", "macro_shift_flag"
            ])
        writer.writerow([
            datetime.datetime.now(datetime.timezone.utc).isoformat(),
            level_str,
            round(metrics.actigraphy_vm_rms, 4),
            metrics.shivering_detected,
            metrics.macro_postural_shift_detected,
        ])


def parse_input(raw: str) -> Optional[tuple[str, ActigraphyLevel, bool]]:
    t = raw.strip().lower()
    if t in ("-1", "low", "l"):
        return ("-1", ActigraphyLevel.LOW, False)
    elif t in ("0", "normal", "med", "m", "perfect"):
        return ("0", ActigraphyLevel.NORMAL, False)
    elif t in ("1", "high", "h", "shiver"):
        return ("1", ActigraphyLevel.HIGH, False)
    elif t in ("shift", "macro", "postural", "roll"):
        return ("shift", ActigraphyLevel.NORMAL, True)
    return None


def run_interactive():
    banner()
    processor = ActigraphyProcessor(fs=SAMPLING_RATE_HZ)
    generator = ActigraphySignalGenerator(fs=SAMPLING_RATE_HZ, seed=42)

    while True:
        try:
            cmd = input("Actigraphy Input {-1, 0, 1, shift} > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting. Goodbye!")
            break

        if not cmd:
            continue
        if cmd.lower() in ("quit", "exit", "q"):
            print("\nExiting Actigraphy test bench.")
            break
        if cmd.lower() in ("reset", "r"):
            processor.reset()
            generator = ActigraphySignalGenerator(fs=SAMPLING_RATE_HZ, seed=42)
            print("[OK] Actigraphy Processor and Generator reset.")
            continue

        res = parse_input(cmd)
        if res is None:
            print("[ERROR] Invalid input. Enter -1, 0, 1 or 'shift'.")
            continue

        level_str, level_enum, is_shift = res
        print(f">> Streaming 50 Hz Actigraphy for level '{level_str}' (is_macro_shift={is_shift}) ...")

        # Process 20 frames (4.0s total)
        last_metrics = None
        for frame in range(20):
            samples = generator.generate_chunk(duration_s=0.2, level=level_enum, is_macro_shift=is_shift)
            t_s = (frame + 1) * 0.2
            last_metrics = processor.process_samples(samples, timestamp_s=t_s)

        log_record(level_str, last_metrics)

        print("\n" + "-" * 60)
        print("  ACTIGRAPHY DIAGNOSTIC OUTPUT:")
        print(f"  * 1-15 Hz Filtered RMS:      {last_metrics.actigraphy_vm_rms:.4f} g")
        print(f"  * Shivering Tremor Detected:  {'YES -> TURN OFF FAN/AC' if last_metrics.shivering_detected else 'NO (Normal Calm Sleep)'}")
        print(f"  * Macro Postural Shift:       {'YES (Artifact Flagged)' if last_metrics.macro_postural_shift_detected else 'NO'}")
        print(f"  * Logged to: {CSV_LOG_PATH}")
        print("-" * 60 + "\n")


if __name__ == "__main__":
    run_interactive()
