import { navigate } from "../main.js";
import { t } from "../translations/index.js";

export function GameThree(app: HTMLElement, state?: any): void {
  app.innerHTML = `
    <div class="flex flex-col items-center w-full">
      <div class="text-center mb-4">
          <h1 class="text-poke-yellow text-2xl">POKéMON</h1>
          <p class="text-poke-light text-xs">${t("Player3Mode")}</p>
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

  const paddleWidth = 10;
  const paddleHeight = 80;
  const topPaddleWidth = 140;  
  const topPaddleHeight = 12;

  const ballRadius = 8;
  const playerSpeed = 6;
  const maxScore = 3;
  const speedIncrement = 1.05;

  let wPressed = false, sPressed = false;
  let upPressed = false, downPressed = false;
  let tPressed = false, yPressed = false;

  let gameRunning = false;
  let gameOver = false;

  const player1 = { x: 10, y: canvasEl.height/2 - paddleHeight/2, score: 0, active: true };
  const player2 = { x: canvasEl.width - paddleWidth - 10, y: canvasEl.height/2 - paddleHeight/2, score: 0, active: true };
  const player3 = {
    x: canvasEl.width/2 - topPaddleWidth/2,
    y: 10,
    width: topPaddleWidth,
    height: topPaddleHeight,
    score: 0,
    active: true
  };

  const ball = {
    x: canvasEl.width/2,
    y: canvasEl.height/2,
    dx: 3.5 * (Math.random()>0.5?1:-1),
    dy: 3.5 * (Math.random()>0.5?1:-1)
  };

  const drawRect = (x:number,y:number,w:number,h:number,color:string)=>{
    ctx!.fillStyle = color;
    ctx!.fillRect(x,y,w,h);
  };

  const drawCircle = (x:number,y:number,r:number,color:string)=>{
    ctx!.fillStyle = color;
    ctx!.beginPath();
    ctx!.arc(x,y,r,0,Math.PI*2);
    ctx!.closePath();
    ctx!.fill();
  };

  const drawText = (text:string,x:number,y:number,color:string,size=20)=>{
    ctx!.fillStyle = color;
    ctx!.font = `${size}px monospace`;
    ctx!.fillText(text,x,y);
  };

  function movePlayers() {
    if (player1.active) {
      if (wPressed && player1.y > 0) player1.y -= playerSpeed;
      if (sPressed && player1.y + paddleHeight < canvasEl.height) player1.y += playerSpeed;
    }

    if (player2.active) {
      if (upPressed && player2.y > 0) player2.y -= playerSpeed;
      if (downPressed && player2.y + paddleHeight < canvasEl.height) player2.y += playerSpeed;
    }

    if (player3.active) {
      if (tPressed && player3.x > 0) player3.x -= playerSpeed;
      if (yPressed && player3.x + player3.width < canvasEl.width) player3.x += playerSpeed;
    }
  }

  function resetBall() {
    ball.x = canvasEl.width/2;
    ball.y = canvasEl.height/2;
    ball.dx = 3.5 * (Math.random()>0.5?1:-1);
    ball.dy = 3.5 * (Math.random()>0.5?1:-1);
  }

  function checkWinner() {
    const actives = [player1, player2, player3].filter(p => p.active);
    if (actives.length <= 1) {
      endGame("Winner! 🏆");
    }
  }

  function endGame(msg: string) {
    gameRunning = false;
    gameOver = true;
    drawText(msg, canvasEl.width/2 - 80, canvasEl.height/2, "yellow", 24);
    restartBtn!.classList.remove("hidden");
  }

  function update() {
    if (!gameRunning || gameOver) return;

    movePlayers();
    ball.x += ball.dx;
    ball.y += ball.dy;

    if (!player1.active && ball.x - ballRadius < 0) ball.dx = Math.abs(ball.dx);
    if (!player2.active && ball.x + ballRadius > canvasEl.width) ball.dx = -Math.abs(ball.dx);
    if (!player3.active && ball.y - ballRadius < 0) ball.dy = Math.abs(ball.dy);

    if (ball.y + ballRadius > canvasEl.height) ball.dy = -Math.abs(ball.dy);

    if (player1.active &&
        ball.x - ballRadius < player1.x + paddleWidth &&
        ball.y > player1.y &&
        ball.y < player1.y + paddleHeight) {
      ball.dx = Math.abs(ball.dx) * speedIncrement;
      ball.dy *= speedIncrement;
      ball.x = player1.x + paddleWidth + ballRadius;
    }

    if (player2.active &&
        ball.x + ballRadius > player2.x &&
        ball.y > player2.y &&
        ball.y < player2.y + paddleHeight) {
      ball.dx = -Math.abs(ball.dx) * speedIncrement;
      ball.dy *= speedIncrement;
      ball.x = player2.x - ballRadius;
    }

    if (player3.active &&
        ball.y - ballRadius < player3.y + player3.height &&
        ball.x > player3.x &&
        ball.x < player3.x + player3.width &&
        ball.dy < 0) {

      ball.dy = Math.abs(ball.dy) * speedIncrement;
      ball.dx *= speedIncrement;
      ball.y = player3.y + player3.height + ballRadius;
    }

    if (ball.x - ballRadius < 0 && player1.active) {
      player1.score++;
      if (player1.score >= maxScore) player1.active = false;
      resetBall(); checkWinner();
    }

    if (ball.x + ballRadius > canvasEl.width && player2.active) {
      player2.score++;
      if (player2.score >= maxScore) player2.active = false;
      resetBall(); checkWinner();
    }

    if (ball.y - ballRadius < 0 && player3.active) {
      player3.score++;
      if (player3.score >= maxScore) player3.active = false;
      resetBall(); checkWinner();
    }
  }

  function draw() {
    drawRect(0,0,canvasEl.width,canvasEl.height,"black");

    if (player1.active) drawRect(player1.x, player1.y, paddleWidth, paddleHeight, "white");
    if (player2.active) drawRect(player2.x, player2.y, paddleWidth, paddleHeight, "white");
    if (player3.active) drawRect(player3.x, player3.y, player3.width, player3.height, "white");

    drawCircle(ball.x, ball.y, ballRadius, "white");

    drawText(`${player1.score}`, 20, canvasEl.height - 20, "white");
    drawText(`${player2.score}`, canvasEl.width - 40, canvasEl.height - 20, "white");
    drawText(`${player3.score}`, canvasEl.width/2 - 10, 40, "white");
  }

  function gameLoop() {
    draw();
    update();
    if (gameRunning) requestAnimationFrame(gameLoop);
  }

  document.addEventListener("keydown", e=>{
    if(e.key.toLowerCase()==="w") wPressed=true;
    if(e.key.toLowerCase()==="s") sPressed=true;
    if(e.key==="ArrowUp") upPressed=true;
    if(e.key==="ArrowDown") downPressed=true;
    if(e.key.toLowerCase()==="t") tPressed=true;
    if(e.key.toLowerCase()==="y") yPressed=true;
  });

  document.addEventListener("keyup", e=>{
    if(e.key.toLowerCase()==="w") wPressed=false;
    if(e.key.toLowerCase()==="s") sPressed=false;
    if(e.key==="ArrowUp") upPressed=false;
    if(e.key==="ArrowDown") downPressed=false;
    if(e.key.toLowerCase()==="t") tPressed=false;
    if(e.key.toLowerCase()==="y") yPressed=false;
  });

  const restartBtn = document.getElementById("restartBtn")!;
  const goBackBtn = document.getElementById("goBackBtn")!;

  restartBtn.addEventListener("click", ()=>{
    player1.active = player2.active = player3.active = true;
    player1.score = player2.score = player3.score = 0;
    gameOver = false;
    gameRunning = true;
    restartBtn.classList.add("hidden");
    resetBall();
    gameLoop();
  });

  goBackBtn.addEventListener("click", ()=>{
    player1.active = player2.active = player3.active = true;
    player1.score = player2.score = player3.score = 0;
    gameRunning = false;
    restartBtn.classList.add("hidden");
    navigate("/game");
  });

  gameRunning = true;
  gameLoop();
}
