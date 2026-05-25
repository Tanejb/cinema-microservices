# Zgradi in pusha vse frontend slike z URL-ji iz build-env.local
# Zahteva: Docker Desktop, prijava na DockerHub (docker login)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path "$PSScriptRoot\..\..").Path
$EnvFile = Join-Path $PSScriptRoot "build-env.local"

if (-not (Test-Path $EnvFile)) {
    Write-Error "Manjka $EnvFile — kopiraj iz build-env.example"
}

$vars = @{}
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $i = $line.IndexOf("=")
    if ($i -gt 0) {
        $vars[$line.Substring(0, $i).Trim()] = $line.Substring($i + 1).Trim()
    }
}

$required = @(
    "VITE_API_GATEWAY_WEB",
    "VITE_REMOTE_MOVIES",
    "VITE_REMOTE_USERS",
    "VITE_REMOTE_SCREENINGS",
    "VITE_REMOTE_RESERVATIONS"
)
foreach ($key in $required) {
    if (-not $vars.ContainsKey($key)) {
        Write-Error "V build-env.local manjka $key"
    }
}

function Build-And-Push {
    param(
        [string]$Name,
        [string]$Context,
        [string]$Image,
        [hashtable]$BuildArgs
    )
    $argList = @()
    foreach ($k in $BuildArgs.Keys) {
        $argList += "--build-arg"
        $argList += "${k}=$($BuildArgs[$k])"
    }
    Write-Host "`n=== $Name ===" -ForegroundColor Cyan
    Push-Location (Join-Path $Root $Context)
    try {
        & docker build @argList -t "${Image}:latest" .
        if ($LASTEXITCODE -ne 0) { throw "docker build failed" }
        & docker push "${Image}:latest"
        if ($LASTEXITCODE -ne 0) { throw "docker push failed" }
    }
    finally {
        Pop-Location
    }
}

Build-And-Push "web-host" "web-app/host" "tanej666/cinema-frontend-host" @{
    VITE_REMOTE_MOVIES      = $vars.VITE_REMOTE_MOVIES
    VITE_REMOTE_USERS       = $vars.VITE_REMOTE_USERS
    VITE_REMOTE_SCREENINGS  = $vars.VITE_REMOTE_SCREENINGS
    VITE_REMOTE_RESERVATIONS = $vars.VITE_REMOTE_RESERVATIONS
}

$gw = $vars.VITE_API_GATEWAY_WEB
foreach ($mfe in @(
    @{ n = "web-movies"; c = "web-app/movies"; i = "tanej666/cinema-frontend-movies" },
    @{ n = "web-users"; c = "web-app/users"; i = "tanej666/cinema-frontend-users" },
    @{ n = "web-screenings"; c = "web-app/screenings"; i = "tanej666/cinema-frontend-screenings" },
    @{ n = "web-reservations"; c = "web-app/reservations"; i = "tanej666/cinema-frontend-reservations" }
)) {
    Build-And-Push $mfe.n $mfe.c $mfe.i @{ VITE_API_GATEWAY_WEB = $gw }
}

Write-Host "`nKoncano. V OpenShift terminalu:" -ForegroundColor Green
Write-Host "oc rollout restart deployment/web-host deployment/web-movies deployment/web-users deployment/web-screenings deployment/web-reservations"
