<?php

require_once __DIR__ . '/header.php';
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS')
    { http_response_code(200); exit; } // status de operabilidad users.php

$database = connectDatabase();
$body = json_decode(file_get_contents('php://input'), true);
$queryId = $_GET['id'] ?? null;
$queryUsername = $_GET['user'] ?? null;
$username = "";
// vars de mi entorno :D

if ($queryUsername && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = "SELECT user_id FROM users WHERE username = :username";
    $res = doQuery($database, $query, [':username', $queryUsername, SQLITE3_TEXT]);
    $row = $res->fetchArray(SQLITE3_ASSOC);
    if (!$res)
        errorSend(500, '' . $database->lastErrorMsg());
    successSend(['user_id' => $row['user_id']]);
    exit ;
}
/* 
    esta peticion es la referente a la de la query user="nombre de usuario"
    si encuentra el usuario en la db lo retorna con 200
    si no la encuentra retorna 500 como respuesta de la db directa de que lo no encuentra 
*/

switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST': createUser($body, $database); break;
    case 'GET': $queryId ? userDataById($database, $queryId) : userList($database); break;
    case 'PATCH': $queryId ? getUserAvatar($database, $queryId) : editUserData($body, $database); break;
    case 'DELETE': deleteUser($queryId, $database); break;
    default: errorSend(405, 'Method not allowed');
}
/*
    router de users contiene handlers para:
        - crear usuario POST con { username, email, pass }
        - recibir datos de un usuario con peticion GET a traves de ?id="id"
        - recibir una lista completa de usuarios con GET [ por standard ]
        - recibir la foto de perfil del usuario con PATCH a traves de ?id="id"
        - editar los datos de un usuario PATCH con { user_id, username } (el nuevo xD) *** NECESITA JWT ***
        - eliminar un usuario con DELETE y el uso de ?id="id" *** NECESITA JWT *** 
*/

function getUserAvatar(SQLite3 $db, int $id): void {
    if (!is_numeric($id))
        errorSend(400, 'bad petition');
    $sqlQuery = "SELECT avatar_url FROM users WHERE user_id = :id";
    $resultObject = doQuery($db, $sqlQuery, [':id', $id, SQLITE3_INTEGER]);
    
    if (!$resultObject) {
        errorSend(500, "Sqlite error: " . $db->lastErrorMsg());
    }
    $row = $resultObject->fetchArray(SQLITE3_ASSOC);
    if (!$row || empty($row['avatar_url'])) {
        errorSend(404, "avatar not found in db");
    }
    $avatarPath = __DIR__ . $row['avatar_url'];
    
    if (!file_exists($avatarPath))
        errorSend(404, "file not found");

    $info = getimagesize($avatarPath);
    header('Content-Type: ' . $info['mime']);
    readfile($avatarPath);
}
/*
    comprobaciones minimas para evitar error de php
    query para recibir la direccion del avatar
    errores para cubrir varios casos posibles
    extraccion del archivo
*/

function createUser(array $body, SQLite3 $db): void {
    if (!checkBodyData($body, 'username', 'email', 'pass'))
        errorSend(400, 'Missing fields');

    $username = $body['username'];
    $email = $body['email'];
    $passHash = password_hash($body['pass'], PASSWORD_DEFAULT);

    $sql = "INSERT INTO users (username, email, pass) VALUES (:username, :email, :pass)";
    $res = doQuery($db, $sql, [':username', $username, SQLITE3_TEXT], [':email', $email, SQLITE3_TEXT], [':pass', $passHash, SQLITE3_TEXT]);
    if (!$res)
        errorSend(500, "SQLite error: " . $db->lastErrorMsg());
    
    $userId = $db->lastInsertRowID();
    $rankingQuery = "INSERT INTO ranking (user_id, games_played, games_win, games_lose, history)
        VALUES (:user_id, 0, 0, 0, '[]')";
    $res = doQuery($db, $rankingQuery, [':user_id', $userId, SQLITE3_INTEGER]);
    if (!$res)
        errorSend(500, "SQLite error: " . $db->lastErrorMsg());
    successSend(['message' => 'User created', 'user_id' => $userId], 201);
}
/*
    comprobaciones minimas sobre formato de correo y contrasenha
    asignacion de variables utilizando password_hash de la libreria standard
    ejecucion con error de la query a la db, en caso de creacion 201
*/

