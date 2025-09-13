// // const Fastify = require("fastify");
// // const fastifyWebsocket = require("@fastify/websocket");

// // const fastify = Fastify();
// // fastify.register(fastifyWebsocket);

// // // Canvas constants
// // const CANVAS_WIDTH = 600;
// // const CANVAS_HEIGHT = 400;
// // const PADDLE_WIDTH = 10;
// // const PADDLE_HEIGHT = 100;
// // const BALL_SIZE = 10;

// // // Game state
// // let gameState = {
// //   ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: 0, dy: 0 },
// //   player1: { x: 20, y: 150, dy: 0, score: 0 },
// //   player2: { x: 570, y: 150, dy: 0, score: 0 },
// //   winner: null,
// //   countdown: 0,
// // };

// // // Ball speeds
// // let baseSpeed = 1;
// // let movementSpeed = 2;
// // let lastSpeedIncrease = Date.now();

// // // Reset ball for a new round
// // function resetBall(loser = null) {
// //   const startY = Math.random() < 0.5 ? CANVAS_HEIGHT / 4 : (3 * CANVAS_HEIGHT) / 4;

// //   let dx = loser === "player1" ? -baseSpeed : baseSpeed;
// //   if (!loser) dx = Math.random() < 0.5 ? -baseSpeed : baseSpeed;
// //   let dy = Math.random() < 0.5 ? -baseSpeed : baseSpeed;

// //   gameState.ball = { x: CANVAS_WIDTH / 2, y: startY, dx: 0, dy: 0 };
// //   gameState.countdown = 3;

// //   // Reset paddles
// //   gameState.player1.y = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
// //   gameState.player2.y = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;

// //   const countdownInterval = setInterval(() => {
// //     gameState.countdown -= 1;
// //     if (gameState.countdown <= 0) {
// //       clearInterval(countdownInterval);
// //       gameState.ball.dx = dx;
// //       gameState.ball.dy = dy;
// //       baseSpeed += 0.2;
// //       movementSpeed = 2;
// //       lastSpeedIncrease = Date.now();
// //     }
// //   }, 1000);
// // }

// // // Reset entire game
// // function resetGame() {
// //   gameState = {
// //     ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: 0, dy: 0 },
// //     player1: { x: 20, y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2, dy: 0, score: 0 },
// //     player2: { x: 570, y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2, dy: 0, score: 0 },
// //     winner: null,
// //     countdown: 0,
// //   };
// //   baseSpeed = 1;
// //   movementSpeed = 2;
// //   lastSpeedIncrease = Date.now();
// //   resetBall();
// // }

// // // Initial ball
// // resetBall();

// // // WebSocket endpoint
// // fastify.register(async (fastify) => {
// //   fastify.get("/ws", { websocket: true }, (connection) => {
// //     connection.socket.on("message", (message) => {
// //       const data = JSON.parse(message.toString());
// //       if (data.type === "update") {
// //         if (typeof data.player1DY === "number") gameState.player1.dy = data.player1DY;
// //         if (typeof data.player2DY === "number") gameState.player2.dy = data.player2DY;
// //       }
// //       if (data.type === "reset") {
// //         resetGame();
// //       }
// //     });

// //     const interval = setInterval(() => {
// //       if (gameState.countdown > 0 || gameState.winner) {
// //         connection.socket.send(JSON.stringify(gameState));
// //         return;
// //       }

// //       // Increase movement speed gradually
// //       if (Date.now() - lastSpeedIncrease >= 1000) {
// //         movementSpeed += 0.05;
// //         lastSpeedIncrease = Date.now();
// //       }

// //       // Ball movement
// //       gameState.ball.x += Math.sign(gameState.ball.dx) * (movementSpeed + baseSpeed);
// //       gameState.ball.y += Math.sign(gameState.ball.dy) * (movementSpeed + baseSpeed);

// //       // Paddle movement
// //       gameState.player1.y += gameState.player1.dy;
// //       gameState.player2.y += gameState.player2.dy;

// //       // Clamp paddles
// //       gameState.player1.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, gameState.player1.y));
// //       gameState.player2.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, gameState.player2.y));

