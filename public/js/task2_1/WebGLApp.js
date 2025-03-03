import { mat4, vec3 } from 'gl-matrix';
import { Cube } from './Cube';

const path = '../js/task2_1/';

export class WebGLApp {
    constructor() {
        this.keys = {};
        this.canvas = document.getElementById('glCanvas');
        if (!(this.canvas instanceof HTMLCanvasElement)) {
            throw new Error('Canvas element not found or not a canvas');
        }

        this.gl = this.canvas.getContext('webgl');
        this.program = null;
        this.sqprogram = null;
        this.cube = new Cube(1, [-3, 0, 0], { x: 0.2, y: 0.7 }, [1, 0.84, 0, 1]);
        this.square = {
            vertices: new Float32Array([-0.5, -0.5, 0.0, 0.5, -0.5, 0.0, 0.5, 0.5, 0.0, -0.5, 0.5, 0.0]),
            colors: new Float32Array([0, 0.75, 0.75, 1, 0, 0.75, 0.75, 1, 0, 0.75, 0.75, 1, 0, 0.75, 0.75, 1]),
            indices: new Uint16Array([0, 1, 2, 0, 2, 3]),
        };
        this.pentagon = {
            vertices: new Float32Array([
                0.0,
                0.0,
                0.0,
                Math.cos(0),
                Math.sin(0),
                0.0,
                Math.cos((2 * Math.PI) / 5),
                Math.sin((2 * Math.PI) / 5),
                0.0,
                Math.cos((4 * Math.PI) / 5),
                Math.sin((4 * Math.PI) / 5),
                0.0,
                Math.cos((6 * Math.PI) / 5),
                Math.sin((6 * Math.PI) / 5),
                0.0,
                Math.cos((8 * Math.PI) / 5),
                Math.sin((8 * Math.PI) / 5),
                0.0,
            ]),
            colors: new Float32Array([
                1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0,
                0.0, 0.0, 1.0,
            ]),
            indices: new Uint16Array([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5, 0, 5, 1]),
        };

        this.podiumRotation = 0;
        this.globalRotation = 0;
        this.lastTime = 0;
        this.init().catch((error) => {
            console.error('Initialization failed:', error);
        });
    }

    // @ts-ignore
    async init() {
        if (!this.gl) {
            alert('WebGL not supported');
            return;
        }

        this.setupViewMatrix();

        this.program = await this.createProgram('shaders/vertex.glsl', 'shaders/fragment.glsl');
        this.sqprogram = await this.createProgram('shaders/vertexsq.glsl', 'shaders/fragmentsq.glsl');

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        window.addEventListener('keydown', (event) => {
            this.keys[event.key] = true;
        });

        window.addEventListener('keyup', (event) => {
            this.keys[event.key] = false;
        });
        this.gl.enable(this.gl.DEPTH_TEST);
        requestAnimationFrame((t) => this.animate(t));
    }

    setupViewMatrix() {
        this.viewMatrix = mat4.create();
        mat4.translate(this.viewMatrix, this.viewMatrix, [0, 0, -5]);
    }

    // @ts-ignore
    async createProgram(vertexShaderPath, fragmentShaderPath) {
        try {
            const vsSource = await this.loadShader(`${path}${vertexShaderPath}`);
            const fsSource = await this.loadShader(`${path}${fragmentShaderPath}`);

            const program = this.gl.createProgram();
            const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
            const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);

            this.gl.attachShader(program, vertexShader);
            this.gl.attachShader(program, fragmentShader);
            this.gl.linkProgram(program);

            if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
                console.error('Program linking error:', this.gl.getProgramInfoLog(program));
                return null;
            }

