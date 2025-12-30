#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes de estado
print_status() {
    echo -e "${YELLOW}[*] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[✓] $1${NC}"
}

print_error() {
    echo -e "${RED}[✗] $1${NC}"
}

# Verificar requisitos del sistema
check_requirements() {
    print_status "Verificando requisitos del sistema..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado"
        exit 1
    fi
    
    # Verificar Docker Compose
    if ! command -v docker compose &> /dev/null; then
        print_error "Docker Compose no está instalado"
        exit 1
    fi
    
    print_success "Requisitos del sistema verificados"
}

# Configurar directorios necesarios
setup_directories() {
    print_status "Configurando directorios..."
    
    # Crear directorios necesarios si no existen
    mkdir -p backend/srcs/database
    mkdir -p config/ssl
    mkdir -p config/cloudflare
    mkdir -p logs/nginx
    
    # Si existen archivos en scripts/certs, moverlos a config/ssl
    if [ -d "scripts/certs" ] && [ "$(ls -A scripts/certs 2>/dev/null)" ]; then
        print_status "Moviendo certificados a la nueva ubicación..."
        cp -r scripts/certs/* config/ssl/
    fi
    
    # Si existen archivos en scripts/cloudflare, moverlos a config/cloudflare
    if [ -d "scripts/cloudflare" ] && [ "$(ls -A scripts/cloudflare 2>/dev/null)" ]; then
        print_status "Moviendo configuración de Cloudflare a la nueva ubicación..."
        cp -r scripts/cloudflare/* config/cloudflare/
    fi
    
    print_success "Directorios configurados"
}

# Generar archivos de entorno si no existen
setup_env_files() {
    print_status "Configurando archivos de entorno..."
    
    # Verificar y crear .env si no existe
    if [ ! -f ".env" ]; then
        cp .env.example .env 2>/dev/null || touch .env
        print_success "Archivo .env creado"
    fi
    
    # Generar secretos si no existen
    if [ ! -d "config/secrets" ] || [ "$(ls -A config/secrets 2>/dev/null | wc -l)" -eq 0 ]; then
        print_status "Generando secretos para la aplicación..."
        bash ./scripts/generate-secrets.sh
        print_success "Secretos generados correctamente"
    else
        print_status "Secretos ya existentes, no se regenerarán"
    fi
    
    print_success "Archivos de entorno configurados"
}

# Inicializar la base de datos
init_database() {
    print_status "Inicializando base de datos..."
    
    if [ -f "backend/srcs/database/schema.sql" ]; then
        print_success "Esquema de base de datos encontrado"
    else
        print_error "No se encontró el esquema de base de datos"
        exit 1
    fi
}

# Función principal
main() {
    print_status "Iniciando configuración del proyecto Transcendence..."
    
    check_requirements
    setup_directories
    setup_env_files
    init_database
    
    # Ejecutar make init para completar la instalación
    print_status "Ejecutando make init..."
    make init
    
    print_success "¡Configuración completada!"
    print_status "Puedes iniciar el proyecto con: make up"
}

# Ejecutar la función principal
main