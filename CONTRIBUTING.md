# Contributing to ORIGANO

Thank you for helping improve ORIGANO. Keep changes aligned with its local-first, post-event follow-through purpose.

## Development

```sh
npm install
npm run dev
```

Before opening a pull request, run:

```sh
npm run lint
npm run build
```

## Product and implementation guidelines

- Keep the core experience available without an account, backend, API key, or external service.
- Store personal workspace data locally and explain limitations honestly.
- Keep progress figures derived from workspace data.
- Validate imported JSON and never execute imported content.
- Make feedback suggestions transparent and editable; do not imply a language model is involved.
- Use semantic controls, visible keyboard focus, and responsive layouts.
- Do not introduce external social links, fictional endorsements, or claims of shared publishing.

## Pull request checklist

- [ ] The change supports the after-event workflow.
- [ ] New or changed data is persisted and included in import/export where appropriate.
- [ ] Empty, invalid, and destructive-action states are handled.
- [ ] The layout remains usable at mobile widths.
- [ ] `npm run lint` and `npm run build` pass.
- [ ] README or user-facing privacy guidance is updated when behavior changes.

There is currently no license file. Please do not assume that the project is licensed for redistribution until its owner authorizes and adds a license.
