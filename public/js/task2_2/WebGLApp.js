import { mat4, vec3 } from 'gl-matrix';
import { Cube } from './Cube';

const path = '../js/task2_2/';

export class WebGLApp {
    constructor() {
        this.keys = {};
        this.canvas = document.getElementById('glCanvas');
        if (!(this.canvas instanceof HTMLCanvasElement)) {
            throw new Error('Canvas element not found or not a canvas');
        }

        this.gl = this.canvas.getContext('webgl');
        this.program = null;
        this.cubes = [
            new Cube(1, [-3, 0, 0], { x: 0, y: 0 }, [0.75, 0.75, 0.75, 1]),
            new Cube(1, [-2, 0, 0], { x: 0, y: 0 }, [0, 1, 1, 1]),
            new Cube(1, [-2, 1, 0], { x: 0, y: 0 }, [1, 0.84, 0, 1]),
            new Cube(1, [-1, 0, 0], { x: 0, y: 0 }, [0.8, 0.5, 0.2, 1]),
        ];

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
        this.gl.useProgram(this.program);

        this.setupUniforms(this.program);

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

    drawCube(cube) {
        const podiumModelMatrix = mat4.create();
        // @ts-ignore
        mat4.translate(podiumModelMatrix, podiumModelMatrix, this.podiumCenter);

        mat4.rotateY(podiumModelMatrix, podiumModelMatrix, this.podiumRotation);
        mat4.translate(
            podiumModelMatrix,
            podiumModelMatrix,
            // @ts-ignore
            this.podiumCenter.map((x) => -1 * x)
        );

        const globalMatrix = mat4.create();

        mat4.rotateY(globalMatrix, globalMatrix, this.globalRotation);
        mat4.multiply(globalMatrix, globalMatrix, podiumModelMatrix);

        const cubeModelMatrix = cube.getModelMatrix();

        const modelViewMatrix = mat4.multiply(mat4.create(), this.viewMatrix, globalMatrix);
        mat4.multiply(modelViewMatrix, modelViewMatrix, cubeModelMatrix);

        this.gl.uniformMatrix4fv(this.uModelViewMatrix, false, modelViewMatrix);

        this.setupBuffer(new Float32Array(cube.vertices), this.gl.ARRAY_BUFFER);

        this.setupAttrib(this.program, 'aPosition', 3, this.gl.FLOAT);

        this.setupBuffer(new Float32Array(cube.colors), this.gl.ARRAY_BUFFER);

        this.setupAttrib(this.program, 'aColor', 4, this.gl.FLOAT);

        this.setupBuffer(new Uint16Array(cube.indices), this.gl.ELEMENT_ARRAY_BUFFER);

        this.gl.drawElements(this.gl.TRIANGLES, cube.indices.length, this.gl.UNSIGNED_SHORT, 0);
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

            if (this.program) {
                const aspect = this.canvas.width / this.canvas.height;
                this.projectionMatrix = mat4.create();
                mat4.perspective(this.projectionMatrix, Math.PI / 3, aspect, 0.1, 100.0);

                this.gl.uniformMatrix4fv(this.uProjectionMatrix, false, this.projectionMatrix);
            }
        }
    }

    render() {
        this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.podiumCenter = this.getPodiumCenter();
        this.cubes.forEach((cube) => {
            this.drawCube(cube);
        });
    }

    animate(timestamp) {
        const deltaTime = (timestamp - this.lastTime) * 0.01;
        this.lastTime = timestamp;

        if (this.keys['1']) this.cubes[0].rotation.y += 0.1 * deltaTime;
        if (this.keys['2']) this.cubes[1].rotation.y += 0.1 * deltaTime;
        if (this.keys['3']) this.cubes[2].rotation.y += 0.1 * deltaTime;
        if (this.keys['4']) this.cubes[3].rotation.y += 0.1 * deltaTime;
        if (this.keys['5']) this.podiumRotation += 0.1 * deltaTime;
        if (this.keys['a']) this.globalRotation += 0.1 * deltaTime;
        if (this.keys['d']) this.globalRotation -= 0.1 * deltaTime;

        this.render();
        requestAnimationFrame((t) => this.animate(t));
    }

    getPodiumCenter() {
        let sumX = 0;
        let sumY = 0;
        let sumZ = 0;

        for (let i = 0; i < this.cubes.length; i++) {
            const [x, y, z] = this.cubes[i].position;
            sumX += x;
            sumY += y;
            sumZ += z;
        }

        const centerX = sumX / this.cubes.length;
        const centerY = sumY / this.cubes.length;
        const centerZ = sumZ / this.cubes.length;

        return [centerX, centerY, centerZ];
    }
}
