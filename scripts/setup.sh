#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/AndreBertea/maqh_V1.git}"
BRANCH="${BRANCH:-main}"
CMD="start"  # start | pack | dist

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)   REPO_URL="$2"; shift 2;;
    --branch) BRANCH="$2"; shift 2;;
    --dir)    TARGET_DIR="$2"; shift 2;;
    --start)  CMD="start"; shift;;
    --pack)   CMD="pack"; shift;;
    --dist)   CMD="dist"; shift;;
    *) echo "Arg inconnu: $1"; exit 1;;
  esac
done

case "$(uname)" in
  Darwin) TARGET_DIR="${TARGET_DIR:-$HOME/Library/Application Support/MAQH/app}" ;;
  Linux)  TARGET_DIR="${TARGET_DIR:-$HOME/.local/share/MAQH/app}" ;;
  *)      TARGET_DIR="${TARGET_DIR:-$HOME/MAQH_V1}" ;;
esac
echo "[MAQH] Répertoire: $TARGET_DIR"
mkdir -p "$TARGET_DIR"

need_cmd() { command -v "$1" >/dev/null 2>&1; }

install_node() {
  echo "[MAQH] Node.js introuvable -> nvm"
  if [[ ! -d "$HOME/.nvm" ]]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  fi
  # shellcheck source=/dev/null
  export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  if [[ -f "$TARGET_DIR/.nvmrc" ]]; then
    (cd "$TARGET_DIR" && nvm install && nvm use)
  else
    nvm install --lts && nvm use --lts
  fi
}

need_cmd git || { echo "[MAQH] Git manquant."; exit 1; }
need_cmd node || install_node
need_cmd npm || { echo "[MAQH] npm manquant."; exit 1; }

if [[ -d "$TARGET_DIR/.git" ]]; then
  echo "[MAQH] Update repo (fetch+reset $BRANCH)..."
  git -C "$TARGET_DIR" fetch --depth=1 origin "$BRANCH"
  git -C "$TARGET_DIR" reset --hard "origin/$BRANCH"
else
  echo "[MAQH] Clone (branch $BRANCH)..."
  git clone --depth=1 --branch "$BRANCH" "$REPO_URL" "$TARGET_DIR"
fi

cd "$TARGET_DIR"
echo "[MAQH] Node $(node -v) / npm $(npm -v)"
if [[ -f package-lock.json ]]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

case "$CMD" in
  start) npm start ;;
  pack)  npm run pack ;;
  dist)  npm run dist ;;
esac
exit $?

