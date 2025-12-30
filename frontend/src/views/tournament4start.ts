import { navigate } from "../main.js";
import { t } from "../translations/index.js";

export function Tournament4StartView(app: HTMLElement, state: any) {
  if (!state.tournamentPlayers || state.tournamentPlayers.length !== 4) {
    navigate("/tournament");
    return;
  }

  if (!state.tournamentMatches) {
    const players = [...state.tournamentPlayers].sort(() => Math.random() - 0.5);
    state.tournamentMatches = {
      semi1: { p1: players[0], p2: players[1], winner: null },
      semi2: { p1: players[2], p2: players[3], winner: null },
      final: { p1: null, p2: null, winner: null }
    };
  }

  const M = state.tournamentMatches;
  
  const isTournamentComplete = M.final.winner !== null;

  let nextMatchData = null;
  let nextMatchRound = null;
  
  if (!M.semi1.winner) {
      nextMatchRound = "semi1";
      nextMatchData = M.semi1;
  } else if (!M.semi2.winner) {
      nextMatchRound = "semi2";
      nextMatchData = M.semi2;
  } else if (M.semi1.winner && M.semi2.winner && !M.final.winner) {
      nextMatchRound = "final";
      if (!M.final.p1 || !M.final.p2) {
          M.final.p1 = M.semi1.winner;
          M.final.p2 = M.semi2.winner;
      }
      nextMatchData = M.final;
  }


  app.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full 
                bg-gradient-to-b from-black via-gray-900 to-black 
                text-white p-6">

      <h1 class="text-3xl font-bold text-poke-yellow drop-shadow-lg mb-6">
        ⭐ 4 ${t("PlayerTournament")} ⭐
      </h1>

      <div class="backdrop-blur-md bg-black bg-opacity-40 
                  p-6 rounded-xl shadow-2xl border border-yellow-600 
                  w-full max-w-lg flex flex-col gap-8">

        <div class="flex flex-col items-center gap-2">
          <h2 class="text-xl font-bold text-poke-yellow">Semifinal 1</h2>

          <p class="text-lg">${M.semi1.p1} <span class="text-poke-red">vs</span> ${M.semi1.p2}</p>

          ${
            M.semi1.winner
              ? `<p class="text-green-400 text-lg">${t("Winner")}: <b>${M.semi1.winner}</b></p>`
              : "" 
          }
        </div>

        <div class="flex flex-col items-center gap-2">
          <h2 class="text-xl font-bold text-poke-yellow">Semifinal 2</h2>

          <p class="text-lg">${M.semi2.p1} <span class="text-poke-red">vs</span> ${M.semi2.p2}</p>

          ${
            M.semi2.winner
              ? `<p class="text-green-400 text-lg">${t("Winner")}: <b>${M.semi2.winner}</b></p>`
              : ""
          }
        </div>

        <div class="flex flex-col items-center border-t border-gray-500 pt-6 gap-2">
          <h2 class="text-xl font-bold text-poke-yellow">FINAL</h2>

          ${
            M.final.winner
              ? `<p class="text-green-300 text-2xl font-bold drop-shadow-md">
                   🏆${t("Champion")}: ${M.final.winner}🏆
                 </p>`
              : `
                <p class="text-lg">
                  ${
                    M.semi1.winner && M.semi2.winner
                      ? `${M.semi1.winner} <span class="text-poke-red">vs</span> ${M.semi2.winner}`
                      : "<span class='opacity-50'>Waiting for semifinal winners…</span>"
                  }
                </p>`
          }
        </div>
        
        ${!isTournamentComplete
            ? `<button id="startTournamentBtn"
                      class="bg-green-600 hover:bg-green-700 
                             text-white text-xl font-bold 
                             py-3 px-8 rounded-lg shadow-lg mt-6">
                  ▶️ ${t("StartTournament")}
              </button>`
            : ""
        }

        <button id="backBtn"
                class="bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-md mt-4">
          ${t("goBack")}
        </button>

      </div>
    </div>
  `;


  const startTournamentBtn = document.getElementById("startTournamentBtn");
  
  if (startTournamentBtn && nextMatchRound && nextMatchData) {
    startTournamentBtn.addEventListener("click", () => {
      state.currentMatch = { 
        round: nextMatchRound, 
        p1: nextMatchData.p1, 
        p2: nextMatchData.p2 
      };
      navigate("/game-tournament");
    });
  }

  document.getElementById("backBtn")!.addEventListener("click", () => {
    delete state.tournamentMatches;
    delete state.tournamentPlayers;
    navigate("/tournament");
  });
}