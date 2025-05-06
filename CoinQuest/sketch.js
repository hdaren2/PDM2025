// =============================================
// GLOBAL VARIABLES AND STATE
// =============================================
let synth;
let backgroundMusic;
let isMusicInitialized = false;
let audioInitialized = false;
let missSampler;
let jumpSynth;
let highScore = 0;
let port; // Serial port for Arduino communication
let joystickX = 0;
let joystickY = 0;
let joystickSW = 0;  // SW button state
let joystickThreshold = 0.2; // Threshold to prevent drift

// Game state
let gameState = {
  score: 0,
  lives: 3,
  timeElapsed: 0,  // Changed from timeLeft to timeElapsed
  currentScene: 'welcome',
  lastTime: 0,
  gameSpeed: 1,
  difficulty: 1
};

// Game assets
let playerSprite;
let coinSprite;
let enemySprite;
let playerFrames = [];
let coinFrames = [];
let enemyFrames = [];
let currentPlayerFrame = 0;
let currentCoinFrame = 0;
let currentEnemyFrame = 0;
let frameCount = 0;
let animationSpeed = 4;

// Game objects
let player;
let coins = [];
let enemies = [];
let maxCoins = 5;
let maxEnemies = 3;
let baseEnemies = 3;  // Base number of enemies
let maxHardEnemies = 10;  // Maximum number of enemies at highest difficulty

// Platform settings
let platforms = [];
let basePlatformSpeed = 2;
let lastPlatformX;
let minPlatformGap = 200;
let maxPlatformGap = 400;

// Background elements
let clouds = [];
let stars = [];
let groundTiles = [];

// =============================================
// CLASS DEFINITIONS
// =============================================
class Platform {
  constructor(x, y, width) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = 20;
    this.coinsCollected = 0; // Track how many coins have been collected from this platform
  }

  move() {
    this.x -= getPlatformSpeed();
  }

  display() {
    fill(139, 69, 19); // Brown color
    noStroke();
    rect(this.x, this.y, this.width, this.height);
  }

  isOffScreen() {
    return this.x + this.width < 0;
  }
}

class Character {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.currentAnimation = null;
    this.animations = {};
  }

  addAnimation(key, animation) {
    this.animations[key] = animation;
  }

  draw() {
    let animation = this.animations[this.currentAnimation];
    if (animation) {
      push();
      translate(this.x, this.y);
      animation.draw();
      pop();
    }
  }
}

class Player extends Character {
  constructor() {
    super(100, height - 100);
    this.size = 80;
    this.speed = 8;
    this.jumpForce = -14;
    this.gravity = 0.8;
    this.velocity = 0;
    this.isJumping = false;
    this.facingRight = true;
    this.isMoving = false;
    this.lastDirection = 0;
    this.onPlatform = false;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.jumpStartTime = 0;
    this.maxJumpDuration = 200;
    this.initialJumpVelocity = 0;
    this.minJumpMultiplier = 0.5;

    // Initialize animations
    this.addAnimation("stand", new SpriteAnimation(playerSprite, 0, 0, 1));
    this.addAnimation("right", new SpriteAnimation(playerSprite, 0, 0, 9));
    this.addAnimation("left", new SpriteAnimation(playerSprite, 0, 0, 9));
    this.currentAnimation = "stand";
  }

  move() {
    // Update invincibility timer
    if (this.isInvincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
      }
    }

    // Reset movement state
    this.isMoving = false;

    // Check if Arduino is connected
    const isArduinoConnected = port && port.opened();

    // Handle horizontal movement
    if (isArduinoConnected) {
      // Use joystick controls if Arduino is connected
      if (abs(joystickX) > joystickThreshold) {
        if (joystickX < -joystickThreshold && this.x - this.speed > this.size / 2) {
          this.x -= this.speed;
          this.facingRight = false;
          this.isMoving = true;
          this.currentAnimation = "left";
          this.animations[this.currentAnimation].flipped = true;
        }
        if (joystickX > joystickThreshold && this.x + this.speed < width - this.size / 2) {
          this.x += this.speed;
          this.facingRight = true;
          this.isMoving = true;
          this.currentAnimation = "right";
          this.animations[this.currentAnimation].flipped = false;
        }
      }
    } else {
      // Use keyboard controls if Arduino is not connected
      if (keyIsDown(LEFT_ARROW) && this.x - this.speed > this.size / 2) {
        this.x -= this.speed;
        this.facingRight = false;
        this.isMoving = true;
        this.currentAnimation = "left";
        this.animations[this.currentAnimation].flipped = true;
      }
      if (keyIsDown(RIGHT_ARROW) && this.x + this.speed < width - this.size / 2) {
        this.x += this.speed;
        this.facingRight = true;
        this.isMoving = true;
        this.currentAnimation = "right";
        this.animations[this.currentAnimation].flipped = false;
      }
    }

