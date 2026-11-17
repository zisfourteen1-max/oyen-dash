// OYEN DASH — the cat: physics plus the chubby orange tabby drawing.
// One clear job: how Oyen moves, and what Oyen looks like. The drawing is
// all canvas paths — an original character, no image assets anywhere.
import { CAT, GAME } from './config.js';

export function createCat(groundY) {
  return {
    x: CAT.x,
    y: groundY - CAT.height,
    width: CAT.width,
    height: CAT.height,
    vy: 0,
    jumpsUsed: 0,
    grounded: true,
    runTime: 0,
    squash: 0, // 1 = freshly landed (squashed), decays to 0
    blink: 0, // counts down; the eyes close briefly while it is > 0
    blinkTimer: 2.4,
    invulnerableUntil: 0,
  };
}

export function catHitbox(cat) {
  return {
    x: cat.x + CAT.hitboxInsetX,
    y: cat.y + CAT.hitboxInsetTop,
    width: cat.width - CAT.hitboxInsetX * 2,
    height: cat.height - CAT.hitboxInsetTop - CAT.hitboxInsetBottom,
  };
}

export function tryJump(cat, groundY, now) {
  if (cat.grounded) {
    cat.vy = GAME.jumpVelocity;
    cat.grounded = false;
    cat.jumpsUsed = 1;
    return 'jump';
  }
  if (cat.jumpsUsed < 2) {
    cat.vy = GAME.doubleJumpVelocity;
    cat.jumpsUsed = 2;
    return 'double';
  }
  return null;
}

export function updateCat(cat, dt, groundY, now) {
  cat.runTime += dt;
  cat.squash = Math.max(0, cat.squash - dt * 5);
  cat.blinkTimer -= dt;
  if (cat.blinkTimer <= 0) {
    cat.blink = 0.12;
    cat.blinkTimer = 2.2 + Math.random() * 2.4;
  }
  if (cat.blink > 0) cat.blink -= dt;

  if (!cat.grounded) {
    cat.vy = Math.min(GAME.maxFallSpeed, cat.vy + GAME.gravity * dt);
    cat.y += cat.vy * dt;
    if (cat.y >= groundY - cat.height) {
      cat.y = groundY - cat.height;
      cat.vy = 0;
      cat.grounded = true;
      cat.jumpsUsed = 0;
      cat.squash = 1;
    }
  }
}

