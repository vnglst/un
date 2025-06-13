# Copilot Instructions for UN Speeches Browser

## Project Overview

This is a React Router v7 application for browsing UN General Assembly speeches with TypeScript, Tailwind CSS, and SQLite database.

## Quality Assurance

**ALWAYS run `npm run check` after making any code changes to verify everything is working correctly.**

The `npm run check` command runs:

- `npm run typecheck` - TypeScript type checking
- `npm run lint` - ESLint code linting
- `npm run format:check` - Prettier code formatting check
- `npm run knip` - Dead code elimination check

## Development Guidelines

1. After any code modifications, run `npm run check` to ensure:

   - No TypeScript errors
   - Code follows linting rules
   - Code is properly formatted
   - No unused/dead code exists

2. If `npm run check` fails:

   - Fix TypeScript errors first
   - Run `npm run lint:fix` to auto-fix linting issues
   - Run `npm run format` to auto-format code
   - Review and remove any dead code identified by knip

3. Only consider changes complete when `npm run check` passes without errors

4. **Always check online documentation** when working with key technologies to ensure you're using the most up-to-date APIs and best practices:

   - React Router v7: Check the official React Router documentation for the latest APIs
   - Tailwind CSS v4: Verify class names and utilities against the current Tailwind documentation
   - TypeScript: Reference the latest TypeScript documentation for type definitions and features
   - D3.js: Consult D3 documentation for correct API usage and examples
   - Better-sqlite3: Check the library documentation for proper database operations

5. **Coding Guidelines**
   - Follow the project's coding style (indentation, naming conventions, etc.)
   - Don't use comments to clarify code.
   - Don't use barrel files (index.ts) to re-export components or utilities
   - Don't use tsx, we're using Node > 23.6 which supports TypeScript natively

## Project Structure

- `app/` - Main application code (React Router v7)
- `app/routes/` - Route components
- `app/components/` - Reusable UI components
- `app/lib/` - Utility functions and database logic
- `build/` - Built application files
- `un_speeches.db` - SQLite database with UN speech data

## Key Technologies

- React Router v7
- TypeScript
- Tailwind CSS v4
- SQLite with better-sqlite3
- D3.js for data visualization
- Vite for build tooling
