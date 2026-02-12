# Contributing

Thanks for your interest in contributing to the Visa Tracking App!

## Prerequisites

- Node.js 18+
- A [Turso](https://turso.tech) database (free tier works)

## Local Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and add your Turso credentials
4. Initialize the database: `npm run seed`
5. Start the dev server: `npm run dev`

## Project Overview

This is a Next.js 16 app with a Turso (libSQL) backend. Key directories:

- `src/app/api/` — API routes (all database operations)
- `src/components/` — React components
- `src/lib/` — Shared utilities (validation, query building, types)
- `src/context/` — Global state management
- `src/hooks/` — Custom React hooks

## Making Changes

1. Create a feature branch from `master`
2. Make your changes
3. Ensure the build passes: `npm run build`
4. Submit a pull request with a clear description of what you changed and why

## Code Style

- TypeScript is required for all files
- Follow the existing patterns in the codebase
- Server-side validation is mandatory for all API inputs
- Use parameterized queries — never interpolate user input into SQL

## API Changes

If you modify or add API endpoints:

- Add input validation in `src/lib/validation.ts`
- Use the query builder in `src/lib/queryBuilder.ts` for filtered queries
- Keep rate limiting in mind (defined in `src/lib/rateLimit.ts`)

## Reporting Issues

Open an issue on GitHub with steps to reproduce the problem. Include the browser and any relevant console errors.
