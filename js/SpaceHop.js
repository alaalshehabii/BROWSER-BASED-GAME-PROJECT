/* ============================ Setup ============================ */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 240;              // low res -> chunky pixels
canvas.height = 360;
ctx.imageSmoothingEnabled = false;

/* ---------------------------- Config --------------------------- */
const CFG = {
  gravity: 0.34,
  jump: -6.9,
  speed: 2.2,
  startY: canvas.height - 38,
  platformW: 48,
  platformH: 8,
  gap: 44,                       // fixed gap (will improve later)
};

/* ---------------------------- State ---------------------------- */
const keys = {};
let platforms = [];
let started = false;
let score = 0, best = 0;
let lastTime = 0;
let bgDrift = 0;

const player = { x: 0, y: 0, w: 24, h: 24, vy: 0, prevY: 0 };

/* ============================ Input ============================ */
addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (!started && (k === "arrowleft" || k === "a" || k === "arrowright" || k === "d")) started = true;
});
addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

/* ============================ Stars ============================ */
const stars = [];
function initStars() {
  stars.length = 0;
  for (let i = 0; i < 80; i++) {
    stars.push({ x: Math.floor(Math.random() * canvas.width), y: Math.floor(Math.random() * canvas.height), s: Math.random() < 0.8 ? 1 : 2 });
  }
}
function drawStars() {
  for (const s of stars) ctx.fillRect(s.x, (s.y + bgDrift) % canvas.height, s.s, s.s);
}
/* ========================== Platforms ========================== */
function makePlatform(x, y) { return { x, y, w: CFG.platformW, h: CFG.platformH }; }
function initPlatforms() {
  platforms.length = 0;
  const startX = Math.floor(canvas.width / 2 - CFG.platformW / 2);
  platforms.push(makePlatform(startX, CFG.startY));

  let y = CFG.startY - CFG.gap;
  while (y > -CFG.platformH) {
    const x = Math.floor(Math.random() * (canvas.width - CFG.platformW));
    platforms.push(makePlatform(x, y));
    y -= CFG.gap;
  }
}
function addPlatformAboveTop() {
  const topY = platforms.reduce((m, p) => Math.min(m, p.y), Infinity);
  const y = topY - CFG.gap;
  const x = Math.floor(Math.random() * (canvas.width - CFG.platformW));
  platforms.push(makePlatform(x, y));
}

/* ============================ Draw ============================= */
function drawPlatform(p) {
  ctx.fillStyle = "#3dd13d"; ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = "#1e6a1e"; ctx.strokeRect(p.x, p.y, p.w, p.h);
}
function drawPlayer() {
  ctx.fillStyle = "#00e5ff";
  ctx.fillRect(Math.floor(player.x), Math.floor(player.y), player.w, player.h);
}
function drawHUD() {
  ctx.fillStyle = "#fff";
  ctx.font = "8px monospace";
  ctx.fillText(`SCORE: ${score}`, 4, 10);
  const t = `BEST: ${best}`; ctx.fillText(t, canvas.width - 4 - ctx.measureText(t).width, 10);
  if (!started) {
    ctx.font = "10px monospace";
    const msg = "Move: ←/→ or A/D";
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
  started = false; score = 0; bgDrift = 0;
  player.x = canvas.width / 2 - player.w / 2;
  player.y = CFG.startY - player.h; player.vy = 0;
  initPlatforms(); initStars();
}
function update(dt) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff"; drawStars();

  // input
  if (keys["arrowleft"] || keys["a"])  player.x -= CFG.speed;
  if (keys["arrowright"] || keys["d"]) player.x += CFG.speed;
  if (player.x < -player.w) player.x = canvas.width;
  if (player.x > canvas.width) player.x = -player.w;

  // physics
  player.prevY = player.y;
  if (started) { player.vy += CFG.gravity; player.y += player.vy; }

  // land & score (per landing for now)
  for (const p of platforms) {
    if (landingOn(p)) { player.vy = CFG.jump; score++; if (score > best) best = score; }
  }

  // scroll
  const threshold = Math.floor(canvas.height * 0.42);
  if (player.y < threshold) {
    const dy = threshold - player.y;
    player.y += dy; for (const p of platforms) p.y += dy; bgDrift += dy * 0.2;
  }
  bgDrift += 0.1;

  // recycle
  platforms = platforms.filter(p => p.y < canvas.height + 2);
  while (platforms.length < Math.ceil(canvas.height / CFG.gap) + 3) addPlatformAboveTop();

  // draw
  for (const p of platforms) drawPlatform(p);
  drawPlayer(); drawHUD();

  // lose
  if (started && player.y > canvas.height) resetRun();
}
function loop(ts) { const dt = ts - lastTime; lastTime = ts; update(dt); requestAnimationFrame(loop); }

/* ============================ Init ============================= */
function init() {
  player.x = canvas.width / 2 - player.w / 2;
  player.y = CFG.startY - player.h;
  initPlatforms(); initStars(); requestAnimationFrame(loop);
}
init();