import { useRef, useLayoutEffect, useCallback, useState } from "react";
import "./App.css";
import {
  drawGrid,
  GRID_SIZE,
  interpolatePoints,
  setGameDimensions,
} from "./game/util";

import GameEngine from "./game/GameEngine";
import GameStats from "./components/GameStats";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const isMouseDownRef = useRef(false);

  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize game engine immediately and store in state
  const [gameEngine] = useState(() => new GameEngine(5));
  const [gameSpeed, setGameSpeed] = useState(5);

  const setupCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Update game dimensions based on container size
    setGameDimensions(rect.width, rect.height);

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    return ctx;
  }, []);

  const redrawCanvas = useCallback(() => {
    if (ctxRef.current) {
      drawGrid(ctxRef.current, gameEngine.getActiveCells());
    }
  }, [gameEngine]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isMouseDownRef.current) {
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

          interpolatedPoints.forEach((point) => {
            const [x, y] = point.split(",").map(Number);
            gameEngine.addCell([x, y]);
          });
          redrawCanvas();
        }

        lastMousePosRef.current = currentPos;
      }
    },
    [gameEngine, redrawCanvas]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      isMouseDownRef.current = true;
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
    isMouseDownRef.current = false;

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
        if (gameEngine.isAlive([currentGridX, currentGridY])) {
          gameEngine.removeCell([currentGridX, currentGridY]);
        } else {
          gameEngine.addCell([currentGridX, currentGridY]);
        }
        redrawCanvas();
      }
    }
  }, [gameEngine, redrawCanvas]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === canvas.parentElement) {
          const rect = entry.contentRect;
          setGameDimensions(rect.width, rect.height);

          const dpr = window.devicePixelRatio || 1;
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.scale(dpr, dpr);
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            ctxRef.current = ctx;
            redrawCanvas();
          }
        }
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const ctx = setupCanvas(canvas);
    if (!ctx) return;

    ctxRef.current = ctx;
    gameEngine.setRedrawCallback(redrawCanvas);
    redrawCanvas();

    return () => {
      resizeObserver.disconnect();
    };
  }, [setupCanvas, redrawCanvas, gameEngine]);

  const handleGameSpeedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const speed = Number(e.target.value);
      setGameSpeed(speed);
      gameEngine.setGameSpeed(speed);
    },
    [gameEngine]
  );

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        height: "100dvh",
        boxSizing: "border-box",
        paddingTop: "56px",
      }}
    >
      <GameStats gameEngine={gameEngine} />

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "4px",
          alignItems: "center",
          paddingBottom: "8px",
        }}
      >
        <div>Game Speed: </div>
        <input
          type="range"
          min="1"
          max="15"
          value={gameSpeed}
          step="any"
          onChange={handleGameSpeedChange}
          style={{
            width: "150px",
          }}
        />
        <div>{gameSpeed.toFixed(2)}</div>
      </div>

      <div
        style={{
          flex: 1,
          width: "100dvw",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          boxSizing: "border-box",
          minHeight: 0,
        }}
      >
        <canvas
          id="canvas"
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={onMouseMove}
        />
      </div>
    </main>
  );
}

export default App;
