import { mat4, vec3 } from 'gl-matrix';
import { ShaderProgram } from './ShaderProgram';
import { loadTexture } from './TextureLoader';
import { SparkEmitter } from './SparkEmitter';
import { SmokeEmitter } from './SmokeEmitter';
import { RainEmitter } from './RainEmitter';
import { CloudEmitter } from './CloudEmitter';
import { ComplexFireworkEmitter, SimpleFireworkEmitter } from './Fireworks';
import { FallingBallsEmitter } from './FallingBalls';

const path = '../js/task7/';

export class WebGLApp {
    constructor() {
        this.keys = {};
        this.prevKeys = {};
        this.canvas = document.getElementById('glCanvas');
        if (!(this.canvas instanceof HTMLCanvasElement)) {
            throw new Error('Canvas element not found or not a canvas');
        }

        this.gl = this.initWebGL(this.canvas);
        this.shaderProgram = null;

        this.lastTime = 0;
        this.lastFPSTime = 0;

        this.cameraPosition = [0, 0, -5];
        this.cameraRotation = { yaw: 0, pitch: 0 };
        this.moveSpeed = 2.0;
        this.mouseSensitivity = 0.002;
        this.isMouseLocked = false;

        // @ts-ignore
        this.viewMatrix = mat4.translate(mat4.create(), mat4.create(), this.cameraPosition);

        this.init().catch((error) => {
            console.error('Initialization failed:', error);
        });
    }

    initWebGL(canvas) {
        let gl = null;
        const names = ['webgl2', 'webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl'];
        for (let i = 0; i < names.length; ++i) {
            try {
                gl = canvas.getContext(names[i]);
            } catch (e) {}
            if (gl) {
                break;
            }
        }
        return gl;
    }

    async init() {
        if (!this.gl) {
            alert('WebGL not supported');
            return;
        }

        this.resizeCanvas();

        window.addEventListener('resize', () => this.resizeCanvas());

        const vsParticleSource = await this.loadShader(`${path}shaders/particle_vertex.glsl`);
        const fsParticleSource = await this.loadShader(`${path}shaders/particle_fragment.glsl`);
        this.particleProgram = new ShaderProgram(this.gl, vsParticleSource, fsParticleSource);

        this.sparkEmitter = new SparkEmitter(this.gl, [0, 0, 0], 200);
        this.smokeEmitter = new SmokeEmitter(this.gl, [0, 0, 0], 100);
        this.rainEmitter = new RainEmitter(this.gl, [0, 0, 0], 1000);
        this.cloudEmitter = new CloudEmitter(this.gl, [0, 0, 0], 50);
        this.simpleFireworkEmitter = new SimpleFireworkEmitter(this.gl, [0, -1.8, 0], 1);
        this.complexFireworkEmitter = new ComplexFireworkEmitter(this.gl, [0, -1.8, 0], 1);
        this.fallingBallsEmitter = new FallingBallsEmitter(this.gl, [0, 0, 0], (x) => {
            if (x < -7) return -100;
            if (x > 7) return -100;
            return (1 / 343) * x * x * x - (3 / 7) * x;
        });

        this.sparkEmitter.setTexture(loadTexture(this.gl, '../../textures/spark.png'));
        this.smokeEmitter.setTexture(loadTexture(this.gl, '../../textures/smoke.png'));
        this.rainEmitter.setTexture(loadTexture(this.gl, '../../textures/rain.png'));
        this.cloudEmitter.setTexture(loadTexture(this.gl, '../../textures/cloud.png'));
        this.simpleFireworkEmitter.setTexture(loadTexture(this.gl, '../../textures/flicker.png'));
        this.complexFireworkEmitter.setTexture(loadTexture(this.gl, '../../textures/flicker.png'));
        this.fallingBallsEmitter.setTexture(loadTexture(this.gl, '../../textures/ball.png'));

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.setupControls();

        requestAnimationFrame((t) => this.animate(t));
    }

