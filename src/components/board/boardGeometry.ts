export interface BoardGeometry {
  padding: number;
  gap: number;
  tile: number;
  corner: number;
}

export function boardGeometry(pixelSize: number, gridSize: number): BoardGeometry {
  const padding = Math.round(pixelSize * 0.045);
  const gap = Math.max(4, Math.round((pixelSize * 0.1) / gridSize));
  const tile = (pixelSize - padding * 2 - gap * (gridSize - 1)) / gridSize;
  return { padding, gap, tile, corner: tile * 0.24 };
}

export function tileOrigin(geometry: BoardGeometry, gridSize: number, index: number) {
  const row = Math.floor(index / gridSize);
  const col = index % gridSize;
  return {
    x: geometry.padding + col * (geometry.tile + geometry.gap),
    y: geometry.padding + row * (geometry.tile + geometry.gap),
  };
}

/** Maps a touch point to a tile index, or null when it lands outside the grid. */
export function cellAt(geometry: BoardGeometry, gridSize: number, x: number, y: number): number | null {
  const step = geometry.tile + geometry.gap;
  const col = Math.floor((x - geometry.padding + geometry.gap / 2) / step);
  const row = Math.floor((y - geometry.padding + geometry.gap / 2) / step);
  if (col < 0 || row < 0 || col >= gridSize || row >= gridSize) return null;
  return row * gridSize + col;
}
