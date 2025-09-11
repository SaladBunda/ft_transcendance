// backend/server.ts
import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';

const fastify = Fastify();
fastify.register(fastifyWebsocket);

let gameState = {
  ball: { x: 300, y: 200, dx: 2, dy: 2 },
  player1: { x: 20, y: 150 },
  player2: { x: 560, y: 150 },
};

fastify.get('/state', async (request, reply) => {
  return gameState;
});

fastify.register(async (fastify) => {
  fastify.get('/ws', { websocket: true }, (connection) => {
    connection.socket.on('message', (message) => {
      const data = JSON.parse(message.toString());
      if (data.type === 'update') {
        gameState.player1.y = data.player1Y;
        gameState.player2.y = data.player2Y;
      }
    });

    const interval = setInterval(() => {
      // Update ball position
      gameState.ball.x += gameState.ball.dx;
      gameState.ball.y += gameState.ball.dy;

      // Collision detection
      if (gameState.ball.y <= 0 || gameState.ball.y >= 400) {
        gameState.ball.dy *= -1;
      }
      if (
        (gameState.ball.x <= gameState.player1.x + 10 &&
          gameState.ball.y >= gameState.player1.y &&
          gameState.ball.y <= gameState.player1.y + 100) ||
        (gameState.ball.x >= gameState.player2.x - 10 &&
          gameState.ball.y >= gameState.player2.y &&
          gameState.ball.y <= gameState.player2.y + 100)
      ) {
        gameState.ball.dx *= -1;
      }

      connection.socket.send(JSON.stringify(gameState));
    }, 16);

    connection.socket.on('close', () => {
      clearInterval(interval);
    });
  });
});

fastify.listen({ port: 3001 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});