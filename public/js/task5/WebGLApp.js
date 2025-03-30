import { mat4, vec3 } from 'gl-matrix';
import { Cube } from './Cube';
import { ShaderProgram } from './ShaderProgram';
import { loadTexture } from './TextureLoader';
import { ThreeObject } from './ThreeObject';
import { PointLight, DirectionalLight, SpotLight } from './Light';

const path = '../js/task5/';

export class WebGLApp {
    constructor() {
        this.keys = {};
        this.canvas = document.getElementById('glCanvas');
        if (!(this.canvas instanceof HTMLCanvasElement)) {
            throw new Error('Canvas element not found or not a canvas');
        }

        this.gl = this.initWebGL(this.canvas);
        this.shaderProgram = null;

        this.lastTime = 0;
        this.lastFPSTime = 0;

        this.objs = [
            new ThreeObject(this.gl, 'ufo', 1, [0, 0, 0], { x: 0, y: 0 }, 0.01, [1, 1, 1, 1]),
            new ThreeObject(this.gl, 'chair', 1, [5, 0, 0], { x: 0, y: 0 }, 1, [1, 1, 1, 1]),
            new ThreeObject(this.gl, 'tower', 1, [10, 0, 0], { x: 0, y: 0 }, 0.25, [1, 1, 1, 1]),
            new ThreeObject(this.gl, 'rock', 1, [15, 0, 0], { x: 0, y: 0 }, 0.25, [1, 1, 1, 1]),
            new ThreeObject(this.gl, 'fish', 1, [20, 0, 0], { x: 0, y: 0 }, 1, [1, 1, 1, 1]),
            new ThreeObject(this.gl, 'street_lamp', 1, [-5, 0, 0], { x: 0, y: 0 }, 0.1, [1, 1, 1, 1]),
            // new Cube(this.gl, 100, [0, -50, 0], { x: 0, y: 0 }, [1, 1, 1, 1]),
            new Cube(this.gl, 0.1, [0, 1, 1], { x: 0, y: 0 }, [1, 1, 1, 1]),
        ];

        this.textures = [loadTexture(this.gl, '../../textures/fish.png')];

        this.objs[0].setTexture(loadTexture(this.gl, `../../textures/ufo.jpg`));
        this.objs[1].setTexture(loadTexture(this.gl, `../../textures/chair.png`));
        this.objs[2].setTexture(loadTexture(this.gl, `../../textures/tower.jpg`));
        this.objs[3].setTexture(loadTexture(this.gl, `../../textures/rock1.jpg`));
        this.objs[4].setTexture(loadTexture(this.gl, `../../textures/fish.png`));
        this.objs[5].setTexture(loadTexture(this.gl, '../../textures/concrete.jpg'));
        // this.objs[6].setTexture(loadTexture(this.gl, '../../textures/nothing.png'));

        this.lightPosition = [0, 1, 1];
        this.lightColor = [1, 1, 1];
        this.ambientLight = [0.1, 0.1, 0.1];
        this.specularColor = [0.3, 0.3, 0.3];
        this.shininess = 10.0;
        this.attenuationLinear = 0.1;
        this.attenuationQuadratic = 0.01;

        this.lights = [
            // new PointLight([0, 1, 1], [1, 1, 1], 0.1, 0.1, 0.01),
            // new DirectionalLight([0, -1, -1], [0.8, 0.8, 0.8], 0.5),
            new SpotLight([0, 1, 1], [0, -1, -1], [1, 0, 0], 1.0, 0.9),
        ];

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

    // @ts-ignore
    async init() {
        if (!this.gl) {
            alert('WebGL not supported');
            return;
        }

        const vsPhongSource = await this.loadShader(`${path}shaders/vertex_phong.glsl`);
        const fsPhongSource = await this.loadShader(`${path}shaders/fragment_phong.glsl`);
        this.phongProgram = new ShaderProgram(this.gl, vsPhongSource, fsPhongSource);

        if (!this.phongProgram.program) {
            console.error('Не удалось создать шейдерные программы');
            return;
        }
        // document.getElementById('attenuationLinear').addEventListener('input', (e) => {
        //     // @ts-ignore
        //     this.attenuationLinear = parseFloat(e.target.value);
        // });
        // document.getElementById('attenuationQuadratic').addEventListener('input', (e) => {
        //     // @ts-ignore
        //     this.attenuationQuadratic = parseFloat(e.target.value);
        // });
        document.getElementById('ambientLight').addEventListener('input', (e) => {
            // @ts-ignore
            const value = parseFloat(e.target.value);
            this.ambientLight = [value, value, value];
        });

        this.resizeCanvas();

        window.addEventListener('resize', () => this.resizeCanvas());

        this.setupControls();

        this.gl.enable(this.gl.DEPTH_TEST);

        requestAnimationFrame((t) => this.animate(t));
    }

    setupControls() {
        window.addEventListener('keydown', (event) => {
            this.keys[event.key] = true;
        });

        window.addEventListener('keyup', (event) => {
            this.keys[event.key] = false;
        });

        window.addEventListener('keydown', (event) => {
            if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
                this.keys['shift'] = true;
            } else if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
                this.keys['control'] = true;
            } else if (event.code === 'Space') {
                this.keys['space'] = true;
            } else {
                this.keys[event.key.toLowerCase()] = true;
            }
        });

