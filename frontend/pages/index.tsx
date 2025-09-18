import React, { useEffect, useRef, useState } from "react";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [screen, setScreen] = useState<"start" | "waiting" | "game" | "end">("start");
  const [isConnected, setIsConnected] = useState(false);
  const [playerInfo, setPlayerInfo] = useState<any>(null);
  const [gameMode, setGameMode] = useState<"solo" | "matchmaking" | "ai">("matchmaking");
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard" | "impossible">("medium");

  // This old function has been replaced by connectWebSocketWithMode

  // Separate render function
  const renderGame = (state: any) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Center line
    ctx.strokeStyle = "gray";
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddles + ball
    ctx.fillStyle = "white";
    ctx.fillRect(state.player1.x, state.player1.y, 10, 100);
    ctx.fillRect(state.player2.x, state.player2.y, 10, 100);
    ctx.fillRect(state.ball.x, state.ball.y, 10, 10);

    // Player role indicators
    if (playerInfo?.role) {
      ctx.fillStyle = "yellow";
      ctx.font = "12px Arial";
      ctx.textAlign = "left";
      
      if (playerInfo.role === 'player1' || playerInfo.role === 'both') {
        ctx.fillText("YOU", 25, 25);
      }
      if (playerInfo.role === 'player2' || playerInfo.role === 'both') {
        ctx.textAlign = "right";
        ctx.fillText(playerInfo.role === 'both' ? "YOU" : "YOU", canvas.width - 25, 25);
      }
    }

    // Countdown
    if (state.countdown > 0) {
      ctx.fillStyle = "yellow";
      ctx.font = "30px Arial";
      ctx.textAlign = "center";
      ctx.fillText(state.countdown.toString(), canvas.width / 2, canvas.height / 2);
    }
  };

  // Handle restart
  const handleRestart = () => {
    console.log("Restarting game...");
    
    if (playerInfo?.gameType === 'solo') {
      // Solo mode: just reset the game
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "reset" }));
      }
      setGameState(null);
      setScreen("game");
    } else {
      // Multiplayer mode: leave game and return to start
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "reset" }));
      }
      // The server will send a 'gameLeft' message which will handle the screen change
    }
  };

  // Handle start game modes
  const handleStartSolo = () => {
    connectWebSocketWithMode('solo');
  };

  const handleStartMultiplayer = () => {
    connectWebSocketWithMode('matchmaking');
  };

  const handleStartAI = () => {
    connectWebSocketWithMode('ai', aiDifficulty);
  };

  // Connect with specific game mode
  const connectWebSocketWithMode = (gameMode: string, aiDifficultyParam?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    // Dynamic WebSocket URL with fallback
    let wsUrl = `ws://${window.location.hostname}:3001/ws`;
    
    // If accessing from host OS and VM IP is known, you can hardcode it
    // Replace 'YOUR_VM_IP' with your actual VM IP if needed
    // wsUrl = 'ws://10.0.2.15:3001/ws'; // Uncomment and set your VM IP
    
    console.log(`Connecting to WebSocket: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      // Send game mode selection
      const joinMessage: any = { type: "join", gameMode };
      if (gameMode === 'ai' && aiDifficultyParam) {
        joinMessage.aiDifficulty = aiDifficultyParam;
      }
      ws.send(JSON.stringify(joinMessage));
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'waiting') {
        // Player is waiting for opponent
        setScreen("waiting");
        setPlayerInfo(message);
      } else if (message.type === 'gameJoined') {
        // Game started
        setScreen("game");
        setPlayerInfo(message);
        setGameState(message.gameState);
      } else if (message.type === 'gameLeft') {
        // Player left the game, return to start screen
        setScreen("start");
        setPlayerInfo(null);
        setGameState(null);
      } else if (message.type === 'playerLeft') {
        // Opponent left, show message and return to start
        alert(message.message);
        setScreen("start");
        setPlayerInfo(null);
        setGameState(null);
      } else {
        // Regular game state update
        const state = message;
        setGameState(state);

        // Render the game
        renderGame(state);

        // Check for winner and switch to end screen
        if (state.winner && screen !== "end") {
          setScreen("end");
        }
      }
    };
  };

  // This effect has been replaced by connectWebSocketWithMode

  // Set up keyboard controls
  useEffect(() => {
    if (screen !== "game") return;
    
    console.log("Setting up controls for player:", playerInfo?.role);

    const keysPressed = new Set<string>();
    
    const sendUpdate = () => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      
      let player1DY = 0;
      let player2DY = 0;
      
      // Calculate movement - both control schemes work for any player
      let myMovement = 0;
      if (keysPressed.has("w") || keysPressed.has("W") || keysPressed.has("ArrowUp")) {
        myMovement -= 5;
      }
      if (keysPressed.has("s") || keysPressed.has("S") || keysPressed.has("ArrowDown")) {
        myMovement += 5;
      }
      
      // Send movement based on player role
      if (playerInfo?.role === 'player1') {
        player1DY = myMovement; // Player 1 can use either WASD or Arrows
      } else if (playerInfo?.role === 'player2') {
        player2DY = myMovement; // Player 2 can use either WASD or Arrows
      } else if (playerInfo?.role === 'both') {
        // Coop mode: Local multiplayer with specific key assignments
        if (keysPressed.has("w") || keysPressed.has("W")) player1DY -= 5; // Left paddle: WASD
        if (keysPressed.has("s") || keysPressed.has("S")) player1DY += 5;
        if (keysPressed.has("ArrowUp")) player2DY -= 5; // Right paddle: Arrows
        if (keysPressed.has("ArrowDown")) player2DY += 5;
      }
      
      // Debug all player movements
      if ((player1DY !== 0 || player2DY !== 0)) {
        console.log(`🎮 Frontend sending: role=${playerInfo?.role}, p1DY=${player1DY}, p2DY=${player2DY}, keys=[${Array.from(keysPressed)}]`);
      }
      
      wsRef.current.send(JSON.stringify({ type: "update", player1DY, player2DY }));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      keysPressed.add(e.key);
      sendUpdate();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      keysPressed.delete(e.key);
      sendUpdate();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [screen, playerInfo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div style={{ 
      textAlign: "center", 
      height: "100vh", 
      background: "black", 
      color: "white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      {screen === "start" && (
        <div>
          <h1>Pong Game</h1>
          
          {/* Game Mode Selection */}
          <div style={{ marginBottom: "20px" }}>
            <h3>Select Game Mode:</h3>
            <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => setGameMode("matchmaking")}
                  style={{
                    padding: "10px 15px",
                    fontSize: "14px",
                    backgroundColor: gameMode === "matchmaking" ? "#28a745" : "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    display: "block",
                    marginBottom: "5px"
                  }}
                >
                  🎮 Find Opponent
                </button>
                <small style={{ color: "#ccc", fontSize: "12px" }}>
                  Play online vs another player<br/>
                  (W/S or ↑/↓ keys work)
                </small>
              </div>
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => setGameMode("ai")}
                  style={{
                    padding: "10px 15px",
                    fontSize: "14px",
                    backgroundColor: gameMode === "ai" ? "#28a745" : "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    display: "block",
                    marginBottom: "5px"
                  }}
                >
                  🤖 vs AI
                </button>
                <small style={{ color: "#ccc", fontSize: "12px" }}>
                  Play against computer<br/>
                  (Choose difficulty below)
                </small>
              </div>
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => setGameMode("solo")}
                  style={{
                    padding: "10px 15px",
                    fontSize: "14px",
                    backgroundColor: gameMode === "solo" ? "#28a745" : "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    display: "block",
                    marginBottom: "5px"
                  }}
                >
                  👥 Coop Mode
                </button>
                <small style={{ color: "#ccc", fontSize: "12px" }}>
                  Local 2-player game<br/>
                  (W/S vs ↑/↓ keys)
                </small>
              </div>
            </div>
          </div>

          {/* AI Difficulty Selection */}
          {gameMode === "ai" && (
            <div style={{ marginBottom: "20px" }}>
              <h4>AI Difficulty:</h4>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                {["easy", "medium", "hard", "impossible"].map((difficulty) => (
                  <button
                    key={difficulty}
                    onClick={() => setAiDifficulty(difficulty)}
                    style={{
                      padding: "8px 12px",
                      fontSize: "12px",
                      backgroundColor: aiDifficulty === difficulty ? "#007bff" : "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                      textTransform: "capitalize"
                    }}
                  >
                    {difficulty === "impossible" ? "🔥 Impossible" : 
                     difficulty === "hard" ? "💪 Hard" :
                     difficulty === "medium" ? "⚖️ Medium" : "😊 Easy"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button 
            onClick={() => {
              if (gameMode === "matchmaking") handleStartMultiplayer();
              else if (gameMode === "ai") handleStartAI();
              else handleStartSolo();
            }}
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            {gameMode === "matchmaking" ? "🎮 Find Opponent" : 
             gameMode === "ai" ? `🤖 Fight ${aiDifficulty.toUpperCase()} AI` : 
             "👥 Start Coop"}
          </button>
        </div>
      )}

      {screen === "waiting" && (
        <div>
          <h2>🔍 Looking for opponent...</h2>
          <div style={{ 
            marginBottom: "20px",
            padding: "20px",
            border: "2px dashed #ffc107",
            borderRadius: "10px"
          }}>
            <p>Waiting for another player to join...</p>
            <div style={{ 
              width: "50px", 
              height: "50px", 
              border: "3px solid #ffc107", 
              borderTop: "3px solid transparent", 
              borderRadius: "50%", 
              animation: "spin 1s linear infinite",
              margin: "10px auto"
            }}></div>
          </div>
          <button
            onClick={() => setScreen("start")}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {screen === "game" && (
        <div>
          <div style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
              <span>Player 1: {gameState?.player1?.score || 0}</span>
              <span style={{ 
                padding: "2px 8px", 
                backgroundColor: playerInfo?.gameType === 'solo' ? "#ffc107" : "#17a2b8",
                borderRadius: "12px", 
                fontSize: "12px" 
              }}>
                {playerInfo?.gameType === 'solo' ? "Practice Mode" : `Multiplayer - You are ${playerInfo?.role}`}
              </span>
              <span>Player 2: {gameState?.player2?.score || 0}</span>
            </div>
            
            <p>Connection: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}</p>
            
            <p style={{ fontSize: "12px" }}>
              {playerInfo?.role === 'player1' && "Your paddle (Left): W/S or ↑/↓"}
              {playerInfo?.role === 'player2' && "Your paddle (Right): W/S or ↑/↓"}
              {playerInfo?.role === 'both' && "Left paddle: W/S | Right paddle: ↑/↓"}
            </p>
          </div>
          <canvas 
            ref={canvasRef} 
            width={600} 
            height={400} 
            style={{ border: "2px solid white" }} 
          />
        </div>
      )}

      {screen === "end" && (
        <div>
          <h1>{gameState?.winner} Wins!</h1>
          <p>Final Score: {gameState?.player1?.score || 0} - {gameState?.player2?.score || 0}</p>
          <button
            onClick={handleRestart}
            style={{
              padding: "10px 20px",
              fontSize: "18px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginRight: "10px"
            }}
          >
            Play Again
          </button>
          <button
            onClick={() => {
              setScreen("start");
              setPlayerInfo(null);
              setGameState(null);
              if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
              }
            }}
            style={{
              padding: "10px 20px",
              fontSize: "18px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Main Menu
          </button>
        </div>
      )}
    </div>
  );
}