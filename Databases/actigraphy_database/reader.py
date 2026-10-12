"""
reader.py
=========
Lightweight parser and reader for the actigraphy_database:
Neurophysiological Stress Resilience Dataset (Empatica E4 3-axis Actigraphy / Accelerometer,
BVP, EDA, HR, IBI, and TEMP signals).
Directly parses streaming streams from the 4.98GB zip archive or local directories without unpacking.
"""

from __future__ import annotations
import os
import io
import csv
import re
import zipfile
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import numpy as np


@dataclass
class ActigraphyRecord:
    subject_id: str
    sampling_rate: float          # Standard 32.0 Hz for Empatica E4 ACC
    start_time_unix: float
    duration_sec: float
    num_samples: int
    acc_x_g: np.ndarray           # Accelerometer X in 'g' units
    acc_y_g: np.ndarray           # Accelerometer Y in 'g' units
    acc_z_g: np.ndarray           # Accelerometer Z in 'g' units
    vector_magnitude_g: np.ndarray  # sqrt(X^2 + Y^2 + Z^2)
    enmo_g: np.ndarray            # Euclidean Norm Minus One: max(0, VM - 1.0)
    demographics: Optional[Dict[str, str]] = None

    @property
    def rms_dynamic_g(self) -> float:
        """Dynamic root-mean-square acceleration after baseline offset removal."""
        dyn = self.vector_magnitude_g - np.mean(self.vector_magnitude_g)
        return float(np.sqrt(np.mean(dyn**2)))

    def summary(self) -> str:
        lines = [
            f"Actigraphy Record: Subject {self.subject_id}",
            f"  Duration: {self.duration_sec:.1f}s ({self.duration_sec / 60.0:.2f} min)",
            f"  Sampling Rate: {self.sampling_rate:.1f} Hz | Samples: {self.num_samples:,}",
            f"  Mean Vector Magnitude: {np.mean(self.vector_magnitude_g):.4f} g",
            f"  Dynamic RMS (Motion Intensity): {self.rms_dynamic_g:.4f} g",
            f"  Mean ENMO (Activity Index): {np.mean(self.enmo_g):.4f} g",
            f"  3-Axis Bounds (g):",
            f"    X: [{self.acc_x_g.min():+.3f}, {self.acc_x_g.max():+.3f}] g",
            f"    Y: [{self.acc_y_g.min():+.3f}, {self.acc_y_g.max():+.3f}] g",
            f"    Z: [{self.acc_z_g.min():+.3f}, {self.acc_z_g.max():+.3f}] g",
        ]
        if self.demographics:
            demo_str = ", ".join(f"{k}: {v}" for k, v in self.demographics.items() if k != "Subject_ID")
            lines.append(f"  Demographics: {demo_str}")
        return "\n".join(lines)


