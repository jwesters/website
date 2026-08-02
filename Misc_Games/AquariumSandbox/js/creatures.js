(function () {
  'use strict';

  const A = window.Aquarium;

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function choice(list) { return list[Math.floor(Math.random() * list.length)]; }

  class CreatureSystem {
    constructor(width, height, cell, grid, cols, rows) {
      this.width = width;
      this.height = height;
      this.cell = cell;
      this.grid = grid;
      this.cols = cols;
      this.rows = rows;
      this.creatures = [];
      this.eggs = [];
      this.deaths = 0;
      this.births = 0;
      this.nextId = 1;
      this.peacefulMode = true;
    }

    names() { return ['Bubbles', 'Pebble', 'Moss', 'Ripple', 'Clover', 'Sunny', 'Kelp', 'Marble', 'Coral', 'Nori', 'Dart', 'Drift', 'Skipper', 'Milo', 'Luna', 'Indigo', 'Ruby', 'Mint', 'Pearl', 'Nova']; }

    presets() {
      return {
        fish: { size: 10, speed: 1.5, colors: ['#ffd05b', '#ff8ea0', '#82dcff', '#a8f191', '#ffb36a'], starvation: 60, dry: 7, adult: 35, lifespan: 160, breed: 20, pop: 36, aquatic: true },
        predatorFish: { size: 13, speed: 1.65, colors: ['#7197ff', '#799ca8', '#9ad3ea'], starvation: 70, dry: 8, adult: 40, lifespan: 175, breed: 24, pop: 14, aquatic: true, predator: true },
        shrimp: { size: 6, speed: 0.8, colors: ['#ff9177', '#ffb29b', '#ff785b'], starvation: 72, dry: 30, adult: 36, lifespan: 150, breed: 18, pop: 30, aquatic: true, bottom: true },
        crab: { size: 12, speed: 0.65, colors: ['#db5949', '#f07c5b', '#cc4d41'], starvation: 82, dry: 45, adult: 44, lifespan: 180, breed: 26, pop: 20, amphibious: true, bottom: true },
        snail: { size: 11, speed: 0.2, colors: ['#d8b971', '#c8aa64', '#e2c88a'], starvation: 110, dry: 60, adult: 54, lifespan: 220, breed: 30, pop: 22, amphibious: true, bottom: true },
        frog: { size: 12, speed: 0.95, colors: ['#72c065', '#7fd177', '#91df6e'], starvation: 90, dry: 50, adult: 30, lifespan: 165, breed: 26, pop: 18, amphibious: true, surfaceWalker: true },
        jellyfish: { size: 10, speed: 0.45, colors: ['#e7caff', '#d9f2ff', '#ffc8ec'], starvation: 95, dry: 7, adult: 38, lifespan: 145, breed: 28, pop: 15, aquatic: true },
        starfish: { size: 9, speed: 0.15, colors: ['#ffbc65', '#ffa14a', '#ffd08b'], starvation: 110, dry: 40, adult: 50, lifespan: 200, breed: 30, pop: 18, bottom: true, amphibious: true }
      };
    }

    makeTraits() {
      return {
        temperament: choice(['calm', 'greedy', 'timid', 'brave']),
        depthPref: choice(['surface', 'mid-water', 'bottom']),
        fertility: 0.7 + Math.random() * 0.8,
        longevity: 0.85 + Math.random() * 0.35
      };
    }

    stageFor(c) {
      if (c.ageSeconds < c.adultAge * 0.25) return 'Baby';
      if (c.ageSeconds < c.adultAge) return 'Juvenile';
      if (c.ageSeconds < c.lifespan * 0.72) return 'Adult';
      return 'Elderly';
    }

    add(type, x, y, options) {
      const preset = this.presets()[type];
      if (!preset) return;
      const traits = options && options.traits ? options.traits : this.makeTraits();
      const adultSize = options && options.adultSize ? options.adultSize : preset.size * (0.85 + Math.random() * 0.35);
      const color = options && options.color ? options.color : choice(preset.colors);
      const ageSeconds = options && typeof options.ageSeconds === 'number' ? options.ageSeconds : 0;
      const babySize = Math.max(4, adultSize * 0.55);
      this.creatures.push({
        id: this.nextId++,
        name: options && options.name ? options.name : choice(this.names()),
        type,
        x, y,
        vx: (Math.random() - 0.5) * preset.speed,
        vy: (Math.random() - 0.5) * preset.speed,
        homeX: x,
        homeY: y,
        color,
        phase: Math.random() * 6.28,
        health: 100,
        hunger: 0,
        dryTime: 0,
        alive: true,
        deathCause: '',
        deadTime: 0,
        ageSeconds,
        adultAge: preset.adult,
        lifespan: preset.lifespan * traits.longevity,
        starvationSeconds: preset.starvation,
        drySeconds: preset.dry,
        breedCooldown: preset.breed * Math.random(),
        baseBreedCooldown: preset.breed,
        generation: options && options.generation ? options.generation : 1,
        parents: options && options.parents ? options.parents : [],
        traits,
        size: babySize + (adultSize - babySize) * clamp(ageSeconds / preset.adult, 0, 1),
        babySize,
        adultSize,
        speed: preset.speed,
        flags: preset,
        scanCooldown: 0,
        foodTarget: null,
        lastCoverage: 0,
        surfaceRestTimer: 0
      });
    }

    reset() {
      this.creatures.length = 0;
      this.eggs.length = 0;
      this.deaths = 0;
      this.births = 0;
      this.nextId = 1;
    }

    getCellTypeAtPx(px, py) {
      const x = clamp(Math.floor(px / this.cell), 0, this.cols - 1);
      const y = clamp(Math.floor(py / this.cell), 0, this.rows - 1);
      return this.grid[y * this.cols + x];
    }

    isWater(type) { return type === A.WATER; }
    isSolid(type) { return type === A.ROCK || type === A.SAND || type === A.GRAVEL || type === A.DIRT || type === A.MUD || A.PLANT_TYPES.includes(type) || A.DECOR_TYPES.includes(type); }
    isCurrent(type) { return false; }

    coverage(c) {
      let water = 0, solidBelow = 0, samples = 0;
      const cx = Math.floor(c.x / this.cell), cy = Math.floor(c.y / this.cell);
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const x = cx + ox, y = cy + oy;
          if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) continue;
          const t = this.grid[y * this.cols + x];
          samples += 1;
          if (t === A.WATER) water += 1;
        }
      }
      const belowT = this.getCellTypeAtPx(c.x, c.y + c.size + 4);
      if (this.isSolid(belowT)) solidBelow = 1;
      return { waterRatio: samples ? water / samples : 0, onSolid: !!solidBelow, belowType: belowT };
    }

    nearestFood(c) {
      const cx = Math.floor(c.x / this.cell), cy = Math.floor(c.y / this.cell);
      let best = null, bestD = Infinity;
      const range = 24;
      for (let y = Math.max(1, cy - range); y <= Math.min(this.rows - 2, cy + range); y += 1) {
        for (let x = Math.max(1, cx - range); x <= Math.min(this.cols - 2, cx + range); x += 1) {
          if (this.grid[y * this.cols + x] !== A.FOOD) continue;
          const px = (x + 0.5) * this.cell;
          const py = (y + 0.5) * this.cell;
          const d = (px - c.x) * (px - c.x) + (py - c.y) * (py - c.y);
          if (d < bestD) { bestD = d; best = { x: px, y: py, index: y * this.cols + x }; }
        }
      }
      return best;
    }

    eatFood(c) {
      if (!c.foodTarget) return;
      const t = c.foodTarget;
      if (this.grid[t.index] !== A.FOOD) { c.foodTarget = null; return; }
      if (Math.hypot(t.x - c.x, t.y - c.y) < c.size + 8) {
        this.grid[t.index] = A.EMPTY;
        c.hunger = Math.max(0, c.hunger - c.starvationSeconds * 0.65);
        c.health = Math.min(100, c.health + 10);
        c.foodTarget = null;
      }
    }

    findAt(px, py) {
      let best = null, dist = Infinity;
      for (const c of this.creatures) {
        const d = Math.hypot(c.x - px, c.y - py);
        if (d <= c.size + 10 && d < dist) { best = c; dist = d; }
      }
      return best;
    }

    kill(c, cause) {
      if (!c.alive) return;
      c.alive = false;
      c.deathCause = cause;
      c.deadTime = 0;
      c.vy = -0.4;
      this.deaths += 1;
    }

    population(type) {
      return this.creatures.filter((c) => c.type === type && c.alive).length + this.eggs.filter((e) => e.type === type).length;
    }

    canBreed(c) {
      if (!c.alive) return false;
      if (this.stageFor(c) !== 'Adult') return false;
      if (c.health < 60 || c.hunger / c.starvationSeconds > 0.35 || c.breedCooldown > 0) return false;
      if (this.population(c.type) >= c.flags.pop) return false;
      if (c.flags.aquatic && c.lastCoverage < 0.5) return false;
      return true;
    }

    maybeBreed(c, dt) {
      if (!this.canBreed(c) || Math.random() > dt * 0.15 * c.traits.fertility) return;
      const mate = this.creatures.find((other) => other !== c && other.type === c.type && this.canBreed(other) && Math.hypot(other.x - c.x, other.y - c.y) < 36);
      if (!mate) return;
      this.eggs.push({
        type: c.type,
        x: (c.x + mate.x) * 0.5,
        y: (c.y + mate.y) * 0.5,
        time: 0,
        hatch: c.baseBreedCooldown * (0.8 + Math.random() * 0.7),
        color: Math.random() < 0.5 ? c.color : mate.color,
        adultSize: clamp((c.adultSize + mate.adultSize) * 0.5 * (0.92 + Math.random() * 0.16), 4, 20),
        parents: [c.name, mate.name],
        generation: Math.max(c.generation, mate.generation) + 1
      });
      c.breedCooldown = c.baseBreedCooldown * (1.1 + Math.random() * 0.6);
      mate.breedCooldown = mate.baseBreedCooldown * (1.1 + Math.random() * 0.6);
      this.births += 1;
    }

    updateEggs(dt) {
      const next = [];
      for (const egg of this.eggs) {
        egg.time += dt;
        const cell = this.getCellTypeAtPx(egg.x, egg.y + 4);
        if (!this.isSolid(cell) && cell !== A.WATER) egg.y += 14 * dt;
        if (egg.time >= egg.hatch) {
          this.add(egg.type, egg.x, egg.y, { color: egg.color, adultSize: egg.adultSize, generation: egg.generation, parents: egg.parents });
        } else next.push(egg);
      }
      this.eggs = next;
    }

    inspectText(c) {
      return '<p><strong>Name:</strong> ' + c.name + '</p>' +
        '<p><strong>Species:</strong> ' + c.type + '</p>' +
        '<p><strong>Life stage:</strong> ' + this.stageFor(c) + '</p>' +
        '<p><strong>Age:</strong> ' + c.ageSeconds.toFixed(1) + '</p>' +
        '<p><strong>Health:</strong> ' + Math.round(c.health) + '%</p>' +
        '<p><strong>Hunger:</strong> ' + Math.round(clamp(c.hunger / c.starvationSeconds, 0, 1) * 100) + '%</p>' +
        '<p><strong>Generation:</strong> ' + c.generation + '</p>' +
        '<p><strong>Parents:</strong> ' + (c.parents.length ? c.parents.join(', ') : 'Unknown / first generation') + '</p>' +
        '<p><strong>Temperament:</strong> ' + c.traits.temperament + '</p>' +
        '<p><strong>Preferred depth:</strong> ' + c.traits.depthPref + '</p>';
    }

    updateDead(c, dt) {
      c.deadTime += dt;
      const cover = this.coverage(c);
      c.vx *= 0.98;
      if (cover.waterRatio > 0.25) c.vy -= 0.14; else c.vy = Math.max(c.vy, this.cell / Math.max(dt, 0.001));
      c.x = clamp(c.x + c.vx * 10 * dt, 8, this.width - 8);
      c.y = clamp(c.y + (cover.waterRatio > 0.25 ? c.vy * dt : this.cell), 8, this.height - 8);
      if (cover.onSolid && c.vy > 0) c.vy = 0;
    }

    findPrey(c) {
      if (this.peacefulMode || !c.flags.predator) return null;
      let best = null, dist = Infinity;
      for (const other of this.creatures) {
        if (other === c || !other.alive) continue;
        if (other.flags.predator) continue;
        if (other.size > c.size) continue;
        const d = Math.hypot(other.x - c.x, other.y - c.y);
        if (d < 120 && d < dist) { dist = d; best = other; }
      }
      return best;
    }

    update(pointer, dt, light) {
      this.updateEggs(dt);
      const safeDt = Math.max(0, Math.min(0.05, dt));
      const night = light < 0.35;
      for (const c of this.creatures) {
        c.ageSeconds += safeDt;
        c.phase += safeDt * 3;
        c.breedCooldown = Math.max(0, c.breedCooldown - safeDt);
        c.size = c.babySize + (c.adultSize - c.babySize) * clamp(c.ageSeconds / c.adultAge, 0, 1);
        if (!c.alive) { this.updateDead(c, safeDt); continue; }

        const cover = this.coverage(c);
        c.lastCoverage = cover.waterRatio;
        c.hunger += safeDt * (night ? 0.9 : 1);
        if (c.flags.aquatic && cover.waterRatio < 0.18) c.dryTime += safeDt; else if (c.flags.amphibious && cover.waterRatio < 0.05 && !cover.onSolid) c.dryTime += safeDt * 0.5; else c.dryTime = Math.max(0, c.dryTime - safeDt * 2);
        if (c.hunger > c.starvationSeconds) c.health -= safeDt * 8;
        if (c.dryTime > c.drySeconds) c.health -= safeDt * 12;
        if (c.ageSeconds > c.lifespan) c.health -= safeDt * 7;
        if (c.health <= 0) { this.kill(c, c.dryTime > c.drySeconds ? 'no water' : (c.ageSeconds > c.lifespan ? 'old age' : 'starvation')); continue; }

        if (pointer && pointer.down) {
          const dx = c.x - pointer.x, dy = c.y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d > 0 && d < 70) { c.vx += dx / d * 0.14; c.vy += dy / d * 0.14; }
        }

        if (c.scanCooldown <= 0) {
          if (c.hunger / c.starvationSeconds > 0.3) c.foodTarget = this.nearestFood(c);
          else c.foodTarget = null;
          c.scanCooldown = 0.4 + Math.random() * 0.8;
        } else c.scanCooldown -= safeDt;

        const prey = this.findPrey(c);
        if (prey) {
          const dx = prey.x - c.x, dy = prey.y - c.y, d = Math.hypot(dx, dy) || 1;
          c.vx += dx / d * 0.07; c.vy += dy / d * 0.05;
          if (d < c.size + prey.size + 4) {
            this.kill(prey, 'predator');
            c.hunger = Math.max(0, c.hunger - c.starvationSeconds * 0.55);
            c.health = Math.min(100, c.health + 12);
          }
        }

        if (c.foodTarget) {
          const dx = c.foodTarget.x - c.x, dy = c.foodTarget.y - c.y, d = Math.hypot(dx, dy) || 1;
          c.vx += dx / d * 0.05; c.vy += dy / d * 0.04;
          this.eatFood(c);
        } else {
          c.vx += Math.sin(c.phase + c.id) * 0.02;
          c.vy += Math.cos(c.phase * 0.7 + c.id) * 0.01;
        }

        if (c.type === 'jellyfish') {
          c.vy -= 0.01;
          for (const other of this.creatures) {
            if (!other.alive || other === c) continue;
            if (Math.hypot(other.x - c.x, other.y - c.y) < c.size + other.size + 6) other.health -= safeDt * 8;
          }
        }

        if (c.flags.bottom) c.vy += cover.waterRatio > 0.2 ? 0.05 : 0.22;

        if (c.type === 'frog') {
          const waterSurfaceY = this.findSurfaceNear(c.x);
          if (cover.waterRatio > 0.35) {
            c.vy -= 0.09;
            c.vx += Math.sin(c.phase) * 0.01;
          } else if (cover.onSolid) {
            c.surfaceRestTimer -= safeDt;
            if (c.surfaceRestTimer <= 0) {
              c.vx += (Math.random() < 0.5 ? -1 : 1) * 0.4;
              c.vy -= 0.55;
              c.surfaceRestTimer = 0.9 + Math.random() * 1.6;
            }
            if (waterSurfaceY && c.y > waterSurfaceY - 30) c.vy -= 0.03;
          } else {
            c.vy += 0.3;
          }
        }

        const airborne = cover.waterRatio < 0.12 && !cover.onSolid;
        if (airborne) {
          c.vx *= 0.9;
          c.vy = Math.max(c.vy, this.cell / safeDt);
        } else if (c.flags.aquatic && cover.waterRatio < 0.18) c.vy += 0.55;
        else if (cover.waterRatio > 0.2) c.vy -= 0.01;

        const maxSpeed = c.speed * Math.max(0.35, 1 - Math.max(0, c.hunger / c.starvationSeconds - 0.7));
        const current = Math.hypot(c.vx, c.vy) || 1;
        if (current > maxSpeed && cover.waterRatio > 0.15) { c.vx = c.vx / current * maxSpeed; c.vy = c.vy / current * maxSpeed; }

        let nx = c.x + c.vx * 10 * safeDt;
        let ny = c.y + c.vy * safeDt;
        if (airborne) ny = c.y + this.cell;
        const nextType = this.getCellTypeAtPx(nx, ny);
        if (cover.onSolid && c.vy > 0) c.vy = 0;
        if (this.isSolid(nextType)) {
          if (this.getCellTypeAtPx(nx, c.y) !== nextType) c.vy *= -0.2;
          else c.vx *= -0.5;
          if (cover.onSolid && c.vy > 0) c.vy = 0;
          nx = c.x + c.vx * 6 * safeDt;
          ny = c.y + c.vy * 6 * safeDt;
        }

        c.x = clamp(nx, 8, this.width - 8);
        c.y = clamp(ny, 8, this.height - 8);
        c.vx *= cover.waterRatio > 0.2 ? 0.98 : 0.93;
        c.vy *= cover.waterRatio > 0.2 ? 0.985 : 0.94;
        this.maybeBreed(c, safeDt);
      }
      this.creatures = this.creatures.filter((c) => c.alive || c.deadTime < 20);
    }

    findSurfaceNear(px) {
      const x = clamp(Math.floor(px / this.cell), 1, this.cols - 2);
      for (let y = 2; y < this.rows - 2; y += 1) {
        const t = this.grid[y * this.cols + x];
        const below = this.grid[(y + 1) * this.cols + x];
        if ((t === A.EMPTY || this.isSolid(t)) && below === A.WATER) return y * this.cell;
      }
      return null;
    }

    explode(px, py, radiusPx) {
      for (const c of this.creatures) {
        const d = Math.hypot(c.x - px, c.y - py);
        if (d < radiusPx * 1.15) this.kill(c, 'explosion');
        else if (d < radiusPx * 2) {
          const dx = c.x - px || 1, dy = c.y - py || 1, mag = Math.hypot(dx, dy);
          c.vx += dx / mag * 2; c.vy += dy / mag * 2;
          c.health -= 20;
        }
      }
      this.eggs = this.eggs.filter((e) => Math.hypot(e.x - px, e.y - py) > radiusPx * 1.1);
    }

    drawEggs(ctx, light) {
      for (const egg of this.eggs) {
        ctx.save();
        ctx.translate(egg.x, egg.y);
        ctx.globalAlpha = 0.55 + 0.45 * light;
        ctx.fillStyle = '#f1f7ff';
        ctx.beginPath(); ctx.arc(0, 0, 3.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = egg.color; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }

    drawNeedBar(ctx, c) {
      if (!c.alive) return;
      const d = Math.max(clamp(c.hunger / c.starvationSeconds, 0, 1), clamp(c.dryTime / c.drySeconds, 0, 1), 1 - c.health / 100);
      if (d < 0.65) return;
      const width = Math.max(16, c.size * 2.4);
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(-width / 2, -c.size - 10, width, 4);
      ctx.fillStyle = c.health < 45 ? '#ff6d6d' : '#f3a94b'; ctx.fillRect(-width / 2 + 1, -c.size - 9, (width - 2) * d, 2);
    }

    drawCreature(ctx, c) {
      if (c.type === 'fish' || c.type === 'predatorFish') {
        ctx.fillStyle = c.color;
        ctx.beginPath(); ctx.ellipse(0, 0, c.size * 1.5, c.size * 0.72, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-c.size * 1.05, 0); ctx.lineTo(-c.size * 1.95, -c.size * 0.78); ctx.lineTo(-c.size * 1.95, c.size * 0.78); ctx.closePath(); ctx.fill();
      } else if (c.type === 'shrimp') {
        ctx.strokeStyle = c.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, c.size, 0, Math.PI * 1.45); ctx.stroke();
      } else if (c.type === 'crab') {
        ctx.fillStyle = c.color;
        ctx.beginPath(); ctx.ellipse(0, 0, c.size * 1.1, c.size * 0.7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = c.color; ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i += 2) {
          ctx.beginPath(); ctx.moveTo(i * 3, c.size * 0.2); ctx.lineTo(i * 5, c.size * 0.8); ctx.moveTo(i * 3, -c.size * 0.1); ctx.lineTo(i * 5, -c.size * 0.7); ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(-c.size * 0.8, -c.size * 0.3); ctx.lineTo(-c.size * 1.5, -c.size * 0.9); ctx.moveTo(c.size * 0.8, -c.size * 0.3); ctx.lineTo(c.size * 1.5, -c.size * 0.9); ctx.stroke();
      } else if (c.type === 'snail') {
        ctx.fillStyle = '#c29f5d'; ctx.beginPath(); ctx.arc(-c.size * 0.1, 0, c.size * 0.9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(0, 0, c.size * 0.55, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#d8c288'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.size * 0.8, -c.size * 0.1); ctx.lineTo(c.size * 1.2, -c.size * 0.6); ctx.moveTo(c.size * 0.95, 0); ctx.lineTo(c.size * 1.35, -c.size * 0.45); ctx.stroke();
      } else if (c.type === 'frog') {
        ctx.fillStyle = c.color; ctx.beginPath(); ctx.ellipse(0, 0, c.size, c.size * 0.75, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#dff8d2'; ctx.beginPath(); ctx.arc(-c.size * 0.35, -c.size * 0.55, c.size * 0.24, 0, Math.PI * 2); ctx.arc(c.size * 0.35, -c.size * 0.55, c.size * 0.24, 0, Math.PI * 2); ctx.fill();
      } else if (c.type === 'jellyfish') {
        ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(0, 0, c.size, Math.PI, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = c.color; ctx.lineWidth = 1.5; for (let k = -2; k <= 2; k += 1) { ctx.beginPath(); ctx.moveTo(k * 3, 0); ctx.lineTo(k * 2, c.size * 1.3); ctx.stroke(); }
      } else if (c.type === 'starfish') {
        ctx.fillStyle = c.color; for (let a = 0; a < 5; a += 1) { ctx.save(); ctx.rotate((Math.PI * 2 / 5) * a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -c.size * 1.2); ctx.lineTo(3, -c.size * 0.2); ctx.closePath(); ctx.fill(); ctx.restore(); }
      }
      ctx.fillStyle = '#081721';
      if (c.alive) { ctx.beginPath(); ctx.arc(c.size * 0.55, -c.size * 0.18, 1.7, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.strokeStyle = '#081721'; ctx.lineWidth = 1.4; const ex = c.size * 0.55, ey = -c.size * 0.18; ctx.beginPath(); ctx.moveTo(ex - 2, ey - 2); ctx.lineTo(ex + 2, ey + 2); ctx.moveTo(ex + 2, ey - 2); ctx.lineTo(ex - 2, ey + 2); ctx.stroke(); }
    }

    draw(ctx, light) {
      this.drawEggs(ctx, light);
      for (const c of this.creatures) {
        ctx.save();
        ctx.translate(c.x, c.y);
        if (c.vx < 0) ctx.scale(-1, 1);
        ctx.globalAlpha = c.alive ? (0.58 + 0.42 * light) : Math.max(0.28, 0.82 - c.deadTime / 24);
        if (!c.alive) { ctx.rotate(Math.PI); ctx.filter = 'grayscale(1)'; }
        this.drawCreature(ctx, c);
        ctx.filter = 'none';
        if (!c.alive && c.deadTime < 6) {
          ctx.scale(c.vx < 0 ? -1 : 1, 1); ctx.rotate(-Math.PI);
          ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = 'rgba(0, 0, 0, .72)'; ctx.fillText(c.deathCause, 1, -c.size - 8); ctx.fillStyle = '#f1f6f8'; ctx.fillText(c.deathCause, 0, -c.size - 9);
        }
        this.drawNeedBar(ctx, c);
        ctx.restore();
      }
    }

    getStats() {
      let alive = 0, dead = 0, hungry = 0, dry = 0, babies = 0;
      for (const c of this.creatures) {
        if (!c.alive) { dead += 1; continue; }
        alive += 1;
        if (c.hunger / c.starvationSeconds > 0.7) hungry += 1;
        if (c.dryTime / c.drySeconds > 0.45) dry += 1;
        if (this.stageFor(c) === 'Baby') babies += 1;
      }
      return { alive, dead, hungry, dry, babies, eggs: this.eggs.length, totalDeaths: this.deaths };
    }

    exportState() {
      return {
        creatures: this.creatures,
        eggs: this.eggs,
        deaths: this.deaths,
        births: this.births,
        nextId: this.nextId,
        peacefulMode: this.peacefulMode
      };
    }

    importState(state) {
      this.creatures = (state.creatures || []).map((c) => Object.assign({}, c));
      for (const c of this.creatures) c.flags = this.presets()[c.type] || c.flags;
      this.eggs = (state.eggs || []).map((e) => Object.assign({}, e));
      this.deaths = state.deaths || 0;
      this.births = state.births || 0;
      this.nextId = state.nextId || 1;
      this.peacefulMode = !(state.peacefulMode === false);
    }
  }

  window.Aquarium = Object.assign(window.Aquarium || {}, { CreatureSystem: CreatureSystem });
}());
