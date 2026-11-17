// OYEN DASH — the game loop and state machine.
// One clear job: own the state, step the simulation, and hand each frame
// to the renderer. Menu → playing → paused → game over → restart.
import { GAME } from './config.js';
import { createCat, updateCat, tryJump, catHitbox } from './cat.js';
import { createWorld, resetWorld, updateWorld, burst, boxesOverlap, seedClouds } from './world.js';
import { drawWorld, drawHud, drawMenu, drawPaused, drawGameOver } from './render.js';
import { createInput } from './input.js';
import { sfx, unlockAudio, toggleMute, isMuted } from './audio.js';
import { setupShot, isShotMode } from './shots.js';
import { mulberry32 } from './random.js';

const BEST_KEY = 'oyen-dash-best';

function loadBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Best score is a nicety; a blocked localStorage must never break play.
  }
}

export function createState(canvas) {
  const groundY = GAME.height - GAME.groundHeight;
  const world = createWorld(GAME.width, GAME.height, groundY);
  seedClouds(world);
  return {
    canvas,
    mode: 'menu', // menu | playing | paused | over
    world,
    cat: createCat(groundY),
    groundY,
    score: 0,
    bonus: 0,
    best: loadBest(),
    fish: 0,
    hearts: GAME.baseHearts,
    combo: 0,
    comboTimer: 0,
    phase: 'day',
    bannerUntil: -1,
    now: 0,
    frozen: false,
    shotMode: null,
    rng: mulberry32(20261117),
    lastMilestone: 0,
  };
}

function resetRun(state) {
  resetWorld(state.world);
  state.cat = createCat(state.groundY);
  state.score = 0;
  state.bonus = 0;
  state.fish = 0;
  state.hearts = GAME.baseHearts;
  state.combo = 0;
  state.comboTimer = 0;
  state.phase = 'day';
  state.bannerUntil = -1;
  state.lastMilestone = 0;
  state.rng = mulberry32(20261117 + Math.floor(Math.random() * 100000));
}

function startGame(state) {
  unlockAudio();
  resetRun(state);
  state.mode = 'playing';
  sfx.click();
}

function endGame(state) {
  state.mode = 'over';
  const finalScore = Math.floor(state.score);
  if (finalScore > state.best) {
    state.best = finalScore;
    saveBest(finalScore);
  }
  sfx.gameOver();
}

function phaseFor(score) {
  if (score < 400) return 'day';
  if (score < 950) return 'sunset';
  return 'night';
}

function stepPlaying(state, dt) {
  const { world, cat } = state;
  updateWorld(world, dt, state.rng);
  updateCat(cat, dt, state.groundY, state.now);

  // Score is distance plus fish, plus combo bonuses.
  state.score = world.distance / 40 + state.fish * GAME.fishPoints + state.bonus;
  const phase = phaseFor(state.score);
  if (phase !== state.phase) {
    state.phase = phase;
    state.bannerUntil = state.now + 2.5;
    sfx.milestone();
  }

  // Combo streaks decay: 3 seconds without a fish and the streak is gone.
  if (state.combo > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
  }

  const hitbox = catHitbox(cat);
  for (const obstacle of world.obstacles) {
    if (obstacle.passed) continue;
    // Puddles are shallow: only their top strip can hurt, so a low hop clears.
    const hurtBox = obstacle.kind === 'puddle'
      ? { x: obstacle.x + 6, y: obstacle.y, width: obstacle.width - 12, height: 10 }
      : obstacle;
    if (boxesOverlap(hitbox, hurtBox)) {
      obstacle.passed = true;
      obstacle.x = -9999; // gone: one hit per obstacle, never a double tap
      if (state.now >= cat.invulnerableUntil) {
        state.hearts -= 1;
        state.combo = 0;
        cat.invulnerableUntil = state.now + GAME.invulnerableSeconds;
        burst(world, cat.x + cat.width / 2, cat.y + 20, '#ff5b7a', 18);
        sfx.hit();
        if (state.hearts <= 0) {
          endGame(state);
          return;
        }
      }
    }
  }

  for (const fish of world.fish) {
    if (fish.taken) continue;
    const fishBox = { x: fish.x - 20, y: fish.y - 12, width: 40, height: 24 };
    if (boxesOverlap(hitbox, fishBox)) {
      fish.taken = true;
      state.fish += 1;
      state.combo += 1;
      state.comboTimer = 3;
      if (state.combo % GAME.comboBonusEvery === 0) {
        state.bonus += GAME.comboBonusPoints;
      }
      burst(world, fish.x, fish.y, '#ffd94d', 10);
      sfx.fish(state.combo);
    }
  }
}

function render(state) {
  const ctx = state.canvas.getContext('2d');
  drawWorld(ctx, state, state.now);
  if (state.mode === 'playing' || state.mode === 'paused') {
    drawHud(ctx, state);
  }
  if (state.mode === 'menu') drawMenu(ctx, state);
  else if (state.mode === 'paused') drawPaused(ctx, state);
  else if (state.mode === 'over') drawGameOver(ctx, state);
}

function main() {
  const canvas = document.getElementById('game');
  canvas.width = GAME.width;
  canvas.height = GAME.height;
  const state = createState(canvas);
  window.__oyen = state; // for play-testing and debugging from the console

  const shot = isShotMode();
  if (shot) {
    setupShot(state, shot.mode, shot.seed);
    state.shotMode = shot.mode;
    state.frozen = true;
    state.now = 2.0; // a fixed clock: the staged frame is identical every run
    render(state);
    window.__shotReady = true;
    // Keep repainting the same composed frame so a screenshot can never
    // catch a cleared canvas (a resize or a late paint would blank it).
    const repaint = () => {
      render(state);
      requestAnimationFrame(repaint);
    };
    requestAnimationFrame(repaint);
    return;
  }

  const input = createInput(canvas, {
    onJump() {
      unlockAudio();
      if (state.mode === 'menu') startGame(state);
      else if (state.mode === 'over') startGame(state);
      else if (state.mode === 'playing') {
        const result = tryJump(state.cat, state.groundY, state.now);
        if (result === 'jump') sfx.jump();
        else if (result === 'double') sfx.doubleJump();
      }
    },
    onStart() {
      if (state.mode === 'menu' || state.mode === 'over') startGame(state);
      else if (state.mode === 'paused') { state.mode = 'playing'; sfx.click(); }
    },
    onRestart() {
      if (state.mode === 'over' || state.mode === 'paused') startGame(state);
    },
    onPause() {
      if (state.mode === 'playing') { state.mode = 'paused'; sfx.click(); }
      else if (state.mode === 'paused') { state.mode = 'playing'; sfx.click(); }
    },
    onMute() {
      toggleMute();
    },
  });

  let last = performance.now();
  let firstFrame = true;
  function frame(nowMs) {
    const dt = Math.min(0.05, Math.max(0, (nowMs - last) / 1000));
    last = nowMs;
    state.now += dt;
    if (state.mode === 'playing') stepPlaying(state, dt);
    else if (state.mode === 'menu') {
      // The title screen is alive: clouds drift and Oyen idles on the grass.
      state.world.elapsed += dt;
      for (const cloud of state.world.clouds) {
        cloud.x -= cloud.speed * dt;
        if (cloud.x < -160) { cloud.x = state.world.width + 120; cloud.y = 40 + Math.random() * 150; }
      }
      updateCat(state.cat, dt, state.groundY, state.now);
    }
    render(state);
    if (firstFrame) {
      firstFrame = false;
      window.__shotReady = true;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  void input;
  void isMuted;
}

main();
