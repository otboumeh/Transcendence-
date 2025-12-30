#!/bin/sh
set -e

# Verificar y cargar Docker secrets para las variables de entorno
if [ -f "/run/secrets/app_key" ]; then
  export APP_KEY=$(cat /run/secrets/app_key)
  echo "Secret APP_KEY cargado desde Docker secrets"
else
  echo "ADVERTENCIA: Secret app_key no encontrado"
fi

if [ -f "/run/secrets/jwt_secret" ]; then
  export JWTsecretKey=$(cat /run/secrets/jwt_secret)
  echo "Secret JWTsecretKey cargado desde Docker secrets"
else
  echo "ADVERTENCIA: Secret jwt_secret no encontrado"
fi

# Ejecutar comando original
exec "$@"