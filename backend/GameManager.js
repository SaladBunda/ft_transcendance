const GameState = require('./GameState');
const GameLoop = require('./GameLoop');

class GameManager {
  constructor() {
    // Store all game rooms
    this.games = new Map(); // roomId -> { gameState, gameLoop, players: Set(), spectators: Set() }
    this.players = new Map(); // connectionId -> { roomId, role, connection }
    this.waitingPlayers = []; // Players waiting to be matched
    this.nextGameId = 1;
  }

  // Generate unique connection ID
  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate unique room ID
  generateRoomId() {
    return `room_${this.nextGameId++}`;
  }

  // Add a new player connection
  addPlayer(connection, gameMode = 'matchmaking') {
    const connectionId = this.generateConnectionId();
    
    if (gameMode === 'solo') {
      // Create a solo game (AI or practice mode)
      return this.createSoloGame(connection, connectionId);
    } else {
      // Add to matchmaking queue
      return this.addToMatchmaking(connection, connectionId);
    }
  }

  // Create a solo game for practice
  createSoloGame(connection, connectionId) {
    const roomId = this.generateRoomId();
    const gameState = new GameState();
    const gameLoop = new GameLoop(gameState, true); // Pass true for solo mode
    
    const game = {
      mode: 'solo',
      players: new Set([connectionId]),
      spectators: new Set(),
      gameState,
      gameLoop,
      createdAt: Date.now()
    };

    this.games.set(roomId, game);
    
    // Register the player
    this.players.set(connectionId, {
      roomId,
      role: 'both',
      connection
    });

    // Initialize the game
    gameState.resetBall();

    console.log(`Created solo game ${roomId} for player ${connectionId}`);
    
    return {
      connectionId,
      roomId,
      role: 'both',
      gameType: 'solo',
      gameState: gameState.getState()
    };
  }

  // Add player to matchmaking queue
  addToMatchmaking(connection, connectionId) {
    // Check if there's a waiting player
    if (this.waitingPlayers.length > 0) {
      // Match with waiting player
      const waitingPlayer = this.waitingPlayers.shift();
      return this.createMultiplayerGame(waitingPlayer, { connection, connectionId });
    } else {
      // Add to waiting queue
      this.waitingPlayers.push({ connection, connectionId });
      
      this.players.set(connectionId, {
        roomId: null,
        role: 'waiting',
        connection
      });

      console.log(`Player ${connectionId} added to waiting queue`);
      
      return {
        connectionId,
        roomId: null,
        role: 'waiting',
        gameType: 'multiplayer',
        gameState: null
      };
    }
  }

  // Create a multiplayer game between two players
  createMultiplayerGame(player1Data, player2Data) {
    const roomId = this.generateRoomId();
    const gameState = new GameState();
    const gameLoop = new GameLoop(gameState);
    
    const gameRoom = {
      mode: 'multiplayer',
      gameState,
      gameLoop,
      players: new Set([player1Data.connectionId, player2Data.connectionId]),
      spectators: new Set()
    };

    this.games.set(roomId, gameRoom);
    
    // Assign roles
    this.players.set(player1Data.connectionId, {
      roomId,
      role: 'player1',
      connection: player1Data.connection
    });
    
    this.players.set(player2Data.connectionId, {
      roomId,
      role: 'player2',
      connection: player2Data.connection
    });

    // Initialize game
    gameState.resetBall();

    console.log(`Created multiplayer game ${roomId}: ${player1Data.connectionId} vs ${player2Data.connectionId}`);
    
    // Return info for both players
    return {
      player1: {
        connectionId: player1Data.connectionId,
        roomId,
        role: 'player1',
        gameType: 'multiplayer',
        gameState: gameState.getState()
      },
      player2: {
        connectionId: player2Data.connectionId,
        roomId,
        role: 'player2',
        gameType: 'multiplayer',
        gameState: gameState.getState()
      }
    };
  }