    // Update animation based on movement and facing direction
    if (!this.isMoving) {
      this.currentAnimation = "stand";
      this.animations[this.currentAnimation].flipped = !this.facingRight;
    }

    // Handle jumping
    if (isArduinoConnected) {
      // Use joystick button for jumping if Arduino is connected
      if (joystickSW === 0 && !this.isJumping && this.onPlatform) {
        this.jumpStartTime = millis();
        this.isJumping = true;
        this.onPlatform = false;
        this.initialJumpVelocity = this.jumpForce * this.minJumpMultiplier;
        this.velocity = this.initialJumpVelocity;

        // Play jump sound
        jumpSynth.triggerAttackRelease("G5", "16n");
      }

      // Apply variable jump height while SW button is held
      if (this.isJumping && joystickSW === 0) {
        let holdDuration = millis() - this.jumpStartTime;
        if (holdDuration < this.maxJumpDuration) {
          let jumpMultiplier = this.minJumpMultiplier + ((1 - this.minJumpMultiplier) * (holdDuration / this.maxJumpDuration));
          this.velocity = this.jumpForce * jumpMultiplier;
        }
      }
    } else {
      // Use spacebar for jumping if Arduino is not connected
      if (keyIsDown(32) && !this.isJumping && this.onPlatform) { // 32 is spacebar
        this.jumpStartTime = millis();
        this.isJumping = true;
        this.onPlatform = false;
        this.initialJumpVelocity = this.jumpForce * this.minJumpMultiplier;
        this.velocity = this.initialJumpVelocity;

        // Play jump sound
        jumpSynth.triggerAttackRelease("G5", "16n");
      }

      // Apply variable jump height while spacebar is held
      if (this.isJumping && keyIsDown(32)) {
        let holdDuration = millis() - this.jumpStartTime;
        if (holdDuration < this.maxJumpDuration) {
          let jumpMultiplier = this.minJumpMultiplier + ((1 - this.minJumpMultiplier) * (holdDuration / this.maxJumpDuration));
          this.velocity = this.jumpForce * jumpMultiplier;
        }
      }
    }

    // Apply physics
    this.velocity += this.gravity;
    this.y += this.velocity;

    // Handle platform collisions and movement
    this.onPlatform = false;
    for (let platform of platforms) {
      if (this.y + this.size / 2 > platform.y &&
        this.y + this.size / 2 < platform.y + platform.height &&
        this.x > platform.x &&
        this.x < platform.x + platform.width &&
        this.velocity >= 0) {
        this.y = platform.y - this.size / 2 + 10;
        this.velocity = 0;
        this.isJumping = false;
        this.onPlatform = true;
        // Move with the platform
        this.x -= getPlatformSpeed();
        break;
      }
    }

    // Handle ground collision
    if (this.y > height - 100) {
      this.y = height - 100;
      this.velocity = 0;
      this.isJumping = false;
      this.onPlatform = true;
    }

    // Screen boundaries for vertical movement
    this.y = constrain(this.y, this.size / 2, height - 100);
  }

  collect(coin) {
    let d = dist(this.x, this.y, coin.x, coin.y);
    return d < (this.size / 2 + coin.size / 2);
  }
}

class Coin {
  constructor() {
    this.size = 40;
    this.reset();
  }