// //       // Ball collisions
// //       if (gameState.ball.y <= 0 || gameState.ball.y + BALL_SIZE >= CANVAS_HEIGHT) {
// //         gameState.ball.dy *= -1;
// //       }

// //       if (
// //         gameState.ball.x <= gameState.player1.x + PADDLE_WIDTH &&
// //         gameState.ball.x + BALL_SIZE >= gameState.player1.x &&
// //         gameState.ball.y + BALL_SIZE >= gameState.player1.y &&
// //         gameState.ball.y <= gameState.player1.y + PADDLE_HEIGHT
// //       ) {
// //         gameState.ball.x = gameState.player1.x + PADDLE_WIDTH;
// //         gameState.ball.dx *= -1;
// //       }

// //       if (
// //         gameState.ball.x + BALL_SIZE >= gameState.player2.x &&
// //         gameState.ball.x <= gameState.player2.x + PADDLE_WIDTH &&
// //         gameState.ball.y + BALL_SIZE >= gameState.player2.y &&
// //         gameState.ball.y <= gameState.player2.y + PADDLE_HEIGHT
// //       ) {
// //         gameState.ball.x = gameState.player2.x - BALL_SIZE;
// //         gameState.ball.dx *= -1;
// //       }

// //       // Scoring
// //       if (gameState.ball.x < 0) {
// //         gameState.player2.score++;
// //         if (gameState.player2.score >= 5) gameState.winner = "Player 2";
// //         else resetBall("player1");
// //       }
// //       if (gameState.ball.x > CANVAS_WIDTH) {
// //         gameState.player1.score++;
// //         if (gameState.player1.score >= 5) gameState.winner = "Player 1";
// //         else resetBall("player2");
// //       }

// //       connection.socket.send(JSON.stringify(gameState));
// //     }, 16);

// //     connection.socket.on("close", () => clearInterval(interval));
// //   });
// // });

// // fastify.listen({ port: 3001, host: "0.0.0.0" }, (err, address) => {
// //   if (err) {
// //     console.error(err);
// //     process.exit(1);
// //   }
// //   console.log(`Server running at ${address}`);
// // });


// const Fastify = require("fastify");
// const fastifyWebsocket = require("@fastify/websocket");

// const fastify = Fastify();
// fastify.register(fastifyWebsocket);

// // Canvas constants
// const CANVAS_WIDTH = 600;
// const CANVAS_HEIGHT = 400;
// const PADDLE_WIDTH = 10;
// const PADDLE_HEIGHT = 100;
// const BALL_SIZE = 10;

// // Game state
// let gameState = {
//   ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: 0, dy: 0 },
//   player1: { x: 20, y: 150, dy: 0, score: 0 },
//   player2: { x: 570, y: 150, dy: 0, score: 0 },
//   winner: null,
//   countdown: 0,
// };

// // Ball speeds
// let baseSpeed = 1;
// let movementSpeed = 2;
// let lastSpeedIncrease = Date.now();
// let countdownInterval = null;
// let clients = new Set(); // Track connected clients

// // Reset ball for a new round
// function resetBall(loser = null) {
//   // Clear any existing countdown
//   if (countdownInterval) {
//     clearInterval(countdownInterval);
//     countdownInterval = null;
//   }

//   const startY = Math.random() < 0.5 ? CANVAS_HEIGHT / 4 : (3 * CANVAS_HEIGHT) / 4;

//   let dx = loser === "player1" ? -baseSpeed : baseSpeed;
//   if (!loser) dx = Math.random() < 0.5 ? -baseSpeed : baseSpeed;
//   let dy = Math.random() < 0.5 ? -baseSpeed : baseSpeed;

//   gameState.ball = { x: CANVAS_WIDTH / 2, y: startY, dx: 0, dy: 0 };
//   gameState.countdown = 3;

//   // Reset paddles
//   gameState.player1.y = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
//   gameState.player2.y = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;

//   console.log(`Resetting ball, countdown starting. Loser: ${loser || 'none'}`);

