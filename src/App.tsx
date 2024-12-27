import { useRef, useLayoutEffect, useState, useCallback } from "react";
import "./App.css";

const GRID_SIZE = 10;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const [filledSquares, setFilledSquares] = useState<Set<string>>(new Set());
  const [isMouseDown, setIsMouseDown] = useState(false);

  const setupCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    return ctx;
  }, []);

  const drawBorder = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(1, 1);
    ctx.lineTo(GAME_WIDTH - 1, 1);
    ctx.lineTo(GAME_WIDTH - 1, GAME_HEIGHT - 1);
    ctx.lineTo(1, GAME_HEIGHT - 1);
    ctx.closePath();
    ctx.stroke();
  }, []);

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Clear the canvas first
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      drawBorder(ctx);

      // Draw filled squares
      ctx.fillStyle = "white";
      filledSquares.forEach((key) => {
        const [x, y] = key.split(",").map(Number);
        ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      });

      // Draw vertical lines
      for (let i = GRID_SIZE; i < GAME_WIDTH; i += GRID_SIZE) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "gray";
        ctx.beginPath();
        ctx.moveTo(i + 0.5, 2);
        ctx.lineTo(i + 0.5, GAME_HEIGHT - 2);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let i = GRID_SIZE; i < GAME_HEIGHT; i += GRID_SIZE) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "gray";
        ctx.beginPath();
        ctx.moveTo(2, i + 0.5);
        ctx.lineTo(GAME_WIDTH - 2, i + 0.5);
        ctx.stroke();
      }
    },
    [filledSquares, drawBorder]
  );

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Calculate grid position
      const gridX = Math.floor(x / GRID_SIZE);
      const gridY = Math.floor(y / GRID_SIZE);
      const key = `${gridX},${gridY}`;

      setFilledSquares((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    },
    []
  );

  const interpolatePoints = useCallback(
    (x1: number, y1: number, x2: number, y2: number): string[] => {
      const points: string[] = [];
      const dx = Math.abs(x2 - x1);
      const dy = Math.abs(y2 - y1);
      const sx = x1 < x2 ? 1 : -1;
      const sy = y1 < y2 ? 1 : -1;
      let err = dx - dy;

      while (true) {
        points.push(`${x1},${y1}`);
        if (x1 === x2 && y1 === y2) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x1 += sx;
        }
        if (e2 < dx) {
          err += dx;
          y1 += sy;
        }
      }
      return points;
    },
    []
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isMouseDown) {
        const { clientX: x, clientY: y } = e;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const currentPos = { x: x - rect.left, y: y - rect.top };
        mouseRef.current = currentPos;

        // Calculate current grid position
        const currentGridX = Math.floor(currentPos.x / GRID_SIZE);
        const currentGridY = Math.floor(currentPos.y / GRID_SIZE);

        if (lastMousePosRef.current) {
          const lastGridX = Math.floor(lastMousePosRef.current.x / GRID_SIZE);
          const lastGridY = Math.floor(lastMousePosRef.current.y / GRID_SIZE);

          // Interpolate between last and current position
          const interpolatedPoints = interpolatePoints(
            lastGridX,
            lastGridY,
            currentGridX,
            currentGridY
          );

          setFilledSquares((prev) => {
            const next = new Set(prev);
            interpolatedPoints.forEach((point) => next.add(point));
            return next;
          });
        }

        lastMousePosRef.current = currentPos;
      }
    },
    [isMouseDown, interpolatePoints]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      setIsMouseDown(true);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      lastMousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
    lastMousePosRef.current = null;
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = setupCanvas(canvas);
    if (!ctx) return;

    drawGrid(ctx);
  }, [drawGrid, setupCanvas]);

  const clearCanvas = () => {
    setFilledSquares(new Set());
  };

  return (
    <main>
      <canvas
        id="canvas"
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={onMouseMove}
      />
      <div>
        <button onClick={clearCanvas}>Clear</button>
      </div>
    </main>
  );
}

export default App;
