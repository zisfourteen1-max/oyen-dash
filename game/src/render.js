// OYEN DASH — all canvas drawing except the cat itself (cat.js owns Oyen).
// One clear job: paint the world, the HUD and every screen, from state.
import { GAME, paletteForScore, phaseNameForScore } from './config.js';
import { drawCat } from './cat.js';

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawSky(ctx, palette, width, height, phase, now) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, palette.skyTop);
  gradient.addColorStop(1, palette.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Sun by day and sunset, moon by night.
  const sunX = width - 190;
  const sunY = phase === 'night' ? 110 : 120;
  ctx.fillStyle = palette.sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 66, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 44, 0, Math.PI * 2);
  ctx.fill();
  if (phase === 'night') {
    ctx.fillStyle = palette.skyTop;
    ctx.beginPath();
    ctx.arc(sunX + 16, sunY - 8, 38, 0, Math.PI * 2);
    ctx.fill();
    // Stars.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let i = 0; i < 40; i += 1) {
      const sx = (i * 173 + 60) % width;
      const sy = (i * 97 + 30) % 260;
      const twinkle = 0.5 + 0.5 * Math.sin(now * 2 + i);
      ctx.globalAlpha = 0.35 + 0.55 * twinkle;
      ctx.fillRect(sx, sy, 3, 3);
    }
    ctx.globalAlpha = 1;
  }
}

function drawCloud(ctx, palette, cloud) {
  // One soft blob: four heavily overlapping ellipses, filled separately so
  // the silhouette stays rounded instead of stepping down between bumps.
  ctx.fillStyle = palette.cloud;
  const { x, y, scale } = cloud;
  const blobs = [
    [0, 0, 48, 20],
    [-30, 7, 32, 16],
    [30, 7, 32, 16],
    [-6, -11, 28, 14],
  ];
  for (const [dx, dy, rx, ry] of blobs) {
    ctx.beginPath();
    ctx.ellipse(x + dx * scale, y + dy * scale, rx * scale, ry * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHills(ctx, palette, width, groundY, distance) {
  ctx.fillStyle = palette.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (let x = 0; x <= width; x += 40) {
    const y = groundY - 46 - Math.sin((x + distance * 0.25) / 260) * 26;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, groundY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = palette.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (let x = 0; x <= width; x += 40) {
    const y = groundY - 18 - Math.sin((x + distance * 0.55) / 190 + 2) * 14;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, groundY);
  ctx.closePath();
  ctx.fill();
}

function drawGround(ctx, palette, width, height, groundY, distance) {
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, groundY, width, height - groundY);
  ctx.fillStyle = palette.groundTop;
  ctx.fillRect(0, groundY, width, 14);
  ctx.fillStyle = palette.groundLine;
  ctx.fillRect(0, groundY, width, 3);
  ctx.fillStyle = palette.groundDark;
  const spacing = 90;
  const offset = -(distance % spacing);
  for (let x = offset; x < width; x += spacing) {
    ctx.fillRect(x, groundY + 34, 46, 6);
    ctx.fillRect(x + 52, groundY + 72, 30, 6);
  }
  // Little tufts of grass on the surface.
  ctx.strokeStyle = palette.groundDark;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let x = offset + 20; x < width; x += 180) {
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x - 4, groundY - 12);
    ctx.moveTo(x + 6, groundY);
    ctx.lineTo(x + 8, groundY - 14);
    ctx.stroke();
  }
}

function drawBox(ctx, obstacle) {
  const { x, y, width, height } = obstacle;
  ctx.fillStyle = '#c98d4b';
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = '#a86f2e';
  ctx.fillRect(x, y, width, 8);
  ctx.strokeStyle = '#8a5a22';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 1.5, y + 1.5, width - 3, height - 3);
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y + 8);
  ctx.lineTo(x + width / 2, y + height);
  ctx.moveTo(x, y + height / 2);
  ctx.lineTo(x + width, y + height / 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(x + 4, y + 10, width - 8, 5);
}

