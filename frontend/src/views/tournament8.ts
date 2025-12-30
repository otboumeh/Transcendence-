
import { navigate } from "../main.js";
import { t } from "../translations/index.js";

export function Tournament8View(app: HTMLElement, state?: any): void {
  app.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full space-y-6">

      <h1 class="text-2xl text-poke-yellow font-bold"> 8 ${t("PlayerTournament")}</h1>

      <div class="bg-poke-light bg-opacity-20 p-6 rounded-lg shadow-lg flex flex-col gap-4 w-full max-w-sm">

        <input id="p1" placeholder="${t("Player1")}" 
          class="py-2 px-3 rounded border border-poke-dark bg-white text-black"/>
        <input id="p2" placeholder="${t("Player2")}" 
          class="py-2 px-3 rounded border border-poke-dark bg-white text-black"/>
        <input id="p3" placeholder="${t("Player3")}" 
          class="py-2 px-3 rounded border border-poke-dark bg-white text-black"/>
        <input id="p4" placeholder="${t("Player4")}" 
          class="py-2 px-3 rounded border border-poke-dark bg-white text-black"/>
        <input id="p5" placeholder="${t("Player5")}" 
          class="py-2 px-3 rounded border border-poke-dark bg-white text-black"/>
        <input id="p6" placeholder="${t("Player6")}" 
          class="py-2 px-3 rounded border border-poke-dark bg-white text-black"/>
        <input id="p7" placeholder="${t("Player7")}" 
          class="py-2 px-3 rounded border border-poke-dark bg-white text-black"/>
        <input id="p8" placeholder="${t("Player8")}" 
          class="py-2 px-3 rounded border border-poke-dark bg-white text-black"/>

        <p id="errorMsg" class="text-red-500 text-center text-sm hidden"></p>

        <button id="startBtn"
          class="bg-poke-red text-white py-2 rounded hover:bg-red-600">
          ${t("StartTournament")}
        </button>

        <button id="backBtn"
          class="bg-poke-blue text-white py-2 rounded hover:bg-blue-600">
          ${t("goBack")}
        </button>

      </div>

    </div>
  `;

  const inputs = Array.from({ length: 8 }, (_, i) => 
    document.getElementById(`p${i + 1}`) as HTMLInputElement
  );
  const errorMsg = document.getElementById("errorMsg") as HTMLElement;

  const startBtn = document.getElementById("startBtn")!;
  const backBtn = document.getElementById("backBtn")!;

  startBtn.addEventListener("click", () => {
    const names = inputs.map(input => input.value.trim());

    if (names.some(n => n === "")) {
      showError("Se requieren los nombres de los 8 jugadores.");
      return;
    }

    const unique = new Set(names);
    if (unique.size !== names.length) {
      showError("Los nombres de los jugadores deben ser únicos. No se permiten duplicados.");
      return;
    }

    errorMsg.classList.add("hidden");

    state.tournamentPlayers = names;

    navigate("/tournament8start");
  });

  backBtn.addEventListener("click", () => navigate("/tournament"));
  
  function showError(msg: string) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove("hidden");
  }
}