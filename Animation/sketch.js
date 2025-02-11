let viking;
let van_helsing;
let robot;
let cyclops;
let lime;
let animation;

function preload() {
  viking = loadImage("media/viking_sprites.png");
  van_helsing = loadImage("media/van_helsing.png");
  robot = loadImage("media/robot.png");
  cyclops = loadImage("media/cyclops.png");
  lime = loadImage("media/lime.png");
}

function setup() {
  createCanvas(400, 400);
  imageMode(CENTER);

  let characters = [];
  let minDistance = 80;

  function getPosition() {
    let x, y;
    let overlapping;
    
    do {
      x = random(80, width - 80);
      y = random(80, height - 80);
      overlapping = false;

      for (let c of characters) {
        let d = dist(x, y, c.x, c.y);
        if (d < minDistance) {
          overlapping = true;
          break;
        }
      }
    } while (overlapping);

    return { x, y };
  }

  let pos = getPosition();
  character1 = new Character(pos.x, pos.y);
  characters.push(character1);

  pos2 = getPosition();
  character2 = new Character(pos2.x, pos2.y);
  characters.push(character2);

  pos3 = getPosition();
  character3 = new Character(pos3.x, pos3.y);
  characters.push(character3);

  pos4 = getPosition();
  character4 = new Character(pos4.x, pos4.y);
  characters.push(character4);

  pos5 = getPosition();
  character5 = new Character(pos5.x, pos5.y);
  characters.push(character5);

  character1.addAnimation("down", new SpriteAnimation(viking, 6, 5, 6));
  character1.addAnimation("up", new SpriteAnimation(viking, 0, 5, 6));
  character1.addAnimation("right", new SpriteAnimation(viking, 0, 0, 6));
  character1.addAnimation("left", new SpriteAnimation(viking, 0, 0, 6));
  character1.addAnimation("stand", new SpriteAnimation(viking, 0, 0, 1));
  character1.currentAnimation = "stand";

  character2.addAnimation("down", new SpriteAnimation(lime, 6, 5, 6));
  character2.addAnimation("up", new SpriteAnimation(lime, 0, 5, 6));
  character2.addAnimation("right", new SpriteAnimation(lime, 0, 0, 6));
  character2.addAnimation("left", new SpriteAnimation(lime, 0, 0, 6));
  character2.addAnimation("stand", new SpriteAnimation(lime, 0, 0, 1));
  character2.currentAnimation = "stand";

  character3.addAnimation("down", new SpriteAnimation(van_helsing, 6, 5, 6));
  character3.addAnimation("up", new SpriteAnimation(van_helsing, 0, 5, 6));
  character3.addAnimation("right", new SpriteAnimation(van_helsing, 0, 0, 6));
  character3.addAnimation("left", new SpriteAnimation(van_helsing, 0, 0, 6));
  character3.addAnimation("stand", new SpriteAnimation(van_helsing, 0, 0, 1));
  character3.currentAnimation = "stand";

  character4.addAnimation("down", new SpriteAnimation(cyclops, 6, 5, 6));
  character4.addAnimation("up", new SpriteAnimation(cyclops, 0, 5, 6));
  character4.addAnimation("right", new SpriteAnimation(cyclops, 0, 0, 6));
  character4.addAnimation("left", new SpriteAnimation(cyclops, 0, 0, 6));
  character4.addAnimation("stand", new SpriteAnimation(cyclops, 0, 0, 1));
  character4.currentAnimation = "stand";

  character5.addAnimation("down", new SpriteAnimation(robot, 6, 5, 6));
  character5.addAnimation("up", new SpriteAnimation(robot, 0, 5, 6));
  character5.addAnimation("right", new SpriteAnimation(robot, 0, 0, 6));
  character5.addAnimation("left", new SpriteAnimation(robot, 0, 0, 6));
  character5.addAnimation("stand", new SpriteAnimation(robot, 0, 0, 1));
  character5.currentAnimation = "stand";

}

function draw() {
  background(220);

  character1.draw();
  character2.draw();
  character3.draw();
  character4.draw();
  character5.draw();
}

function keyPressed() {
  character1.keyPressed();
  character2.keyPressed();
  character3.keyPressed();
  character4.keyPressed();
  character5.keyPressed();
}

function keyReleased() {
  character1.keyReleased();
  character2.keyReleased();
  character3.keyReleased();
  character4.keyReleased();
  character5.keyReleased();
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
    let animation = this.animations[this.currentAnimation]
    if (animation) {
      switch (this.currentAnimation) {
        case "up":
          this.y -= 2;
          break;
        case "down":
          this.y += 2;
          break;
        case "right":
          this.x += 2;
          break;
        case "left":
          this.x -= 2;
          break;
      }
      push();
      translate(this.x, this.y);
      animation.draw();
      pop();
    }
  }

  keyPressed() {
    switch (keyCode) {
      case UP_ARROW:
        this.currentAnimation = "up";
        break;
      case DOWN_ARROW:
        this.currentAnimation = "down";
        break;
      case RIGHT_ARROW:
        this.currentAnimation = "right";
        break;
      case LEFT_ARROW:
        this.currentAnimation = "left";
        this.animations[this.currentAnimation].flipped = true;
        break;
    }
  }

  keyReleased() {
    this.currentAnimation = "stand";
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
    image(this.spritesheet, 0, 0, 80, 80, this.u * 80, this.v * 80, 80, 80);

    this.frameCount++;
    if (this.frameCount % 10 === 0) {
      this.u++;
    }

    if (this.u === this.startU + this.duration) {
      this.u = this.startU;
    }
  }
}
