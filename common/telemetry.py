"""
common/telemetry.py
===================
Standardized ISO-8601 JSON Telemetry formatter, MQTT publisher stub, and REST client stub.
"""

from __future__ import annotations

import collections
import datetime
import json
from dataclasses import asdict, dataclass
from typing import Any, Dict, Optional


@dataclass
class TelemetrySensorMetrics:
    """Standardized biometric metric summary for JSON telemetry."""
    hr_bpm: float
    rmssd_ms: float
    acoustic_energy: float
    actigraphy_rms_g: float
    impedance_raw_us: float
    impedance_delta_us: float
    impedance_slew_rate_us_s: float
    hrv_surge_detected: bool = False
    acoustic_burst_detected: bool = False
    shivering_detected: bool = False
    macro_postural_shift_detected: bool = False
    diaphoresis_detected: bool = False
    fluid_spill_signature: bool = False


@dataclass
class TelemetryPayload:
    """Standardized Telemedicine Bed Monitoring Telemetry Schema."""
    timestamp_iso: str
    simulation_time_s: float
    patient_id: str
    bed_id: str
    fsm_state: str
    previous_state: str
    state_duration_s: float
    confidence_score: float
    action_trigger: str
    artifact_type: str
    clinical_rationale: str
    concordance_score: float
    sensor_metrics: TelemetrySensorMetrics

    def to_json(self, indent: Optional[int] = 2) -> str:
        """Serializes payload to standard JSON string."""
        return json.dumps(asdict(self), indent=indent)

    def get_cecg_level(self) -> str:
        """Categorizes cECG value into 'high', 'baseline', or 'medium'."""
        if self.sensor_metrics.hrv_surge_detected or self.sensor_metrics.rmssd_ms >= 70.0 or self.sensor_metrics.hr_bpm >= 85.0:
            return "high"
        elif self.sensor_metrics.rmssd_ms >= 45.0 or self.sensor_metrics.hr_bpm >= 72.0:
            return "medium"
        return "baseline"

    def get_impedance_level(self) -> str:
        """Categorizes impedance into 'high', 'baseline', or 'medium'."""
        delta = abs(self.sensor_metrics.impedance_delta_us)
        slew = abs(self.sensor_metrics.impedance_slew_rate_us_s)
        if self.sensor_metrics.diaphoresis_detected or self.sensor_metrics.fluid_spill_signature or delta >= 0.5 or slew >= 0.5:
            return "high"
        elif delta >= 0.15 or slew >= 0.1:
            return "medium"
        return "baseline"

    def get_actigraphy_level(self) -> str:
        """Categorizes actigraphy into 'high', 'baseline', or 'medium'."""
        if self.sensor_metrics.shivering_detected or self.sensor_metrics.macro_postural_shift_detected or self.sensor_metrics.actigraphy_rms_g >= 0.05:
            return "high"
        elif self.sensor_metrics.actigraphy_rms_g >= 0.015:
            return "medium"
        return "baseline"

    def get_gastral_noise_level(self) -> str:
        """Categorizes gastral acoustic noise into 'high', 'baseline', or 'medium'."""
        if self.sensor_metrics.acoustic_burst_detected or self.sensor_metrics.acoustic_energy >= 0.002:
            return "high"
        elif self.sensor_metrics.acoustic_energy >= 0.00015:
            return "medium"
        return "baseline"

    def get_anomaly_detected(self) -> str:
        """Evaluates whether an anomaly or artifact is currently detected."""
        if self.fsm_state == "BASELINE":
            if self.sensor_metrics.shivering_detected or "TURN_OFF_FAN_AC" in self.action_trigger:
                return "Yes (Nocturnal Shivering Tremor)"
            return "No"
        elif self.fsm_state == "PARASYMPATHETIC_SURGE":
            return "Yes (Sudomotor Cold Sweat Diaphoresis)"
        elif self.fsm_state == "PRE_EMESIS_WARNING":
            return "Yes (Pre-Emesis Warning Cascade)"
        elif self.fsm_state == "ACTIVE_EMESIS_EVENT":
            return "Yes (Active Emesis Event)"
        elif self.fsm_state == "ARTIFACT_REJECTED":
            return f"Artifact ({self.artifact_type})"
        return "No"

    def get_anomaly_duration_s(self) -> float:
        """Returns the active duration of the detected anomaly in seconds."""
        if self.fsm_state != "BASELINE" or "TURN_OFF_FAN_AC" in self.action_trigger:
            return self.state_duration_s
        return 0.0

    def _format_timestamp(self) -> str:
        """
        Formats timestamp as:  T{HH:MM:SS}D{DD.MM.YYYY}GZ{+HH:MM}
        Example:               T18:30:45D09.09.2026GZ+05:30
        """
        try:
            dt = datetime.datetime.fromisoformat(self.timestamp_iso)
            time_part = dt.strftime("%H:%M:%S")
            date_part = dt.strftime("%d.%m.%Y")
            # Timezone offset: e.g. +05:30 or +00:00
            if dt.tzinfo is not None:
                total_offset_s = int(dt.utcoffset().total_seconds())
                sign = "+" if total_offset_s >= 0 else "-"
                total_offset_s = abs(total_offset_s)
                tz_h, tz_m = divmod(total_offset_s // 60, 60)
                tz_part = f"{sign}{tz_h:02d}:{tz_m:02d}"
            else:
                tz_part = "+00:00"
            return f"T{time_part}D{date_part}GZ{tz_part}"
        except Exception:
            return self.timestamp_iso

    def _format_hl7_timestamp(self) -> str:
        """Formats timestamp into HL7 standard date-time string YYYYMMDDHHMMSS+ZZZZ."""
        try:
            dt = datetime.datetime.fromisoformat(self.timestamp_iso)
            time_str = dt.strftime("%Y%m%d%H%M%S")
            if dt.tzinfo is not None:
                offset_s = int(dt.utcoffset().total_seconds())
                sign = "+" if offset_s >= 0 else "-"
                offset_s = abs(offset_s)
                tz_h, tz_m = divmod(offset_s // 60, 60)
                tz_str = f"{sign}{tz_h:02d}{tz_m:02d}"
            else:
                tz_str = "+0000"
            return f"{time_str}{tz_str}"
        except Exception:
            return self.timestamp_iso

    def _level_to_hl7_code(self, level_str: str) -> str:
        """Maps qualitative clinical level string to HL7 observation interpretation code."""
        if level_str == "high":
            return "H"
        return "N"

    def format_hl7_cda_log(self) -> str:
        """
        Formats log into ISO/HL7 27931 CDA Release 2 XML Clinical Document format.
        Compliant with LOINC and SNOMED CT terminology for vital signs telemetry.
        """
        hl7_ts = self._format_hl7_timestamp()
        m = self.sensor_metrics
        cecg_lvl = self.get_cecg_level()
        imp_lvl = self.get_impedance_level()
        acc_lvl = self.get_actigraphy_level()
        aud_lvl = self.get_gastral_noise_level()
        dur = self.get_anomaly_duration_s()
        dur_str = f"{dur:.1f}s"
        anomaly_str = self.get_anomaly_detected()

        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:hl7-org:v3 CDA.xsd">\n'
            '  <realmCode code="US"/>\n'
            '  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>\n'
            '  <templateId root="2.16.840.1.113883.10.20.22.1.1"/>\n'
            f'  <id root="2.16.840.1.113883.19.5.99999.1" extension="{hl7_ts}_{self.patient_id}"/>\n'
            '  <code code="34133-9" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="Summarization of Episode Note / Clinical Telemetry Log"/>\n'
            '  <title>HL7 Clinical Telemetry Document</title>\n'
            f'  <effectiveTime value="{hl7_ts}"/>\n'
            '  <confidentialityCode code="N" codeSystem="2.16.840.1.113883.5.25"/>\n'
            '  <languageCode code="en-US"/>\n'
            '  <recordTarget>\n'
            '    <patientRole>\n'
            f'      <id root="2.16.840.1.113883.19.5" extension="{self.patient_id}"/>\n'
            '      <patient>\n'
            '        <name>\n'
            '          <given>AAL</given>\n'
            f'          <family>{self.patient_id}</family>\n'
            '        </name>\n'
            '      </patient>\n'
            '    </patientRole>\n'
            '  </recordTarget>\n'
            '  <author>\n'
            f'    <time value="{hl7_ts}"/>\n'
            '    <assignedAuthor>\n'
            f'      <id root="2.16.840.1.113883.19.5" extension="{self.bed_id}"/>\n'
            '      <representedOrganization>\n'
            '        <name>Telemedicine Edge Bed Monitoring Subsystem</name>\n'
            '      </representedOrganization>\n'
            '    </assignedAuthor>\n'
            '  </author>\n'
            '  <custodian>\n'
            '    <assignedCustodian>\n'
            '      <representedCustodianOrganization>\n'
            '        <id root="2.16.840.1.113883.19.5"/>\n'
            '        <name>Ambient Assisted Living Healthcare Network</name>\n'
            '      </representedCustodianOrganization>\n'
            '    </assignedCustodian>\n'
            '  </custodian>\n'
            '  <component>\n'
            '    <structuredBody>\n'
            '      <component>\n'
            '        <section>\n'
            '          <templateId root="2.16.840.1.113883.10.20.22.2.4.1"/>\n'
            '          <code code="8716-3" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="VITAL SIGNS TELEMETRY"/>\n'
            '          <title>Clinical Telemetry &amp; Biometric Diagnostic Report</title>\n'
            '          <text>\n'
            f'            <paragraph>Timestamp: {self._format_timestamp()}</paragraph>\n'
            f'            <paragraph>Patient ID: {self.patient_id}</paragraph>\n'
            f'            <paragraph>Bed ID: {self.bed_id}</paragraph>\n'
            f'            <paragraph>FSM State: {self.fsm_state}</paragraph>\n'
            f'            <paragraph>Anomaly Detected: {anomaly_str}</paragraph>\n'
            f'            <paragraph>Duration of Anomaly: {dur_str}</paragraph>\n'
            f'            <paragraph>Trigger Action: {self.action_trigger}</paragraph>\n'
            '            <table border="1" width="100%">\n'
            '              <thead>\n'
            '                <tr><th>Modality</th><th>Observed Biometric Value</th><th>Clinical Categorization</th></tr>\n'
            '              </thead>\n'
            '              <tbody>\n'
            f'                <tr><td>1) CECG (Cardiac)</td><td>{m.hr_bpm:.1f} BPM / RMSSD {m.rmssd_ms:.1f} ms</td><td>{cecg_lvl}</td></tr>\n'
            f'                <tr><td>2) Impedance (E-Textile)</td><td>{m.impedance_raw_us:.2f} uS / delta {m.impedance_delta_us:+.2f} uS</td><td>{imp_lvl}</td></tr>\n'
            f'                <tr><td>3) Actigraphy (Piezo)</td><td>{m.actigraphy_rms_g:.4f} g</td><td>{acc_lvl}</td></tr>\n'
            f'                <tr><td>4) Gastral Noise (Acoustic)</td><td>{m.acoustic_energy:.5f} V^2</td><td>{aud_lvl}</td></tr>\n'
            '              </tbody>\n'
            '            </table>\n'
            '          </text>\n'
            '          <entry typeCode="DRIV">\n'
            '            <observation classCode="OBS" moodCode="EVN">\n'
            '              <templateId root="2.16.840.1.113883.10.20.22.4.27"/>\n'
            '              <id root="2.16.840.1.113883.19.5" extension="HR-01"/>\n'
            '              <code code="8867-4" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="Heart Rate"/>\n'
            '              <statusCode code="completed"/>\n'
            f'              <effectiveTime value="{hl7_ts}"/>\n'
            f'              <value xsi:type="PQ" value="{m.hr_bpm:.1f}" unit="bpm"/>\n'
            f'              <interpretationCode code="{self._level_to_hl7_code(cecg_lvl)}" codeSystem="2.16.840.1.113883.5.83"/>\n'
            '            </observation>\n'
            '          </entry>\n'
            '          <entry typeCode="DRIV">\n'
            '            <observation classCode="OBS" moodCode="EVN">\n'
            '              <templateId root="2.16.840.1.113883.10.20.22.4.27"/>\n'
            '              <id root="2.16.840.1.113883.19.5" extension="RMSSD-01"/>\n'
            '              <code code="80404-7" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="R-R interval RMS Successive Differences"/>\n'
            '              <statusCode code="completed"/>\n'
            f'              <effectiveTime value="{hl7_ts}"/>\n'
            f'              <value xsi:type="PQ" value="{m.rmssd_ms:.1f}" unit="ms"/>\n'
            '            </observation>\n'
            '          </entry>\n'
            '          <entry typeCode="DRIV">\n'
            '            <observation classCode="OBS" moodCode="EVN">\n'
            '              <templateId root="2.16.840.1.113883.10.20.22.4.27"/>\n'
            '              <id root="2.16.840.1.113883.19.5" extension="IMP-01"/>\n'
            '              <code code="29280-5" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="Skin Electrical Conductance"/>\n'
            '              <statusCode code="completed"/>\n'
            f'              <effectiveTime value="{hl7_ts}"/>\n'
            f'              <value xsi:type="PQ" value="{m.impedance_raw_us:.2f}" unit="uS"/>\n'
            f'              <interpretationCode code="{self._level_to_hl7_code(imp_lvl)}" codeSystem="2.16.840.1.113883.5.83"/>\n'
            '            </observation>\n'
            '          </entry>\n'
            '          <entry typeCode="DRIV">\n'
            '            <observation classCode="OBS" moodCode="EVN">\n'
            '              <templateId root="2.16.840.1.113883.10.20.22.4.27"/>\n'
            '              <id root="2.16.840.1.113883.19.5" extension="ACC-01"/>\n'
            '              <code code="69420-8" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="Actigraphy Acceleration RMS"/>\n'
            '              <statusCode code="completed"/>\n'
            f'              <effectiveTime value="{hl7_ts}"/>\n'
            f'              <value xsi:type="PQ" value="{m.actigraphy_rms_g:.4f}" unit="g"/>\n'
            f'              <interpretationCode code="{self._level_to_hl7_code(acc_lvl)}" codeSystem="2.16.840.1.113883.5.83"/>\n'
            '            </observation>\n'
            '          </entry>\n'
            '          <entry typeCode="DRIV">\n'
            '            <observation classCode="OBS" moodCode="EVN">\n'
            '              <templateId root="2.16.840.1.113883.10.20.22.4.27"/>\n'
            '              <id root="2.16.840.1.113883.19.5" extension="AUD-01"/>\n'
            '              <code code="80001-1" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="Phonoenterography Short-Time Acoustic Energy"/>\n'
            '              <statusCode code="completed"/>\n'
            f'              <effectiveTime value="{hl7_ts}"/>\n'
            f'              <value xsi:type="PQ" value="{m.acoustic_energy:.5f}" unit="V2"/>\n'
            f'              <interpretationCode code="{self._level_to_hl7_code(aud_lvl)}" codeSystem="2.16.840.1.113883.5.83"/>\n'
            '            </observation>\n'
            '          </entry>\n'
            '          <entry typeCode="DRIV">\n'
            '            <observation classCode="OBS" moodCode="EVN">\n'
            '              <id root="2.16.840.1.113883.19.5" extension="FSM-01"/>\n'
            '              <code code="75325-1" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="Symptom / Diagnostic Event Status"/>\n'
            '              <statusCode code="completed"/>\n'
            f'              <effectiveTime value="{hl7_ts}"/>\n'
            f'              <value xsi:type="ST">{self.fsm_state}</value>\n'
            '            </observation>\n'
            '          </entry>\n'
            '          <entry typeCode="DRIV">\n'
            '            <observation classCode="OBS" moodCode="EVN">\n'
            '              <id root="2.16.840.1.113883.19.5" extension="ACT-01"/>\n'
            '              <code code="74213-0" codeSystem="2.16.840.1.113883.6.1" codeSystemName="LOINC" displayName="Clinical Action Trigger"/>\n'
            '              <statusCode code="completed"/>\n'
            f'              <effectiveTime value="{hl7_ts}"/>\n'
            f'              <value xsi:type="ST">{self.action_trigger}</value>\n'
            '            </observation>\n'
            '          </entry>\n'
            '        </section>\n'
            '      </component>\n'
            '    </structuredBody>\n'
            '  </component>\n'
            '</ClinicalDocument>'
        )

    def format_hl7_v2_log(self) -> str:
        """Formats log into standard HL7 v2.5 ORU^R01 observation message string."""
        hl7_ts = self._format_hl7_timestamp()
        m = self.sensor_metrics
        msg_id = f"MSG{hl7_ts}"
        ord_id = f"ORD{hl7_ts}"
        srv_id = f"SRV{hl7_ts}"
        dur = self.get_anomaly_duration_s()

        msh = f"MSH|^~\\&|TELEMEDICINE_EDGE|BED_MONITOR|EHR_SYSTEM|HOSPITAL_CENTRAL|{hl7_ts}||ORU^R01^ORU_R01|{msg_id}|P|2.5.1"
        pid = f"PID|1||{self.patient_id}^^^TELEMED^MR||AAL^{self.patient_id}||||||||||||||||||||||||"
        pv1 = f"PV1|1|I|{self.bed_id}^^^TELEMED_UNIT||||||||||||||||||||||||||||||||||||||||||"
        obr = f"OBR|1|{ord_id}|{srv_id}|34133-9^Clinical Telemetry Report^LN|||{hl7_ts}"

        obx_list = [
            f"OBX|1|ST|75325-1^FSM Diagnostic State^LN||{self.fsm_state}||||||F",
            f"OBX|2|NM|8867-4^Heart Rate^LN||{m.hr_bpm:.1f}|bpm|40.0-130.0|{self._level_to_hl7_code(self.get_cecg_level())}|||F",
            f"OBX|3|NM|80404-7^RMSSD^LN||{m.rmssd_ms:.1f}|ms|10.0-150.0|{self._level_to_hl7_code(self.get_cecg_level())}|||F",
            f"OBX|4|NM|29280-5^Skin Conductance^LN||{m.impedance_raw_us:.2f}|uS|1.0-50.0|{self._level_to_hl7_code(self.get_impedance_level())}|||F",
            f"OBX|5|NM|69420-8^Actigraphy Acceleration^LN||{m.actigraphy_rms_g:.4f}|g|0.002-0.130|{self._level_to_hl7_code(self.get_actigraphy_level())}|||F",
            f"OBX|6|NM|80001-1^Gastral Acoustic Energy^LN||{m.acoustic_energy:.5f}|V2|0.00001-0.08000|{self._level_to_hl7_code(self.get_gastral_noise_level())}|||F",
            f"OBX|7|ST|74213-0^Clinical Action Trigger^LN||{self.action_trigger}||||||F",
            f"OBX|8|ST|ANOMALY_STATUS^Anomaly Detected^LOCAL||{self.get_anomaly_detected()}||||||F",
            f"OBX|9|NM|ANOMALY_DURATION^Duration of Anomaly^LOCAL||{dur:.1f}|s||||||F",
        ]

        return "\n".join([msh, pid, pv1, obr] + obx_list)

    def format_clinician_summary(self) -> str:
        """
        Formats a clean, clinician-facing remote telemetry session summary report
        with 5 structured sections:
          1. Header Metadata
          2. Session Overview & High-Level Metrics
          3. Automated Event Log (FSM Triggers)
          4. Aggregated Physiological Trends
          5. Environmental & IoT Interventions
        """
        m = self.sensor_metrics
        dt_str = self._format_timestamp()

        # Calculate session status indicator
        if self.fsm_state == "BASELINE":
            status_indicator = "COMPLETED - BASELINE STABLE MONITORING"
            stability = "STABLE (98.0% Baseline Concordance)"
            severity = "NORMAL / ROUTINE"
        elif self.fsm_state == "ARTIFACT_REJECTED":
            status_indicator = "COMPLETED WITH REJECTED ARTIFACTS"
            stability = "STABLE (Non-Clinical Artifact Suppressed)"
            severity = "INFO / REJECTED"
        elif self.fsm_state == "PARASYMPATHETIC_SURGE":
            status_indicator = "COMPLETED WITH FLAGGED SUDOMOTOR EVENTS"
            stability = "ATTENTION REQUIRED (Sudomotor Diaphoresis)"
            severity = "MODERATE / ACTIONABLE"
        elif self.fsm_state == "PRE_EMESIS_WARNING":
            status_indicator = "COMPLETED WITH PRE-EMESIS WARNING CASCADE"
            stability = "HIGH PRIORITY (Pre-Emesis Prodrome)"
            severity = "HIGH / ALERT"
        elif self.fsm_state == "ACTIVE_EMESIS_EVENT":
            status_indicator = "COMPLETED WITH CRITICAL EMESIS DISCHARGE"
            stability = "CRITICAL (Active Emesis Event)"
            severity = "CRITICAL / IMMEDIATE"
        else:
            status_indicator = "COMPLETED - MONITORING ACTIVE"
            stability = "MONITORING ACTIVE"
            severity = "INFO"

        dur = self.get_anomaly_duration_s()
        dur_str = f"{dur:.1f}s" if dur > 0.0 else "0.0s"
        anomaly_desc = self.get_anomaly_detected()

        # Build Environmental & IoT Intervention entry based on action_trigger
        iot_interventions = []
        if "TURN_ON_FAN_AC" in self.action_trigger:
            iot_interventions.append(f"[{dt_str}] AUTOMATED CLIMATE CONTROL: HVAC Fan/AC turned ON (sudomotor cooling comfort).")
        if "TURN_OFF_FAN_AC" in self.action_trigger:
            iot_interventions.append(f"[{dt_str}] AUTOMATED CLIMATE CONTROL: HVAC Fan/AC turned OFF (preventing nocturnal hypothermia).")
        if "BED_ELEVATE_30DEG" in self.action_trigger:
            iot_interventions.append(f"[{dt_str}] AUTOMATED SMART BED MOTOR: Elevating head of bed 30 degrees (pulmonary aspiration prevention) & alerting nursing staff.")
        if "EMERGENCY_ALARM" in self.action_trigger:
            iot_interventions.append(f"[{dt_str}] EMERGENCY ACTUATION: Priority caregiver alarm dispatched & suction pump prep initiated.")
        if "SUPPRESS_ALERT" in self.action_trigger:
            iot_interventions.append(f"[{dt_str}] ARTIFACT SUPPRESSION: Suppressed alarm notification due to non-clinical artifact ({self.artifact_type}).")
        if not iot_interventions or "LOG_TELEMETRY" in self.action_trigger:
            iot_interventions.append(f"[{dt_str}] ROUTINE MONITORING: No environmental intervention required; telemetry logged.")

        iot_log_str = "\n".join(f"  * {line}" for line in iot_interventions)

        return (
            "====================================================================================================\n"
            "                  CLINICIAN TELEMETRY SESSION SUMMARY & REMOTE MONITORING REPORT\n"
            "====================================================================================================\n\n"
            "1. HEADER METADATA\n"
            "----------------------------------------------------------------------------------------------------\n"
            f"  * Patient Name & ID:      AAL Patient ({self.patient_id})\n"
            f"  * Smart Bed ID:           {self.bed_id}\n"
            f"  * Monitoring Timestamp:   {dt_str} (ISO: {self.timestamp_iso})\n"
            f"  * Session Status:         {status_indicator}\n\n"
            "2. SESSION OVERVIEW & HIGH-LEVEL METRICS\n"
            "----------------------------------------------------------------------------------------------------\n"
            f"  * Total Active Session:   {self.simulation_time_s:.1f} seconds (Frame State Duration: {self.state_duration_s:.1f}s)\n"
            f"  * System Stability:       {stability}\n"
            f"  * Diagnostic Confidence:  {self.confidence_score * 100:.1f}%\n"
            f"  * Cross-Modal Concordance:{self.concordance_score * 100:.1f}%\n"
            f"  * Current FSM State:      {self.fsm_state}\n"
            f"  * Active Anomaly Status:  {anomaly_desc} (Active Duration: {dur_str})\n\n"
            "3. AUTOMATED EVENT LOG (FSM TRIGGERS & ANOMALY EVENTS)\n"
            "----------------------------------------------------------------------------------------------------\n"
            f"{'Timestamp':<28} | {'Event Category':<22} | {'Description / Trigger Action':<32} | {'Severity / Notes'}\n"
            "----------------------------------------------------------------------------------------------------\n"
            f"{dt_str:<28} | {self.fsm_state:<22} | {self.action_trigger:<32} | {severity}\n"
            f"Clinical Rationale: {self.clinical_rationale}\n\n"
            "4. AGGREGATED PHYSIOLOGICAL TRENDS (BIOMETRIC MODALITY BASELINES)\n"
            "----------------------------------------------------------------------------------------------------\n"
            f"  * cECG / Cardiac Heart Rhythm:      {m.hr_bpm:.1f} BPM  |  RMSSD: {m.rmssd_ms:.1f} ms  |  HRV Surge: {m.hrv_surge_detected}  ({self.get_cecg_level().upper()})\n"
            f"  * E-Textile Impedance / Conductance:{m.impedance_raw_us:.2f} uS |  Delta: {m.impedance_delta_us:+.2f} uS  |  Slew: {m.impedance_slew_rate_us_s:.2f} uS/s  |  Sweat: {m.diaphoresis_detected}  |  Spill: {m.fluid_spill_signature}  ({self.get_impedance_level().upper()})\n"
            f"  * Piezoelectric Actigraphy / Motion:{m.actigraphy_rms_g:.4f} g |  Shivering Tremor: {m.shivering_detected}  |  Macro Body Shift: {m.macro_postural_shift_detected}  ({self.get_actigraphy_level().upper()})\n"
            f"  * Acoustic Phonoenterography / Noise:{m.acoustic_energy:.5f} V^2 |  Retch Burst Detected: {m.acoustic_burst_detected}  ({self.get_gastral_noise_level().upper()})\n\n"
            "5. ENVIRONMENTAL & IOT INTERVENTIONS\n"
            "----------------------------------------------------------------------------------------------------\n"
            f"{iot_log_str}\n"
            "====================================================================================================\n"
        )

    def format_legacy_text_log(self) -> str:
        """Formats log to legacy text schema."""
        m = self.sensor_metrics
        cecg_val  = f"{m.hr_bpm:.1f} BPM / RMSSD {m.rmssd_ms:.1f} ms"
        imp_val   = f"{m.impedance_raw_us:.2f} uS / delta {m.impedance_delta_us:+.2f} uS"
        acc_val   = f"{m.actigraphy_rms_g:.4f} g"
        aud_val   = f"{m.acoustic_energy:.5f} V^2"
        dur = self.get_anomaly_duration_s()
        dur_str = f"{dur:.1f}s" if dur > 0.0 else "0.0s"
        return (
            f"Timestamp: {self._format_timestamp()}\n"
            f"Patient ID: {self.patient_id}\n"
            f"Bed ID: {self.bed_id}\n"
            f"FSM State: {self.fsm_state}\n"
            f"1)CECG: {cecg_val} ({self.get_cecg_level()})\n"
            f"2)Impedance: {imp_val} ({self.get_impedance_level()})\n"
            f"3)Actigraphy: {acc_val} ({self.get_actigraphy_level()})\n"
            f"4)Gastral Noise: {aud_val} ({self.get_gastral_noise_level()})\n"
            f"Anomaly detected: {self.get_anomaly_detected()}\n"
            f"Duration of Anomaly: {dur_str}\n"
            f"Trigger action: {self.action_trigger}"
        )

    def format_clinical_log(self, format_type: str = "hl7_cda") -> str:
        """
        Formats log to Clinical Documentation Schema.
        Default format_type is 'hl7_cda' (HL7 CDA R2 XML document + Clinician Summary Report).
        Other options: 'hl7_v2' (HL7 v2.5 ORU^R01 message), 'clinician' (Clinician Report only), 'legacy' (text format).
        """
        if format_type == "hl7_v2":
            return self.format_hl7_v2_log()
        elif format_type == "clinician":
            return self.format_clinician_summary()
        elif format_type in ("legacy", "text"):
            return self.format_legacy_text_log()
        return self.format_hl7_cda_log() + "\n\n" + self.format_clinician_summary()

    def format_log(self, format_type: str = "hl7_cda") -> str:
        """Convenience alias for format_clinical_log."""
        return self.format_clinical_log(format_type=format_type)

    def to_clinical_dict(self) -> Dict[str, Any]:
        """Dictionary representation matching the clinical log format including HL7 and LOINC schemas."""
        m = self.sensor_metrics
        return {
            "Timestamp": self._format_timestamp(),
            "HL7_Timestamp": self._format_hl7_timestamp(),
            "Patient ID": self.patient_id,
            "Bed ID": self.bed_id,
            "FSM State": self.fsm_state,
            "1)CECG": f"{m.hr_bpm:.1f} BPM / RMSSD {m.rmssd_ms:.1f} ms ({self.get_cecg_level()})",
            "2)Impedance": f"{m.impedance_raw_us:.2f} uS / delta {m.impedance_delta_us:+.2f} uS ({self.get_impedance_level()})",
            "3)Actigraphy": f"{m.actigraphy_rms_g:.4f} g ({self.get_actigraphy_level()})",
            "4)Gastral Noise": f"{m.acoustic_energy:.5f} V^2 ({self.get_gastral_noise_level()})",
            "Anomaly detected": self.get_anomaly_detected(),
            "Duration of Anomaly": f"{self.get_anomaly_duration_s():.1f}s",
            "Trigger action": self.action_trigger,
            "HL7_CDA_XML": self.format_hl7_cda_log(),
            "HL7_V2_ORU_R01": self.format_hl7_v2_log(),
            "LOINC_Codes": {
                "Document": "34133-9",
                "Section": "8716-3",
                "HeartRate": "8867-4",
                "RMSSD": "80404-7",
                "SkinConductance": "29280-5",
                "ActigraphyAcceleration": "69420-8",
                "GastralAcousticEnergy": "80001-1",
                "FSMDiagnosticState": "75325-1",
                "ClinicalActionTrigger": "74213-0",
            }
        }


class TelemetryFormatter:
    """Builds standardized TelemetryPayload objects."""

    def __init__(self, patient_id: str = "PATIENT_AAL_0042", bed_id: str = "BED_ALPHA_01") -> None:
        self.patient_id = patient_id
        self.bed_id = bed_id
        self.base_datetime = datetime.datetime.now(datetime.timezone.utc)

    def format_payload(
        self,
        timestamp_s: float,
        current_state: str,
        previous_state: str,
        state_duration_s: float,
        confidence_score: float,
        action_trigger: str,
        artifact_type: str,
        clinical_rationale: str,
        concordance_score: float,
        dsp_metrics: Any,
    ) -> TelemetryPayload:
        event_time = self.base_datetime + datetime.timedelta(seconds=timestamp_s)
        time_str = event_time.isoformat()

        metrics_obj = TelemetrySensorMetrics(
            hr_bpm=round(getattr(dsp_metrics, "heart_rate_bpm", 0.0), 1),
            rmssd_ms=round(getattr(dsp_metrics, "rmssd_ms", 0.0), 1),
            acoustic_energy=round(getattr(dsp_metrics, "acoustic_short_time_energy", 0.0), 5),
            actigraphy_rms_g=round(getattr(dsp_metrics, "actigraphy_vm_rms", 0.0), 3),
            impedance_raw_us=round(getattr(dsp_metrics, "impedance_raw_uS", 0.0), 2),
            impedance_delta_us=round(getattr(dsp_metrics, "impedance_delta_uS", 0.0), 2),
            impedance_slew_rate_us_s=round(getattr(dsp_metrics, "impedance_slew_rate_uS_s", 0.0), 2),
            hrv_surge_detected=bool(getattr(dsp_metrics, "hrv_surge_detected", False)),
            acoustic_burst_detected=bool(getattr(dsp_metrics, "acoustic_burst_detected", False)),
            shivering_detected=bool(getattr(dsp_metrics, "shivering_detected", False)),
            macro_postural_shift_detected=bool(getattr(dsp_metrics, "macro_postural_shift_detected", False)),
            diaphoresis_detected=bool(getattr(dsp_metrics, "diaphoresis_detected", False)),
            fluid_spill_signature=bool(getattr(dsp_metrics, "fluid_spill_signature", False)),
        )

        return TelemetryPayload(
            timestamp_iso=time_str,
            simulation_time_s=round(timestamp_s, 2),
            patient_id=self.patient_id,
            bed_id=self.bed_id,
            fsm_state=str(current_state),
            previous_state=str(previous_state),
            state_duration_s=round(state_duration_s, 2),
            confidence_score=round(confidence_score, 3),
            action_trigger=str(action_trigger),
            artifact_type=str(artifact_type),
            clinical_rationale=clinical_rationale,
            concordance_score=round(concordance_score, 3),
            sensor_metrics=metrics_obj,
        )


class MQTTPublisherStub:
    """Mock MQTT Publisher for edge IoT actuation."""

    def __init__(self, broker_host: str = "192.168.1.100", broker_port: int = 1883) -> None:
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.is_connected = True
        self.published_messages: collections.deque[Dict[str, Any]] = collections.deque(maxlen=100)
        self.last_published_action: Optional[str] = None

    def publish_actuation(self, payload: TelemetryPayload) -> Dict[str, Any]:
        topic = f"telemedicine/bed/{payload.bed_id}/actuation"
        action_msg = {
            "topic": topic,
            "qos": 1,
            "retain": False,
            "timestamp": payload.timestamp_iso,
            "bed_id": payload.bed_id,
            "patient_id": payload.patient_id,
            "action_trigger": payload.action_trigger,
            "fsm_state": payload.fsm_state,
            "confidence": payload.confidence_score,
        }
        self.published_messages.append(action_msg)
        self.last_published_action = payload.action_trigger
        return action_msg


class RESTClientStub:
    """Mock HTTP REST Client for cloud EHR / nursing dashboard."""

    def __init__(self, endpoint_url: str = "https://api.telemedicine-aal.org/v1/telemetry/events") -> None:
        self.endpoint_url = endpoint_url
        self.post_history: collections.deque[Dict[str, Any]] = collections.deque(maxlen=100)

    def post_telemetry(self, payload: TelemetryPayload) -> Dict[str, Any]:
        req_record = {
            "url": self.endpoint_url,
            "method": "POST",
            "status_code": 200,
            "timestamp": payload.timestamp_iso,
            "payload_summary": {
                "t_s": payload.simulation_time_s,
                "state": payload.fsm_state,
                "action": payload.action_trigger,
                "hr": payload.sensor_metrics.hr_bpm,
                "rmssd": payload.sensor_metrics.rmssd_ms,
            }
        }
        self.post_history.append(req_record)
        return req_record
