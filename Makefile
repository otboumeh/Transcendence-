# ======================================
# Transcendence - Makefile Simplificado
# ======================================

# Variables de configuración
COMPOSE      := docker compose -f ./compose/docker-compose.yml --profile default
COMPOSE_DEV  := docker compose -f ./compose/docker-compose.yml --profile dev
COMPOSE_PROD := docker compose -f ./compose/docker-compose.yml --profile prod
COMPOSE_MON  := docker compose -f ./compose/docker-compose.yml --profile monitoring
COMPOSE_WAF  := docker compose -f ./compose/docker-compose.yml --profile waf
COMPOSE_TEST := docker compose -f ./compose/docker-compose.yml --profile test
COMPOSE_ELK  := docker compose -f ./compose/docker-compose.yml --profile elk
COMPOSE_SCOPE := docker compose -f ./compose/docker-compose.yml --profile scope-host
COMPOSE_ALL  := docker compose -f ./compose/docker-compose.yml --profile default --profile monitoring

# Rutas importantes
CONFIG_DIR   := ./config
SSL_DIR      := $(CONFIG_DIR)/ssl
SCRIPTS_DIR  := ./scripts
LOGS_DIR     := ./logs

# Colores para output
RED    := \033[0;31m
GREEN  := \033[0;32m
YELLOW := \033[1;33m
BLUE   := \033[0;34m
CYAN   := \033[0;36m
WHITE  := \033[1;37m
RESET  := \033[0m

# Variables para Weave Scope
COMPOSE_SCOPE_HOST  := docker compose -f ./compose/docker-compose.yml --profile scope-host
COMPOSE_SCOPE_BRIDGE := docker compose -f ./compose/docker-compose.yml --profile scope-bridge

# Regla por defecto
.DEFAULT_GOAL := help

# Mensaje de ayuda
help:
	@echo ""
	@echo -e "$(BLUE)╔════════════════════════════════════════════╗$(RESET)"
	@echo -e "$(BLUE)║      TRANSCENDENCE - PANEL DE CONTROL      ║$(RESET)"
	@echo -e "$(BLUE)╚════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo -e "$(CYAN)COMANDOS BÁSICOS:$(RESET)"
	@echo -e "  $(GREEN)make$(RESET)              Muestra esta ayuda"
	@echo -e "  $(GREEN)make init$(RESET)         Inicializa el entorno completo (primera vez)"
	@echo -e "  $(GREEN)make up$(RESET)           Inicia todos los servicios (perfil default)"
	@echo -e "  $(GREEN)make up-full$(RESET)      Inicia servicios + monitoreo completo"
	@echo -e "  $(GREEN)make up-dev$(RESET)       Inicia servicios en modo desarrollo (puertos directos)"
	@echo -e "  $(GREEN)make up-prod$(RESET)      Inicia servicios en modo producción"
	@echo -e "  $(GREEN)make up-monitoring$(RESET) Inicia servicios de monitorización"
	@echo -e "  $(GREEN)make scope-up$(RESET)     Inicia solo Weave Scope"
	@echo -e "  $(GREEN)make down$(RESET)         Detiene todos los servicios"
	@echo -e "  $(GREEN)make restart$(RESET)      Reinicia todos los servicios"
	@echo -e "  $(GREEN)make logs$(RESET)         Muestra los logs de todos los servicios"
	@echo -e "  $(GREEN)make status$(RESET)       Muestra el estado de todos los servicios"
	@echo -e "  $(GREEN)make ports$(RESET)        Muestra los puertos efectivos publicados"
	@echo ""
	@echo -e "$(CYAN)SERVICIOS INDIVIDUALES:$(RESET)"
	@echo -e "  $(GREEN)make up-frontend$(RESET)  Inicia solo el frontend"
	@echo -e "  $(GREEN)make up-backend$(RESET)   Inicia solo el backend"
	@echo -e "  $(GREEN)make up-game$(RESET)      Inicia solo el servicio de juego"
	@echo -e "  $(GREEN)make up-nginx$(RESET)     Inicia solo el servidor nginx"
	@echo ""
	@echo -e "$(CYAN)FUNCIONES DE DESARROLLO:$(RESET)"
	@echo -e "  $(GREEN)make build$(RESET)        Construye todos los servicios"
	@echo -e "  $(GREEN)make rebuild$(RESET)      Reconstruye sin cache"
	@echo -e "  $(GREEN)make test$(RESET)         Ejecuta pruebas automáticas"
	@echo -e "  $(GREEN)make test-docker$(RESET)  Ejecuta tests con Docker"
	@echo -e "  $(GREEN)make up-waf$(RESET)       Inicia el Web Application Firewall"
	@echo -e "  $(GREEN)make reset$(RESET)        Limpia completamente el entorno (elimina datos)"
	@echo -e "  $(GREEN)make cleanup-files$(RESET) Elimina archivos temporales e innecesarios"
	@echo -e "  $(GREEN)make clean-all$(RESET)    Limpieza total (reset + eliminación de archivos temporales)"
	@echo ""
	@echo -e "$(CYAN)MONITORIZACIÓN Y MÉTRICAS:$(RESET)"
	@echo -e "  $(GREEN)make metrics$(RESET)      Muestra estadísticas de recursos de contenedores"
	@echo -e "  $(GREEN)make exporters-check$(RESET) Verifica que los exporters funcionan"
	@echo -e "  $(GREEN)make prometheus-ui$(RESET) Abre la UI de Prometheus"
	@echo -e "  $(GREEN)make grafana-ui$(RESET)   Abre la UI de Grafana"
	@echo -e "  $(GREEN)make scope-up$(RESET)     Inicia Weave Scope (modo host)"
	@echo -e "  $(GREEN)make scope-bridge-up$(RESET) Inicia Weave Scope (modo bridge)"
	@echo -e "  $(GREEN)make scope-down$(RESET)   Detiene Weave Scope"
	@echo -e "  $(GREEN)make scope-restart$(RESET) Reinicia Weave Scope"
	@echo -e "  $(GREEN)make scope-logs$(RESET)   Muestra logs de Weave Scope"
	@echo ""
	@echo -e "$(CYAN)MANTENIMIENTO:$(RESET)"
	@echo -e "  $(GREEN)make clean$(RESET)        Elimina contenedores e imágenes sin usar"
	@echo -e "  $(GREEN)make reset$(RESET)        Reinicia el entorno eliminando datos (¡cuidado!)"
	@echo -e "  $(GREEN)make reset-env$(RESET)    Reset completo del entorno usando script"
	@echo -e "  $(GREEN)make check-ports$(RESET)  Verifica la disponibilidad de puertos"
	@echo ""

# Inicialización del entorno completo
init: create-dirs generate-secrets create-certs create-env up
	@echo -e "$(GREEN)✓ Entorno inicializado y servicios iniciados$(RESET)"

# Generación de secretos
generate-secrets:
	@echo -e "$(YELLOW)Generando secretos...$(RESET)"
	@bash scripts/generate-secrets.sh

# Creación de directorios
create-dirs:
	@echo -e "$(YELLOW)Creando estructura de directorios...$(RESET)"
	@mkdir -p $(CONFIG_DIR)/ssl
	@mkdir -p $(CONFIG_DIR)/auth
	@mkdir -p $(CONFIG_DIR)/secrets
	@mkdir -p $(CONFIG_DIR)/cloudflare/certs
	@mkdir -p $(LOGS_DIR)/nginx
	@mkdir -p ./backend/srcs/database
	@mkdir -p ./backend/srcs/public/api/uploads
	@mkdir -p ./waf/logs
	@chmod 700 $(CONFIG_DIR)/secrets
	@echo -e "$(YELLOW)Creando directorio frontend/dist...$(RESET)"
	@rm -rf ./frontend/dist 2>/dev/null || true
	@mkdir -p ./frontend/dist
	@echo -e "$(GREEN)✓ Directorio dist creado (permisos se gestionan en el contenedor)$(RESET)"

# Creación de certificados SSL usando el script dedicado
create-certs: create-dirs
	@echo -e "$(YELLOW)Generando certificados SSL...$(RESET)"
	@bash $(SCRIPTS_DIR)/make-certs.sh

# Regla de inicialización
init: init-env create-certs create-dirs backend-setup

# Configuración inicial del entorno
init-env:
	@echo -e "$(YELLOW)Configurando entorno inicial...$(RESET)"
	@bash $(SCRIPTS_DIR)/init-env.sh

# Configuración del backend
backend-setup:
	@echo -e "$(YELLOW)Configurando el backend...$(RESET)"
	@if [ ! -f backend/.env ]; then \
		echo -e "$(YELLOW)Creando archivo .env para el backend...$(RESET)"; \
		echo "JWT_SECRET=$$(cat config/secrets/jwt_secret.secret 2>/dev/null || openssl rand -base64 32)" > backend/.env; \
		echo "JWT_EXPIRATION=86400" >> backend/.env; \
		echo "DB_CONNECTION=sqlite" >> backend/.env; \
		echo "DB_DATABASE=/var/www/database/database.sqlite" >> backend/.env; \
		echo "FRONTEND_PORT=3000" >> backend/.env; \
		echo "BACKEND_PORT=9000" >> backend/.env; \
		echo "GAME_WS_PORT=8081" >> backend/.env; \
		echo "SSL_CERT=/config/ssl/fullchain.pem" >> backend/.env; \
		echo "SSL_KEY=/config/ssl/privkey.pem" >> backend/.env; \
		echo "SSL_DHPARAM=/config/ssl/dhparam.pem" >> backend/.env; \
		echo -e "$(GREEN)✓ Archivo .env creado$(RESET)"; \
	else \
		echo -e "$(GREEN)✓ Archivo .env ya existe$(RESET)"; \
	fi

# Iniciar todos los servicios (perfil default)
up:
	@echo -e "$(YELLOW)Iniciando servicios (perfil default)...$(RESET)"
	@$(COMPOSE) up -d --remove-orphans
	@echo -e "$(GREEN)✓ Servicios iniciados correctamente$(RESET)"
	@echo -e "$(BLUE)Accede a la aplicación en: $(WHITE)https://localhost:${NGINX_HTTPS_PORT:-9443}$(RESET)"

# Iniciar servicios en modo desarrollo
up-dev:
	@echo -e "$(YELLOW)Iniciando servicios en modo desarrollo...$(RESET)"
	@$(COMPOSE_DEV) up -d --remove-orphans
	@echo -e "$(GREEN)✓ Servicios de desarrollo iniciados correctamente$(RESET)"
	@echo -e "$(BLUE)Accede a la aplicación en: $(WHITE)https://localhost:9443$(RESET)"
	@echo -e "$(BLUE)Frontend directo: $(WHITE)http://localhost:9280$(RESET)"
	@echo -e "$(BLUE)Backend directo: $(WHITE)http://localhost:9380$(RESET)"
	@echo -e "$(BLUE)Game WebSocket directo: $(WHITE)http://localhost:9480$(RESET)"
	
# Iniciar servicios de monitorización
up-monitoring:
	@echo -e "$(YELLOW)Iniciando servicios de monitorización...$(RESET)"
	@$(COMPOSE_MON) up -d --remove-orphans
	@echo -e "$(GREEN)✓ Servicios de monitorización iniciados correctamente$(RESET)"
	@echo -e "$(BLUE)Prometheus: $(WHITE)http://localhost:${PROMETHEUS_PORT:-9090}$(RESET)"
	@echo -e "$(BLUE)Grafana: $(WHITE)http://localhost:${GRAFANA_PORT:-3001}$(RESET)"
	@echo -e "$(BLUE)cAdvisor: $(WHITE)http://localhost:${CADVISOR_PORT:-8081}/cadvisor$(RESET)"

# Iniciar servicios en modo producción
up-prod:
	@echo -e "$(YELLOW)Iniciando servicios en modo producción...$(RESET)"
	@$(COMPOSE_PROD) up -d --remove-orphans
	@echo -e "$(GREEN)✓ Servicios de producción iniciados correctamente$(RESET)"
	@echo -e "$(BLUE)Accede a la aplicación en: $(WHITE)https://localhost:${NGINX_HTTPS_PORT:-9443}$(RESET)"

# Iniciar todos los servicios con monitoreo completo
up-full:
	@echo -e "$(YELLOW)Iniciando servicios completos (default + monitoring)...$(RESET)"
	@$(COMPOSE_ALL) up -d --remove-orphans
	@echo -e "$(GREEN)✓ Servicios completos iniciados correctamente$(RESET)"
	@echo -e "$(BLUE)Aplicación: $(WHITE)https://localhost:${NGINX_HTTPS_PORT:-9443}$(RESET)"
	@echo -e "$(BLUE)Prometheus: $(WHITE)http://localhost:${PROMETHEUS_PORT:-9090}$(RESET)"
	@echo -e "$(BLUE)Grafana: $(WHITE)http://localhost:${GRAFANA_PORT:-3001}$(RESET)"

# Iniciar servicios con WAF
up-waf:
	@echo -e "$(YELLOW)Iniciando servicios con WAF...$(RESET)"
	@$(COMPOSE_WAF) up -d
	@echo -e "$(GREEN)✓ Servicios con WAF iniciados correctamente$(RESET)"
	@echo -e "$(BLUE)WAF disponible en: $(WHITE)http://localhost:8000$(RESET) y $(WHITE)https://localhost:8443$(RESET)"

# Iniciar servicios específicos
up-frontend:
	@echo -e "$(YELLOW)Iniciando frontend...$(RESET)"
	@$(COMPOSE) up -d frontend
	@echo -e "$(GREEN)✓ Frontend disponible en: $(WHITE)http://localhost:${FRONTEND_PORT:-3000}$(RESET)"

up-backend:
	@echo -e "$(YELLOW)Iniciando backend...$(RESET)"
	@$(COMPOSE) up -d backend
	@echo -e "$(GREEN)✓ Backend iniciado en puerto: ${BACKEND_PORT:-9000}$(RESET)"

up-game:
	@echo -e "$(YELLOW)Iniciando servicio de juego...$(RESET)"
	@$(COMPOSE) up -d game-ws
	@echo -e "$(GREEN)✓ Servidor de juego disponible en puerto: ${GAME_WS_PORT:-8081}$(RESET)"

up-nginx:
	@echo -e "$(YELLOW)Iniciando servidor nginx...$(RESET)"
	@$(COMPOSE) up -d nginx
	@echo -e "$(GREEN)✓ Nginx disponible en: $(WHITE)https://localhost$(RESET)"

# Weave Scope - Visualización de topología
scope-up:
	@echo -e "$(YELLOW)>> Iniciando Weave Scope...$(RESET)"
	@$(COMPOSE_SCOPE) up -d scope
	@echo -e "$(GREEN)✓ Weave Scope iniciado correctamente$(RESET)"
	@echo -e "$(BLUE)UI local: $(WHITE)http://localhost:${SCOPE_PORT:-9584}$(RESET)"
	@echo -e "$(BLUE)Credenciales: $(WHITE)admin / [contraseña en secrets]$(RESET)"

scope-down:
	@echo -e "$(YELLOW)>> Deteniendo Weave Scope...$(RESET)"
	@$(COMPOSE_SCOPE) rm -sf scope
	@echo -e "$(GREEN)✓ Weave Scope detenido correctamente$(RESET)"

scope-restart: scope-down scope-up
	@echo -e "$(GREEN)✓ Weave Scope reiniciado correctamente$(RESET)"

scope-logs:
	@echo -e "$(YELLOW)>> Mostrando logs de Weave Scope...$(RESET)"
	@$(COMPOSE_SCOPE) logs -f scope

# Detener todos los servicios
down:
	@echo -e "$(YELLOW)Deteniendo servicios...$(RESET)"
	@$(COMPOSE) down
	@echo -e "$(GREEN)✓ Servicios detenidos$(RESET)"

# Construir todos los servicios
build:
	@echo -e "$(YELLOW)Construyendo servicios...$(RESET)"
	@$(COMPOSE) build
	@echo -e "$(GREEN)✓ Servicios construidos correctamente$(RESET)"

# Reconstruir servicios
rebuild:
	@echo -e "$(YELLOW)Reconstruyendo servicios...$(RESET)"
	@$(COMPOSE) build --no-cache
	@echo -e "$(GREEN)✓ Servicios reconstruidos correctamente$(RESET)"

# Reiniciar todos los servicios
restart: down up
	@echo -e "$(GREEN)✓ Servicios reiniciados$(RESET)"

# Ver logs de todos los servicios
logs:
	@$(COMPOSE) logs -f

# Mostrar mapeos de puertos efectivos
ports:
	@echo -e "$(YELLOW)Puertos efectivos (según docker compose port):$(RESET)"
	@echo "nginx 80 ->" && docker compose -f ./compose/docker-compose.yml port nginx 80 || true
	@echo "nginx 443 ->" && docker compose -f ./compose/docker-compose.yml port nginx 443 || true
	@echo "prometheus 9090 ->" && docker compose -f ./compose/docker-compose.yml port prometheus 9090 || true
	@echo "grafana 3000 ->" && docker compose -f ./compose/docker-compose.yml port grafana 3000 || true
	@echo "dev-frontend ->" && docker compose -f ./compose/docker-compose.yml port dev-frontend ${FRONTEND_PORT} || true
	@echo "dev-backend ->" && docker compose -f ./compose/docker-compose.yml port dev-backend ${BACKEND_PORT} || true
	@echo "dev-game-ws ->" && docker compose -f ./compose/docker-compose.yml port dev-game-ws ${GAME_WS_CONTAINER_PORT} || true

# Ver estado de los servicios
ps:
	@$(COMPOSE) ps -qa

# Ejecutar pruebas
test:
	@echo -e "$(YELLOW)Ejecutando tests...$(RESET)"
	@$(SCRIPTS_DIR)/run-tests.sh --all

# Ejecutar pruebas unitarias
test-unit:
	@echo -e "$(YELLOW)Ejecutando pruebas unitarias...$(RESET)"
	@$(SCRIPTS_DIR)/run-tests.sh --unit

# Ejecutar pruebas de integración
test-integration:
	@echo -e "$(YELLOW)Ejecutando pruebas de integración...$(RESET)"
	@$(SCRIPTS_DIR)/run-tests.sh --integration

# Limpieza de contenedores e imágenes sin usar
clean:
	@echo -e "$(YELLOW)Limpiando recursos Docker sin usar...$(RESET)"
	@docker system prune -f
	@echo -e "$(GREEN)✓ Limpieza completada$(RESET)"

# Limpieza completa del entorno
reset-env:
	@echo -e "$(RED)⚠️  RESET COMPLETO DEL ENTORNO ⚠️$(RESET)"
	@bash ./scripts/reset-environment.sh

# Limpieza de archivos temporales e innecesarios
cleanup-files:
	@echo -e "$(YELLOW)🗑️  LIMPIANDO ARCHIVOS INNECESARIOS 🗑️$(RESET)"
	@bash ./scripts/cleanup-files.sh
	
# Limpieza total (combinación de reset y cleanup-files)
clean-all: reset-env cleanup-files
	@echo -e "$(GREEN)✅ LIMPIEZA TOTAL COMPLETADA ✅$(RESET)"
	
# Verificar disponibilidad de puertos
check-ports:
	@scripts/check-ports.sh

# Reset del entorno y datos (peligroso)
reset: down
	@echo -e "$(RED)¡ADVERTENCIA! Se eliminarán todos los datos.$(RESET)"
	@read -p "¿Está seguro de que desea continuar? [s/N]: " confirm; \
	if [ "$$confirm" = "s" ] || [ "$$confirm" = "S" ]; then \
		echo -e "$(YELLOW)Eliminando datos y configuraciones...$(RESET)"; \
		rm -rf $(SSL_DIR)/*.pem; \
		rm -rf $(CONFIG_DIR)/cloudflare/certs; \
		rm -rf $(LOGS_DIR)/*; \
		echo -e "$(YELLOW)Eliminando volúmenes Docker...$(RESET)"; \
		docker system prune -f --volumes; \
		echo -e "$(GREEN)✓ Datos restablecidos. Utilice 'make init' para inicializar nuevamente.$(RESET)"; \
	else \
		echo -e "$(BLUE)Operación cancelada.$(RESET)"; \
	fi

# Marca los objetivos que no son archivos
.PHONY: help init create-dirs generate-secrets create-certs create-env up up-full up-dev up-prod up-monitoring up-waf up-frontend up-backend up-game up-nginx down build rebuild restart logs ps status metrics exporters-check prometheus-ui grafana-ui test test-unit test-integration test-docker clean reset reset-env cleanup-files clean-all check-ports scope-up scope-down scope-restart scope-logs frontend-sync

# ======================================
# Nuevos comandos de monitoreo y métricas
# ======================================

# Mostrar estado de los servicios
status:
	@echo -e "$(CYAN)═══════════════════════════════════════════════$(RESET)"
	@echo -e "$(CYAN)        ESTADO DE LOS SERVICIOS                $(RESET)"
	@echo -e "$(CYAN)═══════════════════════════════════════════════$(RESET)"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -15

# Mostrar métricas de recursos de contenedores
metrics:
	@echo -e "$(CYAN)═══════════════════════════════════════════════$(RESET)"
	@echo -e "$(CYAN)      MÉTRICAS DE RECURSOS (TIEMPO REAL)       $(RESET)"
	@echo -e "$(CYAN)═══════════════════════════════════════════════$(RESET)"
	@docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}"

# Verificar que los exporters funcionan
exporters-check:
	@echo -e "$(CYAN)═══════════════════════════════════════════════$(RESET)"
	@echo -e "$(CYAN)    VERIFICACIÓN DE EXPORTERS DE MÉTRICAS      $(RESET)"
	@echo -e "$(CYAN)═══════════════════════════════════════════════$(RESET)"
	@echo -e "$(YELLOW)Verificando nginx-exporter...$(RESET)"
	@docker exec transcendence-prometheus wget -qO- http://nginx-exporter:9113/metrics 2>/dev/null | head -3 && echo -e "$(GREEN)✓ nginx-exporter OK$(RESET)" || echo -e "$(RED)✗ nginx-exporter FAIL$(RESET)"
	@echo ""
	@echo -e "$(YELLOW)Verificando php-fpm-exporter...$(RESET)"
	@docker exec transcendence-prometheus wget -qO- http://php-fpm-exporter:9253/metrics 2>/dev/null | head -3 && echo -e "$(GREEN)✓ php-fpm-exporter OK$(RESET)" || echo -e "$(RED)✗ php-fpm-exporter FAIL$(RESET)"
	@echo ""
	@echo -e "$(YELLOW)Verificando node-exporter...$(RESET)"
	@docker exec transcendence-prometheus wget -qO- http://node-exporter:9100/metrics 2>/dev/null | head -3 && echo -e "$(GREEN)✓ node-exporter OK$(RESET)" || echo -e "$(RED)✗ node-exporter FAIL$(RESET)"
	@echo ""
	@echo -e "$(YELLOW)Verificando cadvisor...$(RESET)"
	@docker exec transcendence-prometheus wget -qO- http://cadvisor:8080/metrics 2>/dev/null | head -3 && echo -e "$(GREEN)✓ cadvisor OK$(RESET)" || echo -e "$(RED)✗ cadvisor FAIL$(RESET)"
	@echo ""
	@echo -e "$(GREEN)═══════════════════════════════════════════════$(RESET)"

# Abrir Prometheus UI
prometheus-ui:
	@echo -e "$(BLUE)Abriendo Prometheus UI...$(RESET)"
	@open http://localhost:${PROMETHEUS_PORT:-9090} 2>/dev/null || xdg-open http://localhost:${PROMETHEUS_PORT:-9090} 2>/dev/null || echo -e "$(YELLOW)URL: http://localhost:${PROMETHEUS_PORT:-9090}$(RESET)"

# Abrir Grafana UI
grafana-ui:
	@echo -e "$(BLUE)Abriendo Grafana UI...$(RESET)"
	@echo -e "$(YELLOW)Usuario: admin$(RESET)"
	@echo -e "$(YELLOW)Contraseña: Ver config/secrets/grafana_admin_password.secret$(RESET)"
	@open http://localhost:${GRAFANA_PORT:-3001} 2>/dev/null || xdg-open http://localhost:${GRAFANA_PORT:-3001} 2>/dev/null || echo -e "$(YELLOW)URL: http://localhost:${GRAFANA_PORT:-3001}$(RESET)"

# Ejecutar tests con Docker
test-docker:
	@echo -e "$(YELLOW)Construyendo imagen de tests...$(RESET)"
	@docker build -q -t transcendence-tests tests/
	@echo -e "$(YELLOW)Ejecutando tests de integración...$(RESET)"
	@docker run --rm --network host transcendence-tests pytest -v --tb=line
	@echo -e "$(GREEN)✓ Tests completados$(RESET)"

# ======================================
# DESARROLLO - SINCRONIZACIÓN FRONTEND
# ======================================

# Sincronizar cambios del frontend y recompilar
frontend-sync:
	@bash ./scripts/sync-frontend.sh
