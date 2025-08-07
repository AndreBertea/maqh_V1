Param(
  [string]$RepoUrl = "https://github.com/AndreBertea/maqh_V1.git",
  [string]$TargetDir = "$HOME/MAQH_V1",
  [ValidateSet('start','pack','dist')][string]$Cmd = 'start'
)

function Need-Cmd($name){ return (Get-Command $name -ErrorAction SilentlyContinue) -ne $null }

Write-Host "[MAQH] Répertoire d'installation: $TargetDir"

if (-not (Need-Cmd git)) {
  Write-Host "[MAQH] Git introuvable. Installez Git puis relancez: https://git-scm.com/download/win"
  exit 1
}

if (-not (Need-Cmd node)) {
  Write-Host "[MAQH] Node.js introuvable. Ouverture de la page d'installation..."
  Start-Process "https://nodejs.org/en/download"
  Read-Host "Installez Node.js, puis appuyez sur Entrée pour continuer"
}

if (Test-Path "$TargetDir/.git") {
  Write-Host "[MAQH] Repo existant, mise à jour..."
  git -C $TargetDir pull --ff-only
} else {
  Write-Host "[MAQH] Clonage du dépôt..."
  git clone $RepoUrl $TargetDir
}

Set-Location $TargetDir
Write-Host "[MAQH] Installation des dépendances..."
npm install --no-fund --no-audit

switch ($Cmd) {
  'start' { Write-Host "[MAQH] Démarrage dev..."; npm start }
  'pack'  { Write-Host "[MAQH] Build pack..."; npm run pack }
  'dist'  { Write-Host "[MAQH] Build dist..."; npm run dist }
}


