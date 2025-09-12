import React, { useEffect, useRef, useState } from "react";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [screen, setScreen] = useState<"start" | "game" | "end">("start");
  const [gameState, setGameState] = useState<any>(null);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    if (screen !== "game") return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    const ws = new WebSocket("ws://localhost:3001/ws");
    wsRef.current = ws;

    ws.onopen = () => console.log("Connected to WebSocket server");
    ws.onclose = () => console.log("WebSocket closed");

    ws.onmessage = (event) => {
      const state = JSON.parse(event.data);
      setGameState(state);

      if (state.winner) {
        setWinner(state.winner);
        setScreen("end");
        ws.close();
      }

      // Draw
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw paddles
        ctx.fillStyle = "white";
        ctx.fillRect(state.player1.x, state.player1.y, 10, 100);
        ctx.fillRect(state.player2.x, state.player2.y, 10, 100);

        // Draw ball
        ctx.fillRect(state.ball.x, state.ball.y, 10, 10);

        // Draw scores
        ctx.font = "20px Arial";
        ctx.fillText(`P1: ${state.player1.score}`, 50, 30);
        ctx.fillText(`P2: ${state.player2.score}`, canvas.width - 100, 30);
      }
    };

    const keysPressed = new Set<string>();
    const sendUpdate = () => {
      if (ws.readyState !== WebSocket.OPEN) return;

      let player1DY = 0;
      let player2DY = 0;

      // Swap: Arrow → Right (player2), W/S → Left (player1)
      if (keysPressed.has("ArrowUp")) player2DY = -5;
      if (keysPressed.has("ArrowDown")) player2DY = 5;
      if (keysPressed.has("w") || keysPressed.has("W")) player1DY = -5;
      if (keysPressed.has("s") || keysPressed.has("S")) player1DY = 5;

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

  if (screen === "start") {
    return (
      <div style={{ textAlign: "center" }}>
        <h1>Pong Game</h1>
        <button onClick={() => setScreen("game")}>Start</button>
      </div>
    );
  }

  if (screen === "end") {
    return (
      <div style={{ textAlign: "center" }}>
        <h1>{winner} Wins!</h1>
        <button
          onClick={() => {
            setWinner(null);
            setScreen("start");
          }}
        >
          Restart
        </button>
      </div>
    );
  }

  // Game screen
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "black",
      }}
    >
      <canvas ref={canvasRef} width={600} height={400} style={{ border: "2px solid white" }} />
    </div>
  );
}
