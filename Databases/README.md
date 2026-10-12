# Telemedicine Databases

This directory stores datasets used for multimodal physiological monitoring, analysis, and algorithm benchmarking across the Telemedicine workspace.

## Datasets Directory Structure & Dedicated Readers

Each database includes a dedicated, streaming-compatible Python reader that reads directly from raw files or zip archives without requiring manual extraction:

1. **cECG (`ecg_database/`)**:
   - **Dataset**: MIMIC-IV-ECG matched diagnostic subset (WFDB Format 16 `.hea` + `.dat`).
   - **Records**: 659 recordings across 92 unique patients (12-lead traces: I, II, III, aVR, aVF, aVL, V1–V6 @ 500 Hz).
   - **Reader**: [`ecg_database/reader.py`](file:///c:/Users/Kshiv/Telemedicine/Databases/ecg_database/reader.py) (`ECGDatabaseReader`).

2. **Audio (`audio_database/`)**:
   - **Dataset**: Acoustic gastrointestinal phonoenterography & bowel sounds (`28595741.zip`).
   - **Records**: 7 long-duration acoustic recordings (48,000 Hz, ~470s each, 22.7M samples/record) with synchronized `.txt` clinical motility annotations.
   - **Reader**: [`audio_database/reader.py`](file:///c:/Users/Kshiv/Telemedicine/Databases/audio_database/reader.py) (`AudioDatabaseReader`).

3. **Impedance (`impedance_database/`)**:
   - **Dataset**: PhysioNet Electrodermal Activity (EDA) pulse amplitudes under At-Rest and Propofol-Sedation conditions.
   - **Records**: 22 subjects (11 At-Rest, 11 Propofol-Sedation) with sympathetic burst pulse timestamps and amplitudes ($\mu$S).
   - **Reader**: [`impedance_database/reader.py`](file:///c:/Users/Kshiv/Telemedicine/Databases/impedance_database/reader.py) (`EDADatabaseReader`).

4. **Actigraphy (`actigraphy_database/`)**:
   - **Dataset**: Empatica E4 physiological recordings during stress resilience tasks (`neurophysiological-dataset-of-stress-resilience-...zip`).
   - **Records**: 35 subjects with 3-axis accelerometer traces (`ACC.csv` @ 32 Hz), Vector Magnitude, ENMO, and CD-RISC resilience scores (`demographicCDrisk.csv`).
   - **Reader**: [`actigraphy_database/reader.py`](file:///c:/Users/Kshiv/Telemedicine/Databases/actigraphy_database/reader.py) (`ActigraphyDatabaseReader`).

## Database Verification & Multimodal Pipeline Commands

- **Full 4-Database Audit**:
  ```powershell
  & "C:\Users\Kshiv\miniconda3\python.exe" "c:\Users\Kshiv\Telemedicine\Databases\check_all_databases.py"
  ```

- **End-to-End Multimodal DSP $\rightarrow$ Fusion $\rightarrow$ FSM $\rightarrow$ Telemetry Runner**:
  ```powershell
  & "C:\Users\Kshiv\miniconda3\python.exe" "c:\Users\Kshiv\Telemedicine\run_multimodal_database_pipeline.py"
  ```
