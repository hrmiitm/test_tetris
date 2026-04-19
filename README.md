Tetris – A simple vanilla JS clone for GitHub Pages
===============================================

Overview
- A minimal, self-contained Tetris game implemented with HTML5 canvas and vanilla JavaScript.
- No build step required. Just open index.html in a browser (or host on GitHub Pages).
- Features: move/rotate, soft/hard drop, pause, restart, score/lines/level, next piece preview, game over state with restart.

Files at a glance
- index.html: Entry page with a canvas-based game area.
- style.css: UI styling and layout for the game board, HUD, next piece preview, and overlays.
- script.js: Core game logic (spawn, move, rotate, lock, clear lines, scoring, rendering).
- LICENSE: MIT license file.
- README.md: This file.

How to run
- Open index.html in any modern browser. No server required.
- GitHub Pages: create a repository and enable Pages to serve from main branch / root.

Usage / Controls
- ArrowLeft / ArrowRight: move left/right
- ArrowDown: soft drop
- ArrowUp: rotate
- Space: hard drop
- P: pause/resume
- R: restart

Game rules and scoring
- 10x20 board, 7 tetromino shapes
- When a line is completely filled, it clears and you gain score.
- Level increases as you clear 10 lines; faster drops with higher level.
- Game over occurs when a new piece cannot be placed.

Code design notes
- This is a compact, readable implementation focused on clarity for learning and for deployment on GitHub Pages.
- All assets are embedded; no dependencies.

License
- MIT License. See LICENSE at repo root.
