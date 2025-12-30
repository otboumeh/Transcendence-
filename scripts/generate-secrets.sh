#!/bin/bash

# Script para generar secretos para la aplicación
# Debe ejecutarse desde el directorio raíz del proyecto

# Colores para la salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directorio de secretos
SECRETS_DIR="config/secrets"

# Verificar si el directorio existe, si no, crearlo
if [ ! -d "$SECRETS_DIR" ]; then
    echo -e "${YELLOW}Creando directorio de secretos...${NC}"
    mkdir -p "$SECRETS_DIR"
fi

echo -e "${BLUE}Generando secretos para la aplicación...${NC}"

# 1. Generar app_key (Laravel-style key base64)
echo -e "${YELLOW}Generando APP_KEY...${NC}"
APP_KEY=$(openssl rand -base64 32)
echo "base64:$APP_KEY" > "$SECRETS_DIR/app_key.secret"
echo -e "${GREEN}APP_KEY generada y guardada en $SECRETS_DIR/app_key.secret${NC}"

# 2. Generar JWT Secret (base64 más largo)
echo -e "${YELLOW}Generando JWT_SECRET...${NC}"
JWT_SECRET=$(openssl rand -base64 64)
echo "base64:$JWT_SECRET" > "$SECRETS_DIR/jwt_secret.secret"
echo -e "${GREEN}JWT_SECRET generado y guardado en $SECRETS_DIR/jwt_secret.secret${NC}"

# 3. Generar credenciales de Grafana
echo -e "${YELLOW}Generando credenciales para Grafana...${NC}"
# Usuario administrador de Grafana
GRAFANA_USER="admin"
# Contraseña aleatoria
GRAFANA_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=' | cut -c1-16)

echo "$GRAFANA_USER" > "$SECRETS_DIR/grafana_admin_user.secret"
echo "$GRAFANA_PASSWORD" > "$SECRETS_DIR/grafana_admin_password.secret"

echo -e "${GREEN}Credenciales de Grafana generadas y guardadas:${NC}"
echo -e "${BLUE}Usuario:${NC} $GRAFANA_USER"
echo -e "${BLUE}Contraseña:${NC} $GRAFANA_PASSWORD"

# 4. Generar archivo htpasswd para Weave Scope
echo -e "${YELLOW}Generando credenciales para Weave Scope...${NC}"
SCOPE_USER="scopeadmin"
SCOPE_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=' | cut -c1-16)

# Generar hash htpasswd (dependiendo de si htpasswd está disponible)
if command -v htpasswd &> /dev/null; then
    htpasswd -bc "$SECRETS_DIR/scope_htpasswd.secret" "$SCOPE_USER" "$SCOPE_PASSWORD"
else
    # Incluir un valor predeterminado si no se puede generar
    echo "$SCOPE_USER:\$apr1\$4VdneVYO\$Bxf6kdldOiG.juIgIGvH61" > "$SECRETS_DIR/scope_htpasswd.secret"
    SCOPE_PASSWORD="ChangeThisPassword!"
    echo -e "${YELLOW}Advertencia: htpasswd no está disponible. Se ha usado una contraseña predeterminada.${NC}"
fi

echo -e "${GREEN}Credenciales de Weave Scope generadas y guardadas:${NC}"
echo -e "${BLUE}Usuario:${NC} $SCOPE_USER"
echo -e "${BLUE}Contraseña:${NC} $SCOPE_PASSWORD"

# Establecer permisos correctos para los archivos de secretos
echo -e "${YELLOW}Estableciendo permisos para los secretos...${NC}"
# Los secretos deben ser legibles por los contenedores (644) pero solo escribibles por el propietario
chmod 644 "$SECRETS_DIR"/*
echo -e "${GREEN}Permisos establecidos (644 - legibles por contenedores)${NC}"

echo -e "${GREEN}¡Todos los secretos han sido generados correctamente!${NC}"
echo -e "${YELLOW}Importante:${NC} Estos secretos son sensibles. No los comparta ni los suba a control de versiones."