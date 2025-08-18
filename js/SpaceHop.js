/********************  CANVAS  ********************/
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 240;
canvas.height = 360;
ctx.imageSmoothingEnabled = false;

/********************  DIFFICULTY KNOBS  ********************/
/* Increased gaps for more distance between platforms */
const GRAVITY = 0.34;
const JUMP = -8.2;                // a bit stronger to clear the bigger gaps
const PLAYER_SPEED = 2.3;

const PLATFORM_W = 44;
const PLATFORM_H = 8;

/* Bigger vertical spacing range */
const GAP_MIN = 50;               // ↑ from 52
const GAP_MAX = 70;               // ↑ from 64

/* Horizontal steering required (unchanged) */
const REACH_X_MIN = 55;
const REACH_X_MAX = 80;

/* Boost (↑/W) */
const BOOST_IMPULSE = -3.8;       // tiny nudge to match bigger gaps

const START_PLATFORM_Y = canvas.height - 38;

let boostsLeft = 1;
let hasStarted = false;
let score = 0;
let best = 0;
let gameOver = false;

/********************  PLAYER  ********************/
/* Slightly bigger rocket */
const PLAYER_W = 28;              // ↑ from 24
const PLAYER_H = 28;              // ↑ from 24

const shipImg = new Image();
shipImg.src = "assets/spaceship.png";

const player = {
  x: canvas.width / 2 - PLAYER_W / 2,
  y: START_PLATFORM_Y - PLAYER_H,
  w: PLAYER_W,
  h: PLAYER_H,
  vy: 0,
  prevY: 0
};

/********************  INPUT  ********************/
const keys = Object.create(null);

function tryStartFromIdle(k) {
  if (!hasStarted && !gameOver && (k === "arrowleft" || k === "a" || k === "arrowright" || k === "d")) {
    hasStarted = true;
  }
}

function tryBoost(k) {
  if (hasStarted && !gameOver && (k === "arrowup" || k === "w")) {
    if (boostsLeft > 0) {
      player.vy += BOOST_IMPULSE;
      boostsLeft -= 1;
    }
  }
}

function tryRestart(k) {
  if (gameOver && (k === " " || k === "enter")) {
    restartGame();
  }
}

addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  tryStartFromIdle(k);
  tryBoost(k);
  tryRestart(k);
});
addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

/* Mouse/touch click to restart on Game Over */
canvas.addEventListener("pointerdown", () => {
  if (gameOver) restartGame();
});

/********************  PIXEL BACKGROUND  ********************/
let bgOffset = 0;
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
function drawPixelSpace(timeMs) {
  const t = timeMs / 1000;
  for (let i = 0; i < 60; i++) {
    const nx = ((i * 40 + (t * 10) + bgOffset * 0.2) % canvas.width + canvas.width) % canvas.width;
    const ny = ((i * 25 + (t * 5) + bgOffset * 0.35) % canvas.height + canvas.height) % canvas.height;
    ctx.fillStyle = ["#120030", "#1a004f", "#240061", "#310072"][i % 4];
    ctx.fillRect(nx, ny, 20, 20);
  }
  for (const s of stars) {
    const twinkle = 0.7 + 0.3 * Math.abs(Math.sin(t * 2 + s.phase));
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = s.color;
    const sy = (s.y + bgOffset * 0.5) % canvas.height;
    const sx = s.x;
    if (s.size === 2) {
      ctx.fillRect(sx, sy, 1, 1);
      ctx.fillRect(sx - 1, sy, 1, 1);
      ctx.fillRect(sx + 1, sy, 1, 1);
      ctx.fillRect(sx, sy - 1, 1, 1);
      ctx.fillRect(sx, sy + 1, 1, 1);
    } else {
      ctx.fillRect(sx, sy, 1, 1);
    }
    ctx.globalAlpha = 1;
  }
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = "#000";
  for (let y = 0; y < canvas.height; y += 2) ctx.fillRect(0, y, canvas.width, 1);
  ctx.globalAlpha = 1;
}

/********************  PLATFORMS  ********************/
let platforms = [];
let lastSpawnX = null;
let platformIdSeq = 0;
let lastLandedId = null;

