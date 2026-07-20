# Context Engineering Deep Dive

The context window functions like a programming interface — everything in
it shapes Claude's behavior. Context engineering is about deliberately
managing what occupies that window across an entire session, not just
crafting one good prompt.

Rough token budget inside Claude Code: a fixed system prompt (~5K tokens),
your CLAUDE.md files (~1-3K), then variable amounts for conversation history
and tool results (file contents, command output). Extended thinking uses a
separate budget and doesn't eat into this window.

Models tend to attend most strongly to the start and end of a long context
and less to the middle (the "lost in the middle" effect), so it helps to put
critical instructions in CLAUDE.md, compact proactively to keep a fresh
summary near the top, and point Claude at specific sections of large files
rather than dumping the whole thing in.

Practical habit: run `/context` periodically and compact around 50% usage
rather than waiting for auto-compact near 80%, optionally telling
`/compact` what to prioritize in the summary. Extended thinking ("think
hard", "ultrathink") is worth reaching for on genuinely complex, multi-step,
or correctness-critical tasks, not routine ones.