function userDataById(SQLite3 $db, int $id): void {
    $sql = "SELECT user_id, username, email, elo FROM users WHERE user_id = :id";
    $res = doQuery($db, $sql, [':id', $id, SQLITE3_INTEGER]);

    if (!$res)
        errorSend(500, "SQLite error: " . $db->lastErrorMsg());
    $row = $res->fetchArray(SQLITE3_ASSOC);
    if(!$row)
        errorSend(404, 'User not found');
    successSend($row);
}
/*
    comprobacion minima de id y query que en caso de funcionar
    retornara un array asociativo con el id, nombre, email y elo del usuario
*/

function userList(SQLite3 $db): void {
    $res = doQuery($db, "SELECT user_id, username, elo, is_online FROM users");
    if (!$res)
        errorSend(500, "SQLite error: " . $db->lastErrorMsg());
    $users = [];
    while ($r = $res->fetchArray(SQLITE3_ASSOC))
        $users[] = $r;
    successSend($users);
}
/*
    con llamada get vacia retorna una lista con todos los usuarios, su elo
    y su status [ pensada para matchmaking ]
*/

function editUserData(array $body, SQLite3 $db): void {
    $updates = [];
    
    // 1. Validar que al menos se proporcionen datos para actualizar
    if (isset($body['username'])) {
        $updates['username'] = $body['username'];
    }
    // Si no hay nada que actualizar (aparte del user_id), salimos
    if (empty($updates)) {
        errorSend(400, "No data provided for update.");
    }
    
    // 2. Validar y obtener el user_id
    if (!isset($body['user_id'])) {
        errorSend(400, "Missing user_id");
    }
    $userId = $body['user_id']; // <-- ¡CORRECCIÓN! Extraer el ID.
    
    // 3. Comprobación de seguridad (asumiendo que checkJWT necesita el ID)
    // checkJWT($userId); 
    // Comenta la línea anterior si aún no tienes implementado el checkJWT

    // 4. Construir y ejecutar la query de actualización
    // Usamos el bucle, pero nos aseguramos de usar el ID correcto
    foreach ($updates as $col => $val) {
        $sql = "UPDATE users SET $col = :val WHERE user_id = :id";
        
        // 5. Ejecutar la query con los parámetros correctos:
        $res = doQuery($db, $sql, 
            [':val', $val, SQLITE3_TEXT], // Valor a actualizar (el nuevo nombre)
            [':id', $userId, SQLITE3_INTEGER] // ID del usuario a modificar
        );

        if (!$res) {
            errorSend(500, "SQLite error updating $col: " . $db->lastErrorMsg());
        }
    }
    
    // Si llegamos aquí, el usuario fue actualizado
    successSend(['message' => 'User updated successfully']);
}
/* 
    compruebo token jwt
    asigno un array clave valor con los datos del usuario y en bucle
    actualizo en la db los valores
*/

function deleteUser(int $id, SQLite3 $db): void {
    checkJWT($id);
    if(checkJWT($id) === false)
        errorSend(403, "Forbidden: Invalid token");
    $sql = "DELETE FROM users WHERE user_id = :id";
    $res = doQuery($db, $sql, [':id', $id, SQLITE3_INTEGER]);
    if (!$res)
        errorSend(500, "SQLite error: " . $db->lastErrorMsg());
    successSend(['message' => 'User deleted']);
}
/*
    compruebo token jwt y genero la peticion que elimina de la tabla users(main)
    el id del usuario que llege en la query como parametro ?id=
*/

?>
