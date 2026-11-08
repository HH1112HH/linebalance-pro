<#
.SYNOPSIS
    Starts the FastAPI backend with local-only settings from .env.local.

.DESCRIPTION
    Loads .env.local into the current process (existing environment variables win),
    then starts uvicorn. Tests and scripts/verify.ps1 do not load this file; they
    supply their own environment.

.PARAMETER BindHost
    Interface to bind. Defaults to 127.0.0.1 so the demo cookies stay non-secure.

.PARAMETER Port
    HTTP port. Defaults to 8000, matching the Vite proxy.

.PARAMETER Reload
    Enable uvicorn auto-reload for local development.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\run_backend.ps1 -Reload
#>

[CmdletBinding()]
param(
    [string]$BindHost = "127.0.0.1",
    [int]$Port = 8000,
    [switch]$Reload
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env.local"
$python = Join-Path $root ".venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $python)) {
    throw "Python venv not found at $python. Create .venv and install backend\requirements-dev.txt."
}

if (Test-Path -LiteralPath $envFile) {
    foreach ($rawLine in Get-Content -LiteralPath $envFile -Encoding UTF8) {
        $line = $rawLine.Trim()
        if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
            continue
        }
        $key, $value = $line.Split("=", 2)
        $key = $key.Trim()
        $value = $value.Trim().Trim('"').Trim("'")
        if (-not $key) {
            continue
        }
        if ($null -eq [Environment]::GetEnvironmentVariable($key, "Process")) {
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "Loaded local settings from .env.local" -ForegroundColor DarkGray
}
else {
    Write-Host "No .env.local found; starting with the current environment only." -ForegroundColor Yellow
}

$uvicornArgs = @(
    "-m", "uvicorn", "backend.app.main:app",
    "--host", $BindHost,
    "--port", $Port
)
if ($Reload) {
    $uvicornArgs += "--reload"
}

Write-Host "Starting backend on http://${BindHost}:${Port}" -ForegroundColor Cyan
Push-Location $root
try {
    & $python @uvicornArgs
    if ($LASTEXITCODE -ne 0) {
        throw "uvicorn exited with code $LASTEXITCODE."
    }
}
finally {
    Pop-Location
}
