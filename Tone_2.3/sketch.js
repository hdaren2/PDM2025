let basicSynth;
let filt;
let LFOfilt
let panner;
let fmSynth;
let values;
let noise1;
let noiseEnv;
let filt1;
let values1;
let values2;
let train1;

function preload() {
  train1 = loadImage('media/train.png');
}

function setup() {
  createCanvas(700, 400);

  filt1 = new Tone.AutoFilter({
    frequency: 5,
    depth: 0.2,
    baseFrequency: 300,
    octaves: 3
  }).toDestination().start();
  noiseEnv = new Tone.AmplitudeEnvelope({
    attack: 1,
    decay: 0.1,
    sustain: 1,
    release: 1
  }).connect(filt1);
  noise1 = new Tone.Noise("white").connect(noiseEnv).start();
  values1 = new Float32Array([-48, -30, -18, -6, 0, -6, -18, -30, -48, -96]);
}

function draw() {
  background(train1);
  textSize(24);
  text("Click to hear the train", 400, 350);
}

function mouseClicked() {
  noiseEnv.triggerAttackRelease(30);
  noise1.volume.setValueCurveAtTime(values1, Tone.now(), 30);
}