  reset() {
    let attempts = 0;
    let validPosition = false;

    while (!validPosition && attempts < 10) {
      // Position coins on platforms
      let platform = platforms[floor(random(platforms.length))];
      if (platform) {
        // Count coins on this platform
        let coinsOnPlatform = 0;
        for (let coin of coins) {
          if (coin.x > platform.x && coin.x < platform.x + platform.width &&
            abs(coin.y - platform.y) < 20) {
            coinsOnPlatform++;
          }
        }

        // Check if player is on this platform
        let playerOnPlatform = false;
        if (player.x > platform.x && player.x < platform.x + platform.width &&
          abs(player.y - platform.y) < 20) {
          playerOnPlatform = true;
        }

        // Only place coin if platform has less than 3 coins and player isn't on it
        if (coinsOnPlatform < 3 && !playerOnPlatform) {
          this.x = platform.x + random(20, platform.width - 20);
          this.y = platform.y - 10; // Position slightly above the platform
        } else {
          // Try another platform
          continue;
        }
      } else {
        // Fallback position if no platforms exist
        this.x = random(this.size, width - this.size);
        this.y = height - 100;
      }

      // Check if this position overlaps with any existing coins
      validPosition = true;
      for (let coin of coins) {
        if (dist(this.x, this.y, coin.x, coin.y) < this.size) {
          validPosition = false;
          break;
        }
      }

      attempts++;
    }

    this.speed = 0;
  }

  move() {
    // Move with platform if on one
    for (let platform of platforms) {
      if (this.x > platform.x && this.x < platform.x + platform.width &&
        abs(this.y - platform.y) < 20) {
        this.x -= getPlatformSpeed();
      }
    }
  }

  display() {
    if (coinSprite) {
      image(coinSprite, this.x, this.y, this.size, this.size);
    } else {
      fill(255, 215, 0);
      noStroke();
      ellipse(this.x, this.y, this.size);
    }
  }
}

class Enemy extends Character {
  constructor() {
    super(random(50, width - 50), -80);
    this.size = 80;
    this.speed = random(2, 4) * gameState.gameSpeed;
    this.pattern = floor(random(3));
    this.isMoving = true;
    this.collisionSizeMultiplier = 0.7; // Make collision box 70% of visual size

    // Initialize animation
    this.addAnimation("move", new SpriteAnimation(enemySprite, 0, 0, 11));
    this.currentAnimation = "move";
  }

  reset() {
    this.x = random(50, width - 50);
    this.y = -this.size;
    this.speed = random(2, 4) * gameState.gameSpeed;
    this.pattern = floor(random(3));
    this.isMoving = true;
  }

  move() {
    this.y += this.speed;

    switch (this.pattern) {
      case 0: // Straight down
        break;
      case 1: // Zigzag
        this.x += sin(frameCount * 0.1) * 2;
        break;
      case 2: // Diagonal
        this.x += this.speed * 0.5;
        break;
    }

    // Update isMoving based on position
    this.isMoving = this.y < height + this.size &&
      this.x > -this.size &&
      this.x < width + this.size;

    if (!this.isMoving) {
      this.reset();
    }
  }

  display() {
    this.draw();
  }

  hit(player) {
    let d = dist(this.x, this.y, player.x, player.y);
    return d < ((this.size * this.collisionSizeMultiplier) / 2 + player.size / 2);
  }
}

class SpriteAnimation {
  constructor(spritesheet, startU, startV, duration) {
    this.spritesheet = spritesheet;
    this.u = startU;
    this.v = startV;
    this.duration = duration;
    this.startU = startU;
    this.frameCount = 0;
    this.flipped = false;
  }

  draw() {
    let s = (this.flipped) ? -1 : 1;
    scale(s, 1);
    let frameWidth = 80;
    let frameHeight = 80;
    let currentFrame = floor(this.frameCount / 8) % this.duration;
    image(this.spritesheet, 0, 0, frameWidth, frameHeight,
      currentFrame * frameWidth, this.v * frameHeight,
      frameWidth, frameHeight);

    this.frameCount++;
    if (this.frameCount >= this.duration * 8) {
      this.frameCount = 0;
    }
  }
}

// =============================================
// SETUP AND INITIALIZATION
// =============================================
function preload() {
  playerSprite = loadImage('assets/player.png');
  coinSprite = loadImage('assets/coin.png');
  enemySprite = loadImage('assets/enemy.png');
}

