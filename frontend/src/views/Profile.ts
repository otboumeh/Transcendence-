import { navigate } from "../main.js";
import { t } from "../translations/index.js";
import { API_ENDPOINTS, apiFetch } from "../config/api.js";

export async function ProfileView(app: HTMLElement, state: any): Promise<void> {
  app.innerHTML = `
    <div class="text-center mb-4">
      <h1 class="text-poke-yellow text-2xl">POKéMON</h1>
      <p class="text-poke-light text-xs">PONG</p>
    </div>
    <div class="bg-poke-light bg-opacity-60 text-poke-dark border-3 border-poke-dark p-4 rounded-lg shadow-lg">
      <h2 class="text-sm leading-relaxed mb-4">${t("profile")}</h2>
      <p class="text-sm leading-relaxed mb-4">${t("welcome")}, <span id="userNameDisplay">Cargando...</span>! ${t("username_info")}</p>
      <input type="text" id="userEnter" placeholder="${t("new_username")}"
        class="border-2 border-pixel-black px-4 py-2 mb-4 w-full" />
        
      <p id="profileErrorMsg" class="text-poke-red text-center text-sm mb-2 hidden"></p>
      
      <div class="flex justify-center gap-4">
        <button id="userButton"
          class="bg-poke-blue bg-opacity-80 text-poke-light py-2 border-3 border-poke-blue border-b-blue-800 rounded hover:bg-gradient-to-b hover:from-blue-500 hover:to-blue-600 hover:border-b-blue-800 active:animate-press active:border-b-blue-800">
          ${t("enter_username")}
        </button>
        <button id="goBackBtn" class="bg-poke-red bg-opacity-80 text-poke-light py-2 border-3 border-poke-red border-b-red-800 rounded hover:bg-gradient-to-b hover:from-red-500 hover:to-red-600 active:animate-press active:border-b-red-800">
            ${t("goBack")}
          </button>
      </div>
    </div>
  `;

  document.getElementById("goBackBtn")?.addEventListener("click", () => navigate("/settings"));

  const input = document.getElementById("userEnter") as HTMLInputElement | null;
  const userButton = document.getElementById("userButton");
  const errorMsg = document.getElementById("profileErrorMsg") as HTMLElement;

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
  
  userButton?.addEventListener("click", async () => {
    if (!input) return;

    const newUsername = input.value.trim();
    errorMsg.classList.add("hidden");

    if (!newUsername) {
      alert(t("error_empty_user") || "El nombre de usuario no puede estar vacío.");
      return;
    }

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('tokenUser');
    const currentUserId = userId ? parseInt(userId, 10) : null;

    if (!currentUserId) {
      alert("No user logged in");
      return;
    }
    
    try {
        const checkResponse = await apiFetch(`${API_ENDPOINTS.GET_USER_ID}?user=${newUsername}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (checkResponse.ok) {
            const userData = await checkResponse.json();
            const existingUserId = userData.success?.user_id;

            if (existingUserId && existingUserId !== currentUserId) {
                alert(t("error_username_taken") || "Error: Este nombre de usuario ya está en uso.");
                return; 
            }


        } 

    } catch (error) {
        console.error("Error al verificar nombre de usuario:", error);
        alert(t("error_network_check") || "Error de red al verificar el nombre. Inténtalo de nuevo.");
        return;
    }


    const response = await apiFetch(API_ENDPOINTS.USERS, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUserId,
        username: newUsername
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Error desconocido." }));
      alert(errorData.message || "Error al actualizar el nombre de usuario."); 
    } else {
      navigate("/");
    }
  });
}

