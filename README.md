# ORIGANO

**The event ends. Your next chapter begins.**

ORIGANO is a free, browser-based post-event follow-through tool (PS 04, After the Event). Paste judge or mentor feedback, get rule-based suggested actions, accept or edit them into dated tasks, and track progress. Team PROCESS 404. Made by Sundram Yadav and Yugnsh Sethi.

## Features
- Events, guided reflection, feedback to action plan, action plan, idea vault, 30-day timeline, progress.
- Sample Opportunities, Connections and Organizer insights (clearly labelled local demos).
- JSON export and import, reset sample data, clear data, with confirmation dialogs.
- Suggestions come from transparent keyword rules in the browser. No AI model is used.
- Accessible dropdown navigation, per-page title and meta description, hash-based routing with a custom 404 page, thank-you page, sticky mobile call to action, storage notice, reduced-motion support.

## Stack
React 19, TypeScript, Vite, lucide-react. No backend, database, login or API keys.

## Run locally
```
npm install
npm run dev      # development server
npm run build    # typecheck + production build into dist/
npm run preview  # serve the production build
npm run lint
```

## Deploy to Vercel
1. Push this repository to GitHub.
2. In Vercel choose Add New, Project and import the repository.
3. Framework preset: Vite. Build command `npm run build`, output directory `dist`.
4. Deploy. No environment variables are needed.

## Data and privacy
Workspace data is stored in the browser's localStorage (`origano-workspace-v2`). Opportunity interest, connection requests and locally published ideas are stored under `origano-extras-v1` and are not part of the JSON export yet. Nothing is sent to a server. Clearing browser data erases the workspace, so export a backup first.

## Project layout
- `src/App.tsx` application shell and main pages
- `src/pages/Extras.tsx` opportunities, connections, organizer, thank-you and 404 pages
- `src/components/` orbit background, CSS 3D hero scene, storage notice
- `src/lib/` storage and validation, feedback rules, sample extras and page metadata
- `src/model.ts` typed data model and sample workspace
- `src/theme.css` design tokens and overrides (teal, coral and ivory palette)

## Known limitations
- Opportunities, connections and organizer data are local demos, not real people or organization-wide statistics.
- No Kanban view yet. The 3D hero uses CSS 3D, not WebGL.
- Not yet tested across browsers or with automated tests.
- No license file. Add one only with the owners' approval.