    setupControls() {
        // this.canvas.addEventListener('click', () => {
        //     this.canvas.requestPointerLock();
        // });

        // document.addEventListener('pointerlockchange', () => {
        //     this.isMouseLocked = document.pointerLockElement === this.canvas;
        // });

        const buttons = ['sparkler', 'smoke', 'rain', 'clouds', 'fireworks1', 'fireworks2', 'fallingBalls'];

        function updateActiveButton(activeId) {
            buttons.forEach((id) => {
                const btn = document.getElementById(id);
                if (id === activeId) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        buttons.forEach((id) => {
            document.getElementById(id).addEventListener('click', () => {
                updateActiveButton(id);
                this.selectedEmitter = id;
            });
        });

        updateActiveButton('sparkler');
        this.selectedEmitter = 'sparkler';
    }

    async loadShader(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Не удалось загрузить шейдер: ${url}`);
        }
        return await response.text();
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

            const aspect = this.canvas.width / this.canvas.height;
            this.projectionMatrix = mat4.create();
            mat4.perspective(this.projectionMatrix, 45, aspect, 0.1, 100.0);
        }
    }

    checkAABBCollision(aabb1, aabb2) {
        return (
            aabb1.min[0] < aabb2.max[0] &&
            aabb1.max[0] > aabb2.min[0] &&
            aabb1.min[1] < aabb2.max[1] &&
            aabb1.max[1] > aabb2.min[1] &&
            aabb1.min[2] < aabb2.max[2] &&
            aabb1.max[2] > aabb2.min[2]
        );
    }

    render() {
        this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        switch (this.selectedEmitter) {
            case 'sparkler':
                this.sparkEmitter.render(this.particleProgram, this.viewMatrix, this.projectionMatrix);
                break;
            case 'smoke':
                this.smokeEmitter.render(this.particleProgram, this.viewMatrix, this.projectionMatrix);
                break;
            case 'rain':
                this.rainEmitter.render(this.particleProgram, this.viewMatrix, this.projectionMatrix);
                break;
            case 'clouds':
                this.cloudEmitter.render(this.particleProgram, this.viewMatrix, this.projectionMatrix);
                break;
            case 'fireworks1':
                this.simpleFireworkEmitter.render(this.particleProgram, this.viewMatrix, this.projectionMatrix);
                break;
            case 'fireworks2':
                this.complexFireworkEmitter.render(this.particleProgram, this.viewMatrix, this.projectionMatrix);
                break;
            case 'fallingBalls':
                this.fallingBallsEmitter.render(this.particleProgram, this.viewMatrix, this.projectionMatrix);
                break;
            default:
                break;
        }
    }

    animate(timestamp) {
        const deltaTime = (timestamp - this.lastTime) * 0.001;
        this.lastTime = timestamp;

        if (timestamp - this.lastFPSTime > 100) {
            document.getElementById('fpsCounter').textContent = `FPS: ${Math.floor(1 / deltaTime)}`;
            this.lastFPSTime = timestamp;
        }

        switch (this.selectedEmitter) {
            case 'sparkler':
                this.sparkEmitter.update(deltaTime);
                break;
            case 'smoke':
                this.smokeEmitter.update(deltaTime);
                break;
            case 'rain':
                this.rainEmitter.update(deltaTime);
                break;
            case 'clouds':
                this.cloudEmitter.update(deltaTime);
                break;
            case 'fireworks1':
                this.simpleFireworkEmitter.update(deltaTime);
                break;
            case 'fireworks2':
                this.complexFireworkEmitter.update(deltaTime);
                break;
            case 'fallingBalls':
                this.fallingBallsEmitter.update(deltaTime);
                break;
            default:
                break;
        }

        this.render();

        Object.assign(this.prevKeys, this.keys);

        requestAnimationFrame((t) => this.animate(t));
    }
}
