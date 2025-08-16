/* ============================ Setup ============================ */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 240;
canvas.height = 360;
ctx.imageSmoothingEnabled = false;

/* ---------------------------- Config --------------------------- */
const CFG = {
  gravity: 0.34,
  jump: -7.0,                 // stronger to handle bigger gaps
  speed: 2.3,
  boostImpulse: -3.6,         // one mid-air boost (↑/W)
  startY: canvas.height - 38,

  platformW: 44,              // narrower -> more precision
  platformH: 8,

  // vertical gap range (harder than fixed)
  gapMin: 52,
  gapMax: 64,

  // horizontal reach limits between consecutive platforms
  reachMin: 18,
  reachMax: 28,
};

/* ---------------------------- State ---------------------------- */
const keys = {};
let platforms = [];
let started = false;
let score = 0, best = 0;
let lastTime = 0;
let bgOffset = 0;

const player = { x: 0, y: 0, w: 24, h: 24, vy: 0, prevY: 0 };

/* scoring / spawn helpers */
let platformIdSeq = 0;
let lastLandedId = null;
let lastSpawnX = 0;

/* boost */
let boostCharges = 1;

/* ============================ Input ============================ */
addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;

  if (!started && (k === "arrowleft" || k === "a" || k === "arrowright" || k === "d")) {
    started = true;
  }

  // one mid-air boost per airtime
  if (started && (k === "arrowup" || k === "w")) {
    if (boostCharges > 0) {
      player.vy += CFG.boostImpulse;
      boostCharges -= 1;
    }
  }
});
addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

/* ====================== Pixel Background ======================= */
const stars = [];

function initStars() {
  stars.length = 0;
  for (let i = 0; i < 90; i++) {
    stars.push({
      x: Math.floor(Math.random() * canvas.width),
      y: Math.floor(Math.random() * canvas.height),
      size: Math.random() < 0.7 ? 1 : 2,
      color: ["#fff", "#ffd27f", "#a4d8ff", "#ff9ff3"][Math.floor(Math.random() * 4)],
      phase: Math.random() * Math.PI * 2
    });
  }
}

