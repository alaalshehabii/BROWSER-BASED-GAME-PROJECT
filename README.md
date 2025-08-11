# 🎮 BROWSER-BASED-GAME-PROJECT

A vertical platform jumper game inspired by **Doodle Jump**, featuring a unique theme, custom art style, and physics-based gameplay.  
Your goal? Keep jumping higher while avoiding obstacles, defeating enemies, and collecting power-ups to climb the leaderboard.

---

## 📝 Overview
This game challenges players to navigate a series of procedurally generated platforms, each with different behaviors.  
The character jumps automatically when landing on a platform, and the player must steer left or right to keep ascending.  

---

## ✨ Features
- **Smooth Physics** – Gravity-based movement and realistic jumps.
- **Procedurally Generated Platforms** – Static, moving, and disappearing platforms.
- **Enemies & Obstacles** – Avoid hazards to stay alive.
- **Collectible Power-Ups** – Boost your abilities temporarily.
- **Score Tracking** – Climb higher to beat your personal best.
- **Responsive Controls** – Keyboard (Arrow keys / WASD) or mouse support.

---

## 🎯 How to Play
1. **Controls**  
   - ⬅️ **Left Arrow** / **A** – Move Left  
   - ➡️ **Right Arrow** / **D** – Move Right  
   - The player **jumps automatically** upon landing on platforms.

2. **Objective**  
   - Keep climbing by jumping on platforms.
   - Avoid enemies and obstacles.
   - Collect power-ups to gain temporary advantages.

---

## ⚙️ Game Mechanics

### Initialization
- Set player’s start position near the bottom of the canvas.
- Generate the first set of platforms.

### Main Game Loop
- **Physics & Movement**  
  - Apply gravity to player’s vertical velocity.  
  - Update horizontal movement based on player input.  
  - Scroll the screen upward once the player reaches a set height.

- **Platform Handling**  
  - Draw platforms relative to the scroll position.  
  - Check collisions while the player is falling; reset vertical velocity for a jump.

- **Platform Management**  
  - Add new platforms above the visible area as you ascend.  
  - Remove old platforms below the screen.

- **Enemies & Obstacles**  
  - Detect collisions with enemies/obstacles.  
  - End the game or reduce lives on collision.

- **Power-Ups**  
  - Check for power-up collection.  
  - Apply effects (higher jumps, invincibility, etc.).

- **Score**  
  - Track the highest vertical position reached.

---

## 🏆 Win & Lose Conditions

**Win (optional)**  
- Reach a target height or score.  
- Or make it endless for high-score chasing.

**Lose**  
- Fall below the bottom of the screen.  
- Collide with deadly obstacles.  
- Lose all lives (if using life system).

---

## 📋 Pseudocode

```plaintext
Initialize game:
  set player position
  generate initial platforms

Game Loop:
  apply gravity to player velocity
  update player position
  if player.y < scroll threshold:
    scroll viewport upward

  for each platform:
    draw platform
    if collision with falling player:
      reset velocity (jump)

  generate/remove platforms as needed

  if collision with enemy:
    game over or lose life

  if collect power-up:
    apply effect

  update score

Check Game Over:
  if player falls below screen:
    end game & display score

