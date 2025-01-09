const canvas = document.getElementById('gameCanvas');
canvas.width = 474;
canvas.height = 474;
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const eatenCountElement = document.getElementById('eatenCount');
const menuScreen = document.getElementById('menuScreen');
const difficultySelect = document.getElementById('difficultySelect');
const gridSizeSelect = document.getElementById('gridSizeSelect');
const startGameBtn = document.getElementById('startGameBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const instructionsBtn = document.getElementById('instructionsBtn');
const instructionsModal = document.getElementById('instructionsModal');
const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');
const homeBtn = document.getElementById('homeBtn');
let tileCount = 8;
let gridSize = canvas.width / tileCount;
let gameSpeed = 200;
let score = 0;
let gameActive = true;
let lastMoveTime = Date.now();
const moveDelay = 100;
let maxSnakeLength;
let timeScore = 1000;
let gameOver = false;
let difficulty = 'easy';
let pathUpdateFrequency = 1;
let reactionSpeed = 1;
const backgroundMusic = document.getElementById('backgroundMusic');
const musicToggle = document.getElementById('musicToggle');
let isMusicPlaying = false;
const moveSound = document.getElementById('moveSound');
const buttonClickSound = document.getElementById('buttonClickSound');
const deathSound = document.getElementById('deathSound');
const eatenSound = document.getElementById('eatenSound');
function playSound(sound) {
  sound.currentTime = 0;
  sound.volume = 0.3;
  sound.play().catch(err => console.log('Sound play prevented:', err));
}
class Snake {
  constructor(color = '#00ff00', startX = 10, startY = 10) {
    this.color = color;
    this.reset(startX, startY);
    this.maxLength = maxSnakeLength;
    this.lastX = startX;
    this.lastY = startY;
    this.length = 2;
  }
  reset(startX = 10, startY = 10) {
    this.x = startX;
    this.y = startY;
    this.body = [];
    this.length = 2;
    this.dx = 0;
    this.dy = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.lastX = startX;
    this.lastY = startY;
    this.body.push({
      x: startX - 1,
      y: startY
    });
  }
  checkCollision() {
    for (let snake of snakes) {
      if (snake.x === player.x && snake.y === player.y) {
        gameOver = true;
        playSound(deathSound);
        endGame();
        const notification = document.getElementById('eatenNotification');
        notification.style.display = 'block';
        setTimeout(() => {
          notification.style.display = 'none';
        }, 2000);
        return;
      }
    }
  }
  getShortestPath(fromX, fromY, toX, toY) {
    let deltaX = toX - fromX;
    let deltaY = toY - fromY;
    return {
      x: deltaX,
      y: deltaY
    };
  }
  isValidMove(newDx, newDy) {
    const nextX = this.x + newDx;
    const nextY = this.y + newDy;
    if (nextX < 0 || nextX >= tileCount || nextY < 0 || nextY >= tileCount) {
      return false;
    }
    for (let bodyPart of this.body) {
      if (nextX === bodyPart.x && nextY === bodyPart.y) {
        return false;
      }
    }
    for (let snake of snakes) {
      if (snake === this) continue;
      if (nextX === snake.x && nextY === snake.y) {
        return false;
      }
      for (let part of snake.body) {
        if (nextX === part.x && nextY === part.y) {
          return false;
        }
      }
    }
    return true;
  }
  update(playerX, playerY) {
    if (Math.random() < pathUpdateFrequency) {
      const path = this.getShortestPath(this.x, this.y, playerX, playerY);
      if (Math.abs(path.x) > Math.abs(path.y)) {
        this.dx = path.x > 0 ? 1 : -1;
        this.dy = 0;
      } else {
        this.dx = 0;
        this.dy = path.y > 0 ? 1 : -1;
      }
      const nextX = this.x + this.dx;
      const nextY = this.y + this.dy;
      if (nextX < 0 || nextX >= tileCount || nextY < 0 || nextY >= tileCount || !this.isValidMove(this.dx, this.dy)) {
        if (this.dx !== 0) {
          this.dx = 0;
          this.dy = path.y > 0 ? 1 : -1;
        } else {
          this.dx = path.x > 0 ? 1 : -1;
          this.dy = 0;
        }
        const altX = this.x + this.dx;
        const altY = this.y + this.dy;
        if (altX < 0 || altX >= tileCount || altY < 0 || altY >= tileCount || !this.isValidMove(this.dx, this.dy)) {
          const directions = [{
            dx: 1,
            dy: 0
          }, {
            dx: -1,
            dy: 0
          }, {
            dx: 0,
            dy: 1
          }, {
            dx: 0,
            dy: -1
          }];
          let moved = false;
          for (let dir of directions) {
            const testX = this.x + dir.dx;
            const testY = this.y + dir.dy;
            if (testX >= 0 && testX < tileCount && testY >= 0 && testY < tileCount && this.isValidMove(dir.dx, dir.dy)) {
              this.dx = dir.dx;
              this.dy = dir.dy;
              moved = true;
              break;
            }
          }
          if (!moved) {
            this.dx = 0;
            this.dy = 0;
          }
        }
      }
    }
    this.lastX = this.x;
    this.lastY = this.y;
    if ((this.dx !== 0 || this.dy !== 0) && this.isValidMove(this.dx, this.dy)) {
      const nextX = this.x + this.dx;
      const nextY = this.y + this.dy;
      if (nextX >= 0 && nextX < tileCount && nextY >= 0 && nextY < tileCount) {
        this.body.unshift({
          x: this.x,
          y: this.y
        });
        while (this.body.length > Math.min(this.length, this.maxLength)) {
          this.body.pop();
        }
        this.x = nextX;
        this.y = nextY;
      }
    }
  }
  draw() {
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    for (let part of this.body) {
      ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    }
    ctx.fillRect(this.x * gridSize, this.y * gridSize, gridSize - 2, gridSize - 2);
    ctx.shadowBlur = 0;
  }
  getPossiblePlayerMoves(playerX, playerY) {
    const moves = [];
    const directions = [{
      x: 0,
      y: 1
    }, {
      x: 1,
      y: 0
    }, {
      x: 0,
      y: -1
    }, {
      x: -1,
      y: 0
    }];
    for (let dir of directions) {
      const newX = playerX + dir.x;
      const newY = playerY + dir.y;
      if (newX >= 0 && newX < tileCount && newY >= 0 && newY < tileCount) {
        let valid = true;
        for (let snake of snakes) {
          if (snake.x === newX && snake.y === newY) {
            valid = false;
            break;
          }
          for (let part of snake.body) {
            if (part.x === newX && part.y === newY) {
              valid = false;
              break;
            }
          }
          if (!valid) break;
        }
        if (valid) {
          moves.push({
            x: newX,
            y: newY
          });
        }
      }
    }
    return moves;
  }
}
class Player {
  constructor() {
    this.spawn();
    this.currentDx = 0;
    this.currentDy = 0;
  }
  spawn() {
    let newX = Math.floor(Math.random() * tileCount);
    let newY = Math.floor(Math.random() * tileCount);
    while (!this.isValidSpawnPosition(newX, newY)) {
      newX = Math.floor(Math.random() * tileCount);
      newY = Math.floor(Math.random() * tileCount);
    }
    this.x = newX;
    this.y = newY;
    this.currentDx = 0;
    this.currentDy = 0;
  }
  isValidSpawnPosition(x, y) {
    for (let snake of snakes) {
      if (snake.x === x && snake.y === y) {
        return false;
      }
      for (let part of snake.body) {
        if (part.x === x && part.y === y) {
          return false;
        }
      }
    }
    return true;
  }
  move(dx, dy) {
    const currentTime = Date.now();
    if (this.currentDx !== 0 || this.currentDy !== 0) {
      if (currentTime - lastMoveTime < moveDelay) {
        return;
      }
    }
    this.currentDx = dx;
    this.currentDy = dy;
    let newX = this.x + dx;
    let newY = this.y + dy;
    if (newX < 0 || newX >= tileCount || newY < 0 || newY >= tileCount) {
      return;
    }
    playSound(moveSound);
    this.x = newX;
    this.y = newY;
    lastMoveTime = currentTime;
  }
  draw() {
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(this.x * gridSize, this.y * gridSize, gridSize - 2, gridSize - 2);
    ctx.shadowBlur = 0;
  }
}
let snakes = [new Snake()];
const player = new Player();
function checkCollision() {
  for (let snake of snakes) {
    if (snake.x === player.x && snake.y === player.y) {
      playSound(eatenSound);
      score++;
      timeScore = Math.max(0, timeScore - 100);
      eatenCountElement.textContent = `Times Eaten: ${score}`;
      scoreElement.textContent = `Time: ${timeScore}`;
      if (score >= 10) {
        gameOver = true;
        endGame();
        return;
      }
      if (snake.length < snake.maxLength) {
        snake.length += 1;
      }
      player.spawn();
    }
  }
}
function gameLoop() {
  if (gameOver) {
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#333';
  for (let i = 0; i < tileCount; i++) {
    for (let j = 0; j < tileCount; j++) {
      ctx.strokeRect(i * gridSize, j * gridSize, gridSize, gridSize);
    }
  }
  scoreElement.textContent = `Time: ${timeScore}`;
  if (timeScore <= 0) {
    gameOver = true;
    menuScreen.style.display = 'flex';
    return;
  }
  for (let snake of snakes) {
    snake.update(player.x, player.y);
  }
  checkCollision();
  player.draw();
  for (let snake of snakes) {
    snake.draw();
  }
  if (!gameOver) {
    setTimeout(() => requestAnimationFrame(gameLoop), gameSpeed);
  }
}
function endGame() {
  gameOver = true;
  const gameOverScreen = document.getElementById('gameOverScreen');
  gameOverScreen.style.display = 'flex';
  document.getElementById('homeBtn').style.display = 'none';
  document.getElementById('backToMenuBtn').style.display = 'none';
  if (score >= 10) {
    document.getElementById('gameOverText').style.display = 'block';
  }
  if (isMusicPlaying) {
    backgroundMusic.pause();
    isMusicPlaying = false;
  }
}
startGameBtn.addEventListener('click', () => {
  instructionsModal.style.display = 'none';
  playSound(buttonClickSound);
  document.getElementById('eatenNotification').style.display = 'none';
  document.getElementById('gameOverText').style.display = 'none';
  backgroundMusic.play();
  isMusicPlaying = true;
  tileCount = parseInt(gridSizeSelect.value);
  gridSize = canvas.width / tileCount;
  maxSnakeLength = tileCount === 8 ? 4 : tileCount === 16 ? 8 : 16;
  score = 0;
  timeScore = 1000;
  gameOver = false;
  scoreElement.textContent = `Time: ${timeScore}`;
  eatenCountElement.textContent = `Times Eaten: ${score}`;
  player.spawn();
  const snakeStartX = Math.floor(Math.random() * (tileCount - 2)) + 1;
  const snakeStartY = Math.floor(Math.random() * (tileCount - 2)) + 1;
  snakes = [new Snake('#00ff00', snakeStartX, snakeStartY)];
  while (snakes[0].x === player.x && snakes[0].y === player.y) {
    player.spawn();
  }
  menuScreen.style.display = 'none';
  document.getElementById('homeBtn').style.display = 'block';
  document.getElementById('backToMenuBtn').style.display = 'block';
  difficulty = difficultySelect.value;
  switch (difficulty) {
    case 'easy':
      pathUpdateFrequency = 0.3;
      gameSpeed = tileCount === 32 ? 300 : 350;
      break;
    case 'medium':
      pathUpdateFrequency = 0.7;
      gameSpeed = tileCount === 32 ? 150 : 200;
      break;
    case 'hard':
      pathUpdateFrequency = 0.9;
      gameSpeed = tileCount === 32 ? 100 : 150;
      break;
  }
  document.getElementById('eatenNotification').style.display = 'none';
  gameLoop();
});
backToMenuBtn.addEventListener('click', () => {
  playSound(buttonClickSound);
  gameOver = true;
  menuScreen.style.display = 'flex';
  document.getElementById('backToMenuBtn').style.display = 'none';
  if (isMusicPlaying) {
    backgroundMusic.pause();
    isMusicPlaying = false;
  }
  document.getElementById('gameOverScreen').style.display = 'none';
  document.getElementById('eatenNotification').style.display = 'none';
  document.getElementById('homeBtn').style.display = 'none';
});
instructionsBtn.addEventListener('click', () => {
  playSound(buttonClickSound);
  instructionsModal.style.display = 'block';
});
closeInstructionsBtn.addEventListener('click', () => {
  playSound(buttonClickSound);
  instructionsModal.style.display = 'none';
});
homeBtn.addEventListener('click', () => {
  playSound(buttonClickSound);
  gameOver = true;
  menuScreen.style.display = 'flex';
  homeBtn.style.display = 'none';
  document.getElementById('backToMenuBtn').style.display = 'none';
  if (isMusicPlaying) {
    backgroundMusic.pause();
    isMusicPlaying = false;
  }
  document.getElementById('gameOverScreen').style.display = 'none';
  document.getElementById('eatenNotification').style.display = 'none';
  score = 0;
  timeScore = 1000;
  scoreElement.textContent = `Time: ${timeScore}`;
  eatenCountElement.textContent = `Times Eaten: ${score}`;
});
gameLoop();
document.addEventListener('keydown', event => {
  switch (event.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      playSound(moveSound);
      player.move(0, -1);
      break;
    case 's':
    case 'arrowdown':
      playSound(moveSound);
      player.move(0, 1);
      break;
    case 'a':
    case 'arrowleft':
      playSound(moveSound);
      player.move(-1, 0);
      break;
    case 'd':
    case 'arrowright':
      playSound(moveSound);
      player.move(1, 0);
      break;
  }
});
const joystick = document.getElementById('joystick');
const stick = document.getElementById('stick');
let isDragging = false;
let touchOffset = {
  x: 0,
  y: 0
};
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
if (isMobileDevice()) {}
joystick.addEventListener('touchstart', e => {
  e.preventDefault();
});
joystick.addEventListener('touchmove', e => {
  e.preventDefault();
});
joystick.addEventListener('pointerdown', e => {
  isDragging = true;
  const joystickRect = joystick.getBoundingClientRect();
  const stickRect = stick.getBoundingClientRect();
  touchOffset.x = e.clientX - stickRect.left;
  touchOffset.y = e.clientY - stickRect.top;
  stick.setPointerCapture(e.pointerId);
});
joystick.addEventListener('pointermove', e => {
  if (!isDragging) return;
  const joystickRect = joystick.getBoundingClientRect();
  const centerX = joystickRect.width / 2;
  const centerY = joystickRect.height / 2;
  let x = e.clientX - joystickRect.left - touchOffset.x + stick.offsetWidth / 2;
  let y = e.clientY - joystickRect.top - touchOffset.y + stick.offsetHeight / 2;
  const deltaX = x - centerX;
  const deltaY = y - centerY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const maxDistance = joystickRect.width / 2 - stick.offsetWidth / 2;
  if (distance > maxDistance) {
    const angle = Math.atan2(deltaY, deltaX);
    x = centerX + maxDistance * Math.cos(angle);
    y = centerY + maxDistance * Math.sin(angle);
  }
  stick.style.left = `${x - stick.offsetWidth / 2}px`;
  stick.style.top = `${y - stick.offsetHeight / 2}px`;
  const moveX = x - centerX;
  const moveY = y - centerY;
  const threshold = maxDistance * 0.3;
  if (Math.abs(moveX) > Math.abs(moveY) && Math.abs(moveX) > threshold) {
    playSound(moveSound);
    player.move(moveX > 0 ? 1 : -1, 0);
  } else if (Math.abs(moveY) > threshold) {
    playSound(moveSound);
    player.move(0, moveY > 0 ? 1 : -1);
  }
});
joystick.addEventListener('pointerup', e => {
  isDragging = false;
  stick.style.left = '50%';
  stick.style.top = '50%';
  stick.style.transform = 'translate(-50%, -50%)';
});
joystick.addEventListener('pointercancel', e => {
  isDragging = false;
  stick.style.left = '50%';
  stick.style.top = '50%';
  stick.style.transform = 'translate(-50%, -50%)';
});
musicToggle.addEventListener('change', () => {
  if (musicToggle.checked) {
    backgroundMusic.play();
    isMusicPlaying = true;
  } else {
    backgroundMusic.pause();
    isMusicPlaying = false;
  }
});
backgroundMusic.addEventListener('error', e => {
  console.error('Error loading background music:', e);
  backgroundMusic.load();
  backgroundMusic.play().catch(err => {
    console.log('Auto-play prevented:', err);
    musicToggle.disabled = true;
    musicToggle.parentElement.style.opacity = '0.5';
  });
});
document.addEventListener('DOMContentLoaded', () => {
  backgroundMusic.play().catch(err => {
    console.log('Auto-play prevented. User must interact first.');
  });
});
document.addEventListener('click', function unmute() {
  backgroundMusic.muted = false;
  document.removeEventListener('click', unmute);
}, {
  once: true
});
difficultySelect.addEventListener('change', () => {
  playSound(buttonClickSound);
});
gridSizeSelect.addEventListener('change', () => {
  playSound(buttonClickSound);
});
document.getElementById('restartBtn').addEventListener('click', () => {
  playSound(buttonClickSound);
  document.getElementById('gameOverScreen').style.display = 'none';
  document.getElementById('menuScreen').style.display = 'flex';
  document.getElementById('backToMenuBtn').style.display = 'none';
  score = 0;
  timeScore = 1000;
  gameOver = false;
  scoreElement.textContent = `Time: ${timeScore}`;
  eatenCountElement.textContent = `Times Eaten: ${score}`;
  player.spawn();
  snakes = [new Snake()];
  document.getElementById('eatenNotification').style.display = 'none';
  document.getElementById('gameOverText').style.display = 'none';
  if (isMusicPlaying) {
    backgroundMusic.pause();
    isMusicPlaying = false;
  }
});