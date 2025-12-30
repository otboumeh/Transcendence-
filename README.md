# 🚀 Guía de Inicio del Sistema Transcendence

## 🎯 Referencia Rápida

| Acción | Comando | Descripción |
|--------|---------|-------------|
| **Iniciar desde cero (primera vez)** | `make init` | Configura e inicia todo automáticamente |
| **Iniciar servicios** | `make up` | Levanta todos los servicios configurados |
| **Detener servicios** | `make down` | Para todos los servicios |
| **Ver logs** | `make logs` | Muestra logs en tiempo real |
| **Validar servicios** | `bash scripts/validate-services.sh` | Verifica que todo funciona (23 tests) |
| **Resetear a CERO** | `make clean-all && make init` | Limpieza total y reinicio |
| **Ver todos los comandos** | `make` o `make help` | Muestra menú de ayuda |

## 🌐 URLs de Acceso Rápido

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **Frontend** | https://localhost:9443 | - |
| **Grafana** | http://localhost:3001/grafana | `admin` / ver `config/secrets/grafana_admin_password.secret` |
| **Prometheus** | http://localhost:9090 | - |
| **Weave Scope** | http://localhost:9584 | `admin` / ver `config/secrets/scope_htpasswd.secret` |
| **cAdvisor** | http://localhost:8081/cadvisor | - |

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Docker** (versión 20.10 o superior)
- **Docker Compose** (versión 2.0 o superior)
- **Git**
- **Make**
- Conexión a Internet (para descargar imágenes Docker)

---

## 🎯 Inicio Rápido (Primera Vez)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/PIPEFD/Transcendence.git
cd Transcendence
```

### 2. Verificar la Rama

Asegúrate de estar en la rama `main` (rama estable):

```bash
git checkout main
git pull origin main
```

### 3. Inicializar el Entorno Completo

Este comando hace **TODO** lo necesario automáticamente:

```bash
make init
```

**¿Qué hace `make init`?**
- ✅ Crea todas las carpetas necesarias
- ✅ Genera certificados SSL auto-firmados
- ✅ Crea secretos de Docker (JWT, claves, passwords)
- ✅ Configura el archivo `.env` del backend
- ✅ Construye y levanta todos los contenedores
- ✅ Inicia servicios de monitoreo

**Tiempo estimado**: 3-5 minutos (dependiendo de la descarga de imágenes)

---

## 🌐 Acceder a la Aplicación

Una vez que todos los servicios estén levantados:

### **Aplicación Principal**
- 🎮 **Frontend**: https://localhost:9443
  - *Nota: Acepta el certificado auto-firmado en tu navegador*

### **Servicios de Monitoreo**
- 📊 **Grafana**: http://localhost:3001/grafana
  - Usuario: `admin`
  - Contraseña: Ver en `config/secrets/grafana_admin_password.secret`

- 📈 **Prometheus**: http://localhost:9090
  - Acceso directo sin autenticación

- 🔍 **Weave Scope**: http://localhost:9584
  - Visualización de topología de contenedores
  - Usuario: `admin`
  - Contraseña: Ver en `config/secrets/scope_htpasswd.secret`

- 📦 **cAdvisor**: http://localhost:8081/cadvisor
  - Métricas de contenedores Docker

---

## 🔍 Verificar que Todo Funciona

### Comprobar Servicios

```bash
# Ver estado de todos los contenedores
docker ps

# Ver logs en tiempo real
make logs

# Validar todos los servicios (script completo)
bash scripts/validate-services.sh
```

**Resultado esperado**: 23/23 pruebas exitosas ✅

### Verificar Puertos Publicados

```bash
make ports
```

---

## � Empezar Completamente desde CERO

Si necesitas resetear todo el sistema a su estado inicial (útil para resolver problemas o empezar limpio):

### Opción 1: Reset Completo (Recomendado)

```bash
# 1. Detener todos los servicios
make down

