#!/usr/bin/env bash
# Despliegue de TutorialBD en el VPS (mismo patrón que los demás proyectos de /opt/apps).
#
# Lo ejecuta GitHub Actions por SSH como comando forzado de su llave
# (authorized_keys: command="/opt/apps/tutorialbd/scripts/deploy.sh",...),
# o a mano: /opt/apps/tutorialbd/scripts/deploy.sh
#
# Actualiza el código a origin/main, reconstruye los contenedores y verifica que
# la API responda con el commit nuevo. Si la verificación falla, vuelve al commit
# anterior. Todo va dentro de main() porque git reset reescribe este mismo archivo
# mientras se ejecuta.
set -euo pipefail

main() {
  local app_dir="${APP_DIR:-/opt/apps/tutorialbd}"
  local rama="${DEPLOY_BRANCH:-main}"

  log() { echo "[deploy $(date '+%F %T')] $*"; }

  cd "$app_dir"

  exec 9>"$app_dir/.deploy.lock"
  if ! flock -n 9; then
    log "ERROR: ya hay un despliegue en curso"
    exit 1
  fi

  local anterior
  anterior="$(git rev-parse HEAD)"

  log "Actualizando código desde origin/$rama"
  git fetch --prune origin "$rama"
  git reset --hard "origin/$rama"
  local actual
  actual="$(git rev-parse HEAD)"
  log "Commit: ${anterior:0:7} -> ${actual:0:7} ($(git log -1 --format=%s))"

  construir_y_verificar() {
    export GIT_COMMIT BUILD_DATE
    GIT_COMMIT="$(git rev-parse --short=7 HEAD)"
    BUILD_DATE="$(date --iso-8601=seconds)"

    docker compose config --quiet
    docker compose up -d --build --remove-orphans

    # La API debe responder sana y con el commit recién construido
    local intento
    for intento in $(seq 1 30); do
      if docker compose exec -T api node -e "
        fetch('http://127.0.0.1:3000/api/health')
          .then(r => r.json())
          .then(s => process.exit(s.status === 'ok' && s.commit === '$GIT_COMMIT' ? 0 : 1))
          .catch(() => process.exit(1))" 2>/dev/null; then
        log "Verificación OK (commit $GIT_COMMIT)"
        return 0
      fi
      sleep 3
    done
    log "ERROR: la verificación de salud falló"
    docker compose logs --tail=40 api || true
    return 1
  }

  if construir_y_verificar; then
    docker image prune -f >/dev/null
    log "Despliegue completado"
    return 0
  fi

  if [ "$anterior" != "$actual" ]; then
    log "Revirtiendo a ${anterior:0:7}"
    git reset --hard "$anterior"
    construir_y_verificar || log "ERROR: el rollback tampoco pasó la verificación"
  fi
  exit 1
}

main "$@"
