import { navigate } from "../main.js";
import { t } from "../translations/index.js";

export function GameFour(app: HTMLElement, state?: any): void {
  app.innerHTML = `
    <div class="flex flex-col items-center w-full">
      <div class="text-center mb-4">
          <h1 class="text-poke-yellow text-2xl">POKéMON</h1>
          <p class="text-poke-light text-xs">${t("Player4Mode")}</p>
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
  const ctx = canvasEl.getContext("2d")!;
  if (!ctx) return;

  const paddleWidth = 10,
        paddleHeight = 80,
        paddleHorizontalWidth = 140,
        paddleHorizontalHeight = 12,
        ballRadius = 8;

  const playerSpeed = 6, maxScore = 3, speedIncrement = 1.05;

  let wPressed = false, sPressed = false;
  let upPressed = false, downPressed = false;
  let tPressed = false, yPressed = false;
  let bPressed = false, vPressed = false;

  let gameRunning = false, gameOver = false;

  const player1 = { x: 10, y: canvasEl.height/2 - paddleHeight/2, score: 0, active: true }; // left
  const player2 = { x: canvasEl.width - paddleWidth - 10, y: canvasEl.height/2 - paddleHeight/2, score: 0, active: true }; // right
  const player3 = { x: canvasEl.width/2 - paddleHorizontalWidth/2, y: 10, score: 0, active: true }; // top
  const player4 = { x: canvasEl.width/2 - paddleHorizontalWidth/2, y: canvasEl.height - paddleHorizontalHeight - 10, score: 0, active: true }; // bottom

  const ball = {
    x: canvasEl.width/2,
    y: canvasEl.height/2,
    dx: 3.5 * (Math.random() > 0.5 ? 1 : -1),
    dy: 3.5 * (Math.random() > 0.5 ? 1 : -1)
  };

  const drawRect = (x:number, y:number, w:number, h:number, color:string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };

  const drawCircle = (x:number, y:number, r:number, color:string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  };

  const drawText = (text:string, x:number, y:number, color:string, size=20) => {
    ctx.fillStyle = color;
    ctx.font = `${size}px monospace`;
    ctx.fillText(text, x, y);
  };

  function movePlayers() {
    if(player1.active){
      if(wPressed && player1.y>0) player1.y -= playerSpeed;
      if(sPressed && player1.y+paddleHeight<canvasEl.height) player1.y += playerSpeed;
    }
    if(player2.active){
      if(upPressed && player2.y>0) player2.y -= playerSpeed;
      if(downPressed && player2.y+paddleHeight<canvasEl.height) player2.y += playerSpeed;
    }
    if(player3.active){
      if(tPressed && player3.x>0) player3.x -= playerSpeed;
      if(yPressed && player3.x+paddleHorizontalWidth<canvasEl.width) player3.x += playerSpeed;
    }
    if(player4.active){
      if(bPressed && player4.x>0) player4.x -= playerSpeed;
      if(vPressed && player4.x+paddleHorizontalWidth<canvasEl.width) player4.x += playerSpeed;
    }
  }

  function resetBall() {
    ball.x = canvasEl.width/2;
    ball.y = canvasEl.height/2;
    ball.dx = 3.5 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = 3.5 * (Math.random() > 0.5 ? 1 : -1);
  }

  function checkWinner() {
    const activePlayers = [player1, player2, player3, player4].filter(p => p.active);
    if(activePlayers.length <= 1) {
      const winner = activePlayers[0];
      endGame(winner ? "Winner! 🏆" : "Draw!");
    }
  }

  function endGame(msg:string) {
    gameRunning = false;
    gameOver = true;
    drawText(msg, canvasEl.width/2 - 80, canvasEl.height/2, "yellow", 24);
    restartBtn.classList.remove("hidden");
  }

  function update() {
    if(!gameRunning || gameOver) return;

    movePlayers();

    ball.x += ball.dx;
    ball.y += ball.dy;

    if(ball.x-ballRadius<0 && !player1.active) ball.dx = Math.abs(ball.dx);
    if(ball.x+ballRadius>canvasEl.width && !player2.active) ball.dx = -Math.abs(ball.dx);
    if(ball.y-ballRadius<0 && !player3.active) ball.dy = Math.abs(ball.dy);
    if(ball.y+ballRadius>canvasEl.height && !player4.active) ball.dy = -Math.abs(ball.dy);

    if(player1.active &&
      ball.x-ballRadius < player1.x + paddleWidth &&
      ball.y > player1.y && ball.y < player1.y+paddleHeight) {
        ball.dx = -ball.dx * speedIncrement;
        ball.dy *= speedIncrement;
        ball.x = player1.x + paddleWidth + ballRadius;
    }

    if(player2.active &&
      ball.x+ballRadius > player2.x &&
      ball.y > player2.y && ball.y < player2.y+paddleHeight) {
        ball.dx = -ball.dx * speedIncrement;
        ball.dy *= speedIncrement;
        ball.x = player2.x - ballRadius;
    }

    if(player3.active &&
      ball.y-ballRadius < player3.y + paddleHorizontalHeight &&
      ball.x > player3.x && ball.x < player3.x + paddleHorizontalWidth) {
        ball.dy = -ball.dy * speedIncrement;
        ball.dx *= speedIncrement;
        ball.y = player3.y + paddleHorizontalHeight + ballRadius;
    }

    if(player4.active &&
      ball.y+ballRadius > player4.y &&
      ball.x > player4.x && ball.x < player4.x + paddleHorizontalWidth) {
        ball.dy = -ball.dy * speedIncrement;
        ball.dx *= speedIncrement;
        ball.y = player4.y - ballRadius;
    }

    if(ball.x - ballRadius < 0 && player1.active){
      player1.score++;
      if(player1.score >= maxScore) player1.active = false;
      resetBall(); checkWinner();
    }
    if(ball.x + ballRadius > canvasEl.width && player2.active){
      player2.score++;
      if(player2.score >= maxScore) player2.active = false;
      resetBall(); checkWinner();
    }
    if(ball.y - ballRadius < 0 && player3.active){
      player3.score++;
      if(player3.score >= maxScore) player3.active = false;
      resetBall(); checkWinner();
    }
    if(ball.y + ballRadius > canvasEl.height && player4.active){
      player4.score++;
      if(player4.score >= maxScore) player4.active = false;
      resetBall(); checkWinner();
    }
  }

  function draw() {
    drawRect(0,0,canvasEl.width,canvasEl.height,"black");

    if(player1.active) drawRect(player1.x, player1.y, paddleWidth, paddleHeight, "white");
    if(player2.active) drawRect(player2.x, player2.y, paddleWidth, paddleHeight, "white");
    if(player3.active) drawRect(player3.x, player3.y, paddleHorizontalWidth, paddleHorizontalHeight, "white");
    if(player4.active) drawRect(player4.x, player4.y, paddleHorizontalWidth, paddleHorizontalHeight, "white");

    drawCircle(ball.x, ball.y, ballRadius, "white");

    drawText(`${player1.score}`, 20, canvasEl.height - 20, "white");
    drawText(`${player2.score}`, canvasEl.width - 40, canvasEl.height - 20, "white");
    drawText(`${player3.score}`, canvasEl.width/2 - 10, 40, "white");
    drawText(`${player4.score}`, canvasEl.width/2 - 10, canvasEl.height - 20, "white");
  }

  function gameLoop() {
    draw();
    update();
    if(gameRunning) requestAnimationFrame(gameLoop);
  }

  document.addEventListener("keydown", e=>{
    const k = e.key.toLowerCase();
    if(k==="w") wPressed=true;
    if(k==="s") sPressed=true;
    if(k==="arrowup") upPressed=true;
    if(k==="arrowdown") downPressed=true;
    if(k==="t") tPressed=true;
    if(k==="y") yPressed=true;
    if(k==="v") bPressed=true;
    if(k==="b") vPressed=true;
  });

  document.addEventListener("keyup", e=>{
    const k = e.key.toLowerCase();
    if(k==="w") wPressed=false;
    if(k==="s") sPressed=false;
    if(k==="arrowup") upPressed=false;
    if(k==="arrowdown") downPressed=false;
    if(k==="t") tPressed=false;
    if(k==="y") yPressed=false;
    if(k==="v") bPressed=false;
    if(k==="b") vPressed=false;
  });

  const restartBtn = document.getElementById("restartBtn")!;
  const goBackBtn = document.getElementById("goBackBtn")!;

  restartBtn.addEventListener("click", ()=>{
    player1.active = player2.active = player3.active = player4.active = true;
    player1.score = player2.score = player3.score = player4.score = 0;
    gameOver = false;
    gameRunning = true;
    restartBtn.classList.add("hidden");
    resetBall();
    gameLoop();
  });

  goBackBtn.addEventListener("click", ()=>{
    navigate("/game");
  });

  gameRunning = true;
  gameLoop();
}
