#!/bin/sh
# Weave Scope entrypoint con fix de permisos para Docker socket

# Verificar si el socket existe
if [ -e /var/run/docker.sock ]; then
    # Intentar cambiar permisos del socket (puede fallar si no tenemos privilegios)
    chmod 666 /var/run/docker.sock 2>/dev/null || true
    echo "Docker socket permissions adjusted"
fi

# Ejecutar el comando original de Weave Scope
exec /home/weave/entrypoint.sh "$@"
