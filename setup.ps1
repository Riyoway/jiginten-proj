$ErrorActionPreference = "Stop"
corepack enable
corepack prepare pnpm@10.15.1 --activate
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
pnpm install
pnpm dev
