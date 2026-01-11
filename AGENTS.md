# AI Agent Guidelines and Project Structure

## Overview

This document provides guidelines for AI agents working on this project. It covers project organization, communication standards, workflow patterns, and agentic behavior rules derived from successful AI-assisted development patterns.

> **Note on Time Estimates:** All effort estimates refer to **agentic (AI-assisted) development time** plus separate **human review time**.

## Agent Guardrails

### Code Modification Boundaries

**CRITICAL**: Follow these rules for code modifications:

- **Do not modify code unless explicitly directed by the user**
- Always request permission before making changes to existing code
- Prefer reading, analyzing, and understanding code over modifying it
- When modifications are requested, implement them precisely as specified
- Focus on factual observations rather than prescriptive changes
- **Never add process attribution comments** to code (no references to AI, agents, users, reviews, or planning documents)

### Implementation Workflow Boundaries

- **For complex implementations**: Complete only ONE numbered task at a time
- Stop and ask user permission before proceeding to the next item
- NEVER implement multiple recommendations in a single iteration
- Provide brief summary of completed work before asking to continue
- Break complex tasks into manageable, specific steps

### File and Directory Restrictions

- Do not modify core configuration files without explicit user direction
- Avoid changes to build scripts unless specifically requested
- Be cautious with database migration files and schema changes
- Request approval before modifying CI/CD configuration or Docker files

### Gitignored Folders

**NEVER commit files in `.ai/` folder - it is gitignored!**

- `.ai/planning/*` - Local planning documents only
- `.ai/prompts/*` - Workflow templates
- `.ai/history/*` - Session history

**What TO commit:** Source code, tests, ADRs in `docs/decisions/`, non-gitignored documentation.

**NEVER reference `.ai/` paths in committed files:**
- ❌ Do NOT reference `.ai/planning/*` in ADRs, source code, or any committed documentation
- ❌ Do NOT include paths like `.ai/planning/YYYY-MM-DD-work-package-name/` in commit messages or ADRs
- ✅ DO reference only committed files (e.g., ADRs, source code) in committed documentation
- **Rationale:** `.ai/` folder is gitignored and local-only; references break for other developers

## Communication Standards

### Tone and Language

- Use measured, technical language appropriate for senior software engineering
- Avoid hyperbolic statements and superlatives ("amazing", "terrible", "perfect", "excellent")
- Use precise, descriptive language:
  - ✓ "well-structured" instead of "excellent"
  - ✓ "needs improvement" instead of "poor"
  - ✓ "follows established patterns" instead of "perfect"
- Provide respectful, constructive feedback focused on code quality, not authorship
- Focus on technical merit rather than emotional assessments

### Documentation Standards

- **AVOID process attribution references**: Do not include citations referencing how code was generated or reviewed:
  - ❌ User request references: "(per user request)", "(user asked for this)", "(requested by team)"
  - ✓ Direct statements: "Uses X pattern for Y reason" or "Implements Z to handle edge case"
- Present design decisions and implementation choices directly without referencing their origin
- Comments should explain **what** code does and **why** it exists
- Focus on self-documenting code and maintainability
- Keep comment density reasonable (aim for <15% of lines), focused on complex logic
- Explain **why** decisions were made, not **what** the code does (code should be self-explanatory)

**Rationale**: Code comments should document the system as it exists, not the process that created it. Future maintainers need to understand the code's purpose and behavior, not its provenance.

## Context Management Strategy

### Optimal Context Provision

**Direct Context (Preferred for Most Cases)**:
- Use `@filename` or `@filepath` to add specific files to context
- Open relevant files in tabs - agents can see "open and recently viewed files"
- Most explicit and immediate - clear signal of what's important
- Better for focused, specific tasks

**File Lists (Useful for Specific Scenarios)**:
- Document project areas and recurring context patterns
- "Context recipes" for different task types
- Large-scale refactoring requiring many files
- Onboarding documentation for complex features

**Hybrid Approach (Often Best)**:
1. Add a context document explaining the task and scope
2. @ mention 2-4 key files that are most relevant
3. Let the agent search for the rest using semantic search

### Context File Best Practices

- Organize by priority/relevance (most frequently changed files first)
- Include design pattern reference implementations
- Add integration points and dependencies
- Maintain accuracy - update paths when structure changes
- Use clear section headers for different layers/components

## Task Management

### Todo System Usage

Use the todo system for complex tasks:

**When to Create Todos**:
- Complex multi-step tasks (3+ distinct steps)
- Non-trivial tasks requiring careful planning
- Multiple tasks provided as numbered/comma-separated list
- After receiving new instructions (capture requirements)

**When NOT to Create Todos**:
- Single, straightforward tasks
- Trivial tasks with no organizational benefit
- Tasks completable in < 3 trivial steps
- Purely conversational/informational requests

**Todo Management Rules**:
- Only ONE task marked `in_progress` at a time
- Mark complete IMMEDIATELY after finishing
- Complete current tasks before starting new ones
- Update status in real-time
- Create specific, actionable items with clear completion criteria

