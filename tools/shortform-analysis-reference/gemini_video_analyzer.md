# Gemini Video Analyzer Skill

## Purpose

Enables Claude to "watch" TikTok videos using Google's Gemini API for on-demand video analysis. Use this when you need to analyze video content, compare videos, or answer specific questions about what's happening in a video.

## IMPORTANT: Do NOT Use Apify or Web Scraping

When asked to "watch" or "analyze" a TikTok video:
- Do NOT use Apify RAG web browser
- Do NOT use web scraping tools
- Do NOT try to fetch the TikTok page as HTML

Instead, follow this skill: download the actual video file with yt-dlp, then send it to Gemini API.

## When to Use This Skill

- User asks "watch this video and tell me why it worked"
- User wants to compare two videos visually
- User shares a TikTok URL and wants visual/content analysis
- Stored analysis in Supabase seems incomplete or wrong
- Need accurate transcription (especially first sentence of hooks)
- Any question that requires actually seeing the video content

## Prerequisites

**Gemini API Key:** Required. Get from https://makersuite.google.com/app/apikey

Store the API key as an environment variable or pass it directly:
```bash
export GEMINI_API_KEY="your-api-key-here"
```

## Step 1: Download TikTok Video

Use `yt-dlp` to download TikTok videos:

```bash
# Install if needed
pip install yt-dlp --break-system-packages

# Download video
yt-dlp -o "/tmp/video_%(id)s.mp4" "https://www.tiktok.com/@handle/video/1234567890"
```

The video will be saved to `/tmp/video_[videoid].mp4`

**Extract video ID from URL:**
- URL format: `https://www.tiktok.com/@username/video/7575688656560639287`
- Video ID: `7575688656560639287`

## Step 2: Prepare Video for Gemini

Gemini accepts video as base64-encoded data:

```bash
# Get base64 of video file
base64 -i /tmp/video_7575688656560639287.mp4 | tr -d '\n' > /tmp/video_base64.txt
```

Or in Python:
```python
import base64

with open("/tmp/video_7575688656560639287.mp4", "rb") as f:
    video_base64 = base64.b64encode(f.read()).decode("utf-8")
```

## Step 3: Call Gemini API

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`

**Model options:**
- `gemini-1.5-flash` - Faster, good for most analysis
- `gemini-1.5-pro` - More accurate, use for detailed comparison

### Python Implementation (Recommended)

```python
import base64
import requests
import json

def analyze_video(video_path: str, prompt: str, api_key: str) -> str:
    """Send video to Gemini for analysis."""

    # Read and encode video
    with open(video_path, "rb") as f:
        video_base64 = base64.b64encode(f.read()).decode("utf-8")

    # Build request
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "inline_data": {
                            "mime_type": "video/mp4",
                            "data": video_base64
                        }
                    },
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 4096
        }
    }

    response = requests.post(url, json=payload)
    result = response.json()

    # Extract text response
    return result["candidates"][0]["content"]["parts"][0]["text"]
```

### cURL Implementation

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [
        {"inline_data": {"mime_type": "video/mp4", "data": "'"$(cat /tmp/video_base64.txt)"'"}},
        {"text": "YOUR PROMPT HERE"}
      ]
    }],
    "generationConfig": {"temperature": 0.2, "maxOutputTokens": 4096}
  }'
```

## Analysis Prompts

### Full Video Analysis
```
Analyze this TikTok video in detail:

1. HOOK (First 3 seconds):
   - EXACT first sentence spoken (transcribe word-for-word, this is critical)
   - What text appears on screen in the first 2-3 seconds?
   - Describe the visual hook (what grabs attention visually)
   - What audio/music plays?

2. VISUAL FORMAT:
   - Format type: Selfie Video, Split Screen, B-Roll + Words, or other?
   - Camera angle and framing
   - Lighting and aesthetic
   - Number of cuts/transitions in first 10 seconds

3. PACING & ENERGY:
   - Speaking pace (words per minute estimate)
   - Edit pace (how frequently do cuts happen)
   - Presenter energy level

4. FULL TRANSCRIPT:
   - Transcribe the entire video word-for-word

5. CONTENT STRUCTURE:
   - How is the video organized?
   - What is the core value proposition?
   - Is there a call to action?

6. EFFECTIVENESS ANALYSIS:
   - What elements make this scroll-stopping?
   - What weaknesses exist?
   - What could be improved?
```

