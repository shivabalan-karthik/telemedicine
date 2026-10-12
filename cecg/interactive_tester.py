"""
cecg/interactive_tester.py
==========================
Standalone Interactive CLI Tester for Capacitive ECG (cECG):
  * Accepts Trinary {-1, 0, 1} inputs or custom Heart Rate (BPM)
  * Runs Pan-Tompkins real-time QRS detection and RMSSD HRV calculation
  * Logs interactive evaluation records to logs/cecg_test_history.csv
"""

from __future__ import annotations
import csv
import datetime
import os
import sys
from typing import Optional

# Support execution both directly and as a package
if __name__ == "__main__" and __package__ is None:
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from cecg.spec import CECGLevel, CECG_SPECS, SAMPLING_RATE_HZ
    from cecg.dsp import PanTompkinsECGProcessor, CECGMetrics
    from cecg.generator import CECGSignalGenerator
else:
    from .spec import CECGLevel, CECG_SPECS, SAMPLING_RATE_HZ
    from .dsp import PanTompkinsECGProcessor, CECGMetrics
    from .generator import CECGSignalGenerator


LOGS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
CSV_LOG_PATH = os.path.join(LOGS_DIR, "cecg_test_history.csv")


def banner() -> None:
    print("\n" + "=" * 80)
    print("  CAPACITIVE ECG (cECG) INTERACTIVE TEST BENCH (250 Hz)")
    print("  Pan-Tompkins QRS Detection & Real-Time RMSSD (HRV) Extractor")
    print("=" * 80)
    print("Input Level Options:")
    print("  * -1 (or 'low')  -> Bradycardia (48 BPM, RMSSD ~18 ms)")
    print("  *  0 (or 'med')  -> Normal Resting Baseline (65 BPM, RMSSD ~35 ms)")
    print("  *  1 (or 'high') -> Autonomic Vagal Surge (95 BPM, RMSSD ~88 ms)")
    print("  * Or enter a direct numeric Heart Rate in BPM (e.g. 72, 110, 45)")
    print("Commands:")
    print("  * 'reset' -> Reset Pan-Tompkins filter and threshold state")
    print("  * 'quit'  -> Exit")
    print("=" * 80 + "\n")


def log_record(level_str: str, target_hr: float, metrics: CECGMetrics) -> None:
    file_exists = os.path.isfile(CSV_LOG_PATH)
    with open(CSV_LOG_PATH, mode="a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists or os.path.getsize(CSV_LOG_PATH) == 0:
            writer.writerow([
                "timestamp_iso", "input_level", "target_hr_bpm",
                "estimated_hr_bpm", "rmssd_ms", "r_peaks_detected", "vagal_surge_flag"
            ])
        writer.writerow([
            datetime.datetime.now(datetime.timezone.utc).isoformat(),
            level_str, target_hr,
            round(metrics.heart_rate_bpm, 1),
            round(metrics.rmssd_ms, 1),
            metrics.r_peaks_detected_count,
            metrics.hrv_surge_detected,
        ])


def parse_input(raw: str) -> Optional[tuple[str, float]]:
    t = raw.strip().lower()
    if t in ("-1", "low", "l"):
        return ("-1", CECG_SPECS[CECGLevel.LOW].default_hr_bpm)
    elif t in ("0", "normal", "med", "m", "perfect"):
        return ("0", CECG_SPECS[CECGLevel.NORMAL].default_hr_bpm)
    elif t in ("1", "high", "h"):
        return ("1", CECG_SPECS[CECGLevel.HIGH].default_hr_bpm)
    try:
        val = float(t)
        if 30.0 <= val <= 220.0:
            return (f"custom_{val}bpm", val)
    except ValueError:
        pass
    return None


def run_interactive():
    banner()
    processor = PanTompkinsECGProcessor(fs=SAMPLING_RATE_HZ)
    generator = CECGSignalGenerator(fs=SAMPLING_RATE_HZ, seed=42)

    while True:
        try:
            cmd = input("cECG Input {-1, 0, 1 or BPM} > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting. Goodbye!")
            break

        if not cmd:
            continue
        if cmd.lower() in ("quit", "exit", "q"):
            print("\nExiting cECG test bench.")
            break
        if cmd.lower() in ("reset", "r"):
            processor.reset()
            generator = CECGSignalGenerator(fs=SAMPLING_RATE_HZ, seed=42)
            print("[OK] cECG Processor and Generator reset.")
            continue

        res = parse_input(cmd)
        if res is None:
            print("[ERROR] Invalid input. Enter -1, 0, 1 or numeric BPM (e.g. 75).")
            continue

        level_str, target_hr = res
        print(f">> Streaming 250 Hz cECG synthesized with Target HR: {target_hr} BPM ...")

        # Process 20 frames (4.0 seconds total to warm up Pan-Tompkins integration window)
        total_peaks = 0
        last_metrics = None
        for frame in range(20):
            samples = generator.generate_chunk(duration_s=0.2, custom_hr=target_hr)
            t_s = (frame + 1) * 0.2
            last_metrics = processor.process_samples(samples, timestamp_s=t_s)
            total_peaks += last_metrics.r_peaks_detected_count

        log_record(level_str, target_hr, last_metrics)

        print("\n" + "-" * 60)
        print("  cECG DIAGNOSTIC OUTPUT:")
        print(f"  * Estimated Heart Rate:   {last_metrics.heart_rate_bpm:.1f} BPM (Target: {target_hr:.1f} BPM)")
        print(f"  * Calculated RMSSD (HRV): {last_metrics.rmssd_ms:.1f} ms")
        print(f"  * Total R-Peaks Found:    {total_peaks}")
        print(f"  * Vagal Tone Surge Flag:  {'YES (Elevated RMSSD)' if last_metrics.hrv_surge_detected else 'NO (Normal)'}")
        print(f"  * Logged to: {CSV_LOG_PATH}")
        print("-" * 60 + "\n")


if __name__ == "__main__":
    run_interactive()
