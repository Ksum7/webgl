import { Particle, ParticleEmitter } from './ParticleSystem';

const g = 9.8;
const elasticity = 0.5;
const delta = 0.001;
const size = 128;
const spawnInterval = 1.0;
const particlesPerSpawn = 5;
const particleLife = 10.0;

class FallingBallParticle extends Particle {
    constructor(position, velocity, radius, mass, life, surface, surfaceDerivative) {
        super(position, life);
        this.velocity = velocity.slice();
        this.radius = radius;
        this.mass = mass;
        this.surface = surface;
        this.surfaceDerivative = surfaceDerivative;
    }

    update(deltaTime) {
        this.velocity[1] += -g * deltaTime;
        this.position[0] += this.velocity[0] * deltaTime;
        this.position[1] += this.velocity[1] * deltaTime;
        const surfaceY = this.surface(this.position[0]);
        if (this.position[1] - this.radius < surfaceY) {
            this.position[1] = surfaceY + this.radius;
            const deriv = this.surfaceDerivative(this.position[0]);
            const normal = [-deriv, 1, 0];
            const normLength = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1]);
            normal[0] /= normLength;
            normal[1] /= normLength;
            const dot = this.velocity[0] * normal[0] + this.velocity[1] * normal[1];
            this.velocity[0] -= (1 + elasticity) * dot * normal[0];
            this.velocity[1] -= (1 + elasticity) * dot * normal[1];
        }
        this.age += deltaTime;
    }
}

export class FallingBallsEmitter extends ParticleEmitter {
    constructor(gl, position, surface) {
        super(gl, position, 0);
        this.surface = surface || ((x) => -1 + 0.5 * Math.sin(2 * x));
        this.surfaceDerivative = (x) => {
            return (this.surface(x + delta) - this.surface(x - delta)) / (2 * delta);
        };
        this.timeSinceLastSpawn = 0;
    }

    createParticle() {
        const x = -2 + Math.random() * 4;
        const y = 3 + Math.random() * 1;
        const position = [x, y, 0];
        const velocity = [0, 0, 0];
        const radius = size / 800;
        const mass = 1;
        const life = particleLife;
        return new FallingBallParticle(position, velocity, radius, mass, life, this.surface, this.surfaceDerivative);
    }

    update(deltaTime) {
        this.timeSinceLastSpawn += deltaTime;
        if (this.timeSinceLastSpawn >= spawnInterval) {
            for (let i = 0; i < particlesPerSpawn; i++) {
                this.particles.push(this.createParticle());
            }
            this.timeSinceLastSpawn -= spawnInterval;
        }

        this.particles.forEach((particle) => particle.update(deltaTime));
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const b1 = this.particles[i];
                const b2 = this.particles[j];
                const dx = b2.position[0] - b1.position[0];
                const dy = b2.position[1] - b1.position[1];
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < b1.radius + b2.radius) {
                    const nx = dx / distance;
                    const ny = dy / distance;
                    const relativeVx = b2.velocity[0] - b1.velocity[0];
                    const relativeVy = b2.velocity[1] - b1.velocity[1];
                    const dot = relativeVx * nx + relativeVy * ny;
                    if (dot < 0) {
                        const m1 = b1.mass;
                        const m2 = b2.mass;
                        const totalMass = m1 + m2;
                        const impulse = ((1 + elasticity) * dot) / totalMass;
                        b1.velocity[0] += impulse * m2 * nx;
                        b1.velocity[1] += impulse * m2 * ny;
                        b2.velocity[0] -= impulse * m1 * nx;
                        b2.velocity[1] -= impulse * m1 * ny;
                        const overlap = b1.radius + b2.radius - distance;
                        const sepX = overlap * nx * 0.5;
                        const sepY = overlap * ny * 0.5;
                        b1.position[0] -= sepX;
                        b1.position[1] -= sepY;
                        b2.position[0] += sepX;
                        b2.position[1] += sepY;
                    }
                }
            }
        }
        this.particles = this.particles.filter((particle) => particle.isAlive());
    }

    render(shaderProgram, viewMatrix, projectionMatrix) {
        const positions = [];
        const colors = [];
        const sizes = [];
        this.particles.forEach((particle) => {
            positions.push(...particle.position);
            colors.push(1.0, 1.0, 1.0, 1.0);
            sizes.push(size);
        });
        this.renderParticles(shaderProgram, viewMatrix, projectionMatrix, positions, colors, sizes);
        this.renderSurface(shaderProgram, viewMatrix, projectionMatrix);
    }

    renderSurface(shaderProgram, viewMatrix, projectionMatrix) {
        const gl = this.gl;
        shaderProgram.use();
        shaderProgram.setUniformMatrix4fv('uProjectionMatrix', projectionMatrix);
        shaderProgram.setUniformMatrix4fv('uViewMatrix', viewMatrix);
        shaderProgram.setUniform1i('uUseTexture', 0);

        const positions = [];
        const xmin = -7;
        const xmax = 7;
        const step = 0.01;
        for (let x = xmin; x <= xmax; x += step) {
            const y = this.surface(x);
            positions.push(x, y, 0);
        }

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(shaderProgram.locations.aPosition);
        gl.vertexAttribPointer(shaderProgram.locations.aPosition, 3, gl.FLOAT, false, 0, 0);

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        const colors = new Array((positions.length / 3) * 4).fill(0.0).map((_, i) => (i % 4 === 3 ? 1.0 : 0.0));
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(shaderProgram.locations.aColor);
        gl.vertexAttribPointer(shaderProgram.locations.aColor, 4, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.LINE_STRIP, 0, positions.length / 3);
    }
}
