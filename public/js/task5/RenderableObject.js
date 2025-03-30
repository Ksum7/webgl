import { mat4 } from 'gl-matrix';

export class RenderableObject {
    constructor(gl) {
        this.gl = gl;
        this.modelMatrix = mat4.create();
        this.position = [0, 0, 0];
        this.rotation = { x: 0, y: 0 };
        this.scale = 1.0;
        this.color = [1, 1, 1, 1];
        this.texture = null;
        this.textureMixFactor = 0.5;
        this.colorMixFactor = 0.5;
    }

    setPosition(x, y, z) {
        this.position = [x, y, z];
        this.updateModelMatrix();
    }

    setRotation(x, y) {
        this.rotation.x = x;
        this.rotation.y = y;
        this.updateModelMatrix();
    }

    setScale(scale) {
        this.scale = scale;
        this.updateModelMatrix();
    }

    updateModelMatrix() {
        mat4.identity(this.modelMatrix);
        // @ts-ignore
        mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
        mat4.rotateX(this.modelMatrix, this.modelMatrix, this.rotation.x);
        mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotation.y);
        mat4.scale(this.modelMatrix, this.modelMatrix, [this.scale, this.scale, this.scale])
    }

    setTexture(texture) {
        this.texture = texture;
    }

    render(shaderProgram, viewMatrix, projectionMatrix) {
        throw new Error('render method must be implemented in derived classes');
    }
}