function setup() {
  try {
    imageMode(CENTER);

    // Create canvas
    let canvas = createCanvas(800, 600);

    // Initialize serial communication
    port = createSerial();

    // Add connect button
    let connectButton = createButton('Connect to Arduino');
    connectButton.position(10, 10);
    connectButton.mousePressed(connect);

    // Initialize miss sound sampler
    missSampler = new Tone.Sampler({
      urls: {
        C4: "assets/miss.mp3"
      },
    }).toDestination();

    // Initialize jump sound synth
    jumpSynth = new Tone.Synth({
      oscillator: {
        type: "sine"
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.1,
        release: 0.1
      }
    }).toDestination();

    // Initialize background music
    synth = new Tone.Synth({
      oscillator: {
        type: "sine",
        modulationType: "sawtooth",
        modulationIndex: 2,
        harmonicity: 0.5
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.3,
        release: 0.8
      }
    });

    // Create effects
    const reverb = new Tone.Reverb({
      decay: 2.5,
      wet: 0.3
    }).toDestination();

    const delay = new Tone.FeedbackDelay({
      delayTime: 0.25,
      feedback: 0.3,
      wet: 0.2
    }).connect(reverb);

    const distortion = new Tone.Distortion({
      distortion: 0.2,
      wet: 0.1
    }).connect(delay);

    // Connect synth to effects chain
    synth.connect(distortion);

    // Create background music pattern
    backgroundMusic = new Tone.Part((time, note) => {
      synth.triggerAttackRelease(note, "8n", time);
    }, [
      ["0:0", "C4"],
      ["0:1", "E4"],
      ["0:2", "G4"],
      ["0:3", "A4"],
      ["1:0", "F4"],
      ["1:1", "D4"],
      ["1:2", "B3"],
      ["1:3", "G3"]
    ]).start(0);

    // Set the loop points and enable looping
    backgroundMusic.loop = true;
    backgroundMusic.loopStart = "0:0";
    backgroundMusic.loopEnd = "2:0";

    // Set initial tempo
    Tone.Transport.bpm.value = 100;

    // Initialize platform variables
    lastPlatformX = width;

    // Initialize game state
    gameState = {
      score: 0,
      lives: 3,
      timeElapsed: 0,  // Changed from timeLeft to timeElapsed
      currentScene: 'welcome',
      lastTime: millis(),
      gameSpeed: 1,
      difficulty: 1
    };

    // Create player
    player = new Player();

    // Create initial platforms
    platforms = [];
    for (let i = 0; i < 3; i++) {
      let platformWidth = random(100, 200);
      let platformY = random(height * 0.6, height * 0.8);
      platforms.push(new Platform(width / 2 + i * 300, platformY, platformWidth));
    }

    // Initialize coins and enemies
    coins = [];
    enemies = [];
    for (let i = 0; i < maxCoins; i++) {
      coins.push(new Coin());
    }
    for (let i = 0; i < maxEnemies; i++) {
      enemies.push(new Enemy());
    }

    // Create background elements
    createBackground();
    console.log("Setup complete");
  } catch (error) {
    console.error("Error in setup:", error);
  }
}

function createBackground() {
  // Create clouds
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: random(width),
      y: random(height / 2),
      speed: random(0.5, 1.0),
      size: random(50, 100)
    });
  }

  // Create stars
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: random(width),
      y: random(height / 2),
      size: random(1, 3),
      brightness: random(100, 255)
    });
  }

  // Create ground tiles
  for (let i = 0; i < width / 50 + 1; i++) {
    groundTiles.push({
      x: i * 50,
      y: height - 100,
      size: 50
    });
  }
}

// =============================================
// GAME LOOP AND SCENE MANAGEMENT
// =============================================
function draw() {
  // Read joystick data from Arduino
  if (port.available() > 0) {
    let data = port.readUntil('\n');
    if (data) {
      try {
        let values = data.split(',');
        if (values.length >= 3) {
          joystickX = parseFloat(values[0]);
          joystickY = parseFloat(values[1]);
          joystickSW = parseInt(values[2]);
        }
      } catch (e) {
        console.error("Error parsing joystick data:", e);
      }
    }
  }

  // Draw background
  background(0, 0, 50);

  // Draw stars
  for (let star of stars) {
    fill(star.brightness);
    noStroke();
    ellipse(star.x, star.y, star.size);
  }

  // Draw clouds
  for (let cloud of clouds) {
    fill(255, 255, 255, 150);
    noStroke();
    ellipse(cloud.x, cloud.y, cloud.size);
    ellipse(cloud.x + cloud.size / 3, cloud.y - cloud.size / 4, cloud.size * 0.8);
    ellipse(cloud.x - cloud.size / 3, cloud.y - cloud.size / 4, cloud.size * 0.8);

    // Move clouds
    cloud.x += cloud.speed * 0.5;
    if (cloud.x > width + cloud.size) {
      cloud.x = -cloud.size;
    }
  }

  // Draw ground
  for (let tile of groundTiles) {
    fill(34, 139, 34);
    noStroke();
    rect(tile.x, tile.y, tile.size, 100);
  }

  // Update frame counter
  frameCount++;

  // Draw current scene
  switch (gameState.currentScene) {
    case 'welcome':
      drawWelcomeScene();
      break;
    case 'gameplay':
      drawGameplayScene();
      break;
    case 'gameover':
      drawGameOverScene();
      break;
  }
}

