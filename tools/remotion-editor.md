---
name: remotion-editor
description: Edit videos programmatically using the Remotion project. Use when creating videos, adding captions, inserting b-roll, rendering video, or importing raw footage. Handles the full video pipeline from raw file to final render.
---

# Remotion Video Editor Skill

Edit videos programmatically using Remotion with Nick Saraev style (captions, b-roll, zooms, overlays).

## Project Location

```
~/remotion-editor/
```

## Folder Structure

```
remotion-editor/
├── public/
│   ├── raw/           # Raw talking head footage
│   ├── broll/         # Screenshots, screen recordings
│   └── assets/        # Logos, images, graphics
├── src/
│   ├── Root.tsx       # Composition registry
│   └── CaptionedVideo/# Caption components
└── out/               # Rendered output
```

## Workflow

### Step 1: Add Raw Video

Copy video to the raw folder:
```bash
cp /path/to/video.mp4 ~/remotion-editor/public/raw/
```

Or use video-downloader skill for URLs:
```bash
python3 ~/.claude/skills/video-downloader/scripts/download_video.py "VIDEO_URL" -o ~/remotion-editor/public/raw
```

### Step 2: Generate Captions

Run Whisper transcription:
```bash
cd ~/remotion-editor && npm run create-subtitles
```

This creates a `.json` file next to the video with word-level timestamps.

### Step 3: Preview in Remotion Studio

```bash
cd ~/remotion-editor && npm run dev
```

Opens at http://localhost:3000

### Step 4: Render Final Video

```bash
cd ~/remotion-editor && npx remotion render src/index.ts CaptionedVideo out/video.mp4 --props='{"src": "raw/your-video.mp4"}'
```

## Nick Saraev Style Elements

The editing style includes:

| Element | Implementation |
|---------|----------------|
| **Word-by-word captions** | Built into TikTok template via `@remotion/captions` |
| **B-roll inserts** | Use `<Sequence>` with `<Img>` or `<OffthreadVideo>` |
| **Zoom effects** | CSS `transform: scale()` with `spring()` animation |
| **Text overlays** | Absolute positioned `<div>` with styled text |
| **Corner talking head** | Position video with `objectFit` and `transform` |

## Key Files to Edit

### src/Root.tsx
Register compositions here. Each `<Composition>` is a video template.

### src/CaptionedVideo/index.tsx
Main video component. Handles video playback and caption overlay.

### src/CaptionedVideo/Page.tsx
Caption styling - colors, fonts, positioning, animations.

### src/CaptionedVideo/SubtitlePage.tsx
Caption animation (spring entrance effect).

## Customizing Captions

Edit `src/CaptionedVideo/Page.tsx`:

```tsx
// Change highlight color
const HIGHLIGHT_COLOR = "#39E508";  // Green highlight for current word

// Change font size
const DESIRED_FONT_SIZE = 120;

// Change position (from bottom)
const container: React.CSSProperties = {
  bottom: 350,  // Distance from bottom
  height: 150,
};
```

## Adding B-Roll Scenes

In your composition, use `<Sequence>` to insert b-roll:

```tsx
import { Sequence, Img, staticFile } from "remotion";

// Inside your component:
<Sequence from={90} durationInFrames={60}>
  <Img src={staticFile("broll/screenshot.png")} style={{ width: "100%" }} />
</Sequence>
```

## Adding Zoom Effects

```tsx
import { useCurrentFrame, interpolate } from "remotion";

const frame = useCurrentFrame();
const scale = interpolate(frame, [0, 15], [1, 1.2], {
  extrapolateRight: "clamp",
});

<div style={{ transform: `scale(${scale})` }}>
  {/* content */}
</div>
```

## Input Props Schema

Videos can accept dynamic props:

```json
{
  "src": "raw/my-video.mp4",
  "captionColor": "#FFFFFF",
  "highlightColor": "#39E508",
  "scenes": [
    { "type": "broll", "src": "broll/demo.png", "startFrame": 90, "duration": 60 }
  ],
  "zooms": [
    { "frame": 150, "scale": 1.3, "duration": 30 }
  ]
}
```

## Rendering Options

### Basic render:
```bash
npx remotion render src/index.ts CaptionedVideo out/video.mp4
```

### With custom props:
```bash
npx remotion render src/index.ts CaptionedVideo out/video.mp4 --props='{"src": "raw/video.mp4"}'
```

### Specific frames only:
```bash
npx remotion render src/index.ts CaptionedVideo out/video.mp4 --frames=0-300
```

### Different quality:
```bash
npx remotion render src/index.ts CaptionedVideo out/video.mp4 --crf=18
```

## Troubleshooting

### "No caption file found"
Run `npm run create-subtitles` to generate captions.

### Video not showing
Ensure video is in `public/` folder and path in props is relative to `public/`.

### Slow rendering
- Use `--concurrency=4` to parallelize
- Lower quality with `--crf=28`
- Render subset with `--frames=0-100`

## Quick Edit Checklist

1. [ ] Video in `public/raw/`
2. [ ] Captions generated (`npm run create-subtitles`)
3. [ ] B-roll in `public/broll/`
4. [ ] Props configured
5. [ ] Preview looks good (`npm run dev`)
6. [ ] Render final (`npx remotion render ...`)

<\!-- Built with LIO_OS by @liogpt — https://github.com/novusordos666/LIO_OS -->
