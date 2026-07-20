# Project: <Platform name> (Monorepo)

## Structure
- `packages/api/` — backend (own CLAUDE.md)
- `packages/web/` — frontend (own CLAUDE.md)
- `packages/shared/` — shared types/utilities
- `infra/` — infrastructure as code

## Tooling
- Workspace-aware package manager + build orchestrator
- Versioning via changesets

## Cross-package rules
- Shared types live only in `packages/shared/`
- API changes require corresponding shared-type updates
- The web package never imports directly from the API package

## Git
- Conventional commits required; PRs must pass CI
- Include a changeset for any change affecting published packages
