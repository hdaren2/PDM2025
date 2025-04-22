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
let samples = {};
let audioContext;
let backgroundMusic;
let isMusicPlaying = false;
let scuttlePlaying = false;
let melodySynth;
let melodyGain;
let lastNoteTime = 0;
let noteIndex = 0;
let notes = ["A4", "C5", "D5", "E5", "D5", "C5", "A4", "E4"];
let baseNoteInterval = 800;
let noteInterval = baseNoteInterval;
let scuttlePlayer;
let startBackground;
let playBackground;
let endBackground;
let serial;
let connectButton;
let isConnected = false;
let port;
let reader;
let writer;
let gainNode;
let serialBuffer = ''; // Add buffer for incoming serial data
let arduinoX = 400;  // Center X position
let arduinoY = 300;  // Center Y position
const JOYSTICK_CENTER = 512;  // Center value of joystick
const MOVEMENT_THRESHOLD = 20;  // Minimum change to register movement
let arduinoButtonPressed = false;

function preload() {
  gameFont = loadFont("media/PressStart2P-Regular.ttf");
  bugSpritesheet = loadImage("media/Roach.png");
  squishedImg = loadImage("media/splat.png");
  startBackground = loadImage("media/background1.png");
  playBackground = loadImage("media/background2.png");
  endBackground = loadImage("media/background3.png");
}

function setup() {
  createCanvas(800, 600);
  textFont(gameFont);

  // Initialize game state
  gameState = GameStates.START;
  bugs = [];
  score = 0;
  time = 30;

  // Create serial connection button
  connectButton = createButton("Connect to Arduino");
  connectButton.position(0, 600);
  connectButton.mousePressed(connectToSerial);

  // Initialize audio
  initAudio();

  console.log("Game initialized in START state");
}

async function connectToSerial() {
  if (!isConnected) {
    try {
      // Initialize audio if not already initialized
      if (!audioInitialized) {
        console.log("Initializing audio...");

        // Initialize audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log("AudioContext created");

        // Create gain node for volume control
        gainNode = audioContext.createGain();
        gainNode.gain.value = 0.5; // Set volume to 50%
        gainNode.connect(audioContext.destination);
        console.log("Gain node created and connected");

        // Initialize Tone.js
        console.log("Starting Tone.js...");

        // Wait for Tone.js to be fully loaded
        if (typeof Tone === 'undefined') {
          throw new Error("Tone.js not loaded");
        }

        // Initialize Tone.js with our audio context
        Tone.setContext(audioContext);
        console.log("Tone.js context set");

        // Create melody synth
        melodySynth = new Tone.Synth({
          oscillator: {
            type: "sine"
          },
          envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.3,
            release: 0.1
          }
        });

        // Connect the synth to the audio context
        melodySynth.connect(audioContext.destination);
        melodySynth.volume.value = -12; // Reduce volume
        console.log("Melody synth created and connected");

        // Initialize samples using Web Audio API
        loadAudioFiles();

        audioInitialized = true;
        console.log("Audio initialized successfully");
      }

      // Request the port
      port = await navigator.serial.requestPort();

      // Open the port
      await port.open({ baudRate: 9600 });

      // Set up the reader
      reader = port.readable.getReader();
      readLoop();

      // Set up the writer
      writer = port.writable.getWriter();

      isConnected = true;
      connectButton.html("Disconnect Arduino");
      console.log("Successfully connected to Arduino and initialized audio");
    } catch (error) {
      console.error("Failed to connect to Arduino or initialize audio:", error);
      alert("Failed to connect to Arduino or initialize audio. Please make sure:\n1. Arduino is connected\n2. You selected the correct port\n3. Your browser supports Web Audio API");
    }
  } else {
    try {
      // Close the reader and writer
      if (reader) {
        reader.releaseLock();
      }
      if (writer) {
        writer.releaseLock();
      }
      if (port) {
        await port.close();
      }

      isConnected = false;
      connectButton.html("Connect to Arduino");
      console.log("Disconnected from Arduino");
    } catch (error) {
      console.error("Error disconnecting from Arduino:", error);
    }
  }
}

