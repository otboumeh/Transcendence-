<?php

require_once __DIR__ . '/header.php';

$database = connectDatabase();
$requestMethod = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true);
$queryId = $_GET['id'] ?? null;
$user_id = $body['user_id'] ?? null;
// vars de mi entorno

switch ($requestMethod)
{
	case 'POST':
		if ($user_id) {
			getHistory($database, $user_id);
			break ;
		}
		if (!checkBodyData($body, 'winner_id', 'loser_id'))
			errorSend(400, 'bad request');
		$winner_id = $body['winner_id'];
		$loser_id = $body['loser_id'];
		$game_result = $body['result'];
		updateElo($database, $winner_id, $loser_id, $game_result);
		break;
	case 'GET':
		if (!checkJWT($queryId))
			errorSend(403, 'forbidden access');
		findMatch($database, $queryId);
		break;
	case 'PATCH':
		if ($user_id) {
			if (!checkJWT($user_id))
				errorSend(403, 'forbidden access');
			getStats($database, $user_id);
		}
		break ;
	default:
		errorSend(405, 'unauthorized method');
}
/*
	router de gestion de partidos y resultados, cubre:
		- con peticion POST y { user_id } en el body retorna historial de partidas
		- con peticion POST y los campos { winner_id, loser_id, result } actualiza el elo y ambos historiales
		- con peticion GET y queryParam ?id="id" busca un partido [por elo cercano y por is_online status = 1]
		- con peticion PATCH y { user_id } en el body devuelve stats genericas
*/

function getStats(SQLite3 $database, int $user_id) {
	$query = "SELECT games_played, games_win, games_lose FROM ranking WHERE user_id = :user_id";
	$sqlParams = [":user_id", $user_id, SQLITE3_INTEGER];
	$res = doQuery($database, $query, $sqlParams);
	$row = $res->fetchArray(SQLITE3_ASSOC);
	$voidRes = json_encode(["matches" => 0, "victories" => 0, "defeats" => 0 ]);
	http_response_code(200);
	if (!$row) {
		echo $voidRes;
		return ;
	}
	echo json_encode(["matches" => intval($row['games_played']),
		"victories" => intval($row['games_win']), "defeats" => intval($row['games_lose'])]);
	return ;
}
/*
	hay 2 tipos de historial, este el cual retorna estadisticas generales
	como partidas jugadas, ganadas y perdidas.
*/

function getHistory(SQLite3 $database, int $user_id) {
    $res = doQuery(
        $database,
        "SELECT history FROM ranking WHERE user_id = :id",
        [":id", $user_id, SQLITE3_INTEGER]
    );
    $row = $res->fetchArray(SQLITE3_ASSOC);

    header('Content-Type: application/json');
    http_response_code(200);

    $historyArray = [];
    if ($row && $row['history']) {
        $historyArray = json_decode($row['history'], true);
        if (!is_array($historyArray)) $historyArray = [];
    }

    echo json_encode([
        "message" => "history",
        "data" => $historyArray
    ]);
    return ;
}

/*
	misma funcionalidad pero con el historial, su formato es:
		- "status" => "win / lose"
		- "result" => "3 - 8"
		- "elo" => "+31 / -24"
		- "against" => "id de contrincante"
*/

function updateElo(SQLite3 $database, int $win_id, int $ls_id, $res): void
{
	$winElo = getElo($database, $win_id);									
	$lsElo = getElo($database, $ls_id);

	$newWinElo = operateElo($winElo, $lsElo, true);
	$newLsElo = operateElo($lsElo, $winElo, false);
	$winnerEloDiff = $newWinElo - $winElo;
	$loserEloDiff = $newLsElo - $lsElo;

	updateEloAux($database, $win_id, $newWinElo);
	updateEloAux($database, $ls_id, $newLsElo);

	$winnerHistoryEntry = [
		"status" => "win",
		"result" => $res,
		"elo" => "+" . $winnerEloDiff,
		"against" => $ls_id
	];
	$loserHistoryEntry = [
		"status" => "lose",
		"result" => $res,
		"elo" => $loserEloDiff,
		"against" => $win_id
	];
	updateHistory($database, $win_id, $winnerHistoryEntry, true);
	updateHistory($database, $ls_id, $loserHistoryEntry, false);
	successSend("match data updated", 200);
}
/*
	esta funcion opera ambas diferencias de elo (ganador y perdedor),
	y actualiza los valores en la base de datos tanto los de los stats como
	el historial anterior, de forma bidimensional todo.
*/

