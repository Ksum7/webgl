import { mat4, vec3 } from 'gl-matrix';
import { Cube } from './Cube';
import { ShaderProgram } from './ShaderProgram';
import { loadTexture } from './TextureLoader';
import { ThreeObject } from './ThreeObject';

const path = '../js/task5/';

export class WebGLApp {
    constructor() {
        this.keys = {};
        this.canvas = document.getElementById('glCanvas');
        if (!(this.canvas instanceof HTMLCanvasElement)) {
            throw new Error('Canvas element not found or not a canvas');
        }

        this.gl = this.canvas.getContext('webgl');
        this.shaderProgram = null;

        this.podiumRotation = 0;
        this.globalRotation = 0;
        this.lastTime = 0;

        this.objs = [
            //new ThreeObject(this.gl, 'ufo', 1, [0, 0, 0], { x: 0, y: 0 }, 0.01, [0.75, 0.75, 0.75, 1]),
            //new ThreeObject(this.gl, 'chair', 1, [0, 0, 0], { x: 0, y: 0 }, 1, [0.75, 0.75, 0.75, 1]),
            //new ThreeObject(this.gl, 'tower', 1, [0, 0, 0], { x: 0, y: 0 }, 0.25, [0.75, 0.75, 0.75, 1]),
            //new ThreeObject(this.gl, 'rock', 1, [0, 0, 0], { x: 0, y: 0 }, 0.25, [0.75, 0.75, 0.75, 1]),
            //new ThreeObject(this.gl, 'fish', 1, [0, 0, 0], { x: 0, y: 0 }, 1, [0.75, 0.75, 0.75, 1]),
            //new Cube(this.gl, 1, [-3, 0, 0], { x: 0, y: 0 }, [0.75, 0.75, 0.75, 1]),
        ];

        this.textures = [
            loadTexture(this.gl, '../../textures/fish.png'),
        ];

        for (let i = 0; i < this.objs.length; i++) {
            this.objs[i].setTexture(this.textures[i])
        }

        this.lightPosition = [0, 1, 1];
        this.lightColor = [1, 1, 1];
        this.ambientLight = [0.1, 0.1, 0.1];
        this.specularColor = [1, 1, 1];
        this.shininess = 32.0;
        this.attenuationLinear = 0.1;
        this.attenuationQuadratic = 0.01;
        this.shadingModel = 'gouraud';
        this.lightingModel = 0;

        this.numberTexture = loadTexture(this.gl, '../../textures/number1.png'),
        this.lightCube = new Cube(this.gl, 0.1, this.lightPosition, { x: 0, y: 0 }, [1, 1, 1, 0.5]);
        this.lightCube.setTexture(this.numberTexture);
        this.viewMatrix = mat4.translate(mat4.create(), mat4.create(), [0, -1, -5]);

        this.init().catch((error) => {
            console.error('Initialization failed:', error);
        });
    }

