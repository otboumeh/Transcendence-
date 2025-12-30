<?php

require_once __DIR__ . '/header.php';

$database = connectDatabase();
$requestMethod = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true);
$user_id = $body['user_id'] ?? NULL;

if ($requestMethod != 'POST')
	errorSend(405, 'Method Not Allowed');
if (!is_numeric($user_id))
	errorSend(403, 'Bad petition');
 
doQuery($database, "UPDATE users SET is_online = 0 WHERE user_id = :id", [':id', $user_id, SQLITE3_INTEGER]);
successSend('Logged out successfully');

exit;

/*
	por parte del backend solo actualizo la variable is_online a 0
	la gestion importante del logout se realiza en el frontend borrando
	los items de localStorage
*/

?>