**Never include operational tasks in todos**: Linting, testing, or code examination are operational activities done in service of higher-level tasks, not tasks themselves.

## Workflow Patterns

### Iterative Implementation

1. **Understand requirements** - Read context and requirements thoroughly
2. **Plan approach** - Create todos for complex tasks
3. **Implement incrementally** - One task at a time with validation
4. **Validate continuously** - Run tests and checks after each change
5. **Document decisions** - Update relevant documentation
6. **Request approval** - Get user approval before proceeding to next task

### Information Gathering

**Before Making Changes**:
- Use codebase search to understand existing patterns
- Read related files to understand context
- Search for similar implementations as reference
- Identify integration points and dependencies

**During Implementation**:
- Validate assumptions by checking actual code
- Cross-reference with related modules
- Check test coverage for patterns
- Verify naming conventions in similar code

## Error Recovery and Edge Cases

### When Things Go Wrong

- Acknowledge errors clearly and directly
- Analyze the root cause before proposing fixes
- Don't make the same mistake multiple times
- Learn from correction patterns in project history
- Ask clarifying questions when uncertain

### Handling Ambiguity

- When requirements are unclear, ask specific questions
- Propose concrete options with tradeoffs
- Reference similar patterns in codebase for context
- Don't guess at critical implementation details

## Project-Specific Extensions

### Custom Tooling

Document any project-specific tools or scripts:
- Build automation scripts
- Development environment setup
- Testing utilities
- Code generation tools

### Integration Points

Document key integration points:
- External service APIs
- Database schemas
- Message formats
- Configuration files

### GitHub CLI Usage

When using the GitHub CLI (`gh`), prefer the REST API for mutating operations to avoid GraphQL-related errors:

**Updating PR descriptions:**
```bash
# ❌ AVOID: gh pr edit can fail due to Projects Classic deprecation
gh pr edit 378 --body "..."
# Error: GraphQL: Projects (classic) is being deprecated...

# ✅ USE: Direct API call works reliably
gh api repos/{owner}/{repo}/pulls/{number} -X PATCH -f body="$(cat body.md)"
```

**Common patterns:**
```bash
# Update PR body from file
gh api repos/owner/repo/pulls/123 -X PATCH -f body="$(cat /tmp/pr-body.md)"

# Update PR title
gh api repos/owner/repo/pulls/123 -X PATCH -f title="New title"

# Add labels
gh api repos/owner/repo/issues/123/labels -X POST -f labels='["bug","priority"]'
```

**Read operations** (viewing PRs, listing issues) work fine with standard `gh` commands:
```bash
gh pr view 378 --json title,body,state
gh pr list --state open
gh issue list
```

## Version Control Practices

### Commit Standards

- **Follow the [Conventional Commits](https://www.conventionalcommits.org) specification** for all commit messages
- Format: `<type>[optional scope]: <description>`
- Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`
- Use `!` after type/scope to indicate breaking changes (e.g., `feat!:` or `feat(api)!:`)
- Include body and footer sections for additional context when needed
- Reference issue numbers when applicable (e.g., `Fixes #123`)
- Break changes into logical, atomic commits

### Branch Management

- Understand project branching strategy
- Follow naming conventions for feature branches
- Keep branches focused on specific features/fixes
- Regularly sync with main branch

### Pre-Commit Verification

**Before EVERY `git add` or `git commit`, verify:**

- [ ] **NO files from `.ai/` are staged** - This folder is gitignored and local-only
- [ ] User explicitly requested the commit

The `.ai/` folder contains local planning documents, prompts, and session history that must NEVER be committed to the repository.

### Destructive Operations

- **NEVER** run destructive/irreversible operations without explicit request:
  - Force push to protected branches
  - Hard resets that lose history
  - Mass deletions without confirmation
- **NEVER** skip hooks (--no-verify, --no-gpg-sign) unless explicitly requested
- **NEVER** commit changes unless user explicitly asks

## Further Reading

### Project Documentation

- Architecture documentation
- Developer guides
- API documentation
- Setup and installation guides

### External Resources

- Framework documentation
- Language best practices
- Design patterns
- Testing methodologies

---

## Summary

This document provides comprehensive guidelines for AI-assisted development. The core principles are:

1. **Respect code ownership** - Don't modify without permission
2. **Communicate clearly** - Use professional, technical language
3. **Work incrementally** - One task at a time with validation
4. **Maintain quality** - Follow established patterns and gates
5. **Document decisions** - Keep documentation current and clear
6. **Organize artifacts** - Use consistent folder and naming structure
7. **Prevent issues** - Apply review criteria as design constraints
8. **Stay focused** - Complete current work before starting new tasks
9. **No process attribution** - Never reference AI, user requests, reviews, or planning documents in code comments

Following these guidelines ensures productive, high-quality AI-assisted development that aligns with project standards and team expectations.

