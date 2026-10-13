/**
 * Unified Board Layout & Slot System
 * Ensures pixel-perfect alignment and collision avoidance across all 4 modes:
 * - Sticky Board (2D Canvas)
 * - Kanban View
 * - Grid View
 * - List View
 */

export const BOARD_GRID = {
  START_X: 16,
  START_Y: 16,
  SPACING_X: 285,
  SPACING_Y: 295,
  NOTE_WIDTH: 260,
  NOTE_HEIGHT: 260,
  COLS: 7,
  MARGIN: 16,
} as const;

export interface NotePositionItem {
  id?: string;
  posX?: number | null;
  posY?: number | null;
  width?: number | null;
  height?: number | null;
  isArchived?: boolean;
}

/**
 * Calculates default slot position based on an index in a 7-column layout.
 */
export function getSlotByIndex(index: number): { x: number; y: number } {
  const col = index % BOARD_GRID.COLS;
  const row = Math.floor(index / BOARD_GRID.COLS);
  return {
    x: BOARD_GRID.START_X + col * BOARD_GRID.SPACING_X,
    y: BOARD_GRID.START_Y + row * BOARD_GRID.SPACING_Y,
  };
}

/**
 * Checks whether a candidate rectangle collides with any existing notes or pending reservations.
 */
export function isSlotOccupied(
  candX: number,
  candY: number,
  notes: NotePositionItem[],
  pendingSlots: Array<{ x: number; y: number }> = [],
  candW: number = BOARD_GRID.NOTE_WIDTH,
  candH: number = BOARD_GRID.NOTE_HEIGHT,
  margin: number = BOARD_GRID.MARGIN
): boolean {
  // 1. Collision with existing notes on the board
  const noteCollision = notes.some((n) => {
    if (n.isArchived) return false;
    const nx = n.posX ?? BOARD_GRID.START_X;
    const ny = n.posY ?? BOARD_GRID.START_Y;
    const nw = n.width ?? BOARD_GRID.NOTE_WIDTH;
    const nh = n.height ?? BOARD_GRID.NOTE_HEIGHT;
    return (
      candX < nx + nw + margin &&
      candX + candW + margin > nx &&
      candY < ny + nh + margin &&
      candY + candH + margin > ny
    );
  });
  if (noteCollision) return true;

  // 2. Collision with pending reservations (prevents race conditions when adding notes quickly)
  const pendingCollision = pendingSlots.some((p) => {
    return (
      candX < p.x + candW + margin &&
      candX + candW + margin > p.x &&
      candY < p.y + candH + margin &&
      candY + candH + margin > p.y
    );
  });

  return pendingCollision;
}

/**
 * Finds the next available neat grid slot on the board that doesn't overlap any existing notes.
 */
export function findNextAvailableGridSlot(
  notes: NotePositionItem[],
  pendingSlots: Array<{ x: number; y: number }> = []
): { x: number; y: number } {
  const maxSlots = notes.length + 120;
  for (let slot = 0; slot < maxSlots; slot++) {
    const col = slot % BOARD_GRID.COLS;
    const row = Math.floor(slot / BOARD_GRID.COLS);
    const candX = BOARD_GRID.START_X + col * BOARD_GRID.SPACING_X;
    const candY = BOARD_GRID.START_Y + row * BOARD_GRID.SPACING_Y;

    if (!isSlotOccupied(candX, candY, notes, pendingSlots)) {
      return { x: candX, y: candY };
    }
  }

  return { x: BOARD_GRID.START_X, y: BOARD_GRID.START_Y };
}
