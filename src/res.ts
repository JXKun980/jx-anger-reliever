const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

/** Render scale: supersample to at least 2x, follow the device up to 2.5x. */
export const RES = Math.min(Math.max(dpr, 2), 2.5);
