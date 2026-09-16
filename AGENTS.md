# Bytai Development Rules

## Project identity

- Read `bytai.project.json` before structural, infrastructure, database, or deployment changes.
- Read `PROJECT.md`.
- `system_id` is permanent. Do not rename it.

## Repository

- One application normally uses one repository.
- Adding screens or features does not create a new application.
- A separate independent application should use a separate repository and a new `system_id`.
- Inspect the existing structure before adding files.
- Reuse existing routing, components, styles, and services when appropriate.

## Cloudflare

- Cloudflare Workers is the standard runtime.
- Use D1 for relational persistence.
- Use R2 only when object/file storage is required.
- Keep DEV and PROD separate.
- Resource names must follow `bytai.project.json`.

## Deployment Safety

- Day-to-day development targets DEV.
- Normal Git pushes must never be interpreted as permission to deploy to PROD.
- Do not deploy to PROD unless the user explicitly instructs a production promotion.
- Verify DEV behavior before any PROD promotion.
- Before PROD deployment, run the project's required checks such as typecheck, tests, and build when available.
- If a database migration is included, review the migration and identify a recovery path before PROD application.
- Do not change PROD secrets, bindings, domains, D1, R2, or other production resources without explicit user instruction.
- Treat PROD deployment as a separate operational action from normal development.

## Database

- Store every schema change as an SQL migration under `migrations/`.
- Never rewrite an already-applied migration.
- Add a new migration for every schema change.

## Git

- GitHub is the source of truth for code.
- Keep changes small and reviewable.
- Create Checkpoints only from known-good states.

## User interaction

- Users should describe business requirements in natural language.
- Do not require internal file paths or implementation details unless necessary.

## Bytai Branch Policy

- `stagingブランチ` is the normal development and DEV deployment branch.
- `mainブランチ` is the production branch.
- Normal development must start from `stagingブランチ`.
- Codex should make normal development changes on a temporary work branch, not directly on `stagingブランチ` or `mainブランチ`.
- After implementation and local checks, Codex should create a Pull Request whose base branch is `stagingブランチ`.
- Codex-created Pull Requests to `stagingブランチ` are automatically validated by GitHub Actions.
- When the validation succeeds, the Codex Pull Request may be automatically merged into `stagingブランチ`.
- When validation fails, the Pull Request must remain unmerged and the failure must be reported.
- After an automatic merge into `stagingブランチ`, GitHub Actions starts the staging deployment workflow.
- Do not merge `stagingブランチ` into `mainブランチ` unless the user explicitly instructs a production promotion.
- Production deployment is allowed only after a Pull Request from `stagingブランチ` to `mainブランチ` is merged.
- Treat a merged `stagingブランチ` -> `mainブランチ` Pull Request as an explicit production promotion event.
