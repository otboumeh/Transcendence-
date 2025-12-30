<?php

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/chat.php';
require_once __DIR__ . '/game.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/status.php';
require_once __DIR__ . '/invites.php';

class webSocket implements \Ratchet\MessageComponentInterface {
    public $client;
    protected $apiRest;
    public $usersConns = [];
    public $pendingInvites = [];
    public $activeGames = [];
    public function __construct() {
        $this->client = new \SplObjectStorage;
        $this->apiRest = new \GuzzleHttp\Client([
            'base_uri' => 'http://localhost:9000/api',
            'timeout' => 5.0,
        ]);
    }
    public function onOpen(\Ratchet\ConnectionInterface $conn) {
        $conn->auth = false;
        $conn->authToken = null;
        $conn->userId = null;
        $conn->userName = null;
        $conn->currentGameId = null;
        $this->client->attach($conn);
        $conn->send(json_encode(['type' => 'welcome', 'message' => 'Connected to Transcendence WebSocket Server']));
    }
    public function onMessage(\Ratchet\ConnectionInterface $conn, $data) {
        $body = json_decode($data, true);
        if (!$conn->auth && ($body['type'] ?? '') !== 'auth') {
            $conn->send(json_encode(['type' => 'error', 'message' => 'Authentication required. Please send auth message first.']));
            return ;
        }
        switch ($body['type'] ?? '') {
            case 'ping':
                $conn->send(json_encode(['type' => 'pong', 'timestamp' => time()]));
                break ;
            case 'auth':
                handleAuth($this, $conn, $body);
                break ;
            case 'get-online-users':
                handleGetOnlineUsers($this, $conn);
                break ;
            case 'set-status':
                handleSetStatus($this, $conn, $body);
                break ;
            case 'chat-friends':
                handleChatFriends($this, $conn, $body);
                break ;
            case 'chat-global':
                handleChatGlobal($this, $conn, $body);
                break ;
            case 'game-action':
                handleGameAction($this, $conn, $body);
                break ;
            case 'game':
                handleNewGame($this, $conn, $body);
                break ;
            case 'game-invite':
                handleGameInvite($this, $conn, $body);
                break ;
            case 'game-invite-response':
                handleInviteResponse($this, $conn, $body);
                break ;
            case 'player-ready':
                handlePlayerReady($this, $conn, $body);
                break ;
            case 'game-end':
                handleGameEnd($this, $conn, $body);
                break ;
            default:
                $conn->send(json_encode(['type' => 'error', 'message' => 'Unknown message type']));
                break ;
        }
    }
    public function onError(\Ratchet\ConnectionInterface $conn, \Exception $exc) {
        error_log("WebSocket Error: " . $exc->getMessage());
        $conn->send(json_encode(['type' => 'error', 'message' => 'Internal server error']));
        $conn->close();
    }
    public function onClose(\Ratchet\ConnectionInterface $conn) {
        if (isset($conn->userId) && isset($conn->userName)) {
            broadcastUserStatus($this, $conn->userId, $conn->userName, 'offline');
        }
        if (isset($conn->userId)) {
            handleDisconnect($this, $conn);
        }
        $this->client->detach($conn);
        if (isset($conn->userId))
            unset($this->usersConns[$conn->userId]);
    }
}

?>