"""
audio/interactive_tester.py
===========================
Standalone Interactive CLI Tester for Acoustic Phonoenterography:
  * Accepts Trinary {-1, 0, 1} inputs or custom acoustic energy
  * Runs 100-2000 Hz bandpass filtering, Short-Time Energy (STE), and ZCR
  * Detects pre-emesis epigastric retch spikes
  * Logs interactive evaluation records to logs/audio_test_history.csv
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
    from audio.spec import AudioLevel, AUDIO_SPECS, SAMPLING_RATE_HZ
    from audio.dsp import AcousticProcessor, AudioMetrics
    from audio.generator import AudioSignalGenerator
else:
    from .spec import AudioLevel, AUDIO_SPECS, SAMPLING_RATE_HZ
    from .dsp import AcousticProcessor, AudioMetrics
    from .generator import AudioSignalGenerator


LOGS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
CSV_LOG_PATH = os.path.join(LOGS_DIR, "audio_test_history.csv")


def banner() -> None:
    print("\n" + "=" * 80)
    print("  ACOUSTIC PHONOENTEROGRAPHY INTERACTIVE TEST BENCH (4000 Hz)")
    print("  Short-Time Energy (STE) & Epigastric Retch Burst Detection Analyzer")
    print("=" * 80)
    print("Input Level Options:")
    print("  * -1 (or 'low')   -> Dead silence / ambient bedroom floor (0.00005 V^2)")
    print("  *  0 (or 'med')   -> Normal peristaltic bowel murmur (0.00035 V^2)")
    print("  *  1 (or 'high')  -> Pre-Emesis Retching Spikes (0.02500 V^2, BURST = TRUE)")
    print("Commands:")
    print("  * 'reset' -> Reset filter and baseline noise floor tracker")
    print("  * 'quit'  -> Exit")
    print("=" * 80 + "\n")


def log_record(level_str: str, metrics: AudioMetrics) -> None:
    file_exists = os.path.isfile(CSV_LOG_PATH)
    with open(CSV_LOG_PATH, mode="a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists or os.path.getsize(CSV_LOG_PATH) == 0:
            writer.writerow([
                "timestamp_iso", "input_level", "short_time_energy",
                "zero_crossing_rate", "retch_burst_flag"
            ])
        writer.writerow([
            datetime.datetime.now(datetime.timezone.utc).isoformat(),
            level_str,
            round(metrics.acoustic_short_time_energy, 6),
            round(metrics.acoustic_zcr, 4),
            metrics.acoustic_burst_detected,
        ])


def parse_input(raw: str) -> Optional[tuple[str, AudioLevel]]:
    t = raw.strip().lower()
    if t in ("-1", "low", "l", "silent"):
        return ("-1", AudioLevel.LOW)
    elif t in ("0", "normal", "med", "m", "perfect"):
        return ("0", AudioLevel.NORMAL)
    elif t in ("1", "high", "h", "retch"):
        return ("1", AudioLevel.HIGH)
    return None


def run_interactive():
    banner()
    processor = AcousticProcessor(fs=SAMPLING_RATE_HZ)
    generator = AudioSignalGenerator(fs=SAMPLING_RATE_HZ, seed=42)

    while True:
        try:
            cmd = input("Audio Input {-1, 0, 1} > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting. Goodbye!")
            break

        if not cmd:
            continue
        if cmd.lower() in ("quit", "exit", "q"):
            print("\nExiting Audio test bench.")
            break
        if cmd.lower() in ("reset", "r"):
            processor.reset()
            generator = AudioSignalGenerator(fs=SAMPLING_RATE_HZ, seed=42)
            print("[OK] Acoustic Processor and Generator reset.")
            continue

        res = parse_input(cmd)
        if res is None:
            print("[ERROR] Invalid input. Enter -1, 0, or 1.")
            continue

        level_str, level_enum = res
        print(f">> Streaming 4000 Hz Audio for level '{level_str}' ...")

        # Process 20 frames (4.0s total)
        last_metrics = None
        for frame in range(20):
            samples = generator.generate_chunk(duration_s=0.2, level=level_enum)
            t_s = (frame + 1) * 0.2
            last_metrics = processor.process_samples(samples, timestamp_s=t_s)

        log_record(level_str, last_metrics)

        print("\n" + "-" * 60)
        print("  ACOUSTIC DIAGNOSTIC OUTPUT:")
        print(f"  * Short-Time Energy (STE):  {last_metrics.acoustic_short_time_energy:.6f} V^2")
        print(f"  * Zero-Crossing Rate (ZCR): {last_metrics.acoustic_zcr:.4f}")
        print(f"  * Retch Burst Spike Flag:   {'YES (Epigastric Burst Detected)' if last_metrics.acoustic_burst_detected else 'NO (Normal Audio)'}")
        print(f"  * Logged to: {CSV_LOG_PATH}")
        print("-" * 60 + "\n")


if __name__ == "__main__":
    run_interactive()
