import { Particle, ParticleEmitter } from './ParticleSystem';

class RainParticle extends Particle {
    constructor(position, life, velocity) {
        super(position, life);
        this.velocity = velocity.slice();
        this.size = 10.0;
    }

    update(deltaTime) {
        this.position[0] += this.velocity[0] * deltaTime;
        this.position[1] += this.velocity[1] * deltaTime;
        this.position[2] += this.velocity[2] * deltaTime;
        this.age += deltaTime;
    }
}

export class RainEmitter extends ParticleEmitter {
    constructor(gl, position, particleCount = 1000) {
        super(gl, position, particleCount);
        this.initParticles();
    }

    createParticle() {
        const position = [(Math.random() - 0.5) * 12, 2.3 + (Math.random() - 0.5) * 1, 0];
        const velocity = [Math.random() * 0.03, -5, 0];
        const life = 2 + (Math.random() - 0.5) * 4;
        return new RainParticle(position, life, velocity);
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
            colors.push(0.5, 0.5, 1.0, 0.5);
            sizes.push(particle.size);
        });
        this.renderParticles(shaderProgram, viewMatrix, projectionMatrix, positions, colors, sizes);
    }
}
