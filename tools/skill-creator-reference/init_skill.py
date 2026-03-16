#!/usr/bin/env python3
"""
Skill Initializer - Creates a new skill from template

Usage:
    init_skill.py <skill-name> --path <path>

Examples:
    init_skill.py content-editor --path ~/.claude/skills
    init_skill.py api-helper --path ~/.claude/skills
"""

import sys
from pathlib import Path


SKILL_TEMPLATE = """---
name: {skill_name}
description: [TODO: Action verb + what it does + "Use when..." trigger clause. Keep under 300 chars, single line.]
---

# {skill_title}

[TODO: 1-2 sentences — what this skill enables.]

---

## When to Use

- [TODO: Concrete scenario 1]
- [TODO: Concrete scenario 2]

## Process

[TODO: Step-by-step instructions in imperative voice. Reference scripts/, references/, assets/ as needed.]

## Resources

[TODO: Delete any resource directories not needed for this skill.]
"""


def title_case_skill_name(skill_name):
    return ' '.join(word.capitalize() for word in skill_name.split('-'))


def init_skill(skill_name, path):
    skill_dir = Path(path).expanduser().resolve() / skill_name

    if skill_dir.exists():
        print(f"Error: Skill directory already exists: {skill_dir}")
        return None

    try:
        skill_dir.mkdir(parents=True, exist_ok=False)
    except Exception as e:
        print(f"Error creating directory: {e}")
        return None

    skill_title = title_case_skill_name(skill_name)
    skill_content = SKILL_TEMPLATE.format(
        skill_name=skill_name,
        skill_title=skill_title
    )

    skill_md_path = skill_dir / 'SKILL.md'
    try:
        skill_md_path.write_text(skill_content)
        print(f"Created: {skill_dir}/SKILL.md")
    except Exception as e:
        print(f"Error creating SKILL.md: {e}")
        return None

    # Create optional resource directories
    for subdir in ['scripts', 'references', 'assets']:
        (skill_dir / subdir).mkdir(exist_ok=True)

    print(f"Skill '{skill_name}' initialized at {skill_dir}")
    print("Next: Edit SKILL.md, delete unused resource dirs, run quick_validate.py")
    return skill_dir


def main():
    if len(sys.argv) < 4 or sys.argv[2] != '--path':
        print("Usage: init_skill.py <skill-name> --path <path>")
        print("Example: init_skill.py my-skill --path ~/.claude/skills")
        sys.exit(1)

    skill_name = sys.argv[1]
    path = sys.argv[3]

    result = init_skill(skill_name, path)
    sys.exit(0 if result else 1)


if __name__ == "__main__":
    main()
