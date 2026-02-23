import { mat4, vec3 } from 'gl-matrix';
import { GeometryUtils, GeometryData } from './geometry';
import { vertexShaderSource, fragmentShaderSource } from './shaders';

interface Palette {
    name: string;
    colorA: vec3 | number[];
    colorB: vec3 | number[];
}

class WebGLOrb {
    private canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;
    private currentPalette: number = 0;
    private palettes: Palette[] = [
        { name: 'Cyan', colorA: [0.0, 0.949, 0.918], colorB: [0.122, 0.161, 0.216] },
        { name: 'Violet', colorA: [0.545, 0.361, 0.965], colorB: [0.180, 0.063, 0.396] },
        { name: 'Gold', colorA: [0.984, 0.749, 0.141], colorB: [0.271, 0.102, 0.012] },
        { name: 'Crimson', colorA: [0.957, 0.247, 0.369], colorB: [0.298, 0.020, 0.098] }
    ];

    private rotation = { y: 0, z: 0 };
    private time: number = 0;
    private hoverValue: number = 0;
    private cursorActive: number = 0;
    private cursorPosition: vec3 | number[] = [0, 0, 0];
    private targetColorA: vec3 | number[] = [...this.palettes[0].colorA];
    private targetColorB: vec3 | number[] = [...this.palettes[0].colorB];
    private currentColorA: vec3 | number[] = [...this.palettes[0].colorA];
    private currentColorB: vec3 | number[] = [...this.palettes[0].colorB];
    private floatOffset: number = 0;
    private isMouseOver: boolean = false;
    private lastTime: number = 0;

    private geometry!: GeometryData;
    private positionBuffer!: WebGLBuffer;
    private normalBuffer!: WebGLBuffer;
    private uvBuffer!: WebGLBuffer;
    private indexBuffer!: WebGLBuffer;
    private program!: WebGLProgram;

    private projectionMatrix!: mat4;
    private viewMatrix!: mat4;
    private modelMatrix!: mat4;
    private normalMatrix!: mat4;

    private attributes!: { [key: string]: number };
    private uniforms!: { [key: string]: WebGLUniformLocation | null };

    constructor() {
        this.canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
        const gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');

        if (!gl) {
            alert('WebGL not supported');
            throw new Error('WebGL not supported');
        }
        this.gl = gl as WebGLRenderingContext;

        this.init();
    }

    private init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.geometry = GeometryUtils.createIcosahedron(2, 4);

