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
