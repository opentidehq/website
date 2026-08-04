/**
 * 2D FLIP fluid (after Matthias Müller / Ten Minute Physics),
 * tuned to match Liquid ASCII-style params (gravity, flip ratio, fill).
 */

const FLUID = 0;
const AIR = 1;
const SOLID = 2;

function clamp(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x));
}

export type FlipFluidOptions = {
  density?: number;
  tankWidth: number;
  tankHeight: number;
  spacing: number;
  particleRadius: number;
  maxParticles: number;
};

export class FlipFluid {
  density: number;
  fNumX: number;
  fNumY: number;
  h: number;
  fInvSpacing: number;
  fNumCells: number;

  u: Float32Array;
  v: Float32Array;
  du: Float32Array;
  dv: Float32Array;
  prevU: Float32Array;
  prevV: Float32Array;
  p: Float32Array;
  s: Float32Array;
  cellType: Int32Array;
  particleDensity: Float32Array;
  particleRestDensity = 0;
  tankWidth: number;
  tankHeight: number;

  maxParticles: number;
  numParticles = 0;
  particlePos: Float32Array;
  particleVel: Float32Array;
  particleRadius: number;

  pInvSpacing: number;
  pNumX: number;
  pNumY: number;
  pNumCells: number;
  numCellParticles: Int32Array;
  firstCellParticle: Int32Array;
  cellParticleIds: Int32Array;

  constructor(opts: FlipFluidOptions) {
    const density = opts.density ?? 1000;
    const { tankWidth: width, tankHeight: height, spacing, particleRadius, maxParticles } = opts;

    this.density = density;
    this.tankWidth = width;
    this.tankHeight = height;
    this.fNumX = Math.floor(width / spacing) + 1;
    this.fNumY = Math.floor(height / spacing) + 1;
    this.h = Math.max(width / this.fNumX, height / this.fNumY);
    this.fInvSpacing = 1 / this.h;
    this.fNumCells = this.fNumX * this.fNumY;

    this.u = new Float32Array(this.fNumCells);
    this.v = new Float32Array(this.fNumCells);
    this.du = new Float32Array(this.fNumCells);
    this.dv = new Float32Array(this.fNumCells);
    this.prevU = new Float32Array(this.fNumCells);
    this.prevV = new Float32Array(this.fNumCells);
    this.p = new Float32Array(this.fNumCells);
    this.s = new Float32Array(this.fNumCells);
    this.cellType = new Int32Array(this.fNumCells);
    this.particleDensity = new Float32Array(this.fNumCells);

    this.maxParticles = maxParticles;
    this.particlePos = new Float32Array(2 * maxParticles);
    this.particleVel = new Float32Array(2 * maxParticles);
    this.particleRadius = particleRadius;

    this.pInvSpacing = 1 / (2.2 * particleRadius);
    this.pNumX = Math.floor(width * this.pInvSpacing) + 1;
    this.pNumY = Math.floor(height * this.pInvSpacing) + 1;
    this.pNumCells = this.pNumX * this.pNumY;
    this.numCellParticles = new Int32Array(this.pNumCells);
    this.firstCellParticle = new Int32Array(this.pNumCells + 1);
    this.cellParticleIds = new Int32Array(maxParticles);
  }

  setupTankSolids() {
    const n = this.fNumY;
    for (let i = 0; i < this.fNumX; i++) {
      for (let j = 0; j < this.fNumY; j++) {
        // Solid floor + walls; open top
        let s = 1;
        if (i === 0 || i === this.fNumX - 1 || j === 0) s = 0;
        this.s[i * n + j] = s;
      }
    }
  }

  fillBottom(fillHeight: number, tankWidth: number, tankHeight: number) {
    const h = this.h;
    const r = this.particleRadius;
    const dx = 2 * r;
    const dy = (Math.sqrt(3) / 2) * dx;
    const waterH = Math.max(h + 2 * r, fillHeight * tankHeight);
    const waterW = tankWidth - 2 * h;

    const numX = Math.max(1, Math.floor((waterW - 2 * r) / dx));
    const numY = Math.max(1, Math.floor((waterH - 2 * r) / dy));
    let p = 0;
    let count = 0;
    for (let i = 0; i < numX && count < this.maxParticles; i++) {
      for (let j = 0; j < numY && count < this.maxParticles; j++) {
        this.particlePos[p++] = h + r + dx * i + (j % 2 === 0 ? 0 : r);
        this.particlePos[p++] = h + r + dy * j;
        count++;
      }
    }
    this.numParticles = count;
    this.particleRestDensity = 0;
  }

  integrateParticles(dt: number, gravity: number) {
    for (let i = 0; i < this.numParticles; i++) {
      this.particleVel[2 * i + 1] += dt * gravity;
      this.particlePos[2 * i] += this.particleVel[2 * i] * dt;
      this.particlePos[2 * i + 1] += this.particleVel[2 * i + 1] * dt;
    }
  }

