🎮 SpaceHop – Browser-Based Game Project
A space-themed vertical platform jumper inspired by Doodle Jump, featuring a pixel-art background, smooth physics, and endless high-score chasing.
Your mission: keep climbing higher by landing on platforms, collecting points with each jump, and avoiding falling into the void of space.
📝 Overview
SpaceHop challenges players to control a tiny astronaut navigating a starry, nebula-filled sky.
The player automatically jumps upon landing on a platform and must steer left or right to keep climbing.
Each successful platform landed on increases your score — how high can you go?
✨ Features
Pixel-Art Vibes – Retro-styled space background with nebula blocks and twinkling stars.
Smooth Physics – Gravity-based jumping and side-to-side controls.
Procedurally Generated Platforms – Platforms are spaced dynamically for an endless climb.
Scoring System – Each platform you land on adds to your score; best score is saved per run.
Responsive Controls – Play with Arrow Keys or WASD.
Boost Mechanic – Use ↑ / W mid-air for an extra jump (once per airtime).
🎯 How to Play
Controls
⬅️ Left Arrow / A → Move Left
➡️ Right Arrow / D → Move Right
⬆️ Up Arrow / W → Boost upward (once per airtime, recharges on landing)
Objective
Keep climbing by landing on platforms.
Use your boost wisely to reach tricky spots.
Beat your high score by landing on more platforms.
Don’t fall below the screen — or it’s game over!
⚙️ Game Mechanics
Initialization
Player starts near the bottom of the canvas.
Platforms are generated from the start up into the sky.
Game Loop
Apply gravity to player velocity.
Update horizontal movement from inputs.
Scroll screen upward as the player ascends.
Add new platforms above the visible area, remove old ones below.
Landing on a platform triggers a jump and increments the score.
Scoring
+1 point per platform landed.
Best score tracked across runs.
Lose Condition
The game ends if the player falls below the screen.
📋 Pseudocode (Simplified)
Initialize game:
  set player position
  generate initial platforms
  score = 0

Game Loop:
  apply gravity
  update position
  handle left/right movement
  if player < scroll threshold:
    shift screen up
    move platforms down
    generate new platforms above

  for each platform:
    if collision from above while falling:
      jump again
      score += 1

  if player falls below screen:
    game over
