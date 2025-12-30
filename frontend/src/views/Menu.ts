import { navigate } from "../main.js";
import { t } from "../translations/index.js";
import { fetchAvatarUrl } from "./Header.js";

export function MenuView(app: HTMLElement, state: any): void {
  let avatarSrc = "";
  if (state.player.avatar !== null && state.player.avatar !== undefined) {
    if (typeof state.player.avatar === "number") {
      avatarSrc = `/assets/avatar${state.player.avatar}.png`;
    } else if (typeof state.player.avatar === "string") {
      avatarSrc = state.player.avatar;
    }
  }

  const token = localStorage.getItem("tokenUser");
  const userId = localStorage.getItem('userId');
  const userIdPlaceholder = userId ? parseInt(userId, 10) : null;

  fetchAvatarUrl(userIdPlaceholder, token).then((avatarUrl) => {

        let avatarSrc = avatarUrl || "/assets/avatar_39.png";

    app.innerHTML = `
      <div class="bg-poke-light bg-opacity-60 text-poke-dark border-3 border-poke-dark p-6 rounded-lg shadow-lg max-w-sm mx-auto flex flex-col items-center text-center">
        <h1 class="text-sm leading-relaxed mb-4">${t("Me")}</h1>

        ${avatarSrc ? `<img src="${avatarSrc}"
          id="avBtn"
          class="w-40 h-40 rounded-full cursor-pointer hover:opacity-80 mb-6"/>` : ""}

        <div class="flex flex-col w-full space-y-2">
          <button id="matchHistoryBtn" class="bg-poke-blue bg-opacity-80 text-poke-light py-2 border-3 border-poke-blue border-b-blue-800 rounded hover:bg-gradient-to-b hover:from-blue-500 hover:to-blue-600 active:animate-press active:border-b-blue-800">
            ${t("matchHistory")}
          </button>
          <button id="friends" class="bg-poke-red bg-opacity-80 text-poke-light py-2 border-3 border-poke-red border-b-red-800 rounded hover:bg-gradient-to-b hover:from-red-500 hover:to-red-600 active:animate-press active:border-b-red-800">
            ${t("friends")}
          </button>
          <button id="gostats" class="bg-poke-blue bg-opacity-80 text-poke-light py-2 border-3 border-poke-blue border-b-blue-800 rounded hover:bg-gradient-to-b hover:from-blue-500 hover:to-blue-600 active:animate-press active:border-b-blue-800">
            ${t("Stats")}
          </button>
          <button id="goBackBtn" class="bg-poke-red bg-opacity-80 text-poke-light py-2 border-3 border-poke-red border-b-red-800 rounded hover:bg-gradient-to-b hover:from-red-500 hover:to-red-600 active:animate-press active:border-b-red-800">
            ${t("goBack")}
          </button>
        </div>
      </div>
    `;

    document.getElementById("goBackBtn")?.addEventListener("click", () => navigate("/"));
    document.getElementById("friends")?.addEventListener("click", () => navigate("/friends"));
    document.getElementById("gostats")?.addEventListener("click", () => navigate("/statistics"));
    document.getElementById("matchHistoryBtn")?.addEventListener("click", () => navigate("/match-history"));
  });
}
