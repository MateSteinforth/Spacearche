#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_param1;
uniform float u_param2;
uniform float u_param1_integrated;
uniform float u_param3;
uniform float u_param4;
uniform float u_param3_integrated;
uniform float u_param4_integrated;

void main() {
    vec4 o = vec4(0.0);
    for (int s = 0; s < 64; s++) {
        vec2 R = u_resolution.xy;
        vec2 u = (gl_FragCoord.xy*2.0 - R + vec2(float(s%8), float(s/8))/4.0 - 2.0) / R.x;
        u = floor((6.0 - vec2(atan(u.y, u.x)/3.0, length(u))) * R) + 0.5;
        // Use u_param1_integrated to control speed
        float t = u_param1_integrated;
        o += max(1.0 - fract(vec4(7.0, 6.0, 4.0, 0.0)*0.02 + (u.y*0.02 + u.x*0.4)*fract(u.x*0.61) + t) * 5.0, 0.0) / 64.0;
    }
    gl_FragColor = o;
}
