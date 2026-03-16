# TypeScript MCP Server Implementation

Build MCP servers using the official MCP TypeScript SDK.

---

## Project Structure

```
{service}-mcp-server/
├── src/
│   ├── index.ts          # Server initialization & entry
│   ├── types.ts          # TypeScript type definitions
│   ├── tools/            # Tool implementations
│   │   ├── index.ts      # Tool exports
│   │   ├── messages.ts
│   │   └── channels.ts
│   ├── services/         # API clients
│   │   └── api.ts
│   ├── schemas/          # Zod validation schemas
│   │   └── inputs.ts
│   ├── utils/            # Shared utilities
│   │   ├── formatting.ts
│   │   └── errors.ts
│   └── constants.ts      # Shared constants
├── package.json
├── tsconfig.json
└── README.md
```

---

## Server Initialization

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "{service}-mcp-server",
  version: "1.0.0",
});

// Register tools
server.tool(
  "service_tool_name",
  "Tool description",
  { /* input schema */ },
  async (args) => { /* implementation */ }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## Tool Implementation

### Basic Tool Pattern

```typescript
import { z } from "zod";

// Input schema with Zod
const SendMessageSchema = z.object({
  channel_id: z
    .string()
    .regex(/^C[A-Z0-9]+$/)
    .describe("Channel ID (e.g., C01234567)"),
  text: z
    .string()
    .min(1)
    .max(40000)
    .describe("Message content"),
  thread_ts: z
    .string()
    .optional()
    .describe("Thread timestamp to reply to"),
}).strict(); // Forbid extra properties

type SendMessageInput = z.infer<typeof SendMessageSchema>;

server.tool(
  "slack_send_message",
  {
    title: "Send Slack Message",
    description: "Send a message to a Slack channel",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          pattern: "^C[A-Z0-9]+$",
          description: "Channel ID (e.g., C01234567)",
        },
        text: {
          type: "string",
          minLength: 1,
          maxLength: 40000,
          description: "Message content",
        },
        thread_ts: {
          type: "string",
          description: "Thread timestamp to reply to",
        },
      },
      required: ["channel_id", "text"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (args) => {
    const input = SendMessageSchema.parse(args);

    const result = await slackClient.chat.postMessage({
      channel: input.channel_id,
      text: input.text,
      thread_ts: input.thread_ts,
    });

    return {
      content: [
        {
          type: "text",
          text: `Message sent: ${result.ts}`,
        },
      ],
    };
  }
);
```

### List Tool with Pagination

```typescript
const ListChannelsSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe("Maximum channels to return"),
  cursor: z
    .string()
    .optional()
    .describe("Pagination cursor from previous response"),
  format: z
    .enum(["markdown", "json"])
    .default("markdown")
    .describe("Output format"),
}).strict();

server.tool(
  "slack_list_channels",
  {
    title: "List Slack Channels",
    description: "List Slack channels the bot can access",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        cursor: { type: "string" },
        format: { type: "string", enum: ["markdown", "json"], default: "markdown" },
      },
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (args) => {
    const input = ListChannelsSchema.parse(args);

    const result = await slackClient.conversations.list({
      limit: input.limit,
      cursor: input.cursor,
    });

    const channels = result.channels ?? [];
    const nextCursor = result.response_metadata?.next_cursor;

    let text: string;

    if (input.format === "json") {
      text = JSON.stringify({
        channels: channels.map((c) => ({
          id: c.id,
          name: c.name,
          topic: c.topic?.value ?? "",
        })),
        has_more: Boolean(nextCursor),
        next_cursor: nextCursor,
      }, null, 2);
    } else {
      const lines = ["# Slack Channels\n"];
      for (const ch of channels) {
        const topic = ch.topic?.value ?? "No topic";
        lines.push(`- **#${ch.name}** (\`${ch.id}\`): ${topic}`);
      }
      if (nextCursor) {
        lines.push(`\n*More channels available. Use cursor: \`${nextCursor}\`*`);
      }
      text = lines.join("\n");
    }

    return {
      content: [{ type: "text", text: truncateResponse(text) }],
    };
  }
);
```

---

## Error Handling

### Type-Safe Error Handler

```typescript
import axios from "axios";

