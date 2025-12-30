# 🚀 Transcendence System Startup Guide

## 🎯 Quick Reference

| Action | Command | Description |
|--------|---------|-------------|
| **Start from scratch (first time)** | `make init` | Configures and starts everything automatically |
| **Start services** | `make up` | Starts all configured services |
| **Stop services** | `make down` | Stops all services |
| **View logs** | `make logs` | Shows real-time logs |
| **Validate services** | `bash scripts/validate-services.sh` | Verifies everything is working (23 tests) |
| **Reset to ZERO** | `make clean-all && make init` | Total cleanup and restart |
| **View all commands** | `make` o `make help` | Shows help menu |

## 🌐 Quick Access URLs

| Service | URL | Credentials |
|----------|-----|--------------|
| **Frontend** | https://localhost:9443 | - |
| **Grafana** | http://localhost:3001/grafana | `admin` / see `config/secrets/grafana_admin_password.secret` |
| **Prometheus** | http://localhost:9090 | - |
| **Weave Scope** | http://localhost:9584 | `admin` / see `config/secrets/scope_htpasswd.secret` |
| **cAdvisor** | http://localhost:8081/cadvisor | - |

---

## 📋 Prerequisites

Before starting, make sure you have installed:

- **Docker** (versión 20.10 or higher)
- **Docker Compose** (versión 2.0 or higher)
- **Git**
- **Make**
- Internet connection (to download Docker images)

---

## 🎯 Quick Start (First Time)

### 1. Clone the Repository

```bash
git clone https://github.com/PIPEFD/Transcendence.git
cd Transcendence
```

### 2. Verify the Branch

Ensure you are on the `main` branch (stable branch):

```bash
git checkout main
git pull origin main
```

### 3. Initialize the Full Environment

This command does **EVERYTHING** necessary automatically:

```bash
make init
```

**What does `make init`do?**
-✅ Creates all necessary folders
-✅ Generates self-signed SSL certificates
-✅ Creates Docker secrets (JWT, keys, passwords)
-✅ Configures the backend `.env` file
-✅ Builds and starts all containers
-✅ Starts monitoring services

**Estimated time**: 3-5 minutes (depending on image downloads)

---

## 🌐 Accessing the Application

Once all services are up:

### **Main Application*
- 🎮 **Frontend**: https://localhost:9443
  - *Note: Accept the self-signed certificate in your browser*

### **Monitoring Services**
- 📊 **Grafana**: http://localhost:3001/grafana
  - User: `admin`
  - Password: See `config/secrets/grafana_admin_password.secret`

- 📈 **Prometheus**: http://localhost:9090
  - Direct access without authentication

- 🔍 **Weave Scope**: http://localhost:9584
  - Visualización de topología de contenedores
  - User: `admin`
  - Password: See `config/secrets/scope_htpasswd.secret`

- 📦 **cAdvisor**: http://localhost:8081/cadvisor
  - Docker container metrics

---

## 🔍 Verify Everything Works

### Check Services

```bash
# Check status of all containers
docker ps

# View real-time logs
make logs

# Validate all services (full script)
bash scripts/validate-services.sh
```

**Expected result**: 23/23 successful tests ✅

### Verify Published Ports

```bash
make ports
```

---

## 💥 Start Completely from ZERO

If you need to reset the entire system to its initial state (useful for solving problems or starting fresh):

### Option 1: Complete Reset (Recommended)

```bash
# 1. Stop all services
make down

# 2. Total cleanup (containers, volumes, temp files)
make clean-all

# 3. Re-initialize from scratch
make init
```

### Option 2: Step-by-Step Reset

```bash
# 1. Stop all containers
docker compose -f compose/docker-compose.yml down

# 2. Remove Docker volumes
docker volume rm $(docker volume ls -q | grep transcendence) 2>/dev/null || true

# 3. Clean orphaned images and containers
docker system prune -af --volumes

# 4. Remove generated files
rm -rf config/ssl/*.pem
rm -rf config/secrets/*
rm -rf logs/nginx/*
rm -rf backend/vendor
rm -rf frontend/node_modules
rm -rf game-ws/vendor

# 5. Remove temporary config files
rm -f backend/.env
rm -f .env

# 6. Re-initialize
make init
```

### Option 3: Ultra-Clean Reset (Nuclear ⚛️)

**⚠️ WARNING: This will delete EVERYTHING including user data**

```bash
# 1. Stop Docker
sudo systemctl stop docker

# 2. Clean all Docker volumes
sudo rm -rf /var/lib/docker/volumes/*
sudo systemctl start docker

# 3. In the project directory
cd /home/pipe/Transcendence
git checkout main
git pull origin main

# 4. Clean untracked local files
git clean -fdx

# 5. Restore permissions
chmod +x scripts/*.sh

# 6. Initialize from scratch
make init
```

### When to use each option?

- **Option 1** (`make clean-all`): General issues, corrupt containers.
- **Option 2** (Paso a paso): Total control over the cleaning process.
- **Option 3** (Nuclear): Severe Docker issues, complete wipe.

