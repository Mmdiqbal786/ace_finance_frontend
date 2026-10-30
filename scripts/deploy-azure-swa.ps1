# Requires: Node 20+, npm, Azure Static Web Apps CLI (`npm i -g @azure/static-web-apps-cli`)
# Usage (from ace_finance_frontend):
#   .\scripts\deploy-azure-swa.ps1
#   .\scripts\deploy-azure-swa.ps1 -CleanNodeModules   # also wipe node_modules + npm install
#   npm run deploy:azure
#
# Keeps your local .env unchanged. Production NEXT_PUBLIC_* values come from .env.deploy
# for the build process only (env vars override .env files in Next.js).

param(
  [switch]$CleanNodeModules,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Read-DotEnvFile([string]$Path) {
  $map = @{}
  if (-not (Test-Path $Path)) { return $map }
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $i = $line.IndexOf("=")
    if ($i -lt 1) { return }
    $key = $line.Substring(0, $i).Trim()
    $val = $line.Substring($i + 1).Trim()
    if (
      ($val.StartsWith('"') -and $val.EndsWith('"')) -or
      ($val.StartsWith("'") -and $val.EndsWith("'"))
    ) {
      $val = $val.Substring(1, $val.Length - 2)
    }
    $map[$key] = $val
  }
  return $map
}

$deployEnvPath = Join-Path $Root ".env.deploy"
if (-not (Test-Path $deployEnvPath)) {
  Write-Error "Missing .env.deploy - copy .env.deploy.example to .env.deploy and set SWA_DEPLOYMENT_TOKEN."
}

$deploy = Read-DotEnvFile $deployEnvPath
$token = $deploy["SWA_DEPLOYMENT_TOKEN"]
$appName = if ($deploy["SWA_APP_NAME"]) { $deploy["SWA_APP_NAME"] } else { "ace-finance-frontend" }
$swaEnv = if ($deploy["SWA_ENV"]) { $deploy["SWA_ENV"] } else { "production" }

if (-not $token -or $token -eq "REPLACE_WITH_AZURE_DEPLOYMENT_TOKEN") {
  Write-Error "Set SWA_DEPLOYMENT_TOKEN in .env.deploy (Azure Portal -> Static Web App -> Manage deployment token)."
}

foreach ($key in @(
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_APP_URL"
)) {
  if (-not $deploy[$key]) {
    Write-Error "Missing $key in .env.deploy"
  }
}

# Bake all NEXT_PUBLIC_* from .env.deploy into this build (overrides local .env)
foreach ($key in $deploy.Keys) {
  if ($key -like "NEXT_PUBLIC_*") {
    Set-Item -Path "Env:$key" -Value $deploy[$key]
  }
}

Write-Host "==> Production build env (temporary for this process only)" -ForegroundColor Cyan
Write-Host "    NEXT_PUBLIC_API_URL=$env:NEXT_PUBLIC_API_URL"
Write-Host "    NEXT_PUBLIC_APP_URL=$env:NEXT_PUBLIC_APP_URL"
if ($env:NEXT_PUBLIC_DOCS_VIDEOS_BASE_URL) {
  Write-Host "    NEXT_PUBLIC_DOCS_VIDEOS_BASE_URL=$env:NEXT_PUBLIC_DOCS_VIDEOS_BASE_URL"
  Write-Host "    NEXT_PUBLIC_DOCS_VIDEOS_SAS=(set)"
} else {
  Write-Host "    NEXT_PUBLIC_DOCS_VIDEOS_* not set — Demo Guide videos use default base without SAS"
}
Write-Host "    SWA app=$appName env=$swaEnv"
Write-Host "    Local .env is NOT modified"

Write-Host "==> Cleaning out/ and .next/" -ForegroundColor Cyan
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue (Join-Path $Root "out")
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue (Join-Path $Root ".next")

if ($CleanNodeModules) {
  Write-Host "==> Cleaning node_modules/ and reinstalling" -ForegroundColor Cyan
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue (Join-Path $Root "node_modules")
  npm install
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} elseif (-not (Test-Path (Join-Path $Root "node_modules")) -and -not $SkipInstall) {
  Write-Host "==> node_modules missing - npm install" -ForegroundColor Cyan
  npm install
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "==> Building static export (npm run build)" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$outDir = Join-Path $Root "out"
if (-not (Test-Path $outDir)) {
  Write-Error "Build finished but out/ was not created. Check next.config output: 'export'."
}

$swa = Get-Command swa -ErrorAction SilentlyContinue
if (-not $swa) {
  Write-Error "Azure SWA CLI not found. Install: npm i -g @azure/static-web-apps-cli"
}

Write-Host "==> Deploying to Azure Static Web Apps ($appName / $swaEnv)" -ForegroundColor Cyan
swa deploy ./out --app-name $appName --deployment-token $token --env $swaEnv
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Deploy complete -> https://finance.aceolution.com/" -ForegroundColor Green
Write-Host "Local .env unchanged - npm run dev still uses your local API URLs." -ForegroundColor Green
