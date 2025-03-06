let synth1;
let filt;
let rev;
let del;
let polySynth;
let filterSlider;
let phaseSlider;

let keyNotes = {
  'a': 'C4',
  'w': 'C#4',
  's': 'D4',
  'e': 'D#4',
  'd': 'E4',
  'f': 'F4',
  't': 'F#4',
  'g': 'G4',
  'y': 'G#4',
  'h': 'A4',
  'u': 'A#4',
  'j': 'B4',
  'k': 'C5',
  'o': 'C#5',
  'l': "D5",
  'p': "D#5"
};
let phase = new Tone.Phaser({
  frequency: 0,
  octaves: 3,
  baseFrequency: 350
}).toDestination();

function setup() {
  createCanvas(400, 400);

  del = new Tone.FeedbackDelay(0, 0).connect(phase);
  filt = new Tone.Filter(0, "lowpass").connect(del);
  rev = new Tone.Reverb(3).connect(filt);
  synth1 = new Tone.PolySynth(Tone.FMSynth).connect(rev); 
  synth1.set({
    envelope: {
      attack: 0.1,
      decay: 0.5,
      sustain: 0.5,
      release: 0.1
    },
    oscillator: {
      type: 'triangle'
    }
  });
  synth1.volume.value = -6;

  filterSlider = createSlider(0, 2000, 800, 10);
  filterSlider.position(200, 170);
  phaseSlider = createSlider(0, 20, 0, 0.01);
  phaseSlider.position(200, 210);
  phaseSlider.input(() => (phase.frequency.value = phaseSlider.value()));
  
}

function draw() {
  background(220);

  fill(0);
  text("Press keys:", 20, 50);
  text(" A W S E D F T G Y H U J K O L P", 20, 70);
  text("Mapping:", 20, 100);
  text("A = C4", 20, 120);
  text("W = C#4", 20, 135);
  text("S = D4", 20, 150);
  text("E = D#4", 20, 165);
  text("D = E4", 20, 180);
  text("F = F4", 20, 195);
  text("T = F#4", 20, 210);
  text("G = G4", 20, 225);
  text("Y = G#4", 20, 240);
  text("H = A4", 20, 255);
  text("U = A#4", 20, 270);
  text("J = B4", 20, 285);
  text("K = C5", 20, 300);
  text("O = C#5", 20, 315);
  text("L = D5", 20, 330);
  text("P = D#5", 20, 345);
  text("Filter Frequency: ", 200, 170);
  text("Phaser Frequency: ", 200, 210);
  
  filt.frequency.value = filterSlider.value();
}

function keyPressed() {
  let pitch = keyNotes[key];

  if (pitch) {
    synth1.triggerAttack(pitch);
  } 
}

function keyReleased() {
  let pitch = keyNotes[key];

  if (pitch) {
    synth1.triggerRelease(pitch);
  }

}
