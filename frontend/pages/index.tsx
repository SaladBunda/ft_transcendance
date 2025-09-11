// frontend/pages/index.tsx
import { useEffect, useRef, useState } from 'react';

const PongGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/ws');

    ws.onmessage = (event) => {
      const state = JSON.parse(event.data);
      setGameState(state);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState) {
        if (e.key === 'ArrowUp') {
          ws.send(JSON.stringify({ type: 'update', player1Y: gameState.player1.y - 10 }));
        } else if (e.key === 'ArrowDown') {
          ws.send(JSON.stringify({ type: 'update', player1Y: gameState.player1.y + 10 }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      ws.close();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);

  useEffect(() => {
    if (canvasRef.current && gameState) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 600, 400);

        // Draw ball
        ctx.fillStyle = 'white';
        ctx.fillRect(gameState.ball.x, gameState.ball.y, 10, 10);

        // Draw paddles
        ctx.fillRect(gameState.player1.x, gameState.player1.y, 10, 100);
        ctx.fillRect(gameState.player2.x, gameState.player2.y, 10, 100);
      }
    }
  }, [gameState]);

  return <canvas ref={canvasRef} width={600} height={400} style={{ background: 'black' }} />;
};

export default PongGame;