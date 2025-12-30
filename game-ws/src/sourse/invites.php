<?php

function handleGameInvite(WebSocket $ws, $conn, $body) {
    $from = $body['from'];
    $to = $body['to'];

    if (!isset($ws->usersConns[$to])) {
        $conn->send(json_encode([
            'type' => 'error', 'msg' => 'user is offline'
        ]));
        return ;
    }

    $inviteId  = uniqid("invite_", true);
    $ws->pendingInvites[$inviteId] = ['from' => $from, 'to' => $to];
    $receiverConn = $ws->usersConns[$to];
    $receiverConn->send(json_encode([
        'type' => 'game-invite', 'inviteId' => $inviteId,
        'from' => $from
    ]));
    $conn->send(json_encode(['type' => 'game-invite-sent',
        'inviteId' => $inviteId, 'to' => $to ]));
    return ;
}

function handleInviteResponse(WebSocket $ws, $conn, $body) {
    $inviteId = $body['inviteId'] ?? null;
    $response = $body['response'] ?? null;

    if (!$inviteId || !is_bool($response) || !isset($ws->pendingInvites[$inviteId])) {
        $conn->send(json_encode(['type' => 'error', 'msg' => 'bad petition']));
        return;
    }
    if (!empty($ws->pendingInvites[$inviteId]['processing'])) {
        return;
    }

    $ws->pendingInvites[$inviteId]['processing'] = true;

    $invite = $ws->pendingInvites[$inviteId];

    if ($response === false) {
        $from = $invite['from'];
        $ws->usersConns[$from]->send(json_encode([
            'type' => 'game-invite-rejected',
            'inviteId' => $inviteId,
            'msg' => 'invitación rechazada'
        ]));

        unset($ws->pendingInvites[$inviteId]);
        return;
    }

   $player1 = $invite['from'];
    $player2 = $invite['to'];

    unset($ws->pendingInvites[$inviteId]);

    handleNewGame($ws, $ws->usersConns[$player1], [
        'player1' => $player1,
        'player2' => $player2
    ]);
}

?>