async function readLoop() {
  try {
    console.log("Starting read loop...");
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log("Reader done, releasing lock");
        reader.releaseLock();
        break;
      }

      // Convert the received data to a string
      const str = new TextDecoder().decode(value);
      serialBuffer += str;

      // Process complete lines
      const lines = serialBuffer.split('\n');
      serialBuffer = lines.pop() || ''; 

      for (let line of lines) {
        line = line.trim();
        if (line.startsWith('X:') && line.includes(',Y:')) {
          // Parse raw joystick values
          const parts = line.split(',');
          const xPart = parts[0].split(':')[1];
          const yPart = parts[1].split(':')[1];
          const rawX = parseInt(xPart);
          const rawY = parseInt(yPart);

          // Only update if we have valid values
          if (!isNaN(rawX) && !isNaN(rawY)) {
            // Map joystick values to screen coordinates
            arduinoX = map(rawX, 0, 1023, 0, 800);
            arduinoY = map(rawY, 0, 1023, 0, 600);

            // Constrain to screen bounds
            arduinoX = constrain(arduinoX, 0, 800);
            arduinoY = constrain(arduinoY, 0, 600);
          }
        } else if (line === 'BUTTON_PRESSED') {
          handleButtonPress();
        }
      }
    }
  } catch (error) {
    console.error("Error in readLoop:", error);
  }
}

async function sendToArduino(message) {
  console.log("Attempting to send to Arduino:", message);
  if (isConnected && writer) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message + '\n');
      console.log("Encoded message:", data);
      await writer.write(data);
      console.log("Message sent successfully");
    } catch (error) {
      console.error("Error sending to Arduino:", error);
    }
  } else {
    console.log("Cannot send to Arduino - Connection status:", {
      isConnected: isConnected,
      writerExists: !!writer
    });
  }
}

function initAudio() {
  if (!audioInitialized) {
    // Create a user interaction event to start audio
    const startAudio = () => {
      // Remove the event listener after first interaction
      document.removeEventListener('click', startAudio);
      document.removeEventListener('keydown', startAudio);

      try {
        console.log("Initializing audio...");

        // Initialize audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log("AudioContext created");

        gainNode = audioContext.createGain();
        gainNode.gain.value = 0.5; // Set volume to 50%
        gainNode.connect(audioContext.destination);
        console.log("Gain node created and connected");

        console.log("Starting Tone.js...");

        // Wait for Tone.js to be fully loaded
        if (typeof Tone === 'undefined') {
          throw new Error("Tone.js not loaded");
        }

        // Initialize Tone.js with our audio context
        Tone.setContext(audioContext);
        console.log("Tone.js context set");

        // Create melody synth
        melodySynth = new Tone.Synth({
          oscillator: {
            type: "sine"
          },
          envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.3,
            release: 0.1
          }
        });

        // Connect the synth to the audio context
        melodySynth.connect(audioContext.destination);
        melodySynth.volume.value = -12; // Reduce volume
        console.log("Melody synth created and connected");

        // Initialize samples using Web Audio API
        loadAudioFiles();

        audioInitialized = true;
        console.log("Audio initialized successfully");
      } catch (e) {
        console.error("Error in audio initialization:", e);
      }
    };

    // Add event listeners for user interaction
    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);
  }
}

function loadAudioFiles() {
  // Load all audio files
  const audioFiles = {
    squish: 'media/squish.mp3',
    miss: 'media/miss.mp3',
    background: 'media/scuttle.mp3'
  };

  Object.entries(audioFiles).forEach(([name, url]) => {
    fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        samples[name] = audioBuffer;
        console.log(`Loaded ${name} audio`);

        // Start background music when it's loaded
        if (name === 'background' && !isMusicPlaying) {
          playBackgroundMusic();
        }
      })
      .catch(e => console.error(`Error loading ${name} audio:`, e));
  });
}

function playBackgroundMusic() {
  if (audioInitialized && samples.background) {
    // Stop any existing background music
    if (backgroundMusic) {
      backgroundMusic.stop();
    }

    // Only play if in PLAY state
    if (gameState === GameStates.PLAY) {
      const source = audioContext.createBufferSource();
      source.buffer = samples.background;
      source.loop = true;
      source.connect(gainNode);
      source.start(0);
      backgroundMusic = source;
      isMusicPlaying = true;
      console.log("Background music started");
    } else {
      isMusicPlaying = false;
      console.log("Background music stopped");
    }
  }
}

