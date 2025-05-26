#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_param1_integrated; // SPEED CONTROL

#define PI 3.141592
#define TA 6.283185
#define PH 1.570796

// 2D value noise
float noisev(vec2 p) {
    return fract(sin(p.x * 1234.0 + p.y * 2413.0) * 5647.0);
}

// Smoothed noise
float noise(vec2 uv) {
    vec2 lv = fract(uv);
    vec2 id = floor(uv);
    lv = lv * lv * (3.0 - 2.0 * lv);
    
    float bl = noisev(id);
    float br = noisev(id + vec2(1.0, 0.0));
    float tl = noisev(id + vec2(0.0, 1.0));
    float tr = noisev(id + vec2(1.0, 1.0));
    
    float b = mix(bl, br, lv.x);
    float t = mix(tl, tr, lv.x);
    return mix(b, t, lv.y);
}

float fbm(vec2 p) {
    float f = 0.0;
    f += 0.5000 * noise(p); p *= 2.01;
    f += 0.2500 * noise(p + vec2(0.0, 1.0)); p *= 2.02;
    f += 0.1250 * noise(p + vec2(1.0, 0.0)); p *= 2.03;
    f += 0.0625 * noise(p + vec2(1.0, 1.0)); p *= 2.04;
    return f / 0.9375;
}

vec3 tunnel(vec2 uv) {
    vec3 col = vec3(0.0);
    
    float r = 0.5 / length(uv) + u_param1_integrated;
    float mr = mod(r + 1000.0, 700.0);
    if (mr < 400.0) mr += 400.0;

    float theta = atan(uv.x, uv.y);
    vec2 ptc = vec2(mr * cos(theta / TA), mr * sin(theta / TA));
    
    float snv = fbm(ptc * 2.0);
    if (snv > 0.8) col = vec3(1.0);
    
    float fbm1 = pow(fbm(vec2(r, mod(theta + 0.001, PI))), 2.0);
    float fbm2 = pow(fbm(vec2(r, PI - mod(theta - 0.001, PI))), 2.0);
    float fbm3 = fbm(vec2(r, mod(theta + 0.001, PI)) * 2.0);
    float fbm4 = fbm(vec2(r, PI - mod(theta - 0.001, PI)) * 2.0);
    
    vec3 tc1 = vec3(0.0, 1.0, 0.5);
    vec3 tc2 = vec3(0.0, 0.5, 1.0);
    
    if (theta > 0.0)
        col = mix(col, mix(tc1, tc2, fbm4), fbm2);
    else
        col = mix(col, mix(tc1, tc2, fbm3), fbm1);
    
    return col;
}

vec3 calcPixel(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;
    return tunnel(uv);
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec3 col = vec3(0.0);
    
    for (float x = -1.0; x < 2.0; x += 0.5) {
        for (float y = -1.0; y < 2.0; y += 0.5) {
            vec2 offset = vec2(x, y);
            vec2 uv = (fragCoord + offset) / u_resolution.xy;
            col += calcPixel(uv);
        }
    }
    
    col /= 36.0; // 6x6 supersampling
    
    gl_FragColor = vec4(col, 1.0);
}