    async init() {
        if (!this.gl) {
            alert('WebGL not supported');
            return;
        }

        const vsGouraudSource = await this.loadShader(`${path}shaders/vertex_gouraud.glsl`);
        const fsGouraudSource = await this.loadShader(`${path}shaders/fragment_gouraud.glsl`);
        this.gouraudProgram = new ShaderProgram(this.gl, vsGouraudSource, fsGouraudSource);

        const vsPhongSource = await this.loadShader(`${path}shaders/vertex_phong.glsl`);
        const fsPhongSource = await this.loadShader(`${path}shaders/fragment_phong.glsl`);
        this.phongProgram = new ShaderProgram(this.gl, vsPhongSource, fsPhongSource);

        if (!this.gouraudProgram.program || !this.phongProgram.program) {
            console.error('Не удалось создать шейдерные программы');
            return;
        }

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        window.addEventListener('keydown', (event) => {
            this.keys[event.key] = true;
        });

        window.addEventListener('keyup', (event) => {
            this.keys[event.key] = false;
        });

        this.gl.enable(this.gl.DEPTH_TEST);

        function updateActiveButton(group, activeId) {
            const buttons =
                group === 'shading'
                    ? ['gouraudBtn', 'phongBtn']
                    : ['lambertianBtn', 'phongLightingBtn', 'blinnPhongBtn', 'toonBtn'];

            buttons.forEach((id) => {
                const btn = document.getElementById(id);
                if (id === activeId) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        document.getElementById('gouraudBtn').addEventListener('click', () => {
            updateActiveButton('shading', 'gouraudBtn');
            this.shadingModel = 'gouraud';
        });
        document.getElementById('phongBtn').addEventListener('click', () => {
            updateActiveButton('shading', 'phongBtn');
            this.shadingModel = 'phong';
        });
        document.getElementById('lambertianBtn').addEventListener('click', () => {
            updateActiveButton('lighting', 'lambertianBtn');
            this.lightingModel = 0;
        });
        document.getElementById('phongLightingBtn').addEventListener('click', () => {
            updateActiveButton('lighting', 'phongLightingBtn');
            this.lightingModel = 1;
        });
        document.getElementById('blinnPhongBtn').addEventListener('click', () => {
            updateActiveButton('lighting', 'blinnPhongBtn');
            this.lightingModel = 2;
        });
        document.getElementById('toonBtn').addEventListener('click', () => {
            updateActiveButton('lighting', 'toonBtn');
            this.lightingModel = 3;
        });

        document.getElementById('attenuationLinear').addEventListener('input', (e) => {
            // @ts-ignore
            this.attenuationLinear = parseFloat(e.target.value);
        });
        document.getElementById('attenuationQuadratic').addEventListener('input', (e) => {
            // @ts-ignore
            this.attenuationQuadratic = parseFloat(e.target.value);
        });
        document.getElementById('ambientLight').addEventListener('input', (e) => {
            // @ts-ignore
            const value = parseFloat(e.target.value);
            this.ambientLight = [value, value, value];
        });

        updateActiveButton('shading', 'gouraudBtn');
        updateActiveButton('lighting', 'lambertianBtn');

        requestAnimationFrame((t) => this.animate(t));
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

        const shaderProgram = this.shadingModel === 'gouraud' ? this.gouraudProgram : this.phongProgram;
        shaderProgram.use();

        const cameraViewMatrix = mat4.create();
        mat4.rotateY(cameraViewMatrix, this.viewMatrix, this.globalRotation);
        // @ts-ignore
        const lightPositionEye = vec3.transformMat4(vec3.create(), this.lightPosition, cameraViewMatrix);

        shaderProgram.setUniform3fv('uLightPositionEye', lightPositionEye);
        shaderProgram.setUniform3fv('uLightColor', this.lightColor);
        shaderProgram.setUniform3fv('uAmbientLight', this.ambientLight);
        shaderProgram.setUniform3fv('uSpecularColor', this.specularColor);
        shaderProgram.setUniform1f('uShininess', this.shininess);
        shaderProgram.setUniform1f('uAttenuationLinear', this.attenuationLinear);
        shaderProgram.setUniform1f('uAttenuationQuadratic', this.attenuationQuadratic);
        shaderProgram.setUniform1i('uUseSpecular', this.lightingModel > 0 ? 1 : 0);
        shaderProgram.setUniform1i('uLightingModel', this.lightingModel);

        // this.podiumCenter = this.getPodiumCenter();
        // const podiumModelMatrix = mat4.create();
        // // @ts-ignore
        // mat4.translate(podiumModelMatrix, podiumModelMatrix, this.podiumCenter);
        // mat4.rotateY(podiumModelMatrix, podiumModelMatrix, this.podiumRotation);
        // mat4.translate(
        //     podiumModelMatrix,
        //     podiumModelMatrix,
        //     // @ts-ignore
        //     this.podiumCenter.map((x) => -x)
        // );

        const updatedViewMatrix = mat4.rotateY(mat4.create(), this.viewMatrix, this.globalRotation);

        this.lightCube.render(shaderProgram, updatedViewMatrix, this.projectionMatrix);

        // mat4.multiply(updatedViewMatrix, updatedViewMatrix, podiumModelMatrix);

        this.objs.forEach((obj) => {
            obj.render(shaderProgram, updatedViewMatrix, this.projectionMatrix);
        });
    }

    animate(timestamp) {
        const deltaTime = (timestamp - this.lastTime) * 0.001;
        this.lastTime = timestamp;

        // if (this.keys['1']) {
        //     this.cubes[0].setRotation(this.cubes[0].rotation.x, this.cubes[0].rotation.y + deltaTime);
        // }
        // if (this.keys['2']) {
        //     this.cubes[1].setRotation(this.cubes[1].rotation.x, this.cubes[1].rotation.y + deltaTime);
        // }
        // if (this.keys['3']) {
        //     this.cubes[2].setRotation(this.cubes[2].rotation.x, this.cubes[2].rotation.y + deltaTime);
        // }
        // if (this.keys['4']) {
        //     this.cubes[3].setRotation(this.cubes[3].rotation.x, this.cubes[3].rotation.y + deltaTime);
        // }

        // if (this.keys['5']) this.podiumRotation += deltaTime;
        // if (this.keys['a']) this.globalRotation += deltaTime;
        // if (this.keys['d']) this.globalRotation -= deltaTime;

        this.render();
        requestAnimationFrame((t) => this.animate(t));
    }

    // getPodiumCenter() {
    //     let sumX = 0;
    //     let sumY = 0;
    //     let sumZ = 0;

    //     for (let i = 0; i < this.cubes.length; i++) {
    //         const [x, y, z] = this.cubes[i].position;
    //         sumX += x;
    //         sumY += y;
    //         sumZ += z;
    //     }

    //     const centerX = sumX / this.cubes.length;
    //     const centerY = sumY / this.cubes.length;
    //     const centerZ = sumZ / this.cubes.length;

    //     return [centerX, centerY, centerZ];
    // }
}
