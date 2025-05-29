import { Particle, ParticleEmitter } from './ParticleSystem';

class CloudParticle extends Particle {
    constructor(position, life, velocity, size) {
        super(position, life);
        this.velocity = velocity.slice();
        this.size = size;
    }

    update(deltaTime) {
        this.position[0] += this.velocity[0] * deltaTime;
        this.position[1] += this.velocity[1] * deltaTime;
        this.position[2] += this.velocity[2] * deltaTime;
    }
}

export class CloudEmitter extends ParticleEmitter {
    constructor(gl, position, particleCount = 50) {
        super(gl, position, particleCount);
        this.initParticles();
    }

    createParticle() {
        const position = [(Math.random() - 0.5) * 40, 1 + (Math.random() - 0.5) * 2, 0];
        const velocity = [(Math.random() - 0.5) * 0.2, 0, 0];
        const life = 1;
        const size = 300 + (Math.random() - 0.5) * 300;
        return new CloudParticle(position, life, velocity, size);
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
            colors.push(1.0, 1.0, 1.0, 0.2);
            sizes.push(particle.size);
        });
        this.renderParticles(shaderProgram, viewMatrix, projectionMatrix, positions, colors, sizes);
    }
}
