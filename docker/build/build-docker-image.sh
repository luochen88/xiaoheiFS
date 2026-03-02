#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

IMAGE_NAME="${1:-xiaoheifs-backend:local}"

docker build -f docker/build/Dockerfile -t "${IMAGE_NAME}" .
echo "Image built: ${IMAGE_NAME}"
