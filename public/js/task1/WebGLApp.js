import { mat4, vec3 } from 'gl-matrix';

const path = '../js/task1/';

export class WebGLApp {
    constructor() {
        this.canvas = document.getElementById('glCanvas');
        if (!(this.canvas instanceof HTMLCanvasElement)) {
            throw new Error('Canvas element not found or not a canvas');
        }

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.gl = this.canvas.getContext('webgl');

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
        this.modelViewMatrix = mat4.translate(mat4.create(), this.viewMatrix, [-0.0, 0.0, -6.0]);

        const aspect = this.canvas.width / this.canvas.height;
        this.projectionMatrix = mat4.create();
        mat4.perspective(this.projectionMatrix, Math.PI / 3, aspect, 0.1, 100.0);

        await this.setupShaders();
        this.setupBuffers();

        this.gl.enable(this.gl.DEPTH_TEST);

        this.render();
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
            const vsSquareSource = await loadShader(`${path}shaders/vertex_square.glsl`);
            const fsSquareSource = await loadShader(`${path}shaders/fragment_square.glsl`);
            this.squareProgram = this.createProgram(vsSquareSource, fsSquareSource);
            const vsTriangleSource = await loadShader(`${path}shaders/vertex_triangle.glsl`);
            const fsTriangleSource = await loadShader(`${path}shaders/fragment_triangle.glsl`);
            this.triangleProgram = this.createProgram(vsTriangleSource, fsTriangleSource);
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
        const squareVertices = [1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0];

        this.squareVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(squareVertices), this.gl.STATIC_DRAW);

        const triangleVertices = [2.0, 1.0, 0.0, 3.0, -1.0, 0.0, 1.0, -1.0, 0.0];

        this.triangleVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.triangleVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(triangleVertices), this.gl.STATIC_DRAW);
    }

    resizeCanvas() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;

            if (this.gl) {
                this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
                const aspect = this.canvas.width / this.canvas.height;
                this.projectionMatrix = mat4.create();
                mat4.perspective(this.projectionMatrix, Math.PI / 3, aspect, 0.1, 100.0);
                this.render();
            }
        }
    }

    render() {
        this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.useProgram(this.squareProgram);
        this.setupSquareUniforms();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBuffer);
        this.setupVertexAttribPointer(this.squareProgram, 'aVertexPosition');
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        this.gl.useProgram(this.triangleProgram);
        this.setupTriangleUniforms();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.triangleVertexBuffer);
        this.setupVertexAttribPointer(this.triangleProgram, 'aVertexPosition');
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    }

    setupSquareUniforms() {
        this.uProjectionMatrix = this.gl.getUniformLocation(this.squareProgram, 'uProjectionMatrix');
        this.uModelViewMatrix = this.gl.getUniformLocation(this.squareProgram, 'uModelViewMatrix');
        const uSquareColor = this.gl.getUniformLocation(this.squareProgram, 'uSquareColor');

        this.gl.uniformMatrix4fv(this.uProjectionMatrix, false, this.projectionMatrix);
        this.gl.uniformMatrix4fv(this.uModelViewMatrix, false, this.modelViewMatrix);
        this.gl.uniform4f(uSquareColor, 0.0, 0.5, 1.0, 1.0);
    }

    setupTriangleUniforms() {
        this.uProjectionMatrix = this.gl.getUniformLocation(this.triangleProgram, 'uProjectionMatrix');
        this.uModelViewMatrix = this.gl.getUniformLocation(this.triangleProgram, 'uModelViewMatrix');

        this.gl.uniformMatrix4fv(this.uProjectionMatrix, false, this.projectionMatrix);
        this.gl.uniformMatrix4fv(this.uModelViewMatrix, false, this.modelViewMatrix);
    }

    setupVertexAttribPointer(program, attributeName) {
        const location = this.gl.getAttribLocation(program, attributeName);
        this.gl.enableVertexAttribArray(location);
        this.gl.vertexAttribPointer(location, 3, this.gl.FLOAT, false, 0, 0);
    }
}
