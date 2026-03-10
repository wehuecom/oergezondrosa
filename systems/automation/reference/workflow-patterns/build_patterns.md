# n8n Build Patterns

Learned patterns from real workflow modifications. These are corrections and preferences to follow when building n8n workflows.

---

## 1. Loop Node Output Order

**Critical**: The Split In Batches (loop) node has TWO outputs with specific meanings.

```
Output 0 = DONE (all items processed, exit loop)
Output 1 = LOOP (continue processing items)
```

### Correct Connection Pattern:

```
Loop Over Items
  ├── Output 0 (done) → Next Step After Loop
  └── Output 1 (loop) → Process Item → Back to Loop
```

### Example: Loop Over Accounts

```json
{
  "type": "n8n-nodes-base.splitInBatches",
  "name": "Loop Over Accounts",
  "connections": {
    "Loop Over Accounts": {
      "main": [
        [{ "node": "Call Content Analyzer", "type": "main", "index": 0 }],
        [{ "node": "Scrape TikTok Videos", "type": "main", "index": 0 }]
      ]
    }
  }
}
```

- **Index 0** (first array): Goes to "Call Content Analyzer" (done processing)
- **Index 1** (second array): Goes to "Scrape TikTok Videos" (continue loop)

---

## 2. Edit Fields Node vs Code Node

**Preference**: Use Edit Fields (Set node with mode: "raw") for data transformation instead of Code nodes.

### When to use Edit Fields:

- Mapping fields from one structure to another
- Adding/removing fields
- Simple transformations with expressions
- JSON output formatting

### When to use Code nodes:

- Complex calculations requiring loops
- Multiple conditional branches in one step
- External library requirements
- Heavy data manipulation (arrays, aggregations)

### Edit Fields Node Structure:

```json
{
  "type": "n8n-nodes-base.set",
  "typeVersion": 3.4,
  "name": "Process Posts & Calculate Stats",
  "parameters": {
    "mode": "raw",
    "jsonOutput": "={\n  \"id\": \"{{ $json.aweme_id }}\",\n  \"account_id\": \"{{ $('Loop Over Accounts').first().json.id }}\",\n  \"handle\": \"{{ $('Loop Over Accounts').first().json.handle }}\"\n}"
  }
}
```

### Key Points:

- Use `mode: "raw"` for JSON template output
- Use `jsonOutput` field with expression prefix `=`
- Can reference other nodes with `$('Node Name')`
- Cleaner than Code node for simple mappings

---

## 3. Native Nodes vs HTTP Requests

**Preference**: Always use native n8n nodes when available instead of HTTP Request nodes.

### Native Node Hierarchy:

1. **First choice**: Native app node (Supabase, Airtable, Slack, etc.)
2. **Second choice**: LangChain node for AI (Google Gemini, OpenAI, etc.)
3. **Last resort**: HTTP Request node

### Native Supabase Node:

```json
{
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1,
  "parameters": {
    "operation": "getAll",
    "tableId": "accounts",
    "filterType": "string",
    "filterString": "is_active=eq.true"
  },
  "credentials": {
    "supabaseApi": { "id": "...", "name": "Supabase account" }
  }
}
```

### Native Airtable Node:

```json
{
  "type": "n8n-nodes-base.airtable",
  "typeVersion": 2.1,
  "parameters": {
    "operation": "upsert",
    "base": { "__rl": true, "mode": "id", "value": "YOUR_AIRTABLE_BASE_ID" },
    "table": { "__rl": true, "mode": "id", "value": "YOUR_CONTENT_TABLE_ID" },
    "columns": {
      "mappingMode": "defineBelow",
      "value": {
        "Video ID": "={{ $json.id }}",
        "Handle": "={{ $json.handle }}"
      }
    }
  }
}
```

### Native Google Gemini LangChain Node:

```json
{
  "type": "@n8n/n8n-nodes-langchain.googleGemini",
  "typeVersion": 1,
  "parameters": {
    "modelId": "models/gemini-2.0-flash",
    "prompt": "Analyze this video..."
  },
  "credentials": {
    "googleGeminiApi": { "id": "...", "name": "Google Gemini API" }
  }
}
```

### When HTTP Request IS appropriate:

- API not supported by native node
- Need specific headers or body format
- Custom authentication requirements
- ScrapeCreators API (no native node)

---

## 4. Execute Workflow Pattern

**Preference**: Use Execute Workflow node to chain workflows instead of HTTP webhooks.

### Benefits:

- No external HTTP call overhead
- Passes data directly
- Better error handling
- Works with inactive workflows

### Execute Workflow Trigger (receiving workflow):

```json
{
  "type": "n8n-nodes-base.executeWorkflowTrigger",
  "typeVersion": 1.1,
  "name": "When Executed by Another Workflow",
  "parameters": {
    "workflowInputs": {
      "values": []
    }
  }
}
```

