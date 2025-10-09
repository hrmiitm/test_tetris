// Simple, self-contained Tetris-like game for static GitHub Pages
// Note: This is a self-contained implementation with basic rotation and scoring.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const nextCanvas = document.getElementById('next');
  const nextCtx = nextCanvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const linesEl = document.getElementById('lines');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  const COLS = 10;
  const ROWS = 20;
  const BLOCK = 24; // pixel size
  const COLORS = [
    '#111827', // empty
    '#0ea5e9', // cyan
    '#9333ea', // purple
    '#f59e0b', // amber
    '#10b981', // emerald
    '#ef4444', // red
    '#14b8a6', // teal
    '#a3e635'  // lime
  ];

  // Simple tetromino definitions (rotation 0). We will rotate coordinates on the fly.
  // Each piece is an array of 4 coordinates (x,y) relative to a local origin.
  const SHAPES = {
    I: [{x:0,y:1},{x:1,y:1},{x:2,y:1},{x:3,y:1}],
    J: [{x:0,y:0},{x:0,y:1},{x:1,y:1},{x:2,y:1}],
    L: [{x:2,y:0},{x:0,y:1},{x:1,y:1},{x:2,y:1}],
    O: [{x:1,y:0},{x:2,y:0},{x:1,y:1},{x:2,y:1}],
    S: [{x:1,y:1},{x:2,y:1},{x:0,y:2},{x:1,y:2}],
    T: [{x:1,y:0},{x:0,y:1},{x:1,y:1},{x:2,y:1}],
    Z: [{x:0,y:1},{x:1,y:1},{x:1,y:2},{x:2,y:2}]
  };
  const PIECE_ORDER = ['I','J','L','O','S','T','Z'];

  function cloneBoard(board){ return board.map(r=>r.slice()); }

  let board = [];
  let current = null;
  let dropCounter = 0;
  let dropInterval = 1000; // ms per drop at level 1
  let lastTime = 0;
  let score = 0;
  let level = 1;
  let lines = 0;
  let running = false;
  let canHold = true;

  function createBoard(){
    const b = [];
    for(let r=0;r<ROWS;r++){
      const row = new Array(COLS).fill(0);
      b.push(row);
    }
    return b;
  }

  function randomPiece(){
    const idx = Math.floor(Math.random() * PIECE_ORDER.length);
    const name = PIECE_ORDER[idx];
    return { name, colorIndex: idx+1, blocks: SHAPES[name] };
  }

  function rotateCoords(coords){
    // rotate 90° clockwise around origin (0,0)
    return coords.map(p => ({ x: -p.y, y: p.x }));
  }

  function getBlockPositions(piece, rotation, originX, originY){
    let blocks = piece.blocks.map(b => ({...b}));
    for(let i=0;i<rotation;i++) blocks = blocks.map(p => ({ x: -p.y, y: p.x }));
    // translate
    return blocks.map(b => ({ x: b.x + originX, y: b.y + originY }));
  }

  function canPlace(blocks){
    for(const b of blocks){
      if(b.x < 0 || b.x >= COLS || b.y < 0 || b.y >= ROWS) return false;
      if(board[b.y][b.x] !== 0) return false;
    }
    return true;
  }

  function spawnPiece(){
    const piece = randomPiece();
    const rotation = 0;
    // spawn near top center
    const originX = 3; // starting x
    const originY = 0;
    const blocks = getBlockPositions(piece, rotation, originX, originY);
    if(!canPlace(blocks)){
      // game over
      running = false;
      pauseBtn.disabled = true;
      startBtn.disabled = false;
      return null;
    }
    current = { piece, rotation, originX, originY, blocks };
    return current;
  }

  function placeCurrent(){
    for(const b of current.blocks){
      if(b.y>=0 && b.y<ROWS && b.x>=0 && b.x<COLS){
        board[b.y][b.x] = current.piece.colorIndex;
      }
    }
  }

  function clearLines(){
    let cleared = 0;
    outer: for(let r=ROWS-1; r>=0; r--){
      for(let c=0; c<COLS; c++) if(board[r][c]===0){ continue outer; }
      // full line
      board.splice(r,1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;// recheck this row after drop
    }
    if(cleared>0){
      lines += cleared;
      score += calcScore(cleared);
      level = Math.min(10, 1 + Math.floor(lines/10));
      dropInterval = Math.max(100, 1000 - (level-1)*80);
      scoreEl.textContent = score;
      levelEl.textContent = level;
      linesEl.textContent = lines;
    }
  }

  function calcScore(linesCleared){
    // classic Tetris scoring per number of lines cleared at once
    switch(linesCleared){
      case 1: return 40 * level;
      case 2: return 100 * level;
      case 3: return 300 * level;
      case 4: return 1200 * level;
      default: return 0;
    }
  }

  function hardDrop(){
    if(!current) return;
    // drop to the lowest position
    while(true){
      const nextBlocks = current.blocks.map(b => ({ x: b.x, y: b.y + 1 }));
      if(canPlace(nextBlocks)) {
        current.blocks = nextBlocks;
        current.originY += 1;
      } else {
        break;
      }
    }
    placeCurrent();
    clearLines();
    current = spawnPiece();
    if(!current){ running = false; pauseBtn.disabled = true; startBtn.disabled = false; }
    canHold = true;
  }

  function drawBoard(){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    // draw grid
    for(let y=0; y<ROWS; y++){
      for(let x=0; x<COLS; x++){
        const v = board[y][x];
        if(v!==0){
          ctx.fillStyle = COLORS[v];
          ctx.fillRect(x*BLOCK, y*BLOCK, BLOCK, BLOCK);
          ctx.strokeStyle = '#111827';
          ctx.strokeRect(x*BLOCK, y*BLOCK, BLOCK, BLOCK);
        } else {
          ctx.fillStyle = '#0a1020';
          ctx.fillRect(x*BLOCK, y*BLOCK, BLOCK, BLOCK);
          ctx.strokeStyle = '#1f2937';
          ctx.strokeRect(x*BLOCK, y*BLOCK, BLOCK, BLOCK);
        }
      }
    }
    // current piece
    if(current){
      for(const b of current.blocks){
        if(b.y>=0){
          ctx.fillStyle = COLORS[current.piece.colorIndex];
          ctx.fillRect(b.x*BLOCK, b.y*BLOCK, BLOCK, BLOCK);
          ctx.strokeStyle = '#000';
          ctx.strokeRect(b.x*BLOCK, b.y*BLOCK, BLOCK, BLOCK);
        }
      }
    }
  }

  function render(){
    drawBoard();
  }

  function gameLoop(ts){
    if(!running) return;
    if(!lastTime) lastTime = ts;
    const delta = ts - lastTime;
    lastTime = ts;
    dropCounter += delta;
    if(dropCounter >= dropInterval){
      dropCounter = 0;
      // move piece down by 1
      const nextBlocks = current.blocks.map(b => ({ x: b.x, y: b.y + 1 }));
      if(canPlace(nextBlocks)){
        current.blocks = nextBlocks;
      } else {
        placeCurrent();
        clearLines();
        current = spawnPiece();
        if(!current){ running = false; pauseBtn.disabled = true; startBtn.disabled = false; }
        canHold = true;
      }
    }
    render();
    requestAnimationFrame(gameLoop);
  }

  // Input handling
  window.addEventListener('keydown', (e) => {
    if(!running || !current) return;
    if(e.key === 'ArrowLeft'){
      const nextBlocks = current.blocks.map(b => ({ x: b.x - 1, y: b.y }));
      if(canPlace(nextBlocks)) current.blocks = nextBlocks;
    } else if(e.key === 'ArrowRight'){
      const nextBlocks = current.blocks.map(b => ({ x: b.x + 1, y: b.y }));
      if(canPlace(nextBlocks)) current.blocks = nextBlocks;
    } else if(e.key === 'ArrowDown'){
      const nextBlocks = current.blocks.map(b => ({ x: b.x, y: b.y + 1 }));
      if(canPlace(nextBlocks)) current.blocks = nextBlocks; else { placeCurrent(); clearLines(); current = spawnPiece(); if(!current){ running=false; pauseBtn.disabled=true; startBtn.disabled=false; } canHold = true; }
    } else if(e.key === 'ArrowUp'){
      // rotate
      let nextRotation = (current.rotation + 1) % 4; // rough rotation state
      // apply rotation to blocks around origin by recomputing with rotated coords
      const rotated = current.piece.blocks.map(p => ({ x: p.x, y: p.y }));
      for(let i=0;i<nextRotation;i++) rotated.forEach((p,idx)=>{ const t={x:-p.y, y:p.x}; rotated[idx]=t; });
      // translate to origin
      const originX = current.originX;
      const originY = current.originY;
      const newBlocks = rotated.map(b => ({ x: b.x + originX, y: b.y + originY }));
      if(canPlace(newBlocks)){
        current.blocks = newBlocks;
        current.rotation = nextRotation;
      }
    } else if(e.code === 'Space'){
      e.preventDefault(); hardDrop();
    } else if(e.key.toLowerCase() === 'p'){
      togglePause();
    }
  });

  function togglePause(){
    if(!running) return;
    running = !running;
    if(running){ lastTime = 0; pauseBtn.textContent = 'Pause'; pauseBtn.disabled = false; requestAnimationFrame(gameLoop); }
    else { pauseBtn.textContent = 'Resume'; pauseBtn.disabled = false; }
  }

  // Button handlers
  startBtn.addEventListener('click', () => {
    resetGame();
    running = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    pauseBtn.textContent = 'Pause';
    requestAnimationFrame(gameLoop);
  });

  pauseBtn.addEventListener('click', () => {
    togglePause();
  });

  function resetGame(){
    board = createBoard();
    score = 0; level = 1; lines = 0;
    scoreEl.textContent = score;
    levelEl.textContent = level;
    linesEl.textContent = lines;
    current = spawnPiece();
    lastTime = 0; dropCounter = 0; dropInterval = 1000; canHold = true;
  }

  // Initialize
  function init(){
    resetGame();
    // draw initial empty board
    ctx.clearRect(0,0,canvas.width, canvas.height);
  }

  // Start on load
  init();
})();
