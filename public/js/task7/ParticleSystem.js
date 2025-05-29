export class Particle {
    constructor(position, life) {
        this.position = position.slice();
        this.life = life;
        this.age = 0;
    }

    update(deltaTime) {
        throw new Error("Method 'update()' must be implemented by subclass");
    }

    isAlive() {
        return this.age < this.life;
    }
}

export class ParticleEmitter {
    constructor(gl, position, particleCount) {
        this.gl = gl;
        this.position = position.slice();
        this.particleCount = particleCount;
        this.particles = [];
        this.texture = null;
    }

    initParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }

    async setTexture(texture) {
        this.texture = await texture;
    }

    createParticle() {
        throw new Error("Method 'createParticle()' must be implemented by subclass");
    }

    update(deltaTime) {
        this.particles.forEach((particle) => particle.update(deltaTime));
        this.particles = this.particles.filter((particle) => particle.isAlive());
        while (this.particles.length < this.particleCount) {
            this.particles.push(this.createParticle());
        }
    }

    renderParticles(shaderProgram, viewMatrix, projectionMatrix, positions, colors, sizes) {
        const gl = this.gl;
        shaderProgram.use();
        shaderProgram.setUniform1i('uUseTexture', 1);

        shaderProgram.setUniformMatrix4fv('uProjectionMatrix', projectionMatrix);
        shaderProgram.setUniformMatrix4fv('uViewMatrix', viewMatrix);

        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            shaderProgram.setUniform1i('uTexture', 0);
        }

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

        const sizeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(shaderProgram.locations.aSize);
        gl.vertexAttribPointer(shaderProgram.locations.aSize, 1, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.POINTS, 0, sizes.length);
    }

    render() {
        throw new Error("Method 'render()' must be implemented by subclass");
    }
}