  // Handle player input
  handlePlayerInput(connectionId, inputData) {
    const player = this.players.get(connectionId);
    if (!player || !player.roomId) return;

    const gameRoom = this.games.get(player.roomId);
    if (!gameRoom) return;

    if (inputData.type === 'update') {
      // Handle movement based on player role and game mode
      const isSolo = gameRoom.mode === 'solo';
      
      // Debug Player 2 specifically
      if (player.role === 'player2' || (inputData.player2DY !== 0 && inputData.player2DY !== undefined)) {
        console.log(`🎮 Player ${connectionId} (${player.role}) input:`, inputData);
      }
      
      if (player.role === 'player1') {
        gameRoom.gameState.updatePlayerMovement(inputData.player1DY || 0, null, 'player1', false);
      } else if (player.role === 'player2') {
        gameRoom.gameState.updatePlayerMovement(null, inputData.player2DY || 0, 'player2', false);
      } else if (player.role === 'both') {
        // Solo mode - handle both players
        gameRoom.gameState.updatePlayerMovement(inputData.player1DY || 0, inputData.player2DY || 0, null, true);
      }
    } else if (inputData.type === 'reset') {
      console.log(`Reset requested by ${connectionId} in room ${player.roomId}`);
      
      if (gameRoom.mode === 'solo') {
        // In solo mode, just reset the game
        gameRoom.gameState.resetGame();
      } else {
        // In multiplayer mode, remove player from game and return to waiting
        this.removePlayerFromGame(connectionId);
        
        // Send player back to game selection
        player.connection.send(JSON.stringify({
          type: 'gameLeft',
          message: 'You left the game. Choose a new game mode.'
        }));
      }
    }
  }

  // Update all games
  updateAllGames() {
    for (const [roomId, gameRoom] of this.games) {
      // Update game physics
      gameRoom.gameLoop.updateGame();
      
      // Broadcast to all players in this room
      this.broadcastToRoom(roomId, gameRoom.gameState.getState());
    }
  }

  // Broadcast message to all players in a room
  broadcastToRoom(roomId, message) {
    const gameRoom = this.games.get(roomId);
    if (!gameRoom) return;

    const messageStr = JSON.stringify(message);
    
    // Send to all players
    for (const connectionId of gameRoom.players) {
      const player = this.players.get(connectionId);
      if (player && player.connection.readyState === 1) { // WebSocket.OPEN
        player.connection.send(messageStr);
      }
    }
    
    // Send to spectators
    for (const connectionId of gameRoom.spectators) {
      const spectator = this.players.get(connectionId);
      if (spectator && spectator.connection.readyState === 1) {
        spectator.connection.send(messageStr);
      }
    }
  }

  // Remove player from current game but keep connection alive
  removePlayerFromGame(connectionId) {
    const player = this.players.get(connectionId);
    if (!player || !player.roomId) return;

    const gameRoom = this.games.get(player.roomId);
    if (gameRoom) {
      // Remove from game room
      gameRoom.players.delete(connectionId);
      
      // Clean up game if no players left
      if (gameRoom.players.size === 0) {
        gameRoom.gameState.cleanup();
        this.games.delete(player.roomId);
        console.log(`Deleted empty game room ${player.roomId}`);
      } else {
        // Notify remaining players
        const remainingPlayers = Array.from(gameRoom.players);
        for (const playerId of remainingPlayers) {
          const otherPlayer = this.players.get(playerId);
          if (otherPlayer && otherPlayer.connection.readyState === 1) {
            otherPlayer.connection.send(JSON.stringify({
              type: 'playerLeft',
              message: 'Your opponent left the game.'
            }));
          }
        }
      }
    }

    // Update player info to remove room assignment
    this.players.set(connectionId, {
      ...player,
      roomId: null,
      role: 'waiting'
    });
  }

  // Remove player and clean up
  removePlayer(connectionId) {
    const player = this.players.get(connectionId);
    if (!player) return;

    // Remove from waiting queue if present
    this.waitingPlayers = this.waitingPlayers.filter(p => p.connectionId !== connectionId);

    if (player.roomId) {
      const gameRoom = this.games.get(player.roomId);
      if (gameRoom) {
        // Remove from game room
        gameRoom.players.delete(connectionId);
        gameRoom.spectators.delete(connectionId);
        
        // Clean up game state
        gameRoom.gameState.cleanup();
        
        // If no players left, remove the game
        if (gameRoom.players.size === 0) {
          console.log(`Removing empty game room ${player.roomId}`);
          this.games.delete(player.roomId);
        } else {
          console.log(`Player ${connectionId} left room ${player.roomId}, ${gameRoom.players.size} players remaining`);
        }
      }
    }

    this.players.delete(connectionId);
    console.log(`Player ${connectionId} removed from game manager`);
  }

  // Get player info
  getPlayerInfo(connectionId) {
    return this.players.get(connectionId);
  }

  // Get game room info
  getGameRoom(roomId) {
    return this.games.get(roomId);
  }

  // Get stats
  getStats() {
    return {
      totalGames: this.games.size,
      totalPlayers: this.players.size,
      waitingPlayers: this.waitingPlayers.length,
      games: Array.from(this.games.entries()).map(([roomId, room]) => ({
        roomId,
        playerCount: room.players.size,
        type: room.type
      }))
    };
  }
}

module.exports = GameManager;