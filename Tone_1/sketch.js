let startContext;
let samples;
let sampler;
let button1;
let button2;
let delTimeSlider;
let feedbackSlider;
let distSlider;
let wetSlider;
let phaseSlider;
let bg;

let phase = new Tone.Phaser({
  frequency: 0,
  octaves: 3,
  baseFrequency: 350
}).toDestination();
let rev = new Tone.Reverb(1).connect(phase);
let dist = new Tone.Distortion(0).connect(rev);
let del = new Tone.FeedbackDelay(0, 0).connect(dist);
del.wet.value = 0.5;

function preload() {
  //sampler = new Tone.Player("media/cat.mp3").toDestination();
  samples = new Tone.Players({
    cat: "media/cat.mp3",
    seagull: "media/seagull.mp3",
    chime: "media/chime.mp3",
    drop: "media/drop.mp3",
    machine: "media/old_machine.mp3",
    water_drop: "media/water_drop.mp3"
  }).connect(del);

  bg = loadImage("media/background.jpg");
}

function setup() {
  createCanvas(400, 400);

  startContext = createButton("Start Audio Context");
  startContext.position(20, 20);
  startContext.mousePressed(startAudioContext);
  button1 = createButton("Play Cat Sample");
  button1.position(20, 60);
  button2 = createButton("Play Seagull Sample");
  button2.position(20, 100);
  button3 = createButton("Play Chime Sample");
  button3.position(175, 20);
  button4 = createButton("Play Drop Sample");
  button4.position(175, 60);
  button5 = createButton("Play Machine Sample");
  button5.position(175, 100);
  button6 = createButton("Play Water Drop Sample");
  button6.position(175, 140);

  button1.mousePressed(() => (samples.player("cat").start()));
  button2.mousePressed(() => (samples.player("seagull").start()));
  button3.mousePressed(() => (samples.player("chime").start()));
  button4.mousePressed(() => (samples.player("drop").start()));
  button5.mousePressed(() => (samples.player("machine").start()));
  button6.mousePressed(() => (samples.player("water_drop").start()));

  delTimeSlider = createSlider(0, 1, 0, 0.01);
  delTimeSlider.position(20, 140);
  delTimeSlider.input(() => (del.delayTime.value = delTimeSlider.value()));
  feedbackSlider = createSlider(0, 0.99, 0, 0.01);
  feedbackSlider.position(20, 180);
  feedbackSlider.input(() => (del.feedback.value = feedbackSlider.value()));
  distSlider = createSlider(0, 10, 0, 0.01);
  distSlider.position(20, 220);
  distSlider.input(() => (dist.distortion = distSlider.value()));
  wetSlider = createSlider(0, 1, 0, 0.01);
  wetSlider.position(20, 260);
  wetSlider.input(() => (rev.wet.value = wetSlider.value()))
  phaseSlider1 = createSlider(0, 20, 0, 0.01);
  phaseSlider1.position(20, 300);
  phaseSlider1.input(() => (phase.frequency.value = phaseSlider1.value()))
  //button1.mousePressed(playSample);
  //OR button1.mousePressed(() => (sampler.start()));
}

function draw() {
  background(bg);
  fill(255);
  text("Delay Time: " + delTimeSlider.value(), 25, 170);
  text("Feedback Amount: " + feedbackSlider.value(), 25, 210);
  text("Distortion Amount: " + distSlider.value(), 25, 250);
  text("Reverb Wet Amount: " + wetSlider.value(), 25, 290);
  text("Phaser Frequency: " + phaseSlider1.value() + "Hz", 25, 330);
}

//function playSample() {
//  sampler.start();
//}

function startAudioContext() {
  if (Tone.context.state != 'running') {
    Tone.start();
    console.log("Audio context started");
  } else {
    console.log("Audio context is already running");
  }
}
