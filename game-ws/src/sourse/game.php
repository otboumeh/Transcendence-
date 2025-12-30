<?php

function handleGameAction(WebSocket $ws, $conn, $body) {
    if (is_string($body)) {
        $body = json_decode($body, true);
        if ($body === null) {
            $conn->send(json_encode(['type'=>'error','msg'=>'invalid JSON']));
            return;
        }
    }
    $gameId = $body['gameId'] ?? null;
    if (!$gameId || !isset($ws->activeGames[$gameId])) {
        $conn->send(json_encode(['type' => 'error',
        'msg' => 'game not found']));
        return ;
    }
    $game = $ws->activeGames[$gameId];
    $player1 = $ws->usersConns[$game['player1']];
    $player2 = $ws->usersConns[$game['player2']];
    $msg = [
        'type' => 'game-update',
        'gameId' => $gameId,
        'from' => $conn->userId,
        'action' => $body['action'],
        'data' => $body['data'] ?? null
    ];
    if ($conn->userId == $game['player1']) {
        $player2->send(json_encode($msg));
    } else {
        $player1->send(json_encode($msg));
    }
    return ;
}

function handleNewGame(WebSocket $ws, $conn, $body) {
    if (!isset($body['player1'], $body['player2'])) {
        $conn->send(json_encode(['type'=>'error','msg'=>'missing players for game']));
        return ;
    }

    $player1 = $body['player1'];
    $player2 = $body['player2'];

    $player1conn = $ws->usersConns[$player1];
    $player2conn = $ws->usersConns[$player2];

    $gameId = uniqid("game_", true);

    $player1conn->currentGameId = $gameId;
    $player2conn->currentGameId = $gameId;

    $ball = [
        'x'=>360,'y'=>200,
        'vx'=> rand(0,1) ? 5 : -5,
        'vy'=> rand(0,1) ? 3 : -3
    ];

    $ws->activeGames[$gameId] = [
        'id'=>$gameId,
        'player1'=>$player1,
        'player2'=>$player2
    ];

    $msg = [
        'type'=>'game-start',
        'gameId'=>$gameId,
        'player1'=>$player1,
        'player2'=>$player2,
        'ball'=>$ball
    ];

    $player1conn->send(json_encode($msg));
    $player2conn->send(json_encode($msg));
}

function handleDisconnect(WebSocket $ws, $conn) {
    $userId = $conn->userId ?? null;
    if (!$userId) return;
    $gameId = $conn->currentGameId ?? null;
    if (!$gameId || !isset($ws->activeGames[$gameId])) {
        return;
    }
    $game = $ws->activeGames[$gameId];
    $opponentId = ($game['player1'] === $userId)
        ? $game['player2']
        : $game['player1'];
    if (isset($ws->usersConns[$opponentId])) {
        $ws->usersConns[$opponentId]->currentGameId = null;
    }
    unset($ws->activeGames[$gameId]);
    $msg = [
        'type' => 'game-ended',
        'gameId' => $gameId
    ];
    $ws->usersConns[$opponentId]->send(json_encode($msg));
    $ws->usersConns[$userId]->send(json_encode($msg));
}

function handleGameEnd(WebSocket $ws, $conn, $body) {
    $gameId = $body['gameId'] ?? null;

    if (!$gameId || !isset($ws->activeGames[$gameId])) {
        $conn->send(json_encode(['type' => 'error', 'msg' => 'game not found']));
        return;
    }

    $game = $ws->activeGames[$gameId];

    $player1 = $game['player1'];
    $player2 = $game['player2'];
    $msg = [
        'type' => 'game-ended',
        'gameId' => $gameId
    ];
    if (isset($ws->usersConns[$player1])) {
        $ws->usersConns[$player1]->send(json_encode($msg));
        $ws->usersConns[$player1]->currentGameId = null;
    }

    if (isset($ws->usersConns[$player2])) {
        $ws->usersConns[$player2]->send(json_encode($msg));
        $ws->usersConns[$player2]->currentGameId = null;
    }
    unset($ws->activeGames[$gameId]);
}

?>