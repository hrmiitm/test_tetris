(function(){
  // Tetris - pure JS, no framework
  const COLS = 10;
  const ROWS = 20;
  const BLOCK = 24; // px per cell
  const COLORS = [null, '#00f0f0', '#0000f0', '#f0a000', '#ffbf00', '#00ff66', '#aa00ff', '#ff0066'];
  // Shapes: 4x4 matrices
  const SHAPES = [
    // I
    [
      [0,0,0,0],
      [1,1,1,1],
      [0,0,0,0],
      [0,0,0,0]
    ],
    // J
    [
      [2,0,0,0],
      [2,2,2,0],
      [0,0,0,0],
      [0,0,0,0]
    ],
    // L
    [
      [0,0,3,0],
      [3,3,3,0],
      [0,0,0,0],
      [0,0,0,0]
    ],
    // O
    [
      [0,4,4,0],
      [0,4,4,0],
      [0,0,0,0],
      [0,0,0,0]
    ],
    // S
    [
      [0,0,0,0],
      [0,5,5,0],
      [5,5,0,0],
      [0,0,0,0]
    ],
    // T
    [
      [0,6,0,0],
      [6,6,6,0],
      [0,0,0,0],
      [0,0,0,0]
    ],
    // Z
    [
      [7,7,0,0],
      [0,7,7,0],
      [0,0,0,0],
      [0,0,0,0]
    ]
  ];
  // Note: we used numbers to map to colors; 0 means empty.

  const board = Array.from({length: ROWS}, ()=>Array(COLS).fill(0));
  let current = null;
  let nextIndex = Math.floor(Math.random()*SHAPES.length);
  let score = 0;
  let lines = 0;
  let level = 1;
  let paused = false;
  let gameOver = false;
  let dropAccum = 0;
  let lastTime = 0;

  const boardEl = document.getElementById('board');
  const nextEl = document.getElementById('next');
  const scoreEl = document.getElementById('score');
  const linesEl = document.getElementById('lines');
  const levelEl = document.getElementById('level');
  const overlay = document.getElementById('overlay');
  const overlayScore = document.getElementById('overlayScore');
  const restartBtn = document.getElementById('restartBtn');
  const overlayRestart = document.getElementById('overlayRestart');
  const restart = ()=>{ newGame(); }

  // Canvas contexts
  const ctxBoard = boardEl.getContext('2d');
  const ctxNext = nextEl.getContext('2d');

  function newGame(){
    for(let r=0;r<ROWS;r++) board[r].fill(0);
    score = 0; lines = 0; level = 1; paused = false; gameOver = false; dropAccum = 0; lastTime = 0;
    current = null;
    nextIndex = Math.floor(Math.random()*SHAPES.length);
    spawnPiece();
    updateHud();
    overlay.hidden = true;
    loop(0);
  }

  function spawnPiece(){
    const type = nextIndex;
    const piece = SHAPES[type];
    current = {
      matrix: piece.map(r=>r.slice()),
      x: Math.floor((COLS - 4)/2),
      y: -2,
      type: type
    };
    // prepare next
    nextIndex = Math.floor(Math.random()*SHAPES.length);
    // if cannot place, game over
    if(!isValidPosition(current.matrix, current.x, current.y)){
      gameOver = true;
      endGame();
    }
  }

  function isValidPosition(matrix, dx, dy){
    for(let i=0;i<4;i++){
      for(let j=0;j<4;j++){
        if(matrix[i][j]===0) continue;
        const x = dx + j;
        const y = dy + i;
        if(x<0 || x>=COLS) return false;
        if(y>=ROWS) return false;
        if(y>=0 && board[y][x] !== 0) return false;
      }
    }
    return true;
  }

  function rotateMatrix(m){
    const res = Array.from({length:4}, ()=>Array(4).fill(0));
    for(let i=0;i<4;i++){
      for(let j=0;j<4;j++){
        res[j][3-i] = m[i][j];
      }
    }
    return res;
  }

  function rotatePiece(){
    const rotated = rotateMatrix(current.matrix);
    // Try wall kicks
    const kicks = [0, -1, 1, -2, 2];
    for(let k of kicks){
      const nx = current.x + k;
      if(isValidPosition(rotated, nx, current.y)){
        current.x = nx;
        current.matrix = rotated;
        return;
      }
    }
  }

  function mergeToBoard(){
    for(let i=0;i<4;i++){
      for(let j=0;j<4;j++){
        if(current.matrix[i][j]===0) continue;
        const x = current.x + j;
        const y = current.y + i;
        if(y>=0){
          board[y][x] = current.type + 1;
        }
      }
    }
  }

  function clearLines(){
    let cleared = 0;
    outer: for(let r=ROWS-1; r>=0; r--){
      for(let c=0;c<COLS;c++){
        if(board[r][c]===0){
          continue outer;
        }
      }
      // row full -> remove
      board.splice(r,1);
      board.unshift(Array(COLS).fill(0));
      cleared++;
      r++;// check same index after shift
    }
    if(cleared>0){
      const pts = [0,40,100,300,1200]; // index is number of lines
      score += pts[cleared] * level;
      lines += cleared;
      level = Math.floor(lines / 10) + 1;
    }
  }

  function dropOne(){
    current.y += 1;
    if(!isValidPosition(current.matrix, current.x, current.y)){
      current.y -= 1;
      mergeToBoard();
      clearLines();
      spawnPiece();
    }
  }

  function hardDrop(){
    while(isValidPosition(current.matrix, current.x, current.y+1)){
      current.y += 1;
    }
    mergeToBoard();
    clearLines();
    spawnPiece();
  }

  function updateHud(){
    scoreEl.textContent = score;
    linesEl.textContent = lines;
    levelEl.textContent = level;
  }

  function drawBoard(){
    ctxBoard.clearRect(0,0, boardEl.width, boardEl.height);
    // draw grid background
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        const v = board[r][c];
        if(v===0) continue;
        ctxBoard.fillStyle = COLORS[v] || '#fff';
        ctxBoard.fillRect(c*BLOCK, r*BLOCK, BLOCK, BLOCK);
        ctxBoard.strokeStyle = '#000';
        ctxBoard.lineWidth = 1;
        ctxBoard.strokeRect(c*BLOCK+0.5, r*BLOCK+0.5, BLOCK-1, BLOCK-1);
      }
    }
    // draw current piece
    if(current){
      for(let i=0;i<4;i++){
        for(let j=0;j<4;j++){
          if(current.matrix[i][j]===0) continue;
          const x = current.x + j;
          const y = current.y + i;
          if(y<0) continue;
          ctxBoard.fillStyle = COLORS[current.type+1];
          ctxBoard.fillRect(x*BLOCK, y*BLOCK, BLOCK, BLOCK);
          ctxBoard.strokeStyle = '#000';
          ctxBoard.lineWidth = 1;
          ctxBoard.strokeRect(x*BLOCK+0.5, y*BLOCK+0.5, BLOCK-1, BLOCK-1);
        }
      }
    }
  }

  function drawNext(){
    ctxNext.clearRect(0,0,nextEl.width,nextEl.height);
    const shape = SHAPES[nextIndex];
    for(let i=0;i<4;i++){
      for(let j=0;j<4;j++){
        if(shape[i][j]===0) continue;
        ctxNext.fillStyle = COLORS[nextIndex+1];
        ctxNext.fillRect(j*20, i*20, 20, 20);
        ctxNext.strokeStyle = '#000';
        ctxNext.lineWidth = 1;
        ctxNext.strokeRect(j*20+0.5, i*20+0.5, 19, 19);
      }
    }
  }

  function endGame(){
    overlayScore.textContent = score;
    overlay.hidden = false;
  }

  function loop(ts){
    if(lastTime === 0) lastTime = ts;
    const delta = ts - lastTime;
    lastTime = ts;
    if(!paused && !gameOver){
      dropAccum += delta;
      const dropMs = Math.max(100, 700 - (level-1)*40);
      if(dropAccum >= dropMs){
        dropAccum = 0;
        dropOne();
      }
      drawBoard();
      updateHud();
      drawNext();
      requestAnimationFrame(loop);
    } else {
      // When paused or game over, still render UI
      drawBoard();
      drawNext();
      requestAnimationFrame(loop);
    }
  }

  // Input handling
  window.addEventListener('keydown', (e)=>{
    if(gameOver){
      if(e.key === 'R' || e.key === 'r') { newGame(); }
      return;
    }
    if(e.key === 'p' || e.key === 'P'){
      paused = !paused;
      e.preventDefault();
      return;
    }
    if(paused) return;
    switch(e.key){
      case 'ArrowLeft':
        if(isValidPosition(current.matrix, current.x - 1, current.y)) current.x -= 1;
        break;
      case 'ArrowRight':
        if(isValidPosition(current.matrix, current.x + 1, current.y)) current.x += 1;
        break;
      case 'ArrowDown':
        if(isValidPosition(current.matrix, current.x, current.y + 1)) current.y += 1; else { mergeToBoard(); clearLines(); spawnPiece(); }
        break;
      case 'ArrowUp':
        rotatePiece();
        break;
      case ' ': // Space hard drop
        hardDrop();
        break;
      case 'R':
      case 'r':
        newGame();
        break;
    }
  });

  restartBtn.addEventListener('click', ()=>{ newGame(); });
  overlayRestart.addEventListener('click', ()=>{ newGame(); });

  // Init
  function init(){
    // resize canvases to desired pixel ratio if needed
    boardEl.width = COLS * BLOCK;
    boardEl.height = ROWS * BLOCK;
    nextEl.width = 80; nextEl.height = 80;
    newGame();
  }

  // Start
  init();
})();
