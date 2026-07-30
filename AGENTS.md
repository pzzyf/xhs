# Codex Project Guide

## Project Shape

- This repo is a Bun workspace managed by Turbo.
- `apps/native` is the Expo React Native client, using Expo Router.
- `apps/server` is the Hono server.
- `packages/config` contains shared TypeScript configuration.
- Root formatting and linting are handled by Biome.

## Core Commands

- Install dependencies with `bun install`.
- Run both apps in development with `bun run dev`.
- Run only the native app with `bun run dev:native`.
- Run only the server with `bun run dev:server`.
- Run type checks with `bun run check-types`.
- Run Biome formatting/lint fixes with `bun run check`.
- Build all packages with `bun run build`.

## General Rules

- Prefer existing project patterns and directory boundaries before adding new abstractions.
- Keep changes scoped to the requested feature or fix.
- Do not revert or overwrite unrelated worktree changes.
- Use Bun workspace commands from the repo root unless a package script must be run inside a specific app.
- Keep TypeScript strictness intact; do not relax shared compiler settings to make a change pass.
- Follow Biome formatting: tabs for indentation and double quotes in JavaScript/TypeScript.
- Put shared configuration in `packages/config` only when it is genuinely reused across packages.
- For commits materially assisted by Codex, append `Co-authored-by: Codex <codex@openai.com>` to the commit message.

## Native App Rules

- Treat `apps/native/src/app` as the Expo Router entry surface.
- Keep app-wide providers close to the root layout.
- Use TanStack Query for client data fetching.
- Keep query keys and query functions feature-local when they belong to one feature.
- For mobile data fetching, account for iOS, Android emulator/device, and React Native Web differences.
- Prefer `EXPO_PUBLIC_` environment variables for client-visible runtime configuration.
- When adding native dependencies, run `bunx expo install --check` when available.

## Server Rules

- Treat `apps/server/src/app.ts` as the Hono app definition.
- Keep local development server behavior in `apps/server/src/dev.ts`.
- Add routes and middleware in small, testable units as the server grows.
- Preserve Lambda handler compatibility in `apps/server/src/index.ts` unless the deployment target changes.
- Use the server package scripts for server-only checks or builds when root Turbo commands are too broad.

## Validation

- After TypeScript or dependency changes, run `bun run check-types`.
- After formatting-sensitive changes, run `bun run check` or a scoped Biome command if the worktree has unrelated changes.
- For native dependency changes, also run `bunx expo install --check` from `apps/native`.
- If a command cannot run because a dev server or port is already active, report the exact command and reason.

## Skills

- Repo-local skills live in `.agents/skills`.
- Use `$native-data-fetch` for Expo/React Native TanStack Query work, mobile API helpers, query hooks, and related data-fetching migrations.
- Add new skills only for repeatable workflows that should outlive one task.

## Nested AGENTS.md Recommendation

- Keep only this root `AGENTS.md` for now; the project is still small enough that one file is easier to maintain.
- Add `apps/native/AGENTS.md` if native-specific rules grow beyond data fetching, such as UI design rules, navigation conventions, release steps, or device QA.
- Add `apps/server/AGENTS.md` if server-specific rules grow around API versioning, middleware, validation schemas, deployment, or infrastructure.
- When adding nested files, keep root rules general and move only directory-specific rules into the closest applicable `AGENTS.md`.
