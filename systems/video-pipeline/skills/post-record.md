---
name: post-record
description: Post-recording workflow — scan OBS footage, match to pipeline records, upload to Dropbox, link in Airtable, mark as editing. Use after a filming session when raw footage is in PB-Videos.
---

# Post-Record — Raw Footage to Editor Pipeline

After a filming session, process all raw footage: identify videos, match to pipeline records, upload to Dropbox, link in Airtable, set status to Editing.

**Your scope:** Raw footage processing, Dropbox upload, Airtable linking
**NOT your scope:** Scripting (/content-scripter), editing, posting

---

## Config

| Setting | Value |
|---------|-------|
| **Raw footage folder** | `~/your-project/Content/PB-Videos/` |
| **Dropbox token** | `~/.dropbox-token` |
| **Dropbox base path** | `/your-project/Raw Footage/` |
| **Upload script** | `scripts/dropbox-upload.sh` (in this skill directory) |
| **Airtable base** | `YOUR_AIRTABLE_BASE_ID` |
| **Airtable table** | `YOUR_CONTENT_PIPELINE_TABLE_ID` (Content Pipeline) |
| **Whisper command** | `/usr/bin/python3 -m whisper` |
| **ffmpeg path** | `/tmp/ffmpeg` (static ARM64 binary) |
| **Visual Format** | Always `Split Screen` (OBS records face + screen separately) |

---

## OBS Recording Format

OBS Studio drops **2 files per recording session**:
1. **Face camera** (webcam/talking head)
2. **Screen recording** (demo, tutorial, walkthrough)

These files will have **matching or very close timestamps** in their filenames (OBS default naming: `YYYY-MM-DD HH-MM-SS.mov`).

The creator announces the **video title** in the first few seconds of the face camera recording. This announcement is how we match raw footage to pipeline records.

---

## Step 0: Scan for New Footage

Scan the PB-Videos folder for `.mov` or `.mkv` files.

```
~/your-project/Content/PB-Videos/
```

**Identify new files** — files that don't already have a corresponding `.txt` transcript or that the user says are new.

**Group files by recording session:**
- OBS drops 2 files per session with matching/close timestamps
- Files within 5 seconds of each other = same recording session
- If only 1 file per timestamp, it's a single-source recording (still valid)

**If the user provides a list of which pipeline records they filmed**, skip to Step 2 (no transcription needed). The user's list is the source of truth — never override it with transcription guessing.

---

## Step 1: Transcribe Title Announcements

For each recording session group, transcribe the **first 15 seconds** of the face camera file to capture the title announcement.

**Command:**
```bash
PATH="/tmp:$PATH" /usr/bin/python3 -m whisper "<file>" --model base --language en --output_format txt --output_dir /tmp/post-record/ --clip 0 15
```

If `--clip` is not supported by the installed whisper version, transcribe the full file with `base` model and read just the first line(s).

**Extract the title** from the transcription. The creator will say something like:
- "Recording [Title] video"
- "[Title] video"
- "This is the [Title] one"

**Present the identified videos to the user for confirmation:**

```
## Found [N] recording sessions:

1. [Timestamp] — "[Announced title]"
   Files: face.mov + screen.mov ([X]MB total)

2. [Timestamp] — "[Announced title]"
   Files: face.mov ([X]MB)

**Match these to pipeline records? Or tell me which records you filmed.**
```

**STOP. Wait for user confirmation before proceeding.**

The user may:
- Confirm the matches
- Provide a list of pipeline record titles/IDs instead
- Correct misidentified videos

---

## Step 2: Match to Pipeline Records

For each identified video, search the Airtable Content Pipeline for the matching record.

**Search using:** `mcp__airtable-freelance__search_records`
- Base: `YOUR_AIRTABLE_BASE_ID`
- Table: `YOUR_CONTENT_PIPELINE_TABLE_ID`
- Search by title keywords from the announcement

**Present matches for confirmation:**

```
## Pipeline Record Matches:

1. "[Announced title]" → **[Record Title]** (recXXX) — Status: [current status]
2. "[Announced title]" → **[Record Title]** (recXXX) — Status: [current status]
3. "[Announced title]" → **No match found** — Create new record? Or tell me which one.

**Confirm these matches before I upload.**
```

**CRITICAL RULES:**
- **NEVER create new records without explicit user approval.** If no match is found, ask.
- **NEVER guess matches.** If ambiguous, present options and ask.
- **The user's word is final.** If they say "video 3 goes to record X", do it.
- **One video = one record.** If the user filmed multiple takes of the same topic with different hooks, each take gets its own record.

**STOP. Wait for user confirmation before uploading.**

---

## Step 3: Upload to Dropbox

For each confirmed recording session, create a Dropbox folder and upload the files.

### Folder Structure
```
/your-project/Raw Footage/YYYY-MM-DD/[video-topic-slug]/
  ├── face.mov
  └── screen.mov
```

**Naming rules:**
- Date folder: recording date (e.g., `2026-02-10`)
- Video folder: kebab-case slug of the record title (e.g., `creator-tiktok-scraper`, `launch-ads-claude-code`)
- Rename files to `face.mov` and `screen.mov` (or `face.mkv` / `screen.mkv`)
- If only one file, name it `recording.mov`

