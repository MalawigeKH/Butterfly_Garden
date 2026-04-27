// 📱 LANDSCAPE LOCK (OPTION 1)
async function lockLandscape() {
  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock("landscape");
    }
  } catch (e) {
    console.log("Landscape lock not supported on this device");
  }
}

// start lock after first interaction (required by browsers)
document.addEventListener("click", lockLandscape, { once: true });
document.addEventListener("touchstart", lockLandscape, { once: true });

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 🎵 MUSIC
const music = new Audio("music.mp3");
music.loop = true;
music.volume = 0.5;

let musicStarted = false;
function startMusic() {
  if (!musicStarted) {
    music.play().catch(() => {});
    musicStarted = true;
  }
}

// 🌿 BACKGROUND
function drawBackground() {
  ctx.fillStyle = "#d8f5d0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 🌸 FLOWERS
const flowerImgs = [
  new Image(),
  new Image(),
  new Image()
];

flowerImgs[0].src = "images/flower1.png";
flowerImgs[1].src = "images/flower2.png";
flowerImgs[2].src = "images/flower3.png";

// 🦋 BUTTERFLIES
const butterflyTypes = [
  { up: new Image(), down: new Image(), size: 60 },
  { up: new Image(), down: new Image(), size: 70 },
  { up: new Image(), down: new Image(), size: 80 }
];

butterflyTypes[0].up.src = "images/butterfly1.png";
butterflyTypes[0].down.src = "images/butterfly2.png";

butterflyTypes[1].up.src = "images/butterfly3.png";
butterflyTypes[1].down.src = "images/butterfly4.png";

butterflyTypes[2].up.src = "images/butterfly5.png";
butterflyTypes[2].down.src = "images/butterfly6.png";

// 🎮 GAME DATA
let flowers = [];
let butterflies = [];
let flowerId = 0;

// ⏱ DOUBLE TAP TRACKING
let lastTapTime = 0;
let lastTapFlower = null;

// 🦋 SPAWN CONTROL
function maybeSpawnButterfly(x, y) {
  if (Math.random() < 0.35) {
    const type = butterflyTypes[Math.floor(Math.random() * butterflyTypes.length)];

    butterflies.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,

      frame: 0,
      timer: 0,

      up: type.up,
      down: type.down,
      size: type.size,

      mode: "free",
      targetFlowerId: null,

      life: 600
    });
  }
}

// 🌸 CREATE FLOWER
function createFlower(x, y) {
  startMusic();

  flowers.push({
    id: flowerId++,
    x,
    y,
    type: Math.floor(Math.random() * 3),

    size: 10,
    maxSize: 140,
    holdTime: 120,
    state: "growing"
  });

  maybeSpawnButterfly(x, y);
}

// 📱 INPUT (DOUBLE TAP LOGIC)
canvas.addEventListener("click", handleInput);
canvas.addEventListener("touchstart", handleInput);

function handleInput(e) {
  startMusic();

  let x, y;

  if (e.touches) {
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  } else {
    x = e.clientX;
    y = e.clientY;
  }

  const now = Date.now();

  // 🌸 check flower hit
  let clickedFlower = null;

  for (let f of flowers) {
    let dx = x - f.x;
    let dy = y - f.y;

    if (Math.sqrt(dx * dx + dy * dy) < f.size * 0.4) {
      clickedFlower = f;
      break;
    }
  }

  if (!clickedFlower) {
    // 🌸 single tap empty space → flower
    createFlower(x, y);
    lastTapTime = 0;
    lastTapFlower = null;
    return;
  }

  // 🦋 DOUBLE TAP CHECK (within 300ms)
  if (lastTapFlower === clickedFlower.id && now - lastTapTime < 300) {

    // 🦋 DOUBLE TAP → butterflies go
    butterflies.forEach(b => {
      b.mode = "attracted";
      b.targetFlowerId = clickedFlower.id;
    });

    lastTapTime = 0;
    lastTapFlower = null;

  } else {
    // first tap on flower (do nothing yet)
    lastTapTime = now;
    lastTapFlower = clickedFlower.id;
  }
}

// 🔄 UPDATE
function update() {

  // 🌸 FLOWERS
  flowers.forEach(f => {

    if (f.state === "growing") {
      if (f.size < f.maxSize) {
        f.size += 0.6;
      } else {
        f.state = "holding";
      }
    }

    else if (f.state === "holding") {
      f.holdTime--;
      if (f.holdTime <= 0) f.state = "shrinking";
    }

    else if (f.state === "shrinking") {
      f.size -= 1.2;
    }
  });

  flowers = flowers.filter(f => f.size > 5);

  // 🦋 BUTTERFLIES
  butterflies.forEach(b => {

    b.timer++;
    if (b.timer % 12 === 0) {
      b.frame = b.frame === 0 ? 1 : 0;
    }

    let target = flowers.find(f => f.id === b.targetFlowerId);

    if (target && b.mode === "attracted") {
      b.x += (target.x - b.x) * 0.03;
      b.y += (target.y - b.y) * 0.03;
    } else {
      b.mode = "free";
      b.targetFlowerId = null;

      b.x += b.vx;
      b.y += b.vy;
    }

    b.life--;
  });

  butterflies = butterflies.filter(b => b.life > 0);
}

// 🎨 DRAW
function drawBackground() {
  ctx.fillStyle = "#d8f5d0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawFlowers() {
  flowers.forEach(f => {
    const img = flowerImgs[f.type];

    ctx.drawImage(
      img,
      f.x - f.size / 2,
      f.y - f.size / 2,
      f.size,
      f.size
    );
  });
}

function drawButterflies() {
  butterflies.forEach(b => {
    const img = b.frame === 0 ? b.up : b.down;

    ctx.drawImage(
      img,
      b.x - b.size / 2,
      b.y - b.size / 2,
      b.size,
      b.size
    );
  });
}

// 🔁 LOOP
function loop() {
  update();
  drawBackground();
  drawFlowers();
  drawButterflies();

  requestAnimationFrame(loop);
}

loop();
