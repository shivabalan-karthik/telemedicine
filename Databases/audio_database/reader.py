"""
reader.py
=========
Lightweight parser and reader for the audio_database:
Gastrointestinal / Gastric Bowel Sounds & Acoustic Phonoenterography (WAV + TXT annotations).
Supports direct reading from 28595741.zip without requiring manual unpacking.
"""

from __future__ import annotations
import os
import zipfile
import wave
import io
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import numpy as np


@dataclass
class AudioRecord:
    filename: str
    sampling_rate: int
    num_channels: int
    duration_sec: float
    num_frames: int
    samples: np.ndarray  # Normalized float32 samples in [-1.0, 1.0]
    annotation_text: Optional[str] = None

    def summary(self) -> str:
        lines = [
            f"Audio Record: {self.filename}",
            f"  Duration: {self.duration_sec:.2f}s ({self.duration_sec / 60.0:.2f} min)",
            f"  Sampling Rate: {self.sampling_rate} Hz | Channels: {self.num_channels}",
            f"  Total Samples: {self.num_frames:,}",
            f"  Signal Amplitude: min={self.samples.min():.4f}, max={self.samples.max():.4f}, RMS={np.sqrt(np.mean(self.samples**2)):.4f}",
        ]
        if self.annotation_text:
            preview = self.annotation_text.strip().replace("\n", " | ")
            if len(preview) > 120:
                preview = preview[:117] + "..."
            lines.append(f"  Annotation: {preview}")
        return "\n".join(lines)


class AudioDatabaseReader:
    """
    Manager to query and stream audio recordings from audio_database.
    """

    def __init__(self, db_dir: Optional[str] = None) -> None:
        if db_dir is None:
            db_dir = os.path.dirname(os.path.abspath(__file__))
        self.db_dir = db_dir
        self.zip_path = os.path.join(self.db_dir, "28595741.zip")

    def list_recordings(self) -> List[str]:
        if os.path.exists(self.zip_path):
            with zipfile.ZipFile(self.zip_path, "r") as zf:
                return sorted([n for n in zf.namelist() if n.lower().endswith(".wav")])
        wav_files = [f for f in os.listdir(self.db_dir) if f.lower().endswith(".wav")]
        return sorted(wav_files)

    def read_audio(self, wav_filename: str) -> AudioRecord:
        wav_bytes = None
        annotation = None

        txt_name = os.path.splitext(wav_filename)[0] + ".txt"

        if os.path.exists(self.zip_path):
            with zipfile.ZipFile(self.zip_path, "r") as zf:
                if wav_filename in zf.namelist():
                    wav_bytes = zf.read(wav_filename)
                if txt_name in zf.namelist():
                    annotation = zf.read(txt_name).decode("utf-8", errors="replace")

        if wav_bytes is None:
            local_wav = os.path.join(self.db_dir, wav_filename)
            local_txt = os.path.join(self.db_dir, txt_name)
            if os.path.exists(local_wav):
                with open(local_wav, "rb") as f:
                    wav_bytes = f.read()
            if os.path.exists(local_txt):
                with open(local_txt, "r", encoding="utf-8", errors="replace") as f:
                    annotation = f.read()

        if wav_bytes is None:
            raise FileNotFoundError(f"Audio file '{wav_filename}' not found.")

        with wave.open(io.BytesIO(wav_bytes), "rb") as wf:
            n_channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            framerate = wf.getframerate()
            n_frames = wf.getnframes()
            raw_frames = wf.readframes(n_frames)

        # Convert raw frames into numpy array
        if sampwidth == 2:
            data = np.frombuffer(raw_frames, dtype=np.int16).astype(np.float32) / 32768.0
        elif sampwidth == 1:
            data = (np.frombuffer(raw_frames, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
        elif sampwidth == 3:
            # 24-bit PCM
            raw_bytes = np.frombuffer(raw_frames, dtype=np.uint8)
            reshaped = raw_bytes.reshape(-1, 3)
            # Pad to 4 bytes and view as int32
            padded = np.pad(reshaped, ((0, 0), (1, 0)), mode="constant")
            data = padded.view(np.int32).squeeze() / (2**31)
        elif sampwidth == 4:
            data = np.frombuffer(raw_frames, dtype=np.int32).astype(np.float32) / 2147483648.0
        else:
            raise ValueError(f"Unsupported sample width: {sampwidth} bytes")

        if n_channels > 1:
            data = data.reshape(-1, n_channels)

        return AudioRecord(
            filename=wav_filename,
            sampling_rate=framerate,
            num_channels=n_channels,
            duration_sec=n_frames / framerate,
            num_frames=n_frames,
            samples=data,
            annotation_text=annotation,
        )


if __name__ == "__main__":
    reader = AudioDatabaseReader()
    recordings = reader.list_recordings()
    print(f"Total audio recordings in database: {len(recordings)}")
    for r in recordings:
        print(f" - {r}")

    if recordings:
        print("\nLoading first recording:")
        first = reader.read_audio(recordings[0])
        print(first.summary())
