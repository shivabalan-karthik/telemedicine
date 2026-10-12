"""
randtestcase.py
===============
Launcher script for running an automated random testcase across all 4 biomedical databases:
  1. Acquires random patient records from cECG, Audio, Impedance, and Actigraphy databases.
  2. Passes each through its respective DSP subsystem.
  3. Evaluates 4-sensor data through the Multimodal Decision Fusion Matrix.
  4. Steps through the Hybrid Moore-EFSM Engine.
  5. Outputs formatted HL7 Clinical Documentation Telemetry Log.
"""

from run_multimodal_database_pipeline import run_pipeline

if __name__ == "__main__":
    run_pipeline()
