<?php
header('Content-Type: application/json');

$frontend_origin = "http://localhost:3000";
header("Access-Control-Allow-Origin: $frontend_origin");
header("Access-Control-Allow-Methods: GET, POST, DELETE, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
// headers comunes
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../../vendor/autoload.php';
// includes comunes

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
} // status check


function successSend(string|array $msg, int $code = 200, ?string $detailsMsg = null): void {
    http_response_code($code);
    $response = ['success' => $msg];
    if ($detailsMsg)
        $response['details'] = $detailsMsg;
    echo json_encode($response);
    exit;
}
// handler para cuando una peticion correcta 200 por default

function errorSend(int $code, string $msg, ?string $detailsMsg = null): void
{
    http_response_code($code);
    $response = ['error' => $msg];
    if ($detailsMsg)
        $response['details'] = $detailsMsg;
    echo json_encode($response);
    exit;
}
// handler para cuando ha ocurrido un error

function checkBodyData(array $body, string ...$keys): bool
{
    foreach ($keys as $key) {
        if (!isset($body[$key]) || !$body[$key])
            return false;
        if (stripos($key, '_id') !== false && !is_numeric($body[$key]))
            return false;
        if (stripos($key, 'email') !== false && !filter_var($body[$key], FILTER_VALIDATE_EMAIL))
            return false;
    }
    return true;
}
// comprobaciones sobre el formato de email y sobre si un id es numerico

function doQuery(SQLite3 $database, string $sqlQuery, array ...$bindings): SQLite3Result|bool
{
    $stmt = $database->prepare($sqlQuery);
    if ($stmt === false) return false;
    foreach ($bindings as $bind)
        $stmt->bindValue(...$bind);
    return ($stmt->execute());
}
// handler para ejecutar una query dobre la base de datos "segura" usando prepare y bindeando los valores

function checkJWT(int $id): bool
{
    $JWT = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if (!$JWT){
        error_log(print_r(" no hay token jwt ! "));
        return false;
    }
    $decodedJWT = getDecodedJWT($JWT);
    if (!$decodedJWT) {
        return false;
    }
    $idJWT = $decodedJWT->data->user_id ?? null;
    if ($id !== $idJWT) {
        error_log(print_r(" el token no coincide con el id "));
        return false;
    }
    return true;
}
// funcion que comprueba que el token sea correcto ademas de que coincide con el id del usuario

function getJWTSecret(): string {
    // Leer desde Docker secret si existe
    if (file_exists('/run/secrets/jwt_secret')) {
        $secret = trim(file_get_contents('/run/secrets/jwt_secret'));
        if (!empty($secret)) {
            return $secret;
        }
    }
    // Fallback a variable de entorno
    $secret = getenv('JWTsecretKey');
    if ($secret === false) {
        errorSend(500, "FATAL: JWT_SECRET_KEY no está configurada");
    }
    return $secret;
}

function getDecodedJWT(string $JWT): ?object
{
    list($jwt) = sscanf($JWT, 'Bearer %s');
    if (!$jwt) {
        error_log(print_r(" no hay token en el bearer %s "));
        return null;
    }
    $secretKey = getJWTSecret();
    try {
        $decodedToken = Firebase\JWT\JWT::decode($jwt, new Firebase\JWT\Key($secretKey, 'HS256'));
        return $decodedToken;
    } catch (Exception $e) {
        error_log("Couldn't decode JWT -> " . $e->getMessage());
        return null;
    }
}
// extrae el objeto JWT del token recibido por el cliente

?>