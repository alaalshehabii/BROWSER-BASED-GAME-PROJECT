# 🌌 Space Hop

```
   ____  
  / ___|   ___   __ _  
  \___ \  / _ \ / _` |  
   ___) ||  __/| (_| |  
  |____/  \___| \__,_|  
```


A vertical **platform jumper game** inspired by *Doodle Jump*, with a **retro space theme**, pixel-art visuals, and smooth physics.  
Your mission? Guide your astronaut higher and higher by bouncing on platforms while chasing the highest score!

---

## 📝 Overview
This game challenges players to:
- Jump between procedurally generated platforms
- Navigate upward using responsive controls
- Chase a new high score every round  

The game features **retro pixel style**, endless vertical scrolling, and simple but addictive gameplay.

---

## ✨ Features
- 🎮 **Smooth Physics** – Gravity-based movement & satisfying jumps  
- 👨‍🚀 **Astronaut Character** – Pixelated astronaut sprite as the player  
- 🌌 **Space Theme** – Animated starfield & nebula background  
- 🧩 **Procedurally Generated Platforms** – Endless variety as you climb  
- 📈 **Score Tracking** – Earn points per platform jumped on  
- 🎹 **Responsive Controls** – Keyboard support (Arrow keys / WASD)  

---

## 🎯 How to Play
### Controls
- ⬅️ **Left Arrow / A** – Move Left  
- ➡️ **Right Arrow / D** – Move Right  
- ⬆️ **Up Arrow / W** – Boost upward (limited extra jump)  

### Objective
- Keep climbing by bouncing on platforms  
- Score 1 point for every platform you land on  
- Don’t fall off the screen!  

---

## ⚙️ Game Mechanics
### Initialization
- Astronaut starts at the bottom of the screen  
- Platforms are generated at intervals upwards  
- A pixelated starfield & nebula animate in the background  

### Main Game Loop
1. Apply gravity & update player position  
2. Handle user input (move left/right, optional boost)  
3. Scroll screen upward when player reaches threshold  
4. Detect collisions with platforms → bounce astronaut upward  
5. Add new platforms above screen & remove old ones below  
6. Update score per successful platform jump  

### Game Over
- Falling below the bottom of the screen resets the game  
- Best score is saved until you quit  

---

## 📋 Pseudocode
Initialize game:  
set astronaut position  
generate initial platforms  

Game Loop:  
apply gravity  
update position & input  
if astronaut above threshold:  
 scroll screen upward  
for each platform:  
 draw platform  
 if landing detected:  
  reset velocity (jump)  
  increase score  
  generate/remove platforms as needed  

Check Game Over:  
if astronaut falls below screen:  
 reset game & update best score  
