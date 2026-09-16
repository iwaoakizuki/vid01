#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

function parseArgs(argv) {
  const args = {
    customerId: null,
    appId: null,
    displayName: null,
    root: process.cwd(),
    force: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case "--customer-id":
        args.customerId = argv[++i];
        break;
      case "--app-id":
        args.appId = argv[++i];
        break;
      case "--display-name":
        args.displayName = argv[++i];
        break;
      case "--root":
        args.root = path.resolve(argv[++i]);
        break;
      case "--force":
        args.force = true;
        break;
      case "--help":
      case "-h":
        console.log(`
Usage:
  node bytai-init-v3.mjs

Or:
  node bytai-init-v3.mjs --customer-id yamada --app-id sales --display-name "営業管理システム"

Options:
  --customer-id <id>
  --app-id <id>
  --display-name <name>
  --root <path>
  --force
`);
        process.exit(0);
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function validateSlug(value, label) {
  if (!value || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error(
      `${label} must use lowercase letters, numbers, and hyphens only.`
    );
  }
  return value;
}

async function writeFileSafe(root, relativePath, content, force) {
  const filePath = path.join(root, relativePath);

  await fs.mkdir(path.dirname(filePath), {
    recursive: true,
  });

  try {
    await fs.access(filePath);

    if (!force) {
      console.log(`SKIP  ${relativePath}`);
      return;
    }
  } catch {
    // File does not exist.
  }

  await fs.writeFile(filePath, content, "utf8");
  console.log(`WRITE ${relativePath}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const rl = readline.createInterface({
    input,
    output,
  });

  try {
    if (!args.customerId) {
      args.customerId = (
        await rl.question(
          "Customer ID (例: yamada): "
        )
      ).trim();
    }

    if (!args.appId) {
      args.appId = (
        await rl.question(
          "App ID (例: sales): "
        )
      ).trim();
    }

    if (!args.displayName) {
      args.displayName = (
        await rl.question(
          "表示名 (例: 営業管理システム): "
        )
      ).trim();
    }
  } finally {
    rl.close();
  }

  const customerId = validateSlug(
    args.customerId,
    "customer_id"
  );

  const appId = validateSlug(
    args.appId,
    "app_id"
  );

  if (!args.displayName) {
    throw new Error(
      "display_name is required."
    );
  }

  const systemId =
    `${customerId}-${appId}`;

  const root =
    path.resolve(args.root);

  const resources = {
    github_repository:
      systemId,

    worker_dev:
      `${systemId}-dev`,

    worker_prod:
      `${systemId}-prod`,

    d1_dev:
      `${systemId}-dev-db`,

    d1_prod:
      `${systemId}-prod-db`,

    r2_dev:
      `${systemId}-dev-files`,

    r2_prod:
      `${systemId}-prod-files`,
  };

  const files = {
    "bytai.project.json":
      JSON.stringify(
        {
          schema_version: 1,
          customer_id: customerId,
          app_id: appId,
          system_id: systemId,
          display_name:
            args.displayName,
          deployment: {
            dev: {
              mode: "automatic",
              target: "cloudflare",
            },
            prod: {
              mode: "manual-promotion",
              target: "cloudflare",
              require_explicit_instruction: true,
            },
          },
          resources,
        },
        null,
        2
      ) + "\n",

    "PROJECT.md": `# ${args.displayName}

System ID: \`${systemId}\`

## Project identity

- Customer ID: \`${customerId}\`
- App ID: \`${appId}\`
- GitHub Repository: \`${resources.github_repository}\`

## Cloudflare

### DEV

- Worker: \`${resources.worker_dev}\`
- D1: \`${resources.d1_dev}\`
- R2: \`${resources.r2_dev}\`

### PROD

- Worker: \`${resources.worker_prod}\`
- D1: \`${resources.d1_prod}\`
- R2: \`${resources.r2_prod}\`

## Deployment policy

- DEV may be deployed automatically from normal development changes.
- Normal Git pushes must not be treated as implicit approval for PROD deployment.
- PROD deployment requires an explicit promotion instruction after DEV verification.
- Database migrations must be reviewed before PROD application, with a recovery path identified.

\`bytai.project.json\` is the machine-readable source of truth.

\`system_id\` is permanent and should not be renamed.
`,

    "AGENTS.md": `# Bytai Development Rules

## Project identity

- Read \`bytai.project.json\` before structural, infrastructure, database, or deployment changes.
- Read \`PROJECT.md\`.
- \`system_id\` is permanent. Do not rename it.

## Repository

- One application normally uses one repository.
- Adding screens or features does not create a new application.
- A separate independent application should use a separate repository and a new \`system_id\`.
- Inspect the existing structure before adding files.
- Reuse existing routing, components, styles, and services when appropriate.

## Cloudflare

- Cloudflare Workers is the standard runtime.
- Use D1 for relational persistence.
- Use R2 only when object/file storage is required.
- Keep DEV and PROD separate.
- Resource names must follow \`bytai.project.json\`.

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

- Store every schema change as an SQL migration under \`migrations/\`.
- Never rewrite an already-applied migration.
- Add a new migration for every schema change.

## Git

- GitHub is the source of truth for code.
- Keep changes small and reviewable.
- Create Checkpoints only from known-good states.

## User interaction

- Users should describe business requirements in natural language.
- Do not require internal file paths or implementation details unless necessary.
`,

    "CLAUDE.md": `# Claude Code Instructions

@AGENTS.md

Use \`bytai.project.json\`, \`PROJECT.md\`, and \`AGENTS.md\` as the project rules.

Do not invent a second naming convention.
`,

    "package.json":
      JSON.stringify(
        {
          name: systemId,
          version: "0.1.0",
          private: true,
          type: "module",

          scripts: {
            dev: "vite",

            build:
              "vite build",

            preview:
              "vite preview",

            typecheck:
              "tsc --noEmit",

            "worker:dev":
              "wrangler dev --env dev",

            "deploy:dev":
              "wrangler deploy --env dev",

            "deploy:prod":
              "wrangler deploy --env prod",
          },

          dependencies: {
            react: "^19.0.0",
            "react-dom":
              "^19.0.0",
          },

          devDependencies: {
            "@cloudflare/workers-types":
              "latest",

            "@types/react":
              "^19.0.0",

            "@types/react-dom":
              "^19.0.0",

            "@vitejs/plugin-react":
              "latest",

            typescript:
              "latest",

            vite:
              "latest",

            wrangler:
              "latest",
          },
        },
        null,
        2
      ) + "\n",

    "vite.config.ts": `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    outDir: "dist",
  },
});
`,

    "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2022",

    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],

    "strict": true,

    "module": "ESNext",

    "moduleResolution":
      "Bundler",

    "resolveJsonModule":
      true,

    "isolatedModules":
      true,

    "noEmit": true,

    "jsx":
      "react-jsx",

    "skipLibCheck":
      true
  },

  "include": [
    "src",
    "vite.config.ts"
  ]
}
`,

    "index.html": `<!doctype html>
<html lang="ja">

  <head>
    <meta charset="UTF-8" />

    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />

    <title>
      ${args.displayName}
    </title>
  </head>

  <body>

    <div id="root"></div>

    <script
      type="module"
      src="/src/frontend/main.tsx"
    ></script>

  </body>

</html>
`,

    "src/frontend/App.tsx": `export default function App() {
  return (
    <main>

      <h1>
        ${args.displayName}
      </h1>

      <p>
        System ID: ${systemId}
      </p>

      <p>
        Bytai standard project initialized.
      </p>

    </main>
  );
}
`,

    "src/frontend/main.tsx": `import React from "react";

import ReactDOM
  from "react-dom/client";

import App
  from "./App";

const root =
  document.getElementById(
    "root"
  );

if (!root) {
  throw new Error(
    "Root element not found."
  );
}

ReactDOM
  .createRoot(root)
  .render(
    <React.StrictMode>

      <App />

    </React.StrictMode>
  );
`,

    "src/worker/index.ts": `export interface Env {}

export default {

  async fetch(
    request: Request,
    env: Env
  ): Promise<Response> {

    const url =
      new URL(
        request.url
      );

    if (
      url.pathname ===
      "/api/health"
    ) {

      return Response.json({
        ok: true,
        system_id:
          "${systemId}",
      });

    }

    return new Response(
      "Bytai Worker: ${systemId}"
    );
  },

};
`,

    "wrangler.jsonc": `{
  "$schema":
    "./node_modules/wrangler/config-schema.json",

  "name":
    "${systemId}",

  "main":
    "src/worker/index.ts",

  "compatibility_date":
    "${new Date()
      .toISOString()
      .slice(0, 10)}",

  "env": {

    "dev": {
      "name":
        "${resources.worker_dev}"
    },

    "prod": {
      "name":
        "${resources.worker_prod}"
    }

  }
}
`,

    ".gitignore": `node_modules/
