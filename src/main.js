import * as glsl from 'glsl-canvas-js';

const canvas = document.getElementById('shader-canvas');

fetch('/shader.frag')
  .then(res => res.text())
  .then(fragmentShader => {
    const sandbox = new glsl.Canvas(canvas);
    sandbox.load(fragmentShader);
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
    for (const input of midiAccess.inputs.values()) {
      input.onmidimessage = (msg) => {
        console.log('MIDI data:', msg.data);
      };
    }
    midiAccess.onstatechange = (event) => {
      // Listen for new devices
      for (const input of midiAccess.inputs.values()) {
        input.onmidimessage = (msg) => {
          console.log('MIDI data:', msg.data);
        };
      }
    };
  }, (err) => {
    console.error('MIDI access error:', err);
  });
} else {
  console.warn('Web MIDI API not supported in this browser.');
}
