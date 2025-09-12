// // frontend/pages/index.tsx
// import { useEffect, useRef, useState } from 'react';

// interface GameState {
//   ball: { x: number; y: number; dx: number; dy: number };
//   player1: { x: number; y: number };
//   player2: { x: number; y: number };
// }

// const PongGame = () => {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const [gameState, setGameState] = useState<GameState | null>(null);

//   useEffect(() => {
//     // 👇 In Docker, use "backend" service name instead of localhost
//     const ws = new WebSocket('ws://localhost:3001/ws');

//     ws.onmessage = (event) => {
//       const state: GameState = JSON.parse(event.data);
//       setGameState(state);
//     };

//     ws.onerror = (error) => {
//       console.error('WebSocket error:', error);
//     };

//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (!gameState) return;
//       let newY = gameState.player1.y;

//       if (e.key === 'ArrowUp') {
//         newY -= 10;
//       } else if (e.key === 'ArrowDown') {
//         newY += 10;
//       }

//       // Send update to backend
//       ws.send(
//         JSON.stringify({
//           type: 'update',
//           player1Y: newY,
//           player2Y: gameState.player2.y,
//         })
//       );
//     };

//     window.addEventListener('keydown', handleKeyDown);

//     return () => {
//       ws.close();
//       window.removeEventListener('keydown', handleKeyDown);
//     };
//   }, []); // 👈 only run once (not on every gameState update)

//   useEffect(() => {
//     if (canvasRef.current && gameState) {
//       const ctx = canvasRef.current.getContext('2d');
//       if (ctx) {
//         ctx.clearRect(0, 0, 600, 400);

//         // Draw ball
//         ctx.fillStyle = 'white';
//         ctx.fillRect(gameState.ball.x, gameState.ball.y, 10, 10);

//         // Draw paddles
//         ctx.fillRect(gameState.player1.x, gameState.player1.y, 10, 100);
//         ctx.fillRect(gameState.player2.x, gameState.player2.y, 10, 100);
//       }
//     }
//   }, [gameState]);

//   return (
//     <canvas
//       ref={canvasRef}
//       width={600}
//       height={400}
//       style={{ background: 'black', display: 'block', margin: '20px auto' }}
//     />
//   );
// };

// export default PongGame;


import React, { useEffect, useRef } from 'react';

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const ws = new WebSocket('ws://localhost:3001/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    ws.onmessage = (event) => {
      const gameState = JSON.parse(event.data);
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(gameState.player1.x, gameState.player1.y, 10, 100); // Use player1
    	ctx.fillRect(gameState.player2.x, gameState.player2.y, 10, 100); // Use player2
    	ctx.fillRect(gameState.ball.x, gameState.ball.y, 10, 10);
      }
    };

    // const handleKeyDown = (event: KeyboardEvent) => {
    //   if (ws.readyState === WebSocket.OPEN) {
    //     if (event.key === 'ArrowUp') {
    //       ws.send(JSON.stringify({ action: 'move', direction: 'up', paddle: 1 }));
    //     } else if (event.key === 'ArrowDown') {
    //       ws.send(JSON.stringify({ action: 'move', direction: 'down', paddle: 1 }));
    //     }
    //   }
    // };

    // const handleKeyUp = (event: KeyboardEvent) => {
    //   if (ws.readyState === WebSocket.OPEN) {
    //     if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    //       ws.send(JSON.stringify({ action: 'stop', paddle: 1 }));
    //     }
    //   }
    // };
	const handleKeyDown = (event: KeyboardEvent) => {
		if (ws.readyState !== WebSocket.OPEN) return;
  
		let player1DY = 0;
		let player2DY = 0;
  
		// Player 1 controls (Arrow keys)
		if (event.key === 'ArrowUp') player1DY = -5;
		else if (event.key === 'ArrowDown') player1DY = 5;
  
		// Player 2 controls (W/S)
		if (event.key === 'w' || event.key === 'W') player2DY = -5;
		else if (event.key === 's' || event.key === 'S') player2DY = 5;
  
		if (player1DY !== 0 || player2DY !== 0) {
		  ws.send(JSON.stringify({ type: 'update', player1DY, player2DY }));
		}
	  };
  
	  const handleKeyUp = (event: KeyboardEvent) => {
		if (ws.readyState !== WebSocket.OPEN) return;
  
		// Stop paddle movement when key released
		if (
		  ['ArrowUp', 'ArrowDown'].includes(event.key)
		) {
		  ws.send(JSON.stringify({ type: 'update', player1DY: 0 }));
		}
  
		if (['w', 'W', 's', 'S'].includes(event.key)) {
		  ws.send(JSON.stringify({ type: 'update', player2DY: 0 }));
		}
	  };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      ws.close();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return <canvas ref={canvasRef} width={800} height={600} style={{ background: 'black' }} />;
};

export default Game;