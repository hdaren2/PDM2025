let GameStates = Object.freeze({
  START: "start",
  PLAY: "play",
  END: "end"
});

let gameState = GameStates.START;
let score = 0;
let highScore = 0;
let time = 30;
let textPadding = 15;
let gameFont;
let bugSpritesheet;
let squishedImg;
let frameWidth = 256, frameHeight = 256;
let animationFrames = 4;
let startTime;
let bugs = [];
let bugScale = 0.3;
let uiHeight = 50;
let baseSpeed = 2;

function preload() {
  gameFont = loadFont("media/PressStart2P-Regular.ttf");
  bugSpritesheet = loadImage("media/Roach.png");
  squishedImg = loadImage("media/splat.png");
}

function setup() {
  createCanvas(800, 600);
  textFont(gameFont);
}

function startGame() {
  bugs = [];
  for (let i = 0; i < 8; i++) {
    spawnBug();
  }
  score = 0;
  startTime = millis();
  time = 30;
  gameState = GameStates.PLAY;
}

function spawnBug() {
  let x, y;
  do {
    x = random(50, width - 100);
    y = random(uiHeight + 50, height - 100);
  } while (y < uiHeight + 20);
  bugs.push(new Bug(x, y));
}

function draw() {
  background(220);

  switch (gameState) {
    case GameStates.START:
      textAlign(CENTER, CENTER);
      textSize(42);
      text("SPLAT!", width / 2, height / 2);
      textSize(18);
      text("Press ENTER to Start", width / 2, height * 3 / 4);
      break;
    case GameStates.PLAY:
      drawUI();
      textAlign(LEFT, TOP);
      text(`Score: ${score}`, textPadding, textPadding);
      textAlign(RIGHT, TOP);
      text(`Time: ${ceil(time)}`, width - textPadding, textPadding);

      let elapsed = (millis() - startTime) / 1000;
      time = max(30 - elapsed, 0);
      if (time <= 0) {
        gameState = GameStates.END;
      }

      for (let bug of bugs) {
        bug.update();
        bug.display();
      }
      break;
    case GameStates.END:
      textAlign(CENTER, CENTER);
      text("Game Over!", width / 2, height / 2 - 20);
      text(`Score: ${score}`, width / 2, height / 2);
      if (score > highScore) {
        highScore = score;
      }
      text(`High Score: ${highScore}`, width / 2, height / 2 + 20);
      text("Press ENTER to Restart", width / 2, height * 3 / 4);
      break;
  }
}

function drawUI() {
  fill(255);
  rect(0, 0, width, uiHeight);
  fill(0);
  textAlign(LEFT, TOP);
  textSize(18);
  text(`Score: ${score}`, textPadding, textPadding);
  textAlign(RIGHT, TOP);
  text(`Time: ${ceil(time)}`, width - textPadding, textPadding);
}

function keyPressed() {
  if (keyCode === ENTER && gameState !== GameStates.PLAY) {
    startGame();
  }
}

function mousePressed() {
  for (let bug of bugs) {
    if (!bug.isSquished && bug.isClicked(mouseX, mouseY)) {
      bug.squish();
      score++;
      spawnBug();
    }
  }
}

class Bug {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = baseSpeed + score * 0.2;
    this.direction = p5.Vector.random2D();
    this.angle = atan2(this.direction.y, this.direction.x) + PI / 2;
    this.isSquished = false;
    this.frame = 0;
    this.squishTime = 0;
  }

  update() {
    if (!this.isSquished) {
      this.x += this.direction.x * this.speed;
      this.y += this.direction.y * this.speed;
      this.keepInBounds();
      this.angle = atan2(this.direction.y, this.direction.x) + PI / 2;
      this.frame = (this.frame + 0.2) % animationFrames;
    } else if (millis() - this.squishTime > 1200) {
      let index = bugs.indexOf(this);
      if (index > -1) {
        bugs.splice(index, 1);
      }
    }
  }

  keepInBounds() {
    if (this.x < 50 || this.x > width - 50) this.direction.x *= -1;
    if (this.y < uiHeight + 50 || this.y > height - 50) this.direction.y *= -1;
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    scale(bugScale);
    if (this.isSquished) {
      scale(.35);
      image(squishedImg, -frameWidth / 2, -frameHeight / 2);
    } else {
      let frameX = int(this.frame) * frameWidth;
      image(bugSpritesheet, -frameWidth / 2, -frameHeight / 2, frameWidth, frameHeight, frameX, 0, frameWidth, frameHeight);
    }
    pop();
  }

  isClicked(mx, my) {
    return dist(mx, my, this.x, this.y) < (frameWidth * bugScale) / 2;
  }

  squish() {
    this.isSquished = true;
    this.squishTime = millis();
  }
}