dist/
.wrangler/

.dev.vars
.dev.vars.*

.env
.env.*

!.env.example

.DS_Store
Thumbs.db

*.log
`,

    "README.md": `# ${args.displayName}

Bytai standard application repository.

## Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## Type check

\`\`\`bash
npm run typecheck
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

## Worker DEV

\`\`\`bash
npm run worker:dev
\`\`\`

## Deploy

DEV:

\`\`\`bash
npm run deploy:dev
\`\`\`

PROD is a separate manual promotion step. Run it only after DEV verification and explicit production approval:

\`\`\`bash
npm run deploy:prod
\`\`\`

A normal Git push is not production approval.

Project identity:

- \`bytai.project.json\`
- \`PROJECT.md\`

AI rules:

- \`AGENTS.md\`
- \`CLAUDE.md\`
`,

    "migrations/README.md": `# Migrations

Store ordered D1 SQL migrations here.

Example:

- 0001_initial.sql
- 0002_add_customer_status.sql

Never rewrite a migration that has already been applied.
`,

    "tests/README.md": `# Tests

Add automated tests for important application behavior here.
`,

    "docs/README.md": `# Docs

Store requirements, design decisions, operations notes, and customer source specifications here.
`,

    "scripts/README.md": `# Scripts

Store repeatable maintenance and data-processing scripts here.
`,

    "checkpoints/checkpoint-log.md": `# Checkpoint Log

| Date | Checkpoint | Git ref/tag | DB recovery point | Notes |
|---|---|---|---|---|
`,
  };

  const emptyDirs = [
    "src/frontend/components",
    "src/frontend/pages",
    "src/frontend/hooks",
    "src/frontend/services",
    "src/frontend/types",
    "src/frontend/utils",

    "src/worker/routes",
    "src/worker/services",
    "src/worker/db",
    "src/worker/types",
    "src/worker/utils",
  ];

  await fs.mkdir(
    root,
    {
      recursive: true,
    }
  );

  for (
    const dir
    of emptyDirs
  ) {
    await writeFileSafe(
      root,
      `${dir}/.gitkeep`,
      "",
      args.force
    );
  }

  for (
    const [
      relativePath,
      content,
    ]
    of Object.entries(files)
  ) {
    await writeFileSafe(
      root,
      relativePath,
      content,
      args.force
    );
  }

  console.log("");

  console.log(
    `Initialized: ${systemId}`
  );

  console.log(
    `Repository : ${resources.github_repository}`
  );

  console.log(
    `DEV Worker : ${resources.worker_dev}`
  );

  console.log(
    `PROD Worker: ${resources.worker_prod}`
  );

  console.log("");

  console.log("Next:");

  console.log(
    "  npm install"
  );

  console.log(
    "  npm run typecheck"
  );

  console.log(
    "  npm run dev"
  );

  console.log(
    "  git add ."
  );

  console.log(
    '  git commit -m "Initialize Bytai project"'
  );

  console.log(
    "  git push"
  );

  console.log("");

  console.log(
    "D1/R2 names are reserved, but the resources are not created automatically."
  );

  console.log(
    "Deployment policy: DEV may be automatic; PROD requires explicit manual promotion."
  );
}

main().catch(
  (error) => {

    console.error(
      `ERROR: ${error.message}`
    );

    process.exit(1);

  }
);