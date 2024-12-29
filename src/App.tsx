import { useRef, useLayoutEffect, useCallback, useState } from "react";
import "./App.css";
import {
  drawGrid,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRID_SIZE,
  interpolatePoints,
} from "./game/util";
import GameEngine from "./game/GameEngine";

// Separate component for game stats
const GameStats = ({ gameEngine }: { gameEngine: GameEngine | undefined }) => {
  const [stats, setStats] = useState({ generation: 0, population: 0 });

  // Update stats when the game engine changes
  const updateStats = useCallback(() => {
    setStats({
      generation: gameEngine?.generation ?? 0,
      population: gameEngine?.activeCells.size ?? 0,
    });
  }, [gameEngine]);

  // Expose the update function to parent
  useLayoutEffect(() => {
    if (!gameEngine) return;

    gameEngine.onStateChange = updateStats;
    return () => {
      gameEngine.onStateChange = null;
    };
  }, [gameEngine, updateStats]);

  return (
    <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
      <div>Generation: {stats.generation}</div>
      <div>Population: {stats.population}</div>
    </div>
  );
};

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isMouseDownRef = useRef(false);

  // Initialize game engine immediately and store in state
  const [gameEngine] = useState(() => new GameEngine());

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

    const ctx = setupCanvas(canvas);
    if (!ctx) return;

    ctxRef.current = ctx;
    redrawCanvas();
  }, [setupCanvas, redrawCanvas]);

  const clearCanvas = useCallback(() => {
    gameEngine.killAll();
    redrawCanvas();
  }, [gameEngine, redrawCanvas]);

  const nextGeneration = useCallback(() => {
    gameEngine.nextGeneration();
    redrawCanvas();
  }, [gameEngine, redrawCanvas]);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <button onClick={clearCanvas}>Clear</button>
        <button>Start</button>
        <button>Pause</button>
        <button onClick={nextGeneration}>Step</button>
      </div>

      <GameStats gameEngine={gameEngine} />

      <canvas
        id="canvas"
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        ref={canvasRef}
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={onMouseMove}
      />
    </main>
  );
}

export default App;
