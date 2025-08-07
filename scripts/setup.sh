#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/AndreBertea/maqh_V1.git"
TARGET_DIR="$HOME/MAQH_V1"
CMD="start"   # start | pack | dist

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO_URL="$2"; shift 2;;
    --dir)
      TARGET_DIR="$2"; shift 2;;
    --start)
      CMD="start"; shift;;
    --pack)
      CMD="pack"; shift;;
    --dist)
      CMD="dist"; shift;;
    *)
      echo "Argument inconnu: $1"; exit 1;;
  esac
done

echo "[MAQH] Répertoire d'installation: $TARGET_DIR"

need_cmd() {
  command -v "$1" >/dev/null 2>&1
}

install_git() {
  echo "[MAQH] Git introuvable. Tentative d'installation..."
  if [[ "$(uname)" == "Darwin" ]]; then
    if ! need_cmd brew; then
      echo "[MAQH] Installation de Homebrew..."
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
      eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || true)"
      eval "$(/usr/local/bin/brew shellenv 2>/dev/null || true)"
    fi
    brew install git
  else
    if need_cmd apt; then sudo apt update && sudo apt install -y git; 
    elif need_cmd dnf; then sudo dnf install -y git;
    elif need_cmd yum; then sudo yum install -y git;
    elif need_cmd pacman; then sudo pacman -Sy --noconfirm git;
    else
      echo "[MAQH] Installez Git manuellement puis relancez."; exit 1;
    fi
  fi
}

install_node() {
  echo "[MAQH] Node.js introuvable. Installation via nvm..."
  if [[ ! -d "$HOME/.nvm" ]]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  fi
  # shellcheck source=/dev/null
  export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install --lts
}

need_cmd git || install_git
need_cmd node || install_node
need_cmd npm || { echo "[MAQH] npm manquant (devrait venir avec Node)."; exit 1; }

if [[ -d "$TARGET_DIR/.git" ]]; then
  echo "[MAQH] Repo existant, mise à jour..."
  git -C "$TARGET_DIR" pull --ff-only
else
  echo "[MAQH] Clonage du dépôt..."
  git clone "$REPO_URL" "$TARGET_DIR"
fi

cd "$TARGET_DIR"
echo "[MAQH] Installation des dépendances..."
npm install --no-fund --no-audit

case "$CMD" in
  start)
    echo "[MAQH] Démarrage de l'application (dev)..."
    npm start
    ;;
  pack)
    echo "[MAQH] Build non installable (pack)..."
    npm run pack
    ;;
  dist)
    echo "[MAQH] Build installable (dist)..."
    npm run dist
    ;;
esac