function updateHistory(SQLite3 $database, int $id, array $entry, bool $flag) {
    $res = doQuery($database,
        "SELECT history FROM ranking WHERE user_id = :id",
        [":id", $id, SQLITE3_INTEGER]
    );
    $row = $res->fetchArray(SQLITE3_ASSOC);
    $historyArr = $row && $row['history']
        ? json_decode($row['history'], true)
        : [];
    if (!is_array($historyArr)) $historyArr = [];
    $historyArr[] = $entry;
    $newJson = json_encode($historyArr);
    doQuery(
        $database,
        "UPDATE ranking SET 
            history = :history,
            games_played = games_played + 1,
            games_win    = games_win  + :w,
            games_lose   = games_lose + :l
         WHERE user_id = :id",
         [":history", $newJson, SQLITE3_TEXT],
         [":w", $flag ? 1 : 0, SQLITE3_INTEGER],
         [":l", $flag ? 0 : 1, SQLITE3_INTEGER],
         [":id", $id, SQLITE3_INTEGER]
    );
}
/*
	funcion exclusiva para actualizar el campo history de la db [text]
*/

function getElo(SQLite3 $database, int $user_id): int
{
	$sqlQ = "SELECT user_id, elo FROM users WHERE user_id = :user_id";
	$bind1 = [':user_id', $user_id, SQLITE3_INTEGER];
	$res = doQuery($database, $sqlQ, $bind1);
	if (!$res)
		errorSend(500, 'SQL error ' . $database->lastErrorMsg());
	$row = $res->fetchArray(SQLITE3_ASSOC);
	if (!$row)
		errorSend(400, 'couldn\'t find user elo');
	return $row['elo'];
}
//retorna el elo actual del usuario (si lo encuentra)

function operateElo(int $oldElo, int $oppElo, bool $win) 
{
	$k = 32;
	$expected = 1 / (1 + pow(10, ($oppElo - $oldElo) / 400));
	$newElo = $oldElo + $k * ($win - $expected);
	return round($newElo);
}
// op de elo robada del ajedrez

function updateEloAux(SQLite3 $database, int $user_id, int $newElo): void
{
    $sqlQ = "UPDATE users SET elo = :newElo WHERE user_id = :user_id";
    $bind1 = [':newElo', $newElo, SQLITE3_INTEGER];
    $bind2 = [':user_id', $user_id, SQLITE3_INTEGER];

    $res = doQuery($database, $sqlQ, $bind1, $bind2);
    if (!$res) {
        throw new Exception('SQL error ' . $database->lastErrorMsg());
    }
}

/*
	actualiza el resto de campos de la tabla matches de la db
	(los stats) mirando los anteriores
*/

function findMatch(SQLite3 $database, int $queryId)
{
	$sqlQ = "SELECT user_id, elo, username FROM users WHERE user_id = :user_id";
	$bind = [':user_id', $queryId, SQLITE3_INTEGER];
	$res = doQuery($database, $sqlQ, $bind);
	if (!$res)
		errorSend(500, 'SQL error -> ' . $database->lastErrorMsg());
	$row = $res->fetchArray(SQLITE3_ASSOC);
	if (!$row)
		errorSend(404, 'Player not found');
	$currentElo = $row['elo'];

	$sqlQ = "SELECT user_id, elo, ABS(elo - :currentElo) AS elo_diff FROM users
	WHERE user_id != :user_id AND is_online = 1 ORDER BY elo_diff ASC LIMIT 1";
	$bind1 = [':currentElo', $currentElo, SQLITE3_INTEGER]; 
	$bind2 = [':user_id', $queryId, SQLITE3_INTEGER];
	$res = doQuery($database, $sqlQ, $bind1, $bind2);
	if (!$res)
		errorSend(500, 'SQL error -> ' . $database->lastErrorMsg());
	$nextRival = $res->fetchArray();
	if (!$nextRival)
		errorSend(404, 'no rival found / no online players');
	else
		successSend('rival found', 200, "user_id -> $nextRival");
}
/*
	busca, entre los usuarios con el status is_online, el que tenga el elo
	mas cercano al usuario recibido en la queryParam
*/

?>
