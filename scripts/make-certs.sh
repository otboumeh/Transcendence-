#!/usr/bin/env bash
set -e

# Directorio para certificados SSL
SSL_DIR="config/ssl"
mkdir -p "$SSL_DIR"

# Generar certificados
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
 -keyout "$SSL_DIR/privkey.pem" \
 -out "$SSL_DIR/fullchain.pem" \
 -subj "/C=ES/ST=Madrid/L=Madrid/O=42/OU=dev/CN=localhost"

# Generar parámetros DH
openssl dhparam -out "$SSL_DIR/dhparam.pem" 2048

# Establecer permisos correctos (644 para que nginx pueda leer desde el volumen read-only)
chmod 644 "$SSL_DIR/privkey.pem"
chmod 644 "$SSL_DIR/fullchain.pem"
chmod 644 "$SSL_DIR/dhparam.pem"

echo "✅ Permisos establecidos: 644 (lectura para nginx en volumen read-only)"

# Crear enlaces simbólicos para compatibilidad
mkdir -p nginx/certs
ln -sf "../../$SSL_DIR/privkey.pem" nginx/certs/privkey.pem
ln -sf "../../$SSL_DIR/fullchain.pem" nginx/certs/fullchain.pem
ln -sf "../../$SSL_DIR/dhparam.pem" nginx/certs/dhparam.pem

echo "✅ Certificados generados en $SSL_DIR/"
