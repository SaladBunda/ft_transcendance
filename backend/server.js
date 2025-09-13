const Fastify = require("fastify");
const fastifyWebsocket = require("@fastify/websocket");

const fastify = Fastify();
fastify.register(fastifyWebsocket);

// Canvas constants
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 10;

// Game state
let gameState = {
  ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: 0, dy: 0 },
  player1: { x: 20, y: 150, dy: 0, score: 0 },
  player2: { x: 570, y: 150, dy: 0, score: 0 },
  winner: null,
  countdown: 0,
};

// Ball speeds
let baseSpeed = 1;
let movementSpeed = 2;
let lastSpeedIncrease = Date.now();

// Reset ball for a new round
function resetBall(loser = null) {
  const startY = Math.random() < 0.5 ? CANVAS_HEIGHT / 4 : (3 * CANVAS_HEIGHT) / 4;

  let dx = loser === "player1" ? -baseSpeed : baseSpeed;
  if (!loser) dx = Math.random() < 0.5 ? -baseSpeed : baseSpeed;
  let dy = Math.random() < 0.5 ? -baseSpeed : baseSpeed;

  gameState.ball = { x: CANVAS_WIDTH / 2, y: startY, dx: 0, dy: 0 };
  gameState.countdown = 3;

  // Reset paddles
  gameState.player1.y = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
  gameState.player2.y = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;

  const countdownInterval = setInterval(() => {
    gameState.countdown -= 1;
    if (gameState.countdown <= 0) {
      clearInterval(countdownInterval);
      gameState.ball.dx = dx;
      gameState.ball.dy = dy;
      baseSpeed += 0.2;
      movementSpeed = 2;
      lastSpeedIncrease = Date.now();
    }
  }, 1000);
}

// Reset entire game
function resetGame() {
  gameState = {
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: 0, dy: 0 },
    player1: { x: 20, y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2, dy: 0, score: 0 },
    player2: { x: 570, y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2, dy: 0, score: 0 },
    winner: null,
    countdown: 0,
  };
  baseSpeed = 1;
  movementSpeed = 2;
  lastSpeedIncrease = Date.now();
  resetBall();
}

// Initial ball
resetBall();

// WebSocket endpoint
fastify.register(async (fastify) => {
  fastify.get("/ws", { websocket: true }, (connection) => {
    connection.socket.on("message", (message) => {
      const data = JSON.parse(message.toString());
      if (data.type === "update") {
        if (typeof data.player1DY === "number") gameState.player1.dy = data.player1DY;
        if (typeof data.player2DY === "number") gameState.player2.dy = data.player2DY;
      }
      if (data.type === "reset") {
        resetGame();
      }
    });

    const interval = setInterval(() => {
      if (gameState.countdown > 0 || gameState.winner) {
        connection.socket.send(JSON.stringify(gameState));
        return;
      }

      // Increase movement speed gradually
      if (Date.now() - lastSpeedIncrease >= 1000) {
        movementSpeed += 0.05;
        lastSpeedIncrease = Date.now();
      }

      // Ball movement
      gameState.ball.x += Math.sign(gameState.ball.dx) * (movementSpeed + baseSpeed);
      gameState.ball.y += Math.sign(gameState.ball.dy) * (movementSpeed + baseSpeed);

      // Paddle movement
      gameState.player1.y += gameState.player1.dy;
      gameState.player2.y += gameState.player2.dy;

      // Clamp paddles
      gameState.player1.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, gameState.player1.y));
      gameState.player2.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, gameState.player2.y));

      // Ball collisions
      if (gameState.ball.y <= 0 || gameState.ball.y + BALL_SIZE >= CANVAS_HEIGHT) {
        gameState.ball.dy *= -1;
      }

      if (
        gameState.ball.x <= gameState.player1.x + PADDLE_WIDTH &&
        gameState.ball.x + BALL_SIZE >= gameState.player1.x &&
        gameState.ball.y + BALL_SIZE >= gameState.player1.y &&
        gameState.ball.y <= gameState.player1.y + PADDLE_HEIGHT
      ) {
        gameState.ball.x = gameState.player1.x + PADDLE_WIDTH;
        gameState.ball.dx *= -1;
      }

      if (
        gameState.ball.x + BALL_SIZE >= gameState.player2.x &&
        gameState.ball.x <= gameState.player2.x + PADDLE_WIDTH &&
        gameState.ball.y + BALL_SIZE >= gameState.player2.y &&
        gameState.ball.y <= gameState.player2.y + PADDLE_HEIGHT
      ) {
        gameState.ball.x = gameState.player2.x - BALL_SIZE;
        gameState.ball.dx *= -1;
      }

      // Scoring
      if (gameState.ball.x < 0) {
        gameState.player2.score++;
        if (gameState.player2.score >= 5) gameState.winner = "Player 2";
        else resetBall("player1");
      }
      if (gameState.ball.x > CANVAS_WIDTH) {
        gameState.player1.score++;
        if (gameState.player1.score >= 5) gameState.winner = "Player 1";
        else resetBall("player2");
      }

      connection.socket.send(JSON.stringify(gameState));
    }, 16);

    connection.socket.on("close", () => clearInterval(interval));
  });
});

fastify.listen({ port: 3001, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});
