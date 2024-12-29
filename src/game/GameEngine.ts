type coords = [number, number];

const neighbors = new Set([
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
]);

class GameEngine {
  activeCells: Set<string> = new Set();
  generation: number = 0;
  onStateChange: (() => void) | null = null;
  onRedraw: (() => void) | null = null;
  gameSpeed: number; // generation per second
  gameState: "running" | "paused" | "stopped" = "stopped";

  intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(gameSpeed: number) {
    this.gameSpeed = gameSpeed;
  }

  setRedrawCallback(callback: () => void) {
    this.onRedraw = callback;
  }

  setGameSpeed(speed: number) {
    this.gameSpeed = speed;
    if (this.gameState === "running" && this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = setInterval(() => {
        this.nextGeneration();
      }, 1000 / this.gameSpeed);
      this.onStateChange?.();
    }
  }

  addCell(cell: coords) {
    const key = cell.join(",");
    this.activeCells.add(key);
    this.onStateChange?.();
    this.onRedraw?.();
  }

  removeCell(cell: coords) {
    const key = cell.join(",");
    this.activeCells.delete(key);
    this.onStateChange?.();
    this.onRedraw?.();
  }

  isAlive(cell: coords) {
    const key = cell.join(",");
    return this.activeCells.has(key);
  }

  killAll() {
    this.activeCells.clear();
    this.generation = 0;
    this.onStateChange?.();
    this.onRedraw?.();
  }

  getActiveCells() {
    return this.activeCells;
  }

  getGameState() {
    return this.gameState;
  }

  nextGeneration() {
    const newActiveCells = new Set<string>();
    const seen = new Set<string>();
    const toCheck = new Set<string>();

    // for each cell, check if it dies or survives
    this.activeCells.forEach((cell) => {
      seen.add(cell);
      const [x, y] = cell.split(",").map(Number);
      let n = 0;

      for (const [dx, dy] of neighbors) {
        const neighbor: coords = [x + dx, y + dy];
        const neighborKey = neighbor.join(",");
        if (!seen.has(neighborKey)) {
          toCheck.add(neighborKey);
          seen.add(neighborKey);
        }
        n = n + (this.isAlive(neighbor) ? 1 : 0);
      }

      if (n >= 4 || n <= 1) {
        newActiveCells.delete(cell);
      } else {
        newActiveCells.add(cell);
      }
    });

    // for each neighbor of each cell, check if it should be born
    toCheck.forEach((cell) => {
      const [x, y] = cell.split(",").map(Number);
      let n = 0;

      for (const [dx, dy] of neighbors) {
        const neighbor: coords = [x + dx, y + dy];
        n = n + (this.isAlive(neighbor) ? 1 : 0);
      }

      if (n === 3) {
        newActiveCells.add(cell);
      }
    });

    this.activeCells = newActiveCells;
    this.generation++;
    this.onStateChange?.();
    this.onRedraw?.();
  }

  startGame() {
    if (this.gameState === "running") return;

    this.gameState = "running";
    this.intervalId = setInterval(() => {
      this.nextGeneration();
    }, 1000 / this.gameSpeed);
    this.onStateChange?.();
  }

  pauseGame() {
    if (this.gameState !== "running") return;

    this.gameState = "paused";
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.onStateChange?.();
  }

  stopGame() {
    this.gameState = "stopped";
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.killAll();
    this.onStateChange?.();
  }
}

export default GameEngine;
