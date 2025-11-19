# Agent Worktrees Convention

## Overview

This document describes the worktree management system used for concurrent development with AI agents. The system allows multiple branches to be worked on simultaneously without context switching or stashing, with each worktree having isolated dependencies and services.

## Architecture

### Components

1. **`bin/worktree`**: Python script that creates and manages git worktrees
2. **`bin/claude`**: Python script that wraps Claude Code CLI with worktree support

### Directory Structure

```
project-root/
├── bin/
│   ├── claude          # Claude Code wrapper with MCP and worktree support
│   └── worktree        # Worktree creation and management script
└── worktree/           # Directory containing all worktrees
    ├── main/           # Worktree for main branch
    ├── feat-example/   # Worktree for feat/example branch (sanitized)
    └── copilot-task/   # Worktree for copilot/task branch (sanitized)
```

## Branch Name Sanitization

### Problem

Git branch names can contain forward slashes (e.g., `feature/new-feature`, `copilot/task-name`), which would create nested subdirectories when used directly with `os.path.join()`.

### Solution

Both scripts implement a `sanitize_branch_name()` function that converts branch names to valid directory names:

```python
def sanitize_branch_name(branch_name):
    """Convert branch name to a valid directory name by replacing slashes with hyphens."""
    return branch_name.replace('/', '-')
```

### Examples

| Branch Name             | Directory Name                    |
| ----------------------- | --------------------------------- |
| `main`                  | `worktree/main/`                  |
| `feature/new-login`     | `worktree/feature-new-login/`     |
| `copilot/fix-bug`       | `worktree/copilot-fix-bug/`       |
| `hotfix/security-patch` | `worktree/hotfix-security-patch/` |

## Worktree Creation (`bin/worktree`)

### Usage

```bash
# Create a worktree
bin/worktree <branch-name>

# Remove a worktree
bin/worktree -r <branch-name>
bin/worktree --remove <branch-name>
```

### Workflow

1. **Branch Resolution**:
   - Check if branch exists locally (use it)
   - If not local, fetch from remote and track it
   - If branch doesn't exist anywhere, create a new branch

2. **Worktree Creation**:
   - Create git worktree at `./worktree/<sanitized-branch-name>/`
   - Sanitize branch name to avoid nested directories

3. **Environment Setup**:
   - Copy `.env` from project root
   - Randomize ports to prevent conflicts:
     - `WEB_PORT`: random port between 3000-9999
     - `DB_PORT`: random port between 8000-9999

4. **Dependency Installation**:
   - Run `npm install` in the worktree directory

5. **Service Initialization**:
   - Run `make up` to start Docker services
   - Monitor Docker services until web service is healthy
   - Wait up to 120 seconds for services to be ready

### Key Implementation Details

**Sanitized Path Usage** (Line 306):

```python
worktree_path = os.path.join(project_root, "worktree", sanitize_branch_name(branch_name))
```

**Branch Name Preservation**:

```python
# Use original branch name for git operations
run_git_command(["worktree", "add", worktree_path, branch_name])
```

## Claude Code Integration (`bin/claude`)

### Usage

```bash
# Run Claude Code in project root
bin/claude

# Run Claude Code in a specific worktree
bin/claude --worktree <branch-name>
```

### Functionality

1. **Worktree Support**:
   - Processes `--worktree <branch-name>` flag
   - Sanitizes branch name to construct correct path
   - **Automatically creates worktree if it doesn't exist** (invokes `bin/worktree` script)
   - Adds worktree directory with `--add-dir` flag

2. **MCP Configuration**:
   - Configures TypeScript LSP to use correct workspace path
   - Sets up Playwright MCP with browser automation
   - Configures Docker MCP for container management

3. **Environment Awareness**:
   - Parses `.env` from workspace directory
   - Includes service information in system prompt
   - Sets `CLAUDE_WORKSPACE_DIR` environment variable

### Auto-Creation Behavior

When you run `bin/claude --worktree <branch-name>`, the script automatically:

