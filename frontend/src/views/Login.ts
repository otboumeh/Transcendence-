import { navigate } from "../main.js";
import { t } from "../translations/index.js";
import { API_ENDPOINTS, apiFetch } from "../config/api.js";
import { wsService } from "../services/WebSocketService.js";

const CONCURRENT_SESSION_MESSAGE = "This user is already logged in on another device. Please log out there first.";

export function LoginView(app: HTMLElement, state: any): void {
  app.innerHTML = `
    <div class="text-center mb-4">
      <h1 class="text-poke-yellow text-2xl">POKéMON</h1>
      <p class="text-poke-light text-xs">PONG</p>
    </div>
    <div class="bg-poke-light bg-opacity-60 text-poke-dark border-3 border-poke-dark p-4 rounded-lg shadow-lg">
      <h2 class="text-sm leading-relaxed mb-4">${t("log_in")}</h2>
      <input type="text" id="username" placeholder="${t("_username")}"
        class="border-2 border-pixel-black px-4 py-2 mb-4 w-full" />
      <input type="password" id="password" placeholder="${t("password")}"
        class="border-2 border-pixel-black px-4 py-2 mb-4 w-full" />
      <div class="flex justify-center gap-4">
        <button id="loginBtn"
          class="bg-poke-blue bg-opacity-80 text-poke-light py-2 border-3 border-poke-blue border-b-blue-800 rounded hover:bg-gradient-to-b hover:from-blue-500 hover:to-blue-600 active:animate-press">
          ${t("log_in")}
        </button>
        <button id="back"
          class="bg-gradient-to-b from-poke-red to-red-700 text-poke-light py-2 border-3 border-poke-red border-b-red-900 rounded 
                 hover:from-red-500 hover:to-red-600 active:animate-press">
          ${t("back")}
        </button>
      </div>
      <div id="loginError" class="text-red-600 text-center mt-3 text-sm"></div>
    </div>
  `;

  const loginBtn = document.getElementById("loginBtn");
  const backBtn = document.getElementById("back");

  backBtn?.addEventListener("click", () => navigate("/register"));

  loginBtn?.addEventListener("click", async () => {
    const usernameInput = document.getElementById("username") as HTMLInputElement;
    const passwordInput = document.getElementById("password") as HTMLInputElement;
    const errorDiv = document.getElementById("loginError")!;

    const username = usernameInput.value.trim();
    const pass = passwordInput.value.trim();

    if (!username || !pass) {
      errorDiv.textContent = "Please fill in all fields";
      return;
    }

    try {
      const response = await apiFetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pass }),
      });

      const text = await response.text();

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON response from backend");
      }



      if (data.concurrent_session_error) {
        errorDiv.textContent = t("concurrent_session_error") || CONCURRENT_SESSION_MESSAGE;
        passwordInput.value = "";
        return;
      }

      if (data.error) {
        errorDiv.textContent = data.error;
        return;
      }

      if (data.user_id) {
        localStorage.setItem("username", String(username));
        localStorage.setItem("userId", String(data.user_id));
      }

      if (data.details && data.test_mode) {
        localStorage.setItem("tokenUser", data.details);
        
        wsService.connect().catch(err => console.error('Error conectando WebSocket:', err));
        
        navigate("/choose");
        return;
      }

      if (data.token) {
        localStorage.setItem("tokenUser", data.token);
      }

      if (data.pending_2fa) {
        navigate("/authentication");
      } else {
        wsService.connect().catch(err => console.error('Error conectando WebSocket:', err));
        navigate("/choose");
      }

    } catch (err) {
      console.error("Network or server error:", err);
      errorDiv.textContent = "Network error. Backend unreachable.";
    }
  });
}