        this.createBuffers();
        this.createShaderProgram();
        this.setupMatrices();
        this.setupEventListeners();
        requestAnimationFrame((time) => this.render(time));
    }

    private resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        if (this.projectionMatrix) {
            const aspect = this.canvas.width / this.canvas.height;
            let fov = 45;

            if (aspect < 1.0) {
                const hfov = 45 * Math.PI / 180;
                fov = (2 * Math.atan(Math.tan(hfov / 2) / aspect)) * 180 / Math.PI;
            }

            mat4.perspective(this.projectionMatrix, fov * Math.PI / 180, aspect, 0.1, 100);
        }
    }

    private createBuffers() {
        const gl = this.gl;
        this.positionBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.geometry.positions, gl.STATIC_DRAW);

        this.normalBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.geometry.normals, gl.STATIC_DRAW);

        this.uvBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.geometry.uvs, gl.STATIC_DRAW);

        this.indexBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.geometry.indices, gl.STATIC_DRAW);
    }

    private createShader(type: number, source: string): WebGLShader | null {
        const gl = this.gl;
        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    private createShaderProgram() {
        const gl = this.gl;
        const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

        if (!vertexShader || !fragmentShader) return;

        this.program = gl.createProgram()!;
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Program error:', gl.getProgramInfoLog(this.program));
            return;
        }

        gl.useProgram(this.program);

        this.attributes = {
            position: gl.getAttribLocation(this.program, 'aPosition'),
            normal: gl.getAttribLocation(this.program, 'aNormal'),
            uv: gl.getAttribLocation(this.program, 'aUv')
        };

        this.uniforms = {
            projectionMatrix: gl.getUniformLocation(this.program, 'uProjectionMatrix'),
            viewMatrix: gl.getUniformLocation(this.program, 'uViewMatrix'),
            modelMatrix: gl.getUniformLocation(this.program, 'uModelMatrix'),
            normalMatrix: gl.getUniformLocation(this.program, 'uNormalMatrix'),
            time: gl.getUniformLocation(this.program, 'uTime'),
            colorA: gl.getUniformLocation(this.program, 'uColorA'),
            colorB: gl.getUniformLocation(this.program, 'uColorB'),
            hover: gl.getUniformLocation(this.program, 'uHover'),
            cursor: gl.getUniformLocation(this.program, 'uCursor'),
            cursorActive: gl.getUniformLocation(this.program, 'uCursorActive'),
            cameraPosition: gl.getUniformLocation(this.program, 'uCameraPosition')
        };
    }

    private setupMatrices() {
        this.projectionMatrix = mat4.create();
        const aspect = this.canvas.width / this.canvas.height;
        mat4.perspective(this.projectionMatrix, 45 * Math.PI / 180, aspect, 0.1, 100);

        this.viewMatrix = mat4.create();
        const eye = vec3.fromValues(0, 0, 6);
        const center = vec3.fromValues(0, 0, 0);
        const up = vec3.fromValues(0, 1, 0);
        mat4.lookAt(this.viewMatrix, eye, center, up);

        this.modelMatrix = mat4.create();
        this.normalMatrix = mat4.create();
    }

    private setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e.clientX, e.clientY));

        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                this.handleMove(e.touches[0].clientX, e.touches[0].clientY);
                this.handleClick();
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.handleMove(e.touches[0].clientX, e.touches[0].clientY);
                e.preventDefault();
            }
        }, { passive: false });

        this.canvas.addEventListener('mouseleave', () => {
            this.isMouseOver = false;
            this.canvas.classList.remove('hovering');
        });

        this.canvas.addEventListener('click', () => this.handleClick());

        this.canvas.addEventListener('touchend', () => {
            this.isMouseOver = false;
            this.canvas.classList.remove('hovering');
        });
    }

    private handleClick() {
        if (!this.isMouseOver) return;

        this.currentPalette = (this.currentPalette + 1) % this.palettes.length;
        this.targetColorA = [...this.palettes[this.currentPalette].colorA];
        this.targetColorB = [...this.palettes[this.currentPalette].colorB];

        const name = this.palettes[this.currentPalette].name;
        const c = this.targetColorA;
        const colorString = `rgb(${c[0] * 255}, ${c[1] * 255}, ${c[2] * 255})`;

        const paletteNameEl = document.getElementById('palette-name');
        if (paletteNameEl) {
            paletteNameEl.textContent = name;
            paletteNameEl.style.color = colorString;
        }

        const heading = document.querySelector('#info h3') as HTMLElement;
        if (heading) {
            heading.style.background = `linear-gradient(135deg, ${colorString} 0%, ${colorString} 100%)`;
            heading.style.webkitBackgroundClip = 'text';
            (heading.style as any).backgroundClip = 'text';
        }
    }

    private handleMove(clientX: number, clientY: number) {
        const rect = this.canvas.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((clientY - rect.top) / rect.height) * 2 + 1;
        const distance = Math.sqrt(x * x + y * y);

        if (distance < 0.6) {
            this.isMouseOver = true;
            this.canvas.classList.add('hovering');
            this.cursorPosition = [x * 5, y * 5, 0];
        } else {
            this.isMouseOver = false;
            this.canvas.classList.remove('hovering');
        }
    }

    private lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

    private lerpColor(current: vec3 | number[], target: vec3 | number[], t: number): number[] {
        return [
            this.lerp(current[0], target[0], t),
            this.lerp(current[1], target[1], t),
            this.lerp(current[2], target[2], t)
        ];
    }

    private update(deltaTime: number) {
        this.time += deltaTime * 0.001;
        this.rotation.y += 0.002;
        this.rotation.z += 0.001;

        this.hoverValue = this.lerp(this.hoverValue, this.isMouseOver ? 1 : 0, 0.05);
        this.cursorActive = this.lerp(this.cursorActive, this.isMouseOver ? 1 : 0, 0.1);
        this.currentColorA = this.lerpColor(this.currentColorA, this.targetColorA, 0.05);
        this.currentColorB = this.lerpColor(this.currentColorB, this.targetColorB, 0.05);
        this.floatOffset = Math.sin(this.time * 0.5) * 0.15 + Math.cos(this.time * 0.3) * 0.05;

        mat4.identity(this.modelMatrix);
        mat4.translate(this.modelMatrix, this.modelMatrix, [0, this.floatOffset, 0]);
        mat4.rotate(this.modelMatrix, this.modelMatrix, this.rotation.y, [0, 1, 0]);
        mat4.rotate(this.modelMatrix, this.modelMatrix, this.rotation.z, [0, 0, 1]);

        mat4.invert(this.normalMatrix, this.modelMatrix);
        mat4.transpose(this.normalMatrix, this.normalMatrix);
    }

    private render(currentTime: number = 0) {
        const deltaTime = currentTime - (this.lastTime || currentTime);
        this.lastTime = currentTime;
        this.update(deltaTime);

        const gl = this.gl;
        gl.clearColor(0.02, 0.02, 0.02, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(this.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(this.attributes.position);
        gl.vertexAttribPointer(this.attributes.position, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.enableVertexAttribArray(this.attributes.normal);
        gl.vertexAttribPointer(this.attributes.normal, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.enableVertexAttribArray(this.attributes.uv);
        gl.vertexAttribPointer(this.attributes.uv, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.uniformMatrix4fv(this.uniforms.projectionMatrix, false, this.projectionMatrix);
        gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, this.viewMatrix);
        gl.uniformMatrix4fv(this.uniforms.modelMatrix, false, this.modelMatrix);
        gl.uniformMatrix4fv(this.uniforms.normalMatrix, false, this.normalMatrix);
        gl.uniform1f(this.uniforms.time, this.time);
        gl.uniform3fv(this.uniforms.colorA, this.currentColorA as Float32List);
        gl.uniform3fv(this.uniforms.colorB, this.currentColorB as Float32List);
        gl.uniform1f(this.uniforms.hover, this.hoverValue);
        gl.uniform3fv(this.uniforms.cursor, this.cursorPosition as Float32List);
        gl.uniform1f(this.uniforms.cursorActive, this.cursorActive);
        gl.uniform3fv(this.uniforms.cameraPosition, [0, 0, 6]);

        gl.drawElements(gl.TRIANGLES, this.geometry.indices.length, gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame((time) => this.render(time));
    }
}

window.addEventListener('DOMContentLoaded', () => new WebGLOrb());
