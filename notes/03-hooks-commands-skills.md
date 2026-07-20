# Hooks, Commands & Custom Skills

## Hooks
Hooks are deterministic scripts tied to lifecycle events — they always run,
independent of Claude's judgment. Common event types: `preToolUse` (before a
tool runs — good for guardrails/logging), `postToolUse` (after a tool runs —
good for auto-formatting), `notification` (Claude wants to surface a
message), and `stop` (a turn completed). They're configured under `hooks` in
`.claude/settings.json` and typically call small shell scripts in
`.claude/hooks/`.

## Commands
Commands are markdown prompt templates stored in `.claude/commands/` and
invoked with `/command-name`. They can take positional arguments (`$1`,
`$2`, ...). Project-level commands live in `.claude/commands/` and are
committed to git for the whole team; personal ones live in
`~/.claude/commands/`.

## Skills
Skills are progressive-disclosure knowledge files in `.claude/skills/`.
Rather than stuffing everything into CLAUDE.md, a skill can be auto-loaded
when Claude judges it relevant (`autoload: true`) or loaded explicitly on
request. This keeps CLAUDE.md lean while still giving Claude access to deep,
domain-specific knowledge when it's actually needed.
