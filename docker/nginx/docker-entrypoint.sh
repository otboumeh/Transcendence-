#!/bin/sh
# Script para inyectar variables de entorno en los archivos de configuración de Nginx
# Este script se ejecutará antes de iniciar Nginx

# Lista de variables para reemplazar en los archivos de configuración
VARS="FRONTEND_PORT BACKEND_PORT GAME_WS_PORT GAME_WS_CONTAINER_PORT PROMETHEUS_PORT GRAFANA_PORT GRAFANA_CONTAINER_PORT CADVISOR_PORT SCOPE_PORT"

# Directorios donde buscar archivos de configuración
echo "Iniciando procesamiento de variables de entorno en configuraciones..."

# Crear directorio temporal para archivos procesados
TEMP_DIR="/tmp/nginx-config"
mkdir -p "$TEMP_DIR/conf.d"

# Solo procesar archivos en conf.d (snippets deben quedar estáticos)
for conf_file in /etc/nginx/conf.d/*.conf; do
  if [ -f "$conf_file" ]; then
    echo "Procesando $conf_file"
    
    filename=$(basename "$conf_file")
    temp_file="$TEMP_DIR/$filename"
    
    # Usar envsubst para reemplazar variables de forma segura
    envsubst "$(printf '${%s} ' $VARS)" < "$conf_file" > "$temp_file"
    
    # Mostrar qué variables se reemplazaron
    for var in $VARS; do
      value=$(eval echo \$$var)
      if [ -n "$value" ]; then
        echo "  - \${$var} = $value"
      fi
    done
    
    # Mover el archivo procesado de vuelta
    mv "$temp_file" "$conf_file"
  fi
done

# Limpiar directorio temporal
rm -rf "$TEMP_DIR"

echo "Procesamiento de variables completado."

# Manejar Docker secrets
echo "Configurando secrets de Docker si están disponibles..."
if [ -f "/run/secrets/scope_htpasswd" ]; then
  echo "Secret scope_htpasswd encontrado - Configurando para Basic Auth de Scope"
  # El archivo ya está montado en la ubicación correcta
else
  echo "¡Advertencia! Secret scope_htpasswd no encontrado"
fi

# Fix SSL permissions (nginx corre como root en alpine, pero necesitamos permisos de lectura)
echo "Fixing SSL file permissions..."
if [ -f "/etc/ssl/privkey.pem" ]; then
    chmod 644 /etc/ssl/privkey.pem 2>/dev/null || echo "Warning: Could not change privkey permissions"
    chmod 644 /etc/ssl/fullchain.pem 2>/dev/null || echo "Warning: Could not change fullchain permissions"
    chmod 644 /etc/ssl/dhparam.pem 2>/dev/null || echo "Warning: Could not change dhparam permissions"
    echo "SSL file permissions set to 644 (readable)"
else
    echo "Warning: SSL files not found at /etc/ssl/"
fi

# Finalmente, ejecuta el comando original de Nginx
echo "Iniciando Nginx..."
exec "$@"