function drawBackground(tMs) {
  const t = tMs / 1000;

  // Nebula-style pixel blocks
  for (let i = 0; i < 60; i++) {
    const nx = ((i * 40 + (t * 10) + bgOffset * 0.2) % canvas.width + canvas.width) % canvas.width;
    const ny = ((i * 25 + (t * 5) + bgOffset * 0.35) % canvas.height + canvas.height) % canvas.height;
    ctx.fillStyle = ["#120030", "#1a004f", "#240061", "#310072"][i % 4];
    ctx.fillRect(nx, ny, 20, 20);
  }

  // Stars with twinkle effect
  for (const s of stars) {
    const tw = 0.7 + 0.3 * Math.abs(Math.sin(t * 2 + s.phase));
    ctx.globalAlpha = tw;
    ctx.fillStyle = s.color;
    const sy = (s.y + bgOffset * 0.5) % canvas.height;
    if (s.size === 2) {
      ctx.fillRect(s.x, sy, 1, 1);
      ctx.fillRect(s.x - 1, sy, 1, 1);
      ctx.fillRect(s.x + 1, sy, 1, 1);
      ctx.fillRect(s.x, sy - 1, 1, 1);
      ctx.fillRect(s.x, sy + 1, 1, 1);
    } else {
      ctx.fillRect(s.x, sy, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  // subtle scanlines overlay
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = "#000";
  for (let y = 0; y < canvas.height; y += 2) ctx.fillRect(0, y, canvas.width, 1);
  ctx.globalAlpha = 1;
}

/* ============================ Utils ============================ */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

/* ========================== Platforms ========================== */
function makePlatform(x, y) {
  return { id: platformIdSeq++, x, y, w: CFG.platformW, h: CFG.platformH };
}
function nextGap() { return randInt(CFG.gapMin, CFG.gapMax); }
function nextReachableX(prevX) {
  let dx = randInt(CFG.reachMin, CFG.reachMax) * (Math.random() < 0.5 ? -1 : 1);
  return clamp(prevX + dx, 0, canvas.width - CFG.platformW);
}

function initPlatforms() {
  platforms.length = 0;

  const startX = Math.floor(canvas.width / 2 - CFG.platformW / 2);
  platforms.push(makePlatform(startX, CFG.startY));
  lastSpawnX = startX;

  let y = CFG.startY - nextGap();
  while (y > -CFG.platformH) {
    const x = nextReachableX(lastSpawnX);
    platforms.push(makePlatform(x, y));
    lastSpawnX = x;
    y -= nextGap();
  }

  boostCharges = 1;
  lastLandedId = null;
}

function addPlatformAboveTop() {
  const topY = platforms.reduce((m, p) => Math.min(m, p.y), Infinity);
  const y = topY - nextGap();
  const x = nextReachableX(lastSpawnX);
  platforms.push(makePlatform(x, y));
  lastSpawnX = x;
}

/* ============================ Draw ============================= */
function drawPlatform(p) {
  ctx.fillStyle = "#3dd13d"; ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = "#1e6a1e"; ctx.strokeRect(p.x, p.y, p.w, p.h);
  ctx.fillStyle = "#6fff6f";   ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, 1);
}

function drawPlayer() {
  ctx.fillStyle = "#00e5ff";
  ctx.fillRect(Math.floor(player.x), Math.floor(player.y), player.w, player.h);
}

function drawHUD() {
  ctx.fillStyle = "#fff";
  ctx.font = "8px monospace";
  ctx.fillText(`SCORE: ${score}`, 4, 10);
  const t = `BEST: ${best}`;
  ctx.fillText(t, canvas.width - 4 - ctx.measureText(t).width, 10);

  if (!started) {
    ctx.font = "10px monospace";
    const msg = "Move: ←/→ or A/D  |  Boost: ↑/W";
    const w = ctx.measureText(msg).width;
    ctx.fillText(msg, (canvas.width - w) / 2, Math.floor(canvas.height * 0.52));
  }
}

/* =========================== Physics =========================== */
function landingOn(p) {
  const nextBottom = player.y + player.h + player.vy;
  const prevBottom = player.prevY + player.h;
  const overX = player.x + player.w > p.x && player.x < p.x + p.w;
  const crossing = prevBottom <= p.y && nextBottom >= p.y;
  return player.vy > 0 && overX && crossing;
}

/* ============================ Game ============================= */
function resetRun() {
  started = false; score = 0; bgOffset = 0; lastLandedId = null; boostCharges = 1;
  player.x = canvas.width / 2 - player.w / 2;
  player.y = CFG.startY - player.h; player.vy = 0;
  initPlatforms(); initStars();
}

function update(dt, ts) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  drawBackground(ts);

  // input
  if (keys["arrowleft"] || keys["a"])  player.x -= CFG.speed;
  if (keys["arrowright"] || keys["d"]) player.x += CFG.speed;
  if (player.x < -player.w) player.x = canvas.width;
  if (player.x > canvas.width) player.x = -player.w;

  // physics
  player.prevY = player.y;
  if (started) { player.vy += CFG.gravity; player.y += player.vy; }

  // land & score (unique platform only) + recharge boost
  for (const p of platforms) {
    if (landingOn(p)) {
      player.vy = CFG.jump;
      if (p.id !== lastLandedId) {
        score++; lastLandedId = p.id;
        if (score > best) best = score;
      }
      boostCharges = 1;
    }
  }

  // scroll
  const threshold = Math.floor(canvas.height * 0.42);
  if (player.y < threshold) {
    const dy = threshold - player.y;
    player.y += dy; for (const p of platforms) p.y += dy; bgOffset += dy * 0.3;
  }
  bgOffset += 0.18;

  // recycle (based on avg gap)
  platforms = platforms.filter(p => p.y < canvas.height + 2);
  while (platforms.length < Math.ceil(canvas.height / ((CFG.gapMin + CFG.gapMax) / 2)) + 3) {
    addPlatformAboveTop();
  }

  // draw
  for (const p of platforms) drawPlatform(p);
  drawPlayer(); drawHUD();

  // lose
  if (started && player.y > canvas.height) resetRun();
}

function loop(ts) {
  const dt = ts - lastTime; lastTime = ts;
  update(dt, ts);
  requestAnimationFrame(loop);
}

/* ============================ Init ============================= */
function init() {
  player.x = canvas.width / 2 - player.w / 2;
  player.y = CFG.startY - player.h;
  initPlatforms(); initStars(); requestAnimationFrame(loop);
}
init();