interface ApiError {
  message: string;
  code?: string;
  retryAfter?: number;
}

function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) {
      return {
        message: "Rate limited",
        code: "RATE_LIMITED",
        retryAfter: parseInt(error.response.headers["retry-after"] ?? "60"),
      };
    }
    if (error.response?.status === 401) {
      return {
        message: "Authentication failed. Check API credentials.",
        code: "AUTH_ERROR",
      };
    }
    if (error.response?.status === 404) {
      return {
        message: "Resource not found. Verify the ID exists.",
        code: "NOT_FOUND",
      };
    }
    return {
      message: error.response?.data?.message ?? "API request failed",
      code: "API_ERROR",
    };
  }

  if (error instanceof z.ZodError) {
    return {
      message: `Invalid input: ${error.errors.map((e) => e.message).join(", ")}`,
      code: "VALIDATION_ERROR",
    };
  }

  return {
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
  };
}
```

### Tool Wrapper

```typescript
async function withErrorHandling<T>(
  fn: () => Promise<T>
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    const result = await fn();
    return {
      content: [{ type: "text", text: String(result) }],
    };
  } catch (error) {
    const apiError = handleApiError(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${apiError.message}${
            apiError.retryAfter ? ` Retry after ${apiError.retryAfter}s.` : ""
          }`,
        },
      ],
      isError: true,
    };
  }
}
```

---

## Utilities

### Character Limit

```typescript
// constants.ts
export const CHARACTER_LIMIT = 25000;

// utils/formatting.ts
export function truncateResponse(
  content: string,
  limit: number = CHARACTER_LIMIT
): string {
  if (content.length <= limit) {
    return content;
  }

  const truncated = content.slice(0, limit);
  return `${truncated}\n\n[Response truncated at ${limit.toLocaleString()} characters. Use filters to narrow results.]`;
}
```

### Dual Format Support

```typescript
export interface FormattedResponse<T> {
  items: T[];
  hasMore: boolean;
  nextCursor?: string;
}

export function formatItems<T extends { id: string; name: string }>(
  response: FormattedResponse<T>,
  format: "markdown" | "json"
): string {
  if (format === "json") {
    return JSON.stringify({
      items: response.items,
      has_more: response.hasMore,
      next_cursor: response.nextCursor,
    }, null, 2);
  }

  const lines = response.items.map(
    (item) => `- **${item.name}** (\`${item.id}\`)`
  );

  if (response.hasMore && response.nextCursor) {
    lines.push(`\n*More available. Use cursor: \`${response.nextCursor}\`*`);
  }

  return truncateResponse(lines.join("\n"));
}
```

---

## Configuration

### package.json

```json
{
  "name": "{service}-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "{service}-mcp-server": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "tsx": "^4.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

---

## Entry Point

```typescript
// src/index.ts
#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import tools
import { registerMessageTools } from "./tools/messages.js";
import { registerChannelTools } from "./tools/channels.js";

async function main() {
  const server = new McpServer({
    name: "{service}-mcp-server",
    version: "1.0.0",
  });

  // Register all tools
  registerMessageTools(server);
  registerChannelTools(server);

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("{service}-mcp-server running on stdio");
}

main().catch(console.error);
```

---

## Checklist Before Publishing

- [ ] All tools have title, description, and complete inputSchema
- [ ] All annotations specified (readOnlyHint, destructiveHint, etc.)
- [ ] Zod schemas use `.strict()` to forbid extra properties
- [ ] JSDoc comments added (NOT auto-extracted - must be explicit)
- [ ] Pagination implemented for list operations
- [ ] Character limits applied to responses
- [ ] Both markdown and JSON formats supported
- [ ] Proper type guards for error handling (axios.isAxiosError, etc.)
- [ ] No `any` types - full type coverage
- [ ] `npm run build` produces working `dist/index.js`
- [ ] README with installation and usage examples

<\!-- Built with LIO_OS by @liogpt — https://github.com/novusordos666/LIO_OS -->
