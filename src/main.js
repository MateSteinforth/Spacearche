import * as glsl from 'glsl-canvas-js';
import { Pane } from 'tweakpane';

const canvas = document.getElementById('shader-canvas');

// Initialize params and Tweakpane first
const params = {
  u_param1: 0.5,
  u_param2: 0.0,
  u_param3: 0.0,
  u_param4: 0.0
};

const pane = new Pane({
  container: document.getElementById('tweakpane-container'),
  title: 'Shader Controls',
  expanded: true
});

// Add a folder for better organization
const controls = pane.addFolder({
  title: 'Parameters',
  expanded: true
});

const b1 = controls.addBinding(params, 'u_param1', {
  min: 0.0,
  max: 1.0,
  label: 'Knob 1',
  step: 0.01
});

const b2 = controls.addBinding(params, 'u_param2', {
  min: -1.0,
  max: 1.0,
  label: 'Knob 2',
  step: 0.01
});
const b3 = controls.addBinding(params, 'u_param3', {
  min: -1.0,
  max: 1.0,
  label: 'Knob 3',
  step: 0.01
});
const b4 = controls.addBinding(params, 'u_param4', {
  min: -1.0,
  max: 1.0,
  label: 'Knob 4',
  step: 0.01
});

// MIDI config
const midiConfig = {
  mappings: [
    { control: 1, uniform: 'u_param1', min: 0.0, max: 1.0, label: 'Knob 1' },
    { control: 2, uniform: 'u_param2', min: -1.0, max: 1.0, label: 'Knob 2' },
    { control: 3, uniform: 'u_param3', min: -1.0, max: 1.0, label: 'Knob 3' },
    { control: 4, uniform: 'u_param4', min: -1.0, max: 1.0, label: 'Knob 4' }
  ]
};

let glslSandbox = null;
let midiUniforms = {};

// --- Exponential Smoother ---
class ExponentialSmoother {
  constructor(initial, alpha = 0.05) {
    this.value = initial;
    this.target = initial;
    this.alpha = alpha;
  }
  tick() {
    this.value += (this.target - this.value) * this.alpha;
  }
}

const smoothParam1 = new ExponentialSmoother(params.u_param1, 0.15);
const smoothParam2 = new ExponentialSmoother(params.u_param2, 0.15);
const smoothParam3 = new ExponentialSmoother(params.u_param3, 0.15);
const smoothParam4 = new ExponentialSmoother(params.u_param4, 0.15);

let u_param1_integrated = 0;
let u_param2_integrated = 0;
let u_param3_integrated = 0;
let u_param4_integrated = 0;
let lastTime = performance.now();

// --- Function to update shader uniforms ---
function updateUniform(name, value) {
  if (glslSandbox) {
    glslSandbox.setUniform(name, value);
  }
}

// Connect Tweakpane to shader uniforms
b1.on('change', ({value}) => {
  // Only update target, smoothing will handle the rest
  smoothParam1.target = value;
});

b2.on('change', ({value}) => {
  smoothParam2.target = value;
});
b3.on('change', ({value}) => {
  smoothParam3.target = value;
});
b4.on('change', ({value}) => {
  smoothParam4.target = value;
});

// Keep UI in sync with MIDI
function updatePaneFromMIDI() {
  if (typeof midiUniforms.u_param1 === 'number') {
    params.u_param1 = midiUniforms.u_param1;
    smoothParam1.target = midiUniforms.u_param1;
  }
  if (typeof midiUniforms.u_param2 === 'number') {
    params.u_param2 = midiUniforms.u_param2;
    smoothParam2.target = midiUniforms.u_param2;
  }
  if (typeof midiUniforms.u_param3 === 'number') {
    params.u_param3 = midiUniforms.u_param3;
    smoothParam3.target = midiUniforms.u_param3;
  }
  if (typeof midiUniforms.u_param4 === 'number') {
    params.u_param4 = midiUniforms.u_param4;
    smoothParam4.target = midiUniforms.u_param4;
  }
  pane.refresh();
}

