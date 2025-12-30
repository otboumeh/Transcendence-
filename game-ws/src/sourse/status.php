<?php

require_once __DIR__ . '/../../vendor/autoload.php';


function broadcastUserStatus($webSocket, $userId, $userName, $status) {
    $message = json_encode([
        'type' => 'user-status-changed',
        'userId' => $userId,
        'username' => $userName,
        'status' => $status, // online, offline, in-game
        'timestamp' => time()
    ]);

    foreach ($webSocket->client as $client) {
        if ($client->auth) {
            $client->send($message);
        }
    }
}

function handleGetOnlineUsers($webSocket, $conn) {
    if (!$conn->auth) {
        $conn->send(json_encode(['type' => 'error', 'message' => 'unauthorized']));
        return;
    }
    
    $onlineUsers = [];
    foreach ($webSocket->usersConns as $userId => $userConn) {
        $onlineUsers[] = [
            'userId' => $userId,
            'username' => $userConn->userName ?? 'Unknown',
            'status' => $userConn->status ?? 'online'
        ];
    }
    
    $conn->send(json_encode([
        'type' => 'online-users',
        'users' => $onlineUsers,
        'count' => count($onlineUsers)
    ]));
}

function handleSetStatus($webSocket, $conn, $body) {
    if (!$conn->auth) {
        $conn->send(json_encode(['type' => 'error', 'message' => 'unauthorized']));
        return;
    }
    
    $newStatus = $body['status'] ?? null;
    $validStatuses = ['online', 'in-game', 'away'];
    
    if (!$newStatus || !in_array($newStatus, $validStatuses)) {
        $conn->send(json_encode([
            'type' => 'error', 
            'message' => 'invalid status',
            'valid_statuses' => $validStatuses
        ]));
        return;
    }
    
    $conn->status = $newStatus;
    broadcastUserStatus($webSocket, $conn->userId, $conn->userName, $newStatus);
    $conn->send(json_encode([
        'type' => 'status-changed',
        'status' => $newStatus
    ]));
}

?>
