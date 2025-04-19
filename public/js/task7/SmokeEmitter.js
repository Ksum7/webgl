import { Particle, ParticleEmitter } from './ParticleSystem';

class SmokeParticle extends Particle {
    constructor(position, life, velocity) {
        super(position, life);
        this.velocity = velocity.slice();
    }

    update(deltaTime) {
        this.position[0] += this.velocity[0] * deltaTime;
        this.position[1] += this.velocity[1] * deltaTime;
        this.position[2] += this.velocity[2] * deltaTime;
        this.age += deltaTime;
    }
}

export class SmokeEmitter extends ParticleEmitter {
    constructor(gl, position, particleCount = 100) {
        super(gl, position, particleCount);
        this.initParticles();
    }

    createParticle() {
        const mult = 0.8;
        const velocity = [(Math.random() - 0.5) * mult, Math.random() * mult, 0];
        const life = 2 + Math.random() * 3;
        const multPos = 0.2;
        const position = [
            this.position[0] + (Math.random() - 0.5) * multPos,
            this.position[1] + (Math.random() - 0.5) * multPos,
            0,
        ];
        return new SmokeParticle(position, life, velocity);
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
            colors.push(0.5, 0.5, 0.5, alpha);
            sizes.push(128.0);
        });

        this.renderParticles(shaderProgram, viewMatrix, projectionMatrix, positions, colors, sizes);
    }
}
