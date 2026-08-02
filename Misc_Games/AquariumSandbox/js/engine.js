(function () {
  'use strict';

  const A = window.Aquarium;

  class AquariumEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.cell = 6;
      this.cols = Math.floor(canvas.width / this.cell);
      this.rows = Math.floor(canvas.height / this.cell);
      this.grid = new Uint8Array(this.cols * this.rows);
      this.age = new Uint16Array(this.grid.length);
      this.vx = new Int8Array(this.grid.length);
      this.light = 0.72;
      this.paused = false;
      this.frame = 0;
      this.decorations = [];
      this.nextDecorationId = 1;
      this.reset();
    }

    idx(x, y) { return y * this.cols + x; }
    inBounds(x, y) { return x >= 0 && x < this.cols && y >= 0 && y < this.rows; }
    get(x, y) { return this.grid[this.idx(x, y)]; }
    set(x, y, type) {
      const i = this.idx(x, y);
      this.grid[i] = type;
      this.age[i] = 0;
      this.vx[i] = 0;
    }

    isDeco(type) { return A.DECOR_TYPES.includes(type); }
    isPlant(type) { return A.PLANT_TYPES.includes(type); }
    isGas(type) { return type === A.BUBBLE; }
    isLiquid(type) { return type === A.WATER || type === A.OIL || type === A.LAVA; }
    isPowder(type) { return type === A.SAND || type === A.GRAVEL || type === A.DIRT || type === A.MUD || type === A.FOOD; }
    isHeavy(type) { return type === A.ROCK; }

    isSolidType(type) {
      return type === A.ROCK || type === A.SAND || type === A.GRAVEL || type === A.DIRT || type === A.MUD || this.isPlant(type) || this.isDeco(type);
    }

    clearWorldArrays() {
      this.grid.fill(A.EMPTY);
      this.age.fill(0);
      this.vx.fill(0);
      this.decorations.length = 0;
      this.nextDecorationId = 1;
    }

    reset() {
      this.clearWorldArrays();
      for (let x = 0; x < this.cols; x += 1) this.grid[this.idx(x, this.rows - 1)] = A.ROCK;
      for (let y = 0; y < this.rows; y += 1) {
        this.grid[this.idx(0, y)] = A.ROCK;
        this.grid[this.idx(this.cols - 1, y)] = A.ROCK;
      }

      for (let y = this.rows - 13; y < this.rows - 1; y += 1) {
        for (let x = 1; x < this.cols - 1; x += 1) {
          if (Math.random() < 0.85 - (this.rows - y) * 0.06) this.grid[this.idx(x, y)] = A.SAND;
        }
      }
      this.makeRockHill(24, this.rows - 14, 8);
      this.makeRockHill(Math.floor(this.cols * 0.55), this.rows - 14, 6);
      this.makeRockHill(this.cols - 28, this.rows - 18, 10);

      for (let y = this.rows - 48; y < this.rows - 10; y += 1) {
        for (let x = 2; x < this.cols - 2; x += 1) {
          if (this.grid[this.idx(x, y)] === A.EMPTY) this.grid[this.idx(x, y)] = A.WATER;
        }
      }
      for (let x = 8; x < this.cols - 8; x += 24) this.paint(x, this.rows - 16, A.SEAWEED, 2);
      for (let x = 15; x < this.cols - 15; x += 33) this.paint(x, this.rows - 15, A.ALGAE, 1);
    }

    makeRockHill(cx, cy, r) {
      for (let oy = -r; oy <= r; oy += 1) {
        for (let ox = -r; ox <= r; ox += 1) {
          if (ox * ox + oy * oy <= r * r * (0.7 + Math.random() * 0.3)) {
            const x = cx + ox;
            const y = cy + oy;
            if (this.inBounds(x, y)) this.grid[this.idx(x, y)] = A.ROCK;
          }
        }
      }
    }

    canPlantAt(type, x, y) {
      if (!this.inBounds(x, y) || x === 0 || x === this.cols - 1 || y <= 0 || y >= this.rows - 1) return false;
      const here = this.get(x, y);
      if (!(here === A.EMPTY || here === A.WATER || here === type)) return false;
      const below = this.get(x, y + 1);
      if (type === A.SEAWEED) return below === type || [A.SAND, A.DIRT, A.MUD, A.GRAVEL, A.ROCK].includes(below);
      if (type === A.ALGAE) return below === A.WATER || below === A.ALGAE || this.get(x + 1, y) === A.WATER || this.get(x - 1, y) === A.WATER;
      if (type === A.CORAL) return below === type || [A.ROCK, A.GRAVEL, A.SAND].includes(below);
      if (type === A.MOSS) return [A.ROCK, A.DECOR_DRIFTWOOD, A.DECOR_CASTLE, A.DECOR_SHIP].includes(below) || [A.ROCK, A.DECOR_DRIFTWOOD, A.DECOR_CASTLE, A.DECOR_SHIP].includes(this.get(x - 1, y)) || [A.ROCK, A.DECOR_DRIFTWOOD, A.DECOR_CASTLE, A.DECOR_SHIP].includes(this.get(x + 1, y));
      return false;
    }

    resetAgeAround(x, y, radius) {
      for (let oy = -radius; oy <= radius; oy += 1) {
        for (let ox = -radius; ox <= radius; ox += 1) {
          const nx = x + ox;
          const ny = y + oy;
          if (this.inBounds(nx, ny)) this.age[this.idx(nx, ny)] = 0;
        }
      }
    }

    paint(cx, cy, type, radius) {
      for (let oy = -radius; oy <= radius; oy += 1) {
        for (let ox = -radius; ox <= radius; ox += 1) {
          if (ox * ox + oy * oy > radius * radius) continue;
          const x = cx + ox;
          const y = cy + oy;
          if (!this.inBounds(x, y) || x === 0 || x === this.cols - 1 || y <= 0 || y === this.rows - 1) continue;
          if (type === A.EMPTY) {
            this.eraseAt(x, y);
            continue;
          }
          if (this.isPlant(type)) {
            if (this.canPlantAt(type, x, y)) this.set(x, y, type);
            continue;
          }
          if (type === A.BUBBLE) {
            if (this.get(x, y) === A.WATER || this.get(x, y) === A.EMPTY) this.set(x, y, A.BUBBLE);
            continue;
          }
          if (this.isDeco(this.get(x, y))) this.removeDecorationByCell(x, y);
          this.set(x, y, type);
        }
      }
    }

    removeDecorationByCell(x, y) {
      const type = this.get(x, y);
      if (!this.isDeco(type)) return false;
      const targets = this.decorations.filter((decor) => x >= decor.minX && x <= decor.maxX && y >= decor.minY && y <= decor.maxY && decor.kindType === type);
      for (const decor of targets) this.clearDecoration(decor.id);
      return targets.length > 0;
    }

    clearDecoration(id) {
      const decor = this.decorations.find((item) => item.id === id);
      if (!decor) return;
      for (const point of decor.cells) {
        if (this.inBounds(point.x, point.y) && this.get(point.x, point.y) === decor.kindType) this.set(point.x, point.y, A.EMPTY);
      }
      this.decorations = this.decorations.filter((item) => item.id !== id);
    }

    decorationPattern(kind) {
      if (kind === 'driftwood') {
        return { type: A.DECOR_DRIFTWOOD, cells: [[0,0],[1,0],[2,0],[3,0],[4,1],[5,1],[6,1],[7,2],[8,2],[2,-1],[3,-1],[5,0],[6,0],[4,-1]], w: 9, h: 4 };
      }
      if (kind === 'coralDecor') {
        return { type: A.DECOR_CORAL, cells: [[0,0],[0,-1],[0,-2],[-1,-1],[1,-1],[-2,-2],[2,-2],[-1,-3],[1,-3],[-3,-3],[3,-3]], w: 7, h: 5 };
      }
      if (kind === 'castle') {
        return { type: A.DECOR_CASTLE, cells: [[-5,0],[-4,0],[-3,0],[-2,0],[-1,0],[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[-5,-1],[-4,-1],[-3,-1],[-2,-1],[-1,-1],[0,-1],[1,-1],[2,-1],[3,-1],[4,-1],[5,-1],[-5,-2],[-4,-2],[-3,-2],[-2,-2],[-1,-2],[0,-2],[1,-2],[2,-2],[3,-2],[4,-2],[5,-2],[-4,-3],[-3,-3],[-2,-3],[2,-3],[3,-3],[4,-3],[-4,-4],[-3,-4],[-2,-4],[2,-4],[3,-4],[4,-4],[0,-3],[0,-4]], w: 12, h: 6 };
      }
      return { type: A.DECOR_SHIP, cells: [[-7,0],[-6,0],[-5,0],[-4,0],[-3,0],[-2,0],[-1,0],[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,1],[-6,1],[-5,1],[-4,1],[-3,1],[-2,1],[-1,1],[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[0,-1],[0,-2],[1,-2],[2,-3],[3,-3]], w: 15, h: 6 };
    }

    placeDecoration(kind, cx, cy) {
      const pattern = this.decorationPattern(kind);
      const cells = [];
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const point of pattern.cells) {
        const x = cx + point[0];
        const y = cy + point[1];
        if (!this.inBounds(x, y) || x === 0 || x === this.cols - 1 || y <= 0 || y >= this.rows - 1) continue;
        cells.push({ x, y });
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
      if (!cells.length) return;
      const id = this.nextDecorationId++;
      for (const point of cells) this.set(point.x, point.y, pattern.type);
      this.decorations.push({ id, kind, kindType: pattern.type, cells, minX, maxX, minY, maxY });
    }

    getDecorationAt(x, y) {
      const type = this.get(x, y);
      if (!this.isDeco(type)) return null;
      return this.decorations.find((decor) => x >= decor.minX && x <= decor.maxX && y >= decor.minY && y <= decor.maxY && decor.kindType === type) || null;
    }

    moveDecoration(id, cx, cy) {
      const decor = this.decorations.find((item) => item.id === id);
      if (!decor) return;
      const kind = decor.kind;
      this.clearDecoration(id);
      this.placeDecoration(kind, cx, cy);
    }

    eraseAt(x, y) {
      if (!this.inBounds(x, y)) return;
      if (this.isDeco(this.get(x, y))) {
        this.removeDecorationByCell(x, y);
        return;
      }
      this.set(x, y, A.EMPTY);
    }

    trySwap(x1, y1, x2, y2) {
      if (!this.inBounds(x1, y1) || !this.inBounds(x2, y2)) return false;
      const i1 = this.idx(x1, y1);
      const i2 = this.idx(x2, y2);
      const t1 = this.grid[i1];
      const t2 = this.grid[i2];
      this.grid[i1] = t2; this.grid[i2] = t1;
      const a1 = this.age[i1]; this.age[i1] = this.age[i2]; this.age[i2] = a1;
      const v1 = this.vx[i1]; this.vx[i1] = this.vx[i2]; this.vx[i2] = v1;
      return true;
    }

    fallPowder(x, y, diagonalChance) {
      const i = this.idx(x, y);
      const below = this.idx(x, y + 1);
      const belowType = this.grid[below];
      if (belowType === A.EMPTY || this.isLiquid(belowType) || this.isGas(belowType)) return this.trySwap(x, y, x, y + 1);
      const dirs = Math.random() < 0.5 ? [-1, 1] : [1, -1];
      for (const dx of dirs) {
        const nx = x + dx;
        const ny = y + 1;
        if (!this.inBounds(nx, ny)) continue;
        const t = this.get(nx, ny);
        if (t === A.EMPTY || this.isLiquid(t) || (diagonalChance && this.isGas(t))) return this.trySwap(x, y, nx, ny);
      }
      return false;
    }

    updateFluid(x, y, type) {
      const dirs = Math.random() < 0.5 ? [-1, 1] : [1, -1];
      const belowType = this.get(x, y + 1);
      if (type === A.WATER) {
        if (belowType === A.EMPTY || belowType === A.BUBBLE || belowType === A.OIL) return this.trySwap(x, y, x, y + 1);
      } else if (type === A.OIL) {
        if (belowType === A.EMPTY || belowType === A.BUBBLE || belowType === A.WATER) return this.trySwap(x, y, x, y + 1);
      } else if (type === A.LAVA) {
        if (belowType === A.EMPTY || belowType === A.BUBBLE || belowType === A.WATER || belowType === A.OIL) return this.trySwap(x, y, x, y + 1);
      }
      for (const dx of dirs) {
        const nx = x + dx;
        const ny = y + 1;
        const t = this.get(nx, ny);
        if (type === A.WATER && (t === A.EMPTY || t === A.BUBBLE || t === A.OIL)) return this.trySwap(x, y, nx, ny);
        if (type === A.OIL && (t === A.EMPTY || t === A.BUBBLE || t === A.WATER)) return this.trySwap(x, y, nx, ny);
        if (type === A.LAVA && (t === A.EMPTY || t === A.BUBBLE || t === A.WATER || t === A.OIL)) return this.trySwap(x, y, nx, ny);
      }
      for (const dx of dirs) {
        for (let step = 1; step <= 4; step += 1) {
          const nx = x + dx * step;
          if (!this.inBounds(nx, y)) break;
          const t = this.get(nx, y);
          if (this.isSolidType(t)) break;
          if (type === A.WATER && (t === A.EMPTY || t === A.BUBBLE || t === A.OIL)) return this.trySwap(x, y, nx, y);
          if (type === A.OIL && (t === A.EMPTY || t === A.BUBBLE || t === A.WATER)) return this.trySwap(x, y, nx, y);
          if (type === A.LAVA && (t === A.EMPTY || t === A.BUBBLE || t === A.WATER || t === A.OIL)) return this.trySwap(x, y, nx, y);
        }
      }
      return false;
    }

    updateIce(x, y) {
      const below = this.get(x, y + 1);
      const above = this.get(x, y - 1);
      if (below === A.EMPTY || this.isGas(below)) return this.trySwap(x, y, x, y + 1);
      if (above === A.WATER) return this.trySwap(x, y, x, y - 1);
      if (this.age[this.idx(x, y)] > 600 && Math.random() < 0.004) this.set(x, y, A.WATER);
      for (const offset of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + offset[0], ny = y + offset[1];
        if (this.inBounds(nx, ny) && this.get(nx, ny) === A.LAVA) {
          this.set(x, y, A.WATER);
          break;
        }
      }
    }

    updatePlant(x, y, type) {
      const age = this.age[this.idx(x, y)];
      const below = this.get(x, y + 1);
      if (type === A.SEAWEED) {
        const anchored = below === A.SEAWEED || [A.SAND, A.DIRT, A.MUD, A.GRAVEL, A.ROCK].includes(below);
        if (!anchored) {
          if (below === A.EMPTY || below === A.WATER) this.trySwap(x, y, x, y + 1);
          return;
        }
        if (age > 80 && Math.random() < 0.004 && this.canPlantAt(A.SEAWEED, x, y - 1)) this.set(x, y - 1, A.SEAWEED);
        return;
      }
      if (type === A.ALGAE) {
        if (this.light > 0.35 && age > 90 && Math.random() < 0.005) {
          const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
          const choice = dirs[Math.floor(Math.random() * dirs.length)];
          if (this.canPlantAt(A.ALGAE, x + choice[0], y + choice[1])) this.set(x + choice[0], y + choice[1], A.ALGAE);
        }
        return;
      }
      if (type === A.CORAL) {
        const anchored = below === A.CORAL || [A.ROCK, A.GRAVEL, A.SAND, A.DECOR_CORAL].includes(below);
        if (!anchored) return;
        if (age > 120 && Math.random() < 0.003) {
          const options = [[0,-1],[1,-1],[-1,-1],[1,0],[-1,0]];
          const c = options[Math.floor(Math.random() * options.length)];
          if (this.canPlantAt(A.CORAL, x + c[0], y + c[1])) this.set(x + c[0], y + c[1], A.CORAL);
        }
        return;
      }
      if (type === A.MOSS) {
        const anchored = [A.ROCK, A.DECOR_DRIFTWOOD, A.DECOR_CASTLE, A.DECOR_SHIP].includes(below) || [A.ROCK, A.DECOR_DRIFTWOOD, A.DECOR_CASTLE, A.DECOR_SHIP].includes(this.get(x - 1, y)) || [A.ROCK, A.DECOR_DRIFTWOOD, A.DECOR_CASTLE, A.DECOR_SHIP].includes(this.get(x + 1, y));
        if (!anchored) return;
        if (age > 110 && Math.random() < 0.003) {
          const dirs = [[1,0],[-1,0],[0,-1]];
          const c = dirs[Math.floor(Math.random() * dirs.length)];
          if (this.canPlantAt(A.MOSS, x + c[0], y + c[1])) this.set(x + c[0], y + c[1], A.MOSS);
        }
      }
    }

    updateBubble(x, y) {
      if (y <= 1) { this.set(x, y, A.EMPTY); return true; }
      if (this.get(x, y - 1) === A.EMPTY || this.get(x, y - 1) === A.WATER || this.get(x, y - 1) === A.OIL) return this.trySwap(x, y, x, y - 1);
      const dx = Math.random() < 0.5 ? -1 : 1;
      if (this.inBounds(x + dx, y - 1)) {
        const t = this.get(x + dx, y - 1);
        if (t === A.EMPTY || t === A.WATER || t === A.OIL) return this.trySwap(x, y, x + dx, y - 1);
      }
      if (y <= 2) this.set(x, y, A.EMPTY);
      return false;
    }

    applyHeatCool(cx, cy, radius, cool) {
      for (let oy = -radius; oy <= radius; oy += 1) {
        for (let ox = -radius; ox <= radius; ox += 1) {
          if (ox * ox + oy * oy > radius * radius) continue;
          const x = Math.floor(cx + ox);
          const y = Math.floor(cy + oy);
          if (!this.inBounds(x, y)) continue;
          const t = this.get(x, y);
          if (cool) {
            if (t === A.LAVA) this.set(x, y, A.ROCK);
            else if (t === A.WATER && Math.random() < 0.08) this.set(x, y, A.ICE);
          } else {
            if (t === A.ICE) this.set(x, y, A.WATER);
            else if (t === A.WATER && Math.random() < 0.1) this.set(x, y, A.BUBBLE);
            else if (t === A.SAND && Math.random() < 0.03) this.set(x, y, A.LAVA);
          }
        }
      }
    }

    stir(from, to, radius, liquidOnly) {
      const dx = Math.sign(to.x - from.x);
      const dy = Math.sign(to.y - from.y);
      for (let oy = -radius; oy <= radius; oy += 1) {
        for (let ox = -radius; ox <= radius; ox += 1) {
          if (ox * ox + oy * oy > radius * radius) continue;
          const x = Math.floor(to.x + ox);
          const y = Math.floor(to.y + oy);
          if (!this.inBounds(x, y)) continue;
          const t = this.get(x, y);
          if (t === A.EMPTY) continue;
          if (liquidOnly && !(this.isLiquid(t) || this.isGas(t))) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (!this.inBounds(nx, ny)) continue;
          const nt = this.get(nx, ny);
          if (nt === A.EMPTY || this.isLiquid(nt) || this.isGas(nt)) this.trySwap(x, y, nx, ny);
        }
      }
    }

    drain(cx, cy, radius) {
      for (let oy = -radius; oy <= radius; oy += 1) {
        for (let ox = -radius; ox <= radius; ox += 1) {
          if (ox * ox + oy * oy > radius * radius) continue;
          const x = Math.floor(cx + ox);
          const y = Math.floor(cy + oy);
          if (!this.inBounds(x, y)) continue;
          const t = this.get(x, y);
          if (this.isLiquid(t) || this.isGas(t)) this.set(x, y, A.EMPTY);
        }
      }
    }

    explode(cx, cy, radius) {
      for (let oy = -radius; oy <= radius; oy += 1) {
        for (let ox = -radius; ox <= radius; ox += 1) {
          if (ox * ox + oy * oy > radius * radius) continue;
          const x = Math.floor(cx + ox);
          const y = Math.floor(cy + oy);
          if (!this.inBounds(x, y) || x === 0 || y === 0 || x === this.cols - 1 || y === this.rows - 1) continue;
          if (Math.random() < 0.8) this.eraseAt(x, y);
        }
      }
    }

    updateDecorations() {
      for (const decor of this.decorations) {
        let canFall = true;
        for (const point of decor.cells) {
          const x = point.x;
          const y = point.y;
          if (y >= this.rows - 2) { canFall = false; break; }
          const hasOwnCellBelow = decor.cells.some((other) => other.x === x && other.y === y + 1);
          if (hasOwnCellBelow) continue;
          const below = this.get(x, y + 1);
          if (!(below === A.EMPTY || below === A.WATER || below === A.OIL || below === A.BUBBLE)) {
            canFall = false;
            break;
          }
        }
        if (!canFall) continue;
        for (const point of decor.cells) this.set(point.x, point.y, A.EMPTY);
        for (const point of decor.cells) point.y += 1;
        decor.minY += 1;
        decor.maxY += 1;
        for (const point of decor.cells) this.set(point.x, point.y, decor.kindType);
      }
    }

    stepOnce() {
      this.updateDecorations();
      for (let y = this.rows - 2; y > 0; y -= 1) {
        const leftToRight = (this.frame + y) % 2 === 0;
        if (leftToRight) {
          for (let x = 1; x < this.cols - 1; x += 1) this.updateCell(x, y);
        } else {
          for (let x = this.cols - 2; x > 0; x -= 1) this.updateCell(x, y);
        }
      }
      this.frame += 1;
    }

    updateCell(x, y) {
      const i = this.idx(x, y);
      const type = this.grid[i];
      if (type === A.EMPTY || this.isDeco(type)) return;
      this.age[i] += 1;
      if (this.isHeavy(type)) { this.fallPowder(x, y, true); return; }
      if (this.isPowder(type)) { this.fallPowder(x, y, true); return; }
      if (this.isLiquid(type)) {
        if (type === A.LAVA) {
          for (const o of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nx = x + o[0], ny = y + o[1];
            if (!this.inBounds(nx, ny)) continue;
            const t = this.get(nx, ny);
            if (t === A.WATER || t === A.OIL || t === A.ICE) {
              this.set(nx, ny, A.BUBBLE);
              this.set(x, y, A.ROCK);
              return;
            }
            if (this.isPlant(t) && Math.random() < 0.15) this.set(nx, ny, A.BUBBLE);
          }
        }
        this.updateFluid(x, y, type);
        return;
      }
      if (type === A.ICE) { this.updateIce(x, y); return; }
      if (this.isPlant(type)) { this.updatePlant(x, y, type); return; }
      if (type === A.BUBBLE) { this.updateBubble(x, y); return; }
    }

    step(iterations) {
      if (this.paused) return;
      for (let k = 0; k < iterations; k += 1) this.stepOnce();
    }

    renderDecoration(ctx, decor) {
      const s = this.cell;
      const x = decor.minX * s;
      const y = decor.minY * s;
      const w = (decor.maxX - decor.minX + 1) * s;
      const h = (decor.maxY - decor.minY + 1) * s;
      ctx.save();
      ctx.translate(x, y);
      if (decor.kind === 'driftwood') {
        ctx.fillStyle = '#7b5632';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.7); ctx.quadraticCurveTo(w * 0.35, h * 0.15, w * 0.9, h * 0.55); ctx.lineTo(w * 0.9, h * 0.8); ctx.quadraticCurveTo(w * 0.35, h * 0.4, 0, h * 0.88); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#9a7043'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w * 0.2, h * 0.65); ctx.lineTo(w * 0.85, h * 0.52); ctx.stroke();
      } else if (decor.kind === 'coralDecor') {
        ctx.strokeStyle = '#ff8d78'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(w * 0.5, h); ctx.lineTo(w * 0.5, h * 0.35); ctx.moveTo(w * 0.5, h * 0.55); ctx.lineTo(w * 0.25, h * 0.2); ctx.moveTo(w * 0.5, h * 0.55); ctx.lineTo(w * 0.75, h * 0.2); ctx.moveTo(w * 0.5, h * 0.35); ctx.lineTo(w * 0.15, h * 0.05); ctx.moveTo(w * 0.5, h * 0.35); ctx.lineTo(w * 0.86, h * 0.05); ctx.stroke();
      } else if (decor.kind === 'castle') {
        ctx.fillStyle = '#aeb8c4'; ctx.fillRect(0, h * 0.25, w, h * 0.75); ctx.fillRect(w * 0.1, 0, w * 0.22, h * 0.38); ctx.fillRect(w * 0.68, 0, w * 0.22, h * 0.38); ctx.fillRect(w * 0.42, h * 0.18, w * 0.16, h * 0.2);
        ctx.fillStyle = '#5f7287'; ctx.fillRect(w * 0.44, h * 0.6, w * 0.12, h * 0.4); ctx.fillRect(w * 0.2, h * 0.47, w * 0.1, h * 0.12); ctx.fillRect(w * 0.7, h * 0.47, w * 0.1, h * 0.12);
      } else if (decor.kind === 'ship') {
        ctx.fillStyle = '#735437'; ctx.beginPath(); ctx.moveTo(0, h * 0.6); ctx.quadraticCurveTo(w * 0.15, h * 0.9, w * 0.92, h * 0.72); ctx.lineTo(w * 0.84, h); ctx.lineTo(w * 0.1, h); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#8ca0b6'; ctx.fillRect(w * 0.43, h * 0.1, w * 0.04, h * 0.52); ctx.beginPath(); ctx.moveTo(w * 0.47, h * 0.14); ctx.lineTo(w * 0.73, h * 0.3); ctx.lineTo(w * 0.47, h * 0.46); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    render() {
      const ctx = this.ctx;
      const width = this.canvas.width;
      const height = this.canvas.height;
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgb(' + (9 + Math.floor(23 * this.light)) + ',' + (34 + Math.floor(57 * this.light)) + ',' + (51 + Math.floor(72 * this.light)) + ')');
      gradient.addColorStop(1, '#020d13');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.globalAlpha = 0.11 * this.light;
      ctx.fillStyle = '#e1f9ff';
      for (let x = 30; x < width; x += 150) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 80, height); ctx.lineTo(x + 130, height); ctx.lineTo(x + 45, 0); ctx.fill();
      }
      ctx.globalAlpha = 1;

      let count = 0;
      for (let y = 0; y < this.rows; y += 1) {
        for (let x = 0; x < this.cols; x += 1) {
          const type = this.get(x, y);
          if (type === A.EMPTY || this.isDeco(type)) continue;
          count += 1;
          ctx.fillStyle = A.colorFor(type, x, y);
          ctx.fillRect(x * this.cell, y * this.cell, this.cell, this.cell);
          if (type === A.BUBBLE) {
            ctx.strokeStyle = 'rgba(255,255,255,.72)';
            ctx.strokeRect(x * this.cell + 1, y * this.cell + 1, this.cell - 2, this.cell - 2);
          }
        }
      }
      for (const decor of this.decorations) this.renderDecoration(ctx, decor);
      ctx.strokeStyle = 'rgba(213,246,255,.3)';
      ctx.lineWidth = 3;
      ctx.strokeRect(1, 1, width - 2, height - 2);
      return count;
    }

    exportState() {
      return {
        cols: this.cols,
        rows: this.rows,
        cell: this.cell,
        light: this.light,
        grid: Array.from(this.grid),
        age: Array.from(this.age),
        vx: Array.from(this.vx),
        decorations: this.decorations.map((d) => ({ id: d.id, kind: d.kind, kindType: d.kindType, minX: d.minX, maxX: d.maxX, minY: d.minY, maxY: d.maxY, cells: d.cells })),
        nextDecorationId: this.nextDecorationId
      };
    }

    importState(state) {
      if (!state || state.cols !== this.cols || state.rows !== this.rows || state.cell !== this.cell) throw new Error('This save file does not match the aquarium size.');
      this.light = typeof state.light === 'number' ? state.light : this.light;
      this.grid.set(state.grid);
      this.age.set(state.age || new Array(this.grid.length).fill(0));
      this.vx.set(state.vx || new Array(this.grid.length).fill(0));
      this.decorations = (state.decorations || []).map((d) => ({ id: d.id, kind: d.kind, kindType: d.kindType, minX: d.minX, maxX: d.maxX, minY: d.minY, maxY: d.maxY, cells: d.cells }));
      this.nextDecorationId = state.nextDecorationId || 1;
    }
  }

  window.Aquarium = Object.assign(window.Aquarium || {}, { AquariumEngine: AquariumEngine });
}());
