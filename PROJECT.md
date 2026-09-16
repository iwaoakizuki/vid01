# 在庫管理システム

System ID: `yamada-stock`

## Project identity

- Customer ID: `yamada`
- App ID: `stock`
- GitHub Repository: `yamada-stock`

## Cloudflare

### DEV

- Worker: `yamada-stock-dev`
- D1: `yamada-stock-dev-db`
- R2: `yamada-stock-dev-files`

### PROD

- Worker: `yamada-stock-prod`
- D1: `yamada-stock-prod-db`
- R2: `yamada-stock-prod-files`

## Deployment policy

- DEV may be deployed automatically from normal development changes.
- Normal Git pushes must not be treated as implicit approval for PROD deployment.
- PROD deployment requires an explicit promotion instruction after DEV verification.
- Database migrations must be reviewed before PROD application, with a recovery path identified.

`bytai.project.json` is the machine-readable source of truth.

`system_id` is permanent and should not be renamed.
