// import React, { useEffect, useRef, useState } from "react";

// export default function Home() {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const wsRef = useRef<WebSocket | null>(null);
//   const [gameState, setGameState] = useState<any>(null);
//   const [screen, setScreen] = useState<"start" | "game" | "end">("start");

//   useEffect(() => {
//     if (screen !== "game") return;

//     const canvas = canvasRef.current;
//     const ctx = canvas?.getContext("2d");
//     const ws = new WebSocket("ws://localhost:3001/ws");
//     wsRef.current = ws;

//     ws.onmessage = (event) => {
//       const state = JSON.parse(event.data);
//       setGameState(state);

//       if (!ctx || !canvas) return;
//       ctx.clearRect(0, 0, canvas.width, canvas.height);

//       // Border
//       ctx.strokeStyle = "white";
//       ctx.lineWidth = 2;
//       ctx.strokeRect(0, 0, canvas.width, canvas.height);

//       // Center line
//       ctx.strokeStyle = "gray";
//       ctx.setLineDash([10, 10]);
//       ctx.beginPath();
//       ctx.moveTo(canvas.width / 2, 0);
//       ctx.lineTo(canvas.width / 2, canvas.height);
//       ctx.stroke();
//       ctx.setLineDash([]);

//       // Paddles + ball
//       ctx.fillStyle = "white";
//       ctx.fillRect(state.player1.x, state.player1.y, 10, 100);
//       ctx.fillRect(state.player2.x, state.player2.y, 10, 100);
//       ctx.fillRect(state.ball.x, state.ball.y, 10, 10);

//       // Countdown
//       if (state.countdown > 0) {
//         ctx.fillStyle = "yellow";
//         ctx.font = "30px Arial";
//         ctx.fillText(state.countdown.toString(), canvas.width / 2 - 10, canvas.height / 2);
//       }

//       if (state.winner) setScreen("end");
//     };

//     const keysPressed = new Set<string>();
//     const sendUpdate = () => {
//       if (ws.readyState !== WebSocket.OPEN) return;
//       let player1DY = 0;
//       let player2DY = 0;
//       if (keysPressed.has("ArrowUp")) player2DY -= 5;
//       if (keysPressed.has("ArrowDown")) player2DY += 5;
//       if (keysPressed.has("w") || keysPressed.has("W")) player1DY -= 5;
//       if (keysPressed.has("s") || keysPressed.has("S")) player1DY += 5;
//       ws.send(JSON.stringify({ type: "update", player1DY, player2DY }));
//     };

//     const handleKeyDown = (e: KeyboardEvent) => {
//       keysPressed.add(e.key);
//       sendUpdate();
//     };
//     const handleKeyUp = (e: KeyboardEvent) => {
//       keysPressed.delete(e.key);
//       sendUpdate();
//     };
//     window.addEventListener("keydown", handleKeyDown);
//     window.addEventListener("keyup", handleKeyUp);

//     return () => {
//       ws.close();
//       window.removeEventListener("keydown", handleKeyDown);
//       window.removeEventListener("keyup", handleKeyUp);
//     };
//   }, [screen]);

//   return (
//     <div style={{ textAlign: "center", height: "100vh", background: "black", color: "white" }}>
//       {screen === "start" && <button onClick={() => setScreen("game")}>Start Game</button>}
//       {screen === "game" && <canvas ref={canvasRef} width={600} height={400} style={{ border: "2px solid white" }} />}
//       {screen === "end" && (
//         <div>
//           <h1>{gameState?.winner} Wins!</h1>
//           <button
//             onClick={() => {
//               wsRef.current?.send(JSON.stringify({ type: "reset" }));
//               setGameState({ ...gameState, winner: null }); // clear winner locally
//               setScreen("game");
//             }}
//           >
//             Restart
//           </button>
//         </div>
//       )}
//       {screen === "game" && (
//         <div>
//           <p>
//             Player 1: {gameState?.player1.score} - Player 2: {gameState?.player2.score}
//           </p>
//         </div>
//       )}
//     </div>
//   );
// }



import React, { useEffect, useRef, useState } from "react";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [screen, setScreen] = useState<"start" | "game" | "end">("start");

  useEffect(() => {
    if (screen !== "game") return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const ws = new WebSocket("ws://localhost:3001/ws");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const state = JSON.parse(event.data);
      setGameState(state);

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

      // Winner text overlay
      if (state.winner) {
        ctx.fillStyle = "yellow";
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${state.winner} Wins!`, canvas.width / 2, canvas.height / 2 - 50);
        setScreen("end");
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    const keysPressed = new Set<string>();
    const sendUpdate = () => {
      if (ws.readyState !== WebSocket.OPEN) return;
      let player1DY = 0;
      let player2DY = 0;
      if (keysPressed.has("ArrowUp")) player2DY -= 5;
      if (keysPressed.has("ArrowDown")) player2DY += 5;
      if (keysPressed.has("w") || keysPressed.has("W")) player1DY -= 5;
      if (keysPressed.has("s") || keysPressed.has("S")) player1DY += 5;
      ws.send(JSON.stringify({ type: "update", player1DY, player2DY }));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.add(e.key);
      sendUpdate();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.delete(e.key);
      sendUpdate();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      ws.close();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [screen]);

  // Improved restart handler
  const handleRestart = () => {
    console.log("Restart button clicked");
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Send reset message to server
      wsRef.current.send(JSON.stringify({ type: "reset" }));
      console.log("Reset message sent to server");
    }
    
    // Reset local state
    setGameState(null);
    setScreen("game");
    
    // Small delay to ensure server processes reset
    setTimeout(() => {
      console.log("Local state reset complete");
    }, 100);
  };

  const handleStartGame = () => {
    console.log("Starting new game");
    setGameState(null);
    setScreen("game");
  };

  return (
    <div style={{ 
      textAlign: "center", 
      height: "100vh", 
      background: "black", 
      color: "white",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center"
    }}>
      {screen === "start" && (
        <div>
          <h1 style={{ fontSize: "3rem", marginBottom: "2rem" }}>Pong Game</h1>
          <button 
            onClick={handleStartGame}
            style={{
              padding: "15px 30px",
              fontSize: "20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Start Game
          </button>
          <div style={{ marginTop: "2rem", color: "#ccc" }}>
            <p>Player 1: W/S keys</p>
            <p>Player 2: Arrow keys</p>
          </div>
        </div>
      )}
      
      {screen === "game" && (
        <div>
          <canvas 
            ref={canvasRef} 
            width={600} 
            height={400} 
            style={{ border: "2px solid white", display: "block" }} 
          />
          <div style={{ marginTop: "1rem" }}>
            <p style={{ fontSize: "18px" }}>
              Player 1: {gameState?.player1?.score || 0} - Player 2: {gameState?.player2?.score || 0}
            </p>
          </div>
        </div>
      )}
      
      {screen === "end" && (
        <div>
          <h1 style={{ fontSize: "3rem", color: "#ffd700", marginBottom: "2rem" }}>
            {gameState?.winner} Wins!
          </h1>
          <p style={{ fontSize: "20px", marginBottom: "2rem" }}>
            Final Score: Player 1: {gameState?.player1?.score} - Player 2: {gameState?.player2?.score}
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button
              onClick={handleRestart}
              style={{
                padding: "15px 30px",
                fontSize: "18px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              Play Again
            </button>
            <button
              onClick={() => setScreen("start")}
              style={{
                padding: "15px 30px",
                fontSize: "18px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              Main Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}