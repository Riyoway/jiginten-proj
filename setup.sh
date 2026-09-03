#!/usr/bin/env sh
set -eu
corepack enable
corepack prepare pnpm@10.15.1 --activate
[ -f .env ] || cp .env.example .env
pnpm install
pnpm dev
