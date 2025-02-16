import { mat4, vec3 } from 'gl-matrix';

export class Cube {
    constructor() {
        this.vertices = [];
        this.colors = [];
        this.indices = [];
        this.rotation = { x: 0, y: 0 };

        this.initGeometry();
    }

    initGeometry() {
        // Front
        this.addFace([1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1], [1, 0, 0, 1]);

        // Back
        this.addFace([1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1], [1, 0, 0, 1]);

        // Left
        this.addFace([-1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1], [0, 1, 0, 1]);

        // Right
        this.addFace([1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1], [0, 1, 0, 1]);

        // Top
        this.addFace([-1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1], [0, 0, 1, 1]);

        // Bottom
        this.addFace([-1, -1, 1, -1, -1, -1, 1, -1, -1, 1, -1, 1], [0, 0, 1, 1]);
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

    getModelMatrix() {
        const modelMatrix = mat4.create();
        mat4.rotateX(modelMatrix, modelMatrix, this.rotation.x);
        mat4.rotateY(modelMatrix, modelMatrix, this.rotation.y);
        return modelMatrix;
    }
}
