/********************  SETUP  ********************/
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 240;
canvas.height = 360;
ctx.imageSmoothingEnabled = false;

/********************  THEME  ********************/
const COLORS = {
  bgDeep: "#0e0b24",
  nebula: ["#120030", "#1a004f", "#240061", "#310072"],
  star: ["#ffffff", "#ffd27f", "#a4d8ff", "#ff9ff3"],
  platformFill: "#3dd13d",
  platformEdge: "#1e6a1e",
  platformTop: "#6fff6f",
  playerFallback: "#00e5ff",
  overlayDim: "#000",
  text: "#ffffff",
  textOutline: "#0d0b1a"
};

const FONTS = {
  hud: "8px monospace",
  hint: "9px monospace",
  start: "14px monospace",
  title: "16px monospace",
  overSmall: "10px monospace"
};

/********************  TUNABLES  ********************/
const GRAVITY = 0.34;
const JUMP = -8.2;
const PLAYER_SPEED = 2.3;

const PLATFORM_W = 40;
const PLATFORM_H = 8;

const GAP_MIN = 45;
const GAP_MAX = 85;

const REACH_X_MIN = 30;
const REACH_X_MAX = 100;

const BOOST_IMPULSE = -3.8;
const START_PLATFORM_Y = canvas.height - 38;

// Keep platforms slightly away from the edges
const EDGE_MARGIN = 6;

/********************  STATE  ********************/
let hasStarted = false;
let gameOver = false;
let score = 0;
let best = 0;
let boostsLeft = 1;

/* Astronaut sprite */
const astronautImg = new Image();
astronautImg.src = "assets/Astronaut.png";

const player = {
  w: 32,
  h: 32,
  x: canvas.width / 2 - 16,
  y: START_PLATFORM_Y - 32,
  vy: 0,
  prevY: 0
};

let platforms = [];
let lastSpawnX = null;
let platformIdSeq = 0;
let lastLandedId = null;
let bgOffset = 0;

/** clickable hitbox for “START” */
const startText = { x: 0, y: 0, w: 0, h: 0, text: "START" };

/********************  AUDIO (Jump SFX + Mute)  ********************/
const jumpSound = new Audio("assets/sounds/jump-sound.wav");
jumpSound.preload = "auto";
jumpSound.volume = 0.8;

let audioUnlocked = false;
let sfxReady = false;

// Persist mute across restarts/reloads
const MUTE_KEY = "spacehop_muted";
let isMuted = localStorage.getItem(MUTE_KEY) === "1";

jumpSound.addEventListener("canplaythrough", () => { sfxReady = true; });
jumpSound.addEventListener("error", (e) => console.warn("Jump SFX load error:", e));

// Autoplay unlock on first interaction
function unlockAudioOnce() {
  if (audioUnlocked) return;
  const p = jumpSound.play();
  Promise.resolve(p).then(() => jumpSound.pause()).finally(() => { audioUnlocked = true; });
}
window.addEventListener("pointerdown", unlockAudioOnce, { once: true });
window.addEventListener("keydown",   unlockAudioOnce, { once: true });

// Play helper (clone so rapid jumps overlap)
function playJump() {
  if (isMuted || !audioUnlocked || !sfxReady) return;
  try {
    const s = jumpSound.cloneNode(true);
    s.volume = jumpSound.volume;
    s.currentTime = 0;
    s.play().catch(() => {});
  } catch {}
}

// Mute button (top-right)
(function mountMuteButton(){
  let btn = document.getElementById("muteBtn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "muteBtn";
    Object.assign(btn.style, {
      position: "fixed", top: "10px", right: "10px", zIndex: "9999",
      fontSize: "16px", padding: "6px 10px", borderRadius: "10px",
      border: "1px solid #fff", background: "#111", color: "#fff",
      cursor: "pointer", userSelect: "none", opacity: "0.9"
    });
    document.body.appendChild(btn);
  }
  function render() { btn.textContent = isMuted ? "🔇" : "🔊"; }
  btn.onclick = () => { isMuted = !isMuted; localStorage.setItem(MUTE_KEY, isMuted ? "1" : "0"); render(); };
  render();
})();

/********************  INPUT  ********************/
const keys = Object.create(null);

