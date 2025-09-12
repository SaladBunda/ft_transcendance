
// import React, { useEffect, useRef, useState } from 'react';


// const Game = () => {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const wsRef = useRef<WebSocket | null>(null);
//   const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });

//   useEffect(() => {
//     const updateSize = () => {
//       setCanvasSize({
//         width: Math.min(600, window.innerWidth - 20),
//         height: Math.min(400, window.innerHeight - 20),
//       });
//     };
//     updateSize();
//     window.addEventListener('resize', updateSize);
//     return () => window.removeEventListener('resize', updateSize);
//   }, []);
//   useEffect(() => {
	
//     const canvas = canvasRef.current;
//     const ctx = canvas?.getContext('2d');
//     const ws = new WebSocket('ws://localhost:3001/ws');
//     wsRef.current = ws;

//     ws.onopen = () => {
//       console.log('Connected to WebSocket server');
//     };

//     ws.onmessage = (event) => {
//       const gameState = JSON.parse(event.data);
//       if (ctx && canvas) {
//         ctx.clearRect(0, 0, canvas.width, canvas.height);
// 		ctx.strokeStyle = 'white';
//         ctx.lineWidth = 2;
//         ctx.strokeRect(0, 0, canvas.width, canvas.height);

//         // Optional: center line
//         ctx.strokeStyle = 'gray';
//         ctx.setLineDash([10, 10]);
//         ctx.beginPath();
//         ctx.moveTo(canvas.width / 2, 0);
//         ctx.lineTo(canvas.width / 2, canvas.height);
//         ctx.stroke();
//         ctx.setLineDash([]);
//         ctx.fillStyle = 'white';
//         ctx.fillRect(gameState.player1.x, gameState.player1.y, 10, 100); // Use player1
//     	ctx.fillRect(gameState.player2.x, gameState.player2.y, 10, 100); // Use player2
//     	ctx.fillRect(gameState.ball.x, gameState.ball.y, 10, 10);
//       }
//     };

// 	const handleKeyDown = (event: KeyboardEvent) => {
// 		if (ws.readyState !== WebSocket.OPEN) return;
  
// 		let player1DY = 0;
// 		let player2DY = 0;
  
// 		// Player 1 controls (Arrow keys)
// 		if (event.key === 'ArrowUp') player1DY = -5;
// 		else if (event.key === 'ArrowDown') player1DY = 5;
  
// 		// Player 2 controls (W/S)
// 		if (event.key === 'w' || event.key === 'W') player2DY = -5;
// 		else if (event.key === 's' || event.key === 'S') player2DY = 5;
  
// 		if (player1DY !== 0 || player2DY !== 0) {
// 		  ws.send(JSON.stringify({ type: 'update', player1DY, player2DY }));
// 		}
// 	  };
  
// 	  const handleKeyUp = (event: KeyboardEvent) => {
// 		if (ws.readyState !== WebSocket.OPEN) return;
  
// 		// Stop paddle movement when key released
// 		if (
// 		  ['ArrowUp', 'ArrowDown'].includes(event.key)
// 		) {
// 		  ws.send(JSON.stringify({ type: 'update', player1DY: 0 }));
// 		}
  
// 		if (['w', 'W', 's', 'S'].includes(event.key)) {
// 		  ws.send(JSON.stringify({ type: 'update', player2DY: 0 }));
// 		}
// 	  };

//     window.addEventListener('keydown', handleKeyDown);
//     window.addEventListener('keyup', handleKeyUp);

//     return () => {
//       ws.close();
//       window.removeEventListener('keydown', handleKeyDown);
//       window.removeEventListener('keyup', handleKeyUp);
//     };
//   }, []);

//   return (
//     <div
//       style={{
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         height: '100vh',
//         background: 'black',
// 		overflow: 'hidden',
//       }}
//     >
//       <canvas
//         ref={canvasRef}
//         width={canvasSize.width}
//         height={canvasSize.height}
//         style={{ border: '2px solid white' }}
//       />
//     </div>
//   );
// };

// export default Game;



import React, { useEffect, useRef, useState } from "react";

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const updateSize = () => {
      setCanvasSize({
        width: Math.min(600, window.innerWidth - 20),
        height: Math.min(400, window.innerHeight - 20),
      });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const ws = new WebSocket("ws://localhost:3001/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    ws.onmessage = (event) => {
      const gameState = JSON.parse(event.data);
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // Center dashed line
        ctx.strokeStyle = "gray";
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw paddles + ball
        ctx.fillStyle = "white";
        ctx.fillRect(gameState.player1.x, gameState.player1.y, 10, 100);
        ctx.fillRect(gameState.player2.x, gameState.player2.y, 10, 100);
        ctx.fillRect(gameState.ball.x, gameState.ball.y, 10, 10);
      }
    };

    // Fix 1: track pressed keys instead of one-off messages
    const keysPressed = new Set<string>();

    const sendUpdate = () => {
      if (ws.readyState !== WebSocket.OPEN) return;

      let player1DY = 0;
      let player2DY = 0;

      if (keysPressed.has("ArrowUp")) player1DY -= 5;
      if (keysPressed.has("ArrowDown")) player1DY += 5;
      if (keysPressed.has("w") || keysPressed.has("W")) player2DY -= 5;
      if (keysPressed.has("s") || keysPressed.has("S")) player2DY += 5;

      ws.send(JSON.stringify({ type: "update", player1DY, player2DY }));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      keysPressed.add(event.key);
      sendUpdate();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysPressed.delete(event.key);
      sendUpdate();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      ws.close();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "black",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ border: "2px solid white" }}
      />
    </div>
  );
};

export default Game;
