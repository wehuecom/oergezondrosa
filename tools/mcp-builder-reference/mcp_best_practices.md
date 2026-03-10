# MCP Server Best Practices

Complete guidelines for building production-quality MCP servers.

---

## Naming Standards

### Server Names

| Language | Pattern | Example |
|----------|---------|---------|
| Python | `{service}_mcp` | `slack_mcp`, `github_mcp` |
| TypeScript | `{service}-mcp-server` | `slack-mcp-server`, `github-mcp-server` |

### Tool Names

- Use `snake_case` with service prefix
- Start with action verb
- Be specific and unambiguous

```
# Good
slack_send_message
github_create_issue
stripe_list_invoices

# Bad
sendMessage        # No prefix, wrong case
send               # Too vague
slack_msg          # Abbreviated
```

---

## Tool Design Principles

### 1. Workflow-Focused, Not API-Wrapped

**Bad**: One tool per API endpoint
```
stripe_get_customer
stripe_get_customer_subscriptions
stripe_get_customer_invoices
stripe_get_customer_payment_methods
```

**Good**: Workflow-oriented tools
```
stripe_get_customer_overview    # Returns customer + active subscriptions + recent invoices
stripe_search_customers         # Smart search across multiple fields
```

### 2. Atomic Operations

Each tool should do ONE thing well:
- Don't combine create + update + delete
- Don't require multi-step orchestration for basic tasks
- Don't create "god tools" that do everything

### 3. Actionable Error Messages

**Bad**:
```
Error: API request failed
Error: 404 Not Found
Error: Invalid input
```

**Good**:
```
Error: Channel C012345 not found. Use slack_list_channels to find valid channel IDs.
Error: Rate limited. Retry after 30 seconds or reduce request frequency.
Error: Invalid date format 'tomorrow'. Use ISO 8601 format: 2024-01-15T10:30:00Z
```

### 4. Clear Descriptions

```typescript
// Bad - vague
description: "Get messages"

// Good - specific and helpful
description: "Search messages in a Slack channel by keyword, date range, or sender. Returns up to 100 messages per request with pagination support."
```

---

## Tool Annotations

**Always specify all four annotations:**

```typescript
annotations: {
  readOnlyHint: true,       // Does NOT modify any state
  destructiveHint: false,   // Does NOT delete or overwrite data
  idempotentHint: true,     // Safe to call multiple times
  openWorldHint: true,      // Interacts with external services
}
```

| Annotation | true | false |
|------------|------|-------|
| `readOnlyHint` | GET, LIST, SEARCH | CREATE, UPDATE, DELETE |
| `destructiveHint` | DELETE, OVERWRITE | CREATE, UPDATE, GET |
| `idempotentHint` | GET, PUT (same data) | POST, DELETE (sometimes) |
| `openWorldHint` | External APIs | Local computation only |

---

## Response Handling

### Dual Format Support

Always support both formats:

```python
@mcp.tool()
async def list_items(format: str = "markdown") -> str:
    items = await fetch_items()

    if format == "json":
        return json.dumps({
            "items": items,
            "count": len(items),
            "has_more": has_more,
        }, indent=2)

    # Markdown for human readability
    lines = ["# Items\n"]
    for item in items:
        lines.append(f"- **{item['name']}** (`{item['id']}`)")
    return "\n".join(lines)
```

### When to Use Each Format

| Format | Use Case |
|--------|----------|
| **Markdown** | Default for exploration, human review |
| **JSON** | When data will be processed further, parsed, or stored |

---

## Pagination

### Required Metadata

Always return pagination info:

```json
{
  "items": [...],
  "has_more": true,
  "next_cursor": "abc123",
  "total_count": 1234
}
```

### Implementation Pattern

```python
class PaginatedInput(BaseModel):
    limit: int = Field(default=20, ge=1, le=100)
    cursor: str | None = None

@mcp.tool()
async def list_items(input: PaginatedInput) -> str:
    # NEVER load all results - always respect limit
    results = await api.list(limit=input.limit, cursor=input.cursor)

    return json.dumps({
        "items": results.items,
        "has_more": results.has_more,
        "next_cursor": results.next_cursor,
        "total_count": results.total,  # If available
    })
```

---

## Character Limits

### The 25K Rule