addEventListener("keydown", (e) => {
  unlockAudioOnce();
  const k = e.key.toLowerCase();
  keys[k] = true;

  // Start on move
  if (!hasStarted && !gameOver && (k === "arrowleft" || k === "a" || k === "arrowright" || k === "d")) {
    hasStarted = true;
  }

  // Boost
  if (hasStarted && !gameOver && (k === "arrowup" || k === "w")) {
    if (boostsLeft > 0) {
      player.vy += BOOST_IMPULSE;
      boostsLeft -= 1;
      playJump(); // 🔊
    }
  }

  // Restart
  if (gameOver && (k === " " || k === "enter")) {
    restartGame();
  }
});

addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

/********************  CLICK (start / restart)  ********************/
canvas.addEventListener("pointerdown", (e) => {
  unlockAudioOnce();
  const { left, top } = canvas.getBoundingClientRect();
  const mx = e.clientX - left;
  const my = e.clientY - top;

  if (!hasStarted && !gameOver) {
    if (mx >= startText.x && mx <= startText.x + startText.w && my >= startText.y && my <= startText.y + startText.h) {
      hasStarted = true;
      return;
    }
  } else if (gameOver) {
    restartGame();
  }
});

/********************  HELPERS  ********************/
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

/* horizontal spawn */
function nextReachableX(prevX) {
  const minX = EDGE_MARGIN;
  const maxX = canvas.width - PLATFORM_W - EDGE_MARGIN;

  let lo = Math.max(minX, prevX - REACH_X_MAX);
  let hi = Math.min(maxX, prevX + REACH_X_MAX);

  if (prevX - lo < REACH_X_MIN) lo = Math.max(minX, prevX - REACH_X_MIN);
  if (hi - prevX < REACH_X_MIN) hi = Math.min(maxX, prevX + REACH_X_MIN);

  let x, tries = 0;
  do {
    x = Math.floor(Math.random() * (hi - lo + 1)) + lo;
    tries++;
    if (tries > 8) break;
  } while (Math.abs(x - prevX) < REACH_X_MIN);

  return x;
}

const nextGap = () => randInt(GAP_MIN, GAP_MAX);

/********************  BACKGROUND (stars + nebula)  ********************/
const stars = [];
function initStars() {
  stars.length = 0;
  for (let i = 0; i < 90; i++) {
    stars.push({
      x: Math.floor(Math.random() * canvas.width),
      y: Math.floor(Math.random() * canvas.height),
      size: Math.random() < 0.7 ? 1 : 2,
      color: COLORS.star[Math.floor(Math.random() * COLORS.star.length)],
      phase: Math.random() * Math.PI * 2
    });
  }
}

