onst canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 900;
canvas.height = 500;

const COLORS = {
  navy: "#0B132B",
  purple: "#7B2CBF",
  pink: "#171717ff",
  lightBlue: "#5BC0EB",
  orange: "#353432ff",
  yellow: "#FFD700",
  sword: "#FFFFFF",
  boss: "#9b59b6",
  skin: "#292828ff",
  shirt: "#0077ff",
  pants: "#222222",
  hair: "#3a1f0b",
};

let cameraX = 0;

let player = {
  x: 50,
  y: 380,
  width: 40,
  height: 60,
  health: 3,
  maxHealth: 3,
  isAlive: true,
  swordEquipped: false,
  swordActive: false,
  velocityX: 0,
  velocityY: 0,
  gravity: 0.8,
  jumpStrength: 15,
  onGround: false,
  invincible: false,
  invincibilityTimer: 0,
};

const platforms = [];
for (let i = 0; i < 50; i++) {
  platforms.push({
    x: i * 200,
    y: 400 - Math.sin(i / 2) * 80,
    width: 150,
    height: 20,
  });
}

platforms.push({
  x: -1000,
  y: 440,
  width: 5000,
  height: 60,
});

const boosts = [];
for (let i = 0; i < platforms.length; i += 5) {
  boosts.push({
    x: platforms[i].x + 50,
    y: platforms[i].y - 20,
    width: 20,
    height: 20,
  });
}

const enemies = [];
const miniMonsters = [];

for (let i = 5; i < platforms.length; i += 4) {
  enemies.push({
    x: platforms[i].x + 30,
    y: platforms[i].y - 40,
    width: 40,
    height: 40,
    speed: 1 + Math.random(),
  });
  miniMonsters.push({
    x: platforms[i].x + 80,
    y: platforms[i].y - 30,
    width: 30,
    height: 30,
    speed: 1.5 + Math.random(),
  });
}

const boss = {
  x: platforms[platforms.length - 1].x + 400,
  y: 300,
  width: 120,
  height: 120,
  health: 15,
  laserCooldown: 0,
};

const keys = { a: false, d: false, w: false, s: false, h: false };
let levelTimer = 0;
let timerInterval = null;
let gameOver = false;

function resetLevel() {
  player.x = 50;
  player.y = 380;
  player.health = player.maxHealth;
  player.isAlive = true;
  player.velocityX = 0;
  player.velocityY = 0;
  player.onGround = false;
  player.invincible = false;
  player.invincibilityTimer = 0;
  player.swordActive = false;
  player.swordEquipped = false;

  enemies.forEach((e, i) => {
    e.x = platforms[5 + i * 4].x + 30;
    e.y = platforms[5 + i * 4].y - 40;
  });

  miniMonsters.forEach((m, i) => {
    m.x = platforms[5 + i * 4].x + 80;
    m.y = platforms[5 + i * 4].y - 30;
  });

  boss.health = 15;
  boss.laserCooldown = 0;

  cameraX = 0;
  clearInterval(timerInterval);
  levelTimer = 0;
  startTimer();

  gameOver = false;
}

function startTimer() {
  timerInterval = setInterval(() => {
    if (!gameOver) levelTimer++;
  }, 1000);
}

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "a") keys.a = true;
  if (key === "d") keys.d = true;
  if (key === "w" && player.onGround && player.isAlive) {
    player.velocityY = -player.jumpStrength;
    player.onGround = false;
  }
  if (key === "s") player.swordEquipped = true;
  if (key === "h" && player.swordEquipped && player.isAlive) {
    player.swordActive = true;
    checkSwordHit();
    setTimeout(() => (player.swordActive = false), 200);
  }
});

document.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  if (key === "a") keys.a = false;
  if (key === "d") keys.d = false;
});

function updatePlayer() {
  if (keys.a) player.x -= 5;
  if (keys.d) player.x += 5;

  cameraX = player.x - canvas.width / 2 + player.width / 2;

  player.velocityY += player.gravity;
  player.y += player.velocityY;
  player.onGround = false;

  platforms.forEach((p) => {
    if (
      player.x < p.x + p.width &&
      player.x + player.width > p.x &&
      player.y + player.height <= p.y + 10 &&
      player.y + player.height + player.velocityY >= p.y
    ) {
      player.y = p.y - player.height;
      player.velocityY = 0;
      player.onGround = true;
    }
  });

  boosts.forEach((b) => {
    if (collision(player, b)) b.x = -100;
  });

  if (player.invincible) {
    player.invincibilityTimer--;
    if (player.invincibilityTimer <= 0) player.invincible = false;
  }
}

