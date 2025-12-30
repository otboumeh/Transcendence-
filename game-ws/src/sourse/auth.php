<?php

require_once __DIR__ . '/../../vendor/autoload.php';

function handleAuth($webSocket, $conn, $body) {
    error_log(print_r($body));
    $conn->authToken = $body['token'] ?? null;
    if (!$conn->authToken) {
        $conn->send(json_encode(['type'=>'auth-failed','reason'=>'missing token']));
        $conn->close();
        return;
    }
    try {
        $secretKey = null;
        if (file_exists('/run/secrets/jwt_secret')) {
            $secretKey = trim(file_get_contents('/run/secrets/jwt_secret'));
        } else {
            $secretKey = getenv('JWTsecretKey');
        }
        
        if ($secretKey === false || empty($secretKey)) {
            error_log('FATAL: JWT_SECRET_KEY no está configurada');
            $conn->send(json_encode(['type' => 'auth-failed', 'reason' => 'server configuration error']));
            $conn->close();
            return;
        }

        try {
            $decoded = \Firebase\JWT\JWT::decode($conn->authToken, new \Firebase\JWT\Key($secretKey, 'HS256'));
            $conn->userId = $decoded->data->user_id ?? null;
            
            if (!$conn->userId) {
                $conn->send(json_encode(['type' => 'auth-failed', 'reason' => 'invalid token - no user_id']));
                $conn->close();
                return;
            }
        } catch (\Exception $e) {
            error_log('JWT decode error: ' . $e->getMessage());
            $conn->send(json_encode(['type' => 'auth-failed', 'reason' => 'invalid token', 'error' => $e->getMessage()]));
            $conn->close();
            return;
        }
        
        $conn->auth = true;
        $conn->userName = $body['username'] ?? null;
        $conn->status = 'online';
        $webSocket->usersConns[$conn->userId] = $conn;
        $conn->send(json_encode(['type' => 'auth-ok', 'userId' => $conn->userId, 'username' => $conn->userName]));
        
        if (function_exists('broadcastUserStatus')) {
            broadcastUserStatus($webSocket, $conn->userId, $conn->userName, 'online');
        }
    } catch (\Exception $e) {
        error_log('Auth error: ' . $e->getMessage());
        $conn->send(json_encode(['type' => 'auth-failed', 'reason' => 'internal error', 'error' => $e->getMessage()]));
        $conn->close();
    }
}

?>