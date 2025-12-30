import { navigate } from "../main.js";
import { t } from "../translations/index.js";

export function GameTournament(app: HTMLElement, state: any): void {
  if (!state.currentMatch || !state.tournamentMatches) {
      navigate("/tournament");
      return;
  }

  const match = state.currentMatch;
  const M = state.tournamentMatches;


  const isEightPlayerBracket = M.hasOwnProperty('Q1');
  const returnRoute = isEightPlayerBracket ? "/tournament8start" : "/tournament4start";


  app.innerHTML = `
    <div class="flex flex-col items-center w-full">
      <div class="text-center mb-4">
          <h1 class="text-poke-yellow text-2xl">POKéMON</h1>
          <p class="text-poke-light text-xs">${match.round.toUpperCase()} - ${match.p1} vs ${match.p2}</p>
      </div>

      <div id="gameCanvasContainer"
        class="bg-black border-2 border-dashed border-poke-dark rounded-lg w-full max-w-[90vw] h-[28rem] flex flex-col items-center justify-center mb-6">
        <canvas id="pongCanvas" width="720" height="400" class="bg-black"></canvas>
        <div class="mt-3 flex gap-2">
          </div>
      </div>

      <div class="text-center">
        <button id="goBackBtn" class="bg-gray-700 bg-opacity-80 text-poke-light py-2 px-6 border-3 border-gray-700 border-b-gray-800 rounded hover:bg-gradient-to-b hover:from-gray-500 hover:to-gray-600 active:animate-press active:border-b-gray-800">
            ${t("Cancel_Match")}
        </button>
      </div>
    </div>
  `;

  const canvasEl = document.getElementById("pongCanvas") as HTMLCanvasElement;
  const ctx = canvasEl.getContext("2d");
  if (!ctx) return;

  const paddleWidth = 10, paddleHeight = 80, ballRadius = 8;
  const playerSpeed = 6, maxScore = 3, speedIncrement = 1.05;

  let wPressed = false, sPressed = false, upPressed = false, downPressed = false;
  let gameRunning = false, gameOver = false;

  const player1 = { name: match.p1, x: 10, y: canvasEl.height / 2 - paddleHeight / 2, score: 0 };
  const player2 = { name: match.p2, x: canvasEl.width - paddleWidth - 10, y: canvasEl.height / 2 - paddleHeight / 2, score: 0 };
  const ball = { x: canvasEl.width / 2, y: canvasEl.height / 2, dx: 3.5 * (Math.random() > 0.5 ? 1 : -1), dy: 3.5 * (Math.random() > 0.5 ? 1 : -1) };

  const drawRect = (x:number, y:number, w:number, h:number, color:string) => { ctx.fillStyle=color; ctx.fillRect(x,y,w,h); };
  const drawCircle = (x:number, y:number, r:number, color:string) => { ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.closePath(); ctx.fill(); };
  const drawText = (text:string, x:number, y:number, color:string, size=20) => { ctx.fillStyle=color; ctx.font=`${size}px monospace`; ctx.fillText(text,x,y); };


  const endMatch = (winnerName: string) => {
      gameOver = true;
      gameRunning = false;
      
      M[match.round].winner = winnerName;
      
      delete state.currentMatch;
      setTimeout(() => {
          navigate(returnRoute); 
      }, 2000); 
  };

  const checkWinner = () => {
    if(player1.score >= maxScore) endMatch(player1.name);
    else if(player2.score >= maxScore) endMatch(player2.name);
  };
  
  const endGame = (msg:string) => {
    drawText(msg, canvasEl.width / 2 - 80, canvasEl.height / 2, "yellow", 24);
  };

  const movePlayers = () => {
    if(wPressed && player1.y>0) player1.y-=playerSpeed;
    if(sPressed && player1.y+paddleHeight<canvasEl.height) player1.y+=playerSpeed;
    if(upPressed && player2.y>0) player2.y-=playerSpeed;
    if(downPressed && player2.y+paddleHeight<canvasEl.height) player2.y+=playerSpeed;
  };

  const resetBall = () => { 
    ball.x = canvasEl.width/2; 
    ball.y = canvasEl.height/2; 
    ball.dx = 3.5 * (Math.random() > 0.5 ? 1 : -1); 
    ball.dy = 3.5 * (Math.random() > 0.5 ? 1 : -1); 
  };

  const update = () => {
    if(!gameRunning || gameOver) return;
    movePlayers();
    ball.x += ball.dx; ball.y += ball.dy;

    if(ball.y+ballRadius>canvasEl.height || ball.y-ballRadius<0) ball.dy=-ball.dy;

    if(ball.x-ballRadius<player1.x+paddleWidth && ball.y>player1.y && ball.y<player1.y+paddleHeight) { 
      ball.dx=-ball.dx*speedIncrement; ball.dy*=speedIncrement; ball.x=player1.x+paddleWidth+ballRadius;
    }
    if(ball.x+ballRadius>player2.x && ball.y>player2.y && ball.y<player2.y+paddleHeight) {
      ball.dx=-ball.dx*speedIncrement; ball.dy*=speedIncrement; ball.x=player2.x-ballRadius;
    }

    if(ball.x-ballRadius<0){ 
      player2.score++; resetBall(); checkWinner(); 
    } else if(ball.x+ballRadius>canvasEl.width){ 
      player1.score++; resetBall(); checkWinner(); 
    }
  };

  const draw = () => {
    drawRect(0,0,canvasEl.width,canvasEl.height,"black");
    drawRect(player1.x,player1.y,paddleWidth,paddleHeight,"white");
    drawRect(player2.x,player2.y,paddleWidth,paddleHeight,"white");
    drawCircle(ball.x,ball.y,ballRadius,"white");
    
    drawText(`${player1.name}: ${player1.score}`, canvasEl.width/4 - 60, 25, "white");
    drawText(`${player2.name}: ${player2.score}`, canvasEl.width*3/4 + 20, 25, "white");
    
    if (gameOver) {
        drawText(`${player1.score > player2.score ? player1.name : player2.name} Wins! 🏆`, 
                 canvasEl.width / 2 - 100, canvasEl.height / 2, "yellow", 24);
    }
  };

  const gameLoop = () => { 
    draw(); 
    update(); 
    if(!gameOver) requestAnimationFrame(gameLoop); 
  };

  document.addEventListener("keydown",e=>{
    if(e.key.toLowerCase()==="w") wPressed=true; 
    if(e.key.toLowerCase()==="s") sPressed=true; 
    if(e.key==="ArrowUp") upPressed=true; 
    if(e.key==="ArrowDown") downPressed=true;
  });
  document.addEventListener("keyup",e=>{
    if(e.key.toLowerCase()==="w") wPressed=false; 
    if(e.key.toLowerCase()==="s") sPressed=false; 
    if(e.key==="ArrowUp") upPressed=false; 
    if(e.key==="ArrowDown") downPressed=false;
  });

  
  document.getElementById("goBackBtn")?.addEventListener("click",()=>{
    delete state.currentMatch;
    gameRunning=false;
    navigate(returnRoute);
  });

  gameRunning=true;
  gameLoop();
}