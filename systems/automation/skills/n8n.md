---
name: n8n
description: Build, configure, and manage n8n workflows. Use when creating workflows, configuring nodes, writing expressions, fixing validation errors, using n8n MCP tools, or writing Code node scripts. This is the single skill for all n8n work.
---

# n8n Workflow Builder

All n8n knowledge in one place. This skill routes to the right reference based on the task.

---

## Quick Router

**What are you doing?** Read the matching reference:

| Task | Reference | When to Read |
|------|-----------|--------------|
| Building a workflow from scratch | [references/workflow-patterns/SKILL.md](references/workflow-patterns/SKILL.md) | "Build me an n8n workflow", "Create an automation" |
| Using n8n MCP tools (search, create, validate) | [references/mcp-tools/SKILL.md](references/mcp-tools/SKILL.md) | Calling search_nodes, get_node, n8n_create_workflow, etc. |
| Configuring a specific node | [references/node-configuration/SKILL.md](references/node-configuration/SKILL.md) | Setting up Airtable, HTTP Request, Slack, etc. |
| Fixing validation errors | [references/validation/SKILL.md](references/validation/SKILL.md) | validate_node or validate_workflow returned errors |
| Writing expressions ({{ }}) | [references/expression-syntax/SKILL.md](references/expression-syntax/SKILL.md) | Using $json, $node, $input in expression fields |
| Writing JavaScript Code nodes | [references/code-javascript/SKILL.md](references/code-javascript/SKILL.md) | Code node with JavaScript selected |
| Writing Python Code nodes | [references/code-python/SKILL.md](references/code-python/SKILL.md) | Code node with Python selected |

## Typical Workflow Build Order

1. **Search** for needed nodes → read mcp-tools reference
2. **Create** workflow with trigger → read workflow-patterns reference
3. **Configure** each node → read node-configuration reference
4. **Write** expressions in fields → read expression-syntax reference
5. **Write** Code nodes (if needed, LAST RESORT) → read code-javascript or code-python reference
6. **Validate** the workflow → read validation reference if errors appear

## Build Rules (Your Preferences)

**KEEP IT SIMPLE. DO NOT OVERBUILD.**

Node priority (use in this order):
1. **Native n8n nodes** — Filter, Sort, Limit, Set, Split Out, Merge, Remove Duplicates
2. **Native Apify node** — Use "Run actor and get dataset" operation. Scrapes AND returns data in ONE node.
3. **Native integration nodes** — Perplexity, Supabase, Airtable, Gemini, OpenAI
4. **Set node (Edit Fields)** — For ALL data transformation, field mapping, calculations
5. **HTTP Request** — ONLY when no native node exists
6. **Code node** — ABSOLUTE LAST RESORT (only for JSON parsing from LLMs, complex deduplication)

## nodeType Formats (Critical)

Two different prefixes for different tools:

| Context | Format | Example |
|---------|--------|---------|
| search_nodes, get_node, validate_node | `nodes-base.*` | `nodes-base.slack` |
| n8n_create_workflow, n8n_update_partial_workflow | `n8n-nodes-base.*` | `n8n-nodes-base.slack` |
| AI/Langchain nodes (search/validate) | `nodes-langchain.*` | `nodes-langchain.agent` |
| AI/Langchain nodes (workflow) | `@n8n/n8n-nodes-langchain.*` | `@n8n/n8n-nodes-langchain.agent` |

## Each Reference Also Has Sub-Files

The references are organized with their own supporting docs:

- **workflow-patterns/** — 6 sub-files: ai_agent_workflow.md, database_operations.md, webhook_processing.md, http_api_integration.md, scheduled_tasks.md, lio_build_patterns.md
- **mcp-tools/** — 3 sub-files: SEARCH_GUIDE.md, VALIDATION_GUIDE.md, WORKFLOW_GUIDE.md
- **node-configuration/** — 2 sub-files: DEPENDENCIES.md, OPERATION_PATTERNS.md
- **validation/** — 2 sub-files: ERROR_CATALOG.md, FALSE_POSITIVES.md
- **expression-syntax/** — 2 sub-files: COMMON_MISTAKES.md, EXAMPLES.md
- **code-javascript/** — 4 sub-files: DATA_ACCESS.md, COMMON_PATTERNS.md, BUILTIN_FUNCTIONS.md, ERROR_PATTERNS.md
- **code-python/** — 4 sub-files: DATA_ACCESS.md, COMMON_PATTERNS.md, STANDARD_LIBRARY.md, ERROR_PATTERNS.md

Read sub-files only when the main reference points to them or when deeper detail is needed.

<\!-- LIO_OS System — @liogpt -->
