let startContext;
let noise;
let noiseEnv;
let filt;
let values;
let train1;

function preload() {
  train1 = loadImage('media/train.png');
}

function setup() {
  createCanvas(700, 400);

  startContext = createButton("Start Audio Context");
  startContext.position(20, 20);
  startContext.mousePressed(startAudioContext);
  
  filt = new Tone.AutoFilter({
    frequency: 5,
    depth: 0.2,
    baseFrequency: 300,
    octaves: 3
  }).toDestination();
  noiseEnv = new Tone.AmplitudeEnvelope({
    attack: 1,
    decay: 0.1,
    sustain: 1,
    release: 1
  }).connect(filt);
  noise = new Tone.Noise("white").connect(noiseEnv);
  values = new Float32Array([-48, -42, -36, -30, -24, -18, -12, -6, 0, -6, -12, -18, -24, -30, -36, -48, -96]);
}

function draw() {
  background(train1);
  textSize(24);
  text("Start Audio Context then click the train to hear it", 400, 350);
}

function mouseClicked() {
  Tone.start();
  noiseEnv.triggerAttackRelease(30);
  noise.volume.setValueCurveAtTime(values, Tone.now(), 30);
}

function startAudioContext() {
  if (Tone.context.state != 'running') {
    Tone.start();
    console.log("Audio context started");
  } else {
    console.log("Audio context is already running");
  }
}