function drawWelcomeScene() {
  // Draw game title
  push();
  textSize(64);
  textAlign(CENTER);
  fill(255, 215, 0);
  text('COIN QUEST', width / 2, height / 3);

  // Draw instructions
  textSize(24);
  fill(255);
  text('Controls:', width / 2, height / 2);
  if (port && port.opened()) {
    text('Joystick: Move', width / 2, height / 2 + 40);
    text('Joystick Button: Jump', width / 2, height / 2 + 80);
  } else {
    text('Arrow Keys: Move', width / 2, height / 2 + 40);
    text('Space: Jump', width / 2, height / 2 + 80);
  }

  // Add blinking effect to "Press ENTER to Start"
  let blink = sin(frameCount * 0.05) > 0;
  if (blink) {
    text('Press ENTER to Start', width / 2, height / 2 + 140);
  }
  pop();

  // Initialize game state when in welcome scene
  if (gameState.currentScene === 'welcome') {
    // Reset game state
    gameState.score = 0;
    gameState.lives = 3;
    gameState.timeElapsed = 0;  // Changed from timeLeft to timeElapsed
    gameState.gameSpeed = 1;
    gameState.lastTime = millis();

    // Reset platforms
    platforms = [];
    lastPlatformX = width;

    // Create initial platforms
    for (let i = 0; i < 3; i++) {
      let platformWidth = random(100, 200);
      let platformY = random(height * 0.6, height * 0.8);
      platforms.push(new Platform(width / 2 + i * 300, platformY, platformWidth));
    }

    // Reset coins and enemies
    coins = [];
    enemies = [];
    for (let i = 0; i < maxCoins; i++) {
      coins.push(new Coin());
    }
    for (let i = 0; i < maxEnemies; i++) {
      enemies.push(new Enemy());
    }

    // Reset player
    player = new Player();

    // Reset LEDs to show all 3 lives
    updateLivesLEDs();
  }
}

