import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CAMERA, SEA, STRIDE, buildGrid, glyphSet, multiply, perspective, pointOnWater, view } from './geometry.ts';

const project = (aspect: number, x: number, y: number, z: number) => {
  const m = multiply(perspective(CAMERA.fov, aspect, 0.1, 200), view(CAMERA.height, CAMERA.pitch));
  const v = [x, y, z, 1];
  const out = [0, 1, 2, 3].map((row) => v.reduce((sum, value, col) => sum + m[col * 4 + row] * value, 0));
  return { nx: out[0] / out[3], ny: out[1] / out[3], w: out[3] };
};

test('sea: a point on the canvas lands on the water where the camera projects it back', () => {
  for (const aspect of [0.5, 1.6, 2.4]) {
    for (const [nx, ny] of [[0, -1], [0.3, -0.6], [-0.9, -0.2], [0.7, 0.05]]) {
      const hit = pointOnWater(nx, ny, aspect);
      assert.ok(hit, `no water under ${nx},${ny}`);
      const back = project(aspect, hit.x, 0, -hit.depth);
      assert.ok(back.w > 0, 'the water is in front of the camera');
      assert.ok(Math.abs(back.nx - nx) < 1e-4 && Math.abs(back.ny - ny) < 1e-4, `${nx},${ny} came back as ${back.nx},${back.ny}`);
    }
  }
});

test('sea: nothing above the horizon lands on the water, and far water sits just under it', () => {
  const horizon = Math.tan((CAMERA.pitch * Math.PI) / 180) / Math.tan((CAMERA.fov * Math.PI) / 360);
  assert.equal(pointOnWater(0, horizon + 0.01, 1.6), null);
  assert.ok(pointOnWater(0, horizon - 0.01, 1.6));
  const far = project(1.6, 0, 0, -SEA.farDepth);
  // The farthest row sits a few percent of the canvas under the horizon, inside the haze.
  assert.ok(far.ny < horizon && far.ny > horizon - 0.08, `far water at ${far.ny}, horizon at ${horizon}`);
});

test('sea: the grid draws far rows first, from real glyphs only', () => {
  const text = 'SigninLogs | where ResultType == 0   detection_model: 00000000';
  const glyphs = glyphSet(text);
  const grid = buildGrid(text, glyphs, 1.6);
  assert.equal(grid.length % STRIDE, 0);
  let lastDepth = Infinity;
  for (let i = 0; i < grid.length; i += STRIDE) {
    const depth = grid[i + 1];
    assert.ok(depth <= lastDepth + 1e-9, 'rows run from far to near');
    lastDepth = depth;
    const glyph = grid[i + 4];
    assert.ok(Number.isInteger(glyph) && glyph >= 0 && glyph < glyphs.chars.length);
    assert.ok(Math.abs(grid[i]) <= grid[i + 2] + 1e-9, 'every glyph starts inside its row');
  }
  assert.ok(!glyphs.chars.includes(' '));
});
