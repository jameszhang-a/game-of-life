import { useState, useCallback, useLayoutEffect } from "react";
import GameEngine from "../game/GameEngine";

const GameStats = ({ gameEngine }: { gameEngine: GameEngine }) => {
  const [stats, setStats] = useState({
    generation: 0,
    population: 0,
    gameState: gameEngine.getGameState(),
  });

  // Update stats when the game engine changes
  const updateStats = useCallback(() => {
    setStats({
      generation: gameEngine.generation,
      population: gameEngine.activeCells.size,
      gameState: gameEngine.getGameState(),
    });
  }, [gameEngine]);

  // Expose the update function to parent
  useLayoutEffect(() => {
    gameEngine.onStateChange = updateStats;
    return () => {
      gameEngine.onStateChange = null;
    };
  }, [gameEngine, updateStats]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
        <div>Generation: {stats.generation}</div>
        <div>Population: {stats.population}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
        <button onClick={() => gameEngine.stopGame()}>Clear</button>
        {stats.gameState === "running" ? (
          <button onClick={() => gameEngine.pauseGame()}>Pause</button>
        ) : (
          <button onClick={() => gameEngine.startGame()}>Start</button>
        )}
        <button onClick={() => gameEngine.nextGeneration()}>Step</button>
      </div>
    </div>
  );
};

export default GameStats;