function makePlatform(x, y, type = "solid") {
  return { id: platformIdSeq++, x, y, w: PLATFORM_W, h: PLATFORM_H, type };
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function nextReachableX(prevX) {
  let dx = Math.floor((Math.random() * (REACH_X_MAX - REACH_X_MIN + 1)) + REACH_X_MIN);
  if (Math.random() < 0.5) dx = -dx;
  let nx = prevX + dx;
  return clamp(nx, 0, canvas.width - PLATFORM_W);
}
function nextGap() {
  return Math.floor(Math.random() * (GAP_MAX - GAP_MIN + 1)) + GAP_MIN;
}

function initPlatforms() {
  platforms.length = 0;
  const startX = Math.floor(canvas.width / 2 - PLATFORM_W / 2);
  platforms.push(makePlatform(startX, START_PLATFORM_Y));
  lastSpawnX = startX;

  let y = START_PLATFORM_Y - nextGap();
  while (y > -PLATFORM_H) {
    const x = nextReachableX(lastSpawnX);
    platforms.push(makePlatform(x, y));
    lastSpawnX = x;
    y -= nextGap();
  }
  boostsLeft = 1;
  lastLandedId = null;
}

function addPlatformAboveTop() {
  const topMost = platforms.reduce((min, p) => Math.min(min, p.y), Infinity);
  const newY = topMost - nextGap();
  const newX = nextReachableX(lastSpawnX);
  platforms.push(makePlatform(newX, newY));
  lastSpawnX = newX;
}

/********************  DRAW HELPERS  ********************/
function drawPlatform(p) {
  ctx.fillStyle = "#3dd13d";
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = "#1e6a1e";
  ctx.lineWidth = 1;
  ctx.strokeRect(p.x, p.y, p.w, p.h);
  ctx.fillStyle = "#6fff6f";
  ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, 1);
}
function drawPlayer() {
  if (shipImg.complete && shipImg.naturalWidth > 0) {
    ctx.drawImage(shipImg, Math.floor(player.x), Math.floor(player.y), player.w, player.h);
  } else {
    ctx.fillStyle = "#00e5ff";
    ctx.fillRect(Math.floor(player.x), Math.floor(player.y), player.w, player.h);
  }
}
function drawHUD() {
  ctx.fillStyle = "#fff";
  ctx.font = "8px monospace";
  ctx.fillText(`SCORE: ${score}`, 4, 10);
  const bestText = `BEST: ${best}`;
  ctx.fillText(bestText, canvas.width - 4 - ctx.measureText(bestText).width, 10);
  if (!hasStarted && !gameOver) {
    ctx.font = "10px monospace";
    const msg = "←/→ or A/D — ↑/W BOOST";
    const w = ctx.measureText(msg).width;
    ctx.fillText(msg, (canvas.width - w) / 2, Math.floor(canvas.height * 0.52));
  }
}

/* GAME OVER overlay */
function drawGameOverOverlay() {
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;

  const pw = 180, ph = 110;
  const px = Math.floor((canvas.width - pw) / 2);
  const py = Math.floor((canvas.height - ph) / 2);
  ctx.fillStyle = "#111122";
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = "#5cf2ff";
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2);

  ctx.fillStyle = "#ffffff";
  ctx.font = "16px monospace";
  const title = "GAME OVER";
  const tw = ctx.measureText(title).width;
  ctx.fillText(title, Math.floor(canvas.width/2 - tw/2), py + 28);

  ctx.font = "10px monospace";
  const s1 = `Score: ${score}`;
  const s2 = `Best:  ${best}`;
  ctx.fillText(s1, px + 16, py + 54);
  ctx.fillText(s2, px + 16, py + 70);

  ctx.font = "9px monospace";
  const hint = "Press Space/Click to retry";
  const hw = ctx.measureText(hint).width;
  ctx.fillText(hint, Math.floor(canvas.width/2 - hw/2), py + 94);
}

/********************  COLLISION  ********************/
function isLandingOn(p) {
  const nextYBottom = player.y + player.h + player.vy;
  const prevYBottom = player.prevY + player.h;
  const horizontallyOver = player.x + player.w > p.x && player.x < p.x + p.w;
  const crossingTop = prevYBottom <= p.y && nextYBottom >= p.y;
  return player.vy > 0 && horizontallyOver && crossingTop;
}

/********************  GAME LOOP  ********************/
let lastTime = 0;

function restartGame() {
  hasStarted = false;
  gameOver = false;
  score = 0;

  player.x = canvas.width / 2 - player.w / 2;  // center using current size
  player.y = START_PLATFORM_Y - player.h;      // place above start platform
  player.vy = 0;
  boostsLeft = 1;
  lastLandedId = null;

  initPlatforms();
  initStars();
  bgOffset = 0;
}

function update(dt, nowMs) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPixelSpace(nowMs);

  for (const p of platforms) drawPlatform(p);
  drawPlayer();
  drawHUD();

  if (gameOver) {
    drawGameOverOverlay();
    return;
  }

  if (keys["arrowleft"] || keys["a"])  player.x -= PLAYER_SPEED;
  if (keys["arrowright"] || keys["d"]) player.x += PLAYER_SPEED;

  // Wrap horizontally
  if (player.x < -player.w) player.x = canvas.width;
  if (player.x > canvas.width) player.x = -player.w;

  // Physics
  player.prevY = player.y;
  if (hasStarted) {
    player.vy += GRAVITY;
    player.y += player.vy;
  }

  // Platform landings
  for (const p of platforms) {
    if (isLandingOn(p)) {
      player.vy = JUMP;
      if (p.id !== lastLandedId) {
        score++;
        lastLandedId = p.id;
        if (score > best) best = score;
      }
      boostsLeft = 1;
    }
  }

  // Camera / scroll
  const scrollThreshold = Math.floor(canvas.height * 0.42);
  if (player.y < scrollThreshold) {
    const dy = scrollThreshold - player.y;
    player.y += dy;
    for (const p of platforms) p.y += dy;
    bgOffset += dy * 0.3;
  }
  bgOffset += 0.18;

  // Spawn/cleanup platforms
  platforms = platforms.filter(p => p.y < canvas.height + 2);
  while (platforms.length < Math.ceil(canvas.height / ((GAP_MIN + GAP_MAX) / 2)) + 3) {
    addPlatformAboveTop();
  }

  // Lose condition
  if (hasStarted && player.y > canvas.height) {
    gameOver = true;
    hasStarted = false;
  }
}

function loop(ts) {
  const dt = ts - lastTime; lastTime = ts;
  update(dt, ts);
  requestAnimationFrame(loop);
}

/********************  INIT  ********************/
initStars();
initPlatforms();
requestAnimationFrame(loop);
