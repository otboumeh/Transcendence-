<?php

require_once __DIR__ . '/header.php';

$database = connectDatabase();
$requestMethod = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true);
$queryId = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;
error_log(print_r($queryId, true));
// entorno de vars 

switch ($requestMethod) 
{
	case 'GET':
		// Si action=list, obtener user_id del token JWT
		if ($action === 'list') {
			$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
			if (empty($authHeader)) errorSend(403, 'forbidden access - no token');
			$decodedJWT = getDecodedJWT($authHeader);
			if (!$decodedJWT) errorSend(403, 'forbidden access - invalid token');
			$queryId = $decodedJWT->data->user_id ?? null;
			if (!$queryId) errorSend(403, 'forbidden access - no user_id in token');
		}
		if (!$queryId || !checkJWT($queryId))
			errorSend(403, 'forbidden access');
		getFriendList($database, $queryId);
		break;
	case 'POST':
		if (!checkBodyData($body, 'user_id'))
			errorSend(400, 'bad request');
		$user_id = $body['user_id'];
		if (!checkJWT($user_id))
			errorSend(403, 'forbidden access');
		deleteFriend($database, $body, $user_id);
		break;
	default:
		errorSend(405, 'unauthorized method');
}
/*
    router de gestion de amigos, cubriendo:
        - peticion GET con queryParam ?id="id" retorna la lista de amigos
        del usuario "id"
        - peticion POST con body { user_id, friend_id } para eliminar
        al amigo friend_id de user_id
*/

function getFriendList(SQLite3 $database, int $queryId): void 
{
    $sqlQuery = "
		SELECT u.user_id, u.username, u.email
		FROM users u
		WHERE u.user_id IN (
			SELECT f.friend_id FROM friends f WHERE f.user_id = :id
			UNION
			SELECT f.user_id FROM friends f WHERE f.friend_id = :id
		)
	";

    $bind = [':id', $queryId, SQLITE3_INTEGER];
    $res = doQuery($database, $sqlQuery, $bind);
    if (!$res) errorSend(500, "Sql error: " . $database->lastErrorMsg());

    $content = [];
    while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
        $content[] = $row;
    }

    successSend($content);
    exit;
}
/*
    el id se comprueba antes de llamar a esta funcion, esta solo
    ejecutara la query en la cual se seleccionan a los amigos del
    usuario de la queryParam
*/

function deleteFriend(SQLite3 $database, array $body, int $user_id): void
{
    if (!checkBodyData($body, 'friend_id'))
        errorSend(400, 'bad request');
    $friend_id = (int)$body['friend_id'];

    $sqlQuery = "
        DELETE FROM friends
        WHERE (user_id = :user_id AND friend_id = :friend_id)
           OR (user_id = :friend_id AND friend_id = :user_id)
    ";

    $stmt = $database->prepare($sqlQuery);
    $stmt->bindValue(':user_id', $user_id, SQLITE3_INTEGER);
    $stmt->bindValue(':friend_id', $friend_id, SQLITE3_INTEGER);
    $res = $stmt->execute();
    if (!$res) {
        error_log("deleteFriend execute error: " . $database->lastErrorMsg());
        errorSend(500, "Sql error: " . $database->lastErrorMsg());
    }

    // Comprueba cambios:
    $changes = $database->changes();
    error_log("deleteFriend - changes: $changes");
    if ($changes === 0)
        errorSend(404, 'friend not found');

    successSend('friend deleted');
}
/*
    trato de ejecutar en la base de datos un delete
    sobre el id que llega en friend_id, en caso de no existir se
    recoje el error de la db
*/

?>