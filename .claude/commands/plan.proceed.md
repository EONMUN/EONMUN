---
description: Proceed with implementing work defined in PLAN.md
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Context

- PLAN.md is git-ignored and used for personal work planning
- It should be located in the root of the project or project worktree
- This command executes the tasks defined in the plan

## Workflow

1. **Read and parse PLAN.md**:
   - Read PLAN.md from project root
   - If it doesn't exist, suggest using `/plan.create` first
   - Identify tasks, goals, and context
   - Determine which tasks are pending vs completed

2. **Determine work scope**:
   - If user provided specific instructions (e.g., "task 3" or "next task"), focus on that
   - If arguments are empty, start with the first pending task
   - If all tasks are complete, inform user and ask for next steps

3. **Create todo list**:
   - Use TodoWrite to create a todo list from PLAN.md tasks
   - Mark current task as in_progress
   - Keep other tasks as pending

4. **Execute implementation**:
   - Work through tasks systematically
   - Follow project guidelines from CLAUDE.md
   - Update todo list as you progress
   - When tasks involve multiple steps, break them down further

5. **Update PLAN.md progress**:
   - After completing tasks, update PLAN.md to reflect progress
   - Mark completed tasks
   - Add any new notes or blockers discovered during implementation
   - Suggest next steps if more work remains

## Key Rules

- PLAN.md should be in the project root or project worktree root
- Use TodoWrite to track implementation progress
- Follow all project conventions and guidelines
- Update PLAN.md to reflect actual progress
- Don't assume tasks are complete until verified (tests pass, code works, etc.)
