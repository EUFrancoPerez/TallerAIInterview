# CLAUDE.md Best Practices

CLAUDE.md is the file Claude Code loads automatically on startup, and it's
the single highest-leverage way to steer its behavior in a project.

## Guiding principles
- Keep it short — under ~200 lines, sometimes as few as 60. Every line
  should be pulling its weight.
- Document what's unusual about *your* codebase, not general language/
  framework knowledge Claude already has.
- Prefer concrete, checkable rules ("prefix commits with feat:/fix:/docs:/
  chore:") over vague guidance ("write good commits").
- In a monorepo, CLAUDE.md files load hierarchically from the home
  directory down to the current folder, with more specific files able to
  extend or override broader ones (global -> org -> project -> package).

## Context engineering vs. prompt engineering
Prompt engineering optimizes a single message. Context engineering designs
the *entire* information environment for a session: the system prompt
(fixed), CLAUDE.md (fully under your control), conversation history
(managed via `/compact` and `/clear`), tool results (shaped by how
well-organized your project is), and any memory files. CLAUDE.md matters
most because it's the one part of the context window you control before
the conversation even starts.

## Memory files
For information that changes over time (current status, decisions made),
keep a separate file such as `.claude/memory.md` and reference it from
CLAUDE.md rather than editing CLAUDE.md itself every time something changes.

See `examples/claude-md-templates/` for starting points for a backend API,
a React frontend, a Python ML project, and a monorepo root.
