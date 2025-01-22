function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  angleMode(DEGREES);
}

function draw() {
  background(50);

  noStroke();
  fill(150, 150, 150);
  rect(100, 300, 200, 100);

  stroke(0);
  strokeWeight(2);
  fill(255);
  circle(150, 350, 80);

  stroke(0);
  strokeWeight(2);
  fill(255);
  square(210, 310, 80);

  noStroke();
  fill(255);
  square(100, 500, 200);

  fill(0, 100, 100, 0.3);
  circle(200, 570, 100);

  fill(240, 100, 100, 0.3);
  circle(170, 630, 100);

  fill(120, 100, 100, 0.3);
  circle(230, 630, 100);

  noStroke();
  fill(0);
  rect(300, 100, 200, 100);

  fill(60, 100, 100);
  circle(350, 150, 80);

  fill(0)
  triangle(300, 110, 300, 190, 350, 150)

  fill(0, 100, 100);
  circle(450, 150, 80);
  rect(410, 150, 80, 40);

  fill(255);
  circle(430, 150, 25);
  circle(470, 150, 25);

  fill(240, 100, 100);
  circle(430, 150, 15);
  circle(470, 150, 15);

  fill(240, 100, 50);
  square(400, 300, 200);

  stroke(255);
  strokeWeight(3);
  fill(120, 100, 50);
  circle(500, 400, 100);

  fill(0, 100, 100);
  stroke(255);
  strokeWeight(3);
  beginShape();
  vertex(500, 350);
  vertex(488, 385);
  vertex(452, 385);
  vertex(483, 405);
  vertex(470, 442);
  vertex(500, 420);
  vertex(530, 442);
  vertex(517, 405);
  vertex(548, 385);
  vertex(512, 385);
  endShape(CLOSE);

}