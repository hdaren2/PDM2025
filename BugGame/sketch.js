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
let audioInitialized = false;
let samples;
let audioContext;
let scuttlePlaying = false;
let melodySynth;
let melodySequence;
let musicPlayer;
let lastNoteTime = 0;
let noteIndex = 0;
let notes = ["A4", "C5", "D5", "E5", "D5", "C5", "A4", "E4"];
let baseNoteInterval = 800;
let noteInterval = baseNoteInterval;
let scuttlePlayer;
let startBackground;
let playBackground;
let endBackground;

function preload() {
  gameFont = loadFont("media/PressStart2P-Regular.ttf");
  bugSpritesheet = loadImage("media/Roach.png");
  squishedImg = loadImage("media/splat.png");
  startBackground = loadImage("media/background1.png");
  playBackground = loadImage("media/background2.png");
  endBackground = loadImage("media/background3.png");

  samples = new Tone.Players({
    squish: "media/squish.mp3",
    miss: "media/miss.mp3"
  }, {
    onload: function () {
      console.log("All audio files loaded");
      samples.volume.value = 0;
    }
  }).toDestination();

  melodySynth = new Tone.Synth({
    oscillator: {
      type: "triangle"
    },
    envelope: {
      attack: 0.02,
      decay: 0.1,
      sustain: 0.3,
      release: 0.8
    }
  }).toDestination();

  melodySynth.volume.value = -18;
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
  noteInterval = baseNoteInterval;
  lastNoteTime = 0;
  noteIndex = 0;

  if (audioInitialized) {
    try {
      if (scuttlePlayer) {
        scuttlePlayer.stop();
        scuttlePlayer.dispose();
      }

      scuttlePlayer = new Tone.Player({
        url: "media/scuttle.mp3",
        loop: true,
        autostart: true,
        onload: () => {
          console.log("Scuttle sound loaded");
          scuttlePlayer.volume.value = 0;
          scuttlePlaying = true;
          console.log("Scuttle sound started");
        }
      }).toDestination();
    } catch (e) {
      console.error("Error playing scuttle sound:", e);
    }
  }
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
  switch (gameState) {
    case GameStates.START:
      image(startBackground, 0, 0, width, height);
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(42);
      text("SPLAT!", width / 2, height / 2);
      textSize(18);
      text("Press ENTER to Start", width / 2, height * 3 / 4);
      break;
    case GameStates.PLAY:
      image(playBackground, 0, 0, width, height);
      drawUI();
      textAlign(LEFT, TOP);
      text(`Score: ${score}`, textPadding, textPadding);
      textAlign(RIGHT, TOP);
      text(`Time: ${ceil(time)}`, width - textPadding, textPadding);

      let elapsed = (millis() - startTime) / 1000;
      time = max(30 - elapsed, 0);
      if (time <= 0) {
        gameState = GameStates.END;
        if (scuttlePlaying && scuttlePlayer) {
          scuttlePlayer.stop();
          scuttlePlayer.dispose();
          scuttlePlaying = false;
          console.log("Sounds stopped");
        }
      }
      if (audioInitialized) {
        noteInterval = baseNoteInterval / (1 + score * 0.2);

        let currentTime = millis();
        if (currentTime - lastNoteTime > noteInterval) {
          melodySynth.triggerAttackRelease(notes[noteIndex], "8n");
          noteIndex = (noteIndex + 1) % notes.length;
          lastNoteTime = currentTime;
        }
      }
      for (let bug of bugs) {
        bug.update();
        bug.display();
      }
      break;
    case GameStates.END:
      image(endBackground, 0, 0, width, height);
      fill(255);
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

function initAudio() {
  if (!audioInitialized) {
    Tone.start().then(() => {
      console.log("Audio context started");
      Tone.context.resume();
      Tone.Transport.start();
      audioInitialized = true;
      console.log("Audio initialized successfully");
    }).catch((e) => {
      console.error("Error starting audio context", e);
    });
  }
}

function keyPressed() {
  if (keyCode === ENTER && gameState !== GameStates.PLAY) {
    startGame();
    initAudio();
  }
}

function mousePressed() {
  initAudio();
  let hitBug = false;

  for (let bug of bugs) {
    if (!bug.isSquished && bug.isClicked(mouseX, mouseY)) {
      hitBug = true;
      bug.squish();
      if (audioInitialized) {
        console.log("Attempting to play squish sound");
        try {
          const player = new Tone.Player({
            url: "media/squish.mp3",
            onload: function () {
              player.volume.value = 0;
              player.start();
              console.log("Squish sound played successfully");
            }
          }).toDestination();
        } catch (e) {
          console.error("Error playing squish sound:", e);
        }
      }
      score++;
      spawnBug();
    }
  }

  if (!hitBug && gameState === GameStates.PLAY && mouseY > uiHeight) {
    if (audioInitialized) {
      console.log("Playing miss sound");
      try {
        samples.player("miss").start();
      } catch (e) {
        console.error("Error playing miss sound:", e);
      }
    }
  }
}

class Bug {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.resetSpeed();
    this.direction = p5.Vector.random2D();
    this.angle = atan2(this.direction.y, this.direction.x) + PI / 2;
    this.isSquished = false;
    this.frame = 0;
    this.squishTime = 0;
  }

  resetSpeed() {
    this.speed = baseSpeed + score * 0.2;
  }

  update() {
    if (!this.isSquished) {
      this.speed = baseSpeed + score * 0.2;
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