# 2. Limpieza total (contenedores, volúmenes, archivos temporales)
make clean-all

# 3. Volver a inicializar desde cero
make init
```

### Opción 2: Reset Paso a Paso

```bash
# 1. Detener todos los contenedores
docker compose -f compose/docker-compose.yml down

# 2. Eliminar volúmenes de Docker
docker volume rm $(docker volume ls -q | grep transcendence) 2>/dev/null || true

# 3. Limpiar imágenes y contenedores huérfanos
docker system prune -af --volumes

# 4. Eliminar archivos generados
rm -rf config/ssl/*.pem
rm -rf config/secrets/*
rm -rf logs/nginx/*
rm -rf backend/vendor
rm -rf frontend/node_modules
rm -rf game-ws/vendor

# 5. Eliminar archivos de configuración temporal
rm -f backend/.env
rm -f .env

# 6. Volver a inicializar
make init
```

### Opción 3: Reset Ultra-Limpio (Nuclear ⚛️)

**⚠️ CUIDADO: Esto eliminará TODO incluyendo datos de usuario**

```bash
# 1. Detener Docker
sudo systemctl stop docker

# 2. Limpiar todo Docker
sudo rm -rf /var/lib/docker/volumes/*
sudo systemctl start docker

# 3. En el directorio del proyecto
cd /home/pipe/Transcendence
git checkout main
git pull origin main

# 4. Limpiar archivos locales no rastreados
git clean -fdx

# 5. Restaurar permisos
chmod +x scripts/*.sh

# 6. Inicializar desde cero
make init
```

### ¿Cuándo usar cada opción?

- **Opción 1** (`make clean-all`): Problemas generales, contenedores corruptos
- **Opción 2** (Paso a paso): Control total del proceso de limpieza
- **Opción 3** (Nuclear): Problemas graves de Docker, limpieza completa

### Verificar que todo está limpio

Antes de reinicializar, verifica:

```bash
# No debe haber contenedores del proyecto
docker ps -a | grep transcendence

# No debe haber volúmenes del proyecto
docker volume ls | grep transcendence

# No debe haber redes del proyecto
docker network ls | grep transcendence

# Verificar archivos de secretos
ls -la config/secrets/

# Verificar certificados
ls -la config/ssl/
```

**Resultado esperado**: Todos los comandos anteriores no deben mostrar nada relacionado con Transcendence.

---

## 🔄 Actualizar desde Git (git pull)

### Después de hacer `git pull origin main`:

```bash
# 1. Revisar qué cambió
git log -5 --oneline

# 2. Detener servicios actuales
make down

# 3. Si hay cambios en Docker o configuración
make clean-all

# 4. Reinicializar (esto detecta cambios automáticamente)
make init

# 5. Validar que todo funciona
bash scripts/validate-services.sh
```

### Si hay conflictos con archivos locales:

```bash
# Ver archivos en conflicto
git status

# Opción A: Descartar cambios locales (usar versión remota)
git checkout main
git reset --hard origin/main

# Opción B: Guardar cambios locales temporalmente
git stash
git pull origin main
git stash pop  # Recuperar tus cambios

# Después de resolver conflictos
make clean-all
make init
```

### Flujo de trabajo recomendado para actualizaciones:

```bash
# 1. Asegurarse de estar en main
git checkout main

# 2. Guardar trabajo actual si es necesario
git stash

# 3. Actualizar código
git pull origin main

# 4. Reset y reinicio limpio
make clean-all && make init

# 5. Verificar funcionamiento
bash scripts/validate-services.sh

# 6. Si todo OK, recuperar cambios guardados (si los había)
git stash pop
```

### ¿Cuándo necesitas reset después de git pull?

| Cambios en... | Necesitas Reset? | Comando |
|---------------|------------------|---------|
| `README.md`, docs | ❌ No | Nada |
| `scripts/*.sh` | ⚠️ Tal vez | `make restart` |
| `docker-compose.yml` | ✅ Sí | `make down && make up` |
| `Dockerfile`, nginx configs | ✅ Sí | `make clean-all && make init` |
| `config/`, certificados | ✅ Sí | `make clean-all && make init` |

---

## �🛠️ Comandos Principales

### Gestión Básica

```bash
# Ver todos los comandos disponibles
make

# Iniciar servicios (si ya están configurados)
make up

# Detener servicios
make down

# Reiniciar servicios
make restart

# Ver logs de todos los servicios
make logs
```

### Modos de Ejecución

```bash
# Modo Producción (optimizado)
make up-prod

# Modo Desarrollo (con puertos directos)
make up-dev
  # Frontend: http://localhost:9280
  # Backend: http://localhost:9380
  # Game-WS: http://localhost:9480

# Solo Monitoreo
make up-monitoring
```

### Servicios Individuales

```bash
make up-frontend    # Solo frontend
make up-backend     # Solo backend
make up-game        # Solo game WebSocket
make up-nginx       # Solo nginx
```

### Weave Scope (Visualización)

```bash
make scope-up       # Iniciar Weave Scope
make scope-down     # Detener Weave Scope
make scope-restart  # Reiniciar Weave Scope
make scope-logs     # Ver logs de Weave Scope
```

---

## 🧹 Limpieza y Reset

### Limpieza Parcial

```bash
# Limpiar archivos temporales y node_modules
make cleanup-files

# Limpiar contenedores e imágenes sin usar
make clean
```

### Limpieza Total (CUIDADO ⚠️)

```bash
# Reset completo: elimina contenedores, volúmenes y archivos
make clean-all

# Después de un clean-all, volver a inicializar:
make init
```

### Reset del Entorno Docker

```bash
# Elimina contenedores, volúmenes, redes y secretos
make reset-env

# Después del reset, volver a inicializar:
make init
```

---

## 🐛 Solución de Problemas

### Problema: Puertos en Uso

```bash
# Verificar qué está usando los puertos
make check-ports

# Solución: Cambiar puertos en .env o detener el servicio conflictivo
sudo lsof -i :9443  # Ver qué usa el puerto 9443
```

### Problema: Certificados SSL

Si ves errores de certificados:

```bash
# Regenerar certificados
bash scripts/make-certs.sh

# Reiniciar nginx
docker restart transcendence-nginx
```

### Problema: Servicios No Inician

```bash
# Ver logs detallados de un servicio específico
docker logs transcendence-frontend
docker logs transcendence-backend
docker logs transcendence-nginx

# Reconstruir contenedores sin cache
make rebuild
make up
```

### Problema: Base de Datos

```bash
# Verificar que el archivo de BD existe
ls -la backend/srcs/database/

# Si no existe, crear estructura:
make backend-setup
```

### Problema: Permisos

```bash
# Arreglar permisos de secretos
chmod 700 config/secrets/
chmod 600 config/secrets/*

# Arreglar permisos de logs
sudo chown -R $USER:$USER logs/
```

### Problema: "No puedo hacer make init"

Si `make init` falla:

```bash
# 1. Verificar que Make está instalado
make --version

# 2. Verificar que Docker está corriendo
docker ps

# 3. Verificar que los scripts tienen permisos de ejecución
chmod +x scripts/*.sh

# 4. Intentar inicialización manual paso a paso
bash scripts/init-env.sh
bash scripts/make-certs.sh
bash scripts/generate-secrets.sh
make up
```

### Problema: "El sistema estaba funcionando pero dejó de funcionar"

Recuperación rápida:

```bash
# 1. Ver qué contenedores están caídos
docker ps -a | grep transcendence

# 2. Ver logs del contenedor problemático
docker logs <container_name>

# 3. Reiniciar solo ese servicio
docker restart <container_name>

# O reiniciar todo
make restart
```

### Problema: "Después de git pull hay conflictos"

```bash
# 1. Guardar cambios locales
git stash

# 2. Actualizar desde remoto
git pull origin main

# 3. Si hay problemas con archivos generados
make clean-all
make init

# 4. Recuperar cambios importantes (si los había)
git stash pop
```

### Problema: "Docker sin espacio en disco"

```bash
# Ver uso de disco de Docker
docker system df

# Limpiar todo lo no utilizado
docker system prune -a --volumes

# Si aún hay problemas, reset completo
make clean-all
sudo docker system prune -a --volumes -f
make init
```

---

## 📁 Estructura de Directorios Importantes

```
Transcendence/
├── backend/                  # API PHP backend
│   └── public/api/          # Endpoints de la API
├── frontend/                # SPA TypeScript
│   ├── src/                 # Código fuente
│   └── dist/                # Archivos compilados
├── game-ws/                 # Servidor WebSocket
├── nginx/                   # Configuración Nginx
│   ├── conf.d/             # Server blocks
│   └── nginx.conf          # Configuración principal
├── config/                  # Configuraciones
│   ├── ssl/                # Certificados SSL
│   └── secrets/            # Docker secrets
├── compose/                 # Docker Compose
│   └── docker-compose.yml  # Definición de servicios
├── monitoring/             # Prometheus/Grafana
├── scripts/                # Scripts de utilidad
│   ├── init-env.sh        # Inicialización
│   ├── make-certs.sh      # Generación de certs
│   ├── validate-services.sh # Validación
│   └── cleanup-files.sh   # Limpieza
└── logs/                   # Logs de aplicación
```

---

## 🔐 Seguridad

### Certificados SSL

Los certificados auto-firmados son **solo para desarrollo**.

Para producción:
1. Obtén certificados válidos (Let's Encrypt)
2. Colócalos en `config/ssl/`
3. Reinicia nginx: `docker restart transcendence-nginx`

### Secretos

Todos los secretos están en `config/secrets/`:
- `jwt_secret.secret` - Clave JWT
- `app_key.secret` - Clave de aplicación
- `grafana_admin_password.secret` - Password de Grafana
- `scope_htpasswd.secret` - Auth para Weave Scope

**NO** subir estos archivos a Git (ya están en `.gitignore`)

---

## 📊 Validación Completa

Para asegurar que todo funciona correctamente:

```bash
bash scripts/validate-services.sh
```

**Debe mostrar**:
```
╔════════════════════════════════════════════════════════╗
║   VALIDACIÓN COMPLETA DE SERVICIOS - TRANSCENDENCE    ║
╚════════════════════════════════════════════════════════╝

...

╔════════════════════════════════════════════════════════╗
║                    RESUMEN FINAL                       ║
╚════════════════════════════════════════════════════════╝

  Total de pruebas:     23
  ✓ Exitosas:          23
  ✗ Fallidas:          0

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    🎉 TODOS LOS SERVICIOS FUNCIONANDO CORRECTAMENTE  
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎓 Notas para 42 Campus

Este proyecto está configurado para funcionar dentro de las restricciones de red del campus 42:

- ✅ Todos los puertos externos están en el rango 9100-9500
- ✅ Servicios de monitoreo en localhost solamente
- ✅ Sin dependencias de servicios cloud externos
- ✅ Configuración de puertos centralizada en `.env`

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `make logs`
2. Valida servicios: `bash scripts/validate-services.sh`
3. Consulta la documentación en `docs/`
4. Revisa issues en GitHub

---

## ✅ Checklist de Inicio Exitoso

- [ ] Docker y Docker Compose instalados
- [ ] Repositorio clonado
- [ ] `make init` ejecutado sin errores
- [ ] Todos los contenedores corriendo (`docker ps`)
- [ ] Frontend accesible en https://localhost:9443
- [ ] Script de validación: 23/23 tests OK
- [ ] Grafana accesible y funcionando
- [ ] Weave Scope mostrando topología

**¡Listo! Tu sistema Transcendence está operativo! 🚀**
