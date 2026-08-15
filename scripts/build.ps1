param(
    [switch]$SkipFrontend
)

$ErrorActionPreference = "Continue"

Set-Location -LiteralPath (Split-Path $PSScriptRoot -Parent)

if (-not $SkipFrontend) {
    Write-Host "==> Building frontend (tsc + vite)"
    npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }
    npx vite build
    if ($LASTEXITCODE -ne 0) { throw "Vite build failed" }
}

Write-Host "==> Building Tauri app (release)"
npm run tauri build
if ($LASTEXITCODE -ne 0) { throw "Tauri build failed" }

$nsisDir = "src-tauri\target\release\bundle\nsis"
$releaseDir = "release"

New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null

$installer = Get-ChildItem -LiteralPath $nsisDir -Filter "V Player_*_x64-setup.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $installer) { throw "NSIS installer not found in $nsisDir" }

$dest = Join-Path $releaseDir "VPlayer-Setup-x64.exe"
Copy-Item -LiteralPath $installer.FullName -Destination $dest -Force

Write-Host ""
Write-Host "Installer copied to: $dest"
Write-Host "Next steps:"
Write-Host "  1. Commit and push changes"
Write-Host "  2. Create a GitHub release tagged vX.Y.Z"
Write-Host "  3. Attach $dest as the release asset"
