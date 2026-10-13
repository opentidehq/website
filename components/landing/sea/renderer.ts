import { CAMERA, SEA, STRIDE, buildGrid, glyphSet, multiply, perspective, view, type Glyphs, type Mat4 } from './geometry';

export type Rgb = [number, number, number];

/** Ripples the pointer leaves, and detections that fire on their own: ring buffers of each. */
const RIPPLES = 8;
const PINGS = 4;
const CELL = 64;
const COLS = 16;

const VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec4 aRow;   // x0, depth, half-extent, speed
layout(location = 1) in vec3 aGlyph; // glyph, size, seed

uniform mat4 uViewProj;
uniform float uTime;
uniform float uPointScale;
uniform float uMaxPoint;
uniform float uCols;
uniform vec4 uRipples[${RIPPLES}];
uniform vec4 uPings[${PINGS}];
uniform vec3 uLamp;     // where the pointer is over the water, and how present it is
uniform float uInkAlpha;
uniform float uAspect;

out vec2 vCell;
out float vAlpha;
out float vGlow;

const float NEAR = ${SEA.nearDepth.toFixed(3)};
const float FAR = ${SEA.farDepth.toFixed(3)};

// Swells roll toward the reader: depth grows away from the camera, so +t moves crests nearer.
// Long groundswell, then shorter chop across it.
float swell(vec2 p, float t) {
  float h = 0.0;
  h += 0.095 * sin(dot(p, vec2(0.10, 0.99)) * 0.62 + t * 0.70);
  h += 0.072 * sin(dot(p, vec2(-0.40, 0.92)) * 1.15 + t * 1.00 + 1.7);
  h += 0.038 * sin(dot(p, vec2(0.30, 0.95)) * 2.30 + t * 1.40 + 0.4);
  h += 0.012 * sin(dot(p, vec2(-0.20, 0.98)) * 4.60 + t * 2.05 + 2.2);
  return h;
}

// Light from behind the reader, high up: faces turned toward the camera catch it, the backs of
// the swells fall into shade. That shading is what makes the water read as a surface.
const vec3 LIGHT = vec3(0.18, 0.82, -0.55);

