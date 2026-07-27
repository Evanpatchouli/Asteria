/** Default distance from the right and bottom work-area edges in pixels. */
export const DEFAULT_WINDOW_MARGIN = 24;

/** Minimum window length kept visible on each axis when restoring a position. */
export const MINIMUM_VISIBLE_WINDOW_SIZE = 64;

/** Integer desktop coordinates for the top-left corner of a window. */
export interface WindowPosition {
  readonly x: number;
  readonly y: number;
}

/** Window dimensions in device-independent pixels. */
export interface WindowSize {
  readonly height: number;
  readonly width: number;
}

/** Rectangular usable screen area in desktop coordinates. */
export interface WorkArea extends WindowPosition, WindowSize {}

/** Minimal display shape required by the position resolver. */
export interface DisplayWorkArea {
  readonly workArea: WorkArea;
}

/**
 * Calculates a position centered within a work area.
 *
 * If the window is larger than the work area on either axis, that axis is
 * aligned to the work area's starting edge.
 */
export function calculateCenteredPosition(
  workArea: WorkArea,
  windowSize: WindowSize,
): WindowPosition {
  return {
    x: calculateCenteredAxis(workArea.x, workArea.width, windowSize.width),
    y: calculateCenteredAxis(workArea.y, workArea.height, windowSize.height),
  };
}

/**
 * Calculates a position aligned to the bottom-right corner of a work area.
 *
 * If the window is larger than the work area on either axis, that axis is
 * aligned to the work area's starting edge.
 */
export function calculateBottomRightPosition(
  workArea: WorkArea,
  windowSize: WindowSize,
  margin = DEFAULT_WINDOW_MARGIN,
): WindowPosition {
  return {
    x: calculateBottomRightAxis(
      workArea.x,
      workArea.width,
      windowSize.width,
      margin,
    ),
    y: calculateBottomRightAxis(
      workArea.y,
      workArea.height,
      windowSize.height,
      margin,
    ),
  };
}

/**
 * Resolves a saved window position against the currently available displays.
 *
 * A saved position is restored when it overlaps a display work area. The
 * display with the largest overlap is selected. Intentional partial off-screen
 * placement is preserved when at least the minimum visible length remains on
 * each axis; otherwise the position is adjusted only enough to retain it. A
 * position that no longer overlaps any display falls back to the primary
 * display's bottom-right corner.
 */
export function resolveWindowPosition(
  savedPosition: WindowPosition | undefined,
  windowSize: WindowSize,
  displays: readonly DisplayWorkArea[],
  primaryDisplay: DisplayWorkArea,
  margin = DEFAULT_WINDOW_MARGIN,
): WindowPosition {
  if (savedPosition === undefined) {
    return calculateBottomRightPosition(
      primaryDisplay.workArea,
      windowSize,
      margin,
    );
  }

  const targetDisplay = findDisplayWithLargestOverlap(
    savedPosition,
    windowSize,
    displays,
  );

  if (targetDisplay === undefined) {
    return calculateBottomRightPosition(
      primaryDisplay.workArea,
      windowSize,
      margin,
    );
  }

  return ensureMinimumVisiblePosition(
    savedPosition,
    windowSize,
    targetDisplay.workArea,
  );
}

/**
 * Preserves a position while keeping a minimum window length visible per axis.
 */
export function ensureMinimumVisiblePosition(
  position: WindowPosition,
  windowSize: WindowSize,
  workArea: WorkArea,
  minimumVisible = MINIMUM_VISIBLE_WINDOW_SIZE,
): WindowPosition {
  return {
    x: ensureMinimumVisibleAxis(
      position.x,
      windowSize.width,
      workArea.x,
      workArea.width,
      minimumVisible,
    ),
    y: ensureMinimumVisibleAxis(
      position.y,
      windowSize.height,
      workArea.y,
      workArea.height,
      minimumVisible,
    ),
  };
}

function calculateBottomRightAxis(
  workAreaStart: number,
  workAreaLength: number,
  windowLength: number,
  margin: number,
): number {
  if (windowLength >= workAreaLength) {
    return workAreaStart;
  }

  return Math.max(
    workAreaStart,
    workAreaStart + workAreaLength - windowLength - margin,
  );
}

function calculateCenteredAxis(
  workAreaStart: number,
  workAreaLength: number,
  windowLength: number,
): number {
  if (windowLength >= workAreaLength) {
    return workAreaStart;
  }

  return workAreaStart + Math.round((workAreaLength - windowLength) / 2);
}

function findDisplayWithLargestOverlap(
  position: WindowPosition,
  windowSize: WindowSize,
  displays: readonly DisplayWorkArea[],
): DisplayWorkArea | undefined {
  let largestOverlap = 0;
  let targetDisplay: DisplayWorkArea | undefined;

  for (const display of displays) {
    const overlap = calculateIntersectionArea(
      {
        ...position,
        ...windowSize,
      },
      display.workArea,
    );

    if (overlap > largestOverlap) {
      largestOverlap = overlap;
      targetDisplay = display;
    }
  }

  return targetDisplay;
}

function calculateIntersectionArea(first: WorkArea, second: WorkArea): number {
  const width = Math.max(
    0,
    Math.min(first.x + first.width, second.x + second.width) -
      Math.max(first.x, second.x),
  );
  const height = Math.max(
    0,
    Math.min(first.y + first.height, second.y + second.height) -
      Math.max(first.y, second.y),
  );

  return width * height;
}

function ensureMinimumVisibleAxis(
  position: number,
  windowLength: number,
  workAreaStart: number,
  workAreaLength: number,
  minimumVisible: number,
): number {
  const visibleLength = Math.min(
    Math.max(minimumVisible, 0),
    windowLength,
    workAreaLength,
  );
  const minimumPosition = workAreaStart - windowLength + visibleLength;
  const maximumPosition = workAreaStart + workAreaLength - visibleLength;

  return Math.min(Math.max(position, minimumPosition), maximumPosition);
}
