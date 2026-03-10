# Python MCP Server Implementation

Build MCP servers using Python's FastMCP framework.

---

## Project Structure

```
{service}_mcp/
├── src/
│   └── {service}_mcp/
│       ├── __init__.py
│       ├── server.py      # FastMCP initialization
│       ├── tools/         # Tool implementations
│       │   ├── __init__.py
│       │   ├── messages.py
│       │   └── channels.py
│       ├── models/        # Pydantic models
│       │   └── inputs.py
│       ├── services/      # API clients
│       │   └── api.py
│       └── utils/         # Shared utilities
│           ├── formatting.py
│           └── errors.py
├── pyproject.toml
└── README.md
```

---

## Server Initialization

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP(
    name="{service}_mcp",
    version="1.0.0"
)
```

---

## Tool Implementation

### Basic Tool Pattern

```python
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field

mcp = FastMCP("slack_mcp")

class SendMessageInput(BaseModel):
    """Input for sending a Slack message."""

    model_config = {"extra": "forbid"}  # Pydantic v2 style

    channel_id: str = Field(
        ...,
        description="Channel ID (e.g., C01234567)",
        pattern=r"^C[A-Z0-9]+$"
    )
    text: str = Field(
        ...,
        description="Message content",
        min_length=1,
        max_length=40000
    )
    thread_ts: str | None = Field(
        None,
        description="Thread timestamp to reply to"
    )

@mcp.tool(
    name="slack_send_message",
    description="Send a message to a Slack channel",
    annotations={
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True
    }
)
async def send_message(input: SendMessageInput) -> str:
    """
    Send a message to a Slack channel.

    Args:
        input: Message parameters including channel and text

    Returns:
        Confirmation with message timestamp
    """
    result = await slack_client.chat_postMessage(
        channel=input.channel_id,
        text=input.text,
        thread_ts=input.thread_ts
    )
    return f"Message sent: {result['ts']}"
```

### List Tool with Pagination

```python
class ListChannelsInput(BaseModel):
    model_config = {"extra": "forbid"}

    limit: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Maximum channels to return"
    )
    cursor: str | None = Field(
        None,
        description="Pagination cursor from previous response"
    )
    format: str = Field(
        default="markdown",
        pattern=r"^(markdown|json)$",
        description="Output format: 'markdown' or 'json'"
    )

@mcp.tool(
    name="slack_list_channels",
    description="List Slack channels the bot can access",
    annotations={
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True
    }
)
async def list_channels(input: ListChannelsInput) -> str:
    result = await slack_client.conversations_list(
        limit=input.limit,
        cursor=input.cursor
    )

    channels = result["channels"]
    next_cursor = result.get("response_metadata", {}).get("next_cursor")

    if input.format == "json":
        return json.dumps({
            "channels": [
                {"id": c["id"], "name": c["name"], "topic": c.get("topic", {}).get("value", "")}
                for c in channels
            ],
            "has_more": bool(next_cursor),
            "next_cursor": next_cursor
        }, indent=2)

    # Markdown format
    lines = ["# Slack Channels\n"]
    for ch in channels:
        topic = ch.get("topic", {}).get("value", "No topic")
        lines.append(f"- **#{ch['name']}** (`{ch['id']}`): {topic}")

    if next_cursor:
        lines.append(f"\n*More channels available. Use cursor: `{next_cursor}`*")

    return "\n".join(lines)
```

---

## Input Validation Patterns

### Pydantic v2 Validators

```python
from pydantic import BaseModel, Field, field_validator
from typing import Literal

class SearchInput(BaseModel):
    model_config = {"extra": "forbid"}

    query: str = Field(..., min_length=1, max_length=500)
    sort_by: Literal["date", "relevance", "score"] = Field(default="relevance")

    @field_validator("query")
    @classmethod
    def sanitize_query(cls, v: str) -> str:
        # Remove potentially dangerous characters
        return v.strip().replace("\x00", "")
```

### Enum Fields

```python
from enum import Enum

class MessageType(str, Enum):
    TEXT = "text"
    CODE = "code"
    FILE = "file"

class PostInput(BaseModel):
    type: MessageType = Field(default=MessageType.TEXT)
```

---

## Error Handling

### Centralized Error Handler

```python
from functools import wraps

def handle_api_errors(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except RateLimitError as e:
            return f"Rate limited. Retry after {e.retry_after} seconds."
        except AuthError:
            return "Authentication failed. Check API credentials."
        except NotFoundError as e:
            return f"Not found: {e.resource}. Verify the ID exists."
        except APIError as e:
            return f"API error: {e.message}. Try with different parameters."
    return wrapper

@mcp.tool(name="slack_get_user")
@handle_api_errors
async def get_user(input: GetUserInput) -> str:
    ...
```

---

## Response Formatting

### Character Limit Utility

```python
CHARACTER_LIMIT = 25000

def truncate_response(content: str, limit: int = CHARACTER_LIMIT) -> str:
    if len(content) <= limit:
        return content

    truncated = content[:limit]
    return f"{truncated}\n\n[Response truncated at {limit:,} characters. Use filters to narrow results.]"
```

### Dual Format Support

```python
def format_items(items: list, format: str = "markdown") -> str:
    if format == "json":
        return json.dumps(items, indent=2, default=str)

    lines = []
    for item in items:
        lines.append(f"- **{item['name']}** (`{item['id']}`)")
        if item.get("description"):
            lines.append(f"  {item['description']}")

    return truncate_response("\n".join(lines))
```

---

## Running the Server

```python
# server.py
if __name__ == "__main__":
    mcp.run()
```

```bash
# Run with stdio transport
python -m {service}_mcp.server

# Run with SSE transport
python -m {service}_mcp.server --transport sse --port 8080
```

---

## Configuration

### pyproject.toml

```toml
[project]
name = "{service}-mcp"
version = "1.0.0"
requires-python = ">=3.10"
dependencies = [
    "mcp>=1.0.0",
    "httpx>=0.25.0",
    "pydantic>=2.0.0",
]

[project.scripts]
{service}-mcp = "{service}_mcp.server:main"
```

---

## Checklist Before Publishing

- [ ] All tools have proper descriptions and docstrings
- [ ] Input models use `model_config = {"extra": "forbid"}`
- [ ] All annotations specified (readOnlyHint, etc.)
- [ ] Pagination implemented for list operations
- [ ] Character limits applied to responses
- [ ] Both markdown and JSON formats supported
- [ ] Error messages are actionable
- [ ] No sensitive data in error responses
- [ ] README with installation and usage examples

<\!-- Built with LIO_OS by @liogpt — https://github.com/novusordos666/LIO_OS -->