        window.addEventListener('keyup', (event) => {
            if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
                this.keys['shift'] = false;
            } else if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
                this.keys['control'] = false;
            } else if (event.code === 'Space') {
                this.keys['space'] = false;
            } else {
                this.keys[event.key.toLowerCase()] = false;
            }
        });

        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            this.isMouseLocked = document.pointerLockElement === this.canvas;
        });

        document.addEventListener('mousemove', (event) => {
            if (this.isMouseLocked) {
                this.cameraRotation.yaw -= event.movementX * this.mouseSensitivity;
                this.cameraRotation.pitch -= event.movementY * this.mouseSensitivity;
                this.cameraRotation.pitch = Math.max(
                    -Math.PI / 2 + 0.01,
                    Math.min(Math.PI / 2 - 0.01, this.cameraRotation.pitch)
                );
            }
        });
    }

    updateCamera(deltaTime) {
        const forward = vec3.fromValues(
            Math.cos(this.cameraRotation.pitch) * Math.sin(this.cameraRotation.yaw),
            Math.sin(this.cameraRotation.pitch),
            Math.cos(this.cameraRotation.pitch) * Math.cos(this.cameraRotation.yaw)
        );

        const right = vec3.fromValues(Math.cos(this.cameraRotation.yaw), 0, -Math.sin(this.cameraRotation.yaw));

        const up = vec3.fromValues(0, 1, 0);

        const moveVector = vec3.create();

        const baseSpeed = this.moveSpeed;
        const shiftMultiplier = 3.0;

        const currentSpeed = this.keys['shift'] ? baseSpeed * shiftMultiplier : baseSpeed;

        if (this.keys['w'] || this.keys['ц'])
            vec3.scaleAndAdd(moveVector, moveVector, forward, currentSpeed * deltaTime);
        if (this.keys['s'] || this.keys['ы'])
            vec3.scaleAndAdd(moveVector, moveVector, forward, -currentSpeed * deltaTime);

        if (this.keys['a'] || this.keys['ф']) vec3.scaleAndAdd(moveVector, moveVector, right, currentSpeed * deltaTime);
        if (this.keys['d'] || this.keys['в'])
            vec3.scaleAndAdd(moveVector, moveVector, right, -currentSpeed * deltaTime);

        if (this.keys['space']) vec3.scaleAndAdd(moveVector, moveVector, up, currentSpeed * deltaTime);
        if (this.keys['control']) vec3.scaleAndAdd(moveVector, moveVector, up, -currentSpeed * deltaTime);

        // @ts-ignore
        vec3.add(this.cameraPosition, this.cameraPosition, moveVector);

        this.viewMatrix = mat4.create();
        const target = vec3.create();
        // @ts-ignore
        vec3.add(target, this.cameraPosition, forward);
        // @ts-ignore
        mat4.lookAt(this.viewMatrix, this.cameraPosition, target, up);
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
            mat4.perspective(this.projectionMatrix, Math.PI / 3, aspect, 0.1, 100.0);
        }
    }

    render() {
        this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        const shaderProgram = this.phongProgram;
        shaderProgram.use();

        // @ts-ignore
        shaderProgram.setLights(this.lights, this.viewMatrix);
        shaderProgram.setUniform3fv('uAmbientLight', this.ambientLight);
        shaderProgram.setUniform1f('uShininess', this.shininess);

        shaderProgram.setUniform3fv('uSpecularColor', this.specularColor);
        shaderProgram.setUniform1i('uUseSpecular', 1);

        this.objs.forEach((obj) => {
            obj.render(shaderProgram, this.viewMatrix, this.projectionMatrix);
        });
    }

    animate(timestamp) {
        const deltaTime = (timestamp - this.lastTime) * 0.001;
        this.lastTime = timestamp;

        this.updateCamera(deltaTime);

        if (timestamp - this.lastFPSTime > 100) {
            document.getElementById('fpsCounter').textContent = `FPS: ${Math.floor(1 / deltaTime)}`;
            this.lastFPSTime = timestamp;
        }

        this.render();

        requestAnimationFrame((t) => this.animate(t));
    }
}