function drawGameplayScene() {
  // Initialize and start music only when game starts
  if (!isMusicInitialized) {
    Tone.Transport.start();
    isMusicInitialized = true;
  }

  // Update timer and difficulty
  let currentTime = millis();
  if (currentTime - gameState.lastTime >= 1000) {
    gameState.timeElapsed++;
    gameState.lastTime = currentTime;

    // Add points every 10 seconds
    if (gameState.timeElapsed % 10 === 0) {
      gameState.score += 50;
    }

    // Increase difficulty every 8 seconds
    if (gameState.timeElapsed % 10 === 0) {
      gameState.difficulty += 0.2;
      gameState.gameSpeed = 1 + (gameState.difficulty * 0.3);
      // Scale max enemies with difficulty
      maxEnemies = min(baseEnemies + floor(gameState.difficulty * 2), maxHardEnemies);
    }
  }

  // Draw game info
  textSize(24);
  textAlign(LEFT);
  fill(255);
  text('Score: ' + gameState.score, 20, 30);
  text('Lives: ' + gameState.lives, 20, 60);
  text('Time: ' + gameState.timeElapsed, 20, 90);  // Changed from timeLeft to timeElapsed

  // Update and display platforms
  for (let i = platforms.length - 1; i >= 0; i--) {
    platforms[i].move();
    platforms[i].display();

    if (platforms[i].isOffScreen()) {
      platforms.splice(i, 1);
    }
  }

  // Spawn new platforms more frequently
  if (platforms.length === 0 || platforms[platforms.length - 1].x < width - maxPlatformGap) {
    let gap = random(minPlatformGap, maxPlatformGap);
    let platformWidth = random(100, 200);
    let minHeight = height * 0.5;
    let maxHeight = height * 0.7;
    let platformY = random(minHeight, maxHeight);
    platforms.push(new Platform(width + gap, platformY, platformWidth));
  }

  // Update and display player
  player.move();
  player.draw();

  // Update and display coins
  for (let i = coins.length - 1; i >= 0; i--) {
    let coin = coins[i];
    coin.move();
    coin.display();

    // Remove coins that go off the left side of the screen
    if (coin.x + coin.size < 0) {
      coins.splice(i, 1);
      continue;
    }

    if (player.collect(coin)) {
      gameState.score += 10;
      coins.splice(i, 1); // Remove collected coin

      // Find the platform this coin was on and increment its coinsCollected counter
      for (let platform of platforms) {
        if (coin.x > platform.x &&
          coin.x < platform.x + platform.width &&
          abs(coin.y - platform.y) < 20) {
          platform.coinsCollected++;
          break;
        }
      }

      // Find a platform that doesn't have the player, has less than 2 coins, hasn't had both coins collected, and is off-screen
      let validPlatforms = platforms.filter(platform => {
        // Check if player is on this platform
        let playerOnPlatform = player.x > platform.x &&
          player.x < platform.x + platform.width &&
          abs(player.y - platform.y) < 20;

        // Count coins on this platform
        let coinsOnPlatform = 0;
        for (let existingCoin of coins) {
          if (existingCoin.x > platform.x &&
            existingCoin.x < platform.x + platform.width &&
            abs(existingCoin.y - platform.y) < 20) {
            coinsOnPlatform++;
          }
        }

        // Check if platform is off-screen
        let platformIsOffScreen = platform.x > width;

        return !playerOnPlatform && coinsOnPlatform < 2 && platform.coinsCollected < 2 && platformIsOffScreen;
      });

      // If we found a valid platform, try to spawn a new coin there
      if (validPlatforms.length > 0) {
        let newPlatform = validPlatforms[floor(random(validPlatforms.length))];
        let newCoin = new Coin();

        // Try to find a valid position for the new coin
        let attempts = 0;
        let validPosition = false;
        const MIN_COIN_DISTANCE = 40; // Minimum distance between coins

        while (!validPosition && attempts < 10) {
          // Generate a random position on the platform
          newCoin.x = newPlatform.x + random(20, newPlatform.width - 20);
          newCoin.y = newPlatform.y - 10;

          // Check if this position is far enough from other coins on the same platform
          validPosition = true;
          for (let existingCoin of coins) {
            if (existingCoin.x > newPlatform.x &&
              existingCoin.x < newPlatform.x + newPlatform.width &&
              abs(existingCoin.y - newPlatform.y) < 20) {
              let distance = dist(newCoin.x, newCoin.y, existingCoin.x, existingCoin.y);
              if (distance < MIN_COIN_DISTANCE) {
                validPosition = false;
                break;
              }
            }
          }

          attempts++;
        }

        // Only add the coin if we found a valid position
        if (validPosition) {
          coins.push(newCoin);
        }
      } else {
        // If no valid platforms found, create a new platform off-screen
        let newPlatform = new Platform(width + random(minPlatformGap, maxPlatformGap),
          random(height * 0.4, height * 0.7),
          random(100, 200));
        platforms.push(newPlatform);
        let newCoin = new Coin();
        newCoin.x = newPlatform.x + random(20, newPlatform.width - 20);
        newCoin.y = newPlatform.y - 10;
        coins.push(newCoin);
      }
    }
  }

  // Ensure we always have exactly 2 coins in the game
  while (coins.length < 2) {
    // Find a platform that doesn't have the player, has less than 2 coins, hasn't had both coins collected, and is off-screen
    let validPlatforms = platforms.filter(platform => {
      // Check if player is on this platform
      let playerOnPlatform = player.x > platform.x &&
        player.x < platform.x + platform.width &&
        abs(player.y - platform.y) < 20;

      // Count coins on this platform
      let coinsOnPlatform = 0;
      for (let existingCoin of coins) {
        if (existingCoin.x > platform.x &&
          existingCoin.x < platform.x + platform.width &&
          abs(existingCoin.y - platform.y) < 20) {
          coinsOnPlatform++;
        }
      }

      // Check if platform is off-screen
      let platformIsOffScreen = platform.x > width;

      return !playerOnPlatform && coinsOnPlatform < 2 && platform.coinsCollected < 2 && platformIsOffScreen;
    });

    if (validPlatforms.length > 0) {
      let newPlatform = validPlatforms[floor(random(validPlatforms.length))];
      let newCoin = new Coin();

      // Try to find a valid position for the new coin
      let attempts = 0;
      let validPosition = false;
      const MIN_COIN_DISTANCE = 40; // Minimum distance between coins

      while (!validPosition && attempts < 10) {
        // Generate a random position on the platform
        newCoin.x = newPlatform.x + random(20, newPlatform.width - 20);
        newCoin.y = newPlatform.y - 10;

        // Check if this position is far enough from other coins on the same platform
        validPosition = true;
        for (let existingCoin of coins) {
          if (existingCoin.x > newPlatform.x &&
            existingCoin.x < newPlatform.x + newPlatform.width &&
            abs(existingCoin.y - newPlatform.y) < 20) {
            let distance = dist(newCoin.x, newCoin.y, existingCoin.x, existingCoin.y);
            if (distance < MIN_COIN_DISTANCE) {
              validPosition = false;
              break;
            }
          }
        }

        attempts++;
      }

      // Only add the coin if we found a valid position
      if (validPosition) {
        coins.push(newCoin);
      }
    } else {
      // If no valid platforms found, create a new platform off-screen
      let newPlatform = new Platform(width + random(minPlatformGap, maxPlatformGap),
        random(height * 0.3, height * 0.7),
        random(100, 200));
      platforms.push(newPlatform);
      let newCoin = new Coin();
      newCoin.x = newPlatform.x + random(20, newPlatform.width - 20);
      newCoin.y = newPlatform.y - 10;
      coins.push(newCoin);
    }
  }

  // Update and display enemies
  while (enemies.length < maxEnemies) {
    enemies.push(new Enemy());
  }

  for (let enemy of enemies) {
    enemy.move();
    enemy.display();
    if (!player.isInvincible && enemy.hit(player)) {
      gameState.lives--;
      player.isInvincible = true;
      player.invincibleTimer = 60;
      // Play miss sound when hit
      missSampler.triggerAttack("C4");
      updateLivesLEDs(true); // Pass true to indicate this is a hit
      if (gameState.lives <= 0) {
        gameState.currentScene = 'gameover';
        break;
      }
    }
  }

  // Update high score before transitioning to game over
  if (gameState.score > highScore) {
    highScore = gameState.score;
  }
}

