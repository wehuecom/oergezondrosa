# Automation

Build and manage n8n workflows from Claude Code. Includes the full n8n skill plus comprehensive reference docs for every node type.

## How It Works

```
Describe what you want → Claude builds the workflow → Validate → Deploy
```

1. **Describe** the automation you need in plain English
2. **Claude builds** the n8n workflow JSON using best practices
3. **Validate** the workflow for errors before deploying
4. **Deploy** to your n8n instance via the API

## Skills

| Skill | What It Does |
|-------|-------------|
| `/n8n` | Build, configure, and manage n8n workflows. Handles node configuration, expressions, Code nodes, validation, and deployment. |

## Reference Files

The reference directory contains deep documentation for every aspect of n8n:

| Directory | What |
|-----------|------|
| `reference/code-javascript/` | JavaScript Code node — data access, patterns, built-in functions, errors |
| `reference/code-python/` | Python Code node — data access, patterns, standard library, errors |
| `reference/expression-syntax/` | n8n expression syntax — examples, common mistakes |
| `reference/node-configuration/` | Node config — dependencies, operation patterns |
| `reference/validation/` | Workflow validation — error catalog, false positives |
| `reference/workflow-patterns/` | Common patterns — webhooks, HTTP, databases, AI agents, scheduled tasks |

## Build Rules

The n8n skill follows these priorities (in order):

1. **Native n8n nodes first** — Filter, Sort, Set, Merge, Split Out, Remove Duplicates
2. **Native integration nodes** — Airtable, Supabase, Slack, OpenAI, etc.
3. **Set node expressions** — for all data transformation and calculations
4. **HTTP Request** — only when no native node exists
5. **Code node** — absolute last resort (JSON parsing, complex dedup only)

## Prerequisites

**For building workflows:**
- n8n instance (cloud at `n8n.cloud` or self-hosted)
- n8n API key (Settings → API → Create key)
- n8n MCP server configured

**For the MCP server:**
Add to your Claude settings:
```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "@anthropic/n8n-mcp-server"],
      "env": {
        "N8N_API_URL": "https://YOUR_INSTANCE.app.n8n.cloud/api/v1",
        "N8N_API_KEY": "YOUR_N8N_API_KEY"
      }
    }
  }
}
```

## Getting Started

1. Set up your n8n instance if you don't have one
2. Configure the n8n MCP server (or use the REST API)
3. Run `/n8n` and describe what automation you want to build
4. Claude will create, validate, and deploy the workflow

## Example Automations

- **Lead capture:** Webhook → CRM record → Slack notification
- **Content pipeline:** RSS feed → AI summary → Social post draft
- **Payment tracking:** Stripe webhook → Database update → Email receipt
- **Daily reports:** Schedule → Query data → Format → Send email
- **Form processing:** Webhook → Validate → Store → Auto-respond