1. **Checks if worktree exists** at the sanitized path
2. **Creates the worktree if missing** by invoking `bin/worktree <branch-name>`
3. **Waits for creation to complete** (includes npm install and make up)
4. **Continues with Claude Code launch** using the fully initialized worktree

This means you can seamlessly run:

```bash
bin/claude --worktree feature/new-feature
```

Without needing to manually run `bin/worktree` first. The worktree is fully set up and ready when Claude Code starts.

### Key Implementation Details

**Sanitized Path Usage** (Line 122):

```python
worktree_path = os.path.join(project_root, "worktree", sanitize_branch_name(branch_name))
```

**Auto-Creation Logic** (Lines 125-143):

```python
if not os.path.exists(worktree_path):
    print(f"Creating worktree for branch '{branch_name}'...")
    worktree_script = os.path.join(project_root, "bin", "worktree")

    try:
        result = subprocess.run([worktree_script, branch_name], check=True)
        print(f"✓ Worktree created successfully")
    except subprocess.CalledProcessError as e:
        print(f"Error: Failed to create worktree: {e}", file=sys.stderr)
        sys.exit(1)
```

**Workspace Context**:

```python
if workspace_path != project_root:
    system_prompt_parts.append(
        f"You are handling work in worktree located at {workspace_path}, "
        f"only read or edit files in that directory, all commands should be run in that directory."
    )
```

## Best Practices

### When to Use Worktrees

1. **Concurrent Development**: Working on multiple features simultaneously
2. **Testing Branches**: Testing changes without affecting main development
3. **Code Review**: Reviewing PRs while keeping your main work intact
4. **Emergency Fixes**: Quickly switching to fix critical issues

### Naming Conventions

- Use descriptive branch names with prefixes: `feature/`, `fix/`, `hotfix/`, `copilot/`
- Branch names automatically convert to flat directories (slashes become hyphens)
- Keep branch names concise but descriptive

### Port Management

Each worktree gets randomized ports to prevent conflicts:

- Check the `.env` file in your worktree for assigned ports
- Use `docker compose ps` to verify services are running
- Access your worktree's web server at `localhost:<WEB_PORT>`

### Cleanup

Always remove worktrees when done:

```bash
bin/worktree -r <branch-name>
```

This will:

1. Stop all Docker services with `make down`
2. Remove the git worktree
3. Clean up the worktree directory

## Troubleshooting

### Nested Directories Created

**Problem**: Worktree created as `worktree/copilot/feature/` instead of `worktree/copilot-feature/`

**Cause**: Old version of scripts without `sanitize_branch_name()`

**Solution**:

1. Update both `bin/worktree` and `bin/claude` scripts
2. Ensure `sanitize_branch_name()` is used in all path constructions
3. Remove and recreate the worktree

### Services Not Starting

**Problem**: `make up` times out or services don't become healthy

**Troubleshooting**:

1. Check Docker is running: `docker ps`
2. Check port conflicts: `lsof -i :<port>`
3. Review Docker logs: `docker compose logs` (in worktree directory)
4. Verify `.env` has valid port assignments

### TypeScript LSP Not Working

**Problem**: TypeScript LSP features not working in worktree

**Solution**: Ensure using `bin/claude --worktree <branch-name>` which configures LSP with correct workspace path

## Implementation Checklist

When modifying worktree-related code, ensure:

- [ ] `sanitize_branch_name()` is used for all directory path constructions
- [ ] Original branch names are used for git operations
- [ ] Both `bin/worktree` and `bin/claude` are updated consistently
- [ ] Documentation is updated to reflect changes
- [ ] Port randomization logic is maintained
- [ ] Service health checks are working
- [ ] Error handling provides clear messages

## Related Files

- `bin/worktree`: Worktree creation and management script
- `bin/claude`: Claude Code wrapper with worktree support
- `.env`: Environment configuration template
- `Makefile`: Development commands (up, down, etc.)
- `docker-compose.yml`: Service definitions

## References

- [Git Worktree Documentation](https://git-scm.com/docs/git-worktree)
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)
- [MCP Servers](https://docs.claude.com/en/docs/claude-code/mcp)