function moveEnemies() {
  enemies.forEach((enemy) => {
    enemy.x += Math.sin(levelTimer / 50) * 0.5 - enemy.speed / 2;
    if (collision(player, enemy) && !player.invincible) {
      player.health -= 1;
      player.invincible = true;
      player.invincibilityTimer = 60;
      if (player.health <= 0) playerDies();
    }
  });

  miniMonsters.forEach((monster) => {
    monster.x += Math.sin(levelTimer / 50) * 0.7 - monster.speed / 2;
    if (collision(player, monster) && !player.invincible) {
      player.health -= 1;
      player.invincible = true;
      player.invincibilityTimer = 60;
      if (player.health <= 0) playerDies();
    }
  });
}

let bossLasers = [];
function bossAttack() {
  if (boss.laserCooldown <= 0 && player.isAlive) {
    bossLasers.push({
      x: boss.x + boss.width / 2 - 2,
      y: boss.y + boss.height,
      width: 5,
      height: 20,
    });
    boss.laserCooldown = 300;
  } else {
    boss.laserCooldown--;
  }

  bossLasers.forEach((laser, i) => {
    laser.y += 5;
    if (collisionRect(player, laser) && !player.invincible) {
      player.health -= 1;
      player.invincible = true;
      player.invincibilityTimer = 60;
      if (player.health <= 0) playerDies();
      bossLasers.splice(i, 1);
    }
    if (laser.y > canvas.height) bossLasers.splice(i, 1);
  });
}

function collision(a, b) {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}
function collisionRect(a, b) {
  return collision(a, b);
}

function checkSwordHit() {
  const swordHitBox = {
    x: player.x + player.width,
    y: player.y + player.height / 4,
    width: 30,
    height: 15,
  };
  enemies.forEach((enemy) => {
    if (collision(swordHitBox, enemy)) enemy.x = -100;
  });
  miniMonsters.forEach((monster) => {
    if (collision(swordHitBox, monster)) monster.x = -100;
  });
  if (collision(swordHitBox, boss)) {
    boss.health--;
    if (boss.health <= 0) console.log("Boss defeated!");
  }
}

function playerDies() {
  player.isAlive = false;
  setTimeout(() => resetLevel(), 300);
}

function drawBackground() {
  ctx.fillStyle = COLORS.navy;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
function drawPlatforms() {
  ctx.fillStyle = COLORS.purple;
  platforms.forEach((p) => ctx.fillRect(p.x - cameraX, p.y, p.width, p.height));
}
function drawPlayer() {
  
  ctx.fillStyle = COLORS.shirt;
  ctx.fillRect(
    player.x - cameraX,
    player.y + 20,
    player.width,
    player.height - 20
  );
  ctx.fillStyle = COLORS.skin;
  ctx.fillRect(player.x - cameraX + 10, player.y, 20, 20);
  ctx.fillStyle = COLORS.pants;
  ctx.fillRect(player.x - cameraX, player.y + 40, player.width, 20);

  ctx.fillStyle = COLORS.hair;
  ctx.fillRect(player.x - cameraX + 5, player.y - 5, 30, 10);

  if (player.swordActive) {
    ctx.fillStyle = COLORS.sword;
    ctx.beginPath();
    ctx.moveTo(player.x - cameraX + player.width, player.y + player.height / 2);
    ctx.arc(
      player.x - cameraX + player.width,
      player.y + player.height / 2,
      30,
      Math.PI * 1.25,
      Math.PI * 1.75
    );
    ctx.lineTo(player.x - cameraX + player.width, player.y + player.height / 2);
    ctx.fill();
  }
}
function drawEnemies() {
  ctx.fillStyle = COLORS.purple;
  enemies.forEach((e) => ctx.fillRect(e.x - cameraX, e.y, e.width, e.height));
  ctx.fillStyle = COLORS.orange;
  miniMonsters.forEach((m) =>
    ctx.fillRect(m.x - cameraX, m.y, m.width, m.height)
  );
}
function drawBoosts() {
  ctx.fillStyle = COLORS.yellow;
  boosts.forEach((b) => ctx.fillRect(b.x - cameraX, b.y, b.width, b.height));
}
function drawBoss() {
  ctx.fillStyle = COLORS.boss;
  ctx.fillRect(boss.x - cameraX, boss.y, boss.width, boss.height);
  ctx.fillStyle = "red";
  bossLasers.forEach((l) =>
    ctx.fillRect(l.x - cameraX, l.y, l.width, l.height)
  );
}
function drawHealthBar() {
  const barWidth = 200;
  const barHeight = 16;
  const x = 20;
  const y = 20;
  ctx.fillStyle = "#000";
  ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
  const healthRatio = player.health / player.maxHealth;
  ctx.fillStyle = COLORS.pink;
  ctx.fillRect(x, y, barWidth * healthRatio, barHeight);
}

function gameLoop() {
  if (player.isAlive) {
    updatePlayer();
    moveEnemies();
    bossAttack();
  }
  drawBackground();
  drawPlatforms();
  drawPlayer();
  drawEnemies();
  drawBoosts();
  drawBoss();
  drawHealthBar();
  requestAnimationFrame(gameLoop);
}

resetLevel();
gameLoop();
