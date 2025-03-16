import { mat4, mat3 } from 'gl-matrix';

export class Cube {
    constructor(gl, size = 1, position = [0, 0, 0], rotation = { x: 0, y: 0 }, color = [1, 1, 1, 1]) {
        this.gl = gl;
        this.size = size;
        this.color = color;

        this.vertices = [];
        this.colors = [];
        this.normals = [];
        this.indices = [];

        this.initGeometry();

        this.vertexBuffer = this.createBuffer(new Float32Array(this.vertices), this.gl.ARRAY_BUFFER);
        this.colorBuffer = this.createBuffer(new Float32Array(this.colors), this.gl.ARRAY_BUFFER);
        this.normalBuffer = this.createBuffer(new Float32Array(this.normals), this.gl.ARRAY_BUFFER);
        this.indexBuffer = this.createBuffer(new Uint16Array(this.indices), this.gl.ELEMENT_ARRAY_BUFFER);

        this.modelMatrix = mat4.create();
        this.position = [0, 0, 0];
        this.rotation = { x: 0, y: 0 };
        this.setPosition(position[0], position[1], position[2]);
        this.setRotation(rotation.x, rotation.y);
    }

    initGeometry() {
        const size = this.size / 2;
        // Front (нормаль [0, 0, 1])
        this.addFace([size, size, size, -size, size, size, -size, -size, size, size, -size, size], [0, 0, 1]);
        // Back (нормаль [0, 0, -1])
        this.addFace([size, size, -size, size, -size, -size, -size, -size, -size, -size, size, -size], [0, 0, -1]);
        // Left (нормаль [-1, 0, 0])
        this.addFace([-size, size, size, -size, size, -size, -size, -size, -size, -size, -size, size], [-1, 0, 0]);
        // Right (нормаль [1, 0, 0])
        this.addFace([size, size, size, size, -size, size, size, -size, -size, size, size, -size], [1, 0, 0]);
        // Top (нормаль [0, 1, 0])
        this.addFace([-size, size, size, size, size, size, size, size, -size, -size, size, -size], [0, 1, 0]);
        // Bottom (нормаль [0, -1, 0])
        this.addFace([-size, -size, size, -size, -size, -size, size, -size, -size, size, -size, size], [0, -1, 0]);
    }

    addFace(vertices, normal) {
        const baseIndex = this.vertices.length / 3;
        this.vertices.push(...vertices);
        for (let i = 0; i < 4; i++) {
            this.normals.push(...normal);
            this.colors.push(...this.color);
        }
        this.indices.push(baseIndex, baseIndex + 1, baseIndex + 2, baseIndex, baseIndex + 2, baseIndex + 3);
    }

    createBuffer(data, type) {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(type, buffer);
        this.gl.bufferData(type, data, this.gl.STATIC_DRAW);
        return buffer;
    }

    setRotation(x, y) {
        this.rotation.x = x;
        this.rotation.y = y;
        mat4.identity(this.modelMatrix);
        // @ts-ignore
        mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
        mat4.rotateX(this.modelMatrix, this.modelMatrix, x);
        mat4.rotateY(this.modelMatrix, this.modelMatrix, y);
    }

    setPosition(x, y, z) {
        this.position = [x, y, z];
        mat4.identity(this.modelMatrix);
        // @ts-ignore
        mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
        mat4.rotateX(this.modelMatrix, this.modelMatrix, this.rotation.x);
        mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotation.y);
    }

    render(shaderProgram, viewMatrix, projectionMatrix) {
        shaderProgram.use();

        const modelViewMatrix = mat4.multiply(mat4.create(), viewMatrix, this.modelMatrix);
        const modelView3x3 = mat3.fromMat4(mat3.create(), modelViewMatrix);
        const inverseModelView3x3 = mat3.invert(mat3.create(), modelView3x3);
        const normalMatrix = inverseModelView3x3 ? mat3.transpose(mat3.create(), inverseModelView3x3) : mat3.create();

        shaderProgram.setUniformMatrix4fv('uModelViewMatrix', modelViewMatrix);
        shaderProgram.setUniformMatrix4fv('uProjectionMatrix', projectionMatrix);
        shaderProgram.setUniformMatrix3fv('uNormalMatrix', normalMatrix);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(shaderProgram.locations.aPosition, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(shaderProgram.locations.aPosition);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.vertexAttribPointer(shaderProgram.locations.aColor, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(shaderProgram.locations.aColor);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
        this.gl.vertexAttribPointer(shaderProgram.locations.aNormal, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(shaderProgram.locations.aNormal);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
    }
}