//   countdownInterval = setInterval(() => {
//     gameState.countdown -= 1;
//     console.log(`Countdown: ${gameState.countdown}`);
    
//     if (gameState.countdown <= 0) {
//       clearInterval(countdownInterval);
//       countdownInterval = null;
      
//       gameState.ball.dx = dx;
//       gameState.ball.dy = dy;
      
//       // Only increase speed on actual rounds, not on full reset
//       if (loser) {
//         baseSpeed += 0.2;
//       }
//       movementSpeed = 2;
//       lastSpeedIncrease = Date.now();
      
//       console.log(`Game started! Ball speed: dx=${dx}, dy=${dy}`);
//     }
//   }, 1000);
// }

// // Reset entire game
// function resetGame() {
//   console.log("FULL GAME RESET CALLED");
  
//   // Clear any existing countdown
//   if (countdownInterval) {
//     clearInterval(countdownInterval);
//     countdownInterval = null;
//   }

//   // Reset ALL game state
//   gameState = {
//     ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: 0, dy: 0 },
//     player1: { x: 20, y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2, dy: 0, score: 0 },
//     player2: { x: 570, y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2, dy: 0, score: 0 },
//     winner: null,
//     countdown: 0,
//   };
  
//   // Reset speeds completely
//   baseSpeed = 1;
//   movementSpeed = 2;
//   lastSpeedIncrease = Date.now();
  
//   console.log("Game state after reset:", JSON.stringify(gameState, null, 2));
  
//   // Start fresh
//   resetBall();
// }

// // Broadcast game state to all clients
// function broadcastGameState() {
//   const message = JSON.stringify(gameState);
//   clients.forEach(client => {
//     if (client.readyState === 1) { // WebSocket.OPEN
//       client.send(message);
//     }
//   });
// }

// // Initial setup
// resetBall();

// // Game loop (separate from WebSocket connections)
// const gameInterval = setInterval(() => {
//   // Don't update game during countdown or when winner exists
//   if (gameState.countdown > 0 || gameState.winner) {
//     broadcastGameState();
//     return;
//   }

//   // Increase movement speed gradually
//   if (Date.now() - lastSpeedIncrease >= 1000) {
//     movementSpeed += 0.05;
//     lastSpeedIncrease = Date.now();
//   }

//   // Ball movement
//   gameState.ball.x += Math.sign(gameState.ball.dx) * (movementSpeed + baseSpeed);
//   gameState.ball.y += Math.sign(gameState.ball.dy) * (movementSpeed + baseSpeed);

//   // Paddle movement
//   gameState.player1.y += gameState.player1.dy;
//   gameState.player2.y += gameState.player2.dy;

//   // Clamp paddles
//   gameState.player1.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, gameState.player1.y));
//   gameState.player2.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, gameState.player2.y));

//   // Ball collisions with walls
//   if (gameState.ball.y <= 0 || gameState.ball.y + BALL_SIZE >= CANVAS_HEIGHT) {
//     gameState.ball.dy *= -1;
//   }

//   // Paddle collisions
//   if (
//     gameState.ball.x <= gameState.player1.x + PADDLE_WIDTH &&
//     gameState.ball.x + BALL_SIZE >= gameState.player1.x &&
//     gameState.ball.y + BALL_SIZE >= gameState.player1.y &&
//     gameState.ball.y <= gameState.player1.y + PADDLE_HEIGHT
//   ) {
//     gameState.ball.x = gameState.player1.x + PADDLE_WIDTH;
//     gameState.ball.dx *= -1;
//   }

//   if (
//     gameState.ball.x + BALL_SIZE >= gameState.player2.x &&
//     gameState.ball.x <= gameState.player2.x + PADDLE_WIDTH &&
//     gameState.ball.y + BALL_SIZE >= gameState.player2.y &&
//     gameState.ball.y <= gameState.player2.y + PADDLE_HEIGHT
//   ) {
//     gameState.ball.x = gameState.player2.x - BALL_SIZE;
//     gameState.ball.dx *= -1;
//   }

