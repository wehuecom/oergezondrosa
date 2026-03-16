#!/usr/bin/env python3
"""
Quick validation for Claude Code skills

Usage:
    python quick_validate.py <skill_directory>
    python quick_validate.py ~/.claude/skills/my-skill
"""

import sys
import re
from pathlib import Path


def validate_skill(skill_path):
    skill_path = Path(skill_path)

    # Check SKILL.md exists
    skill_md = skill_path / 'SKILL.md'
    if not skill_md.exists():
        return False, "SKILL.md not found"

    content = skill_md.read_text()

    # Check frontmatter exists
    if not content.startswith('---'):
        return False, "No YAML frontmatter found"

    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return False, "Invalid frontmatter format"

    frontmatter = match.group(1)

    # Check required fields
    if 'name:' not in frontmatter:
        return False, "Missing 'name' in frontmatter"
    if 'description:' not in frontmatter:
        return False, "Missing 'description' in frontmatter"

    # Validate name format (hyphen-case)
    name_match = re.search(r'name:\s*(.+)', frontmatter)
    if name_match:
        name = name_match.group(1).strip()
        if not re.match(r'^[a-z0-9-]+$', name):
            return False, f"Name '{name}' must be hyphen-case (lowercase, digits, hyphens only)"
        if name.startswith('-') or name.endswith('-') or '--' in name:
            return False, f"Name '{name}' has invalid hyphen placement"
        if len(name) > 40:
            return False, f"Name '{name}' exceeds 40 char limit ({len(name)} chars)"
        # Check dir name matches
        if skill_path.name != name:
            return False, f"Directory '{skill_path.name}' doesn't match name '{name}'"

    # Validate description
    desc_match = re.search(r'description:\s*(.+)', frontmatter)
    if desc_match:
        desc = desc_match.group(1).strip()
        if len(desc) > 500:
            return False, f"Description too long ({len(desc)} chars, max 500)"
        if '<' in desc or '>' in desc:
            return False, "Description cannot contain angle brackets"
        if desc.startswith('[TODO'):
            return False, "Description still has TODO placeholder"

    return True, f"Valid: {skill_path.name}"


def main():
    if len(sys.argv) == 2:
        path = sys.argv[1]
        valid, message = validate_skill(path)
        print(message)
        sys.exit(0 if valid else 1)
    elif len(sys.argv) == 3 and sys.argv[1] == '--all':
        # Validate all skills in a directory
        skills_dir = Path(sys.argv[2])
        errors = 0
        for skill_dir in sorted(skills_dir.iterdir()):
            if skill_dir.is_dir() and (skill_dir / 'SKILL.md').exists():
                valid, message = validate_skill(skill_dir)
                status = "OK" if valid else "FAIL"
                print(f"  [{status}] {message}")
                if not valid:
                    errors += 1
        print(f"\n{errors} error(s) found" if errors else "\nAll skills valid")
        sys.exit(1 if errors else 0)
    else:
        print("Usage: python quick_validate.py <skill_directory>")
        print("       python quick_validate.py --all <skills_parent_directory>")
        sys.exit(1)


if __name__ == "__main__":
    main()
