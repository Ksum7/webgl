import { mat4, vec3 } from 'gl-matrix';

export class Cube {
    constructor(size = 1, position = [0, 0, 0], rotation = { x: 0, y: 0 }, color = [1, 1, 1, 1]) {
        this.vertices = [];
        this.colors = [];
        this.indices = [];
        this.position = position;
        this.rotation = rotation;
        this.size = size;

        this.initGeometry(color);
    }

    initGeometry(color) {
        const size = this.size / 2;
        // Front
        this.addFace([size, size, size, -size, size, size, -size, -size, size, size, -size, size], color);

        // Back
        this.addFace([size, size, -size, size, -size, -size, -size, -size, -size, -size, size, -size], color);

        // Left
        this.addFace([-size, size, size, -size, size, -size, -size, -size, -size, -size, -size, size], color);

        // Right
        this.addFace([size, size, size, size, -size, size, size, -size, -size, size, size, -size], color);

        // Top
        this.addFace([-size, size, size, size, size, size, size, size, -size, -size, size, -size], color);

        // Bottom
        this.addFace([-size, -size, size, -size, -size, -size, size, -size, -size, size, -size, size], color);
    }

    addFace(vertices, color) {
        const baseIndex = this.vertices.length / 3;

        this.vertices.push(...vertices);

        for (let i = 0; i < 4; i++) {
            this.colors.push(...color);
        }

        this.indices.push(baseIndex, baseIndex + 1, baseIndex + 2, baseIndex, baseIndex + 2, baseIndex + 3);
    }

    setRotation(x, y) {
        this.rotation.x = x;
        this.rotation.y = y;
    }

    setPosition(x, y, z) {
        this.position = [x, y, z];
    }

    translate(x, y, z) {
        this.position[0] += x;
        this.position[1] += y;
        this.position[2] += z;
    }

    getModelMatrix() {
        const modelMatrix = mat4.create();
        // @ts-ignore
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.rotateX(modelMatrix, modelMatrix, this.rotation.x);
        mat4.rotateY(modelMatrix, modelMatrix, this.rotation.y);
        return modelMatrix;
    }
}