### Create Folder
```bash
TOKEN=$(cat ~/.dropbox-token)
curl -s -X POST https://api.dropboxapi.com/2/files/create_folder_v2 \
  --header "Authorization: Bearer $TOKEN" \
  --header "Content-Type: application/json" \
  --data "{\"path\": \"/your-project/Raw Footage/YYYY-MM-DD/video-topic-slug\", \"autorename\": false}"
```

### Upload Files
Use the upload script for each file:
```bash
~/.claude/skills/post-record/scripts/dropbox-upload.sh "<local_file>" "/your-project/Raw Footage/YYYY-MM-DD/video-topic-slug/face.mov"
```

Upload files in parallel when possible (run uploads as background tasks).

### Generate Share Link for Folder
```bash
curl -s -X POST https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings \
  --header "Authorization: Bearer $TOKEN" \
  --header "Content-Type: application/json" \
  --data "{\"path\": \"/your-project/Raw Footage/YYYY-MM-DD/video-topic-slug\", \"settings\": {\"requested_visibility\": \"public\", \"audience\": \"public\", \"access\": \"viewer\"}}"
```

If the link already exists, fetch it:
```bash
curl -s -X POST https://api.dropboxapi.com/2/sharing/list_shared_links \
  --header "Authorization: Bearer $TOKEN" \
  --header "Content-Type: application/json" \
  --data "{\"path\": \"/your-project/Raw Footage/YYYY-MM-DD/video-topic-slug\", \"direct_only\": true}"
```

---

## Step 4: Update Airtable Records

For each matched record, update with:

| Field | Value |
|-------|-------|
| `Raw Content (Dropbox)` | Dropbox folder share link |
| `Status` | `✂️ Editing` |
| `Visual Format` | `Split Screen` |

**Use:** `mcp__airtable-freelance__update_records` (batch up to 10 at a time)

**DO NOT overwrite these fields** (they contain scripted content):
- `Hook 1`
- `Script`
- `Materials & Research`
- `Post Caption`
- `Recording Instructions`

---

## Step 5: Verify Uploads & Clean Up Local Files

After all uploads complete, **verify each file exists on Dropbox** before deleting locally.

### Verify
For each uploaded file, confirm it exists on Dropbox:
```bash
TOKEN=$(cat ~/.dropbox-token)
curl -s -X POST https://api.dropboxapi.com/2/files/get_metadata \
  --header "Authorization: Bearer $TOKEN" \
  --header "Content-Type: application/json" \
  --data "{\"path\": \"/your-project/Raw Footage/YYYY-MM-DD/video-topic-slug/face.mov\"}" | /usr/bin/python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{d[\"name\"]} — {d[\"size\"]} bytes')"
```

Compare the Dropbox file size to the local file size. They must match.

### Delete Local Files
Once ALL files in a recording session are verified on Dropbox (sizes match), delete the local copies:
```bash
rm "<local_file_path>"
```

Also delete the corresponding `.txt` transcript file if one was created during this session.

**CRITICAL: Only delete after verification. If any file size doesn't match or the metadata call fails, do NOT delete that file. Flag it to the user.**

---

## Step 6: Summary

After all uploads, updates, and cleanup, present a final summary:

```
## Post-Record Complete

| # | Video | Pipeline Record | Dropbox | Local Cleaned |
|---|-------|----------------|---------|---------------|
| 1 | [title] | [record title] (recXXX) | [folder link] | Deleted |
| 2 | [title] | [record title] (recXXX) | [folder link] | Deleted |

All [N] videos uploaded, linked, and local files cleaned up.
Your editor can access them from the Editing view.
[X]GB of disk space freed.
```

---

## Edge Cases

### User filmed something not in the pipeline
Ask: "This doesn't match any pipeline record. Want me to create a new one?" If yes, create with:
- Title from the announcement
- Status: `✂️ Editing`
- Visual Format: `Split Screen`
- Date Created: today
- Type: `Short` (default, user can change)
- Raw Content (Dropbox): folder link

### User filmed multiple takes of the same topic
Each take with a **different hook** = separate record. Same hook = same record (link both files).

### User provides record IDs directly
Skip transcription entirely. Just upload and link.

### Single file per recording (no screen recording)
Upload as `recording.mov` instead of `face.mov` + `screen.mov`.

### ffmpeg not found
Whisper needs ffmpeg. If `/tmp/ffmpeg` doesn't exist, download:
```bash
curl -L "https://www.osxexperts.net/ffmpeg71arm.zip" -o /tmp/ffmpeg-arm.zip && unzip -o /tmp/ffmpeg-arm.zip -d /tmp/ && chmod +x /tmp/ffmpeg
```

---

## Part of the Content Team

```
/daily-content-researcher → Content Pipeline → /content-ideator → /content-scripter → FILM → /post-record (this skill) → Editor
```

This skill is the bridge between filming and editing. It takes raw footage from the creator and makes it ready for the editor to pick up.

### Pipeline Statuses (for reference)
```
💡 Idea → ✍️ Scripting → 📝 Prep Materials → 🎬 Filming → ✂️ Editing → 🚀 Prep For Post → 📅 Scheduled → ✅ Posted
```

<\!-- LIO_OS System — @liogpt -->