  pushParticlesApart(numIters: number) {
    this.numCellParticles.fill(0);
    for (let i = 0; i < this.numParticles; i++) {
      const x = this.particlePos[2 * i];
      const y = this.particlePos[2 * i + 1];
      const xi = clamp(Math.floor(x * this.pInvSpacing), 0, this.pNumX - 1);
      const yi = clamp(Math.floor(y * this.pInvSpacing), 0, this.pNumY - 1);
      this.numCellParticles[xi * this.pNumY + yi]++;
    }

    let first = 0;
    for (let i = 0; i < this.pNumCells; i++) {
      first += this.numCellParticles[i];
      this.firstCellParticle[i] = first;
    }
    this.firstCellParticle[this.pNumCells] = first;

    for (let i = 0; i < this.numParticles; i++) {
      const x = this.particlePos[2 * i];
      const y = this.particlePos[2 * i + 1];
      const xi = clamp(Math.floor(x * this.pInvSpacing), 0, this.pNumX - 1);
      const yi = clamp(Math.floor(y * this.pInvSpacing), 0, this.pNumY - 1);
      const cellNr = xi * this.pNumY + yi;
      this.firstCellParticle[cellNr]--;
      this.cellParticleIds[this.firstCellParticle[cellNr]] = i;
    }

    const minDist = 2 * this.particleRadius;
    const minDist2 = minDist * minDist;

    for (let iter = 0; iter < numIters; iter++) {
      for (let i = 0; i < this.numParticles; i++) {
        const px = this.particlePos[2 * i];
        const py = this.particlePos[2 * i + 1];
        const pxi = Math.floor(px * this.pInvSpacing);
        const pyi = Math.floor(py * this.pInvSpacing);
        const x0 = Math.max(pxi - 1, 0);
        const y0 = Math.max(pyi - 1, 0);
        const x1 = Math.min(pxi + 1, this.pNumX - 1);
        const y1 = Math.min(pyi + 1, this.pNumY - 1);

        for (let xi = x0; xi <= x1; xi++) {
          for (let yi = y0; yi <= y1; yi++) {
            const cellNr = xi * this.pNumY + yi;
            const firstId = this.firstCellParticle[cellNr];
            const lastId = this.firstCellParticle[cellNr + 1];
            for (let j = firstId; j < lastId; j++) {
              const id = this.cellParticleIds[j];
              if (id === i) continue;
              const qx = this.particlePos[2 * id];
              const qy = this.particlePos[2 * id + 1];
              const dx = qx - px;
              const dy = qy - py;
              const d2 = dx * dx + dy * dy;
              if (d2 > minDist2 || d2 === 0) continue;
              const d = Math.sqrt(d2);
              const s = (0.5 * (minDist - d)) / d;
              this.particlePos[2 * i] -= dx * s;
              this.particlePos[2 * i + 1] -= dy * s;
              this.particlePos[2 * id] += dx * s;
              this.particlePos[2 * id + 1] += dy * s;
            }
          }
        }
      }
    }
  }

  handleParticleCollisions(
    obstacleX: number,
    obstacleY: number,
    obstacleRadius: number,
    obstacleVelX: number,
    obstacleVelY: number,
  ) {
    const h = this.h;
    const r = this.particleRadius;
    const minDist = obstacleRadius + r;
    const minDist2 = minDist * minDist;
    const minX = h + r;
    const maxX = (this.fNumX - 1) * h - r;
    const minY = h + r;
    const maxY = (this.fNumY - 1) * h - r;

    for (let i = 0; i < this.numParticles; i++) {
      let x = this.particlePos[2 * i];
      let y = this.particlePos[2 * i + 1];

      const dx = x - obstacleX;
      const dy = y - obstacleY;
      const d2 = dx * dx + dy * dy;
      if (d2 < minDist2 && obstacleRadius > 0) {
        this.particleVel[2 * i] = obstacleVelX;
        this.particleVel[2 * i + 1] = obstacleVelY;
      }

      if (x < minX) {
        x = minX;
        this.particleVel[2 * i] = 0;
      }
      if (x > maxX) {
        x = maxX;
        this.particleVel[2 * i] = 0;
      }
      if (y < minY) {
        y = minY;
        this.particleVel[2 * i + 1] = 0;
      }
      if (y > maxY) {
        y = maxY;
        this.particleVel[2 * i + 1] = 0;
      }
      this.particlePos[2 * i] = x;
      this.particlePos[2 * i + 1] = y;
    }
  }

