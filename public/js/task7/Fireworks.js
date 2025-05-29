import { Particle, ParticleEmitter } from './ParticleSystem.js';

class ExplosionParticle extends Particle {
    constructor(position, life, velocity) {
        super(position, life);
        this.velocity = velocity;
    }

    update(deltaTime) {
        this.position[0] += this.velocity[0] * deltaTime;
        this.position[1] += this.velocity[1] * deltaTime;
        this.position[2] += this.velocity[2] * deltaTime;
        this.age += deltaTime;
    }
}

class SimpleFireworkParticle extends Particle {
    constructor(position, explosionTime, velocity, trailLength = 50) {
        super(position, 100);
        this.velocity = velocity;
        this.explosionTime = explosionTime;
        this.isExploding = false;
        this.explosionParticles = [];
        this.trail = [];
        this.trailLength = trailLength;
    }

    update(deltaTime) {
        if (!this.isExploding) {
            this.position[0] += this.velocity[0] * deltaTime;
            this.position[1] += this.velocity[1] * deltaTime;
            this.position[2] += this.velocity[2] * deltaTime;
            this.trail.push(this.position.slice());
            if (this.trail.length > this.trailLength) this.trail.shift();
            this.age += deltaTime;
            if (this.age >= this.explosionTime) {
                this.isExploding = true;
                this.createExplosion();
            }
        } else {
            this.explosionParticles.forEach((p) => p.update(deltaTime));
            this.explosionParticles = this.explosionParticles.filter((p) => p.isAlive());
            if (this.explosionParticles.length === 0) {
                this.age = this.life;
            }
        }
    }

    createExplosion() {
        const numParticles = 50;
        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * 360;
            const speed = Math.random() * 2 + 1;
            const velocity = [Math.cos((angle * Math.PI) / 180) * speed, Math.sin((angle * Math.PI) / 180) * speed, 0];
            const life = 1 + (Math.random() - 0.5);
            this.explosionParticles.push(new ExplosionParticle(this.position.slice(), life, velocity));
            console.log(velocity);
        }
    }
}

class ComplexFireworkParticle extends Particle {
    constructor(position, velocityY, amplitude, frequency, explosionTimes, trailLength = 50) {
        super(position, 100);
        this.velocityY = velocityY;
        this.amplitude = amplitude;
        this.frequency = frequency;
        this.explosionTimes = explosionTimes.slice();
        this.subParticles = [];
        this.trail = [];
        this.trailLength = trailLength;
        this.initialX = position[0];
    }

    update(deltaTime) {
        if (!this.isExploding) {
            this.trail.push(this.position.slice());
            this.position[1] += this.velocityY * deltaTime;
            this.position[0] = this.initialX + this.amplitude * Math.sin(this.frequency * this.age);
            if (this.trail.length > this.trailLength) this.trail.shift();
            this.age += deltaTime;
        }

        while (this.explosionTimes.length > 0 && this.age >= this.explosionTimes[0]) {
            this.spawnSubParticles();
            this.explosionTimes.shift();
            this.isExploding = true;
        }

        this.subParticles.forEach((p) => p.update(deltaTime));
        this.subParticles = this.subParticles.filter((p) => p.isAlive());

        if (this.explosionTimes.length === 0 && this.subParticles.length === 0) {
            this.age = this.life;
        }
    }

    spawnSubParticles() {
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * 360;
            const speed = 2 + Math.random() * 2;
            const velocity = [Math.cos((angle * Math.PI) / 180) * speed, Math.sin((angle * Math.PI) / 180) * speed, 0];
            const explosionTime = 1 + Math.random() - 0.5;
            this.subParticles.push(new SimpleFireworkParticle(this.position.slice(), explosionTime, velocity, 0));
        }
    }
}

export class SimpleFireworkEmitter extends ParticleEmitter {
    constructor(gl, position, particleCount = 1) {
        super(gl, position, particleCount);
    }

    createParticle() {
        const velocity = [0, 5 + Math.random() * 5, 0];
        const explosionTime = 0.4;
        return new SimpleFireworkParticle(this.position, explosionTime, velocity);
    }

