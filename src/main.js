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
