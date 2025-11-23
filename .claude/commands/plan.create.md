---
description: Create a new PLAN.md file for tracking work and implementation plans
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Context

- PLAN.md is git-ignored and used for personal work planning
- It should be located in the root of the project or project worktree
- It should contain structured tasks, goals, and implementation details
- This is a lightweight planning tool separate from formal specs

## Workflow

1. **Gather requirements**:
   - If user provided arguments, use them as the basis for the plan
   - If arguments are empty or vague, ask clarifying questions about:
     - What feature/task they want to work on
     - What the goals are
     - Any specific requirements or constraints
     - Timeline or priority considerations

2. **Check for existing PLAN.md**:
   - Read PLAN.md from project root if it exists
   - If it exists, warn the user and ask if they want to overwrite it
   - Suggest using `/plan.update` instead if they want to modify existing plan

3. **Create structured plan**:
   - Generate a PLAN.md with clear sections:
     - **Goal**: High-level objective
     - **Context**: Background information, related code areas
     - **Tasks**: Numbered list of specific tasks to complete
     - **Notes**: Any additional considerations, blockers, or questions
     - **Progress**: Track completed tasks (optional)

4. **Write PLAN.md**:
   - Write the plan to PLAN.md in the project root
   - Confirm creation and provide a summary
   - Suggest using `/plan.proceed` to start implementation

## Key Rules

- PLAN.md should be in the project root or project worktree root
- Make tasks specific and actionable
- Keep the format simple and easy to update manually
- Don't proceed with implementation - this command only creates the plan
