/**
 * The sea's camera and layout, kept free of WebGL so it can be tested: where the camera sits,
 * how a pointer on the canvas lands on the water, and which glyph goes where.
 *
 * World space: x to the right, y up, the camera at height CAMERA.height above the water at
 * x = 0, z = 0, looking down the negative z axis and pitched a few degrees below the horizon.
 * A row's `depth` is its distance along -z.
 */

export const CAMERA = {
  /** Vertical field of view, in degrees. */
  fov: 38,
  /** Low over the water, so the swells loom and the near rows read large. */
  height: 0.9,
  /** Pitch below the horizon, in degrees: puts the horizon about a third of the way down. */
  pitch: 5.5,
} as const;

export const SEA = {
  /** The nearest row sits just below the bottom edge, the farthest in the haze. */
  nearDepth: 1.9,
  farDepth: 60,
  rows: 150,
  /** World height of a glyph sprite on the nearest row; farther rows grow slower than depth. */
  glyph: 0.034,
  growth: 0.36,
  /** Monospace advance as a share of the sprite: glyphs are 0.6em wide in a 0.72em-tall cell. */
  advance: 0.43,
} as const;

export type Mat4 = Float32Array;

const rad = (deg: number) => (deg * Math.PI) / 180;

export function perspective(fovDeg: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(rad(fovDeg) / 2);
  const nf = 1 / (near - far);
  // Column-major, as WebGL expects.
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

/** The camera's view matrix: at (0, height, 0), looking toward -z, pitched down. */
export function view(height: number, pitchDeg: number): Mat4 {
  const c = Math.cos(rad(pitchDeg));
  const s = Math.sin(rad(pitchDeg));
  // The camera's axes in world space: right (1,0,0), up (0,c,-s), back (0,s,c). Each row of
  // the view matrix is one axis dotted with (point - eye), eye = (0, height, 0).
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, -c * height, -s * height, 1]);
}

export function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[k * 4 + row] * b[col * 4 + k];
      out[col * 4 + row] = sum;
    }
  }
  return out;
}

/**
 * Where a point on the canvas lands on the calm water, as (x, depth), or null above the
 * horizon. `nx` and `ny` run from -1 (left, bottom) to 1 (right, top).
 */
export function pointOnWater(nx: number, ny: number, aspect: number): { x: number; depth: number } | null {
  const t = Math.tan(rad(CAMERA.fov) / 2);
  // The ray in camera space, then rotated by the pitch into world space.
  const cx = nx * t * aspect;
  const cy = ny * t;
  const cz = -1;
  const c = Math.cos(rad(CAMERA.pitch));
  const s = Math.sin(rad(CAMERA.pitch));
  const dy = cy * c + cz * s;
  const dz = -cy * s + cz * c;
  if (dy >= -1e-4) return null;
  const k = CAMERA.height / -dy;
  return { x: cx * k, depth: -dz * k };
}

/** The half-width of the visible water at a depth, for a canvas of the given aspect. */
export function halfWidthAt(depth: number, aspect: number) {
  return Math.tan(rad(CAMERA.fov) / 2) * aspect * depth;
}

export type Glyphs = { chars: string; index: Map<string, number> };

/** The distinct characters of the text, each with its cell in the atlas. Spaces are not drawn. */
export function glyphSet(text: string): Glyphs {
  const chars = [...new Set(text.replace(/\s/g, ''))].join('');
  return { chars, index: new Map([...chars].map((ch, i) => [ch, i])) };
}

/** Floats per point: x0, depth, half-extent, speed, glyph, size, seed. */
export const STRIDE = 7;

/**
 * The glyph grid, farthest row first so nearer glyphs draw over farther ones. Each row is a
 * contiguous run of the text, so near rows read as lines of query; it is wide enough to cover
 * the view at its depth, and drifts sideways at its own pace, wrapping out of sight.
 */
export function buildGrid(text: string, glyphs: Glyphs, aspect: number, detail = 1): Float32Array {
  const len = text.length;
  // Fewer rows where the sea is drawn on the CPU.
  const rows = Math.max(24, Math.round(SEA.rows * detail));
  // Each character's cell in the atlas, or -1 for what is not drawn (spaces).
  const cells = Int16Array.from(text, (ch) => glyphs.index.get(ch) ?? -1);
  // Lay the rows out first and count their glyphs, so the grid fills one typed array.
  const layout: { depth: number; size: number; advance: number; count: number; ext: number; seed: number; speed: number; start: number }[] = [];
  let total = 0;
  for (let j = 0; j < rows; j++) {
    const s = j / (rows - 1);
    const depth = SEA.farDepth * Math.pow(SEA.nearDepth / SEA.farDepth, s);
    const size = SEA.glyph * Math.pow(depth / SEA.nearDepth, SEA.growth);
    const advance = SEA.advance * size;
    const half = (halfWidthAt(depth, aspect) + size) * 1.12;
    const count = Math.ceil((2 * half) / advance);
    // A per-row pace between 0.5 and 1.3 glyphs a second, and a start that staggers the text.
    const seed = fract(Math.sin(j * 12.9898) * 43758.5453);
    const start = (j * 97 + Math.floor(seed * len)) % len;
    layout.push({ depth, size, advance, count, ext: (count * advance) / 2, seed, speed: advance * (0.5 + 0.8 * seed), start });
    for (let k = 0; k < count; k++) if (cells[(start + k) % len] >= 0) total++;
  }
  const out = new Float32Array(total * STRIDE);
  let o = 0;
  for (const row of layout) {
    for (let k = 0; k < row.count; k++) {
      const glyph = cells[(row.start + k) % len];
      if (glyph < 0) continue;
      out[o++] = -row.ext + (k + 0.5) * row.advance;
      out[o++] = row.depth;
      out[o++] = row.ext;
      out[o++] = row.speed;
      out[o++] = glyph;
      out[o++] = row.size;
      out[o++] = fract(row.seed * 7.13 + k * 0.618);
    }
  }
  return out;
}

function fract(n: number) {
  return n - Math.floor(n);
}
