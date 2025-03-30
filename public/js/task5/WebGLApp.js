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
        this.prevKeys = {};
        this.canvas = document.getElementById('glCanvas');
        if (!(this.canvas instanceof HTMLCanvasElement)) {
            throw new Error('Canvas element not found or not a canvas');
        }

        this.gl = this.initWebGL(this.canvas);
        this.shaderProgram = null;

        this.lastTime = 0;
        this.lastFPSTime = 0;

        this.objs = [
            new ThreeObject(this.gl, 'ufo', 1, [0, 0, 0], { x: 0, y: 0 }, 0.005, [1, 1, 1, 1]),
            new ThreeObject(this.gl, 'chair', 1, [5, 0, 0], { x: 0, y: 0 }, 1, [1, 1, 1, 1]),
            new ThreeObject(this.gl, 'tower', 1, [10, 0, 0], { x: 0, y: 0 }, 0.25, [1, 1, 1, 1]),
            new ThreeObject(this.gl, 'rock', 1, [15, 0, 0], { x: 0, y: 0 }, 0.25, [1, 1, 1, 1]),
            new ThreeObject(this.gl, 'fish', 1, [20, 0, 0], { x: 0, y: 0 }, 1, [1, 1, 1, 1]),
            new ThreeObject(this.gl, 'street_lamp', 1, [-5, 0, 0], { x: 0, y: 0 }, 0.1, [1, 1, 1, 1]),
            new Cube(this.gl, 0.1, [0, 1, 2], { x: 0, y: 0 }, [1, 1, 1, 1]),
        ];

        this.player = this.objs[0];
        this.playerOffset = [0, 0, 2];
        this.playerRotationOffset = { x: Math.PI / 2, y: 0 };

        this.playerLight = new SpotLight([0, 0, 0], [0, 0, 0], [1, 0, 0], 1.0, 0.9);
        this.isUFOLightActive = true;

        this.textures = [loadTexture(this.gl, '../../textures/fish.png')];

        this.objs[0].setTexture(loadTexture(this.gl, `../../textures/ufo.jpg`));
        this.objs[1].setTexture(loadTexture(this.gl, `../../textures/chair.png`));
        this.objs[2].setTexture(loadTexture(this.gl, `../../textures/tower.jpg`));
        this.objs[3].setTexture(loadTexture(this.gl, `../../textures/rock1.jpg`));
        this.objs[4].setTexture(loadTexture(this.gl, `../../textures/fish.png`));
        this.objs[5].setTexture(loadTexture(this.gl, `../../textures/concrete.jpg`));

        this.objs[1].velocity = [-1, 0, 0];

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
        document.getElementById('ambientLight').addEventListener('input', (e) => {
            // @ts-ignore
            const value = parseFloat(e.target.value);
            this.ambientLight = [value, value, value];
        });
        document.getElementById('UFOLight').addEventListener('click', () => {
            this.isUFOLightActive = !this.isUFOLightActive;
            this.updateUFOLight(this.isUFOLightActive);
        });
        this.updateUFOLight(this.isUFOLightActive);

        this.resizeCanvas();

        window.addEventListener('resize', () => this.resizeCanvas());

        this.setupControls();

        this.gl.enable(this.gl.DEPTH_TEST);

        requestAnimationFrame((t) => this.animate(t));
    }

    setupControls() {
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
    updateUFOLight(isActive) {
        const btn = document.getElementById('UFOLight');
        if (isActive) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
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

        const eye = this.cameraPosition;
        const target = vec3.create();
        // @ts-ignore
        vec3.add(target, eye, forward);
        // @ts-ignore
        mat4.lookAt(this.viewMatrix, eye, target, up);
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

        const shaderProgram = this.phongProgram;
        shaderProgram.use();
        const currentLights = [...this.lights];
        if (this.isUFOLightActive) {
            currentLights.push(this.playerLight);
        }
        shaderProgram.setLights(currentLights, this.viewMatrix);
        shaderProgram.setUniform3fv('uAmbientLight', this.ambientLight);
        shaderProgram.setUniform1f('uShininess', this.shininess);
        shaderProgram.setUniform3fv('uSpecularColor', this.specularColor);
        shaderProgram.setUniform1i('uUseSpecular', 1);

        const forward = vec3.fromValues(
            Math.cos(this.cameraRotation.pitch) * Math.sin(this.cameraRotation.yaw),
            Math.sin(this.cameraRotation.pitch),
            Math.cos(this.cameraRotation.pitch) * Math.cos(this.cameraRotation.yaw)
        );
        const right = vec3.fromValues(Math.cos(this.cameraRotation.yaw), 0, -Math.sin(this.cameraRotation.yaw));
        const up = vec3.fromValues(0, 1, 0);

        const playerPosition = vec3.create();
        const offsetForward = vec3.scale(vec3.create(), forward, this.playerOffset[2]);
        const offsetRight = vec3.scale(vec3.create(), right, this.playerOffset[0]);
        const offsetUp = vec3.scale(vec3.create(), up, this.playerOffset[1]);

        // @ts-ignore
        vec3.add(playerPosition, this.cameraPosition, offsetForward);
        vec3.add(playerPosition, playerPosition, offsetRight);
        vec3.add(playerPosition, playerPosition, offsetUp);

        const oldPosition = [...this.player.position];

        this.player.setPosition(playerPosition[0], playerPosition[1], playerPosition[2]);
        this.player.setRotation(
            this.playerRotationOffset.x + this.cameraRotation.pitch,
            this.playerRotationOffset.y + this.cameraRotation.yaw
        );

        this.playerLight.position = [
            playerPosition[0] + offsetUp[0] + offsetForward[0] * 0.1,
            playerPosition[1],
            playerPosition[2] + offsetUp[2] + offsetForward[2] * 0.1,
        ];
        this.playerLight.direction = [offsetForward[0], playerPosition[1], offsetForward[2]];

        const playerAABB = this.player.getWorldAABB();
        this.objs.forEach((obj) => {
            if (obj !== this.player && obj.localAABB) {
                const objAABB = obj.getWorldAABB();
                if (this.checkAABBCollision(playerAABB, objAABB)) {
                    this.player.setPosition(oldPosition[0], oldPosition[1], oldPosition[2]);
                    // @ts-ignore
                    vec3.subtract(this.cameraPosition, this.player.position, offsetForward);
                    // @ts-ignore
                    vec3.subtract(this.cameraPosition, this.cameraPosition, offsetRight);
                    // @ts-ignore
                    vec3.subtract(this.cameraPosition, this.cameraPosition, offsetUp);
                    return;
                }
            }
        });

        this.objs.forEach((obj) => {
            obj.render(shaderProgram, this.viewMatrix, this.projectionMatrix);
        });
    }

    animate(timestamp) {
        const deltaTime = (timestamp - this.lastTime) * 0.001;
        this.lastTime = timestamp;

        if (this.keys['q'] && !this.prevKeys['q']) {
            this.isUFOLightActive = !this.isUFOLightActive;
            this.updateUFOLight(this.isUFOLightActive);
        }

        this.updateCamera(deltaTime);

        this.objs.forEach((obj) => obj.update(deltaTime));

        const movingObjs = this.objs.filter((obj) => obj.velocity.some((v) => v !== 0));
        movingObjs.forEach((movingObj) => {
            this.objs.forEach((otherObj) => {
                if (movingObj !== otherObj && movingObj.loaded && otherObj.loaded) {
                    const aabb1 = movingObj.getWorldAABB();
                    const aabb2 = otherObj.getWorldAABB();
                    if (aabb1 && aabb2 && this.checkAABBCollision(aabb1, aabb2)) {
                        movingObj.velocity = [0, 0, 0];
                        otherObj.velocity = [0, 0, 0];
                    }
                }
            });
        });

        if (timestamp - this.lastFPSTime > 100) {
            document.getElementById('fpsCounter').textContent = `FPS: ${Math.floor(1 / deltaTime)}`;
            this.lastFPSTime = timestamp;
        }

        this.render();

        // @ts-ignore
        Object.assign(this.prevKeys, this.keys);

        requestAnimationFrame((t) => this.animate(t));
    }
}