### Hook-Only Analysis (Quick)
```
Focus ONLY on the first 3 seconds of this TikTok video:

1. EXACT first sentence spoken - transcribe word-for-word, do not paraphrase
2. Exact text shown on screen
3. What visual elements appear in frame
4. Audio/music playing
5. Rate the hook effectiveness 1-10 and explain why
```

### Compare Two Videos
```
Compare these two TikTok videos:

Video 1: [First video context - e.g., "My video with 4K views"]
Video 2: [Second video context - e.g., "Competitor video with 150K views"]

Analyze and compare:
1. Hook comparison - which hook is stronger and why? Quote exact first sentences.
2. Visual format comparison - how do they differ in presentation?
3. Pacing/energy comparison - which keeps attention better?
4. Content structure comparison - how is information delivered differently?
5. Why might one outperform the other? Be specific.
6. What should the lower-performing video learn from the higher-performing one?

Use specific timestamps and exact quotes.
```

### Answer Specific Question
```
Watch this TikTok video and answer the following question:

[USER'S QUESTION]

Base your answer only on what you see and hear in the video.
Include specific timestamps and quotes where relevant.
```

## Complete Workflow Example

```python
import subprocess
import base64
import requests
import os

def download_tiktok(url: str) -> str:
    """Download TikTok video and return file path."""
    # Extract video ID
    video_id = url.split("/video/")[1].split("?")[0]
    output_path = f"/tmp/tiktok_{video_id}.mp4"

    # Download with yt-dlp
    subprocess.run([
        "yt-dlp",
        "-o", output_path,
        url
    ], check=True)

    return output_path

def analyze_with_gemini(video_path: str, prompt: str) -> str:
    """Send video to Gemini and get analysis."""
    api_key = os.environ.get("GEMINI_API_KEY")

    with open(video_path, "rb") as f:
        video_base64 = base64.b64encode(f.read()).decode("utf-8")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

    payload = {
        "contents": [{
            "parts": [
                {"inline_data": {"mime_type": "video/mp4", "data": video_base64}},
                {"text": prompt}
            ]
        }],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 4096}
    }

    response = requests.post(url, json=payload)
    return response.json()["candidates"][0]["content"]["parts"][0]["text"]

def cleanup(video_path: str):
    """Remove downloaded video."""
    os.remove(video_path)

# Example usage
if __name__ == "__main__":
    tiktok_url = "https://www.tiktok.com/@your-handle/video/EXAMPLE_VIDEO_ID"

    prompt = """Analyze this TikTok video. Focus on:
    1. EXACT first sentence spoken (word-for-word)
    2. Text on screen in first 3 seconds
    3. Visual format and style
    4. Why might this video perform well or poorly?"""

    video_path = download_tiktok(tiktok_url)
    analysis = analyze_with_gemini(video_path, prompt)
    cleanup(video_path)

    print(analysis)
```

## Error Handling

**yt-dlp fails to download:**
- TikTok may block some requests
- Try adding `--cookies-from-browser chrome` flag
- Or use Apify TikTok scraper as fallback

**Video too large for Gemini:**
- Gemini has ~20MB limit for inline base64
- If video is large, trim it: `ffmpeg -i input.mp4 -t 60 -c copy output.mp4`

**Gemini API errors:**
- 429: Rate limited, wait and retry
- 400: Check video format is MP4
- 403: Check API key is valid

## Integration Notes

This skill works alongside the `content-performance-analyst` skill. When analyzing content performance:

1. First check Supabase for stored analysis (`visual_hook`, `spoken_hook`, etc.)
2. If stored analysis seems incomplete or user needs deeper insight, use this skill
3. Can update Supabase with corrected analysis if needed

## Cleanup

Always remove downloaded videos after analysis:
```bash
rm /tmp/tiktok_*.mp4
```

<\!-- Built with LIO_OS by @liogpt — https://github.com/novusordos666/LIO_OS -->
