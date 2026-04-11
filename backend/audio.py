import asyncio
import json
import os
import subprocess
import struct
import wave
from typing import Optional


UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/opt/musicbox/uploads")
CONVERTED_DIR = os.getenv("CONVERTED_DIR", "/opt/musicbox/converted")

# Quality hierarchy: higher index = higher quality
# WAV (uncompressed lossless) > FLAC (compressed lossless) > MP3/OGG (lossy)
FORMAT_QUALITY = {
    "mp3": 1,
    "ogg": 1,
    "flac": 2,
    "wav": 3,
}

FORMAT_MIME = {
    "wav": "audio/wav",
    "mp3": "audio/mpeg",
    "flac": "audio/flac",
    "ogg": "audio/ogg",
}

ALLOWED_UPLOAD_EXTENSIONS = {"wav", "mp3", "flac", "ogg", "aac", "m4a", "wma"}

# Stream quality options available per original format
STREAM_QUALITIES = {
    "wav": ["original", "flac", "mp3"],
    "flac": ["original", "mp3"],
    "mp3": ["original"],
    "ogg": ["original"],
    "aac": ["original", "mp3"],
    "m4a": ["original", "mp3"],
    "wma": ["original", "mp3"],
}


def detect_format(filename: str) -> str:
    """Detect audio format from filename extension."""
    ext = os.path.splitext(filename)[1].lower().lstrip(".")
    mapping = {"m4a": "m4a", "aac": "aac", "wma": "wma"}
    return mapping.get(ext, ext) if ext in ALLOWED_UPLOAD_EXTENSIONS else "wav"


def get_available_download_formats(original_format: str) -> list[str]:
    """Return list of formats available for download (original + strictly lower quality)."""
    orig_quality = FORMAT_QUALITY.get(original_format, 0)
    formats = [original_format]
    # Add only STRICTLY lower quality formats
    for fmt, quality in sorted(FORMAT_QUALITY.items(), key=lambda x: -x[1]):
        if quality < orig_quality and fmt != original_format:
            formats.append(fmt)
    return formats


def get_duration(file_path: str) -> float:
    """Get audio duration in seconds using ffprobe."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "quiet", "-print_format", "json",
                "-show_format", file_path,
            ],
            capture_output=True, text=True, timeout=30,
        )
        data = json.loads(result.stdout)
        return float(data["format"]["duration"])
    except Exception:
        return 0.0


def convert_to_mp3(wav_path: str, mp3_path: str) -> bool:
    """Convert audio to MP3 320kbps using ffmpeg."""
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", wav_path,
                "-codec:a", "libmp3lame", "-b:a", "320k",
                "-map_metadata", "-1",
                mp3_path,
            ],
            capture_output=True, timeout=120,
        )
        return os.path.exists(mp3_path)
    except Exception:
        return False


def convert_audio(input_path: str, output_path: str, output_format: str,
                  metadata: Optional[dict] = None) -> bool:
    """Convert audio to specified format with optional metadata tags."""
    try:
        cmd = ["ffmpeg", "-y", "-i", input_path, "-map_metadata", "-1"]

        # Add metadata tags
        if metadata:
            for key, value in metadata.items():
                if value:
                    cmd.extend(["-metadata", f"{key}={value}"])

        # Format-specific encoding
        if output_format == "mp3":
            cmd.extend(["-codec:a", "libmp3lame", "-b:a", "320k"])
        elif output_format == "flac":
            cmd.extend(["-codec:a", "flac"])
        elif output_format == "ogg":
            cmd.extend(["-codec:a", "libvorbis", "-q:a", "8"])
        elif output_format == "wav":
            cmd.extend(["-codec:a", "pcm_s16le"])
        else:
            cmd.extend(["-codec:a", "copy"])

        cmd.append(output_path)
        subprocess.run(cmd, capture_output=True, timeout=120)
        return os.path.exists(output_path)
    except Exception:
        return False


def generate_waveform_peaks(file_path: str, num_peaks: int = 200) -> list[float]:
    """Generate waveform peaks from an audio file using ffmpeg raw PCM output."""
    try:
        result = subprocess.run(
            [
                "ffmpeg", "-y", "-i", file_path,
                "-ac", "1", "-ar", "8000",
                "-f", "s16le", "-acodec", "pcm_s16le",
                "pipe:1",
            ],
            capture_output=True, timeout=60,
        )
        raw = result.stdout
        if not raw:
            return []

        samples = struct.unpack(f"<{len(raw) // 2}h", raw)
        total = len(samples)
        chunk_size = max(1, total // num_peaks)

        peaks = []
        for i in range(num_peaks):
            start = i * chunk_size
            end = min(start + chunk_size, total)
            if start >= total:
                peaks.append(0.0)
                continue
            chunk = samples[start:end]
            peak = max(abs(s) for s in chunk) if chunk else 0
            peaks.append(round(peak / 32768.0, 4))

        # Normalize to 0..1
        max_peak = max(peaks) if peaks else 1.0
        if max_peak > 0:
            peaks = [round(p / max_peak, 4) for p in peaks]

        return peaks
    except Exception:
        return []
