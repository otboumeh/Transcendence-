<?php

require_once __DIR__ . '/header.php';

$database = connectDatabase();
$requestMethod = $_SERVER['REQUEST_METHOD'];

if ($requestMethod !== 'GET') {
    errorSend(405, 'Method not allowed');
}

$username = isset($_GET['user']) ? trim($_GET['user']) : '';

if (empty($username)) {
    errorSend(400, 'Username required');
}

// Buscar el user_id por username
$sqlQuery = "SELECT user_id FROM users WHERE username = :username";
$bind = [':username', $username, SQLITE3_TEXT];

$res = doQuery($database, $sqlQuery, $bind);
if (!$res) {
    errorSend(500, "Sql error: " . $database->lastErrorMsg());
}

$row = $res->fetchArray(SQLITE3_ASSOC);

if (!$row) {
    errorSend(404, 'User not found');
}

successSend(['user_id' => (int)$row['user_id']]);

?>
