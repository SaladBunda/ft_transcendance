import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';

const fastify = Fastify();
fastify.register(fastifyWebsocket);

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 10;

// Game state
let gameState = {
  ball: { x: 300, y: 200, dx: 2, dy: 2 },
  player1: { x: 20, y: 150, dy: 0 },
  player2: { x: 570, y: 150, dy: 0 },
};

let speedMultiplier = 1;

// Increase ball speed every second
setInterval(() => {
  speedMultiplier += 0.05; // 5% speed increase per second
}, 1000);

// HTTP endpoint to check state
fastify.get('/state', async () => {
  return gameState;
});

// WebSocket for game
fastify.register(async (fastify) => {
  fastify.get('/ws', { websocket: true }, (connection) => {
    connection.socket.on('message', (message: string) => {
      const data = JSON.parse(message.toString());

      // Update paddle velocities based on client input
      if (data.type === 'update') {
        if (typeof data.player1DY === 'number') gameState.player1.dy = data.player1DY;
        if (typeof data.player2DY === 'number') gameState.player2.dy = data.player2DY;
      }
    });

    const interval = setInterval(() => {
      // Update ball position
      gameState.ball.x += gameState.ball.dx * speedMultiplier;
      gameState.ball.y += gameState.ball.dy * speedMultiplier;

      // Update paddles
      gameState.player1.y += gameState.player1.dy;
      gameState.player2.y += gameState.player2.dy;

      // Keep paddles inside canvas
      if (gameState.player1.y < 0) gameState.player1.y = 0;
      if (gameState.player1.y + PADDLE_HEIGHT > CANVAS_HEIGHT) gameState.player1.y = CANVAS_HEIGHT - PADDLE_HEIGHT;
      if (gameState.player2.y < 0) gameState.player2.y = 0;
      if (gameState.player2.y + PADDLE_HEIGHT > CANVAS_HEIGHT) gameState.player2.y = CANVAS_HEIGHT - PADDLE_HEIGHT;

      // Ball collision with top/bottom walls
      if (gameState.ball.y <= 0) {
        gameState.ball.y = 0;
        gameState.ball.dy *= -1;
      }
      if (gameState.ball.y + BALL_SIZE >= CANVAS_HEIGHT) {
        gameState.ball.y = CANVAS_HEIGHT - BALL_SIZE;
        gameState.ball.dy *= -1;
      }

      // Ball collision with paddles
      // Player 1
      if (
        gameState.ball.x <= gameState.player1.x + PADDLE_WIDTH &&
        gameState.ball.x + BALL_SIZE >= gameState.player1.x &&
        gameState.ball.y + BALL_SIZE >= gameState.player1.y &&
        gameState.ball.y <= gameState.player1.y + PADDLE_HEIGHT
      ) {
        gameState.ball.x = gameState.player1.x + PADDLE_WIDTH; // reposition outside
        gameState.ball.dx *= -1;
      }

      // Player 2
      if (
        gameState.ball.x + BALL_SIZE >= gameState.player2.x &&
        gameState.ball.x <= gameState.player2.x + PADDLE_WIDTH &&
        gameState.ball.y + BALL_SIZE >= gameState.player2.y &&
        gameState.ball.y <= gameState.player2.y + PADDLE_HEIGHT
      ) {
        gameState.ball.x = gameState.player2.x - BALL_SIZE; // reposition outside
        gameState.ball.dx *= -1;
      }

      // Reset ball if it goes out of left/right bounds
      if (gameState.ball.x < 0 || gameState.ball.x > CANVAS_WIDTH) {
        gameState.ball = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: 2, dy: 2 };
        speedMultiplier = 1; // reset speed
      }

      // Send updated state to frontend
      connection.socket.send(JSON.stringify(gameState));
    }, 16); // ~60 FPS

    connection.socket.on('close', () => {
      console.log('Frontend disconnected.');
      clearInterval(interval);
    });
  });
});

fastify.listen({ port: 3001, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
