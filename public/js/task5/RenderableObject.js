import { mat4, vec3 } from 'gl-matrix';

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
        this.velocity = [0, 0, 0];
        this.localAABB = null;
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
        mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotation.y);
        mat4.rotateX(this.modelMatrix, this.modelMatrix, this.rotation.x);
        mat4.scale(this.modelMatrix, this.modelMatrix, [this.scale, this.scale, this.scale]);
    }

    setTexture(texture) {
        this.texture = texture;
    }

    update(deltaTime) {
        this.position[0] += this.velocity[0] * deltaTime;
        this.position[1] += this.velocity[1] * deltaTime;
        this.position[2] += this.velocity[2] * deltaTime;
        this.updateModelMatrix();
    }

    getWorldAABB() {
        if (!this.localAABB) return null;
        const corners = [
            [this.localAABB.min[0], this.localAABB.min[1], this.localAABB.min[2]],
            [this.localAABB.min[0], this.localAABB.min[1], this.localAABB.max[2]],
            [this.localAABB.min[0], this.localAABB.max[1], this.localAABB.min[2]],
            [this.localAABB.min[0], this.localAABB.max[1], this.localAABB.max[2]],
            [this.localAABB.max[0], this.localAABB.min[1], this.localAABB.min[2]],
            [this.localAABB.max[0], this.localAABB.min[1], this.localAABB.max[2]],
            [this.localAABB.max[0], this.localAABB.max[1], this.localAABB.min[2]],
            [this.localAABB.max[0], this.localAABB.max[1], this.localAABB.max[2]],
        ];
        const transformedCorners = corners.map((corner) => {
            const vec = vec3.fromValues(corner[0], corner[1], corner[2]);
            vec3.transformMat4(vec, vec, this.modelMatrix);
            return vec;
        });
        let minX = transformedCorners[0][0],
            maxX = transformedCorners[0][0];
        let minY = transformedCorners[0][1],
            maxY = transformedCorners[0][1];
        let minZ = transformedCorners[0][2],
            maxZ = transformedCorners[0][2];
        transformedCorners.forEach((corner) => {
            minX = Math.min(minX, corner[0]);
            maxX = Math.max(maxX, corner[0]);
            minY = Math.min(minY, corner[1]);
            maxY = Math.max(maxY, corner[1]);
            minZ = Math.min(minZ, corner[2]);
            maxZ = Math.max(maxZ, corner[2]);
        });
        return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] };
    }

    render(shaderProgram, viewMatrix, projectionMatrix) {
        throw new Error('render method must be implemented in derived classes');
    }
}
