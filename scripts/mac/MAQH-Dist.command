#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
REPO_SCRIPTS_DIR="${SCRIPT_DIR}/.."
exec bash "${REPO_SCRIPTS_DIR}/setup.sh" --dist


