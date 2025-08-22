/* ==============================
   DOM Elements (HUD + Overlay)
   ============================== */
const $score = document.getElementById("score");         // Current score display
const $best = document.getElementById("best");           // Best score display
const $overlay = document.getElementById("overlay");     // Overlay container (game over / start)
const $overlayTitle = document.getElementById("overlayTitle"); // Overlay title text
const $overlayMsg = document.getElementById("overlayMsg");     // Overlay message text
const $restartBtn = document.getElementById("restartBtn");     // Restart button

/* ==============================
   Canvas Setup
   ============================== */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 240;
canvas.height = 360;
ctx.imageSmoothingEnabled = false; // keeps pixel-art style crisp

/* ==============================
   Theme Colors & Fonts
   ============================== */
const COLORS = {
  nebula: ["#120030", "#1a004f", "#240061", "#310072"],  // animated nebula squares
  star: ["#ffffff", "#ffd27f", "#a4d8ff", "#ff9ff3"],    // star colors
  platformFill: "#3dd13d",   // platform main color
  platformEdge: "#1e6a1e",   // platform border
  platformTop: "#6fff6f",    // highlight strip on top
  playerFallback: "#00e5ff", // fallback player color if image not loaded
  overlayDim: "#000",        // background dimmer
  text: "#ffffff",           // text color
  textOutline: "#0d0b1a"     // text outline color
};
const FONTS = {
  hud: "8px monospace",   // HUD font (score/best)
  hint: "9px monospace",  // hint text
  start: "14px monospace" // "START" text
};

/* ==============================
   Tunable Game Constants
   ============================== */
const GRAVITY = 0.34;
const JUMP = -8.2;                // upward impulse after landing
const PLAYER_SPEED = 2.3;         // horizontal movement speed
const PLATFORM_W = 40;            // platform width
const PLATFORM_H = 8;             // platform height
const GAP_MIN = 45;               // min vertical gap between platforms
const GAP_MAX = 85;               // max vertical gap
const REACH_X_MIN = 30;           // min horizontal spacing between platforms
const REACH_X_MAX = 100;          // max horizontal spacing
const BOOST_IMPULSE = -3.8;       // upward boost (ArrowUp/W)
const START_PLATFORM_Y = canvas.height - 38;
const EDGE_MARGIN = 6;

/* ==============================
   Game State
   ============================== */
let hasStarted = false;   // true when game begins
let gameOver = false;     // true after falling
let score = 0;
let best = 0;
let boostsLeft = 1;       // one-time upward boost

const astronautImg = new Image();
astronautImg.src = "assets/Astronaut.png"; // main player sprite

// Player object
const player = {
  w: 32, h: 32,
  x: canvas.width / 2 - 16,
  y: START_PLATFORM_Y - 32,
  vy: 0,       // vertical velocity
  prevY: 0     // previous frame Y (used for collision detection)
};

let platforms = [];       // array of platform objects
let lastSpawnX = null;    // last platform x position
let platformIdSeq = 0;    // unique ID for each platform
let lastLandedId = null;  // last platform the player landed on
let bgOffset = 0;         // background scroll offset

/* ==============================
   UI Elements
   ============================== */
// clickable hitbox for "START" text
const startText = { x: 0, y: 0, w: 0, h: 0, text: "START" };

/* ==============================
   Audio Setup
   ============================== */
const jumpSound = new Audio("assets/sounds/jump-sound.wav");
jumpSound.preload = "auto";
jumpSound.volume = 0.8;

let audioUnlocked = false; // ensures sound can play after user interaction
let sfxReady = false;      // true when sound file is fully loaded

const MUTE_KEY = "spacehop_muted";        // localStorage key for mute state
let isMuted = localStorage.getItem(MUTE_KEY) === "1";

jumpSound.addEventListener("canplaythrough", () => { sfxReady = true; });

function unlockAudioOnce() {
  // Unlock audio playback once after user interaction
  if (audioUnlocked) return;
  const p = jumpSound.play();
  Promise.resolve(p).then(() => jumpSound.pause()).finally(() => { audioUnlocked = true; });
}
window.addEventListener("pointerdown", unlockAudioOnce, { once: true });
window.addEventListener("keydown", unlockAudioOnce, { once: true });

