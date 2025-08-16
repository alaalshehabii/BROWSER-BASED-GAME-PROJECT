# 🚀 Spaceship Jumper

A vertical **platform jumper game** inspired by *Doodle Jump*, with a **space theme**, pixel-art visuals, and smooth physics.  
Your mission? Pilot your spaceship higher and higher by bouncing on platforms while chasing the highest score!

---

## 📝 Overview
This game challenges players to:
- Jump between procedurally generated platforms
- Navigate upward using responsive controls
- Chase a new high score every round  

The game features **retro pixel style**, endless vertical scrolling, and simple but addictive gameplay.

---

## ✨ Features
- 🎮 **Smooth Physics** – Gravity-based movement & realistic jumps  
- 🪐 **Space Theme** – Pixel-art spaceship & animated starfield background  
- 🧩 **Procedurally Generated Platforms** – Endless variety as you climb  
- 📈 **Score Tracking** – Earn points per platform jumped on  
- 🎹 **Responsive Controls** – Keyboard support (Arrow keys / WASD)  

---

## 🎯 How to Play
### Controls
- ⬅️ **Left Arrow / A** – Move Left  
- ➡️ **Right Arrow / D** – Move Right  
- ⬆️ **Up Arrow / W** – Boost upward (extra jump help)  

### Objective
- Keep climbing by bouncing on platforms  
- Score 1 point for every platform you land on  
- Avoid falling off the screen  

---

## ⚙️ Game Mechanics
### Initialization
- Player starts at the bottom of the screen  
- Platforms are generated at intervals upwards  
- A pixel starfield fills the background  

### Main Game Loop
1. Apply gravity & update player position  
2. Handle user input (move left/right, optional boost)  
3. Scroll screen upward when player reaches threshold  
4. Detect collisions with platforms → bounce player upward  
5. Add new platforms above screen & remove old ones below  
6. Update score per successful platform jump  

### Game Over
- Falling below the bottom of the screen resets the game  
- Best score is saved until you quit  

---

## 📋 Pseudocode
Initialize game:
set player position
generate initial platforms
Game Loop:
apply gravity
update position & input
if player above threshold:
scroll screen upward
for each platform:
draw platform
if landing detected:
reset velocity (jump)
increase score
generate/remove platforms as needed
Check Game Over:
if player falls below screen:
reset game & update best score
