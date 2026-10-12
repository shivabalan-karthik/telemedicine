"""
reader.py
=========
Lightweight parser and reader for the PhysioNet Electrodermal Activity (EDA)
Pulse Amplitudes Database (At-Rest vs Propofol-Sedation).
"""

from __future__ import annotations
import os
import glob
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import numpy as np


@dataclass
class EDASubjectRecord:
    cohort: str  # 'At-Rest' or 'Propofol-Sedation'
    subject_id: int
    pulse_times_s: np.ndarray       # Timestamps of EDA sympathetic bursts (seconds)
    pulse_amplitudes_us: np.ndarray # Amplitudes of EDA pulses (microSiemens, uS)

    @property
    def total_pulses(self) -> int:
        return len(self.pulse_times_s)

    @property
    def duration_s(self) -> float:
        return float(self.pulse_times_s[-1]) if len(self.pulse_times_s) > 0 else 0.0

    @property
    def burst_rate_per_min(self) -> float:
        dur_min = self.duration_s / 60.0
        return (self.total_pulses / dur_min) if dur_min > 0 else 0.0

    def summary(self) -> str:
        lines = [
            f"EDA Record: Cohort '{self.cohort}', Subject #{self.subject_id:02d}",
            f"  Total Extracted Pulses: {self.total_pulses}",
            f"  Monitoring Duration: {self.duration_s:.1f} seconds ({self.duration_s / 60.0:.1f} minutes)",
            f"  Sympathetic Burst Frequency: {self.burst_rate_per_min:.2f} pulses/min",
            f"  Pulse Amplitude (uS):",
            f"    Min:  {self.pulse_amplitudes_us.min():.5f} uS",
            f"    Max:  {self.pulse_amplitudes_us.max():.5f} uS",
            f"    Mean: {self.pulse_amplitudes_us.mean():.5f} uS",
            f"    Std:  {self.pulse_amplitudes_us.std():.5f} uS",
        ]
        return "\n".join(lines)


class EDADatabaseReader:
    """
    Manager to query and load EDA/impedance pulse recordings from impedance_database.
    """

    COHORTS = ["At-Rest", "Propofol-Sedation"]

    def __init__(self, db_dir: Optional[str] = None) -> None:
        if db_dir is None:
            db_dir = os.path.dirname(os.path.abspath(__file__))
        self.db_dir = db_dir

    def list_subjects(self, cohort: str = "At-Rest") -> List[int]:
        folder = os.path.join(self.db_dir, cohort)
        if not os.path.isdir(folder):
            return []
        time_files = glob.glob(os.path.join(folder, "pulse_times_*.csv"))
        sub_ids = []
        for f in time_files:
            basename = os.path.basename(f)
            num_str = basename.replace("pulse_times_", "").replace(".csv", "")
            try:
                sub_ids.append(int(num_str))
            except ValueError:
                pass
        return sorted(sub_ids)

    def read_subject(self, cohort: str, subject_id: int) -> EDASubjectRecord:
        if cohort not in self.COHORTS:
            raise ValueError(f"Invalid cohort '{cohort}'. Options: {self.COHORTS}")

        id_str = f"{subject_id:02d}"
        folder = os.path.join(self.db_dir, cohort)
        times_file = os.path.join(folder, f"pulse_times_{id_str}.csv")
        amps_file = os.path.join(folder, f"pulse_amps_{id_str}.csv")

        if not os.path.exists(times_file):
            raise FileNotFoundError(f"Missing times file: {times_file}")
        if not os.path.exists(amps_file):
            raise FileNotFoundError(f"Missing amplitudes file: {amps_file}")

        times = np.loadtxt(times_file, delimiter=",", dtype=np.float64)
        amps = np.loadtxt(amps_file, delimiter=",", dtype=np.float64)

        if times.ndim == 0:
            times = np.array([times])
        if amps.ndim == 0:
            amps = np.array([amps])

        return EDASubjectRecord(
            cohort=cohort,
            subject_id=subject_id,
            pulse_times_s=times,
            pulse_amplitudes_us=amps,
        )

    def cohort_statistics(self, cohort: str) -> Dict[str, float]:
        subjects = self.list_subjects(cohort)
        all_rates = []
        all_amps = []
        for s in subjects:
            rec = self.read_subject(cohort, s)
            all_rates.append(rec.burst_rate_per_min)
            all_amps.extend(rec.pulse_amplitudes_us.tolist())

        return {
            "num_subjects": len(subjects),
            "mean_burst_rate_per_min": float(np.mean(all_rates)),
            "std_burst_rate_per_min": float(np.std(all_rates)),
            "mean_amplitude_us": float(np.mean(all_amps)),
            "std_amplitude_us": float(np.std(all_amps)),
            "max_amplitude_us": float(np.max(all_amps)),
        }


if __name__ == "__main__":
    reader = EDADatabaseReader()
    print("=== PhysioNet Electrodermal Activity (EDA) Database ===")
    for cohort in reader.COHORTS:
        subs = reader.list_subjects(cohort)
        stats = reader.cohort_statistics(cohort)
        print(f"\nCohort: {cohort} ({len(subs)} subjects)")
        print(f"  Mean Burst Frequency: {stats['mean_burst_rate_per_min']:.2f} ± {stats['std_burst_rate_per_min']:.2f} pulses/min")
        print(f"  Mean Pulse Amplitude: {stats['mean_amplitude_us']:.5f} ± {stats['std_amplitude_us']:.5f} uS")
        print(f"  Peak Pulse Amplitude: {stats['max_amplitude_us']:.5f} uS")

    # Read first At-Rest subject
    rec01 = reader.read_subject("At-Rest", 1)
    print("\n" + rec01.summary())
