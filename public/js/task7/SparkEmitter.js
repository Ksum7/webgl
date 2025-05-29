import { Particle, ParticleEmitter } from './ParticleSystem';

class SparkParticle extends Particle {
    constructor(position, life, angle, radius, multiplier) {
        super(position, life);
        this.angle = angle;
        this.radius = radius;
        this.multiplier = multiplier;
        this.xMax = Math.cos((angle * Math.PI) / 180) * radius;
        this.yMax = Math.sin((angle * Math.PI) / 180) * radius;
        this.dx = this.xMax / multiplier;
        this.dy = this.yMax / multiplier;
        this.x = 0;
        this.y = 0;
    }

    update(deltaTime) {
        this.x += this.dx * deltaTime * 200;
        this.y += this.dy * deltaTime * 200;
        this.position[0] = this.x;
        this.position[1] = this.y;
        this.age += deltaTime;
        if (Math.abs(this.x) > Math.abs(this.xMax) || Math.abs(this.y) > Math.abs(this.yMax)) {
            this.age = 0;
            this.x = 0;
            this.y = 0;
        }
    }
}

export class SparkEmitter extends ParticleEmitter {
    constructor(gl, position, particleCount = 200) {
        super(gl, position, particleCount);
        this.initParticles();
    }

    createParticle() {
        const angle = Math.random() * 360;
        const radius = Math.random();
        const multiplier = 125 + Math.random() * 125;
        const life = 1 + Math.random() * 2;
        return new SparkParticle(this.position, life, angle, radius, multiplier);
    }

    render(shaderProgram, viewMatrix, projectionMatrix) {
        const positions = [];
        const colors = [];
        const sizes = [];
        this.particles.forEach((particle) => {
            const worldPos = [
                this.position[0] + particle.position[0],
                this.position[1] + particle.position[1],
                this.position[2] + particle.position[2],
            ];
            positions.push(...worldPos);
            const alpha = 1 - particle.age / particle.life;
            colors.push(1.0, 1.0, 1.0, alpha);
            sizes.push(32.0);
        });

        this.renderParticles(shaderProgram, viewMatrix, projectionMatrix, positions, colors, sizes);
        this.renderTracks(shaderProgram, viewMatrix, projectionMatrix);
    }

    renderTracks(shaderProgram, viewMatrix, projectionMatrix) {
        const gl = this.gl;
        shaderProgram.use();
        shaderProgram.setUniformMatrix4fv('uProjectionMatrix', projectionMatrix);
        shaderProgram.setUniformMatrix4fv('uViewMatrix', viewMatrix);
        shaderProgram.setUniform1i('uUseTexture', 0);

        const positions = [];
        const colors = [];
        this.particles.forEach((particle) => {
            const startPos = this.position;
            const endPos = [
                this.position[0] + particle.position[0],
                this.position[1] + particle.position[1],
                this.position[2] + particle.position[2],
            ];
            positions.push(...startPos, ...endPos);
            const alpha = 1 - particle.age / particle.life;
            colors.push(1.0, 1.0, 1.0, alpha, 0.47, 0.31, 0.24, alpha);
        });

        if (positions.length === 0) return;

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(shaderProgram.locations.aPosition);
        gl.vertexAttribPointer(shaderProgram.locations.aPosition, 3, gl.FLOAT, false, 0, 0);

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(shaderProgram.locations.aColor);
        gl.vertexAttribPointer(shaderProgram.locations.aColor, 4, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.LINES, 0, positions.length / 3);
    }
}
