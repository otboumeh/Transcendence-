/**
 * API Configuration
 * Centraliza todas las URLs de la API para facilitar cambios de entorno
 */

// Determinar la URL base según el entorno
const getApiBaseUrl = (): string => {
  const currentHost = window.location.hostname;
  const currentPort = window.location.port;
  const currentProtocol = window.location.protocol;
  
  // Estrategia: Siempre usar rutas relativas para que funcione desde cualquier origen
  // El navegador enviará las peticiones al mismo host/puerto desde el que cargó el frontend
  
  // Caso 1: Acceso a través de nginx en puerto 9443 (HTTPS)
  // Ejemplo: https://192.168.1.100:9443 -> /api/... se proxea a backend
  if (currentPort === '9443' || currentPort === '443') {
    // Usar rutas relativas - funciona tanto desde localhost como desde IP externa
    return '';
  }
  
  // Caso 2: Acceso a través de nginx sin puerto explícito (producción)
  // Ejemplo: https://example.com -> /api/... se proxea a backend
  if (currentPort === '') {
    return '';
  }
  
  // Caso 3: Acceso directo al frontend en puerto 3000 o 9280 (desarrollo)
  // Necesita conectar al nginx en puerto 9443
  // IMPORTANTE: Usar currentHost en lugar de 'localhost' para soportar acceso externo
  if (currentPort === '3000' || currentPort === '9280') {
    // Si estamos en localhost, usar localhost; si es desde red, usar la IP actual
    const targetHost = currentHost === '127.0.0.1' ? 'localhost' : currentHost;
    return `https://${targetHost}:9443`;
  }
  
  // Caso 4: Cualquier otro puerto (fallback seguro - rutas relativas)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Endpoints de la API
export const API_ENDPOINTS = {
  // Autenticación
  LOGIN: `${API_BASE_URL}/api/login.php`,
  LOGOUT: `${API_BASE_URL}/api/logout.php`,
  VERIFY_2FA: `${API_BASE_URL}/api/verify_2fa.php`,
  
  // Usuarios
  USERS: `${API_BASE_URL}/api/users.php`,
  USER_INFO: `${API_BASE_URL}/api/users.php`,
  
  // Avatares y uploads
  UPLOAD: `${API_BASE_URL}/api/upload.php`,
  AVATAR_PHOTO: `${API_BASE_URL}/api/avatar_photo.php`,
  
  // Amigos
  FRIENDS: `${API_BASE_URL}/api/friends.php`,
  FRIEND_REQUEST: `${API_BASE_URL}/api/friend_request.php`,
  GET_USER_ID: `${API_BASE_URL}/api/get_user_id.php`,
  
  // Partidas y estadísticas
  MATCHES: `${API_BASE_URL}/api/matches.php`,
  LADDER: `${API_BASE_URL}/api/ladder.php`,
  
  // Otros
  DELETE_ALL: `${API_BASE_URL}/api/delete_all.php`,
  HEALTH: `${API_BASE_URL}/api/health.php`,
};

// Helper para hacer fetch con configuración predeterminada
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Incluir cookies para sesiones
    ...options,
  };
  
  return fetch(url, defaultOptions);
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  apiFetch,
};
