const GAME_HEIGHT = 570;
const GAME_WIDTH = 350;
const MAX_BALLS = 20;
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 30;
const COLLISION_PADDING = 6;
const FONT="Helvetica"

let balls = [];
let player;
let spawnCooldown = 0;
let paused = false;
let level = 1;
let levelText;
let dodgedballs = 0;
let dodgedText;
let gameover = false;
let countdown = 5;
let intervalId;
const colors = [
  "green",
  "blue",
  "orange",
  "red",
  "purple",
  "brown",
  "black",
  "pink",
];

const pressedKeys = new Set();

/* ================= INPUT ================= */

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    paused = !paused;
    return;
  }
  if (["Shift", "Control", "Alt"].includes(e.key)) return;
  pressedKeys.add(e.key.toLowerCase());
});

document.addEventListener("keyup", (e) => {
  pressedKeys.delete(e.key.toLowerCase());
});

/* ================= GAME START ================= */

function startGame() {
  gamearea.start();
  player = new Rectangle(PLAYER_WIDTH, PLAYER_HEIGHT, "teal", 10, 520, 3);
  requestAnimationFrame(tick);
  setInterval(() => {
    level = level + 1;
  }, 30000);
}

/* ================= GAME LOOP ================= */

function tick() {
  let ctx = gamearea.context;
  drawBG();
  levelText = new LevelText(5, 10, "red", "Level: " + level);
  dodgedText = new LevelText(280, 10, "green", "Score: " + dodgedballs);

  // updateText()
  if (!paused && !gameover) {
    spawnBalls();
    updatePosition(player);

    balls.forEach((ball) => {
      ball.move();
      ball.draw();
    });

    removeBalls();

    if (checkCollision()) {
      gameover = true;

      intervalId ??= setInterval(() => {
        countdown = countdown - 1;
        if (countdown === 0) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 1000);
      setTimeout(() => {
        gamearea.restart();
        gameover = false;
      }, 5000);
    }
    player.draw();
    levelText.draw();
    dodgedText.draw();
  }
  if (paused) drawPauseText();
  if (gameover) drawGameOverText();

  requestAnimationFrame(tick);
}

/* ================= BALL LOGIC ================= */

function spawnBalls() {
  if (spawnCooldown > 0) {
    spawnCooldown--;
    return;
  }

  if (balls.length < MAX_BALLS) {
    let ballSize = getRandomInt(3, 8);
    let x = getRandomInt(ballSize, GAME_WIDTH - ballSize);
    let y = -ballSize;

    let speed = getRandomInt(1, level + 5);
    let color = colors[getRandomInt(0, colors.length - 1)];
    balls.push(new Circle(x, y, ballSize, color, color, 0, speed));
    spawnCooldown = 30;
  }
}

function removeBalls() {
  let curlen = balls.length;
  balls = balls.filter((ball) => ball.y - ball.radius <= GAME_HEIGHT);
  let newlen = balls.length;
  dodgedballs += curlen - newlen;
}

function checkCollision() {
  return balls.some((ball) => {
    const rectX = player.x + COLLISION_PADDING;
    const rectY = player.y + COLLISION_PADDING;
    const rectW = PLAYER_WIDTH - COLLISION_PADDING * 2;
    const rectH = PLAYER_HEIGHT - COLLISION_PADDING * 2;

    const closestX = Math.max(rectX, Math.min(ball.x, rectX + rectW));
    const closestY = Math.max(rectY, Math.min(ball.y, rectY + rectH));

    const dx = ball.x - closestX;
    const dy = ball.y - closestY;

    return dx * dx + dy * dy <= ball.radius * ball.radius;
  });
}

/* ================= PLAYER ================= */

function updatePosition(shape) {
  let dx = 0;

  if (pressedKeys.has("a") || pressedKeys.has("arrowleft")) dx -= shape.speed;
  if (pressedKeys.has("d") || pressedKeys.has("arrowright")) dx += shape.speed;

  shape.x += dx;

  shape.x = Math.max(0, Math.min(GAME_WIDTH - shape.width, shape.x));
}

/* ================= CANVAS ================= */

var gamearea = {
  canvas: document.createElement("canvas"),
  start: function () {
    this.canvas.width = GAME_WIDTH;
    this.canvas.height = GAME_HEIGHT;
    this.context = this.canvas.getContext("2d");
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
  },
  restart: function () {
    balls = [];
    spawnCooldown = 0;
    level = 1;
    dodgedballs = 0;
    countdown = 5;
  },
};

/* ================= CLASSES ================= */

class Rectangle {
  constructor(width, height, color, x, y, speed) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = speed;
  }

  draw() {
    let ctx = gamearea.context;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Circle {
  constructor(x, y, radius, fillcolor, strokecolor, outerwidth, speed) {
    this.radius = radius;
    this.x = x;
    this.y = y;
    this.fillcolor = fillcolor;
    this.strokecolor = strokecolor;
    this.outerwidth = outerwidth;
    this.speed = speed;
  }

  draw() {
    let ctx = gamearea.context;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.fillcolor;
    ctx.fill();
    ctx.lineWidth = this.outerwidth;
    ctx.strokeStyle = this.strokecolor;
    ctx.stroke();
  }

  move() {
    this.y += this.speed;
  }
}

class LevelText {
  constructor(x, y, color, content) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.content = content;
  }

  draw() {
    let ctx = gamearea.context;
    ctx.font = "12px "+FONT;
    ctx.fillStyle = this.color;
    ctx.fillText(this.content, this.x, this.y);
  }
}

/* ================= UTILS ================= */

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function drawPauseText() {
  const ctx = gamearea.context;
  ctx.font = "30px "+FONT;
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.textAlign = "center";
  ctx.fillText("PAUSED", GAME_WIDTH / 2, GAME_HEIGHT / 2);
  ctx.textAlign = "left";
}

function drawGameOverText() {
  const ctx = gamearea.context;
  ctx.font = "30px "+FONT;
  ctx.fillStyle = "darkred";
  ctx.textAlign = "center";
  ctx.fillText("You got hit!", GAME_WIDTH / 2, GAME_HEIGHT / 2);
  ctx.font = "15px "+FONT;
  ctx.fillStyle = "black";
  ctx.fillText(
    "The game will restart in " + countdown + " seconds. Get ready!",
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2 + 20
  );
  ctx.textAlign = "left";
}

function drawBG() {
  const ctx = gamearea.context;

  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, "#f2f4f7");
  gradient.addColorStop(1, "#d9dde3");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  const g = ctx.createRadialGradient(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    50,
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    GAME_WIDTH
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.15)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}