### Verify clean state

Before re-initializing, verify:

```bash
# Should be no project containers
docker ps -a | grep transcendence

# Should be no project volumes
docker volume ls | grep transcendence

# Should be no project networks
docker network ls | grep transcendence

# Verify secrets files
ls -la config/secrets/

# Verify certificates
ls -la config/ssl/
```

**Expected result*: The commands above should not show anything related to Transcendence.

---

## 🛠️ Main Commands

### Basic Management

```bash
# View all available commands
make

# Start services (if already configured)
make up

# Stop services
make down

# Restart services
make restart

# View logs for all services
make logs
```

## Execution Modes

```bash
# Production Mode (optimized)make up-prod

# Development Mode (with direct ports)
make up-dev
  # Frontend: http://localhost:9280
  # Backend: http://localhost:9380
  # Game-WS: http://localhost:9480

# Monitoring Only
make up-monitoring
```

### Individual Services

```bash
make up-frontend    # Frontend only
make up-backend     # Backend only
make up-game        # Game WebSocket only
make up-nginx       # Nginx only
```

### Weave Scope (Visualization)

```bash
make scope-up       # Iniciar Weave Scope
make scope-down     # Detener Weave Scope
make scope-restart  # Reiniciar Weave Scope
make scope-logs     # Ver logs de Weave Scope
```

---

## 🧹 Cleaning & Reset

### Partial Cleaning

```bash
#  Clean temporary files and node_modules
make cleanup-files

# Clean unused containers and images
make clean
```

### Total Cleaning (WARNING ⚠️)

```bash
# Complete reset: removes containers, volumes, and files
make clean-all

# After a clean-all, re-initialize:
make init
```

### Docker Environment Reset

```bash
# Removes containers, volumes, networks, and secrets
make reset-env

# After the reset, re-initialize:
make init
```

---

## 🐛 Troubleshooting

### Problema: Puertos en Uso

```bash
# Verify what is using the ports
make check-ports

# Solution: Change ports in .env or stop conflicting service
sudo lsof -i :9443  # Ver qué usa el puerto 9443
```

### Issue: SSL Certificates

If you see certificate errors:

```bash
# Regenerate certificates
bash scripts/make-certs.sh

# Restart nginx
docker restart transcendence-nginx
```

### Issue: Services Do Not Start

```bash
# View detailed logs for a specific service
docker logs transcendence-frontend
docker logs transcendence-backend
docker logs transcendence-nginx

# Rebuild containers without cache
make rebuild
make up
```

### Issue: Database

```bash
# Verify DB file exists
ls -la backend/srcs/database/

# If it doesn't exist, create structure:
make backend-setup
```

### Issue: Permissions

```bash
# Fix secret permissions
chmod 700 config/secrets/
chmod 600 config/secrets/*

# Fix log permissions
sudo chown -R $USER:$USER logs/
```



📁 Important Directory Structure
```
Transcendence/
├── backend/                  # API PHP backend
│   └── public/api/          # Endpoints de la API
├── frontend/                # SPA TypeScript
│   ├── src/                 # Source code
│   └── dist/                # Compiled files
├── game-ws/                 # WebSocket Server
├── nginx/                   # Nginx Configuration
│   ├── conf.d/             # Server blocks
│   └── nginx.conf          # Main configuration
├── config/                  # Configurations
│   ├── ssl/                # SSL Certificates
│   └── secrets/            # Docker secrets
├── compose/                 # Docker Compose
│   └── docker-compose.yml  # Services definition
├── monitoring/             # Prometheus/Grafana
├── scripts/                # Utility Scripts
│   ├── init-env.sh        # Initialization
│   ├── make-certs.sh      # Cert generation
│   ├── validate-services.sh # Validationn
│   └── cleanup-files.sh   # Cleanup
└── logs/                   # Application logs
```

---

## 🔐 Security

### Certificados SSL

Self-signed certificates are for development only.

For production:
1. Obtain valid certificates (Let's Encrypt).
2. Place them in`config/ssl/`
3. Restart nginx: `docker restart transcendence-nginx`

### Secrets

All secrets are in `config/secrets/`:
- `jwt_secret.secret` - Clave JWT
- `app_key.secret` - App Key
- `grafana_admin_password.secret` - PGrafana Password
- `scope_htpasswd.secret` - Weave Scope Auth

DO NOT upload these files to Git (they are already in`.gitignore`)

---
## 👥 Project Team

This project was brought to life by the following team members:

| Role | User | GitHub Profile |
|------|------|----------------|
| **Frontend** | `otboumeh` | [otboumeh](https://github.com/otboumeh) |
| **Frontend** | `veragarc` | [veragarc](https://github.com/VeraGD) |
| **Backend** | `adlopez-` | [adlopez-](https://github.com/3ebd52c6de2f) |
| **Docker/DevOps** | `Dbonilla` | [Dbonilla](https://github.com/PIPEFD) |
