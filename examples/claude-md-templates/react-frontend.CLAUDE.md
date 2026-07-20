# Project: <Frontend name>

## Stack
- Next.js (App Router) + TypeScript
- Tailwind + component library of choice
- Server state via a query library, client state via a lightweight store

## Structure
- `app/` — routes and layouts
- `components/ui/` — low-level primitives (do not modify)
- `components/` — composite, feature-level components
- `lib/` — utilities and API client
- `hooks/` — custom hooks

## Conventions
- Server components by default; `"use client"` only when interactivity is needed
- No prop drilling past two levels — reach for shared state instead
- Every component has a typed props interface

## Commands
- `npm run dev` — dev server
- `npm run build` — production build (must pass before merge)
- `npm run lint` — lint + format check
- `npm run test` / `npm run e2e` — unit and end-to-end tests
