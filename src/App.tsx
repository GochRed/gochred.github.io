/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const TICK_RATE = 120; // ms per move (lower is faster)

type Point = { x: number; y: number };

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let animationFrameId: number;
    let lastTick = performance.now();
    
    let snake = [...INITIAL_SNAKE];
    let prevSnake = [...INITIAL_SNAKE];
    let direction = { ...INITIAL_DIRECTION };
    let nextDirection = { ...INITIAL_DIRECTION };
    let food = { x: 5, y: 5 };
    let gameOver = false;
    let gameStarted = false;
    let score = 0;
    let highScore = 0;

    let particles = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * GRID_SIZE * CELL_SIZE,
      y: Math.random() * GRID_SIZE * CELL_SIZE,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.4 + 0.1,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));

    let dustParticles: { x: number, y: number, vx: number, vy: number, size: number, alpha: number }[] = [];

    const generateFood = (currentSnake: Point[]) => {
      let newFood;
      while (true) {
        newFood = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        };
        const isCollision = currentSnake.some(
          (segment) => segment.x === newFood.x && segment.y === newFood.y
        );
        if (!isCollision) break;
      }
      return newFood;
    };

    food = generateFood(snake);

    const resetGame = () => {
      snake = [...INITIAL_SNAKE];
      prevSnake = [...INITIAL_SNAKE];
      direction = { ...INITIAL_DIRECTION };
      nextDirection = { ...INITIAL_DIRECTION };
      food = generateFood(snake);
      gameOver = false;
      score = 0;
      gameStarted = true;
      lastTick = performance.now();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          if (direction.y === 0) nextDirection = { x: 0, y: -1 };
          break;
        case 'ArrowDown': case 's': case 'S':
          if (direction.y === 0) nextDirection = { x: 0, y: 1 };
          break;
        case 'ArrowLeft': case 'a': case 'A':
          if (direction.x === 0) nextDirection = { x: -1, y: 0 };
          break;
        case 'ArrowRight': case 'd': case 'D':
          if (direction.x === 0) nextDirection = { x: 1, y: 0 };
          break;
        case ' ':
          if (!gameStarted || gameOver) resetGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const drawCompass = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      
      const primaryColor = 'rgba(142, 107, 74, 0.15)'; // Melange, subtle
      const secondaryColor = 'rgba(142, 107, 74, 0.08)';
      
      // Outer circles
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
      ctx.stroke();

      // Inner circle
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
      ctx.stroke();

      // Draw the 4 main points
      const drawPoint = (angle: number, length: number, width: number) => {
        ctx.save();
        ctx.rotate(angle);
        
        // Right half (darker)
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.35); // start at inner circle
        ctx.lineTo(width, -radius * 0.35 - width); // bulge out
        ctx.lineTo(0, -length); // tip
        ctx.closePath();
        ctx.fill();

        // Left half (lighter)
        ctx.fillStyle = secondaryColor;
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.35);
        ctx.lineTo(-width, -radius * 0.35 - width);
        ctx.lineTo(0, -length);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      };

      // 4 Main points
      for (let i = 0; i < 4; i++) {
        drawPoint(i * Math.PI / 2, radius * 0.95, radius * 0.15);
      }

      // 4 Minor points
      for (let i = 0; i < 4; i++) {
        drawPoint(i * Math.PI / 2 + Math.PI / 4, radius * 0.65, radius * 0.1);
      }

      // Center cross
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.2); ctx.lineTo(0, radius * 0.2);
      ctx.moveTo(-radius * 0.2, 0); ctx.lineTo(radius * 0.2, 0);
      ctx.stroke();

      ctx.restore();
    };

    let lastFrameTime = performance.now();

    const loop = (time: number) => {
      animationFrameId = requestAnimationFrame(loop);
      const dt = time - lastFrameTime;
      lastFrameTime = time;

      if (gameStarted && !gameOver) {
        if (time - lastTick > TICK_RATE) {
          // Logic Tick
          prevSnake = snake.map(p => ({...p})); // Deep copy
          direction = nextDirection;
          
          const head = snake[0];
          const newHead = {
            x: head.x + direction.x,
            y: head.y + direction.y,
          };

          // Wall collision
          if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
            gameOver = true;
          } else if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
            // Self collision
            gameOver = true;
          } else {
            snake.unshift(newHead);
            
            if (newHead.x === food.x && newHead.y === food.y) {
              score += 10;
              if (score > highScore) highScore = score;
              food = generateFood(snake);
              // Duplicate the last element in prevSnake so interpolation doesn't jump
              prevSnake.push({...prevSnake[prevSnake.length - 1]});
            } else {
              snake.pop();
            }
          }
          lastTick = time;
        }
      }

      // Render
      const progress = (gameStarted && !gameOver) ? Math.min((time - lastTick) / TICK_RATE, 1) : 1;
      
      // Clear canvas (Desert Color)
      ctx.fillStyle = '#CBA173'; // Desert Sand
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Stone Island Compass
      drawCompass(ctx, canvas.width / 2, canvas.height / 2, 120);

      // Update and Draw Sand Particles (Wind Drift)
      particles.forEach((p) => {
        p.x += p.vx * dt * 0.05;
        p.y += p.vy * dt * 0.05;
        
        if (p.x < 0) p.x += canvas.width;
        if (p.x > canvas.width) p.x -= canvas.width;
        if (p.y < 0) p.y += canvas.height;
        if (p.y > canvas.height) p.y -= canvas.height;

        ctx.fillStyle = `rgba(142, 107, 74, ${p.alpha})`; // Melange Dust
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      // Update and Draw Dust Particles (Worm wake)
      for (let i = dustParticles.length - 1; i >= 0; i--) {
        const dp = dustParticles[i];
        dp.x += dp.vx * dt * 0.05;
        dp.y += dp.vy * dt * 0.05;
        dp.alpha -= dt * 0.0005; // Fade out
        
        if (dp.alpha <= 0) {
          dustParticles.splice(i, 1);
        } else {
          ctx.fillStyle = `rgba(173, 151, 118, ${dp.alpha})`; // Lighter Ochre dust
          ctx.fillRect(dp.x, dp.y, dp.size, dp.size);
        }
      }

      // Draw Grid (Subtle)
      ctx.strokeStyle = 'rgba(142, 107, 74, 0.15)'; // Melange
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
      }

      // Draw Food (Spice / Melange)
      const fx = food.x * CELL_SIZE;
      const fy = food.y * CELL_SIZE;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#D92B00'; // Spice glow
      ctx.fillStyle = '#8E6B4A'; // Melange base
      ctx.fillRect(fx + 4, fy + 8, 12, 8);
      ctx.fillRect(fx + 6, fy + 4, 8, 4);
      ctx.fillStyle = '#AD9776'; // Ochre highlight
      ctx.fillRect(fx + 6, fy + 10, 8, 4);
      ctx.fillRect(fx + 8, fy + 6, 4, 4);
      ctx.fillStyle = '#D92B00'; // Spice red sparkle
      ctx.fillRect(fx + 10, fy + 8, 2, 2);
      ctx.shadowBlur = 0;

      // Draw Snake (Shai-Hulud)
      const reversedSnake = [...snake].reverse();
      reversedSnake.forEach((segment, revIndex) => {
        const index = snake.length - 1 - revIndex;
        const isHead = index === 0;
        
        const prev = prevSnake[index] || segment;
        
        // Interpolate position
        const interpX = prev.x + (segment.x - prev.x) * progress;
        const interpY = prev.y + (segment.y - prev.y) * progress;
        
        const x = interpX * CELL_SIZE;
        const y = interpY * CELL_SIZE;

        if (isHead) {
          let dx = segment.x - prev.x;
          let dy = segment.y - prev.y;
          if (dx === 0 && dy === 0) {
            dx = direction.x;
            dy = direction.y;
          }

          ctx.save();
          ctx.translate(x + CELL_SIZE / 2, y + CELL_SIZE / 2);
          let angle = 0;
          if (dx === 1) angle = Math.PI / 2;
          else if (dx === -1) angle = -Math.PI / 2;
          else if (dy === 1) angle = Math.PI;
          ctx.rotate(angle);

          // Head base
          ctx.fillStyle = '#8E6B4A';
          ctx.fillRect(-10, -10, 20, 20);

          // Outer ring (Ochre)
          ctx.fillStyle = '#AD9776';
          ctx.fillRect(-8, -8, 16, 16);

          // The Maw (Basalt)
          ctx.fillStyle = '#2F2F2F';
          ctx.fillRect(-6, -10, 12, 14);

          // Teeth (Bleached Erg)
          ctx.fillStyle = '#EFE3D5';
          ctx.fillRect(-6, -10, 2, 3);
          ctx.fillRect(-6, -5, 2, 2);
          ctx.fillRect(-6, -1, 2, 3);
          ctx.fillRect(4, -10, 2, 3);
          ctx.fillRect(4, -5, 2, 2);
          ctx.fillRect(4, -1, 2, 3);
          ctx.fillRect(-4, 2, 2, 2);
          ctx.fillRect(2, 2, 2, 2);
          ctx.fillRect(-1, 2, 2, 3);

          // Deep throat / Spice glow
          ctx.fillStyle = '#D92B00';
          ctx.fillRect(-2, -4, 4, 4);

          ctx.restore();

          // Spawn dust particles at the head
          if (gameStarted && !gameOver && Math.random() < 0.4) {
            dustParticles.push({
              x: x + CELL_SIZE / 2 + (Math.random() - 0.5) * 10,
              y: y + CELL_SIZE / 2 + (Math.random() - 0.5) * 10,
              vx: -dx * (Math.random() * 2 + 1) + (Math.random() - 0.5) * 2,
              vy: -dy * (Math.random() * 2 + 1) + (Math.random() - 0.5) * 2,
              size: Math.random() * 2 + 1,
              alpha: Math.random() * 0.4 + 0.2,
            });
          }
        } else {
          // Body segment
          let nextSegment = snake[index - 1];
          let prevNextSegment = prevSnake[index - 1] || nextSegment;
          
          // Interpolate next segment to find direction of this segment
          const nextInterpX = prevNextSegment.x + (nextSegment.x - prevNextSegment.x) * progress;
          const nextInterpY = prevNextSegment.y + (nextSegment.y - prevNextSegment.y) * progress;
          
          let dx = nextInterpX - interpX;
          let dy = nextInterpY - interpY;
          
          if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
            dx = direction.x;
            dy = direction.y;
          }

          const shrink = Math.floor((index / snake.length) * 10);
          const s = CELL_SIZE - shrink;
          const offset = shrink / 2;

          ctx.fillStyle = '#8E6B4A'; // Melange
          ctx.fillRect(x + offset, y + offset, s, s);

          ctx.fillStyle = '#AD9776'; // Ochre
          ctx.fillRect(x + offset + 2, y + offset + 2, s - 4, s - 4);

          if (Math.abs(dx) > Math.abs(dy)) {
            ctx.fillStyle = '#2F2F2F'; // Basalt (dark shadow)
            ctx.fillRect(x + offset + Math.floor(s/2) - 1, y + offset, 2, s);
            ctx.fillStyle = '#EFE3D5'; // Erg (highlight)
            ctx.fillRect(x + offset + Math.floor(s/2) + 1, y + offset + 2, 1, s - 4);
          } else {
            ctx.fillStyle = '#2F2F2F'; // Basalt (dark shadow)
            ctx.fillRect(x + offset, y + offset + Math.floor(s/2) - 1, s, 2);
            ctx.fillStyle = '#EFE3D5'; // Erg (highlight)
            ctx.fillRect(x + offset + 2, y + offset + Math.floor(s/2) + 1, s - 4, 1);
          }

          // Occasional body dust
          if (gameStarted && !gameOver && Math.random() < 0.05) {
            dustParticles.push({
              x: x + CELL_SIZE / 2 + (Math.random() - 0.5) * CELL_SIZE,
              y: y + CELL_SIZE / 2 + (Math.random() - 0.5) * CELL_SIZE,
              vx: (Math.random() - 0.5) * 1,
              vy: (Math.random() - 0.5) * 1,
              size: Math.random() * 1.5 + 0.5,
              alpha: Math.random() * 0.3 + 0.1,
            });
          }
        }
      });

      // Draw Score
      if (gameStarted && !gameOver) {
        ctx.fillStyle = 'rgba(47, 47, 47, 0.8)'; // Basalt
        ctx.font = 'bold 12px "IBM Plex Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SPICE: ${score}`, 10, 20);
        ctx.textAlign = 'right';
        ctx.fillText(`HIGH: ${highScore}`, canvas.width - 10, 20);
      }

      if (!gameStarted) {
        ctx.fillStyle = 'rgba(203, 161, 115, 0.85)'; // Desert Sand overlay
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#2F2F2F'; // Basalt
        ctx.font = 'bold 24px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SHAI-HULUD', canvas.width / 2, canvas.height / 2 - 40);
        
        ctx.fillStyle = '#8E6B4A'; // Melange
        ctx.font = '10px "IBM Plex Mono", monospace';
        ctx.fillText('THE SANDWORM OF ARRAKIS', canvas.width / 2, canvas.height / 2 - 15);
        
        ctx.fillStyle = '#D92B00'; // Spice Red
        ctx.font = '12px "IBM Plex Mono", monospace';
        ctx.fillText('PRESS SPACE TO COMMENCE', canvas.width / 2, canvas.height / 2 + 30);
        
        ctx.fillStyle = '#2F2F2F';
        ctx.font = 'italic 10px "IBM Plex Mono", monospace';
        ctx.fillText('"THE SPICE MUST FLOW"', canvas.width / 2, canvas.height / 2 + 60);
      }

      if (gameOver) {
        ctx.fillStyle = 'rgba(203, 161, 115, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#2F2F2F';
        ctx.font = 'bold 28px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('THE WORM HAS FALLEN', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.fillStyle = '#D92B00';
        ctx.font = '16px "IBM Plex Mono", monospace';
        ctx.fillText(`SPICE HARVESTED: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
        
        ctx.fillStyle = '#8E6B4A';
        ctx.font = '12px "IBM Plex Mono", monospace';
        ctx.fillText('PRESS SPACE TO RISE AGAIN', canvas.width / 2, canvas.height / 2 + 60);
      }
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="flex items-center justify-center w-full h-full bg-[#CBA173]">
      <div className="relative border-4 border-[#8E6B4A] p-1 bg-[#CBA173] shadow-[0_0_20px_rgba(142,107,74,0.5)]">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="block"
        />
      </div>
    </div>
  );
}
