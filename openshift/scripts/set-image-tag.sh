#!/usr/bin/env bash
# Updates openshift/kustomization.yaml image newTag for all cinema images.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENSHIFT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
KUSTOMIZATION="$OPENSHIFT_DIR/kustomization.yaml"
ENV_FILE="$OPENSHIFT_DIR/image-tag.env"

TAG="${1:-}"
if [[ -z "$TAG" && -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  TAG="${CINEMA_IMAGE_TAG:-}"
fi
TAG="${TAG:-latest}"

IMAGES=(
  docker.io/tanej666/cinema-movies-service
  docker.io/tanej666/cinema-users-service
  docker.io/tanej666/cinema-users-worker
  docker.io/tanej666/cinema-screenings-service
  docker.io/tanej666/cinema-reservations-service
  docker.io/tanej666/cinema-api-gateway-web
  docker.io/tanej666/cinema-api-gateway-mobile
  docker.io/tanej666/cinema-frontend-host
  docker.io/tanej666/cinema-frontend-movies
  docker.io/tanej666/cinema-frontend-users
  docker.io/tanej666/cinema-frontend-screenings
  docker.io/tanej666/cinema-frontend-reservations
)

cd "$OPENSHIFT_DIR"
for img in "${IMAGES[@]}"; do
  kustomize edit set image "${img}=${img}:${TAG}"
done

echo "Set all image tags to: ${TAG}"
echo "Apply with: oc apply -k openshift/"
