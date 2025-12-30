import { navigate } from "../main.js";
import { t } from "../translations/index.js";

export function GameView(app: HTMLElement, state?: any): void {
  app.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full space-y-6">
      <h1 class="text-3xl text-poke-yellow font-bold">POKéMON PONG</h1>
      <div class="flex flex-col gap-4">
        <button id="btn1v1" class="bg-poke-red text-white py-2 px-6 rounded hover:bg-red-600">
          ${t("vLocal")}
        </button>
        <button id="btn1v1o" class="bg-poke-red text-white py-2 px-6 rounded hover:bg-red-600">
           ${t("vOnline")}
        </button>
        <button id="btnVsAI" class="bg-poke-red text-white py-2 px-6 rounded hover:bg-red-600">
          ${t("PlayvsAI")}
        </button>
        <button id="btn3Player" class="bg-poke-red text-white py-2 px-6 rounded hover:bg-red-600">
          ${t("Plyers")}
        </button>
        <button id="btn4Player" class="bg-poke-red text-white py-2 px-6 rounded hover:bg-red-600">
          ${t("Players")}
        </button>
        <button id="btnBack" class="bg-poke-blue text-white py-2 px-6 rounded hover:bg-blue-600">
          ${t("goBack")}
        </button>
      </div>
    </div>
  `;

  document.getElementById("btn1v1")?.addEventListener("click", () => navigate("/1v1"));
  document.getElementById("btn1v1o")?.addEventListener("click", () => navigate("/invite_on"));
  document.getElementById("btnVsAI")?.addEventListener("click", () => navigate("/vsAI"));
  document.getElementById("btn3Player")?.addEventListener("click", () => navigate("/3player"));
  document.getElementById("btn4Player")?.addEventListener("click", () => navigate("/4player"));
  document.getElementById("btnBack")?.addEventListener("click", () => navigate("/"));
}
