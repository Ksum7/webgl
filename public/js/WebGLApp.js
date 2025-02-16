import { mat4, vec3 } from 'gl-matrix';
import { Cube } from './Cube';

export class WebGLApp {
    constructor() {
        this.canvas = document.getElementById('glCanvas');
        if (!(this.canvas instanceof HTMLCanvasElement)) {
            throw new Error('Canvas element not found or not a canvas');
        }

        this.gl = this.canvas.getContext('webgl');
        if (!this.gl) {
            alert('WebGL not supported');
            return;
        }
        this.program = null;
        this.cube = new Cube();
        this.rotation = { x: 0, y: 0 };
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

        this.viewMatrix = mat4.create();
        mat4.translate(this.viewMatrix, this.viewMatrix, [0, 0, -5]);

        await this.setupShaders();
        this.setupBuffers();
        this.setupUniforms();

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.gl.enable(this.gl.DEPTH_TEST);

        requestAnimationFrame((t) => this.animate(t));
    }

    // @ts-ignore
    async setupShaders() {
        async function loadShader(url) {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load shader: ${url}`);
            }
            return await response.text();
        }

        try {
            const vsSource = await loadShader('../shaders/vertex.glsl');
            const fsSource = await loadShader('../shaders/fragment.glsl');

            this.program = this.createProgram(vsSource, fsSource);
            this.gl.useProgram(this.program);
        } catch (error) {
            console.error('Error loading shaders:', error);
        }
    }

    createProgram(vsSource, fsSource) {
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

    setupBuffers() {
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.cube.vertices), this.gl.STATIC_DRAW);

        const aPosition = this.gl.getAttribLocation(this.program, 'aPosition');
        this.gl.enableVertexAttribArray(aPosition);
        this.gl.vertexAttribPointer(aPosition, 3, this.gl.FLOAT, false, 0, 0);

        const colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.cube.colors), this.gl.STATIC_DRAW);

        const aColor = this.gl.getAttribLocation(this.program, 'aColor');
        this.gl.enableVertexAttribArray(aColor);
        this.gl.vertexAttribPointer(aColor, 4, this.gl.FLOAT, false, 0, 0);

        this.indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.cube.indices), this.gl.STATIC_DRAW);
    }

    setupUniforms() {
        this.uProjectionMatrix = this.gl.getUniformLocation(this.program, 'uProjectionMatrix');
        this.uModelViewMatrix = this.gl.getUniformLocation(this.program, 'uModelViewMatrix');
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

        this.modelViewMatrix = mat4.multiply(mat4.create(), this.viewMatrix, this.cube.getModelMatrix());
        this.gl.uniformMatrix4fv(this.uModelViewMatrix, false, this.modelViewMatrix);
        this.gl.drawElements(this.gl.TRIANGLES, this.cube.indices.length, this.gl.UNSIGNED_SHORT, 0);
    }

    animate(timestamp) {
        const deltaTime = (timestamp - this.lastTime) * 0.001;
        this.lastTime = timestamp;

        this.rotation.x += deltaTime * 0.5;
        this.rotation.y += deltaTime * 0.3;
        this.cube.setRotation(this.rotation.x, this.rotation.y);

        this.render();
        requestAnimationFrame((t) => this.animate(t));
    }
}
