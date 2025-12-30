import { navigate } from "../main.js";
import { t } from "../translations/index.js";
import { API_ENDPOINTS, apiFetch } from "../config/api.js";

export function Profile1View(app: HTMLElement, state: any): void {
  app.innerHTML = `
    <div class="text-center mb-4">
      <h1 class="text-poke-yellow text-2xl">POKéMON</h1>
      <p class="text-poke-light text-xs">PONG</p>
    </div>
    <div class="bg-poke-light bg-opacity-60 text-poke-dark border-3 border-poke-dark p-4 rounded-lg shadow-lg">
      <h2 class="text-sm leading-relaxed mb-4">${t("profile")}</h2>
      <p class="text-sm mb-4">
        ${t("welcome")}, ${state.player.user || t("player")}!
        ${t("username_info")}
      </p>
      <input type="text" id="userEnter" placeholder="${t("enter_username")}"
        class="border-2 border-pixel-black px-4 py-2 mb-4 w-full" />
      <input type="email" id="mailEnter" placeholder="${t("mail")}"
        class="border-2 border-pixel-black px-4 py-2 mb-4 w-full" />
      <input type="password" id="passEnter" placeholder="${t("password")}"
        class="border-2 border-pixel-black px-4 py-2 mb-4 w-full" />
      <div class="flex justify-center gap-4">
        <button id="userButton"
          class="bg-poke-blue bg-opacity-80 text-poke-light py-2 border-3 border-poke-blue border-b-blue-800 rounded 
                 hover:bg-gradient-to-b hover:from-blue-500 hover:to-blue-600 hover:border-b-blue-800 active:animate-press active:border-b-blue-800">
          ${t("enter_username")}
        </button>
        <button id="back"
          class="bg-gradient-to-b from-poke-red to-red-700 text-poke-light py-2 border-3 border-poke-red border-b-red-900 rounded 
                 hover:from-red-500 hover:to-red-600 active:animate-press">
          ${t("back")}
        </button>
      </div>
    </div>
  `;

  const backBtn = document.getElementById("back");

  backBtn?.addEventListener("click", () => navigate("/register"));

  document.getElementById("userButton")?.addEventListener("click", async () => {
    const usernameInput = document.getElementById("userEnter") as HTMLInputElement;
    const emailInput = document.getElementById("mailEnter") as HTMLInputElement;
    const passwordInput = document.getElementById("passEnter") as HTMLInputElement;

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const pass = passwordInput.value.trim();

    if (!username || !email || !pass) {
      alert("Todos los campos son obligatorios");
      return;
    }

    try {
      const response = await apiFetch(API_ENDPOINTS.USERS, {
        method: "POST",
        body: JSON.stringify({ username, email, pass })
      });
      const text = await response.text();
      let data: any;
      try { data = JSON.parse(text); } 
      catch { alert("Error inesperado del servidor"); return; }

      if (!response.ok) {
        alert("Error: " + (data.error || "Bad Request"));
        return;
      }

      alert("Usuario creado correctamente");

      state.player.user = username;
      localStorage.setItem("player", JSON.stringify(state.player));

      navigate("/register");
    } catch (err) {
      console.error(err);
      alert("Error de conexión con el servidor");
    }
  });
}
