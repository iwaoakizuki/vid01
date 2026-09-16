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

- `stagingブランチ` is the normal development branch and the repository default branch.
- `mainブランチ` is the production branch.
- Normal development work must target `stagingブランチ`.
- Do not push normal development changes directly to `mainブランチ`.
- Do not merge `stagingブランチ` into `mainブランチ` unless the user explicitly instructs a production promotion.
- A push to `stagingブランチ` may automatically verify and deploy the Cloudflare staging environment.
- Production deployment is allowed only after a pull request from `stagingブランチ` to `mainブランチ` is merged.
- Treat a merged `stagingブランチ` -> `mainブランチ` pull request as an explicit production promotion event.