function drawPuddle(ctx, obstacle) {
  const { x, y, width, height } = obstacle;
  const wobble = Math.sin(obstacle.wobble || 0) * 2;
  ctx.fillStyle = '#4db2e8';
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2 + 3 + wobble * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.beginPath();
  ctx.ellipse(x + width * 0.32, y + height / 2 - 2, width * 0.16, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(x + width * 0.68, y + height / 2 + 2, width * 0.12, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawVacuum(ctx, obstacle) {
  const { x, y, width, height } = obstacle;
  // Body.
  ctx.fillStyle = '#e84c4c';
  roundRect(ctx, x, y + 26, width, height - 26, 10);
  ctx.fill();
  ctx.fillStyle = '#b93232';
  ctx.fillRect(x + 6, y + height - 26, width - 12, 8);
  // Head / dust bin.
  ctx.fillStyle = '#8d99ae';
  roundRect(ctx, x + 8, y + 6, width - 16, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#5c677d';
  ctx.fillRect(x + 12, y + 12, width - 24, 6);
  // Hose curling up.
  ctx.strokeStyle = '#3d405b';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y + 6);
  ctx.quadraticCurveTo(x + width + 16, y - 14, x + width + 2, y - 26);
  ctx.stroke();
  // Angry little eye.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + width / 2, y + 44, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222222';
  ctx.beginPath();
  ctx.arc(x + width / 2 + 2, y + 44, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // Wheels.
  ctx.fillStyle = '#222222';
  ctx.beginPath();
  ctx.arc(x + 12, y + height - 4, 8, 0, Math.PI * 2);
  ctx.arc(x + width - 12, y + height - 4, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawFish(ctx, fish, now) {
  const bobY = Math.sin(fish.bob) * 4;
  const x = fish.x;
  const y = fish.y + bobY;
  ctx.save();
  ctx.translate(x, y);
  // A little sparkle so fish read as pickups, not scenery.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(3, -12);
  ctx.lineTo(11, -12);
  ctx.lineTo(5, -7);
  ctx.lineTo(7, 1);
  ctx.lineTo(0, -4);
  ctx.lineTo(-7, 1);
  ctx.lineTo(-5, -7);
  ctx.lineTo(-11, -12);
  ctx.lineTo(-3, -12);
  ctx.closePath();
  ctx.fill();
  // The fish: silver-blue body, tail, fin, eye.
  ctx.fillStyle = '#7fb8d8';
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-30, -9);
  ctx.lineTo(-30, 9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a93b5';
  ctx.beginPath();
  ctx.moveTo(-2, -10);
  ctx.lineTo(6, -18);
  ctx.lineTo(10, -8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(10, -2, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c2b33';
  ctx.beginPath();
  ctx.arc(11, -2, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHearts(ctx, hearts, maxHearts, x, y, palette) {
  for (let i = 0; i < maxHearts; i += 1) {
    const hx = x + i * 36;
    ctx.save();
    ctx.translate(hx, y);
    ctx.fillStyle = i < hearts ? '#ff5b7a' : 'rgba(120, 120, 120, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(-14, -4, -8, -14, 0, -6);
    ctx.bezierCurveTo(8, -14, 14, -4, 0, 10);
    ctx.fill();
    ctx.restore();
  }
}

export function drawWorld(ctx, state, now) {
  const { world, cat } = state;
  const palette = paletteForScore(state.score);
  const phase = phaseNameForScore(state.score);
  const { width, height, groundY } = world;

  drawSky(ctx, palette, width, height, phase, now);
  for (const cloud of world.clouds) drawCloud(ctx, palette, cloud);
  drawHills(ctx, palette, width, groundY, world.distance);
  drawGround(ctx, palette, width, height, groundY, world.distance);

  for (const obstacle of world.obstacles) {
    if (obstacle.kind === 'box') drawBox(ctx, obstacle);
    else if (obstacle.kind === 'puddle') drawPuddle(ctx, obstacle);
    else drawVacuum(ctx, obstacle);
  }
  for (const fish of world.fish) drawFish(ctx, fish, now);

  drawCat(ctx, cat, now, now < cat.invulnerableUntil);

  for (const particle of world.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawHud(ctx, state) {
  const palette = paletteForScore(state.score);
  const { width } = state.world;
  ctx.save();
  ctx.textBaseline = 'top';

  // Score block, top left.
  ctx.fillStyle = palette.text;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText(`Skor ${Math.floor(state.score)}`, 24, 18);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(`Terbaik ${state.best}`, 24, 58);
  ctx.fillText(`Kecepatan ${Math.round(state.world.speed)}`, 24, 84);

  // Hearts, top left under the numbers.
  drawHearts(ctx, state.hearts, GAME.baseHearts, 30, 128, palette);

  // Fish count, top right, with a combo badge when the streak is hot.
  ctx.textAlign = 'right';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText(`🐟 ${state.fish}`, width - 24, 18);
  if (state.combo >= 3) {
    ctx.fillStyle = '#ff8c1a';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(`Combo x${state.combo}!`, width - 24, 56);
  }
  ctx.textAlign = 'left';

  // Phase banner while it is fresh.
  if (state.bannerUntil > state.now) {
    ctx.globalAlpha = Math.min(1, (state.bannerUntil - state.now) * 2);
    ctx.fillStyle = palette.text;
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const label = state.phase === 'sunset' ? '🌇 Matahari terbenam!' : '🌙 Malam tiba — makin cepat!';
    ctx.fillText(label, width / 2, 120);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function panel(ctx, width, height, palette) {
  ctx.fillStyle = palette.panel;
  roundRect(ctx, width / 2 - 330, 120, 660, height - 240, 28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function hintLine(ctx, text, y, palette, size = 22) {
  ctx.fillStyle = palette.text;
  ctx.font = `${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, 640, y);
  ctx.textAlign = 'left';
}

export function drawMenu(ctx, state) {
  const palette = paletteForScore(0);
  const { width, height } = state.world;
  panel(ctx, width, height, palette);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = palette.text;
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText('🐾 OYEN DASH', width / 2, 168);
  ctx.font = '26px system-ui, sans-serif';
  ctx.fillText('Lari sejauh mungkin, tangkap ikan, hindari rintangan!', width / 2, 252);
  ctx.restore();
  hintLine(ctx, 'SPASI / KLIK / SENTUH — lompat (2x untuk lompat ganda)', 316, palette, 24);
  hintLine(ctx, '📦 Kotak • 💧 Genangan • 🧹 Vacuum — jangan sampai kena!', 356, palette);
  hintLine(ctx, '🐟 Ikan = +25 poin • Combo 5 ikan = +50 bonus', 396, palette);
  hintLine(ctx, 'P = jeda • M = bisu • R = mulai lagi', 436, palette);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8892a';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText('▶  Tekan SPASI untuk mulai', width / 2, 500);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = palette.text;
  ctx.fillText(`Skor terbaik: ${state.best}`, width / 2, 544);
  ctx.restore();
}

export function drawPaused(ctx, state) {
  const palette = paletteForScore(state.score);
  ctx.save();
  ctx.fillStyle = 'rgba(20, 24, 40, 0.45)';
  ctx.fillRect(0, 0, state.world.width, state.world.height);
  ctx.restore();
  panel(ctx, state.world.width, state.world.height, palette);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = palette.text;
  ctx.font = 'bold 56px system-ui, sans-serif';
  ctx.fillText('⏸  Jeda', state.world.width / 2, 220);
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText(`Skor ${Math.floor(state.score)}  •  🐟 ${state.fish}  •  ❤️ ${state.hearts}`, state.world.width / 2, 310);
  ctx.fillText('P / SPASI — lanjut main', state.world.width / 2, 360);
  ctx.restore();
}

export function drawGameOver(ctx, state) {
  const palette = paletteForScore(state.score);
  panel(ctx, state.world.width, state.world.height, palette);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = palette.text;
  ctx.font = 'bold 60px system-ui, sans-serif';
  ctx.fillText('😿  Oyen Kecapekan!', state.world.width / 2, 168);
  ctx.font = '26px system-ui, sans-serif';
  const isBest = state.score >= state.best && state.score > 0;
  ctx.fillText(
    isBest ? '🎉 Skor terbaik baru!' : `Skor terbaik: ${state.best}`,
    state.world.width / 2, 252,
  );
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText(`Skor ${Math.floor(state.score)}`, state.world.width / 2, 306);
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText(
    `🐟 ${state.fish} ikan ditangkap  •  Jarak ${Math.floor(state.world.distance / 50)} m`,
    state.world.width / 2, 372,
  );
  ctx.fillStyle = '#e8892a';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText('Tekan R / SPASI untuk lari lagi', state.world.width / 2, 440);
  ctx.restore();
}
