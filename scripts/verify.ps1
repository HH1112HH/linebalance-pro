<#
.SYNOPSIS
    Runs the project verification gates.

.DESCRIPTION
    Backend: pytest
    Frontend: TypeScript typecheck + Vite production build
    Run from anywhere; paths are resolved from the repo root.

.PARAMETER SkipFrontend
    Skip TypeScript typecheck and Vite build.

.PARAMETER SkipBuild
    Run frontend typecheck but skip the production build.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\verify.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\verify.ps1 -SkipFrontend
#>

[CmdletBinding()]
param(
    [switch]$SkipFrontend,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root

try {
    $python = if (Test-Path ".venv\Scripts\python.exe") {
        ".venv\Scripts\python.exe"
    } else {
        "python"
    }

    Write-Host ""
    Write-Host "==> Backend tests" -ForegroundColor Cyan
    & $python -m pytest
    if ($LASTEXITCODE -ne 0) {
        throw "Backend tests failed (exit $LASTEXITCODE)."
    }

    if (-not $SkipFrontend) {
        if (-not (Test-Path "frontend\node_modules")) {
            throw "frontend\node_modules is missing. Run: npm --prefix frontend install"
        }

        Write-Host ""
        Write-Host "==> Frontend typecheck" -ForegroundColor Cyan
        npm --prefix frontend run typecheck
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend typecheck failed (exit $LASTEXITCODE)."
        }

        if (-not $SkipBuild) {
            Write-Host ""
            Write-Host "==> Frontend build" -ForegroundColor Cyan
            npm --prefix frontend run build
            if ($LASTEXITCODE -ne 0) {
                throw "Frontend build failed (exit $LASTEXITCODE)."
            }
        }
    }

    Write-Host ""
    Write-Host "All checks passed." -ForegroundColor Green
}
finally {
    Pop-Location
}
