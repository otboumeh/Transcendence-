<?php

require_once __DIR__ . '/header.php';

$database = connectDatabase();
$requestMethod = $_SERVER['REQUEST_METHOD'];
$queryId = $_GET['id'] ?? null;
$res = null;

if ($requestMethod !== 'GET')
	errorSend(405, 'unauthorized method');
// cerrado a peticiones GET

if ($queryId)
{
	if (!checkJWT($queryId))
		errorSend(403, 'forbidden access');
	$sqlQuery = "SELECT u.user_id, u.username, u.elo, r.games_played, r.games_win, r.games_lose
	FROM users u INNER JOIN ranking r ON u.user_id = r.user_id
	WHERE u.user_id IN (SELECT friend_id FROM friends WHERE user_id = :user_id)";
	$bind1 = [':user_id', $queryId, SQLITE3_INTEGER];
	$res = doQuery($database, $sqlQuery, $bind1);
}
else
{
	$sqlQuery = "SELECT u.user_id, u.username, u.elo, r.games_played, r.games_win, r.games_lose INNER JOIN
	ranking r ON u.user_id = r.user_id ORDER BY u.elo DESC";
	$res = doQuery($database, $sqlQuery);
}
/*
	aqui se gestionan ambos casos de ranking:
	- el que recibe el id del usuario por queryParam, el cual
	retorna el ranking dentro de la lista de amigos del user

	- el que no recibe el queryParam xD, que retorna el ranking
	con todos los usuarios de la base de datos
*/

if (!$res)
	errorSend(500, 'Sql error: ' . $database->lastErrorMsg());
$data = [];
while ($row = $res->fetchArray(SQLITE3_ASSOC))
	$data[] = $row;
successSend($data, JSON_PRETTY_PRINT);

?>