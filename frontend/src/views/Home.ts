import { navigate } from "../main.js";
import { t } from "../translations/index.js";
import { API_ENDPOINTS, apiFetch } from "../config/api.js";
import { updateHeader } from "./Header.js";

export async function HomeView(app: HTMLElement, state: any): Promise<void> {
  
  app.innerHTML = `
    <div class="text-center mb-4">
        <h1 class="text-poke-yellow text-2xl">POKéMON</h1>
        <p class="text-poke-light text-xs">PONG</p>
    </div>

    <div class="bg-poke-light bg-opacity-60 text-poke-dark border-3 border-poke-dark p-4 rounded-lg shadow-lg">
        <h1 class="text-sm leading-relaxed mb-4">${t("subtitle")}</h1>
        <p class="text-sm leading-relaxed mb-4">${t("welcome")}, <span id="userNameDisplay">Cargando...</span>!</p>

        <button id="gameBtn" class="bg-poke-red bg-opacity-80 text-poke-light py-2 border-3 border-poke-red border-b-red-800 rounded hover:bg-gradient-to-b hover:from-red-500 hover:to-red-600 hover:border-b-red-800 active:animate-press active:border-b-red-800">
            ${t("game")}
        </button>

        <button id="tournamentBtn" class="bg-poke-blue bg-opacity-80 text-poke-light py-2 border-3 border-poke-blue border-b-blue-800 rounded hover:bg-gradient-to-b hover:from-blue-500 hover:to-blue-600 hover:border-b-blue-800 active:animate-press active:border-b-blue-800">
            ${t("tournament")}
        </button>

        <button id="chatBtn" class="bg-poke-red bg-opacity-80 text-poke-light py-2 border-3 border-poke-red border-b-red-800 rounded hover:bg-gradient-to-b hover:from-red-500 hover:to-red-600 hover:border-b-red-800 active:animate-press active:border-b-red-800">
            ${t("chat")}
        </button>
    </div>
  `;

  updateHeader(state);

  document.getElementById("gameBtn")?.addEventListener("click", () => navigate("/game"));
  document.getElementById("tournamentBtn")?.addEventListener("click", () => navigate("/tournament"));
  document.getElementById("chatBtn")?.addEventListener("click", () => navigate("/chat"));

    const userId = localStorage.getItem('userId');
    const userIdPlaceholder = userId ? parseInt(userId, 10) : null;

    if (userIdPlaceholder) {
        const token = localStorage.getItem('tokenUser');
        const userNameDisplay = document.getElementById("userNameDisplay");
        
        if (!token || !userNameDisplay) {
            userNameDisplay!.textContent = "Error de sesión";
            return;
        }

        try {
            const response = await apiFetch(`${API_ENDPOINTS.USER_INFO}?id=${userIdPlaceholder}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            const data = await response.json();

            if (response.ok && data.success && data.success.username) {
                userNameDisplay.textContent = data.success.username;
            } else {
                console.error("No se pudo obtener el nombre de usuario:", data);
                userNameDisplay.textContent = "Usuario (Error API)";
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
            userNameDisplay.textContent = "Usuario (Error Red)";
        }
    } else {
        document.getElementById("userNameDisplay")!.textContent = "Invitado";
    }
}