// Simple, self-contained Tic Tac Toe game for static GitHub Pages
(() => {
  const tttGrid = document.getElementById('ttt');
  const cells = Array.from(tttGrid.querySelectorAll('button'));
  const statusEl = document.getElementById('tttStatus');
  const resetBtn = document.getElementById('tttResetBtn');

  let board = Array(9).fill(0); // 0 empty, 1 X, 2 O
  let currentPlayer = 1;
  let gameOver = false;

  const WIN_LINES = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6] // diagonals
  ];

  function cellUI(idx){
    const v = board[idx];
    const el = cells[idx];
    el.textContent = v===1 ? 'X' : v===2 ? 'O' : '';
    if(v===1) el.style.color = '#0ea5e9';
    if(v===2) el.style.color = '#f472b6';
  }

  function checkWin() {
    for(const line of WIN_LINES){
      const [a,b,c] = line;
      if(board[a]!==0 && board[a]===board[b] && board[a]===board[c]){
        // highlight winning cells
        cells[a].classList.add('win');
        cells[b].classList.add('win');
        cells[c].classList.add('win');
        return board[a];
      }
    }
    return 0;
  }

  function resetBoard(){
    board.fill(0);
    gameOver = false;
    currentPlayer = 1;
    statusEl.textContent = "Player X's turn";
    cells.forEach(c => c.classList.remove('win'));
    cells.forEach((_,i)=>{ cellUI(i); cells[i].disabled = false; });
  }

  function updateStatus(){
    if(gameOver) return;
    statusEl.textContent = currentPlayer===1 ? "Player X's turn" : "Player O's turn";
  }

  // Attach click handlers
  cells.forEach((cell, idx) => {
    cell.addEventListener('click', () => {
      if(board[idx] !== 0 || gameOver) return;
      board[idx] = currentPlayer;
      cellUI(idx);
      const winner = checkWin();
      if(winner !== 0){
        gameOver = true;
        statusEl.textContent = winner===1 ? 'X wins!' : 'O wins!';
        cells.forEach((c,i)=>{ if(board[i]===0) c.disabled = true; else c.disabled = true; });
      } else if(board.every(v => v!==0)){
        gameOver = true;
        statusEl.textContent = 'Draw!';
      } else {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateStatus();
      }
    });
  });

  resetBtn.addEventListener('click', resetBoard);

  // Initialize on load
  resetBoard();
})();
