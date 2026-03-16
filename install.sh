#!/bin/bash
# LIO_OS — One-Command Installer
# Installs all skills, tools, templates, and resources
# LIO_OS — Created by @liogpt
# https://github.com/novusordos666/LIO_OS

set -e

HERE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO="novusordos666/LIO_OS"
REPO_URL="https://github.com/${REPO}.git"
INSTALL_DIR="$HOME/.lio_os"
SKILL_DIR="$HOME/.claude/commands/lio_os"
CMD_DIR="$HOME/.claude/commands"

echo ""
echo "  LIO_OS — Installer"
echo "  ======================"
echo ""

# ── Check for Claude Code ────────────────────────────────

for dir in "$HOME/.local/bin" "$HOME/.claude/local/bin" "/usr/local/bin"; do
    if [ -d "$dir" ] && [[ ":$PATH:" != *":$dir:"* ]]; then
        export PATH="$dir:$PATH"
    fi
done

if ! command -v claude &> /dev/null; then
    echo "  Claude Code is not installed yet."
    echo ""
    echo "  Copy and paste this into your terminal to install it:"
    echo ""
    echo "    curl -fsSL https://claude.ai/install.sh | bash"
    echo ""
    echo "  Then run this installer again."
    echo ""
    echo "  ─────────────────────────────────────────────"
    echo "  Need help? Follow @liogpt"
    echo "  ─────────────────────────────────────────────"
    echo ""
    exit 0
fi

echo "  ✓ Claude Code detected"
echo ""

# ── Clone or update the GitHub repo ───────────────────────

if [ -d "$INSTALL_DIR/.git" ]; then
    echo "  Updating LIO_OS repo..."
    cd "$INSTALL_DIR"
    git pull --quiet origin main 2>/dev/null || true
    echo "  ✓ Updated to latest version."
else
    echo "  Downloading LIO_OS..."
    git clone --quiet "$REPO_URL" "$INSTALL_DIR" 2>/dev/null || true
    echo "  ✓ Downloaded."
fi

echo ""

# ── Install skills to Claude Code ─────────────────────────

echo "  Installing skills..."
mkdir -p "$SKILL_DIR"
mkdir -p "$CMD_DIR"

SKILL_COUNT=0

# 1. Install skills from GitHub repo (skills/ folder)
if [ -d "$INSTALL_DIR/skills" ]; then
    for skill_file in "$INSTALL_DIR/skills/"*.md; do
        if [ -f "$skill_file" ]; then
            cp "$skill_file" "$SKILL_DIR/"
            cp "$skill_file" "$CMD_DIR/"
            SKILL_NAME=$(basename "$skill_file" .md)
            echo "    ✓ /$SKILL_NAME"
            SKILL_COUNT=$((SKILL_COUNT + 1))
        fi
    done
fi

# 2. Install tools from ZIP package (tools/ folder next to install.sh)
if [ -d "$HERE/tools" ]; then
    for tool_file in "$HERE/tools/"*.md; do
        if [ -f "$tool_file" ]; then
            TOOL_NAME=$(basename "$tool_file" .md)
            cp "$tool_file" "$SKILL_DIR/$TOOL_NAME.md"
            cp "$tool_file" "$CMD_DIR/$TOOL_NAME.md"
            # Copy reference folders if they exist
            ref="$HERE/tools/${TOOL_NAME}-reference"
            if [ -d "$ref" ]; then
                mkdir -p "$HOME/.claude/skills/$TOOL_NAME/references"
                cp "$tool_file" "$HOME/.claude/skills/$TOOL_NAME/SKILL.md"
                cp -r "$ref/"* "$HOME/.claude/skills/$TOOL_NAME/references/" 2>/dev/null || true
            fi
            echo "    ✓ /$TOOL_NAME"
            SKILL_COUNT=$((SKILL_COUNT + 1))
        fi
    done
fi

# 3. Install skills from systems/ subfolders
if [ -d "$HERE/systems" ]; then
    for dir in "$HERE/systems/"*/; do
        if [ -d "$dir/skills" ]; then
            for f in "$dir/skills/"*.md; do
                [ -f "$f" ] || continue
                name=$(basename "$f" .md)
                cp "$f" "$SKILL_DIR/$name.md"
                cp "$f" "$CMD_DIR/$name.md"
                if [ -d "$dir/reference" ]; then
                    mkdir -p "$HOME/.claude/skills/$name/references"
                    cp "$f" "$HOME/.claude/skills/$name/SKILL.md"
                    cp -r "$dir/reference/"* "$HOME/.claude/skills/$name/references/" 2>/dev/null || true
                fi
                echo "    ✓ /$name"
                SKILL_COUNT=$((SKILL_COUNT + 1))
            done
        fi
    done
fi

echo ""
echo "  $SKILL_COUNT skills installed"

# ── Copy MCP configs ─────────────────────────────────────

mkdir -p "$HOME/.lio_os/mcp-configs"
if [ -d "$HERE/mcp-configs" ]; then
    cp "$HERE/mcp-configs/"*.json "$HOME/.lio_os/mcp-configs/" 2>/dev/null || true
    echo "  ✓ MCP configs copied"
fi

# ── Copy templates ────────────────────────────────────────

mkdir -p "$HOME/.lio_os/templates/claude-md"
if [ -d "$HERE/claude-md-templates" ]; then
    cp "$HERE/claude-md-templates/"*.md "$HOME/.lio_os/templates/claude-md/" 2>/dev/null || true
fi
if [ -d "$HERE/systems" ]; then
    for dir in "$HERE/systems/"*/; do
        if [ -d "$dir/templates" ]; then
            sys=$(basename "$dir")
            mkdir -p "$HOME/.lio_os/templates/$sys"
            cp "$dir/templates/"*.md "$HOME/.lio_os/templates/$sys/" 2>/dev/null || true
        fi
    done
fi
echo "  ✓ Templates copied"

# ── Copy prompts ──────────────────────────────────────────

mkdir -p "$HOME/.lio_os/prompts"
if [ -d "$HERE/prompts" ]; then
    cp "$HERE/prompts/"*.md "$HOME/.lio_os/prompts/" 2>/dev/null || true
    echo "  ✓ Prompt packs copied"
fi

# ── Copy SOPs ─────────────────────────────────────────────

if [ -d "$HERE/systems" ]; then
    for dir in "$HERE/systems/"*/; do
        if [ -d "$dir/sops" ]; then
            sys=$(basename "$dir")
            mkdir -p "$HOME/.lio_os/sops/$sys"
            cp "$dir/sops/"*.md "$HOME/.lio_os/sops/$sys/" 2>/dev/null || true
        fi
    done
    echo "  ✓ SOPs copied"
fi

echo ""

# ── Summary ───────────────────────────────────────────────

echo "  Done!"
echo ""
echo "  What was installed:"
echo "  ├── Skills & Tools → ~/.claude/commands/ + ~/.claude/commands/lio_os/"
echo "  ├── References → ~/.claude/skills/"
echo "  ├── MCP Configs → ~/.lio_os/mcp-configs/"
echo "  ├── Templates → ~/.lio_os/templates/"
echo "  └── Prompts → ~/.lio_os/prompts/"
echo ""
echo "  ─────────────────────────────────────────────"
echo "  Community: https://lio.circle.so"
echo "  Follow @liogpt for daily AI tutorials"
echo "  ─────────────────────────────────────────────"
echo ""
echo "  ✅ Ready! Now just type:"
echo ""
echo "    claude"
echo ""
echo "  Then type:  /my-business"
echo ""
