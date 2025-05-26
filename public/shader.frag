#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_param1;
uniform float u_param2;
uniform float u_param1_integrated;

// Adapted from Shadertoy: https://www.shadertoy.com/view/mtyGWy
// See https://youtu.be/f4s1h2YETNY

vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);
    // Clamp u_param2 to [1.0, 8.0] for loop unrolling
    float iter = clamp(u_param2*8.0, 1.0, 8.0);
    for (float i = 0.0; i < 8.0; i += 1.0) {
        if (i >= iter) break;
        uv = fract(uv * 1.5) - 0.5;
        float d = length(uv) * exp(-length(uv0));
        vec3 col = palette(length(uv0) + i * 0.4 + u_param1_integrated);
        // Use integrated value for gas pedal effect
        d = sin(d * 8.0 + u_param1_integrated * 8.0) / 8.0;
        d = abs(d);
        d = pow(0.01 / d, 1.2);
        finalColor += col * d;
    }
    gl_FragColor = vec4(finalColor, 1.0);
}