// --- Animation loop for smoothing ---
function animateSmoothing() {
  const now = performance.now();
  const dt = (now - lastTime) / 1000.0; // seconds
  lastTime = now;

  smoothParam1.tick();
  smoothParam2.tick();
  smoothParam3.tick();
  smoothParam4.tick();
  updateUniform('u_param1', smoothParam1.value);
  updateUniform('u_param2', smoothParam2.value);
  updateUniform('u_param3', smoothParam3.value);
  updateUniform('u_param4', smoothParam4.value);

  // Integrate u_param1 for gas pedal effect
  u_param1_integrated += smoothParam1.value * dt;
  u_param2_integrated += smoothParam2.value * dt;
  u_param3_integrated += smoothParam3.value * dt;
  u_param4_integrated += smoothParam4.value * dt;
  updateUniform('u_param1_integrated', u_param1_integrated);
  updateUniform('u_param2_integrated', u_param2_integrated);
  updateUniform('u_param3_integrated', u_param3_integrated);
  updateUniform('u_param4_integrated', u_param4_integrated);

  requestAnimationFrame(animateSmoothing);
}
requestAnimationFrame(animateSmoothing);

// List of available shaders
const shaderList = [
  { name: 'Default', file: 'shader.frag' },
  { name: 'Hyperspace', file: 'hyperspace.frag' },
  { name: 'Shader 2', file: 'name2.frag' }
];

// Add dropdown to Tweakpane
const shaderParams = { shader: shaderList[0].file };
const shaderPane = pane.addFolder({ title: 'Shader Selection', expanded: true });
shaderPane.addBinding(shaderParams, 'shader', {
  options: Object.fromEntries(shaderList.map(s => [s.name, s.file]))
}).on('change', (ev) => {
  loadShader(ev.value);
});

function loadShader(shaderFile) {
  fetch('/' + shaderFile + '?v=' + Date.now())
    .then(res => res.text())
    .then(fragmentShader => {
      if (!glslSandbox) {
        glslSandbox = new glsl.Canvas(canvas);
      }
      glslSandbox.load(fragmentShader);
      // Set all uniforms to current values
      updateUniform('u_param1', smoothParam1.value);
      updateUniform('u_param2', smoothParam2.value);
      updateUniform('u_param3', smoothParam3.value);
      updateUniform('u_param4', smoothParam4.value);
      updateUniform('u_param1_integrated', u_param1_integrated);
      updateUniform('u_param2_integrated', u_param2_integrated);
      updateUniform('u_param3_integrated', u_param3_integrated);
      updateUniform('u_param4_integrated', u_param4_integrated);
      // Resize canvas
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
}

// Replace initial shader loading with:
loadShader(shaderParams.shader);

// MIDI support
if (navigator.requestMIDIAccess) {
  navigator.requestMIDIAccess().then((midiAccess) => {
    function handleMIDIMessage(msg) {
      const [status, control, value] = msg.data;
      if ((status & 0xF0) === 0xB0) {
        const mapping = midiConfig.mappings.find(m => m.control === control);
        if (mapping) {
          const norm = value / 127;
          const mapped = mapping.min + (mapping.max - mapping.min) * norm;
          midiUniforms[mapping.uniform] = mapped;
          // Set smoothing target
          if (mapping.uniform === 'u_param1') smoothParam1.target = mapped;
          if (mapping.uniform === 'u_param2') smoothParam2.target = mapped;
          if (mapping.uniform === 'u_param3') smoothParam3.target = mapped;
          if (mapping.uniform === 'u_param4') smoothParam4.target = mapped;
          updatePaneFromMIDI();
          console.log(`Set ${mapping.uniform} to ${mapped} (label: ${mapping.label})`);
        }
      }
      console.log('MIDI data:', msg.data);
    }

    for (const input of midiAccess.inputs.values()) {
      input.onmidimessage = handleMIDIMessage;
    }

    midiAccess.onstatechange = (event) => {
      for (const input of midiAccess.inputs.values()) {
        input.onmidimessage = handleMIDIMessage;
      }
    };
  }).catch(err => {
    console.error('MIDI access error:', err);
  });
} else {
  console.warn('Web MIDI API not supported in this browser.');
}