function playJump() {
  // play jump sound (cloned so overlapping jumps work)
  if (isMuted || !audioUnlocked || !sfxReady) return;
  try {
    const s = jumpSound.cloneNode(true);
    s.volume = jumpSound.volume;
    s.currentTime = 0;
    s.play().catch(() => {});
  } catch {}
}

/* ==============================
   Mute Button
   ============================== */
(function mountMuteButton(){
  let btn = document.getElementById("muteBtn");
  if (!btn) {
    // Create mute button if not already in DOM
    btn = document.createElement("button");
    btn.id = "muteBtn";
    Object.assign(btn.style, {
      position: "fixed", top: "10px", right: "10px", zIndex: "9999",
      fontSize: "16px", padding: "6px 10px", borderRadius: "10px",
      border: "1px solid #fff", background: "#111", color: "#fff",
      cursor: "pointer", userSelect: "none", opacity: "0.9"
    });
    btn.setAttribute("aria-label", "Toggle sound");
    document.body.appendChild(btn);
  }
  function render() { btn.textContent = isMuted ? "🔇" : "🔊"; }
  btn.onclick = () => { isMuted = !isMuted; localStorage.setItem(MUTE_KEY, isMuted ? "1" : "0"); render(); };
  render();
})();

/* ==============================
   Input Handling (Keyboard + Pointer)
   ============================== */
const keys = Object.create(null);

addEventListener("keydown", (e) => {
  const kRaw = e.key;
  // Prevent page scroll when using arrows or space
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(kRaw)) {
    e.preventDefault();
  }
  unlockAudioOnce();
  const k = kRaw.toLowerCase();
  keys[k] = true;

  // Start game on first left/right movement
  if (!hasStarted && !gameOver && (k==="arrowleft"||k==="a"||k==="arrowright"||k==="d")) {
    hasStarted = true;
    hideOverlay();
  }
  // Boost (up/W) if available
  if (hasStarted && !gameOver && (k==="arrowup"||k==="w")) {
    if (boostsLeft > 0) {
      player.vy += BOOST_IMPULSE;
      boostsLeft -= 1;
      playJump();
    }
  }
  // Restart game with space/enter when over
  if (gameOver && (k===" "||k==="enter")) restartGame();
}, false);

addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

// Start/restart by clicking on canvas
canvas.addEventListener("pointerdown", (e) => {
  unlockAudioOnce();
  const { left, top } = canvas.getBoundingClientRect();
  const mx = e.clientX - left, my = e.clientY - top;
  if (!hasStarted && !gameOver) {
    // Check if click was on "START"
    if (mx >= startText.x && mx <= startText.x+startText.w &&
        my >= startText.y && my <= startText.y+startText.h) {
      hasStarted = true;
      hideOverlay();
      return;
    }
  } else if (gameOver) {
    restartGame();
  }
});

/* ==============================
   Helper Functions
   ============================== */
const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const nextGap = () => randInt(GAP_MIN, GAP_MAX);

function updateHUD(){ 
  $score.textContent = String(score); 
  $best.textContent = String(best); 
}
function showOverlay(title, msg){ 
  $overlayTitle.textContent = title; 
  $overlayMsg.textContent = msg; 
  $overlay.hidden = false; 
}
function hideOverlay(){ $overlay.hidden = true; }