  updateParticleDensity() {
    const n = this.fNumY;
    const h = this.h;
    const h1 = this.fInvSpacing;
    const h2 = 0.5 * h;
    const d = this.particleDensity;
    d.fill(0);

    for (let i = 0; i < this.numParticles; i++) {
      let x = this.particlePos[2 * i];
      let y = this.particlePos[2 * i + 1];
      x = clamp(x, h, (this.fNumX - 1) * h);
      y = clamp(y, h, (this.fNumY - 1) * h);

      const x0 = Math.floor((x - h2) * h1);
      const tx = (x - h2 - x0 * h) * h1;
      const x1 = Math.min(x0 + 1, this.fNumX - 2);
      const y0 = Math.floor((y - h2) * h1);
      const ty = (y - h2 - y0 * h) * h1;
      const y1 = Math.min(y0 + 1, this.fNumY - 2);
      const sx = 1 - tx;
      const sy = 1 - ty;

      if (x0 < this.fNumX && y0 < this.fNumY) d[x0 * n + y0] += sx * sy;
      if (x1 < this.fNumX && y0 < this.fNumY) d[x1 * n + y0] += tx * sy;
      if (x1 < this.fNumX && y1 < this.fNumY) d[x1 * n + y1] += tx * ty;
      if (x0 < this.fNumX && y1 < this.fNumY) d[x0 * n + y1] += sx * ty;
    }

    if (this.particleRestDensity === 0) {
      let sum = 0;
      let numFluidCells = 0;
      for (let i = 0; i < this.fNumCells; i++) {
        if (this.cellType[i] === FLUID) {
          sum += d[i];
          numFluidCells++;
        }
      }
      if (numFluidCells > 0) this.particleRestDensity = sum / numFluidCells;
    }
  }

  transferVelocities(toGrid: boolean, flipRatio = 0.3) {
    const n = this.fNumY;
    const h = this.h;
    const h1 = this.fInvSpacing;
    const h2 = 0.5 * h;

    if (toGrid) {
      this.prevU.set(this.u);
      this.prevV.set(this.v);
      this.du.fill(0);
      this.dv.fill(0);
      this.u.fill(0);
      this.v.fill(0);

      for (let i = 0; i < this.fNumCells; i++) {
        this.cellType[i] = this.s[i] === 0 ? SOLID : AIR;
      }

      for (let i = 0; i < this.numParticles; i++) {
        const x = this.particlePos[2 * i];
        const y = this.particlePos[2 * i + 1];
        const xi = clamp(Math.floor(x * h1), 0, this.fNumX - 1);
        const yi = clamp(Math.floor(y * h1), 0, this.fNumY - 1);
        const cellNr = xi * n + yi;
        if (this.cellType[cellNr] === AIR) this.cellType[cellNr] = FLUID;
      }
    }

    for (let component = 0; component < 2; component++) {
      const dx = component === 0 ? 0 : h2;
      const dy = component === 0 ? h2 : 0;
      const f = component === 0 ? this.u : this.v;
      const prevF = component === 0 ? this.prevU : this.prevV;
      const d = component === 0 ? this.du : this.dv;

      for (let i = 0; i < this.numParticles; i++) {
        let x = this.particlePos[2 * i];
        let y = this.particlePos[2 * i + 1];
        x = clamp(x, h, (this.fNumX - 1) * h);
        y = clamp(y, h, (this.fNumY - 1) * h);

        const x0 = Math.min(Math.floor((x - dx) * h1), this.fNumX - 2);
        const tx = (x - dx - x0 * h) * h1;
        const x1 = Math.min(x0 + 1, this.fNumX - 2);
        const y0 = Math.min(Math.floor((y - dy) * h1), this.fNumY - 2);
        const ty = (y - dy - y0 * h) * h1;
        const y1 = Math.min(y0 + 1, this.fNumY - 2);

        const sx = 1 - tx;
        const sy = 1 - ty;
        const d0 = sx * sy;
        const d1 = tx * sy;
        const d2 = tx * ty;
        const d3 = sx * ty;

        const nr0 = x0 * n + y0;
        const nr1 = x1 * n + y0;
        const nr2 = x1 * n + y1;
        const nr3 = x0 * n + y1;

        if (toGrid) {
          const pv = this.particleVel[2 * i + component];
          f[nr0] += pv * d0;
          d[nr0] += d0;
          f[nr1] += pv * d1;
          d[nr1] += d1;
          f[nr2] += pv * d2;
          d[nr2] += d2;
          f[nr3] += pv * d3;
          d[nr3] += d3;
        } else {
          const offset = component === 0 ? n : 1;
          const valid0 = this.cellType[nr0] !== AIR || this.cellType[nr0 - offset] !== AIR ? 1 : 0;
          const valid1 = this.cellType[nr1] !== AIR || this.cellType[nr1 - offset] !== AIR ? 1 : 0;
          const valid2 = this.cellType[nr2] !== AIR || this.cellType[nr2 - offset] !== AIR ? 1 : 0;
          const valid3 = this.cellType[nr3] !== AIR || this.cellType[nr3 - offset] !== AIR ? 1 : 0;
          const wsum = valid0 * d0 + valid1 * d1 + valid2 * d2 + valid3 * d3;
          if (wsum > 0) {
            const v = this.particleVel[2 * i + component];
            const picV =
              (valid0 * d0 * f[nr0] +
                valid1 * d1 * f[nr1] +
                valid2 * d2 * f[nr2] +
                valid3 * d3 * f[nr3]) /
              wsum;
            const corr =
              (valid0 * d0 * (f[nr0] - prevF[nr0]) +
                valid1 * d1 * (f[nr1] - prevF[nr1]) +
                valid2 * d2 * (f[nr2] - prevF[nr2]) +
                valid3 * d3 * (f[nr3] - prevF[nr3])) /
              wsum;
            const flipV = v + corr;
            this.particleVel[2 * i + component] = (1 - flipRatio) * picV + flipRatio * flipV;
          }
        }
      }

      if (toGrid) {
        for (let i = 0; i < f.length; i++) {
          if (d[i] > 0) f[i] /= d[i];
        }
        for (let i = 0; i < this.fNumX; i++) {
          for (let j = 0; j < this.fNumY; j++) {
            const solid = this.cellType[i * n + j] === SOLID;
            if (solid || (i > 0 && this.cellType[(i - 1) * n + j] === SOLID)) {
              this.u[i * n + j] = this.prevU[i * n + j];
            }
            if (solid || (j > 0 && this.cellType[i * n + j - 1] === SOLID)) {
              this.v[i * n + j] = this.prevV[i * n + j];
            }
          }
        }
      }
    }
  }

