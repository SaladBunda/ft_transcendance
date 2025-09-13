const GameManager = require('./GameManager');

class WebSocketHandler {
  constructor(fastify) {
    this.fastify = fastify;
    this.gameManager = new GameManager();
    
    // Start global game update loop
    this.startGameUpdateLoop();
  }

  // Start the global game update loop for all games
  startGameUpdateLoop() {
    setInterval(() => {
      this.gameManager.updateAllGames();
    }, 16);
  }

  // Setup WebSocket route
  setupWebSocket() {
    this.fastify.register(async (fastify) => {
      fastify.get("/ws", { websocket: true }, (connection) => {
        console.log("New client connected");
        
        let connectionId = null;
        let playerInfo = null;

        // Handle incoming messages
        connection.socket.on("message", (message) => {
          const data = JSON.parse(message.toString());
          if (data.type !== 'update') { // Only log non-movement messages
            console.log(`Received message from ${connectionId}:`, data);
          } else if (data.player2DY !== 0 && data.player2DY !== undefined) {
            // Debug Player 2 movement messages
            console.log(`🎮 Received Player 2 movement from ${connectionId}: p2DY=${data.player2DY}`);
          }
          
          if (data.type === "join") {
            // Player wants to join a game
            const gameMode = data.gameMode || 'matchmaking'; // 'matchmaking' or 'solo'
            
            if (gameMode === 'matchmaking') {
              const result = this.gameManager.addPlayer(connection.socket, 'matchmaking');
              
              if (result.player1 && result.player2) {
                // Matched two players
                const player1 = result.player1;
                const player2 = result.player2;
                
                // Send game info to player 1
                const player1Connection = this.gameManager.getPlayerInfo(player1.connectionId).connection;
                player1Connection.send(JSON.stringify({
                  type: 'gameJoined',
                  ...player1,
                  opponent: player2.connectionId
                }));
                
                // Send game info to player 2
                const player2Connection = this.gameManager.getPlayerInfo(player2.connectionId).connection;
                player2Connection.send(JSON.stringify({
                  type: 'gameJoined',
                  ...player2,
                  opponent: player1.connectionId
                }));
                
                console.log(`Matched players: ${player1.connectionId} vs ${player2.connectionId}`);
              } else {
                // Added to waiting queue
                connectionId = result.connectionId;
                playerInfo = result;
                
                connection.socket.send(JSON.stringify({
                  type: 'waiting',
                  ...result,
                  message: 'Waiting for another player...'
                }));
              }
            } else if (gameMode === 'solo') {
              const result = this.gameManager.addPlayer(connection.socket, 'solo');
              connectionId = result.connectionId;
              playerInfo = result;
              
              connection.socket.send(JSON.stringify({
                type: 'gameJoined',
                ...result
              }));
            }
          } else if (data.type === "update" || data.type === "reset") {
            // Handle game input
            if (connectionId) {
              this.gameManager.handlePlayerInput(connectionId, data);
            }
          }
        });

        // Handle client disconnect
        connection.socket.on("close", () => {
          console.log("Client disconnected");
          if (connectionId) {
            this.gameManager.removePlayer(connectionId);
          }
        });

        // Handle errors
        connection.socket.on("error", (error) => {
          console.log("WebSocket error:", error);
          if (connectionId) {
            this.gameManager.removePlayer(connectionId);
          }
        });
      });
      
      // Optional: Add stats endpoint
      fastify.get("/stats", async (request, reply) => {
        return this.gameManager.getStats();
      });
    });
  }
}

module.exports = WebSocketHandler;