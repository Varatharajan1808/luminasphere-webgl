export const vertexShaderSource = `
    precision mediump float;
    
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aUv;
    
    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uModelMatrix;
    uniform mat4 uNormalMatrix;
    uniform float uTime;
    uniform float uHover;
    uniform vec3 uCursor;
    uniform float uCursorActive;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
        vUv = aUv;
        vNormal = normalize(mat3(uNormalMatrix) * aNormal);
        
        vec3 pos = aPosition;
        float intensity = 0.08 + (uHover * 0.05);
        float pulse = sin(uTime * 0.8 + aPosition.y * 3.0) * intensity;
        float wave = cos(uTime * 1.2 + aPosition.x * 2.0) * (intensity * 0.6);
        
        float dist = distance(pos, uCursor);
        float ripple = sin(dist * 12.0 - uTime * 5.0) * exp(-dist * 4.0) * 0.05 * uCursorActive;
        float warp = exp(-dist * 2.5) * 0.15 * uCursorActive;
        
        pos += aNormal * (pulse + wave + ripple + warp);
        vPosition = pos;
        
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(pos, 1.0);
    }
`;

export const fragmentShaderSource = `
    precision mediump float;
    
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uHover;
    uniform vec3 uCursor;
    uniform float uCursorActive;
    uniform vec3 uCameraPosition;
    
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
    float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    
    void main() {
        float noise = snoise(vNormal * (2.0 + uHover) + uTime * 0.3);
        vec3 color = mix(uColorA, uColorB, noise * 0.5 + 0.5);
        vec3 viewDir = normalize(uCameraPosition - vPosition);
        
        // Advanced Rim Lighting (Fresnel)
        float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
        float pulse = (sin(uTime * 2.0) * 0.5 + 0.5) * 0.05;
        
        color += uColorA * uHover * 0.2;
        
        // Cursor interaction glow
        float dist = distance(vPosition, uCursor);
        float cursorGlow = smoothstep(0.8, 0.0, dist) * uCursorActive;
        color += uColorA * cursorGlow * 0.8;
        
        // Final color assembly with bloom-like Fresnel
        gl_FragColor = vec4(color + fresnel * (0.5 + pulse), 0.95);
    }
`;

export const particleVertexShader = `
    attribute vec3 aPosition;
    attribute float aSize;
    attribute float aSpeed;
    
    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
    uniform float uTime;
    uniform vec3 uCursor;
    uniform float uCursorActive;
    
    varying float vAlpha;
    
    void main() {
        vec3 pos = aPosition;
        
        // Float movement
        pos.y += sin(uTime * 0.5 + aPosition.x) * 0.2 * aSpeed;
        pos.x += cos(uTime * 0.3 + aPosition.z) * 0.2 * aSpeed;
        
        // Cursor reaction
        float dist = distance(pos, uCursor);
        float force = smoothstep(2.0, 0.0, dist) * uCursorActive;
        pos += normalize(pos - uCursor) * force * 0.5;
        
        vAlpha = (sin(uTime + aPosition.y * 10.0) * 0.5 + 0.5) * 0.5 + 0.2;
        
        gl_Position = uProjectionMatrix * uViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * (1.0 / length(gl_Position.xyz)) * 50.0;
    }
`;

export const particleFragmentShader = `
    precision mediump float;
    varying float vAlpha;
    uniform vec3 uColor;
    
    void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        float strength = 1.0 - (d * 2.0);
        gl_FragColor = vec4(uColor, strength * vAlpha);
    }
`;

