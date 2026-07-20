# Project: <API name>

## Architecture
- Express + TypeScript (or your framework), compiled with your bundler
- Database access layer isolated in `src/repositories/`
- Caching/queues isolated in their own module

## Conventions
- One route file per resource under `src/routes/`
- Business logic lives in `src/services/`, never in route handlers
- Shared types in `src/types/` — no `any`

## Commands
- `npm run dev` — start dev server with hot reload
- `npm test` — run the test suite
- `npm run db:migrate` — apply pending migrations

## Testing
- Fixtures under `tests/fixtures/`
- Integration tests hit a dedicated test database
- Mock external services — no real network calls in tests

## Git
- Conventional commit prefixes: feat:, fix:, docs:, chore:, test:
- Squash-merge to main; never push directly to main
