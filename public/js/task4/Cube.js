import { mat4, mat3 } from 'gl-matrix';
import { RenderableObject } from './RenderableObject';

export class Cube extends RenderableObject {
    constructor(gl, size = 1, position = [0, 0, 0], rotation = { x: 0, y: 0 }, color = [1, 1, 1, 1]) {
        super(gl);
        this.size = size;
        this.color = color;

        this.vertices = [];
        this.colors = [];
        this.normals = [];
        this.texCoords = [];
        this.indices = [];

        this.initGeometry();

        this.vertexBuffer = this.createBuffer(new Float32Array(this.vertices), this.gl.ARRAY_BUFFER);
        this.colorBuffer = this.createBuffer(new Float32Array(this.colors), this.gl.ARRAY_BUFFER);
        this.normalBuffer = this.createBuffer(new Float32Array(this.normals), this.gl.ARRAY_BUFFER);
        this.texCoordBuffer = this.createBuffer(new Float32Array(this.texCoords), this.gl.ARRAY_BUFFER);
        this.indexBuffer = this.createBuffer(new Uint16Array(this.indices), this.gl.ELEMENT_ARRAY_BUFFER);

        this.setPosition(position[0], position[1], position[2]);
        this.setRotation(rotation.x, rotation.y);
    }

    initGeometry() {
        const size = this.size / 2;
        // Front (нормаль [0, 0, 1])
        this.addFace(
            [size, size, size, -size, size, size, -size, -size, size, size, -size, size],
            [0, 0, 1],
            [1, 1, 0, 1, 0, 0, 1, 0]
        );
        // Back (нормаль [0, 0, -1])
        this.addFace(
            [size, size, -size, size, -size, -size, -size, -size, -size, -size, size, -size],
            [0, 0, -1],
            [0, 1, 0, 0, 1, 0, 1, 1]
        );
        // Left (нормаль [-1, 0, 0])
        this.addFace(
            [-size, size, size, -size, size, -size, -size, -size, -size, -size, -size, size],
            [-1, 0, 0],
            [1, 1, 0, 1, 0, 0, 1, 0]
        );
        // Right (нормаль [1, 0, 0])
        this.addFace(
            [size, size, size, size, -size, size, size, -size, -size, size, size, -size],
            [1, 0, 0],
            [0, 1, 0, 0, 1, 0, 1, 1]
        );
        // Top (нормаль [0, 1, 0])
        this.addFace(
            [-size, size, size, size, size, size, size, size, -size, -size, size, -size],
            [0, 1, 0],
            [0, 0, 1, 0, 1, 1, 0, 1]
        );
        // Bottom (нормаль [0, -1, 0])
        this.addFace(
            [-size, -size, size, -size, -size, -size, size, -size, -size, size, -size, size],
            [0, -1, 0],
            [0, 1, 0, 0, 1, 0, 1, 1]
        );
    }

    addFace(vertices, normal, texCoords) {
        const baseIndex = this.vertices.length / 3;
        this.vertices.push(...vertices);
        this.texCoords.push(...texCoords);
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

    render(shaderProgram, viewMatrix, projectionMatrix) {
        shaderProgram.use();

        const modelViewMatrix = mat4.multiply(mat4.create(), viewMatrix, this.modelMatrix);
        const modelView3x3 = mat3.fromMat4(mat3.create(), modelViewMatrix);
        const inverseModelView3x3 = mat3.invert(mat3.create(), modelView3x3);
        const normalMatrix = inverseModelView3x3 ? mat3.transpose(mat3.create(), inverseModelView3x3) : mat3.create();

        shaderProgram.setUniformMatrix4fv('uModelViewMatrix', modelViewMatrix);
        shaderProgram.setUniformMatrix4fv('uProjectionMatrix', projectionMatrix);
        shaderProgram.setUniformMatrix3fv('uNormalMatrix', normalMatrix);
        shaderProgram.setUniform1f('uTextureMixFactor', this.textureMixFactor);
        shaderProgram.setUniform1f('uColorMixFactor', this.colorMixFactor);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(shaderProgram.locations.aPosition, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(shaderProgram.locations.aPosition);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.vertexAttribPointer(shaderProgram.locations.aColor, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(shaderProgram.locations.aColor);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
        this.gl.vertexAttribPointer(shaderProgram.locations.aNormal, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(shaderProgram.locations.aNormal);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.vertexAttribPointer(shaderProgram.locations.aTexCoord, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(shaderProgram.locations.aTexCoord);

        if (this.materialTexture) {
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.materialTexture);
            shaderProgram.setUniform1i('uMaterialTexture', 0);
        }

        if (this.numberTexture) {
            this.gl.activeTexture(this.gl.TEXTURE1);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.numberTexture);
            shaderProgram.setUniform1i('uNumberTexture', 1);
        }

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
    }
}
