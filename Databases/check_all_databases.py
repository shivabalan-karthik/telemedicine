"""
check_all_databases.py
======================
Comprehensive verification script to inspect and read all 4 physiological databases:
1. ECG Database (MIMIC-IV-ECG 12-lead diagnostic traces)
2. Audio Database (Gastrointestinal acoustic motility and bowel sounds)
3. Impedance Database (Electrodermal activity pulse amplitudes)
4. Actigraphy Database (Empatica E4 3-axis accelerometer and resilience data)
"""

import sys
import os

# Set root directory
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, CURRENT_DIR)

from ecg_database.reader import ECGDatabaseReader
from audio_database.reader import AudioDatabaseReader
from impedance_database.reader import EDADatabaseReader
from actigraphy_database.reader import ActigraphyDatabaseReader


def test_ecg():
    print("\n" + "=" * 60)
    print("1. ECG DATABASE (MIMIC-IV-ECG Demo)")
    print("=" * 60)
    reader = ECGDatabaseReader(os.path.join(CURRENT_DIR, "ecg_database"))
    records = reader.records_index
    unique_patients = set(r["subject_id"] for r in records)
    print(f"Status: OK | Indexed Records: {len(records)} | Unique Patients: {len(unique_patients)}")
    if records:
        sample = reader.read_record(0)
        print("Sample Record Verification:")
        print(sample.summary())


def test_audio():
    print("\n" + "=" * 60)
    print("2. AUDIO DATABASE (Gastrointestinal Bowel Sounds)")
    print("=" * 60)
    reader = AudioDatabaseReader(os.path.join(CURRENT_DIR, "audio_database"))
    recordings = reader.list_recordings()
    print(f"Status: OK | Total Audio Recordings: {len(recordings)}")
    if recordings:
        sample = reader.read_audio(recordings[0])
        print("Sample Recording Verification:")
        print(sample.summary())


def test_impedance():
    print("\n" + "=" * 60)
    print("3. IMPEDANCE DATABASE (EDA Pulse Amplitudes)")
    print("=" * 60)
    reader = EDADatabaseReader(os.path.join(CURRENT_DIR, "impedance_database"))
    cohorts = reader.COHORTS
    total_subjects = 0
    for cohort in cohorts:
        subs = reader.list_subjects(cohort)
        total_subjects += len(subs)
        stats = reader.cohort_statistics(cohort)
        print(f"Cohort '{cohort}': {len(subs)} subjects | Mean Burst Rate: {stats.get('mean_burst_rate_per_min', 0):.2f} pulses/min")
    print(f"Status: OK | Total EDA Subjects: {total_subjects}")
    sample = reader.read_subject("At-Rest", 1)
    print("Sample Subject Verification:")
    print(sample.summary())


def test_actigraphy():
    print("\n" + "=" * 60)
    print("4. ACTIGRAPHY DATABASE (Empatica E4 3-Axis Accelerometer)")
    print("=" * 60)
    reader = ActigraphyDatabaseReader(os.path.join(CURRENT_DIR, "actigraphy_database"))
    subjects = reader.list_subjects()
    print(f"Status: OK | Total Actigraphy Subjects: {len(subjects)}")
    if subjects:
        sample = reader.read_actigraphy(subjects[0])
        print("Sample Subject Verification:")
        print(sample.summary())


if __name__ == "__main__":
    print("COMMENCING FULL TELEMEDICINE DATABASE READABILITY AUDIT...")
    test_ecg()
    test_audio()
    test_impedance()
    test_actigraphy()
    print("\n" + "=" * 60)
    print("AUDIT COMPLETE: All 4 physiological databases verified readable!")
    print("=" * 60)