            return program;
        } catch (error) {
            console.error('Error loading shaders:', error);
        }
    }

    async loadShader(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load shader: ${url}`);
        }
        return await response.text();
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    setupBuffer(elements, type) {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(type, buffer);
        this.gl.bufferData(type, elements, this.gl.STATIC_DRAW);
        return buffer;
    }

    setupAttrib(program, name, size, type) {
        const atr = this.gl.getAttribLocation(program, name);
        this.gl.enableVertexAttribArray(atr);
        this.gl.vertexAttribPointer(atr, size, type, false, 0, 0);
        return atr;
    }

    setupUniforms(program) {
        this.uProjectionMatrix = this.gl.getUniformLocation(program, 'uProjectionMatrix');
        this.uModelViewMatrix = this.gl.getUniformLocation(program, 'uModelViewMatrix');
    }

    resizeCanvas() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;

            if (this.gl) {
                this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }

    render() {
        const aspect = this.canvas.width / this.canvas.height;
        this.projectionMatrix = mat4.create();
        mat4.perspective(this.projectionMatrix, Math.PI / 3, aspect, 0.1, 100.0);

        this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        // cube
        this.gl.useProgram(this.program);
        this.setupUniforms(this.program);
        const cubeModelMatrix = this.cube.getModelMatrix();

        let modelViewMatrix = mat4.multiply(mat4.create(), this.viewMatrix, cubeModelMatrix);

        this.gl.uniformMatrix4fv(this.uModelViewMatrix, false, modelViewMatrix);
        this.gl.uniformMatrix4fv(this.uProjectionMatrix, false, this.projectionMatrix);

        this.setupBuffer(new Float32Array(this.cube.vertices), this.gl.ARRAY_BUFFER);

        this.setupAttrib(this.program, 'aPosition', 3, this.gl.FLOAT);

        this.setupBuffer(new Float32Array(this.cube.colors), this.gl.ARRAY_BUFFER);

        this.setupAttrib(this.program, 'aColor', 4, this.gl.FLOAT);

        this.setupBuffer(new Uint16Array(this.cube.indices), this.gl.ELEMENT_ARRAY_BUFFER);

        this.gl.drawElements(this.gl.TRIANGLES, this.cube.indices.length, this.gl.UNSIGNED_SHORT, 0);

        // square
        this.gl.useProgram(this.sqprogram);
        this.setupUniforms(this.sqprogram);
        modelViewMatrix = this.viewMatrix;

        this.gl.uniformMatrix4fv(this.uModelViewMatrix, false, modelViewMatrix);
        this.gl.uniformMatrix4fv(this.uProjectionMatrix, false, this.projectionMatrix);

        this.setupBuffer(new Float32Array(this.square.vertices), this.gl.ARRAY_BUFFER);

        this.setupAttrib(this.sqprogram, 'aPosition', 3, this.gl.FLOAT);

        this.setupBuffer(new Float32Array(this.square.colors), this.gl.ARRAY_BUFFER);

        this.setupAttrib(this.sqprogram, 'aColor', 4, this.gl.FLOAT);

        this.setupBuffer(new Uint16Array(this.square.indices), this.gl.ELEMENT_ARRAY_BUFFER);

        this.gl.drawElements(this.gl.TRIANGLES, this.square.indices.length, this.gl.UNSIGNED_SHORT, 0);

        // pentagon
        this.gl.useProgram(this.program);
        this.setupUniforms(this.program);
        modelViewMatrix = mat4.translate(mat4.create(), this.viewMatrix, [3, 0, 0]);

        this.gl.uniformMatrix4fv(this.uModelViewMatrix, false, modelViewMatrix);
        this.gl.uniformMatrix4fv(this.uProjectionMatrix, false, this.projectionMatrix);

        this.setupBuffer(new Float32Array(this.pentagon.vertices), this.gl.ARRAY_BUFFER);

        this.setupAttrib(this.program, 'aPosition', 3, this.gl.FLOAT);

        this.setupBuffer(new Float32Array(this.pentagon.colors), this.gl.ARRAY_BUFFER);

        this.setupAttrib(this.program, 'aColor', 4, this.gl.FLOAT);

        this.setupBuffer(new Uint16Array(this.pentagon.indices), this.gl.ELEMENT_ARRAY_BUFFER);

        this.gl.drawElements(this.gl.TRIANGLES, this.pentagon.indices.length, this.gl.UNSIGNED_SHORT, 0);
    }

    animate(timestamp) {
        const deltaTime = (timestamp - this.lastTime) * 0.01;
        this.lastTime = timestamp;

        this.render();
        requestAnimationFrame((t) => this.animate(t));
    }
}