/* pick an X coordinate for next platform within reach */
function nextReachableX(prevX){
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

/* ==============================
   Background (Nebula + Stars)
   ============================== */
const stars = [];
function initStars(){
  stars.length = 0;
  for (let i=0; i<90; i++){
    stars.push({
      x: Math.floor(Math.random() * canvas.width),
      y: Math.floor(Math.random() * canvas.height),
      size: Math.random() < 0.7 ? 1 : 2,
      color: COLORS.star[Math.floor(Math.random() * COLORS.star.length)],
      phase: Math.random() * Math.PI * 2
    });
  }
}
function drawPixelSpace(timeMs){
  // animated nebula blocks
  const t = timeMs / 1000;
  for (let i=0; i<60; i++){
    const nx = ((i*40 + (t*10) + bgOffset*0.2) % canvas.width + canvas.width) % canvas.width;
    const ny = ((i*25 + (t*5) + bgOffset*0.35) % canvas.height + canvas.height) % canvas.height;
    ctx.fillStyle = COLORS.nebula[i % COLORS.nebula.length];
    ctx.fillRect(nx, ny, 20, 20);
  }
  // twinkling stars
  for (const s of stars){
    const twinkle = 0.7 + 0.3 * Math.abs(Math.sin(t*2 + s.phase));
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = s.color;
    const sy = (s.y + bgOffset*0.5) % canvas.height;
    const sx = s.x;
    if (s.size === 2){
      // cross-shaped star
      ctx.fillRect(sx, sy, 1, 1);
      ctx.fillRect(sx-1, sy, 1, 1);
      ctx.fillRect(sx+1, sy, 1, 1);
      ctx.fillRect(sx, sy-1, 1, 1);
      ctx.fillRect(sx, sy+1, 1, 1);
    } else {
      ctx.fillRect(sx, sy, 1, 1);
    }
    ctx.globalAlpha = 1;
  }
  // faint scanlines
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = COLORS.overlayDim;
  for (let y=0; y<canvas.height; y+=2) ctx.fillRect(0, y, canvas.width, 1);
  ctx.globalAlpha = 1;
}

/* ==============================
   Platforms
   ============================== */
function makePlatform(x,y){ return { id: platformIdSeq++, x, y, w: PLATFORM_W, h: PLATFORM_H }; }

function initPlatforms(){
  platforms.length = 0;
  const startX = Math.floor(canvas.width/2 - PLATFORM_W/2);
  platforms.push(makePlatform(startX, START_PLATFORM_Y));
  lastSpawnX = startX;

  let y = START_PLATFORM_Y - nextGap();
  while (y > -PLATFORM_H){
    const x = nextReachableX(lastSpawnX);
    platforms.push(makePlatform(x, y));
    lastSpawnX = x;
    y -= nextGap();
  }
  boostsLeft = 1;
  lastLandedId = null;
}
function addPlatformAboveTop(){
  const topMost = platforms.reduce((min,p) => Math.min(min,p.y), Infinity);
  const newY = topMost - nextGap();
  const newX = nextReachableX(lastSpawnX);
  platforms.push(makePlatform(newX, newY));
  lastSpawnX = newX;
}

/* ==============================
   Rendering Functions
   ============================== */
function drawPlatform(p){
  ctx.fillStyle = COLORS.platformFill;
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = COLORS.platformEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(p.x, p.y, p.w, p.h);
  ctx.fillStyle = COLORS.platformTop;
  ctx.fillRect(p.x+2, p.y+2, p.w-4, 1);
}
function drawPlayer(){
  const px = Math.floor(player.x), py = Math.floor(player.y);
  if (astronautImg.complete && astronautImg.naturalWidth > 0){
    ctx.drawImage(astronautImg, px, py, player.w, player.h);
  } else {
    ctx.fillStyle = COLORS.playerFallback;
    ctx.fillRect(px, py, player.w, player.h);
  }
}
function drawOutlinedPixelText(text, x, y, fill=COLORS.text, outline=COLORS.textOutline){
  // draw outline around text for readability
  ctx.fillStyle = outline;
  ctx.fillText(text, x-1, y); ctx.fillText(text, x+1, y);
  ctx.fillText(text, x, y-1); ctx.fillText(text, x, y+1);
  ctx.fillText(text, x-1, y-1); ctx.fillText(text, x+1, y-1);
  ctx.fillText(text, x-1, y+1); ctx.fillText(text, x+1, y+1);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}
function drawHUDCanvas(){
  // Draw score + best in top corners
  ctx.fillStyle = COLORS.text;
  ctx.font = FONTS.hud;
  ctx.fillText(`SCORE: ${score}`, 4, 10);
  const bestText = `BEST: ${best}`;
  ctx.fillText(bestText, canvas.width - 4 - ctx.measureText(bestText).width, 10);

  // Show START text + hints before game begins
  if (!hasStarted && !gameOver){
    ctx.font = FONTS.start;
    const label = startText.text;
    const tw = ctx.measureText(label).width;
    const tx = Math.floor((canvas.width - tw) / 2);
    const ty = Math.floor(canvas.height * 0.44);
    drawOutlinedPixelText(label, tx, ty);
    const approxH = 14;
    startText.x = tx-2; startText.y = ty-approxH; startText.w = tw+4; startText.h = approxH+4;

    ctx.font = FONTS.hint;
    const hint1 = "←/→ or A/D to move";
    const hint2 = "↑/W to BOOST";
    ctx.fillText(hint1, Math.floor((canvas.width-ctx.measureText(hint1).width)/2), ty+18);
    ctx.fillText(hint2, Math.floor((canvas.width-ctx.measureText(hint2).width)/2), ty+30);
  }
}

/* ==============================
   Collision Detection
   ============================== */
function isLandingOn(p){
  // true if player is moving downward and crosses platform top
  const nextBottom = player.y + player.h + player.vy;
  const prevBottom = player.prevY + player.h;
  const onX = player.x + player.w > p.x && player.x < p.x + p.w;
  const crossingTop = prevBottom <= p.y && nextBottom >= p.y;
  return player.vy > 0 && onX && crossingTop;
}

/* ==============================
   Game Flow
   ============================== */
function restartGame(){
  // reset all state to initial
  hasStarted=false; gameOver=false; score=0;
  player.x = canvas.width/2 - player.w/2;
  player.y = START_PLATFORM_Y - player.h;
  player.vy = 0;
  boostsLeft=1; lastLandedId=null;
  initPlatforms(); initStars(); bgOffset=0;
  hideOverlay(); updateHUD();
}

function update(nowMs){
  // Main update loop (runs every frame)
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawPixelSpace(nowMs);
  platforms.forEach(drawPlatform);
  drawPlayer();
  drawHUDCanvas();

  if (gameOver) return;

  // Horizontal movement
  if (keys["arrowleft"]||keys["a"]) player.x -= PLAYER_SPEED;
  if (keys["arrowright"]||keys["d"]) player.x += PLAYER_SPEED;

  // Wrap around edges
  if (player.x < -player.w) player.x = canvas.width;
  if (player.x > canvas.width) player.x = -player.w;

  // Apply gravity + movement
  player.prevY = player.y;
  if (hasStarted){ player.vy += GRAVITY; player.y += player.vy; }

  // Check landings
  for (const p of platforms){
    if (isLandingOn(p)){
      player.vy = JUMP;
      playJump();
      if (p.id !== lastLandedId){
        score++; lastLandedId=p.id;
        if (score>best) best=score;
        updateHUD();
      }
      boostsLeft=1;
    }
  }

  // Scroll world when player goes above threshold
  const scrollThreshold = Math.floor(canvas.height * 0.42);
  if (player.y < scrollThreshold){
    const dy = scrollThreshold - player.y;
    player.y += dy;
    for (const p of platforms) p.y += dy;
    bgOffset += dy*0.3;
  }
  bgOffset += 0.18;

  // Recycle platforms
  platforms = platforms.filter(p => p.y < canvas.height+2);
  while (platforms.length < Math.ceil(canvas.height / ((GAP_MIN+GAP_MAX)/2)) + 3){
    addPlatformAboveTop();
  }

  // Detect fall (game over)
  if (hasStarted && player.y > canvas.height){
    gameOver = true; hasStarted=false;
    showOverlay(CONFIG.MESSAGES.loseTitle, CONFIG.MESSAGES.loseMsg);
  }
}

function loop(ts){ update(ts); requestAnimationFrame(loop); }

/* ==============================
   Initialization
   ============================== */
$restartBtn.addEventListener("click", restartGame);
initStars(); initPlatforms(); updateHUD();
requestAnimationFrame(loop);
