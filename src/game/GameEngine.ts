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

  constructor() {
    this.activeCells = new Set();
  }

  addCell(cell: coords) {
    const key = cell.join(",");
    this.activeCells.add(key);
    this.onStateChange?.();
  }

  removeCell(cell: coords) {
    const key = cell.join(",");
    this.activeCells.delete(key);
    this.onStateChange?.();
  }

  isAlive(cell: coords) {
    const key = cell.join(",");
    return this.activeCells.has(key);
  }

  killAll() {
    this.activeCells.clear();
    this.generation = 0;
    this.onStateChange?.();
  }

  getActiveCells() {
    return this.activeCells;
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
  }
}

export default GameEngine;
