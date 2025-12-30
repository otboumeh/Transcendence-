# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine

# Instalar wget para testing/healthchecks
RUN apk add --no-cache wget

# Crear directorios necesarios
RUN mkdir -p /etc/ssl /etc/nginx/auth
RUN mkdir -p /tmp/nginx/conf.d /tmp/nginx/snippets
RUN chmod 755 /etc/nginx/conf.d /etc/nginx/snippets

# Borra default y copia tu config
RUN rm -rf /etc/nginx/conf.d/*
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/conf.d/ /etc/nginx/conf.d/

# Copia el script de inicialización
COPY docker/nginx/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Puerto HTTP y HTTPS
EXPOSE 80 443

# Usa el script de inicialización como punto de entrada
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
