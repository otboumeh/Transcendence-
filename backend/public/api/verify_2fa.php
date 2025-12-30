<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // permite cualquier origen
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/header.php';
require_once __DIR__ . '/../../vendor/autoload.php';

$database = connectDatabase();
$requestMethod = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true);

if ($requestMethod != 'POST')
	errorSend(405, 'unauthorized method');
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === false)
	errorSend(415, 'unsupported media type');
if (!is_array($body))
	errorSend(400, 'invalid json');
if (!checkBodyData($body, 'code', 'id'))
	errorSend(400, 'Bad request. Missing fields');

$code = $body['code'];
$user_id = $body['id'];

$stmt_select = 'SELECT user_id, code, created_at, time_to_expire_mins, attempts_left FROM twofa_codes WHERE user_id = :user_id';
$bind1 = [':user_id', $user_id, SQLITE3_INTEGER];
$result_select = doQuery($database, $stmt_select, $bind1);
if (!$result_select)
	errorSend(500, "SQLite Error: " . $database->lastErrorMsg());
$row = $result_select->fetchArray(SQLITE3_ASSOC);
if (!$row)
	errorSend(401, 'invalid credentials1');

if ($row['attempts_left'] <= 0)
{
	delete_row($database, $user_id);
	errorSend(401, 'too many invalid attempts');
}

$currentTime = new DateTime();
$createdAt = new DateTime($row['created_at']);
$diff_secs =  $currentTime->getTimestamp() - $createdAt->getTimestamp();
if ($diff_secs > $row['time_to_expire_mins'] * 60)
{
	delete_row($database, $user_id);
	errorSend(401, 'code is too old =>' . $diff_secs . ' .max time: ' . $row['time_to_expire_mins'] * 60);
}

if (!hash_equals($row['code'], $code))
{
	decrease_attempts_left($database, $user_id, $row['attempts_left']);
	errorSend(401, 'invalid credentials2');
}

$issuer = 'http://localhost:8081';
$audience = 'http://localhost:8081';
$issuedAt = time(); // timestamp Unix
$expire = $issuedAt + 3600; // el token expira en 1 hora (3600 segundos)
$payload = ['iss' => $issuer, 'aud' => $audience, 'iat' => $issuedAt, 'exp' => $expire, 'data' => ['user_id' => $user_id]]; // 'data' => para añadir datos personalizados
$secretKey = getenv('JWTsecretKey'); //necesitamos getenv para leer la variable de entorno
$secretKey = getJWTsecret();

$jwt = Firebase\JWT\JWT::encode($payload, $secretKey, 'HS256'); // Codificamos el payload para generar el string del JWT, usando el algoritmo HS256

doQuery($database, "UPDATE users SET is_online = 1 WHERE user_id = :id", [':id', $user_id, SQLITE3_INTEGER]);
successSend('Login successful.', 200, $jwt);

function delete_row(SQLite3 $database, int $user_id): void
{
	$stmt_delete = $database->prepare('DELETE FROM twofa_codes WHERE user_id = :user_id');
	$stmt_delete->bindValue(':user_id', $user_id, SQLITE3_INTEGER);
	if (!$stmt_delete->execute())
		errorSend(500, "SQLite Error: " . $database->lastErrorMsg());
}

function decrease_attempts_left(SQLite3 $database, int $user_id, int $attempts_left): void
{
	$stmt_update = $database->prepare('UPDATE twofa_codes SET attempts_left = :attempts WHERE user_id = :user_id');
	$stmt_update->bindValue(':user_id', $user_id, SQLITE3_INTEGER);
	$stmt_update->bindValue(':attempts', $attempts_left - 1, SQLITE3_INTEGER);
	if (!$stmt_update->execute())
		errorSend(500, "SQLite Error: " . $database->lastErrorMsg());
}

/*
	esta es la segunda parte del login (2fa) la cual va a comprobar
	en la db que la peticion de 2fa exista, comprueba el codigo de la api
	y setea el usuario a is_online = 1
*/

?>
