import { navigate } from "../main.js";
import { t } from "../translations/index.js";

export function GameVsAI(app: HTMLElement, state?: any): void {
  app.innerHTML = `
    <div class="flex flex-col items-center w-full">
      <div class="text-center mb-4">
          <h1 class="text-poke-yellow text-2xl">POKéMON</h1>
          <p class="text-poke-light text-xs">Play vs AI</p>
      </div>

      <div id="gameCanvasContainer"
        class="bg-black border-2 border-dashed border-poke-dark rounded-lg w-full max-w-[90vw] h-[28rem] flex flex-col items-center justify-center mb-6">
        <canvas id="pongCanvas" width="720" height="400" class="bg-black"></canvas>
        <div class="mt-3 flex gap-2">
          <button id="restartBtn" class="bg-poke-red text-white py-1 px-3 rounded hover:bg-red-600 hidden">${t("Restart")}</button>
        </div>
      </div>

      <div class="text-center">
        <button id="goBackBtn" class="bg-poke-red bg-opacity-80 text-poke-light py-2 px-6 border-3 border-poke-red border-b-red-800 rounded hover:bg-gradient-to-b hover:from-red-500 hover:to-red-600 hover:border-b-red-800 active:animate-press active:border-b-red-800">
            ${t("goBack")}
        </button>
      </div>
    </div>
  `;

  const canvasEl = document.getElementById("pongCanvas") as HTMLCanvasElement;
  const ctx = canvasEl.getContext("2d");
  if (!ctx) return;

  const paddleWidth = 10, paddleHeight = 80, ballRadius = 8;
  const playerSpeed = 6, aiSpeed = 4, maxScore = 3, speedIncrement = 1.05;

  let wPressed = false, sPressed = false;
  let gameRunning = false, gameOver = false;

  const player1 = { x: 10, y: canvasEl.height/2 - paddleHeight/2, score: 0 };
  const player2 = { x: canvasEl.width - paddleWidth - 10, y: canvasEl.height/2 - paddleHeight/2, score: 0 };
  const ball = { x: canvasEl.width/2, y: canvasEl.height/2, dx: 3.5*(Math.random()>0.5?1:-1), dy: 3.5*(Math.random()>0.5?1:-1) };

  const drawRect = (x:number, y:number, w:number, h:number, color:string) => { ctx.fillStyle=color; ctx.fillRect(x,y,w,h); };
  const drawCircle = (x:number, y:number, r:number, color:string) => { ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.closePath(); ctx.fill(); };
  const drawText = (text:string, x:number, y:number, color:string, size=20) => { ctx.fillStyle=color; ctx.font=`${size}px monospace`; ctx.fillText(text,x,y); };

  function movePlayers() {
    if(wPressed && player1.y>0) player1.y-=playerSpeed;
    if(sPressed && player1.y+paddleHeight<canvasEl.height) player1.y+=playerSpeed;

    const target = ball.y - paddleHeight/2 + ballRadius;
    if(player2.y + paddleHeight/2 < target) player2.y += aiSpeed;
    else if(player2.y + paddleHeight/2 > target) player2.y -= aiSpeed;

    if(player2.y < 0) player2.y = 0;
    if(player2.y + paddleHeight > canvasEl.height) player2.y = canvasEl.height - paddleHeight;
  }

  function resetBall() {
    ball.x = canvasEl.width/2;
    ball.y = canvasEl.height/2;
    ball.dx = 3.5*(Math.random()>0.5?1:-1);
    ball.dy = 3.5*(Math.random()>0.5?1:-1);
  }

  function checkWinner() {
    if(player1.score>=maxScore) endGame("Player wins! 🏆");
    else if(player2.score>=maxScore) endGame("AI wins 😢");
  }

  function endGame(msg:string) {
    gameRunning=false; gameOver=true;
    drawText(msg, canvasEl.width/2 - 80, canvasEl.height/2, "yellow", 24);
    restartBtn!.classList.remove("hidden");
  }

  function update() {
    if(!gameRunning || gameOver) return;
    movePlayers();
    ball.x += ball.dx;
    ball.y += ball.dy;

    if(ball.y-ballRadius<0 || ball.y+ballRadius>canvasEl.height) ball.dy=-ball.dy;

    if(ball.x-ballRadius<player1.x+paddleWidth && ball.y>player1.y && ball.y<player1.y+paddleHeight){
      ball.dx=-ball.dx*speedIncrement;
      ball.dy*=speedIncrement;
      ball.x=player1.x+paddleWidth+ballRadius;
    }
    if(ball.x+ballRadius>player2.x && ball.y>player2.y && ball.y<player2.y+paddleHeight){
      ball.dx=-ball.dx*speedIncrement;
      ball.dy*=speedIncrement;
      ball.x=player2.x-ballRadius;
    }

    if(ball.x-ballRadius<0){ player2.score++; resetBall(); checkWinner(); }
    if(ball.x+ballRadius>canvasEl.width){ player1.score++; resetBall(); checkWinner(); }
  }

  function draw() {
    drawRect(0,0,canvasEl.width,canvasEl.height,"black");
    drawRect(player1.x,player1.y,paddleWidth,paddleHeight,"white");
    drawRect(player2.x,player2.y,paddleWidth,paddleHeight,"white");
    drawCircle(ball.x,ball.y,ballRadius,"white");
    drawText(`${player1.score}`, canvasEl.width/4,25,"white");
    drawText(`${player2.score}`, canvasEl.width*3/4,25,"white");
  }

  function gameLoop() {
    draw();
    update();
    if(gameRunning) requestAnimationFrame(gameLoop);
  }

  document.addEventListener("keydown", e=>{
    if(e.key.toLowerCase()==="w") wPressed=true;
    if(e.key.toLowerCase()==="s") sPressed=true;
  });
  document.addEventListener("keyup", e=>{
    if(e.key.toLowerCase()==="w") wPressed=false;
    if(e.key.toLowerCase()==="s") sPressed=false;
  });

  const restartBtn = document.getElementById("restartBtn")!;
  const goBackBtn = document.getElementById("goBackBtn")!;

  restartBtn.addEventListener("click", ()=>{
    player1.score=0; player2.score=0; gameOver=false; gameRunning=true;
    restartBtn.classList.add("hidden");
    resetBall();
    gameLoop();
  });

  goBackBtn.addEventListener("click", ()=>{
    player1.score=0; player2.score=0; gameOver=false; gameRunning=false;
    restartBtn.classList.add("hidden");
    resetBall(); draw();
    navigate("/game");
  });

  gameRunning = true;
  gameLoop();
}