  solveIncompressibility(numIters: number, dt: number, overRelaxation: number) {
    this.p.fill(0);
    this.prevU.set(this.u);
    this.prevV.set(this.v);

    const n = this.fNumY;
    const cp = (this.density * this.h) / dt;

    for (let iter = 0; iter < numIters; iter++) {
      for (let i = 1; i < this.fNumX - 1; i++) {
        for (let j = 1; j < this.fNumY - 1; j++) {
          if (this.cellType[i * n + j] !== FLUID) continue;

          const center = i * n + j;
          const left = (i - 1) * n + j;
          const right = (i + 1) * n + j;
          const bottom = i * n + j - 1;
          const top = i * n + j + 1;

          const sx0 = this.s[left];
          const sx1 = this.s[right];
          const sy0 = this.s[bottom];
          const sy1 = this.s[top];
          const s = sx0 + sx1 + sy0 + sy1;
          if (s === 0) continue;

          let div = this.u[right] - this.u[center] + this.v[top] - this.v[center];

          if (this.particleRestDensity > 0) {
            const compression = this.particleDensity[center] - this.particleRestDensity;
            if (compression > 0) div -= compression;
          }

          let p = -div / s;
          p *= overRelaxation;
          this.p[center] += cp * p;
          this.u[center] -= sx0 * p;
          this.u[right] += sx1 * p;
          this.v[center] -= sy0 * p;
          this.v[top] += sy1 * p;
        }
      }
    }
  }

  simulate(
    dt: number,
    gravity: number,
    flipRatio: number,
    pressureIters: number,
    separationIters: number,
    overRelaxation: number,
    obstacleX: number,
    obstacleY: number,
    obstacleRadius: number,
    obstacleVelX: number,
    obstacleVelY: number,
  ) {
    this.integrateParticles(dt, gravity);
    this.pushParticlesApart(separationIters);
    this.handleParticleCollisions(
      obstacleX,
      obstacleY,
      obstacleRadius,
      obstacleVelX,
      obstacleVelY,
    );
    this.transferVelocities(true);
    this.updateParticleDensity();
    this.solveIncompressibility(pressureIters, dt, overRelaxation);
    this.transferVelocities(false, flipRatio);
  }

  /** Sample relative density at normalized tank coords (0..1, 0..1), y up. */
  sampleDensity01(nx: number, ny: number): number {
    const x = clamp(nx, 0, 1) * this.tankWidth;
    const y = clamp(ny, 0, 1) * this.tankHeight;
    const h1 = this.fInvSpacing;
    const xi = clamp(Math.floor(x * h1), 0, this.fNumX - 1);
    const yi = clamp(Math.floor(y * h1), 0, this.fNumY - 1);
    const dens = this.particleDensity[xi * this.fNumY + yi];
    if (this.particleRestDensity <= 0) return dens > 0 ? 1 : 0;
    return clamp(dens / this.particleRestDensity, 0, 2) / 2;
  }
}
