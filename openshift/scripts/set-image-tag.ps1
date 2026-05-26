# Updates openshift/kustomization.yaml image newTag for all cinema images.
param(
    [string]$Tag = ""
)

$ErrorActionPreference = "Stop"
$OpenShiftDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$Kustomization = Join-Path $OpenShiftDir "kustomization.yaml"
$EnvFile = Join-Path $OpenShiftDir "image-tag.env"

if (-not $Tag) {
    if (Test-Path $EnvFile) {
        Get-Content $EnvFile | ForEach-Object {
            $line = $_.Trim()
            if ($line -match "^CINEMA_IMAGE_TAG=(.+)$") {
                $Tag = $Matches[1].Trim()
            }
        }
    }
}
if (-not $Tag) {
    $Tag = "latest"
}

$images = @(
    "docker.io/tanej666/cinema-movies-service",
    "docker.io/tanej666/cinema-users-service",
    "docker.io/tanej666/cinema-users-worker",
    "docker.io/tanej666/cinema-screenings-service",
    "docker.io/tanej666/cinema-reservations-service",
    "docker.io/tanej666/cinema-api-gateway-web",
    "docker.io/tanej666/cinema-api-gateway-mobile",
    "docker.io/tanej666/cinema-frontend-host",
    "docker.io/tanej666/cinema-frontend-movies",
    "docker.io/tanej666/cinema-frontend-users",
    "docker.io/tanej666/cinema-frontend-screenings",
    "docker.io/tanej666/cinema-frontend-reservations"
)

Push-Location $OpenShiftDir
try {
    foreach ($img in $images) {
        & kustomize edit set image "${img}=${img}:$Tag"
        if ($LASTEXITCODE -ne 0) {
            throw "kustomize edit failed for $img"
        }
    }
    Write-Host "Set all image tags to: $Tag" -ForegroundColor Green
    Write-Host "Apply with: oc apply -k openshift/"
}
finally {
    Pop-Location
}
