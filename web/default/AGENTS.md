# Web Frontend Conventions

## Stack

React 19, TypeScript, Rsbuild, Tailwind CSS, TanStack Router/Query/Table, i18next, Zustand, React Hook Form + Zod.

## Rules

- Use i18n via `useTranslation()` for all user-facing strings
- TypeScript strict mode — no `any`, prefer `unknown`
- Keep components under 200 lines
- Use React Query for all API calls
- Forms: React Hook Form + Zod schemas
- Tailwind: use `cn()` helper, responsive via `sm: md: lg:`
- Feature folder structure: `src/features/<name>/components/`, `hooks/`, `api.ts`, `types.ts`
- Run `bun run typecheck && bun run lint` before commits
