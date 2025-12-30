import { navigate } from "../main.js";
import { t } from "../translations/index.js";
import { API_ENDPOINTS, apiFetch } from "../config/api.js";
import { wsService } from "../services/WebSocketService.js";

export function AuthView(app: HTMLElement, state: any): void {
  app.innerHTML = `
    <div class="text-center mb-4">
      <h1 class="text-poke-yellow text-2xl">POKéMON</h1>
      <p class="text-poke-light text-xs">PONG</p>
    </div>
    <div class="bg-poke-light bg-opacity-60 text-poke-dark border-3 border-poke-dark p-4 rounded-lg shadow-lg">
      <h2 class="text-sm leading-relaxed mb-4">Authentication</h2>
      <p class="text-sm mb-4">
        ${t("enter_code_mail")}
      </p>
      <input type="text" id="mailEnter" placeholder="${t("code")}"
        class="border-2 border-pixel-black px-4 py-2 mb-4 w-full" />
      <div class="flex justify-center">
        <button id="mailButton"
          class="bg-poke-blue bg-opacity-80 text-poke-light py-2 border-3 border-poke-blue border-b-blue-800 rounded 
                 hover:bg-gradient-to-b hover:from-blue-500 hover:to-blue-600 hover:border-b-blue-800 active:animate-press active:border-b-blue-800">
          ${t("enter_code")}
        </button>
      </div>
    </div>
  `;

  document.getElementById("mailButton")?.addEventListener("click", async () => {
    const emailInput = document.getElementById("mailEnter") as HTMLInputElement;

    const code = emailInput.value.trim();
    const userIdStr = localStorage.getItem("userId");
    const id = userIdStr ? parseInt(userIdStr, 10) : null;
 
    if (!code) {
      alert("Introduce el codigo");
      return;
    }

    try {
      const response = await apiFetch(API_ENDPOINTS.VERIFY_2FA, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, code })
      });

      const text = await response.text();
      let data: any;
      try { data = JSON.parse(text); } 
      catch { alert("Error inesperado del servidor"); return; }

      if (!response.ok) {
        alert("Error: " + (data.error || "Bad Request"));
        return;
      }

      alert("Codigo correcto");

      localStorage.setItem("userId", String(id));
      localStorage.setItem("tokenUser", data.details);
      wsService.connect().catch(err => console.error('Error conectando WebSocket:', err));
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Error de conexión con el servidor");
    }
  });
}