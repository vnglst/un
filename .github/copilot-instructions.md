# Copilot Instructions for UN Speeches Browser

## Project Overview

This is a React Router v7 application for browsing UN General Assembly speeches with TypeScript, Tailwind CSS, and SQLite database.

## Quality Assurance

Use the following commands to ensure code quality and consistency:

- `npm run typecheck` - TypeScript type checking
- `npm run lint` - ESLint code linting
- `npm run format:check` - Prettier code formatting check
- `npm run dev` - Start the development server

## Development Guidelines

1. **Always check online documentation** when working with key technologies to ensure you're using the most up-to-date APIs and best practices:

   - React Router v7: We're using RR7 in Framework mode: https://reactrouter.com/start/framework/installation
   - Tailwind CSS v4: We're using Tailwind CSS v4, which has some breaking changes from v3. Especially around theming: https://tailwindcss.com/docs/theme

2. **Coding Guidelines**

   - Follow the project's coding style (indentation, naming conventions, etc.)
   - Don't use comments to clarify code.
   - Don't use barrel files (index.ts) to re-export components or utilities
   - Don't use tsx, we're using Node > 23.6 which supports TypeScript natively

3. **Documentation**

   - Don't add documentation markdown files, unless specifically requested.
   - Don't add comments to the code, unless specifically requested.

## Key Technologies

- React Router v7
- TypeScript
- Tailwind CSS v4
- SQLite with better-sqlite3
- D3.js for data visualization
