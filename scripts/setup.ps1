Param(
  [string]$RepoUrl = "https://github.com/AndreBertea/maqh_V1.git",
  [string]$CmdBranch = "main",
  [ValidateSet('start','pack','dist')][string]$Cmd = 'start',
  [string]$TargetDir = "$env:LOCALAPPDATA\MAQH\app"
)

function Need-Cmd($name){ return (Get-Command $name -ErrorAction SilentlyContinue) -ne $null }

Write-Host "[MAQH] Répertoire: $TargetDir"

if (-not (Need-Cmd git)) {
  Write-Host "[MAQH] Git introuvable. Installez Git puis relancez: https://git-scm.com/download/win"
  exit 1
}

if (-not (Need-Cmd node)) {
  Write-Host "[MAQH] Node.js introuvable. Ouverture de la page d'installation..."
  Start-Process "https://nodejs.org/en/download"
  Read-Host "Installez Node.js, puis appuyez sur Entrée pour continuer"
}

New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null

if (Test-Path "$TargetDir/.git") {
  Write-Host "[MAQH] Update repo (fetch+reset $CmdBranch)..."
  git -C $TargetDir fetch --depth=1 origin $CmdBranch
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  git -C $TargetDir reset --hard "origin/$CmdBranch"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
  Write-Host "[MAQH] Clone (branch $CmdBranch)..."
  git clone --depth=1 --branch $CmdBranch $RepoUrl $TargetDir
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Set-Location $TargetDir
Write-Host "[MAQH] Node $(node -v) / npm $(npm -v)"
if (Test-Path "package-lock.json") {
  npm ci --no-audit --no-fund
} else {
  npm install --no-audit --no-fund
}
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

switch ($Cmd) {
  'start' { Write-Host "[MAQH] Démarrage dev..."; npm start }
  'pack'  { Write-Host "[MAQH] Build pack..."; npm run pack }
  'dist'  { Write-Host "[MAQH] Build dist..."; npm run dist }
}
exit $LASTEXITCODE
