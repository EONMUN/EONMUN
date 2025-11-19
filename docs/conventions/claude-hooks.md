# Claude Code Hooks Pattern

This document describes the hook system for Claude Code, which allows automatic execution of scripts in response to tool calls and events.

## Overview

Hooks are executable scripts that run in response to Claude Code events like tool calls or conversation lifecycle events. They enable automated workflows such as code formatting, linting, type checking, and validation.

## Hook Location and Configuration

- **Location**: `.claude/hooks/`
- **File naming**: Any executable file in this directory becomes a hook
- **Permissions**: Must be executable (`chmod +x`)
- **Languages**: Any language works, but **Python is recommended** for zero-dependency, cross-platform compatibility that's more robust than raw shell scripts

## Hook Event Types

Hooks are configured in `.claude/hooks.json` to specify which events trigger them. Common event types include:

### Tool-Based Events

Hooks that trigger based on tool usage:

- `Write`: After a file is written
- `Edit`: After a file is edited
- `MultiEdit`: After multiple files are edited
- `Bash`: After bash commands execute
- `NotebookEdit`: After Jupyter notebook cells are edited

### Lifecycle Events

Hooks that trigger based on conversation lifecycle:

- `Stop`: When the user stops the agent (conversation paused)
- `UserPromptSubmit`: When user submits a prompt
- `AssistantResponse`: After assistant responds

## Hook Input and Output

### Input Format

Hooks receive JSON on stdin containing event context:

```json
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "content": "..."
  },
  "event_type": "tool_call"
}
```

Access the data in Python:

```python
import json
import sys

input_data = json.load(sys.stdin)
file_path = input_data.get('tool_input', {}).get('file_path', '')
```

### Exit Codes

Hook exit codes determine how Claude Code responds:

- **Exit 0**: Success, continue normally (no output shown to agent)
- **Exit 1**: Silent failure (hook failed but don't show to agent)
- **Exit 2**: **Visible failure - agent sees the output** (stderr content shown in conversation)

**IMPORTANT**: Only exit code 2 makes hook output visible to the agent. Use this for validation failures, type errors, or other issues the agent should address.

### Output Handling

- **stdout**: Logged but not shown to agent (unless exit code 2)
- **stderr**: Shown to agent only when exit code is 2
- Keep output concise and actionable for the agent

## Worktree-Aware Hooks

When working with Git worktrees, hooks must execute in the correct workspace context to avoid showing irrelevant errors from other branches.

### The Problem

When Claude Code runs with `bin/claude --worktree branch-name`:

- The agent works in `/path/to/repo/worktree/branch-name`
- Hooks run in the root directory by default
- Commands like `git diff`, `npx tsc`, `prettier` operate on root repo
- Agent sees errors from root repo, which are confusing and incorrect

### The Solution

Hooks should check for workspace context and change directory before running commands:

```python
import os

def get_workspace_dir():
    """Get the workspace directory, handling worktree context."""
    # Check if running in worktree context
    workspace = os.environ.get('CLAUDE_WORKSPACE_DIR')
    if workspace:
        return workspace
    # Default to current directory
    return os.getcwd()

def main():
    workspace = get_workspace_dir()

    # Change to workspace directory
    os.chdir(workspace)

    # Now run commands - they'll execute in correct context
    subprocess.run(['npx', 'tsc', '--noEmit'])
```

### Environment Variables

The `bin/claude` wrapper sets `CLAUDE_WORKSPACE_DIR` when using worktrees:

- Root repo: Not set (or set to repo root)
- Worktree: Set to `/path/to/repo/worktree/branch-name`

Always check this variable before running file operations, git commands, or build tools.

## Best Practices

### Only Check Files That Changed

**IMPORTANT**: Hooks should only process files that were actually modified, not the entire codebase. This improves performance and reduces false positives.

For tool-based hooks (Write/Edit):

```python
# Get the specific file that was modified
file_path = input_data.get('tool_input', {}).get('file_path', '')

# Only process this file
if file_path and file_path.endswith(('.ts', '.tsx')):
    subprocess.run(['npx', 'eslint', '--fix', file_path])
```

For lifecycle hooks (Stop):

```python
# Check git for modified files
result = subprocess.run(
    ['git', 'diff', '--name-only', 'HEAD'],
    capture_output=True,
    text=True
)

# Only process changed files
modified_files = result.stdout.strip().split('\n')
ts_files = [f for f in modified_files if f.endswith(('.ts', '.tsx'))]

if ts_files:
    # Run type check only if TS files changed
    subprocess.run(['npx', 'tsc', '--noEmit'])
```

### Exit Code Strategy

- **Exit 0**: Use for successful automation (formatting, auto-fixes)
- **Exit 1**: Use for non-critical failures you don't want agent to see
- **Exit 2**: Use ONLY when agent needs to take action (type errors, validation failures)

### Performance

- Add timeouts to subprocess calls (30-60s max)
- Skip unnecessary work (check file patterns, git status)
- Exit early when hook doesn't apply
- Only check changed files, not entire codebase

### Worktree Compatibility

Always include workspace awareness:

```python
def get_workspace_dir():
    workspace = os.environ.get('CLAUDE_WORKSPACE_DIR')
    return workspace if workspace else os.getcwd()

# In main():
os.chdir(get_workspace_dir())
```

### Error Handling

- Catch exceptions and decide: exit 0 (ignore), exit 1 (log), or exit 2 (show agent)
- Provide clear, actionable error messages
- Include file paths and line numbers when relevant

### File Filtering

Process only relevant files:

```python
# Check file extensions
if not file_path.endswith(('.ts', '.tsx')):
    sys.exit(0)

# Check file exists
if not os.path.exists(file_path):
    sys.exit(0)

# Check if in node_modules, build directories, etc.
if 'node_modules' in file_path or 'dist' in file_path:
    sys.exit(0)
```

## Example Hooks

### Example 1: Format and Lint on Write/Edit

Runs Prettier and ESLint after file modifications. **Only processes the specific file that was modified.**

**When it runs**: After `Write` or `Edit` tool calls

**File**: `.claude/hooks/format-and-lint.py`

```python
#!/usr/bin/env python3
"""
Format and lint code files after Write/Edit operations.
Runs prettier first, then eslint on relevant files.

Only processes the specific file that was modified - not the entire codebase.
"""
import json
import sys
import os
import subprocess

# File patterns that should be formatted
FORMAT_PATTERNS = ('.ts', '.tsx', '.js', '.jsx', '.md', '.json')
LINT_PATTERNS = ('.ts', '.tsx', '.js', '.jsx')

def get_workspace_dir():
    """Get workspace directory, handling worktree context."""
    workspace = os.environ.get('CLAUDE_WORKSPACE_DIR')
    return workspace if workspace else os.getcwd()

def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)
        file_path = input_data.get('tool_input', {}).get('file_path', '')

        if not file_path:
            sys.exit(0)

        # Change to workspace directory
        workspace = get_workspace_dir()
        os.chdir(workspace)

        # Check if file exists
        if not os.path.exists(file_path):
            sys.exit(0)

        # Check if file matches our patterns
        should_format = file_path.endswith(FORMAT_PATTERNS)
        should_lint = file_path.endswith(LINT_PATTERNS)

        if not should_format:
            sys.exit(0)

        # Run prettier on ONLY the modified file
        try:
            result = subprocess.run(
                ['npx', 'prettier', '--write', file_path],
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode == 0:
                print(f"✓ Formatted {file_path}")
            else:
                print(f"⚠ Prettier warning for {file_path}: {result.stderr}", file=sys.stderr)
        except Exception as e:
            print(f"⚠ Prettier error for {file_path}: {e}", file=sys.stderr)

        # Run eslint on ONLY the modified file
        if should_lint:
            try:
                result = subprocess.run(
                    ['npx', 'eslint', '--fix', file_path],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                if result.returncode == 0:
                    print(f"✓ Linted {file_path}")
                else:
                    # ESLint warnings shown but not blocking
                    if result.stdout:
                        print(f"ESLint output for {file_path}:\n{result.stdout}")
            except Exception as e:
                print(f"⚠ ESLint error for {file_path}: {e}", file=sys.stderr)

        # Exit 0: Success, don't show output to agent
        sys.exit(0)

    except Exception as e:
        # Exit 2: Show error to agent
        print(f"Error in format-and-lint hook: {e}", file=sys.stderr)
        sys.exit(2)

if __name__ == '__main__':
    main()
```

**Configuration** (`.claude/hooks.json`):

```json
{
  "Write": ".claude/hooks/format-and-lint.py",
  "Edit": ".claude/hooks/format-and-lint.py"
}
```

### Example 2: Type Check on Stop

Runs TypeScript type checking when the agent stops. **Only runs if TypeScript files were actually modified.**

**When it runs**: On `Stop` event (when user pauses the agent)

**File**: `.claude/hooks/typecheck-on-stop.py`

```python
#!/usr/bin/env python3
"""
Run TypeScript type checking on Stop event, but only if .ts/.tsx files were modified.
Uses git to detect changed files.

Only runs type check if TS files actually changed - not on every stop.
"""
import sys
import os
import subprocess

def get_workspace_dir():
    """Get workspace directory, handling worktree context."""
    workspace = os.environ.get('CLAUDE_WORKSPACE_DIR')
    return workspace if workspace else os.getcwd()

def main():
    try:
        # Change to workspace directory
        workspace = get_workspace_dir()
        os.chdir(workspace)

        # Get list of modified files using git
        result = subprocess.run(
            ['git', 'diff', '--name-only', 'HEAD'],
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode != 0:
            # If git command fails, skip type checking
            print("⚠ Could not check git status, skipping type check", file=sys.stderr)
            sys.exit(0)

        # Check if any TypeScript files were modified
        modified_files = result.stdout.strip().split('\n')
        has_ts_files = any(
            f.endswith(('.ts', '.tsx'))
            for f in modified_files
            if f  # Skip empty strings
        )

        if not has_ts_files:
            # No TypeScript files modified, skip type checking
            sys.exit(0)

        # Run TypeScript type checking
        print("TypeScript files modified, running type check...")
        result = subprocess.run(
            ['npx', 'tsc', '--noEmit'],
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.returncode == 0:
            print("✓ Type check passed")
            sys.exit(0)  # Exit 0: Success, don't show to agent
        else:
            # Exit 2: Type errors found - show to agent so they can fix them
            print("Type check failed:", file=sys.stderr)
            print(result.stdout, file=sys.stderr)
            if result.stderr:
                print(result.stderr, file=sys.stderr)
            sys.exit(2)

    except subprocess.TimeoutExpired:
        print("⚠ Type check timed out", file=sys.stderr)
        sys.exit(2)  # Exit 2: Show timeout to agent
    except Exception as e:
        print(f"Error in typecheck-on-stop hook: {e}", file=sys.stderr)
        sys.exit(2)  # Exit 2: Show error to agent

if __name__ == '__main__':
    main()
```

**Configuration** (`.claude/hooks.json`):

```json
{
  "Stop": ".claude/hooks/typecheck-on-stop.py"
}
```

## Debugging Hooks

To test hooks manually:

```bash
# Create test input
echo '{"tool_name": "Write", "tool_input": {"file_path": "src/test.ts"}}' | \
  .claude/hooks/format-and-lint.py

# Check exit code
echo $?

# With worktree context
CLAUDE_WORKSPACE_DIR=/path/to/worktree/branch \
  echo '{"tool_name": "Write", "tool_input": {"file_path": "src/test.ts"}}' | \
  .claude/hooks/format-and-lint.py
```

## Common Use Cases

- **Code formatting**: Prettier, Black, rustfmt on Write/Edit (only changed files)
- **Linting**: ESLint, Pylint, Clippy on Write/Edit (only changed files)
- **Type checking**: TypeScript, mypy on Stop (only if relevant files changed)
- **Testing**: Run relevant tests on Write/Edit (only tests for changed files)
- **Validation**: Schema validation, API contract checking on Write
- **Security**: Dependency scanning, secret detection on Write
- **Documentation**: Auto-generate docs on Write

## Limitations

- Hooks run synchronously and block the conversation
- Timeouts should be aggressive (30-60s max)
- No interactive input (hooks must be fully automated)
- Hooks see tool input but not full conversation context
