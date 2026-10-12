"""
reader.py
=========
Lightweight parser and reader for the MIMIC-IV-ECG Demo dataset.
Reads WFDB format 16 (.hea header + .dat binary data) into NumPy arrays.
"""

from __future__ import annotations
import os
import csv
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import numpy as np


@dataclass
class ECGRecord:
    study_id: str
    subject_id: str
    ecg_time: str
    sampling_rate: float
    num_samples: int
    duration_sec: float
    lead_names: List[str]
    signals_mv: np.ndarray  # Shape: (num_samples, num_leads)

    def get_lead(self, lead_name: str) -> np.ndarray:
        lead_u = lead_name.upper()
        for idx, name in enumerate(self.lead_names):
            if name.upper() == lead_u:
                return self.signals_mv[:, idx]
        raise ValueError(f"Lead '{lead_name}' not found. Available: {self.lead_names}")

    def summary(self) -> str:
        lines = [
            f"ECG Record: Study ID {self.study_id} (Patient {self.subject_id})",
            f"  Recorded Time: {self.ecg_time}",
            f"  Sampling Rate: {self.sampling_rate} Hz | Duration: {self.duration_sec:.1f}s ({self.num_samples} samples)",
            f"  Leads ({len(self.lead_names)}): {', '.join(self.lead_names)}",
            "  Lead Voltages (mV):",
        ]
        for idx, name in enumerate(self.lead_names):
            sig = self.signals_mv[:, idx]
            lines.append(
                f"    {name:>4s}: min={sig.min():+6.3f} mV, max={sig.max():+6.3f} mV, mean={sig.mean():+6.3f} mV"
            )
        return "\n".join(lines)


class ECGDatabaseReader:
    """
    Manager to query and load ECG recordings from the ecg_database directory.
    """

    def __init__(self, db_dir: Optional[str] = None) -> None:
        if db_dir is None:
            db_dir = os.path.dirname(os.path.abspath(__file__))
        self.db_dir = db_dir
        self.catalog_path = os.path.join(self.db_dir, "record_list.csv")
        self.records_index: List[Dict[str, str]] = []
        self._load_catalog()

    def _load_catalog(self) -> None:
        if not os.path.exists(self.catalog_path):
            raise FileNotFoundError(f"Catalog not found at {self.catalog_path}")
        with open(self.catalog_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            self.records_index = list(reader)

    def list_records(self, limit: Optional[int] = None) -> List[Dict[str, str]]:
        return self.records_index[:limit] if limit else self.records_index

    def find_by_subject(self, subject_id: str) -> List[Dict[str, str]]:
        return [r for r in self.records_index if r["subject_id"] == str(subject_id)]

    def read_record(self, record_meta_or_index: int | Dict[str, str]) -> ECGRecord:
        if isinstance(record_meta_or_index, int):
            meta = self.records_index[record_meta_or_index]
        else:
            meta = record_meta_or_index

        rel_path = meta["path"]
        # Normalize path separators
        rel_path = rel_path.replace("/", os.sep).replace("\\", os.sep)
        hea_file = os.path.join(self.db_dir, rel_path + ".hea")
        dat_file = os.path.join(self.db_dir, rel_path + ".dat")

        if not os.path.exists(hea_file):
            raise FileNotFoundError(f"Header file missing: {hea_file}")
        if not os.path.exists(dat_file):
            raise FileNotFoundError(f"Signal file missing: {dat_file}")

        with open(hea_file, "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f if l.strip()]

        # Line 0: record_name num_leads sampling_rate num_samples [time] [date]
        header_parts = lines[0].split()
        num_leads = int(header_parts[1])
        sampling_rate = float(header_parts[2])
        num_samples = int(header_parts[3])

        lead_names: List[str] = []
        gains: List[float] = []

        for l in lines[1:]:
            if l.startswith("#"):
                continue
            parts = l.split()
            # lead name is the last token
            lead_names.append(parts[-1])
            # gain format e.g. "200.0(0)/mV"
            gain_str = parts[2].split("(")[0].split("/")[0]
            gains.append(float(gain_str))

        # Binary format 16: 16-bit signed int, interleaved by lead
        raw = np.fromfile(dat_file, dtype=np.int16)
        matrix = raw.reshape((num_samples, num_leads)).astype(np.float32)

        for i in range(num_leads):
            if gains[i] != 0:
                matrix[:, i] /= gains[i]

        return ECGRecord(
            study_id=meta["study_id"],
            subject_id=meta["subject_id"],
            ecg_time=meta.get("ecg_time", ""),
            sampling_rate=sampling_rate,
            num_samples=num_samples,
            duration_sec=num_samples / sampling_rate,
            lead_names=lead_names,
            signals_mv=matrix,
        )


if __name__ == "__main__":
    reader = ECGDatabaseReader()
    print(f"Total indexed records in database: {len(reader.records_index)}")
    unique_patients = len(set(r['subject_id'] for r in reader.records_index))
    print(f"Total unique patients: {unique_patients}")
    
    # Read the very first record
    rec0 = reader.read_record(0)
    print("\n" + rec0.summary())