function playSound(soundName) {
  if (audioInitialized && samples[soundName]) {
    const source = audioContext.createBufferSource();
    source.buffer = samples[soundName];
    source.connect(audioContext.destination);
    source.start(0);
    console.log(`Playing ${soundName} sound`);
  }
}

function startGame() {
  console.log("Starting new game");
  bugs = [];  // Clear any existing bugs
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

  // Start background music
  playBackgroundMusic();

  console.log("Game started with", bugs.length, "bugs");
}

function spawnBug() {
  let x, y;
  do {
    x = random(50, width - 100);
    y = random(uiHeight + 50, height - 100);
  } while (y < uiHeight + 20);

  let newBug = new Bug(x, y);
  bugs.push(newBug);
  console.log("Bug spawned at:", x, y);
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
      text("Press JOYSTICK BUTTON to Start", width / 2, height * 3 / 4);
      break;
    case GameStates.PLAY:
      image(playBackground, 0, 0, width, height);
      drawUI();

      // Update time
      if (startTime) {
        time = 30 - (millis() - startTime) / 1000;
        if (time <= 0) {
          time = 0;
          gameState = GameStates.END;
          if (melodySynth) {
            melodySynth.triggerRelease();
          }
          playBackgroundMusic(); // Stop background music
        }
      }

      // Draw Arduino cursor with crosshair
      push();
      noFill();
      stroke(255, 0, 0);
      strokeWeight(3);
      ellipse(arduinoX, arduinoY, 50, 50);
      line(arduinoX - 30, arduinoY, arduinoX + 30, arduinoY);
      line(arduinoX, arduinoY - 30, arduinoX, arduinoY + 30);
      fill(255, 0, 0);
      noStroke();
      ellipse(arduinoX, arduinoY, 15, 15);
      pop();

      // Update and display bugs
      for (let i = bugs.length - 1; i >= 0; i--) {
        bugs[i].update();
        bugs[i].display();
      }

      // Update melody
      updateMelody();
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
      text("Press JOYSTICK BUTTON to Restart", width / 2, height * 3 / 4);
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
    initAudio();
  }
}

function handleButtonPress() {
  switch (gameState) {
    case GameStates.START:
      // Start the game
      startGame();
      break;
    case GameStates.PLAY:
      // Try to squish a bug
      let hitBug = false;
      for (let bug of bugs) {
        if (!bug.isSquished && bug.isClicked(arduinoX, arduinoY)) {
          hitBug = true;
          bug.squish();
          playSound('squish');

          // Send command to Arduino to trigger feedback
          if (isConnected) {
            sendToArduino("BUG_SQUISHED");
          }

          score++;
          spawnBug();
          break;
        }
      }

      if (!hitBug && arduinoY > uiHeight) {
        playSound('miss');
      }
      break;
    case GameStates.END:
      // Restart the game
      startGame();
      break;
  }
}

function updateMelody() {
  // Only play sounds when the game is in PLAY state
  if (gameState !== GameStates.PLAY) {
    return;
  }

  if (audioInitialized && melodySynth) {
    const currentTime = millis();
    noteInterval = baseNoteInterval / (1 + score * 0.2);

    if (currentTime - lastNoteTime > noteInterval) {
      try {
        const note = notes[noteIndex];
        console.log("Playing note:", note, "at interval:", noteInterval);
        melodySynth.triggerAttackRelease(note, "8n");
        noteIndex = (noteIndex + 1) % notes.length;
        lastNoteTime = currentTime;
      } catch (e) {
        console.error("Error playing note:", e);
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
    if (this.x < 50 || this.x > width - 50) {
      this.direction.x *= -1;
      this.x = constrain(this.x, 50, width - 50);
    }
    if (this.y < uiHeight + 50 || this.y > height - 50) {
      this.direction.y *= -1;
      this.y = constrain(this.y, uiHeight + 50, height - 50);
    }
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

