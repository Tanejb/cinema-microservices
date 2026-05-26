# Build and push all frontend images using build-env.local
# Requires: Docker Desktop, docker login

param(
    [string]$Tag = "",
    [switch]$NoCache
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path "$PSScriptRoot\..\..").Path
$OpenShiftDir = Resolve-Path "$PSScriptRoot\.."
$EnvFile = Join-Path $PSScriptRoot "build-env.local"
$TagEnvFile = Join-Path $OpenShiftDir "image-tag.env"

if (-not $Tag) {
    if (Test-Path $TagEnvFile) {
        Get-Content $TagEnvFile | ForEach-Object {
            $line = $_.Trim()
            if ($line -match "^CINEMA_IMAGE_TAG=(.+)$") {
                $Tag = $Matches[1].Trim()
            }
        }
    }
}
if (-not $Tag) {
    $Tag = "openshift-" + (Get-Date -Format "yyyyMMdd-HHmm")
}

if (-not (Test-Path $EnvFile)) {
    Write-Error "Missing build-env.local - copy from build-env.example"
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
        Write-Error "Missing $key in build-env.local"
    }
}

"CINEMA_IMAGE_TAG=$Tag" | Set-Content -Path $TagEnvFile -Encoding utf8
Write-Host "Image tag: $Tag (saved to openshift/image-tag.env)" -ForegroundColor Yellow

function Build-And-Push {
    param(
        [string]$Name,
        [string]$Context,
        [string]$Image,
        [hashtable]$BuildArgs
    )
    $argList = @()
    if ($NoCache) { $argList += "--no-cache" }
    foreach ($k in $BuildArgs.Keys) {
        $argList += "--build-arg"
        $argList += ($k + "=" + $BuildArgs[$k])
    }
    Write-Host ""
    Write-Host "=== $Name ===" -ForegroundColor Cyan
    Push-Location (Join-Path $Root $Context)
    try {
        & docker build @argList -t ($Image + ":latest") -t ($Image + ":" + $Tag) .
        if ($LASTEXITCODE -ne 0) { throw "docker build failed" }
        & docker push ($Image + ":latest")
        if ($LASTEXITCODE -ne 0) { throw "docker push failed" }
        & docker push ($Image + ":" + $Tag)
        if ($LASTEXITCODE -ne 0) { throw "docker push failed" }
    }
    finally {
        Pop-Location
    }
}

Build-And-Push "web-host" "web-app/host" "tanej666/cinema-frontend-host" @{
    VITE_REMOTE_MOVIES       = $vars.VITE_REMOTE_MOVIES
    VITE_REMOTE_USERS        = $vars.VITE_REMOTE_USERS
    VITE_REMOTE_SCREENINGS   = $vars.VITE_REMOTE_SCREENINGS
    VITE_REMOTE_RESERVATIONS = $vars.VITE_REMOTE_RESERVATIONS
}

$gw = $vars.VITE_API_GATEWAY_WEB
$mfes = @(
    @{ n = "web-movies";       c = "web-app/movies";       i = "tanej666/cinema-frontend-movies" },
    @{ n = "web-users";        c = "web-app/users";        i = "tanej666/cinema-frontend-users" },
    @{ n = "web-screenings";   c = "web-app/screenings";   i = "tanej666/cinema-frontend-screenings" },
    @{ n = "web-reservations"; c = "web-app/reservations"; i = "tanej666/cinema-frontend-reservations" }
)
foreach ($mfe in $mfes) {
    Build-And-Push $mfe.n $mfe.c $mfe.i @{ VITE_API_GATEWAY_WEB = $gw }
}

Write-Host ""
Write-Host "Done. Pin tag in cluster:" -ForegroundColor Green
Write-Host "  .\openshift\scripts\set-image-tag.ps1 -Tag $Tag"
Write-Host "  oc apply -k openshift/"
