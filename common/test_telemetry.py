"""
common/test_telemetry.py
========================
Unit tests for HL7 Clinical Documentation telemetry log formatters:
  - HL7 CDA R2 XML format validation
  - HL7 v2.5 ORU^R01 message segment format validation
  - LOINC & SNOMED CT clinical coding compliance
"""

import unittest
import xml.etree.ElementTree as ET
from common.telemetry import TelemetryFormatter, TelemetrySensorMetrics, TelemetryPayload


class TestHL7TelemetryFormatting(unittest.TestCase):
    """Test suite for HL7 Clinical Documentation telemetry formatting."""

    def setUp(self):
        self.metrics = TelemetrySensorMetrics(
            hr_bpm=95.0,
            rmssd_ms=75.0,
            acoustic_energy=0.025,
            actigraphy_rms_g=0.095,
            impedance_raw_us=14.0,
            impedance_delta_us=10.5,
            impedance_slew_rate_us_s=2.5,
            hrv_surge_detected=True,
            acoustic_burst_detected=True,
            shivering_detected=True,
            macro_postural_shift_detected=False,
            diaphoresis_detected=True,
            fluid_spill_signature=False,
        )
        self.payload = TelemetryPayload(
            timestamp_iso="2026-09-15T19:07:32+05:30",
            simulation_time_s=42.0,
            patient_id="PATIENT_AAL_0042",
            bed_id="BED_ALPHA_01",
            fsm_state="PARASYMPATHETIC_SURGE",
            previous_state="BASELINE",
            state_duration_s=5.2,
            confidence_score=0.985,
            action_trigger="TURN_ON_FAN_AC",
            artifact_type="NONE",
            clinical_rationale="Sudomotor diaphoresis detected (+10.5 uS). Turning ON Fan/AC.",
            concordance_score=1.0,
            sensor_metrics=self.metrics,
        )

    def test_hl7_timestamp_format(self):
        hl7_ts = self.payload._format_hl7_timestamp()
        self.assertEqual(hl7_ts, "20260915190732+0530")

    def test_hl7_cda_xml_structure(self):
        cda_xml = self.payload.format_hl7_cda_log()
        self.assertTrue(cda_xml.startswith('<?xml version="1.0" encoding="UTF-8"?>'))
        self.assertIn('<ClinicalDocument xmlns="urn:hl7-org:v3"', cda_xml)
        self.assertIn('code="34133-9"', cda_xml)  # LOINC document code
        self.assertIn('code="8716-3"', cda_xml)   # LOINC vital signs section code

        # Verify XML parsing
        root = ET.fromstring(cda_xml)
        self.assertIn("ClinicalDocument", root.tag)

        # Check LOINC observation codes in XML
        self.assertIn('code="8867-4"', cda_xml)   # Heart rate
        self.assertIn('code="80404-7"', cda_xml)  # RMSSD
        self.assertIn('code="29280-5"', cda_xml)  # Skin conductance
        self.assertIn('code="69420-8"', cda_xml)  # Actigraphy acceleration
        self.assertIn('code="80001-1"', cda_xml)  # Acoustic energy
        self.assertIn('code="75325-1"', cda_xml)  # FSM Diagnostic state
        self.assertIn('code="74213-0"', cda_xml)  # Action trigger

    def test_hl7_v2_message_structure(self):
        v2_msg = self.payload.format_hl7_v2_log()
        lines = v2_msg.split("\n")
        self.assertEqual(len(lines), 13)

        self.assertTrue(lines[0].startswith("MSH|^~\\&|TELEMEDICINE_EDGE|BED_MONITOR"))
        self.assertTrue(lines[1].startswith("PID|1||PATIENT_AAL_0042"))
        self.assertTrue(lines[2].startswith("PV1|1|I|BED_ALPHA_01"))
        self.assertTrue(lines[3].startswith("OBR|1|ORD"))

        # Verify OBX segments
        self.assertIn("75325-1^FSM Diagnostic State^LN||PARASYMPATHETIC_SURGE", lines[4])
        self.assertIn("8867-4^Heart Rate^LN||95.0|bpm", lines[5])
        self.assertIn("80404-7^RMSSD^LN||75.0|ms", lines[6])
        self.assertIn("29280-5^Skin Conductance^LN||14.00|uS", lines[7])
        self.assertIn("74213-0^Clinical Action Trigger^LN||TURN_ON_FAN_AC", lines[10])

    def test_format_clinical_log_options(self):
        default_log = self.payload.format_clinical_log()
        self.assertIn("<ClinicalDocument", default_log)

        cda_log = self.payload.format_clinical_log("hl7_cda")
        self.assertEqual(default_log, cda_log)

        v2_log = self.payload.format_clinical_log("hl7_v2")
        self.assertTrue(v2_log.startswith("MSH|"))

        legacy_log = self.payload.format_clinical_log("legacy")
        self.assertIn("Patient ID: PATIENT_AAL_0042", legacy_log)

    def test_to_clinical_dict_keys(self):
        d = self.payload.to_clinical_dict()
        self.assertIn("HL7_Timestamp", d)
        self.assertIn("HL7_CDA_XML", d)
        self.assertIn("HL7_V2_ORU_R01", d)
        self.assertIn("LOINC_Codes", d)
        self.assertEqual(d["LOINC_Codes"]["HeartRate"], "8867-4")


if __name__ == "__main__":
    unittest.main()
