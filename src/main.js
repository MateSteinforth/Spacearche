import * as glsl from 'glsl-canvas-js';
import { Pane } from 'tweakpane';

const canvas = document.getElementById('shader-canvas');

// Initialize params and Tweakpane first
const params = {
  u_param1: 0.5,
  u_param2: 0.0
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

// MIDI config
const midiConfig = {
  mappings: [
    { control: 1, uniform: 'u_param1', min: 0.0, max: 1.0, label: 'Knob 1' },
    { control: 2, uniform: 'u_param2', min: -1.0, max: 1.0, label: 'Knob 2' }
  ]
};

let glslSandbox = null;
let midiUniforms = {};

// Function to update shader uniforms
function updateUniform(name, value) {
  if (glslSandbox) {
    glslSandbox.setUniform(name, value);
  }
}

// Connect Tweakpane to shader uniforms
b1.on('change', ({value}) => {
  updateUniform('u_param1', value);
});

b2.on('change', ({value}) => {
  updateUniform('u_param2', value);
});

// Keep UI in sync with MIDI
function updatePaneFromMIDI() {
  if (typeof midiUniforms.u_param1 === 'number') {
    params.u_param1 = midiUniforms.u_param1;
  }
  if (typeof midiUniforms.u_param2 === 'number') {
    params.u_param2 = midiUniforms.u_param2;
  }
  pane.refresh();
}

// Initialize shader
fetch('/shader.frag')
  .then(res => res.text())
  .then(fragmentShader => {
    glslSandbox = new glsl.Canvas(canvas);
    glslSandbox.load(fragmentShader);
    
    // Set initial uniform values
    updateUniform('u_param1', params.u_param1);
    updateUniform('u_param2', params.u_param2);
    
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();
  });

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
          updateUniform(mapping.uniform, mapped);
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
