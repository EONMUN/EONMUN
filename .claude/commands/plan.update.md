---
description: Update an existing PLAN.md file with new information, tasks, or progress
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Context

- PLAN.md is git-ignored and used for personal work planning
- It should be located in the root of the project or project worktree
- This command updates an existing plan with new information

## Workflow

1. **Read existing PLAN.md**:
   - Read PLAN.md from project root
   - If it doesn't exist, suggest using `/plan.create` instead
   - Parse the current structure and content

2. **Determine update type**:
   - If user provided specific instructions, apply those changes
   - If arguments are empty or vague, ask what they want to update:
     - Add new tasks
     - Mark tasks as complete
     - Update context or goals
     - Add notes or blockers
     - Reorganize or refine existing content

3. **Apply updates**:
   - Preserve existing structure and completed work
   - Add, modify, or remove content as requested
   - Maintain readability and organization
   - Keep the format consistent with the original

4. **Save changes**:
   - Write updated content to PLAN.md
   - Summarize what was changed
   - Suggest using `/plan.proceed` if ready to continue implementation

## Key Rules

- PLAN.md should be in the project root or project worktree root
- Preserve completed work and progress tracking
- Maintain the existing structure unless specifically asked to reorganize
- Keep updates focused and clear