function drawGameOverScene() {
  textSize(48);
  textAlign(CENTER);
  fill(255);
  text('GAME OVER', width / 2, height / 3);

  textSize(24);
  text('Final Score: ' + gameState.score, width / 2, height / 2);
  text('High Score: ' + highScore, width / 2, height / 2 + 40);
  text('Time Survived: ' + gameState.timeElapsed + ' seconds', width / 2, height / 2 + 80);
  text('Click to Play Again', width / 2, height / 2 + 120);

  if (isMusicInitialized) {
    Tone.Transport.stop();
    isMusicInitialized = false;
  }

  if (mouseIsPressed) {
    gameState.currentScene = 'welcome';
  }
}

function keyPressed() {
  if (keyCode === 13 && gameState.currentScene === 'welcome') {
    gameState.currentScene = 'gameplay';
    gameState.lastTime = millis();
    initAudio();
  }
}

function getPlatformSpeed() {
  // More aggressive speed scaling with score
  const speedMultiplier = min(1 + (gameState.score / 75), 8);  // Changed from 125 to 75 and max from 6 to 8
  return basePlatformSpeed * speedMultiplier;
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

function connect() {
  port.open('Arduino', 9600);
  // Send a message to Arduino to start sending joystick data
  port.write('START\n');
}

// Function to update LED lights based on lives
function updateLivesLEDs(isHit = false) {
  if (port.opened()) {
    // Send a byte where:
    // - bits 0-2 represent LED states (1 = on, 0 = off)
    // - bit 7 represents hit status (1 = hit, 0 = no hit)
    let ledState = 0;
    for (let i = 0; i < gameState.lives; i++) {
      ledState |= (1 << i);
    }

    // If this is a hit, set the hit bit
    if (isHit) {
      ledState |= 0x80;
    }

    port.write(ledState);
  }
}