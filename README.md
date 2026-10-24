# ORIGANO

**The event ends. Your next chapter begins.**

ORIGANO is an open-source, browser-based workspace for turning event reflections and feedback into practical next steps. Capture what you learned, organize judge or mentor feedback, decide which suggested actions to accept, and continue developing ideas after the event ends.

## What it does

- Organizes events and keeps feedback, reflections, actions, ideas, and milestones connected to their context.
- Converts feedback into transparent, deterministic action suggestions using local keyword rules. Suggestions can be edited, dismissed, or added to the action plan.
- Tracks action status, priority, deadlines, overdue work, and completion.
- Supports saved reflection drafts and converting a takeaway into an action.
- Stores ideas with a clear development stage and next milestone.
- Provides a 24-hour, 7-day, and 30-day follow-through timeline.
- Calculates progress from the records in the current workspace.
- Imports and exports a versioned JSON workspace.

The included sample event demonstrates the complete flow. Use **Data & settings → Clear local data** for a blank workspace or **Restore sample workspace** to reload the demo.

## Local development

Requirements: Node.js 20.19+ or 22.12+, and npm.

```sh
npm install
npm run dev
```

Vite prints the local development URL after the server starts.

## Checks and production build

```sh
npm run lint
npm run build
npm run preview
```

The production build is static and written to `dist/`.

## Deploy to Vercel

1. Import the repository into Vercel, or install and use the Vercel CLI.
2. Select **Vite** as the framework preset.
3. Use `npm run build` as the build command and `dist` as the output directory.
4. Deploy. No server functions, environment variables, API keys, or backend URLs are required.

The current app uses a single client-side workspace view rather than URL routes, so static hosting does not need a route-rewrite configuration.

## Local storage and privacy

ORIGANO has no account or server. Application data is saved in browser `localStorage` for this site origin. The deployed application is publicly accessible, but each visitor's workspace is private to that browser profile and is not shared with other people or devices.

Clearing browser/site data removes the saved workspace. Export a JSON copy before moving to another device or clearing data. Import replaces the current local workspace after validating the ORIGANO schema version. Imported content is parsed as JSON and is never executed.

Feedback categorization is rule-based and performed in the browser. It is not AI inference. Opportunity publishing, external messaging, collaboration delivery, cross-device synchronization, and organization-wide analytics are not provided.

## Current limitations

- There is no cloud sync, account system, shared database, or multi-user collaboration.
- Sample actions and sample records are local demonstration data, not live messages or organization metrics.
- Keyword rules can miss nuance; review and edit the suggestions before adding them to your action plan.
- Browser storage has per-origin limits and is not a substitute for a backup.
- There is no automated test suite configured yet. TypeScript compilation, production build, lint, and the main browser workflows should be checked before release.
- The interactive journey artwork is a lightweight CSS 3D-style illustration; it does not use WebGL and is not required for the tool to function.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the development and review checklist.

## Project

- Problem statement: **PS 04 — After the Event**
- Team: **PROCESS 404**
- Made by Sundram Yadav and Yugnsh Sethi

No license file is included because a license should only be added with authorization from the project owner.
