import { useRef, useLayoutEffect, useState, useCallback } from "react";
import "./App.css";
import {
  drawGrid,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRID_SIZE,
  interpolatePoints,
} from "./util";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);

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
    [isMouseDown]
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
      mouseDownPosRef.current = lastMousePosRef.current;
      mouseRef.current = lastMousePosRef.current;
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);

    if (mouseDownPosRef.current && mouseRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Calculate grid position
      const prevGridX = Math.floor(mouseDownPosRef.current.x / GRID_SIZE);
      const prevGridY = Math.floor(mouseDownPosRef.current.y / GRID_SIZE);
      const prevKey = `${prevGridX},${prevGridY}`;

      const currentGridX = Math.floor(mouseRef.current.x / GRID_SIZE);
      const currentGridY = Math.floor(mouseRef.current.y / GRID_SIZE);
      const currentKey = `${currentGridX},${currentGridY}`;
      if (currentKey == prevKey) {
        setFilledSquares((prev) => {
          const next = new Set(prev);
          if (next.has(currentKey)) {
            next.delete(currentKey);
          } else {
            next.add(currentKey);
          }
          return next;
        });
      }
    }
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = setupCanvas(canvas);
    if (!ctx) return;

    drawGrid(ctx, filledSquares);
  }, [setupCanvas, filledSquares]);

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
        // onClick={handleCanvasClick}
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
