# syntax=docker/dockerfile:1

# Stage 1: Dependencies
FROM composer:2 AS composer
WORKDIR /app
COPY backend/composer.* ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --optimize-autoloader

# Stage 2: Production
FROM php:8.2-fpm-alpine AS production

# Instalar solo dependencias necesarias en una sola capa
RUN apk add --no-cache \
    sqlite-dev \
    && docker-php-ext-install -j$(nproc) pdo pdo_sqlite \
    && rm -rf /tmp/* /var/cache/apk/*

# Configurar directorio de trabajo
WORKDIR /var/www/html

# Copiar dependencias desde stage de composer
COPY --from=composer /app/vendor ./vendor

# Copiar archivos del proyecto
COPY backend/ .

# Copiar script de entrypoint
COPY docker/backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Crear directorios necesarios y ajustar permisos de forma segura
RUN mkdir -p /var/www/html/public/api/auth/gmail_api \
    /var/www/html/database \
    && chmod -R 755 /var/www/html/public/api/auth/gmail_api \
    && chmod -R 755 /var/www/html/database

# Generar autoloader optimizado desde composer stage
COPY --from=composer /usr/bin/composer /usr/bin/composer
RUN composer dump-autoload --optimize --no-dev \
    && rm /usr/bin/composer

# Configurar PHP-FPM optimizado
RUN echo -e "[global]\n\
pid = /run/php-fpm.pid\n\
error_log = /proc/self/fd/2\n\
log_level = notice\n\
daemonize = no\n\
\n\
[www]\n\
user = root\n\
group = root\n\
listen = 9000\n\
listen.owner = root\n\
listen.group = root\n\
\n\
pm = dynamic\n\
pm.max_children = 10\n\
pm.start_servers = 2\n\
pm.min_spare_servers = 1\n\
pm.max_spare_servers = 3\n\
pm.max_requests = 500\n\
pm.process_idle_timeout = 10s\n\
\n\
pm.status_path = /status\n\
ping.path = /ping\n\
ping.response = pong\n\
\n\
access.log = /proc/self/fd/2\n\
access.format = \"%R - %u %t \\\"%m %r\\\" %s\"\n\
\n\
catch_workers_output = yes\n\
decorate_workers_output = no\n\
\n\
php_admin_value[error_log] = /proc/self/fd/2\n\
php_admin_flag[log_errors] = on\n\
php_value[session.save_handler] = files\n\
php_value[session.save_path] = /tmp\n\
php_value[upload_max_filesize] = 10M\n\
php_value[post_max_size] = 10M\n\
php_value[max_execution_time] = 30\n\
php_value[memory_limit] = 128M" > /usr/local/etc/php-fpm.d/www.conf

# Configuración PHP optimizada
RUN echo -e "opcache.enable=1\n\
opcache.memory_consumption=128\n\
opcache.interned_strings_buffer=8\n\
opcache.max_accelerated_files=4000\n\
opcache.revalidate_freq=60\n\
opcache.fast_shutdown=1" > /usr/local/etc/php/conf.d/opcache.ini

EXPOSE 9000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["php-fpm", "-F", "--allow-to-run-as-root"]