//   // Scoring
//   if (gameState.ball.x < 0) {
//     gameState.player2.score++;
//     console.log(`Player 2 scored! Score: ${gameState.player1.score} - ${gameState.player2.score}`);
    
//     if (gameState.player2.score >= 5) {
//       gameState.winner = "Player 2";
//       console.log("Player 2 wins!");
//     } else {
//       resetBall("player1");
//     }
//   }
  
//   if (gameState.ball.x > CANVAS_WIDTH) {
//     gameState.player1.score++;
//     console.log(`Player 1 scored! Score: ${gameState.player1.score} - ${gameState.player2.score}`);
    
//     if (gameState.player1.score >= 5) {
//       gameState.winner = "Player 1";
//       console.log("Player 1 wins!");
//     } else {
//       resetBall("player2");
//     }
//   }

//   broadcastGameState();
// }, 16);

// // WebSocket endpoint
// fastify.register(async (fastify) => {
//   fastify.get("/ws", { websocket: true }, (connection) => {
//     console.log("Client connected");
    
//     // Add client to set
//     clients.add(connection.socket);
    
//     // Send current game state immediately
//     connection.socket.send(JSON.stringify(gameState));

//     connection.socket.on("message", (message) => {
//       const data = JSON.parse(message.toString());
      
//       if (data.type === "update" && !gameState.winner) {
//         // Only process input during active gameplay
//         if (typeof data.player1DY === "number") gameState.player1.dy = data.player1DY;
//         if (typeof data.player2DY === "number") gameState.player2.dy = data.player2DY;
//       }
      
//       if (data.type === "reset") {
//         console.log("Restart requested by client");
//         resetGame();
//       }
//     });

//     connection.socket.on("close", () => {
//       console.log("Client disconnected");
//       clients.delete(connection.socket);
//     });

//     connection.socket.on("error", (error) => {
//       console.log("WebSocket error:", error);
//       clients.delete(connection.socket);
//     });
//   });
// });

// fastify.listen({ port: 3001, host: "0.0.0.0" }, (err, address) => {
//   if (err) {
//     console.error(err);
//     process.exit(1);
//   }
//   console.log(`Server running at ${address}`);
// });


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
  player1: { x: 20, y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2, dy: 0, score: 0 },
  player2: { x: CANVAS_WIDTH - 20 - PADDLE_WIDTH, y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2, dy: 0, score: 0 },
  winner: null,
  countdown: 0,
  gameActive: false,
};

// Ball speeds
let baseSpeed = 1;
let movementSpeed = 2;
let lastSpeedIncrease = Date.now();
let countdownInterval = null;

// Reset ball for a new round
function resetBall(loser = null) {
  console.log(`Resetting ball, loser: ${loser}`);
  
  // Clear any existing countdown
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  const startY = Math.random() < 0.5 ? CANVAS_HEIGHT / 4 : (3 * CANVAS_HEIGHT) / 4;
  let dx = loser === "player1" ? -baseSpeed : baseSpeed;
  if (!loser) dx = Math.random() < 0.5 ? -baseSpeed : baseSpeed;
  let dy = Math.random() < 0.5 ? -baseSpeed : baseSpeed;

  gameState.ball = { x: CANVAS_WIDTH / 2, y: startY, dx: 0, dy: 0 };
  gameState.countdown = 3;
  gameState.gameActive = false;

  // Reset paddles to center
  gameState.player1.y = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
  gameState.player2.y = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
  gameState.player1.dy = 0;
  gameState.player2.dy = 0;

  countdownInterval = setInterval(() => {
    gameState.countdown -= 1;
    console.log(`Countdown: ${gameState.countdown}`);
    
    if (gameState.countdown <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      
      gameState.ball.dx = dx;
      gameState.ball.dy = dy;
      gameState.gameActive = true;
      
      if (loser) baseSpeed += 0.2; // Only increase speed on actual scoring, not restart
      movementSpeed = 2;
      lastSpeedIncrease = Date.now();
      
      console.log(`Game started! Ball speed: dx=${dx}, dy=${dy}, baseSpeed=${baseSpeed}`);
    }
  }, 1000);
}