// The cat, drawn facing right: round belly, chubby cheeks, pointy ears with
// pink inner ears, orange tabby stripes, a dark collar with a round gold
// tag, and a tail that waves as it runs. Legs pump while grounded.
export function drawCat(ctx, cat, now, invulnerable) {
  const { x, y, width, height } = cat;
  const squashAmount = cat.squash * 0.14;
  const stretch = cat.grounded ? 1 - squashAmount : 1 + Math.min(0.12, Math.abs(cat.vy) / 8000);
  const squashY = cat.grounded ? 1 + squashAmount * 0.6 : 1;

  ctx.save();
  if (invulnerable && Math.floor(now * 12) % 2 === 0) {
    ctx.globalAlpha = 0.45; // hurt blink
  }
  // Anchor at the feet so squash and stretch pivot on the ground.
  ctx.translate(x + width / 2, y + height);
  ctx.scale(1 / stretch > 0 ? (2 - stretch) * 0.5 + 0.5 : 1, squashY * stretch);
  ctx.translate(-(x + width / 2), -(y + height));

  const cx = x + width / 2;
  const cy = y + height / 2;
  const legSwing = cat.grounded ? Math.sin(cat.runTime * 16) * 7 : 4;
  const tailWave = Math.sin(cat.runTime * 6) * 6;

  // Tail (behind the body).
  ctx.strokeStyle = '#e8892a';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 8, y + height - 22);
  ctx.quadraticCurveTo(x - 22, y + height - 34, x - 30, y + height - 52 - tailWave);
  ctx.stroke();
  ctx.strokeStyle = '#c96f14';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(x - 26, y + height - 46 - tailWave * 0.7);
  ctx.lineTo(x - 30, y + height - 52 - tailWave);
  ctx.stroke();

  // Back legs (simple pump while running; tucked while airborne).
  ctx.fillStyle = '#d97b1e';
  const legH = cat.grounded ? 14 : 8;
  ctx.beginPath();
  ctx.ellipse(x + 26, y + height - 6, 12, legH, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 58, y + height - 6 + (cat.grounded ? -legSwing * 0.4 : 0), 12, legH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body: one big round belly.
  ctx.fillStyle = '#f39c2e';
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy + 8, 44, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  // Belly patch.
  ctx.fillStyle = '#ffe3b3';
  ctx.beginPath();
  ctx.ellipse(cx - 2, cy + 16, 26, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  // Back stripes.
  ctx.strokeStyle = '#d97b1e';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    const sx = x + 22 + i * 14;
    ctx.beginPath();
    ctx.moveTo(sx, y + height - 44);
    ctx.quadraticCurveTo(sx + 4, y + height - 30, sx, y + height - 18);
    ctx.stroke();
  }

  // Head: a wide round face with chubby cheeks.
  const hx = x + 62;
  const hy = y + 16;
  // Ears.
  ctx.fillStyle = '#f39c2e';
  ctx.beginPath();
  ctx.moveTo(hx - 18, hy - 6);
  ctx.lineTo(hx - 12, hy - 26);
  ctx.lineTo(hx + 2, hy - 10);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx + 14, hy - 10);
  ctx.lineTo(hx + 26, hy - 26);
  ctx.lineTo(hx + 32, hy - 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffb3a0';
  ctx.beginPath();
  ctx.moveTo(hx - 14, hy - 9);
  ctx.lineTo(hx - 11, hy - 20);
  ctx.lineTo(hx - 3, hy - 10);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx + 18, hy - 11);
  ctx.lineTo(hx + 25, hy - 20);
  ctx.lineTo(hx + 28, hy - 8);
  ctx.closePath();
  ctx.fill();
  // Face.
  ctx.fillStyle = '#f39c2e';
  ctx.beginPath();
  ctx.ellipse(hx + 6, hy + 6, 30, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  // Forehead stripes.
  ctx.strokeStyle = '#d97b1e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(hx - 2, hy - 16);
  ctx.lineTo(hx - 2, hy - 6);
  ctx.moveTo(hx + 8, hy - 18);
  ctx.lineTo(hx + 8, hy - 8);
  ctx.moveTo(hx + 18, hy - 16);
  ctx.lineTo(hx + 18, hy - 6);
  ctx.stroke();
  // Cheeks.
  ctx.fillStyle = 'rgba(255, 150, 120, 0.55)';
  ctx.beginPath();
  ctx.ellipse(hx - 12, hy + 16, 8, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(hx + 24, hy + 16, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eyes: big round amber eyes, closed to a happy line while blinking.
  if (cat.blink > 0) {
    ctx.strokeStyle = '#3a2a12';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(hx - 6, hy + 4, 5, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hx + 18, hy + 4, 5, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#fff8e6';
    ctx.beginPath();
    ctx.ellipse(hx - 6, hy + 4, 7, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(hx + 18, hy + 4, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a4a12';
    ctx.beginPath();
    ctx.arc(hx - 5, hy + 5, 4, 0, Math.PI * 2);
    ctx.arc(hx + 19, hy + 5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(hx - 3.5, hy + 3, 1.6, 0, Math.PI * 2);
    ctx.arc(hx + 20.5, hy + 3, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // Nose and mouth.
  ctx.fillStyle = '#e56b6b';
  ctx.beginPath();
  ctx.moveTo(hx + 8, hy + 14);
  ctx.lineTo(hx + 14, hy + 14);
  ctx.lineTo(hx + 11, hy + 19);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#7a4a12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hx + 11, hy + 19);
  ctx.quadraticCurveTo(hx + 11, hy + 23, hx + 6, hy + 24);
  ctx.moveTo(hx + 11, hy + 19);
  ctx.quadraticCurveTo(hx + 11, hy + 23, hx + 16, hy + 24);
  ctx.stroke();
  // Whiskers.
  ctx.strokeStyle = 'rgba(90, 60, 20, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(hx - 16, hy + 12);
  ctx.lineTo(hx - 34, hy + 8);
  ctx.moveTo(hx - 16, hy + 18);
  ctx.lineTo(hx - 34, hy + 20);
  ctx.moveTo(hx + 30, hy + 12);
  ctx.lineTo(hx + 46, hy + 8);
  ctx.moveTo(hx + 30, hy + 18);
  ctx.lineTo(hx + 46, hy + 20);
  ctx.stroke();

  // Collar with the round gold tag.
  ctx.strokeStyle = '#3f6fb5';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x + 34, y + height - 34);
  ctx.quadraticCurveTo(cx, y + height - 24, x + 78, y + height - 36);
  ctx.stroke();
  ctx.fillStyle = '#ffd94d';
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx + 2, y + height - 20, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
