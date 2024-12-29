const GRID_SIZE = 10;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const drawBorder = (ctx: CanvasRenderingContext2D) => {
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1, 1);
  ctx.lineTo(GAME_WIDTH - 1, 1);
  ctx.lineTo(GAME_WIDTH - 1, GAME_HEIGHT - 1);
  ctx.lineTo(1, GAME_HEIGHT - 1);
  ctx.closePath();
  ctx.stroke();
};

const drawGrid = (ctx: CanvasRenderingContext2D, activeCells: Set<string>) => {
  // Clear the canvas first
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  drawBorder(ctx);

  // Draw filled squares
  ctx.fillStyle = "white";
  activeCells.forEach((key) => {
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
};

const interpolatePoints = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string[] => {
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
};

export {
  drawBorder,
  drawGrid,
  interpolatePoints,
  GRID_SIZE,
  GAME_WIDTH,
  GAME_HEIGHT,
};