```python
CHARACTER_LIMIT = 25000

def truncate(content: str) -> str:
    if len(content) <= CHARACTER_LIMIT:
        return content

    return (
        content[:CHARACTER_LIMIT]
        + "\n\n[Truncated. Use filters or pagination to get specific data.]"
    )
```

### Prevent Context Overflow

- Default to returning summaries, not full data
- Provide filtering options (date range, keyword, status)
- Use pagination with reasonable defaults (20-50 items)
- Truncate long text fields (descriptions, comments)

---

## Security

### Input Validation

```python
from pydantic import BaseModel, Field, field_validator
import re

class FileInput(BaseModel):
    path: str = Field(..., max_length=500)

    @field_validator("path")
    @classmethod
    def prevent_traversal(cls, v: str) -> str:
        # Prevent directory traversal
        if ".." in v or v.startswith("/"):
            raise ValueError("Invalid path")
        # Sanitize
        return re.sub(r"[^\w\-./]", "", v)
```

### Security Checklist

- [ ] Validate all inputs against schemas
- [ ] Sanitize user-provided strings
- [ ] Prevent command injection (never pass raw input to shell)
- [ ] Prevent path traversal (normalize and validate paths)
- [ ] Use parameterized queries (never string concatenation for SQL)
- [ ] Don't expose internal errors (stack traces, file paths)
- [ ] Log security-relevant events (auth failures, invalid inputs)
- [ ] Implement rate limiting awareness

### Error Response Security

**Bad** - Exposes internals:
```
Error: FileNotFoundError: /var/app/secrets/config.yaml
Error: psycopg2.OperationalError: connection to server at "10.0.0.5" failed
```

**Good** - Safe and helpful:
```
Error: Configuration file not found. Contact administrator.
Error: Database connection failed. Retry in a few moments.
```

---

## Transport Options

| Transport | Best For | Example |
|-----------|----------|---------|
| **stdio** | Local CLI tools, desktop apps | Claude Desktop integration |
| **HTTP** | Remote servers, multi-client | Web service deployment |
| **SSE** | Real-time updates, streaming | Live dashboards, notifications |

### Stdio (Default)

```python
# Python
mcp.run()  # Defaults to stdio

# TypeScript
const transport = new StdioServerTransport();
await server.connect(transport);
```

### HTTP/SSE

```python
# Python with SSE
mcp.run(transport="sse", port=8080)
```

```typescript
// TypeScript with HTTP
import { HttpServerTransport } from "@modelcontextprotocol/sdk/server/http.js";

const transport = new HttpServerTransport({ port: 8080 });
await server.connect(transport);
```

---

## Testing Checklist

### Functional Tests

- [ ] Each tool returns expected output for valid input
- [ ] Invalid inputs produce helpful error messages
- [ ] Pagination works correctly
- [ ] Character limits are enforced
- [ ] Both output formats work

### Integration Tests

- [ ] Authentication works with real credentials
- [ ] API rate limits are handled gracefully
- [ ] Network errors don't crash the server
- [ ] Timeouts are handled appropriately

### Security Tests

- [ ] Input validation rejects malicious inputs
- [ ] Path traversal attempts fail
- [ ] SQL injection attempts fail
- [ ] No sensitive data in error messages

### Performance Tests

- [ ] Large responses are truncated properly
- [ ] Pagination prevents memory issues
- [ ] Concurrent requests work correctly

---

## Documentation Requirements

### Tool Descriptions

Every tool needs:
1. Clear one-line description
2. Parameter documentation with types and constraints
3. Example usage (in README)
4. Error scenarios and how to handle them

### README Template

```markdown
# {Service} MCP Server

MCP server for interacting with {Service} API.

## Installation

\`\`\`bash
npm install {service}-mcp-server
\`\`\`

## Configuration

Set environment variables:
- `{SERVICE}_API_KEY` - Your API key

## Tools

### {service}_list_items
List items with optional filtering.

**Parameters:**
- `limit` (number, optional): Max items to return (1-100, default 20)
- `filter` (string, optional): Filter by status

**Example:**
\`\`\`json
{"limit": 50, "filter": "active"}
\`\`\`

## Rate Limits

This server respects {Service}'s rate limits:
- 100 requests per minute
- Automatic retry with backoff on 429 responses
```
