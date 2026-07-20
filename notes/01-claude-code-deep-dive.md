# Claude Code Deep Dive

## What Claude Code actually is
Claude Code is an agentic system, not just a terminal chat window. Behind the
scenes it runs a loop: read relevant files/output, reason about the next step,
call a tool (read/edit/bash/search), then check the result and decide whether
to continue or stop. Every action it takes is a discrete tool call, which is
why precise instructions produce more predictable behavior.

## Session commands worth memorizing
| Command | Purpose |
|---|---|
| `/compact` | Summarize the conversation to reclaim context space (do this around 50% usage, not at the last minute) |
| `/clear` | Wipe the conversation to start a fresh task |
| `/context` | Check how much of the context window is used |
| `/rewind` | Undo the last turn if Claude went in the wrong direction |
| `/model` | Swap models mid-session (e.g. a stronger model for design, a faster one for implementation) |

## Controlling reasoning depth
Extended thinking lets Claude reason before answering. You can nudge the
depth with plain language — phrases like "think hard about this" or
"ultrathink" ask for progressively more reasoning effort, while "quick
answer" asks for minimal deliberation. For anything non-trivial, it's worth
opening with "Create a plan for X, don't implement yet" so you can review the
approach before code gets written.

## The .claude/ project directory
- `settings.json` — permissions and model preferences
- `settings.local.json` — personal overrides, gitignored
- `commands/` — reusable slash-command prompt templates
- `hooks/` — deterministic scripts triggered on lifecycle events
- `skills/` — on-demand knowledge packs Claude can load when relevant

## Commands vs. agents vs. skills
- **Commands** are prompt templates you invoke manually (`/my-command`) for
  repeatable tasks.
- **Agents** are autonomous runners invoked through the API/SDK, useful for
  background jobs or CI.
- **Skills** are progressive-disclosure knowledge packs, either auto-loaded
  based on relevance or pulled in explicitly.

## Workflow patterns that work well
- **Interview-first**: ask Claude to interview you about requirements one
  question at a time before writing any code.
- **Phased, gated plans**: break big changes (e.g. an auth migration) into
  analysis -> design -> implementation -> testing, each phase requiring your
  explicit sign-off before moving on.
- **Cross-model review**: have one Claude instance implement and a second,
  separate instance review the result against the spec.
- **Checkpoint commits**: ask Claude to commit after each logical change so
  `/rewind` has clean points to fall back to.
- **Parallel agents via git worktrees + tmux**: run separate Claude sessions
  in separate worktrees/branches so multiple features progress without
  merge conflicts.
