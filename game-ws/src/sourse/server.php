<?php

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/webSocket.php';

$port = 8080; // WebSocket server port

try {
    echo "Starting WebSocket server on port $port...\n";
    
    $server = \Ratchet\Server\IoServer::factory(
        new \Ratchet\Http\HttpServer(
            new \Ratchet\WebSocket\WsServer(
                new webSocket()
            )
        ), 
        $port, 
        "0.0.0.0"
    );

    echo "WebSocket server started successfully!\n";
    $server->run();
    
} catch (Exception $e) {
    echo "Error starting WebSocket server: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}

?>