// OYEN DASH — tuning constants and the day → sunset → night palettes.
// One clear job: every number the game balances on lives here, so tuning
// never means hunting through the simulation or the renderer.
export const GAME = {
  width: 1280,
  height: 720,
  groundHeight: 118,
  gravity: 2500,
  jumpVelocity: -880,
  doubleJumpVelocity: -760,
  maxFallSpeed: 1500,
  startSpeed: 270,
  maxSpeed: 640,
  speedRampPerSecond: 6,
  baseHearts: 3,
  invulnerableSeconds: 1.4,
  fishPoints: 25,
  comboBonusEvery: 5,
  comboBonusPoints: 50,
  scorePerMetre: 1,
};

// The cat never moves horizontally: the world scrolls past a fixed runner.
export const CAT = {
  x: 190,
  width: 96,
  height: 66,
  // Forgiving hitbox: the drawn cat is fluffier than the box that can hurt it.
  hitboxInsetX: 16,
  hitboxInsetTop: 12,
  hitboxInsetBottom: 6,
};

export const OBSTACLES = {
  box: { minWidth: 46, maxWidth: 72, minHeight: 42, maxHeight: 74 },
  puddle: { minWidth: 96, maxWidth: 140, height: 16 },
  vacuum: { width: 62, height: 96 },
  minGap: 330,
  maxGap: 580,
  // A fish arc sometimes rides above an obstacle so a jump earns its keep.
  fishArcChance: 0.45,
};

// Score bands that drive the palette shift. Night never gets fully dark:
// the game must stay readable at a glance, even shrunk to a contact sheet.
export const PHASES = [
  { until: 400, name: 'day' },
  { until: 950, name: 'sunset' },
  { until: Infinity, name: 'night' },
];

export const PALETTES = {
  day: {
    skyTop: '#7ec8f2', skyBottom: '#dff3ff',
    sun: '#ffd94d', sunGlow: 'rgba(255, 217, 77, 0.45)',
    cloud: 'rgba(255, 255, 255, 0.95)',
    hillFar: '#a8d8a0', hillNear: '#7cc47a',
    groundTop: '#f2c14e', ground: '#d99a2b', groundDark: '#b57a1e',
    groundLine: '#8a5c14', text: '#3a2a12', panel: 'rgba(255, 251, 235, 0.94)',
  },
  sunset: {
    skyTop: '#ff9a5c', skyBottom: '#ffd9a0',
    sun: '#ff6b35', sunGlow: 'rgba(255, 107, 53, 0.5)',
    cloud: 'rgba(255, 226, 200, 0.95)',
    hillFar: '#c98a7a', hillNear: '#a86a68',
    groundTop: '#e8a04c', ground: '#c47a2e', groundDark: '#9c5c1e',
    groundLine: '#7a4514', text: '#3a1e10', panel: 'rgba(255, 244, 224, 0.94)',
  },
  night: {
    skyTop: '#1c2b52', skyBottom: '#4a5f8f',
    sun: '#f4f1de', sunGlow: 'rgba(244, 241, 222, 0.35)',
    cloud: 'rgba(190, 205, 235, 0.55)',
    hillFar: '#3d4a6b', hillNear: '#2f3c5c',
    groundTop: '#8a7a5c', ground: '#6b5a3e', groundDark: '#4e3f2a',
    groundLine: '#33261a', text: '#f4ead2', panel: 'rgba(38, 46, 74, 0.94)',
  },
};

export function paletteForScore(score) {
  for (const phase of PHASES) {
    if (score < phase.until) return PALETTES[phase.name];
  }
  return PALETTES.night;
}

export function phaseNameForScore(score) {
  for (const phase of PHASES) {
    if (score < phase.until) return phase.name;
  }
  return 'night';
}
