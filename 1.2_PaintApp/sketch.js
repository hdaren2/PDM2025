let dragging = false;
let lineHue;

function setup() {
  createCanvas(710, 400);
  background(220);
  strokeWeight(10);
  colorMode(HSB);
}

function draw() {
  noStroke();
  fill('red');
  square(2, 2, 20);
  if (mouseIsPressed && mouseX > 2 && mouseX < 22 && mouseY > 2 && mouseY < 22) {
    lineHue = color('red');
  }

  noStroke();
  fill('orange');
  square(2, 24, 20);
  if (mouseIsPressed && mouseX > 2 && mouseX < 22 && mouseY > 24 && mouseY < 44) {
    lineHue = color('orange');
  }

  noStroke();
  fill('yellow');
  square(2, 46, 20);
  if (mouseIsPressed && mouseX > 2 && mouseX < 22 && mouseY > 46 && mouseY < 66) {
    lineHue = color('yellow');
  }

  noStroke();
  fill('green');
  square(2, 68, 20);
  if (mouseIsPressed && mouseX > 2 && mouseX < 22 && mouseY > 68 && mouseY < 88) {
    lineHue = color('green');
  }

  noStroke();
  fill('cyan');
  square(2, 90, 20);
  if (mouseIsPressed && mouseX > 2 && mouseX < 22 && mouseY > 90 && mouseY < 110) {
    lineHue = color('cyan');
  }

  noStroke();
  fill('blue');
  square(2, 112, 20);
  if (mouseIsPressed && mouseX > 2 && mouseX < 22 && mouseY > 112 && mouseY < 132) {
    lineHue = color('blue');
  }

  noStroke();
  fill('magenta');
  square(2, 134, 20);
  if (mouseIsPressed && mouseX > 2 && mouseX < 22 && mouseY > 134 && mouseY < 154) {
    lineHue = color('magenta');
  }

  noStroke();
  fill('brown');
  square(2, 156, 20);
  if (mouseIsPressed && mouseX > 2 && mouseX < 22 && mouseY > 156 && mouseY < 176) {
    lineHue = color('brown');
  }

  noStroke();
  fill('white');
  square(2, 178, 20);
  if (mouseIsPressed && mouseX > 2 && mouseX < 22 && mouseY > 178 && mouseY < 198) {
    lineHue = color('white');
  }

  noStroke();
  fill('black');
  square(2, 200, 20);
  if (mouseIsPressed && mouseX > 2 && mouseX < 22 && mouseY > 200 && mouseY < 220) {
    lineHue = color('black');
  }

}

function mouseDragged() {
  stroke(lineHue, 90, 90);
  line(pmouseX, pmouseY, mouseX, mouseY);
}

