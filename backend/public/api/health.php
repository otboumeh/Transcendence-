<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$db_status = 'unknown';
try {
    $db_path = __DIR__ . '/../../database/transcendence.db';
    if (file_exists($db_path)) {
        $db = new SQLite3($db_path);
        $result = $db->query('SELECT 1');
        if ($result) {
            $db_status = 'ok';
        }
        $db->close();
    } else {
        $db_status = 'database_file_not_found';
    }
} catch (Exception $e) {
    $db_status = 'error: ' . $e->getMessage();
}

$response = [
    'status' => 'healthy',
    'service' => 'transcendence-backend',
    'timestamp' => date('Y-m-d H:i:s'),
    'database' => $db_status,
    'php_version' => phpversion()
];

http_response_code(200);
echo json_encode($response, JSON_PRETTY_PRINT);
/*
    endpoint hecho por parsero que retorna status de operatividad
    del backend / base de datos
*/