void main() {
  float ext = aRow.z;
  float x = mod(aRow.x + uTime * aRow.w + ext, 2.0 * ext) - ext;
  float depth = aRow.y;
  vec2 p = vec2(x, depth);
  float h = swell(p, uTime);
  // The surface normal from the slope of the swell, in (x, up, depth).
  const float E = 0.08;
  float sx = (swell(p + vec2(E, 0.0), uTime) - swell(p - vec2(E, 0.0), uTime)) / (2.0 * E);
  float sz = (swell(p + vec2(0.0, E), uTime) - swell(p - vec2(0.0, E), uTime)) / (2.0 * E);
  vec3 normal = normalize(vec3(-sx, 1.0, -sz));
  float facing = smoothstep(0.55, 0.98, dot(normal, normalize(LIGHT)));
  float glint = pow(max(dot(reflect(-normalize(LIGHT), normal), normalize(vec3(0.0, 0.35, -1.0))), 0.0), 18.0);
  float crest = smoothstep(-0.05, 0.16, h);
  // The reader rides the swell: the whole sea rises and falls a touch under the camera.
  h -= 0.035 * sin(uTime * 0.31);

  // Pointer ripples: a ring that runs out and fades. Rings widen with depth so they still read
  // where the glyphs are sparse.
  float glow = 0.0;
  for (int i = 0; i < ${RIPPLES}; i++) {
    vec4 r = uRipples[i];
    float age = uTime - r.z;
    if (r.w <= 0.0 || age < 0.0 || age > 4.0) continue;
    float d = distance(p, r.xy);
    float front = age * (0.85 + 0.1 * r.y);
    float ring = exp(-pow((d - front) * 2.6 / (1.0 + 0.1 * r.y), 2.0));
    float env = r.w * exp(-age * 1.05);
    h += env * ring * 0.03 * cos((d - front) * 7.0);
    glow += env * ring * 1.1;
  }

  // Detections: a flash where one lands, and a lit ring running out from it.
  float ping = 0.0;
  for (int i = 0; i < ${PINGS}; i++) {
    vec4 r = uPings[i];
    float age = uTime - r.z;
    if (r.w <= 0.0 || age < 0.0 || age > 5.0) continue;
    float d = distance(p, r.xy);
    float front = age * (0.62 + 0.09 * r.y);
    float width = 0.2 + 0.04 * r.y;
    // A leading edge that trails off inward, so the ring reads as travelling outward.
    float behind = clamp((front - d) / (width * 3.0), 0.0, 1.0);
    float ring = exp(-pow((d - front) / width, 2.0)) + 0.2 * behind * exp(-behind * 3.0);
    float env = r.w * exp(-age * 0.62);
    float core = exp(-pow(d / (0.1 + 0.02 * r.y), 2.0)) * exp(-age * 2.4);
    h += env * ring * 0.018 + core * 0.022;
    ping += env * ring * 1.25 + core * 1.3;
  }

  // The pointer is a lantern over the water: what it passes over lifts and comes into focus.
  float lamp = uLamp.z * exp(-pow(distance(p, uLamp.xy) / (0.5 + 0.06 * depth), 2.0));
  h += lamp * 0.03;

  vec4 clip = uViewProj * vec4(x, h, -depth, 1.0);
  // And rolls with it, a third of a degree either way: the horizon tilts about the centre of
  // the view, in proportional units so it does not shear.
  float roll = 0.006 * sin(uTime * 0.23);
  vec2 q = vec2(clip.x * uAspect, clip.y);
  q = vec2(q.x * cos(roll) - q.y * sin(roll), q.x * sin(roll) + q.y * cos(roll));
  clip.xy = vec2(q.x / uAspect, q.y);
  gl_Position = clip;
  float lit = clamp(glow + ping, 0.0, 1.0);
  gl_PointSize = min(uMaxPoint, aGlyph.y * (1.0 + 0.24 * lit + 0.14 * lamp) * uPointScale / clip.w);

  float g = aGlyph.x;
  vCell = vec2(mod(g, uCols), floor(g / uCols));

  // 0 on the nearest row, 1 at the horizon: haze swallows the far water, and the nearest
  // rows come in softly at the bottom edge.
  float s = log(depth / NEAR) / log(FAR / NEAR);
  // Haze thins the water steadily all the way to the horizon, rather than cutting it off.
  float haze = pow(1.0 - s, 1.35);
  float shore = smoothstep(0.0, 0.04, s);
  float shimmer = 0.88 + 0.12 * sin(uTime * 1.7 + aGlyph.z * 6.2832);
  // Troughs fall dark and lit faces carry the light, in bands that follow the swells away.
  float shade = 0.35 * crest + 0.65 * facing;
  float ink = uInkAlpha * (0.08 + 0.75 * pow(shade, 1.5) + 0.4 * glint) * shimmer + lamp * 0.45;
  vGlow = lit;
  vAlpha = haze * shore * max(ink, lit);
}`;

const FRAG = `#version 300 es
precision mediump float;
uniform sampler2D uAtlas;
uniform vec2 uGrid;
uniform vec3 uInk;
uniform vec3 uGlow;
in vec2 vCell;
in float vAlpha;
in float vGlow;
out vec4 outColor;

