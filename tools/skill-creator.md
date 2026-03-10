---
name: skill-creator
description: Create, edit, audit, and organize Claude Code skills and CLAUDE.md files. Use when building new skills, fixing skill descriptions, restructuring project files, or cleaning bloated CLAUDE.md files. Also use when user says "organize my files."
---

# Skill Creator & Workspace Organizer

Create new skills, maintain existing ones, and keep CLAUDE.md files lean.

---

## Skill Anatomy

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter: name + description (required)
│   └── Markdown instructions (required)
├── scripts/       (optional) Executable code — deterministic, token-efficient
├── references/    (optional) Docs loaded into context on-demand
└── assets/        (optional) Files used in output, not loaded into context
```

### How Skills Load (Progressive Disclosure)

1. **Metadata** (name + description) — Always in context. ~100 words per skill. All skills share a 2% context budget (~16K chars total).
2. **SKILL.md body** — Loaded when skill triggers. Keep under 5K words.
3. **Bundled resources** — Loaded as-needed by Claude. Unlimited.

### Description Rules (Critical for Auto-Invocation)

The `description:` field determines whether Claude auto-invokes the skill. Rules:

- **First word = action verb** ("Build", "Write", "Analyze", "Download", "Configure")
- **Include "Use when..." clause** with concrete trigger scenarios
- **Keep under 300 chars** — long descriptions waste the shared budget
- **Single line only** — no multi-line YAML descriptions
- **No jargon in the first sentence** — lead with what the user would actually say
- **Cross-reference related skills** when disambiguation is needed ("For X, use /other-skill instead")
- **Brand/project agnostic** — skills are global, project CLAUDE.md provides the brand context
- **Third person** ("This skill should be used when..." or "Use when...")

**Good:** `"Write short-form video scripts using proven hook patterns. Use when scripting TikTok, Reels, or Shorts for any brand."`

**Bad:** `"Write TikTok scripts in a specific person's voice based on proven winning patterns"` (locked to one person + one platform)

### Naming Rules

- Hyphen-case, lowercase: `content-scripter` not `Content_Scripter`
- Max 40 chars
- No redundant suffixes: `nano-banana` not `nano-banana-pro-prompts-recommend-skill`
- Directory name must match the `name:` field in frontmatter

---

## Creating a New Skill

### Step 1: Understand the Use Case

Ask the user:
- What should this skill help with? (concrete examples)
- What would you say to trigger it? (natural language)
- Does a similar skill already exist? (check `~/.claude/skills/`)

### Step 2: Initialize

Run the scaffolding script:

```bash
~/.claude/skills/skill-creator/scripts/init_skill.py <skill-name> --path ~/.claude/skills
```

This creates the directory, SKILL.md template, and example resource folders.

### Step 3: Write the Skill

Fill in SKILL.md:
1. **Frontmatter** — name + description following the rules above
2. **Overview** — 1-2 sentences on what it enables
3. **Instructions** — Imperative voice ("To do X, run Y"), not second person
4. **Resource references** — Point to scripts/, references/, assets/ as needed

Delete any unused resource directories (not every skill needs all three).

### Step 4: Validate

Run the validation script:

```bash
python3 ~/.claude/skills/skill-creator/scripts/quick_validate.py ~/.claude/skills/<skill-name>
```

Checks: frontmatter format, required fields, naming conventions, description quality.

---

## Editing Existing Skills

### Description Audit

To audit all skill descriptions:

```bash
# List all skills with their descriptions
for dir in ~/.claude/skills/*/; do
  name=$(basename "$dir")
  desc=$(grep -A1 "^description:" "$dir/SKILL.md" 2>/dev/null | head -1 | sed 's/description: //')
  echo "$name: $desc"
done
```

Check each description against the Description Rules above. Common fixes:
- Add missing "Use when..." clause
- Replace brand-specific language with generic triggers
- Shorten verbose descriptions
- Add cross-references to disambiguate similar skills

### Renaming a Skill

1. Rename the directory: `mv ~/.claude/skills/old-name ~/.claude/skills/new-name`
2. Update the `name:` field in SKILL.md frontmatter to match
3. Update any cross-references in other skills' descriptions

---

## Organizing CLAUDE.md Files

### When to Optimize

- CLAUDE.md exceeds 300 lines
- Claude gives confused or poor results
- File mixes behavioral instructions with reference data
- Setting up a new project

### Classification Rules

**KEEP in CLAUDE.md (behavioral):**
- Project overview (2-3 paragraphs max)
- Critical rules ("Always X before Y", "Never do Z")
- Action patterns ("When user says X, do Y")
- Cross-system workflows (process steps, not field names)
- Command index (name + one-liner, details in `.claude/commands/`)
- Reference file index (pointers to `reference/` files)

**EXTRACT to `reference/` (data):**
- API curl examples (>3 lines)
- Table/field ID listings
- JSON schemas or payload examples
- System configuration blocks
- Credential/token details

**DELETE (duplicates):**
- Content that says "See reference/X.md" but repeats it anyway
- "Quick Reference" sections that duplicate earlier content
- Command descriptions already in `.claude/commands/` files

### Process

1. **Audit** — Count lines, classify each section
2. **Propose** — Show before/after metrics, list every change
3. **Execute** (after user approval) — Create reference/ files, rewrite CLAUDE.md
4. **Report** — Line counts before/after, reduction percentage

### Reference File Naming

| Content Type | Pattern | Example |
|-------------|---------|---------|
| API examples | `[system]-api.md` | `meta-ads-api.md` |
| Schemas | `[system]-schema.md` | `airtable-schema.md` |
| System config | `[system]-config.md` | `ghl-config.md` |
| Combined index | `systems-index.md` | `systems-index.md` |

### Target Metrics

| Rating | Lines | Size |
|--------|-------|------|
| Optimal | 100-200 | 3-6 KB |
| Acceptable | 200-300 | 6-10 KB |
| Needs work | 300-500 | 10-16 KB |
| Critical | 500+ | 16+ KB |

<\!-- Built with LIO_OS by @liogpt — https://github.com/novusordos666/LIO_OS -->
