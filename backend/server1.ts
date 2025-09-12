// backend/server.ts
import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';

const fastify = Fastify();
fastify.register(fastifyWebsocket);

let gameState = {
  ball: { x: 300, y: 200, dx: 2, dy: 2 },
  player1: { x: 20, y: 150, dy: 0 }, // Added dy for movement
  player2: { x: 560, y: 150, dy: 0 }, // Added dy for movement
};

fastify.get('/state', async () => {
  return gameState;
});

fastify.register(async (fastify) => {
  fastify.get('/ws', { websocket: true }, (connection) => {
    connection.socket.on('message', (message: string) => {
      const data = JSON.parse(message.toString());
      if (data.type === 'update') {
        // Update player movement based on client input
        if (typeof data.player1DY === 'number') gameState.player1.dy = data.player1DY;
        if (typeof data.player2DY === 'number') gameState.player2.dy = data.player2DY;
      }
    });

	const ballSize = 10;
	let speedMultiplier = 1;

	setInterval(() => {
		speedMultiplier += 0.05;
	  }, 1000);
	
    const interval = setInterval(() => {
      // Update ball position
      gameState.ball.x += gameState.ball.dx * speedMultiplier;
      gameState.ball.y += gameState.ball.dy * speedMultiplier;

      // Update player positions
      gameState.player1.y += gameState.player1.dy;
      gameState.player2.y += gameState.player2.dy;

      // Prevent paddles from moving out of bounds
      if (gameState.player1.y < 0) gameState.player1.y = 0;
      if (gameState.player1.y > 300) gameState.player1.y = 300; // 400 - paddle height (100)
      if (gameState.player2.y < 0) gameState.player2.y = 0;
      if (gameState.player2.y > 300) gameState.player2.y = 300;

      // Collision detection with walls
      if (gameState.ball.y <= 0 || gameState.ball.y >= 400) {
        gameState.ball.dy *= -1;
      }

      // Collision detection with paddles
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

      // Reset ball if it goes out of bounds
      if (gameState.ball.x < 0 || gameState.ball.x > 600) {
        gameState.ball = { x: 300, y: 200, dx: 2, dy: 2 }; // Reset ball to center
      }

      // Send updated game state
      connection.socket.send(JSON.stringify(gameState));
    }, 16);

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