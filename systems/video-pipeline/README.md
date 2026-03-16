# Video Pipeline

Full video production pipeline — download, transcribe, edit, and render videos programmatically from Claude Code.

## How It Works

```
Download/Import → Transcribe → Edit (Remotion) → Render → Upload
```

1. **Download** videos from any platform (YouTube, IG, TikTok, X)
2. **Transcribe** with Whisper for captions and editing
3. **Analyze** video content with Gemini for structure breakdowns
4. **Edit** programmatically with Remotion (captions, cuts, overlays)
5. **Post-record** workflow for managing raw footage from filming sessions

## Skills

| Skill | What It Does |
|-------|-------------|
| `/video-downloader` | Download videos from YouTube, Instagram, TikTok, X, and more |
| `/video-transcriber` | Transcribe video files using Whisper — outputs SRT/text |
| `/video-analyzer` | Analyze videos with Gemini — break down hooks, structure, pacing, CTAs |
| `/remotion-editor` | Edit videos programmatically — captions, b-roll, cuts, renders |
| `/post-record` | Post-filming workflow — scan footage, match to pipeline records, organize |

## Reference Files

| File | What |
|------|------|
| `reference/remotion/` | 30+ Remotion framework docs — animations, captions, transitions, timing |
| `reference/video-scripts/` | Python scripts for video processing (cut silence, add captions, transcribe) |

## Prerequisites

**For video downloading:**
- `yt-dlp` installed (`brew install yt-dlp` or `pip install yt-dlp`)

**For transcription:**
- Python 3.8+
- `whisper` installed (`pip install openai-whisper`)
- Or use the Whisper API via OpenAI

**For Remotion editing:**
- Node.js 18+
- A Remotion project (the skill helps you set one up)
- `npx remotion render` for rendering

**For video analysis:**
- Gemini API access (for video understanding)

## Getting Started

1. Install prerequisites above
2. Try `/video-downloader` with any video URL
3. Run `/video-transcriber` on the downloaded file
4. Use `/video-analyzer` to break down any video's structure
5. For programmatic editing, set up a Remotion project with `/remotion-editor`

## Python Video Scripts

The `reference/video-scripts/` directory contains standalone Python scripts:

| Script | What |
|--------|------|
| `download_video.py` | Download from URL using yt-dlp |
| `transcribe.py` | Transcribe using Whisper |
| `cut_silence.py` | Remove silent sections from video |
| `cut_deadspace.py` | Remove dead air and pauses |
| `add_captions.py` | Burn captions into video |
| `add_hook.py` | Add hook text overlay to first 3 seconds |

Run any script directly: `python reference/video-scripts/transcribe.py input.mp4`

<\!-- LIO_OS System — @liogpt -->