void main() {
  float a = texture(uAtlas, (vCell + gl_PointCoord) / uGrid).a * vAlpha;
  if (a < 0.004) discard;
  // The colour turns early and alpha carries the fade: blue to amber through the midtones would
  // pass through brown. Premultiplied, over whatever page sits behind the canvas.
  outColor = vec4(mix(uInk, uGlow, smoothstep(0.04, 0.32, vGlow)) * a, a);
}`;

const UNIFORMS = ['uViewProj', 'uTime', 'uPointScale', 'uMaxPoint', 'uCols', 'uRipples', 'uPings', 'uLamp', 'uInkAlpha', 'uAspect', 'uAtlas', 'uGrid', 'uInk', 'uGlow'];

/**
 * Draws the sea into a canvas with WebGL2. Owns the GL objects; the caller owns time, the
 * pointer and the page's colours. `create` returns null where WebGL2 is not available; the
 * program then links in the background, and nothing draws until `ready()` says it has.
 */
export class SeaRenderer {
  private readonly glyphs: Glyphs;
  /** The view's exact shape, for the camera and the pointer. */
  private aspect = 1;
  /** The shape the grid was last built for: rebuilt only when the view changes shape enough. */
  private gridAspect = 0;
  private viewProj: Mat4 = new Float32Array(16);
  private count = 0;
  private width = 1;
  private height = 1;
  private ink: Rgb = [0, 0.08, 0.54];
  private glow: Rgb = [1, 0.8, 0];
  private inkAlpha = 1;
  private readonly lamp = new Float32Array(3);
  private readonly ripples = new Float32Array(RIPPLES * 4);
  private readonly pings = new Float32Array(PINGS * 4);
  private nextRipple = 0;
  /** Share of the full grid to build: the CPU draws less of it. */
  private detail = 1;
  private nextPing = 0;
  private readonly loc: Record<string, WebGLUniformLocation | null> = {};
  private readonly maxPoint: number;
  /** Set once the program has linked, or failed to. */
  private linked: boolean | undefined;
  private readonly parallel: { COMPLETION_STATUS_KHR: number } | null;
  /** Drawn on the CPU (SwiftShader, llvmpipe): the caller should keep the sea still. */
  readonly software: boolean;

  private constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly program: WebGLProgram,
    private readonly shaders: WebGLShader[],
    private readonly vao: WebGLVertexArrayObject,
    private readonly buffer: WebGLBuffer,
    private readonly atlas: WebGLTexture,
    private readonly text: string,
  ) {
    this.glyphs = glyphSet(text);
    this.parallel = gl.getExtension('KHR_parallel_shader_compile');
    const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array | null;
    this.maxPoint = range ? range[1] : 64;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    this.software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
    if (this.software) this.detail = 0.55;
  }

  static create(canvas: HTMLCanvasElement, text: string): SeaRenderer | null {
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'low-power' });
    if (!gl) return null;
    // Compile and link without asking how it went: the answer would make the page wait for the
    // driver. `ready()` asks once the browser says the work is done.
    const program = gl.createProgram();
    const shaders: WebGLShader[] = [];
    for (const [type, source] of [
      [gl.VERTEX_SHADER, VERT],
      [gl.FRAGMENT_SHADER, FRAG],
    ] as const) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
      shaders.push(shader);
    }
    gl.linkProgram(program);
    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    const atlas = gl.createTexture();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, STRIDE * 4, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, STRIDE * 4, 16);
    gl.bindVertexArray(null);
    return new SeaRenderer(gl, program, shaders, vao, buffer, atlas, text);
  }

  /**
   * Whether the sea can draw: true once the program has linked, false while the browser is
   * still compiling it in the background, null if it failed.
   */
  ready(): boolean | null {
    if (this.linked !== undefined) return this.linked || null;
    const { gl, program } = this;
    if (this.parallel && !gl.getProgramParameter(program, this.parallel.COMPLETION_STATUS_KHR)) return false;
    this.linked = Boolean(gl.getProgramParameter(program, gl.LINK_STATUS));
    if (!this.linked) {
      console.warn('sea program:', gl.getProgramInfoLog(program), ...this.shaders.map((sh) => gl.getShaderInfoLog(sh)));
      return null;
    }
    for (const shader of this.shaders) {
      gl.detachShader(program, shader);
      gl.deleteShader(shader);
    }
    for (const name of UNIFORMS) this.loc[name] = gl.getUniformLocation(program, name);
    return true;
  }

  /** Draws every glyph white into a texture once, in the page's mono face. Call once ready. */
  setFont(family: string) {
    const { gl, glyphs } = this;
    if (!this.linked) return;
    const rows = Math.ceil(glyphs.chars.length / COLS);
    const canvas = document.createElement('canvas');
    canvas.width = COLS * CELL;
    canvas.height = rows * CELL;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `500 ${CELL * 0.7}px ${family}`;
    [...glyphs.chars].forEach((ch, i) => {
      ctx.fillText(ch, (i % COLS) * CELL + CELL / 2, Math.floor(i / COLS) * CELL + CELL * 0.54);
    });
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.useProgram(this.program);
    gl.uniform2f(this.loc.uGrid, COLS, rows);
    gl.uniform1f(this.loc.uCols, COLS);
  }

  /** The sea's ink, the light of a detection, and how strongly the ink shows on this page. */
  setColors(ink: Rgb, glow: Rgb, inkAlpha: number) {
    this.ink = ink;
    this.glow = glow;
    this.inkAlpha = inkAlpha;
  }

  /** Where the pointer is over the water, and how present it is, from 0 to 1. */
  setLamp(x: number, depth: number, strength: number) {
    this.lamp.set([x, depth, strength]);
  }

  /** Sizes the drawing buffer; the grid is rebuilt when the shape of the view changes. */
  resize(width: number, height: number, dpr: number) {
    const { gl } = this;
    this.width = Math.max(1, Math.round(width * dpr));
    this.height = Math.max(1, Math.round(height * dpr));
    gl.canvas.width = this.width;
    gl.canvas.height = this.height;
    this.aspect = width / Math.max(1, height);
    this.viewProj = multiply(perspective(CAMERA.fov, this.aspect, 0.1, 200), view(CAMERA.height, CAMERA.pitch));
    // Rows reach 12% past the edge of the view, so a small change of shape needs no new grid.
    if (Math.abs(this.aspect - this.gridAspect) > 0.04) {
      this.gridAspect = this.aspect;
      const grid = buildGrid(this.text, this.glyphs, this.aspect, this.detail);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, grid, gl.STATIC_DRAW);
      this.count = grid.length / STRIDE;
    }
  }

  get viewAspect() {
    return this.aspect;
  }

  /** A ring from where the pointer touched the water; strength between 0 and 1. */
  addRipple(x: number, depth: number, strength: number, time: number) {
    this.ripples.set([x, depth, time, strength], (this.nextRipple++ % RIPPLES) * 4);
  }

  /** A detection firing at a point on the water. */
  addPing(x: number, depth: number, time: number) {
    this.pings.set([x, depth, time, 1], (this.nextPing++ % PINGS) * 4);
  }

  render(time: number) {
    const { gl, loc } = this;
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!this.linked || !this.count) return;
    gl.useProgram(this.program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    gl.uniformMatrix4fv(loc.uViewProj, false, this.viewProj);
    gl.uniform1f(loc.uTime, time);
    gl.uniform1f(loc.uPointScale, this.height / 2 / Math.tan((CAMERA.fov * Math.PI) / 360));
    gl.uniform1f(loc.uMaxPoint, this.maxPoint);
    gl.uniform4fv(loc.uRipples, this.ripples);
    gl.uniform4fv(loc.uPings, this.pings);
    gl.uniform3fv(loc.uLamp, this.lamp);
    gl.uniform1f(loc.uInkAlpha, this.inkAlpha);
    gl.uniform1f(loc.uAspect, this.aspect);
    gl.uniform3fv(loc.uInk, this.ink);
    gl.uniform3fv(loc.uGlow, this.glow);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    gl.uniform1i(loc.uAtlas, 0);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(null);
  }

  dispose() {
    const { gl } = this;
    if (this.linked === undefined) for (const shader of this.shaders) gl.deleteShader(shader);
    gl.deleteBuffer(this.buffer);
    gl.deleteVertexArray(this.vao);
    gl.deleteTexture(this.atlas);
    gl.deleteProgram(this.program);
  }
}
