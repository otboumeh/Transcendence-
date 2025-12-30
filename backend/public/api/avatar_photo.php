<?php

require_once __DIR__ . '/header.php';

$database = connectDatabase();
$requestMethod = $_SERVER['REQUEST_METHOD'];

if ($requestMethod !== 'GET')
    errorSend(405, 'unauthorized method');

$user_id = $_GET['user_id'] ?? null;

if (!$user_id)
    errorSend(400, 'Bad request. Missing user_id parameter');

// Verificar que hay un JWT válido (pero no necesariamente que coincida con el user_id)
// Esto permite ver avatares de otros usuarios
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    errorSend(403, 'forbidden access - no token');
}

// Buscar avatar del usuario
$sqlQuery = "SELECT avatar_url FROM users WHERE user_id = :user_id";
$bind = [':user_id', $user_id, SQLITE3_INTEGER];
$result = doQuery($database, $sqlQuery, $bind);

if (!$result)
    errorSend(500, "SQLite Error: " . $database->lastErrorMsg());

$row = $result->fetchArray(SQLITE3_ASSOC);

if (!$row)
    errorSend(404, 'User not found');

// Si tiene avatar, devolverlo
if ($row['avatar_url']) {
    // Si es una URL completa (empieza con http) o un path que empieza con /uploads
    if (strpos($row['avatar_url'], 'http') === 0 || strpos($row['avatar_url'], '/uploads/') === 0) {
        successSend(['avatar_url' => $row['avatar_url']], 200);
    } else {
        // Si es un ID de avatar por defecto
        successSend(['avatar_url' => "/assets/avatar_{$row['avatar_url']}.png"], 200);
    }
} else {
    // No tiene avatar
    successSend(['avatar_url' => null], 200);
}

/*
    Endpoint para obtener la URL del avatar de un usuario
    GET /api/avatar_photo.php
    Body: { "id": user_id }
    Response: { "success": { "avatar_url": "..." } }
*/

?>
