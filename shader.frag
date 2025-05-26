#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_param1;
uniform float u_param2;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  // Example: use u_param1 and u_param2 to affect color
  float circle = smoothstep(u_param1, u_param1 + 0.01, length(uv - 0.5));
  float distort = sin(u_time + u_param2 * 10.0) * 0.5 + 0.5;
  gl_FragColor = vec4(uv, circle * distort, 1.0);
}
