# syntax=docker/dockerfile:1

# Stage 1: Composer dependencies
FROM composer:2 AS composer
WORKDIR /app
COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-scripts --prefer-dist --optimize-autoloader \
    && composer clear-cache

# Stage 2: Production
FROM php:8.2-cli-alpine AS production

WORKDIR /app

# Instalar dependencias de compilación y extensiones necesarias
RUN apk add --no-cache --virtual .build-deps \
    $PHPIZE_DEPS \
    linux-headers \
    libzip-dev \
    && docker-php-ext-install -j$(nproc) sockets zip \
    && apk del .build-deps \
    && apk add --no-cache libzip \
    && rm -rf /tmp/* /var/cache/apk/*

# Copiar dependencias desde composer stage
COPY --from=composer /app/vendor ./vendor

# Crear usuario no privilegiado
RUN adduser -D -u 1001 -h /app gameuser \
    && chown -R gameuser:gameuser /app

# Copiar código fuente
COPY --chown=gameuser:gameuser . /app/

# Cambiar al usuario no root
USER gameuser

EXPOSE 8080

CMD ["php", "src/sourse/server.php"]