    render(shaderProgram, viewMatrix, projectionMatrix) {
        const positions = [];
        const colors = [];
        const sizes = [];
        const trails = [];

        this.particles.forEach((particle) => {
            if (!particle.isExploding) {
                positions.push(...particle.position);
                colors.push(1.0, 1.0, 0.0, 1.0);
                sizes.push(32.0);
                trails.push(particle.trail);
            } else {
                particle.explosionParticles.forEach((expParticle) => {
                    positions.push(...expParticle.position);
                    const alpha = 1 - expParticle.age / expParticle.life;
                    colors.push(1.0, 0.0, 0.0, alpha);
                    sizes.push(16.0);
                });
            }
        });

        this.renderParticles(shaderProgram, viewMatrix, projectionMatrix, positions, colors, sizes);

        this.renderTrails(shaderProgram, viewMatrix, projectionMatrix, trails);
    }

    renderTrails(shaderProgram, viewMatrix, projectionMatrix, trails) {
        const gl = this.gl;
        shaderProgram.use();
        shaderProgram.setUniformMatrix4fv('uProjectionMatrix', projectionMatrix);
        shaderProgram.setUniformMatrix4fv('uViewMatrix', viewMatrix);
        shaderProgram.setUniform1i('uUseTexture', 0);

        const trailPositions = [];
        trails.forEach((trail) => {
            for (let i = 0; i < trail.length - 1; i++) {
                trailPositions.push(...trail[i], ...trail[i + 1]);
            }
        });

        if (trailPositions.length === 0) return;

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(trailPositions), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(shaderProgram.locations.aPosition);
        gl.vertexAttribPointer(shaderProgram.locations.aPosition, 3, gl.FLOAT, false, 0, 0);

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        const trailColors = new Array((trailPositions.length / 3) * 4).fill(1.0);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(trailColors), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(shaderProgram.locations.aColor);
        gl.vertexAttribPointer(shaderProgram.locations.aColor, 4, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.LINES, 0, trailPositions.length / 3);
    }
}

export class ComplexFireworkEmitter extends ParticleEmitter {
    constructor(gl, position, particleCount = 1) {
        super(gl, position, particleCount);
    }

    createParticle() {
        const velocityY = 5 + Math.random() * 5;
        const amplitude = 0.05;
        const frequency = (Math.random() > 0.5 ? 1 : -1) * (20 + 50 * Math.random());
        const explosionTimes = [0.4, 0.3, 0.2].map((t) => t);
        return new ComplexFireworkParticle(this.position, velocityY, amplitude, frequency, explosionTimes);
    }

    render(shaderProgram, viewMatrix, projectionMatrix) {
        const positions = [];
        const colors = [];
        const sizes = [];
        const trails = [];

        this.particles.forEach((particle) => {
            if (!particle.isExploding) {
                positions.push(...particle.position);
                colors.push(0.0, 1.0, 0.0, 1.0);
                sizes.push(32.0);
                trails.push(particle.trail);
            }
            particle.subParticles.forEach((subParticle) => {
                if (!subParticle.isExploding) {
                    positions.push(...subParticle.position);
                    colors.push(0.0, 0.0, 1.0, 1.0);
                    sizes.push(24.0);
                } else {
                    subParticle.explosionParticles.forEach((expParticle) => {
                        positions.push(...expParticle.position);
                        const alpha = 1 - expParticle.age / expParticle.life;
                        colors.push(1.0, 1.0, 1.0, alpha);
                        sizes.push(16.0);
                    });
                }
            });
        });

        this.renderParticles(shaderProgram, viewMatrix, projectionMatrix, positions, colors, sizes);

        this.renderTrails(shaderProgram, viewMatrix, projectionMatrix, trails);
    }

    renderTrails(shaderProgram, viewMatrix, projectionMatrix, trails) {
        const gl = this.gl;
        shaderProgram.use();
        shaderProgram.setUniformMatrix4fv('uProjectionMatrix', projectionMatrix);
        shaderProgram.setUniformMatrix4fv('uViewMatrix', viewMatrix);
        shaderProgram.setUniform1i('uUseTexture', 0);

        const trailPositions = [];
        trails.forEach((trail) => {
            for (let i = 0; i < trail.length - 1; i++) {
                trailPositions.push(...trail[i], ...trail[i + 1]);
            }
        });

        if (trailPositions.length === 0) return;

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(trailPositions), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(shaderProgram.locations.aPosition);
        gl.vertexAttribPointer(shaderProgram.locations.aPosition, 3, gl.FLOAT, false, 0, 0);

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        const trailColors = new Array((trailPositions.length / 3) * 4).fill(1.0);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(trailColors), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(shaderProgram.locations.aColor);
        gl.vertexAttribPointer(shaderProgram.locations.aColor, 4, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.LINES, 0, trailPositions.length / 3);
    }
}
