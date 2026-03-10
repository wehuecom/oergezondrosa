# MCP Server Evaluation Guide

Create evaluations that verify LLMs can effectively use your MCP server.

---

## Purpose

Evaluations test whether an LLM with no prior knowledge can use your MCP server to answer realistic questions. This validates:

- Tool descriptions are clear and complete
- Error messages guide correct usage
- Responses are useful and not overwhelming
- The server enables real workflows

---

## Evaluation Requirements

### Core Rules

1. **READ-ONLY**: All evaluation questions must use only read operations
2. **INDEPENDENT**: Each question stands alone - no sequential dependencies
3. **NON-DESTRUCTIVE**: Never create, update, or delete data
4. **STABLE ANSWERS**: Answers should not change frequently

### Question Characteristics

Create exactly **10 questions** that:

- Require **multiple tool calls** to answer (5-20+ calls)
- Test **realistic workflows**, not just API coverage
- Have **single, verifiable answers**
- Are answerable with **only the MCP tools provided**

---

## Answer Formats

Acceptable answer types:

| Type | Example |
|------|---------|
| User/Channel ID | `U01234567`, `C01234567` |
| Names | `#general`, `@john.doe` |
| Strings | `"Fix login bug"` |
| URLs | `https://github.com/org/repo/issues/123` |
| Numbers | `42`, `1234.56` |
| Timestamps | `2024-01-15T10:30:00Z` |
| Booleans | `true`, `false` |
| File names | `config.yaml`, `README.md` |

**Prefer human-readable formats** over opaque IDs when both are available.

---

## Example Evaluations

### Slack MCP Server

```xml
<evaluations>
  <evaluation>
    <question>Which user has sent the most messages in #engineering this month?</question>
    <answer>@sarah.chen</answer>
  </evaluation>

  <evaluation>
    <question>What is the most recent unresolved thread in #support that has more than 5 replies?</question>
    <answer>Thread about "API rate limiting" started by @mike.jones on 2024-01-10</answer>
  </evaluation>

  <evaluation>
    <question>Find the channel with the most members that was created in 2023 and has "team" in its name.</question>
    <answer>#platform-team (234 members)</answer>
  </evaluation>
</evaluations>
```

### GitHub MCP Server

```xml
<evaluations>
  <evaluation>
    <question>What is the oldest open issue in the repository that has the "bug" label and has received at least one comment in the last 30 days?</question>
    <answer>Issue #42: "Memory leak in connection pool"</answer>
  </evaluation>

  <evaluation>
    <question>Which contributor has the most merged pull requests this quarter that modified files in the /src/api directory?</question>
    <answer>@developer123 (47 merged PRs)</answer>
  </evaluation>

  <evaluation>
    <question>Find the pull request that added the most lines of code and was merged without any review comments.</question>
    <answer>PR #789: "Initial test suite setup" (+3,456 lines)</answer>
  </evaluation>
</evaluations>
```

---

## Creating Good Questions

### Workflow Categories

Design questions that test real workflows:

1. **Discovery**: "Find all X that match criteria Y"
2. **Investigation**: "What caused X to happen?"
3. **Comparison**: "Which X has the most/least Y?"
4. **Aggregation**: "How many X have property Y?"
5. **Correlation**: "What's the relationship between X and Y?"

### Complexity Guidelines

**Too Simple** (avoid):
```
What is the name of channel C01234567?
List all users in the workspace.
```

**Good Complexity**:
```
Find the user who has reacted to the most messages in #announcements
but has never posted a message there themselves.
```

**Too Complex** (avoid):
```
Analyze the entire organization's communication patterns over the last
year and identify the optimal channel structure.
```

---

## Evaluation Process

### Step 1: Documentation Review

Before writing questions:
1. List all available tools
2. Note which are read-only vs. write operations
3. Identify what data is accessible
4. Understand pagination and filtering options

### Step 2: Workflow Identification

Map real-world tasks users would perform:
- What questions would a manager ask?
- What would a developer need to find?
- What auditing tasks are common?

### Step 3: Question Drafting

For each workflow:
1. Write the question in natural language
2. Mentally trace the tool calls needed
3. Verify the answer is deterministic
4. Check it requires multiple tools

### Step 4: Answer Verification

For each question:
1. Actually answer it using the tools
2. Count the number of tool calls required
3. Verify the answer format is clear
4. Confirm the answer is stable over time

---

## XML Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<evaluations>
  <evaluation>
    <question>Natural language question here?</question>
    <answer>Specific, verifiable answer</answer>
  </evaluation>
  <!-- Repeat for all 10 questions -->
</evaluations>
```

---

## Running Evaluations

### Manual Testing

1. Start your MCP server
2. Connect Claude (or another LLM) to it
3. Ask each evaluation question
4. Compare responses to expected answers
5. Note any issues with tool descriptions or responses

### Metrics to Track

| Metric | Target |
|--------|--------|
| Accuracy | 80%+ correct answers |
| Tool calls per question | 5-20 (varies by complexity) |
| Error rate | <10% failed tool calls |
| Time to answer | Reasonable for complexity |

### Failure Analysis

When evaluations fail, identify the cause:

| Failure Type | Fix |
|--------------|-----|
| Wrong tool selected | Improve tool descriptions |
| Invalid parameters | Add parameter examples |
| Missing data in response | Include more fields |
| Context overflow | Reduce response size |
| Incorrect answer | Check tool logic |

---

## Iteration

After running evaluations:

1. **Fix failing tests first** - Improve descriptions, responses, errors
2. **Add edge cases** - Test boundary conditions
3. **Increase difficulty** - Add more complex questions as basics pass
4. **Maintain stability** - Update answers if underlying data changes

---

## Checklist

Before finalizing evaluations:

- [ ] Exactly 10 questions
- [ ] All questions are read-only
- [ ] Each question has a single, clear answer
- [ ] Answers are in human-readable format
- [ ] Questions test realistic workflows
- [ ] Each requires multiple tool calls
- [ ] Answers verified manually
- [ ] Questions are independent (no ordering)
- [ ] Answers are stable over time

<\!-- Built with LIO_OS by @liogpt — https://github.com/novusordos666/LIO_OS -->
