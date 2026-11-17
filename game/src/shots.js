// OYEN DASH — deterministic screenshot modes.
// One clear job: given ?shot=<mode>&seed=<n>, compose one fixed, readable
// frame of the game (title, mid-run, mid-jump, game over) so the screenshots
// the entry hands in are real renders of the game's own code, staged by
// setting state instead of by editing pixels. The main loop freezes the
// simulation in shot mode and repaints the same frame every frame.
import { mulberry32, range } from './random.js';
import { createCat } from './cat.js';
import { GAME } from './config.js';

export function isShotMode() {
  try {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('shot');
    if (!mode) return null;
    return { mode, seed: Number(params.get('seed') || 1) || 1 };
  } catch {
    return null;
  }
}

function fixedClouds(world, rng) {
  world.clouds = [];
  for (let i = 0; i < 7; i += 1) {
    world.clouds.push({
      x: range(rng, 60, world.width - 60),
      y: range(rng, 40, 190),
      scale: range(rng, 0.6, 1.5),
      speed: 10,
    });
  }
}

function placeBox(world, x, width, height) {
  world.obstacles.push({ kind: 'box', x, y: world.groundY - height, width, height, passed: false });
}

function placePuddle(world, x, width) {
  world.obstacles.push({ kind: 'puddle', x, y: world.groundY - 16, width, height: 16, passed: false, wobble: 0.6 });
}

function placeVacuum(world, x) {
  world.obstacles.push({ kind: 'vacuum', x, y: world.groundY - 96, width: 62, height: 96, passed: false });
}

function placeFishArc(world, centerX, baseY) {
  for (let i = 0; i < 3; i += 1) {
    world.fish.push({
      x: centerX - 44 + i * 44,
      y: baseY - Math.sin((i / 2) * Math.PI) * 26,
      taken: false,
      bob: i * 1.1,
    });
  }
}

export function setupShot(state, mode, seed) {
  const rng = mulberry32(seed * 7919 + 13);
  const { world } = state;
  world.obstacles = [];
  world.fish = [];
  world.particles = [];
  fixedClouds(world, rng);

  if (mode === 'menu') {
    state.mode = 'menu';
    state.score = 0;
    state.best = 1240;
    state.fish = 0;
    state.hearts = GAME.baseHearts;
    state.cat = createCat(state.groundY);
    return;
  }

  if (mode === 'run') {
    state.mode = 'playing';
    state.score = 320;
    state.best = 1240;
    state.fish = 6;
    state.hearts = 3;
    state.combo = 4;
    world.distance = 320 * 40;
    world.speed = 330;
    placeBox(world, 700, 58, 58);
    placePuddle(world, 950, 120);
    placeFishArc(world, 729, world.groundY - 150);
    world.fish.push({ x: 560, y: world.groundY - 84, taken: false, bob: 0.4 });
    world.fish.push({ x: 606, y: world.groundY - 84, taken: false, bob: 1.2 });
    state.cat = createCat(state.groundY);
    state.cat.runTime = 1.3;
    return;
  }

  if (mode === 'jump') {
    state.mode = 'playing';
    state.score = 620;
    state.best = 1240;
    state.fish = 11;
    state.hearts = 2;
    state.combo = 2;
    world.distance = 620 * 40;
    world.speed = 430;
    placeVacuum(world, 430);
    placeBox(world, 880, 64, 66);
    placeFishArc(world, 461, world.groundY - 210);
    world.fish.push({ x: 1080, y: world.groundY - 84, taken: false, bob: 0.9 });
    // Oyen, caught mid double-jump directly above the vacuum cleaner.
    state.cat = createCat(state.groundY);
    state.cat.x = 430;
    state.cat.grounded = false;
    state.cat.jumpsUsed = 2;
    state.cat.vy = -320;
    state.cat.y = state.groundY - state.cat.height - 118;
    state.cat.runTime = 2.1;
    return;
  }

  // 'over' (and any unknown mode): the game-over screen, at night.
  state.mode = 'over';
  state.score = 1240;
  state.best = 1240;
  state.fish = 18;
  state.hearts = 0;
  state.combo = 0;
  world.distance = 1240 * 40;
  world.speed = 520;
  placeBox(world, 1020, 58, 60);
  placePuddle(world, 60, 120);
  state.cat = createCat(state.groundY);
  state.cat.runTime = 3.4;
}
