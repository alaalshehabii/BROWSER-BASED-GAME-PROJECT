# BROWSER-BASED-GAME-PROJECT
📝 Overview
A vertical platform jumper game inspired by Doodle Jump, featuring a unique theme and art style. The player controls a character that continuously jumps upward on platforms while avoiding obstacles and collecting power-ups.
✨ Features
Smooth physics-based jumping and movement
Procedurally generated platforms (static, moving, etc.)
Enemies and obstacles to increase challenge
Collectible power-ups with special effects
Score tracking based on the highest position reached
Responsive controls for keyboard and/or mouse
🎯 How to Play
Use ⬅️ Left and ➡️ Right arrow keys (or A/D) to move the character horizontally.
The character automatically jumps upon landing on platforms.
Climb as high as possible by jumping on platforms without falling.
Avoid enemies and obstacles; collect power-ups to assist your climb.
⚙️ Game Mechanics
Initialization
Set the player's initial position near the bottom of the canvas.
Generate an initial set of platforms positioned vertically.
Main Game Loop (per animation frame)
Physics and Movement
Apply gravity to the player’s vertical velocity.
Update player’s position according to velocity and horizontal input.
Scroll the viewport upward when the player reaches a vertical threshold.
Platform Handling
Draw all platforms relative to the current scroll offset.
Detect collision between player and platforms during descent; reset vertical velocity to simulate jump if collision occurs.
Platform Management
Generate new platforms above the visible screen as the player ascends.
Remove platforms that move below the visible screen.
Enemies and Obstacles
Detect collisions between player and enemies/obstacles.
Trigger game over or decrease player lives on collision.
Power-ups
Detect collection of power-ups by the player.
Apply power-up effects like enhanced jump height or temporary invincibility.
Score Update
Update and display the score based on the player’s highest vertical position.
🏆 Win and Lose Conditions
Win Conditions:
Reach a predefined target height or achieve a specific score (optional).
Alternatively, the game can be endless with no fixed win condition, focusing on high scores.
Lose Conditions:
The player falls below the bottom of the screen.
The player collides with enemies or obstacles that cause immediate failure.
The player runs out of lives (if implemented).
📋 Pseudocode
Initialize game:
  set player position near bottom
  generate initial platforms

Game Loop:
  apply gravity to player velocity
  update player position based on velocity and input
  if player.y < scroll threshold:
    scroll viewport upward

  for each platform:
    draw platform at adjusted position
    if player collides with platform while falling:
      reset player vertical velocity to jump

  generate new platforms above visible area as needed
  remove platforms below visible area

  if player collides with enemy or obstacle:
    trigger game over or lose life

  if player collects power-up:
    apply power-up effect

  update score based on player's height

Check game over:
  if player falls below screen bottom:
    end game and display final score