### Execute Workflow Call (calling workflow):

```json
{
  "type": "n8n-nodes-base.executeWorkflow",
  "typeVersion": 1.2,
  "name": "Call Content Analyzer",
  "parameters": {
    "source": "database",
    "workflowId": { "__rl": true, "mode": "id", "value": "bDA241zdzbXMCbPf" },
    "mode": "each"
  }
}
```

### Chaining Pattern:

```
Workflow 1: Scraper
  └── Execute Workflow → Workflow 2: Analyzer
                           └── Execute Workflow → Workflow 3: Sync
```

---

## 5. HTTP Request Body Format

When HTTP Request IS needed, use the correct body parameter format.

### Correct Format (bodyParameters):

```json
{
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://api.example.com/endpoint",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify({ key: $json.value }) }}"
  }
}
```

### Alternative (contentType + body):

```json
{
  "parameters": {
    "method": "POST",
    "url": "...",
    "sendBody": true,
    "contentType": "json",
    "body": {
      "key": "={{ $json.value }}"
    }
  }
}
```

### For Supabase REST API (when native node not suitable):

```json
{
  "parameters": {
    "method": "POST",
    "url": "https://your-project.supabase.co/rest/v1/content",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "supabaseApi",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        { "name": "Prefer", "value": "resolution=merge-duplicates,return=representation" }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify($json) }}"
  }
}
```

---

## 6. Schedule Trigger Format

Use the correct schedule trigger configuration.

### Weekly Schedule:

```json
{
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1.2,
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "weeks",
          "triggerAtDay": ["sunday", "thursday"],
          "triggerAtHour": 6,
          "triggerAtMinute": 0
        }
      ]
    }
  }
}
```

### Daily Schedule:

```json
{
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "days",
          "triggerAtHour": 6,
          "triggerAtMinute": 0
        }
      ]
    }
  }
}
```

---

## 7. Error Workflow Configuration

Configure error handling at the workflow level.

```json
{
  "settings": {
    "errorWorkflow": "Q0W1ls0eOMcJADGi",
    "executionOrder": "v1"
  }
}
```

### Per-Node Error Handling:

```json
{
  "parameters": { ... },
  "onError": "continueRegularOutput"
}
```

Options:
- `stopWorkflow` - Stop on error (default)
- `continueRegularOutput` - Continue with empty output
- `continueErrorOutput` - Route to error output

---

## 8. IF Node Configuration

Use the correct IF node structure for typeVersion 2.

### String Comparison:

```json
{
  "type": "n8n-nodes-base.if",
  "typeVersion": 2,
  "parameters": {
    "conditions": {
      "options": { "version": 2 },
      "combinator": "and",
      "conditions": [
        {
          "id": "unique-id",
          "operator": {
            "type": "string",
            "operation": "exists"
          },
          "leftValue": "={{ $json.transcript }}"
        }
      ]
    }
  }
}
```

### Boolean Check:

```json
{
  "parameters": {
    "conditions": {
      "options": { "version": 2 },
      "combinator": "and",
      "conditions": [
        {
          "id": "unique-id",
          "operator": {
            "type": "boolean",
            "operation": "true"
          },
          "leftValue": "={{ $json.should_download }}"
        }
      ]
    }
  }
}
```

---

## Summary Checklist

When building n8n workflows:

- [ ] Loop nodes: Output 0 = done, Output 1 = loop
- [ ] Use Edit Fields (Set mode:raw) instead of Code for mapping
- [ ] Use native nodes (Supabase, Airtable, Gemini) first
- [ ] Use Execute Workflow for chaining, not webhooks
- [ ] HTTP Request body: use `jsonBody` with expression
- [ ] Configure error workflow in settings
- [ ] IF nodes: use typeVersion 2 with conditions.conditions array

---

## Node Type Quick Reference

| Task | Node Type | Type Version |
|------|-----------|--------------|
| Data transformation | `n8n-nodes-base.set` | 3.4 |
| Loop over items | `n8n-nodes-base.splitInBatches` | 3 |
| Conditional branch | `n8n-nodes-base.if` | 2 |
| Supabase operations | `n8n-nodes-base.supabase` | 1 |
| Airtable operations | `n8n-nodes-base.airtable` | 2.1 |
| Gemini AI | `@n8n/n8n-nodes-langchain.googleGemini` | 1 |
| OpenAI Chat | `@n8n/n8n-nodes-langchain.lmChatOpenAi` | 1.2 |
| Execute workflow | `n8n-nodes-base.executeWorkflow` | 1.2 |
| Execute trigger | `n8n-nodes-base.executeWorkflowTrigger` | 1.1 |
| Schedule trigger | `n8n-nodes-base.scheduleTrigger` | 1.2 |
| HTTP Request | `n8n-nodes-base.httpRequest` | 4.2 |
| No operation | `n8n-nodes-base.noOp` | 1 |
