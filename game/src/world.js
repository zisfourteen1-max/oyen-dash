// OYEN DASH — the world: spawning and moving obstacles, fish, clouds,
// hills and particles. One clear job: everything that scrolls past Oyen.
import { GAME, OBSTACLES } from './config.js';
import { range, pick } from './random.js';

export function createWorld(width, height, groundY) {
  return {
    width,
    height,
    groundY,
    distance: 0,
    speed: GAME.startSpeed,
    obstacles: [],
    fish: [],
    clouds: [],
    particles: [],
    spawnIn: 420,
    elapsed: 0,
  };
}

export function resetWorld(world) {
  world.distance = 0;
  world.speed = GAME.startSpeed;
  world.obstacles = [];
  world.fish = [];
  world.particles = [];
  world.spawnIn = 500;
  world.elapsed = 0;
  seedClouds(world);
}

export function seedClouds(world) {
  world.clouds = [];
  for (let i = 0; i < 7; i += 1) {
    world.clouds.push({
      x: Math.random() * world.width,
      y: 40 + Math.random() * 150,
      scale: 0.6 + Math.random() * 0.9,
      speed: 8 + Math.random() * 14,
    });
  }
}

function spawnObstacle(world, rng) {
  const kind = pick(rng, ['box', 'box', 'puddle', 'vacuum']);
  const x = world.width + 40;
  if (kind === 'box') {
    const width = range(rng, OBSTACLES.box.minWidth, OBSTACLES.box.maxWidth);
    const height = range(rng, OBSTACLES.box.minHeight, OBSTACLES.box.maxHeight);
    world.obstacles.push({ kind, x, y: world.groundY - height, width, height, passed: false });
  } else if (kind === 'puddle') {
    const width = range(rng, OBSTACLES.puddle.minWidth, OBSTACLES.puddle.maxWidth);
    world.obstacles.push({
      kind, x, y: world.groundY - OBSTACLES.puddle.height,
      width, height: OBSTACLES.puddle.height, passed: false, wobble: rng() * Math.PI * 2,
    });
  } else {
    world.obstacles.push({
      kind, x, y: world.groundY - OBSTACLES.vacuum.height,
      width: OBSTACLES.vacuum.width, height: OBSTACLES.vacuum.height, passed: false,
    });
  }
  // Sometimes a little arc of fish rides above the new obstacle.
  if (rng() < OBSTACLES.fishArcChance) {
    const obstacle = world.obstacles[world.obstacles.length - 1];
    const baseY = obstacle.y - 96;
    for (let i = 0; i < 3; i += 1) {
      world.fish.push({
        x: obstacle.x + obstacle.width / 2 - 44 + i * 44,
        y: baseY - Math.sin((i / 2) * Math.PI) * 26,
        taken: false,
        bob: rng() * Math.PI * 2,
      });
    }
  }
}

function spawnFishLine(world, rng) {
  const count = 3 + Math.floor(rng() * 3);
  const high = rng() < 0.4;
  const y = high ? world.groundY - 190 : world.groundY - 84;
  for (let i = 0; i < count; i += 1) {
    world.fish.push({ x: world.width + 40 + i * 46, y, taken: false, bob: rng() * Math.PI * 2 });
  }
}

export function updateWorld(world, dt, rng) {
  world.elapsed += dt;
  world.speed = Math.min(GAME.maxSpeed, GAME.startSpeed + world.elapsed * GAME.speedRampPerSecond);
  const move = world.speed * dt;
  world.distance += move;

  world.spawnIn -= move;
  if (world.spawnIn <= 0) {
    if (rng() < 0.62) spawnObstacle(world, rng);
    else spawnFishLine(world, rng);
    world.spawnIn = range(rng, OBSTACLES.minGap, OBSTACLES.maxGap);
  }

  for (const obstacle of world.obstacles) {
    obstacle.x -= move;
    if (obstacle.kind === 'puddle') obstacle.wobble += dt * 3;
  }
  world.obstacles = world.obstacles.filter((o) => o.x + o.width > -80);

  for (const fish of world.fish) {
    fish.x -= move;
    fish.bob += dt * 4;
  }
  world.fish = world.fish.filter((f) => !f.taken && f.x > -60);

  for (const cloud of world.clouds) {
    cloud.x -= (cloud.speed + world.speed * 0.08) * dt;
    if (cloud.x < -160) {
      cloud.x = world.width + 120;
      cloud.y = 40 + Math.random() * 150;
    }
  }

  for (const particle of world.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 900 * dt;
    particle.life -= dt;
  }
  world.particles = world.particles.filter((p) => p.life > 0);
}

export function burst(world, x, y, color, count = 14) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 220;
    world.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 120,
      life: 0.5 + Math.random() * 0.4,
      maxLife: 0.9,
      size: 3 + Math.random() * 5,
      color,
    });
  }
}

export function boxesOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
