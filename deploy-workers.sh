#!/bin/bash
# Deploy Cloudflare Workers via Pages build
# NOTE: CI is connected to mojo-luna-955c, so only deploy the AI worker here.
# Email worker (tight-fog-5031) must be deployed manually:
#   cd worker/email-worker && npm install && npx wrangler deploy

set -e

echo "=== Deploying AI worker (mojo-luna-955c) ==="
cd worker
npx wrangler deploy
cd ..

echo "=== Workers deployed ==="
