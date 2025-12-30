
import { navigate } from "../main.js";
import { t } from "../translations/index.js";

type Match = { p1: string | null, p2: string | null, winner: string | null };

export function Tournament8StartView(app: HTMLElement, state: any) {
  if (!state.tournamentPlayers || state.tournamentPlayers.length !== 8) {
    navigate("/tournament");
    return;
  }

  if (!state.tournamentMatches) {
    const players = [...state.tournamentPlayers].sort(() => Math.random() - 0.5);
    state.tournamentMatches = {
      Q1: { p1: players[0], p2: players[1], winner: null },
      Q2: { p1: players[2], p2: players[3], winner: null },
      Q3: { p1: players[4], p2: players[5], winner: null },
      Q4: { p1: players[6], p2: players[7], winner: null },
      S1: { p1: null, p2: null, winner: null },
      S2: { p1: null, p2: null, winner: null },
      F: { p1: null, p2: null, winner: null }
    };
  }

  const M = state.tournamentMatches;
  
  
  M.S1.p1 = M.Q1.winner; M.S1.p2 = M.Q2.winner;
  M.S2.p1 = M.Q3.winner; M.S2.p2 = M.Q4.winner;

  M.F.p1 = M.S1.winner; M.F.p2 = M.S2.winner;

  const isTournamentComplete = M.F.winner !== null;

  let nextMatchData: Match | null = null;
  let nextMatchRound: string | null = null;
  let currentRoundName = "";
  
  if (!M.Q1.winner) { nextMatchRound = "Q1"; nextMatchData = M.Q1; currentRoundName = "Cuartos de Final"; } 
  else if (!M.Q2.winner) { nextMatchRound = "Q2"; nextMatchData = M.Q2; currentRoundName = "Cuartos de Final"; }
  else if (!M.Q3.winner) { nextMatchRound = "Q3"; nextMatchData = M.Q3; currentRoundName = "Cuartos de Final"; }
  else if (!M.Q4.winner) { nextMatchRound = "Q4"; nextMatchData = M.Q4; currentRoundName = "Cuartos de Final"; }
  else if (!M.S1.winner && M.S1.p1 && M.S1.p2) { nextMatchRound = "S1"; nextMatchData = M.S1; currentRoundName = "Semi1"; } 
  else if (!M.S2.winner && M.S2.p1 && M.S2.p2) { nextMatchRound = "S2"; nextMatchData = M.S2; currentRoundName = "Semi2"; }
  else if (!M.F.winner && M.F.p1 && M.F.p2) { nextMatchRound = "F"; nextMatchData = M.F; currentRoundName = "Final"; }


  function renderMatch(
      id: string, 
      match: Match, 
      p1Waiting = "Jugador 1",
      p2Waiting = "Jugador 2"
  ): string {
    const player1 = match.p1 || p1Waiting;
    const player2 = match.p2 || p2Waiting;
    
    return `
      <div class="flex flex-col items-center gap-1 min-w-[100px] p-2 border border-gray-700 rounded-lg">
        <h4 class="text-xs font-semibold text-gray-400">${t(id)}</h4>
        ${
          match.winner
            ? `<p class="text-green-400 text-sm">${t("Winner")} <b>${match.winner}</b></p>`
            : `<p class="text-xs ${match.p1 && match.p2 ? 'text-white' : 'opacity-50'}">
                 ${player1} <span class="text-poke-red">vs</span> ${player2}
               </p>`
        }
      </div>
    `;
  }


  app.innerHTML = `
    <div class="flex flex-col items-center w-full min-h-screen 
                bg-gradient-to-b from-black via-gray-900 to-black 
                text-white p-4">

      <h1 class="text-2xl font-bold text-poke-yellow drop-shadow-lg mb-4">
        🏆 8 ${t("PlayerTournament")} 🏆
      </h1>

      <div class="backdrop-blur-md bg-black bg-opacity-40 
                  p-4 rounded-xl shadow-2xl border border-yellow-600 
                  w-full max-w-2xl flex flex-col gap-6">

        <h3 class="text-lg font-bold text-poke-red border-b border-gray-600 pb-2">${t("CuartosdeFinal")}</h3>
        <div class="flex flex-row flex-wrap justify-center gap-2"> ${renderMatch("Q1", M.Q1, M.Q1.p1, M.Q1.p2)}
          ${renderMatch("Q2", M.Q2, M.Q2.p1, M.Q2.p2)}
          ${renderMatch("Q3", M.Q3, M.Q3.p1, M.Q3.p2)}
          ${renderMatch("Q4", M.Q4, M.Q4.p1, M.Q4.p2)}
        </div>
        
        <h3 class="text-lg font-bold text-poke-red border-b border-t border-gray-600 pt-4 pb-2 mt-4">${t("Semifinales")}</h3>
        <div class="flex flex-row justify-center gap-4"> ${renderMatch("S1", M.S1, M.Q1.winner ? M.Q1.winner : 'G-Q1', M.Q2.winner ? M.Q2.winner : 'G-Q2')}
          ${renderMatch("S2", M.S2, M.Q3.winner ? M.Q3.winner : 'G-Q3', M.Q4.winner ? M.Q4.winner : 'G-Q4')}
        </div>

        <div class="flex flex-col items-center border-t border-gray-500 pt-6 gap-2 mt-6">
          <h2 class="text-xl font-bold text-poke-yellow">FINAL</h2>
          
          ${M.F.winner
            ? `<p class="text-green-300 text-2xl font-bold drop-shadow-md">
                 🏆 ${t("Champion")}: ${M.F.winner} 🏆
               </p>`
            : `
              <p class="text-md">
                ${M.S1.winner && M.S2.winner
                  ? `${M.S1.winner} <span class="text-poke-red">vs</span> ${M.S2.winner}`
                  : "<span class='opacity-50 text-sm'>Esperando ganadores de Semifinal…</span>"
                }
              </p>`
          }
        </div>
        
        ${!isTournamentComplete
            ? `<button id="startTournamentBtn"
                      class="bg-green-600 hover:bg-green-700 
                             text-white text-lg font-bold 
                             py-2 px-6 rounded-lg shadow-lg mt-4">
                  ▶️ ${t("StartTournament")} (${nextMatchRound ? t(nextMatchRound) : 'Esperando'})
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
        p1: nextMatchData!.p1, 
        p2: nextMatchData!.p2 
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