// Reset entire game
function resetGame() {
  console.log("FULL GAME RESET");
  
  // Clear any existing countdown
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  // Reset ALL game state
  gameState = {
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: 0, dy: 0 },
    player1: { x: 20, y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2, dy: 0, score: 0 },
    player2: { x: CANVAS_WIDTH - 20 - PADDLE_WIDTH, y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2, dy: 0, score: 0 },
    winner: null,
    countdown: 0,
    gameActive: false,
  };
  
  // Reset speeds
  baseSpeed = 1;
  movementSpeed = 2;
  lastSpeedIncrease = Date.now();
  
  console.log("Starting new game...");
  resetBall();
}

// Initial setup
resetBall();

// WebSocket endpoint
fastify.register(async (fastify) => {
  fastify.get("/ws", { websocket: true }, (connection) => {
    console.log("Client connected");

    connection.socket.on("message", (message) => {
      const data = JSON.parse(message.toString());
      
      if (data.type === "update") {
        // Only process input during active gameplay
        if (gameState.gameActive && !gameState.winner) {
          if (typeof data.player1DY === "number") gameState.player1.dy = data.player1DY;
          if (typeof data.player2DY === "number") gameState.player2.dy = data.player2DY;
        }
      }
      
      if (data.type === "reset") {
        console.log("Reset requested by client");
        resetGame();
      }
    });

    const interval = setInterval(() => {
      // Always send current game state
      connection.socket.send(JSON.stringify(gameState));

      // Don't update physics during countdown or when game is over
      if (gameState.countdown > 0 || gameState.winner || !gameState.gameActive) {
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

      // Clamp paddles to screen
      gameState.player1.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, gameState.player1.y));
      gameState.player2.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, gameState.player2.y));

      // Ball collisions with top/bottom walls
      if (gameState.ball.y <= 0 || gameState.ball.y + BALL_SIZE >= CANVAS_HEIGHT) {
        gameState.ball.dy *= -1;
      }

      // Ball collision with player1 paddle (left)
      if (
        gameState.ball.x <= gameState.player1.x + PADDLE_WIDTH &&
        gameState.ball.x + BALL_SIZE >= gameState.player1.x &&
        gameState.ball.y + BALL_SIZE >= gameState.player1.y &&
        gameState.ball.y <= gameState.player1.y + PADDLE_HEIGHT
      ) {
        gameState.ball.x = gameState.player1.x + PADDLE_WIDTH;
        gameState.ball.dx *= -1;
      }

      // Ball collision with player2 paddle (right)
      if (
        gameState.ball.x + BALL_SIZE >= gameState.player2.x &&
        gameState.ball.x <= gameState.player2.x + PADDLE_WIDTH &&
        gameState.ball.y + BALL_SIZE >= gameState.player2.y &&
        gameState.ball.y <= gameState.player2.y + PADDLE_HEIGHT
      ) {
        gameState.ball.x = gameState.player2.x - BALL_SIZE;
        gameState.ball.dx *= -1;
      }

      // Scoring - Player 2 scores (ball goes off left side)
      if (gameState.ball.x < 0) {
        gameState.player2.score++;
        console.log(`Player 2 scored! Score: ${gameState.player1.score} - ${gameState.player2.score}`);
        
        if (gameState.player2.score >= 5) {
          gameState.winner = "Player 2";
          gameState.gameActive = false;
          console.log("Player 2 wins!");
        } else {
          resetBall("player1");
        }
      }
      
      // Scoring - Player 1 scores (ball goes off right side)
      if (gameState.ball.x > CANVAS_WIDTH) {
        gameState.player1.score++;
        console.log(`Player 1 scored! Score: ${gameState.player1.score} - ${gameState.player2.score}`);
        
        if (gameState.player1.score >= 5) {
          gameState.winner = "Player 1";
          gameState.gameActive = false;
          console.log("Player 1 wins!");
        } else {
          resetBall("player2");
        }
      }
    }, 16);

    connection.socket.on("close", () => {
      console.log("Client disconnected");
      clearInterval(interval);
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    });
  });
});

fastify.listen({ port: 3001, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});