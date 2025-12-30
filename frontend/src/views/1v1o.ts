import { navigate } from "../main.js";
import { wsService } from "../services/WebSocketService.js";
import { API_ENDPOINTS, apiFetch } from "../config/api.js";

let gameEndedByServer = false;

async function updateEloTs(winner: {score: number, id: number}, loser: {score: number, id: number}) {
  try {
    const res = `${winner.score} - ${loser.score}`;
    const response = await apiFetch(API_ENDPOINTS.MATCHES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        winner_id: winner.id,
        loser_id: loser.id,
        result: res
      })
    });

    if (!response.ok) throw new Error('Failed to update Elo');
    const data = await response.json();
  } catch (error) {
    console.error('Error updating Elo:', error);
  }
}

export function GameOneo(app: HTMLElement) {
  const selfId = localStorage.getItem("userId");
  if (!selfId) { alert("User not logged in"); navigate("/"); return; }

  if ((window as any).currentGameId) {
    alert("You already have a game in progress!");
    navigate("/game");
    return;
  }

  app.innerHTML = `
    <div class="flex flex-col items-center w-full">
      <div class="text-center mb-4">
        <h1 class="text-poke-yellow text-2xl">POKéMON PONG</h1>
        <p class="text-poke-light text-xs">1v1 Online</p>
      </div>
      <div class="bg-black border-2 border-dashed border-poke-dark rounded-lg w-full max-w-[90vw] h-[28rem] flex flex-col items-center justify-center mb-6">
        <canvas id="pongCanvas" width="720" height="400"></canvas>
      </div>
      <div class="text-center">
        <button id="goBackBtn" class="bg-poke-red text-white py-2 px-6 rounded hover:bg-red-600">Go Back</button>
      </div>
    </div>
  `;

  const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;

  const paddleWidth = 10, paddleHeight = 80, ballRadius = 8;
  const playerSpeed = 6;
  const maxScore = 5;

  const player = { x: 0, y: canvas.height/2 - paddleHeight/2, score: 0, id: 0 };
  const opponent = { x: 0, y: canvas.height/2 - paddleHeight/2, score: 0, id: 0 };
  const ball = { x: canvas.width/2, y: canvas.height/2, vx: 5, vy: 3 };

  let up = false, down = false;
  let isHost = false;
  let gameRunning = false;
  let gameId: string;

  const drawRect = (x:number,y:number,w:number,h:number,color:string) => { ctx.fillStyle=color; ctx.fillRect(x,y,w,h); };
  const drawCircle = (x:number,y:number,r:number,color:string) => { ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); };
  const drawText = (text:string,x:number,y:number,color:string,size=20) => { ctx.fillStyle=color; ctx.font=`${size}px monospace`; ctx.fillText(text,x,y); };

  const resetBall = () => {
    ball.x = canvas.width/2;
    ball.y = canvas.height/2;
    ball.vx = (Math.random()>0.5?1:-1)*5;
    ball.vy = (Math.random()>0.5?1:-1)*3;
  };

  const initFromGameStart = (msg:any) => {
    if(!msg || msg.type !== "game-start") return;

    gameId = msg.gameId;
    (window as any).currentGameId = gameId;
    isHost = String(msg.player1) === String(selfId);

    player.x = isHost ? 10 : canvas.width - paddleWidth - 10;
    opponent.x = isHost ? canvas.width - paddleWidth - 10 : 10;
    player.y = opponent.y = canvas.height/2 - paddleHeight/2;

    player.score = 0;
    opponent.score = 0;

    player.id = isHost ? msg.player1 : msg.player2;
    opponent.id = isHost ? msg.player2 : msg.player1;

    if (msg.ball) {
      ball.x = msg.ball.x;
      ball.y = msg.ball.y;
      ball.vx = msg.ball.vx;
      ball.vy = msg.ball.vy;
    } else {
      resetBall();
    }

    gameEndedByServer = false;
    gameRunning = true;
    requestAnimationFrame(gameLoop);
  };

  const sendGameUpdate = () => {
    if(!gameId || !wsService.isConnected() || !gameRunning) return;

    const data: any = {
      playerY: player.y,
      ball: isHost ? { ...ball } : undefined,
      score: { self: player.score, opponent: opponent.score }
    };

    wsService.send({
      type: "game-action",
      gameId,
      action: "move",
      data
    });
  };

  const updatePlayer = () => {
    if (!gameRunning || gameEndedByServer ) return;
    if(up && player.y>0) player.y-=playerSpeed;
    if(down && player.y+paddleHeight<canvas.height) player.y+=playerSpeed;
  };

  const gameLoop = () => {
    if (!gameRunning) return;

    updatePlayer();

    if (isHost) {
      ball.x += ball.vx;
      ball.y += ball.vy;

      if(ball.y - ballRadius < 0 || ball.y + ballRadius > canvas.height) ball.vy *= -1;

      if(ball.x - ballRadius < player.x + paddleWidth && ball.y > player.y && ball.y < player.y + paddleHeight) ball.vx = Math.abs(ball.vx);
      if(ball.x + ballRadius > opponent.x && ball.y > opponent.y && ball.y < opponent.y + paddleHeight) ball.vx = -Math.abs(ball.vx);

      if(ball.x - ballRadius < 0){ opponent.score++; resetBall(); }
      if(ball.x + ballRadius > canvas.width){ player.score++; resetBall(); }

      sendGameUpdate();
    } else {
      sendGameUpdate();
    }

    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawRect(player.x, player.y, paddleWidth, paddleHeight, "white");
    drawRect(opponent.x, opponent.y, paddleWidth, paddleHeight, "white");
    drawCircle(ball.x, ball.y, ballRadius, "white");
    drawText(`${player.score}`, canvas.width/4, 25, "white");
    drawText(`${opponent.score}`, canvas.width*3/4, 25, "white");

    if(player.score >= maxScore || opponent.score >= maxScore){
      gameRunning = false;
      drawText(player.score >= maxScore ? "You Win! 🏆" : "You Lose! 💀",
        canvas.width/2-60, canvas.height/2, "yellow", 24);

      if(isHost){
        wsService.send({ type:"game-end", gameId });
        if(player.score >= maxScore) updateEloTs(player, opponent);
        else updateEloTs(opponent, player);
      }
      return;
    }

    requestAnimationFrame(gameLoop);
  };

  wsService.on("game-update", (msg:any) => {
    if(msg.gameId !== gameId) return;
    const data = msg.data;
    if(!data) return;

    if(!isHost){
      if(data.ball){ ball.x=data.ball.x; ball.y=data.ball.y; ball.vx=data.ball.vx; ball.vy=data.ball.vy; }
      if(data.score){ player.score=data.score.opponent; opponent.score=data.score.self; }
      if(data.playerY !== undefined) opponent.y=data.playerY;
    } else {
      if(data.playerY !== undefined) opponent.y=data.playerY;
    }
  });

  wsService.on("game-ended", (msg:any) => {
    if(msg.gameId !== gameId) return;
    gameRunning=false;
    gameEndedByServer=true;
    (window as any).currentGameId = null;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawText("Game End", canvas.width/2-60, canvas.height/2, "yellow", 24);
  });

  document.addEventListener("keydown", e => { if(e.key==="ArrowUp"||e.key==="w") up=true; if(e.key==="ArrowDown"||e.key==="s") down=true; });
  document.addEventListener("keyup", e => { if(e.key==="ArrowUp"||e.key==="w") up=false; if(e.key==="ArrowDown"||e.key==="s") down=false; });

  document.getElementById("goBackBtn")?.addEventListener("click", ()=>{
    gameRunning=false;
    (window as any).currentGameId = null;
    navigate("/game");
  });

  if(wsService.lastGameStart) initFromGameStart(wsService.lastGameStart);
  else wsService.on("game-start", initFromGameStart);
}