class ActigraphyDatabaseReader:
    """
    Manager to query and stream actigraphy (3-axis accelerometer) and multimodal data
    from actigraphy_database.
    """

    ZIP_FILENAME = "neurophysiological-dataset-of-stress-resilience-during-human-computer-interaction-1.0.0.zip"

    def __init__(self, db_dir: Optional[str] = None) -> None:
        if db_dir is None:
            db_dir = os.path.dirname(os.path.abspath(__file__))
        self.db_dir = db_dir
        self.zip_path = os.path.join(self.db_dir, self.ZIP_FILENAME)
        self.demographics: Dict[str, Dict[str, str]] = self._load_demographics()
        self._cached_subjects: Optional[List[str]] = None

    def _load_demographics(self) -> Dict[str, Dict[str, str]]:
        demo_path = os.path.join(self.db_dir, "demographicCDrisk.csv")
        results = {}
        if os.path.exists(demo_path):
            with open(demo_path, mode="r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    sub_id = row.get("Subject_ID", "").strip()
                    if sub_id:
                        results[sub_id] = {k: v.strip() for k, v in row.items()}
        return results

    def list_subjects(self) -> List[str]:
        if self._cached_subjects is not None:
            return self._cached_subjects

        subjects = set()
        if os.path.exists(self.zip_path):
            with zipfile.ZipFile(self.zip_path, "r") as zf:
                for name in zf.namelist():
                    m = re.search(r"PPG/(p\d+)/ACC\.csv", name)
                    if m:
                        subjects.add(m.group(1))

        if not subjects:
            ppg_dir = os.path.join(self.db_dir, "PPG")
            if os.path.isdir(ppg_dir):
                for d in os.listdir(ppg_dir):
                    if os.path.exists(os.path.join(ppg_dir, d, "ACC.csv")):
                        subjects.add(d)

        self._cached_subjects = sorted(list(subjects))
        return self._cached_subjects

    def read_actigraphy(self, subject_id: str) -> ActigraphyRecord:
        """
        Reads and parses the 3-axis accelerometer record for a given subject.
        """
        acc_rel = f"PPG/{subject_id}/ACC.csv"
        raw_text = None

        if os.path.exists(self.zip_path):
            with zipfile.ZipFile(self.zip_path, "r") as zf:
                # Find matching entry
                target_entry = None
                for n in zf.namelist():
                    if n.endswith(acc_rel):
                        target_entry = n
                        break
                if target_entry:
                    raw_text = zf.read(target_entry).decode("utf-8", errors="replace")

        if raw_text is None:
            local_file = os.path.join(self.db_dir, "PPG", subject_id, "ACC.csv")
            if os.path.exists(local_file):
                with open(local_file, "r", encoding="utf-8", errors="replace") as f:
                    raw_text = f.read()

        if raw_text is None:
            raise FileNotFoundError(f"ACC data for subject '{subject_id}' not found.")

        lines = raw_text.strip().splitlines()
        if len(lines) < 3:
            raise ValueError(f"Insufficient data in ACC.csv for subject '{subject_id}'")

        # Empatica E4 format:
        # Line 0: Start timestamp (Unix epoch in seconds)
        # Line 1: Sampling rate in Hz (typically 32.0)
        # Line 2+: X, Y, Z integer values in units of 1/64 g
        header_time = lines[0].split(",")
        start_time = float(header_time[0].strip())

        header_fs = lines[1].split(",")
        sampling_rate = float(header_fs[0].strip())

        raw_data = np.loadtxt(lines[2:], delimiter=",", dtype=np.float32)

        # Scale raw integers (1/64g) to standard acceleration in g
        acc_g = raw_data / 64.0
        acc_x = acc_g[:, 0]
        acc_y = acc_g[:, 1]
        acc_z = acc_g[:, 2]

        # Compute 3D vector magnitude and ENMO
        vm = np.sqrt(acc_x**2 + acc_y**2 + acc_z**2)
        enmo = np.maximum(0.0, vm - 1.0)

        num_samples = len(acc_x)
        duration_sec = num_samples / sampling_rate if sampling_rate > 0 else 0.0

        return ActigraphyRecord(
            subject_id=subject_id,
            sampling_rate=sampling_rate,
            start_time_unix=start_time,
            duration_sec=duration_sec,
            num_samples=num_samples,
            acc_x_g=acc_x,
            acc_y_g=acc_y,
            acc_z_g=acc_z,
            vector_magnitude_g=vm,
            enmo_g=enmo,
            demographics=self.demographics.get(subject_id),
        )


if __name__ == "__main__":
    reader = ActigraphyDatabaseReader()
    subjects = reader.list_subjects()
    print(f"Total actigraphy subjects in database: {len(subjects)}")
    if subjects:
        print(f"Sample subjects: {subjects[:8]}")
        sample_sub = subjects[0]
        print(f"\nLoading actigraphy for subject '{sample_sub}':")
        rec = reader.read_actigraphy(sample_sub)
        print(rec.summary())
