#!/usr/bin/env bash
# Se ejecuta una sola vez, al crear el volumen de mysql-sbx.
# Crea el usuario administrador que usa la API para aprovisionar sandboxes:
# solo gestiona usuarios y las bases sbx_*, nunca tiene acceso como root.
set -euo pipefail

docker_process_sql <<-EOSQL
  CREATE USER '${SBX_ADMIN_USER}'@'%' IDENTIFIED BY '${SBX_ADMIN_PASSWORD}';
  GRANT ALL PRIVILEGES ON \`sbx\_%\`.* TO '${SBX_ADMIN_USER}'@'%' WITH GRANT OPTION;
  GRANT CREATE USER, CONNECTION_ADMIN, PROCESS ON *.* TO '${SBX_ADMIN_USER}'@'%';
EOSQL
