import React, { useEffect, useRef, useState } from "react";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [screen, setScreen] = useState<"start" | "game" | "end">("start");
  const [isConnected, setIsConnected] = useState(false);

  // Function to establish WebSocket connection
  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    const ws = new WebSocket("ws://localhost:3001/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onmessage = (event) => {
      const state = JSON.parse(event.data);
      setGameState(state);

      // Render the game
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

      // Countdown
      if (state.countdown > 0) {
        ctx.fillStyle = "yellow";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillText(state.countdown.toString(), canvas.width / 2, canvas.height / 2);
      }

      // Check for winner and switch to end screen
      if (state.winner && screen !== "end") {
        setScreen("end");
      }
    };
  };

  // Handle restart
  const handleRestart = () => {
    console.log("Restarting game...");
    
    // Send reset message if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "reset" }));
    }
    
    // Reset local state
    setGameState(null);
    setScreen("game");
  };

  // Handle start game
  const handleStartGame = () => {
    setScreen("game");
  };

  // Set up WebSocket connection when screen changes to game
  useEffect(() => {
    if (screen === "game") {
      connectWebSocket();
    }
  }, [screen]);

  // Set up keyboard controls
  useEffect(() => {
    if (screen !== "game") return;

    const keysPressed = new Set<string>();
    
    const sendUpdate = () => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      
      let player1DY = 0;
      let player2DY = 0;
      
      if (keysPressed.has("ArrowUp")) player2DY -= 5;
      if (keysPressed.has("ArrowDown")) player2DY += 5;
      if (keysPressed.has("w") || keysPressed.has("W")) player1DY -= 5;
      if (keysPressed.has("s") || keysPressed.has("S")) player1DY += 5;
      
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
  }, [screen]);

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
          <button 
            onClick={handleStartGame}
            style={{
              padding: "10px 20px",
              fontSize: "18px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Start Game
          </button>
        </div>
      )}

      {screen === "game" && (
        <div>
          <div style={{ marginBottom: "10px" }}>
            <p>Player 1: {gameState?.player1?.score || 0} - Player 2: {gameState?.player2?.score || 0}</p>
            <p>Connection: {isConnected ? "Connected" : "Disconnected"}</p>
            <p style={{ fontSize: "12px" }}>Controls: Player 1 (W/S), Player 2 (Arrow Keys)</p>
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
            onClick={() => setScreen("start")}
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