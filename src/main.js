import * as glsl from 'glsl-canvas-js';

const canvas = document.getElementById('shader-canvas');

// MIDI-to-uniform mapping config
const midiConfig = {
  mappings: [
    { control: 1, uniform: 'u_param1', min: 0.0, max: 1.0, label: 'Knob 1' },
    { control: 2, uniform: 'u_param2', min: -1.0, max: 1.0, label: 'Knob 2' }
  ]
};

let glslSandbox = null;
let midiUniforms = {};

fetch('/shader.frag')
  .then(res => res.text())
  .then(fragmentShader => {
    glslSandbox = new glsl.Canvas(canvas);
    glslSandbox.load(fragmentShader);
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();
  });

// MIDI support with uniform control
if (navigator.requestMIDIAccess) {
  navigator.requestMIDIAccess().then((midiAccess) => {
    function handleMIDIMessage(msg) {
      const [status, control, value] = msg.data;
      // Only handle CC messages (status 0xB0 - 0xBF)
      if ((status & 0xF0) === 0xB0) {
        const mapping = midiConfig.mappings.find(m => m.control === control);
        if (mapping && glslSandbox) {
          // Map MIDI value (0-127) to uniform range
          const norm = value / 127;
          const mapped = mapping.min + (mapping.max - mapping.min) * norm;
          midiUniforms[mapping.uniform] = mapped;
          glslSandbox.setUniform(mapping.uniform, mapped);
          console.log(`Set ${mapping.uniform} to ${mapped} (label: ${mapping.label})`);
        }
      }
      // Log all MIDI data
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
  }, (err) => {
    console.error('MIDI access error:', err);
  });
} else {
  console.warn('Web MIDI API not supported in this browser.');
}
