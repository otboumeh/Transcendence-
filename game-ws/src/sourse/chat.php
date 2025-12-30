<?php

require_once __DIR__ . '/../../vendor/autoload.php';

function handleChatGlobal($webSocket, $conn, $body) {
    $message = $body['message'] ?? null;
    if (!$message)
        return ;
    foreach ($webSocket->client as $client) {
        if ($client !== $conn && $client->auth) {
            $client->send(json_encode([
                'type'    => 'chat-global',
                'from'    => $conn->userName,
                'message' => $message
            ]));
        }
    }
}

function handleChatFriends($webSocket, $conn, $body) {
    $senderId = $body['userId'] ?? $conn->userId;
    $receiverId = $body['receiverId'] ?? null;
    $message = $body['message'] ?? null;

    if (!$receiverId || !$message) {
        $conn->send(json_encode([
            'type' => 'error',
            'message' => 'Missing receiverId or message'
        ]));
        return;
    }

    if (!isset($webSocket->usersConns[$receiverId])) {
        $conn->send(json_encode([
            'type' => 'error',
            'message' => 'Receiver not connected'
        ]));
        return;
    }

    $receiverConn = $webSocket->usersConns[$receiverId];

    $packet = [
        'type' => 'chat-friends',
        'senderId' => $senderId,
        'senderName' => $conn->userName,
        'receiverId' => $receiverId,
        'message' => $message,
        'time' => time()
    ];

    $receiverConn->send(json_encode($packet));

    $conn->send(json_encode([
        'type' => 'chat-friends',
        'senderId' => $senderId,
        'senderName' => $conn->userName,
        'receiverId' => $receiverId,
        'message' => $message,
        'time' => time(),
        'self' => true
    ]));
}

function searchInFriendList($friendListRaw, $body) {
    $receiverId = $body['receiver_id'];
    $friendList = json_decode($friendListRaw, true);
    if (!isset($friendList['success']))
        return false;
    foreach ($friendList['success'] as $friend) {
        if ((int)$friend === $receiverId)
            return true;
    }
    return false;
}

?>