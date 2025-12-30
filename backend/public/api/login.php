<?php
require_once __DIR__ . '/header.php';
require_once __DIR__ . '/gmail_api/mail_gmail.php';

$database = connectDatabase();
$requestMethod = $_SERVER['REQUEST_METHOD'];

if ($requestMethod !== 'POST')
    errorSend(405, 'unauthorized method');

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body))
    errorSend(400, 'invalid json');

if (!checkBodyData($body, 'username', 'pass'))
    errorSend(400, 'Bad request. Missing fields');

$username = $body['username'];
$passwordSent = $body['pass'];

$sqlQuery = "SELECT user_id, pass, email FROM users WHERE username = :username";
$bind1 = [':username', $username, SQLITE3_TEXT];
$res1 = doQuery($database, $sqlQuery, $bind1);

if (!$res1)
    errorSend(500, "SQLite Error: " . $database->lastErrorMsg());

$row = $res1->fetchArray(SQLITE3_ASSOC);
if (!$row)
    errorSend(401, 'Invalid username or password');

$user_id = $row['user_id'];
$passwordStored = $row['pass'];
$email = $row['email'];

if (!password_verify($passwordSent, $passwordStored))
    errorSend(401, 'Invalid username or password');

// ⚠️ MODO TEST: Usuarios que empiecen con "testuser" no requieren 2FA
if (strpos($username, 'testuser') === 0) {
    // Generar JWT directamente para usuarios de prueba
    require_once __DIR__ . '/../../vendor/autoload.php';
    
    $issuer = 'http://localhost:8081';
    $audience = 'http://localhost:8081';
    $issuedAt = time();
    $expire = $issuedAt + 3600; // 1 hora
    $payload = [
        'iss' => $issuer,
        'aud' => $audience,
        'iat' => $issuedAt,
        'exp' => $expire,
        'data' => ['user_id' => $user_id]
    ];
    
    $secretKey = getJWTSecret();
    $jwt = Firebase\JWT\JWT::encode($payload, $secretKey, 'HS256');
    
    // Marcar usuario como online
    doQuery($database, "UPDATE users SET is_online = 1 WHERE user_id = :id", [':id', $user_id, SQLITE3_INTEGER]);
    
    // Devolver token directamente (sin 2FA)
    echo json_encode([
        'success' => 'Login successful (test mode)',
        'details' => $jwt,
        'user_id' => $user_id,
        'test_mode' => true
    ]);
    exit;
}

// Flujo normal con 2FA para usuarios regulares
$stmt_delete = $database->prepare('DELETE FROM twofa_codes WHERE user_id = :user_id');
$stmt_delete->bindValue(':user_id', $user_id, SQLITE3_INTEGER);
if (!$res_delete = $stmt_delete->execute())
    errorSend(500, "SQLite Error: " . $database->lastErrorMsg());

$two_fa_code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

$stmt_insert = $database->prepare('INSERT OR REPLACE INTO twofa_codes (user_id, code) VALUES (:user_id, :code)');
$stmt_insert->bindValue(':user_id', $user_id, SQLITE3_INTEGER);
$stmt_insert->bindValue(':code', $two_fa_code, SQLITE3_TEXT);
if ($stmt_insert->execute() === false)
    errorSend(500, 'couldn`t insert two_fa_code');

if (!sendMailGmailAPI($user_id, $email, $two_fa_code))
    errorSend(500, 'couldn\'t send mail with Gmail API');
echo json_encode(['pending_2fa' => true, 'user_id' => $user_id]);
exit;
/*
    en esta primera parte del login se comprobaran las credenciales
    basicas (nombre de usuario y contrasenha) para retornar el valor 1
    en pending_2fa y enviar un correo con la API de google [gmail]
*/

?>