function drawPixelSpace(timeMs) {
  const t = timeMs / 1000;
  for (let i = 0; i < 60; i++) {
    const nx = ((i * 40 + (t * 10) + bgOffset * 0.2) % canvas.width + canvas.width) % canvas.width;
    const ny = ((i * 25 + (t * 5) + bgOffset * 0.35) % canvas.height + canvas.height) % canvas.height;
    ctx.fillStyle = COLORS.nebula[i % COLORS.nebula.length];
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
  ctx.fillStyle = COLORS.overlayDim;
  for (let y = 0; y < canvas.height; y += 2) ctx.fillRect(0, y, canvas.width, 1);
  ctx.globalAlpha = 1;
}

/********************  PLATFORMS  ********************/
function makePlatform(x, y, type = "solid") {
  return { id: platformIdSeq++, x, y, w: PLATFORM_W, h: PLATFORM_H, type };
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

/********************  RENDER  ********************/
function drawPlatform(p) {
  ctx.fillStyle = COLORS.platformFill;
  ctx.fillRect(p.x, p.y, p.w, p.h);

  ctx.strokeStyle = COLORS.platformEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(p.x, p.y, p.w, p.h);

  ctx.fillStyle = COLORS.platformTop;
  ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, 1);
}

function drawPlayer() {
  const px = Math.floor(player.x);
  const py = Math.floor(player.y);
  if (astronautImg.complete && astronautImg.naturalWidth > 0) {
    ctx.drawImage(astronautImg, px, py, player.w, player.h);
  } else {
    ctx.fillStyle = COLORS.playerFallback;
    ctx.fillRect(px, py, player.w, player.h);
  }
}

function drawOutlinedPixelText(text, x, y, fill = COLORS.text, outline = COLORS.textOutline) {
  ctx.fillStyle = outline;
  ctx.fillText(text, x - 1, y);
  ctx.fillText(text, x + 1, y);
  ctx.fillText(text, x, y - 1);
  ctx.fillText(text, x, y + 1);
  ctx.fillText(text, x - 1, y - 1);
  ctx.fillText(text, x + 1, y - 1);
  ctx.fillText(text, x - 1, y + 1);
  ctx.fillText(text, x + 1, y + 1);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function drawHUD() {
  ctx.fillStyle = COLORS.text;
  ctx.font = FONTS.hud;
  ctx.fillText(`SCORE: ${score}`, 4, 10);
  const bestText = `BEST: ${best}`;
  ctx.fillText(bestText, canvas.width - 4 - ctx.measureText(bestText).width, 10);

  if (!hasStarted && !gameOver) {
    ctx.font = FONTS.start;
    const label = startText.text;
    const tw = ctx.measureText(label).width;
    const tx = Math.floor((canvas.width - tw) / 2);
    const ty = Math.floor(canvas.height * 0.44);

    drawOutlinedPixelText(label, tx, ty);

    const approxH = 14;
    startText.x = tx - 2;
    startText.y = ty - approxH;
    startText.w = tw + 4;
    startText.h = approxH + 4;

    ctx.font = FONTS.hint;
    const hint1 = "←/→ or A/D to move";
    const hint2 = "↑/W to BOOST";
    ctx.fillText(hint1, Math.floor((canvas.width - ctx.measureText(hint1).width) / 2), ty + 18);
    ctx.fillText(hint2, Math.floor((canvas.width - ctx.measureText(hint2).width) / 2), ty + 30);
  }

  if (gameOver) {
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = COLORS.overlayDim;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    ctx.fillStyle = COLORS.text;
    ctx.font = FONTS.title;
    const title = "GAME OVER";
    ctx.fillText(title, Math.floor((canvas.width - ctx.measureText(title).width) / 2), 150);

    ctx.font = FONTS.overSmall;
    ctx.fillText(`Score: ${score}`, 70, 170);
    ctx.fillText(`Best:  ${best}`, 70, 185);

    ctx.font = FONTS.hint;
    const hint = "Press Space/Click to retry";
    ctx.fillText(hint, Math.floor((canvas.width - ctx.measureText(hint).width) / 2), 208);
  }
}

/********************  COLLISION  ********************/
function isLandingOn(p) {
  const nextBottom = player.y + player.h + player.vy;
  const prevBottom = player.prevY + player.h;
  const onX = player.x + player.w > p.x && player.x < p.x + p.w;
  const crossingTop = prevBottom <= p.y && nextBottom >= p.y;
  return player.vy > 0 && onX && crossingTop;
}

/********************  GAME FLOW  ********************/
let lastTime = 0;

function restartGame() {
  hasStarted = false;
  gameOver = false;
  score = 0;

  // (audio state)
  player.x = canvas.width / 2 - player.w / 2;
  player.y = START_PLATFORM_Y - player.h;
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

  platforms.forEach(drawPlatform);
  drawPlayer();
  drawHUD();

  if (gameOver) return;

  if (keys["arrowleft"] || keys["a"]) player.x -= PLAYER_SPEED;
  if (keys["arrowright"] || keys["d"]) player.x += PLAYER_SPEED;

  if (player.x < -player.w) player.x = canvas.width;
  if (player.x > canvas.width) player.x = -player.w;

  player.prevY = player.y;
  if (hasStarted) {
    player.vy += GRAVITY;
    player.y += player.vy;
  }

  for (const p of platforms) {
    if (isLandingOn(p)) {
      player.vy = JUMP;
      playJump(); // 🔊 on land
      if (p.id !== lastLandedId) {
        score++;
        lastLandedId = p.id;
        if (score > best) best = score;
      }
      boostsLeft = 1;
    }
  }

  const scrollThreshold = Math.floor(canvas.height * 0.42);
  if (player.y < scrollThreshold) {
    const dy = scrollThreshold - player.y;
    player.y += dy;
    for (const p of platforms) p.y += dy;
    bgOffset += dy * 0.3;
  }
  bgOffset += 0.18;

  platforms = platforms.filter(p => p.y < canvas.height + 2);
  while (platforms.length < Math.ceil(canvas.height / ((GAP_MIN + GAP_MAX) / 2)) + 3) {
    addPlatformAboveTop();
  }

  if (hasStarted && player.y > canvas.height) {
    gameOver = true;
    hasStarted = false;
  }
}

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  update(dt, ts);
  requestAnimationFrame(loop);
}

/********************  INIT  ********************/
initStars();
initPlatforms();
requestAnimationFrame(loop);
