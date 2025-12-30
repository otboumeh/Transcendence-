import { navigate } from "../main.js";
import { t } from "../translations/index.js";
import { API_ENDPOINTS, apiFetch } from "../config/api.js";

const MAX_MATCHES = 8;

export async function MatchHistoryView(app: HTMLElement, state: any): Promise<void> {
  interface matchEntry {
    status: "win" | "lose";
    result: string;
    elo: string;
    against: number;
  }

  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('tokenUser');

  let matches: matchEntry[] = [];

  try {
    const res = await apiFetch(`${API_ENDPOINTS.MATCHES}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${state.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ user_id: userId })
    });

    if (res.ok) {
        const json = await res.json();
        
        matches = json.data ?? [];

        if (matches.length > MAX_MATCHES) {
             matches = matches.slice(-MAX_MATCHES);
        }
        
    } else {
        console.error("API error fetching match history:", res.status);
    }

  } catch (error) {
    console.error("Error fetching match history:", error);
    matches = [];
  }

  app.innerHTML = `
    <div class="bg-poke-light bg-opacity-60 text-poke-dark border-3 border-poke-dark p-6 rounded-lg shadow-lg max-w-lg mx-auto flex flex-col items-center text-center">
      <h1 class="text-xl leading-relaxed mb-6 font-extrabold">${t("matchHistory")}</h1>

      <div class="w-full mb-6">
        
        <div class="grid grid-cols-3 gap-2 font-bold border-b-2 border-poke-dark pb-3 mb-2 px-2 text-sm">
          <span class="text-left">${t("opponentId")}</span>
          <span class="text-center">${t("result")}</span>
          <span class="text-right">${t("eloChange")}</span>
        </div>

        <div class="space-y-3">
          ${matches.map(m => {
            const isWin = m.status === "win";
            const statusText = isWin ? t("win") : t("loss");
            
            const bgColorClass = isWin ? "bg-green-200 border-green-700" : "bg-red-200 border-red-700";
            const textColorClass = isWin ? "text-green-800" : "text-red-800";
            
            return `
              <div class="grid grid-cols-3 gap-2 items-center py-2 px-2 border-2 rounded shadow-sm ${m.status === "win" ? "bg-green-100" : "bg-red-100"}">
                
                <span class="text-left text-sm truncate ${textColorClass}">#${m.against}</span>
                
                <span class="text-center text-sm font-bold ${textColorClass}">
                    ${m.result} (${statusText})
                </span>
                
                <span class="text-right text-sm font-bold ${textColorClass}">
                    ${m.elo}
                </span>
              </div>
            `;
          }).join("")}

          ${matches.length === 0 ? `<p class="mt-4 text-gray-600">${t("noMatchesPlayed")}</p>` : ''}

        </div>
      </div>

      <button id="goBackBtn" class="bg-poke-red bg-opacity-80 text-poke-light py-2 px-6 border-3 border-poke-red border-b-red-800 rounded hover:bg-gradient-to-b hover:from-red-500 hover:to-red-600 hover:border-b-red-800 active:animate-press active:border-b-red-800">
        ${t("goBack")}
      </button>
    </div>
  `;

  document.getElementById("goBackBtn")?.addEventListener("click", () => navigate("/menu"));
}