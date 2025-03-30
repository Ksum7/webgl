import { mat4, mat3 } from 'gl-matrix';
import { RenderableObject } from './RenderableObject';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export class ThreeObject extends RenderableObject {
    constructor(gl, name, size = 1, position = [0, 0, 0], rotation = { x: 0, y: 0 }, scale = 1, color = [1, 1, 1, 1]) {
        super(gl);

        const objPath = `../../objects/${name}.obj`;

        this.size = size;
        this.color = color;

        this.loaded = false;

        this.vertices = [];
        this.colors = [];
        this.normals = [];
        this.texCoords = [];
        this.indices = [];

        // LOAD DATA
        const objLoader = new OBJLoader();

        objLoader.load(
            objPath,
            (object) => {
                try {
                    let totalVertices = 0;
                    let totalNormals = 0;
                    let totalTexCoords = 0;
                    let totalIndices = 0;

                    object.children.forEach((child) => {
                        // @ts-ignore
                        const geometry = child.geometry;
                        totalVertices += geometry.attributes.position.array.length;
                        if (geometry.attributes.normal) totalNormals += geometry.attributes.normal.array.length;
                        if (geometry.attributes.uv) totalTexCoords += geometry.attributes.uv.array.length;
                        if (geometry.index) totalIndices += geometry.index.array.length;
                    });

                    const allVertices = new Float32Array(totalVertices);
                    const allNormals = totalNormals ? new Float32Array(totalNormals) : null;
                    const allTexCoords = totalTexCoords ? new Float32Array(totalTexCoords) : null;
                    const allIndices = totalIndices ? new Uint16Array(totalIndices) : null;

                    let vertexOffset = 0;
                    let normalOffset = 0;
                    let texCoordOffset = 0;
                    let indexOffset = 0;

                    object.children.forEach((child) => {
                        // @ts-ignore
                        const geometry = child.geometry;

                        const vertices = geometry.attributes.position.array;
                        const normals = geometry.attributes.normal?.array;
                        const texCoords = geometry.attributes.uv?.array;
                        const indices = geometry.index?.array;

                        allVertices.set(vertices, vertexOffset);
                        if (normals && allNormals) allNormals.set(normals, normalOffset);
                        if (texCoords && allTexCoords) allTexCoords.set(texCoords, texCoordOffset);

                        if (indices && allIndices) {
                            // @ts-ignore
                            const offsetIndices = Array.from(indices).map((index) => index + vertexOffset / 3);
                            allIndices.set(offsetIndices, indexOffset);
                            indexOffset += indices.length;
                        }

                        vertexOffset += vertices.length;
                        if (normals) normalOffset += normals.length;
                        if (texCoords) texCoordOffset += texCoords.length;
                    });
                    // @ts-ignore
                    this.vertices = allVertices;
                    // @ts-ignore
                    this.normals = allNormals;
                    // @ts-ignore
                    this.texCoords = allTexCoords;
                    // @ts-ignore
                    this.indices = allIndices;

                    this.localAABB = this.calculateAABB(this.vertices);

                    if (this.texCoords && this.texCoords.length !== (this.vertices.length / 3) * 2) {
                        console.warn(`Несоответствие текстурных координат для ${name}`);
                    }

                    this.vertexBuffer = this.createBuffer(this.vertices, this.gl.ARRAY_BUFFER);
                    this.colorBuffer = this.createBuffer(new Float32Array(this.colors), this.gl.ARRAY_BUFFER);
                    this.normalBuffer = this.normals ? this.createBuffer(this.normals, this.gl.ARRAY_BUFFER) : null;
                    this.texCoordBuffer = this.texCoords
                        ? this.createBuffer(this.texCoords, this.gl.ARRAY_BUFFER)
                        : null;
                    this.indexBuffer = this.indices
                        ? this.createBuffer(this.indices, this.gl.ELEMENT_ARRAY_BUFFER)
                        : null;

                    this.setPosition(position[0], position[1], position[2]);
                    this.setRotation(rotation.x, rotation.y);
                    this.setScale(scale);
                    this.loaded = true;
                } catch (error) {
                    console.error('Ошибка обработки OBJ данных:', error);
                }
            },
            undefined,
            (error) => {
                console.error(`Ошибка загрузки ${objPath}:`, error);
            }
        );
    }

    calculateAABB(vertices) {
        let minX = vertices[0],
            maxX = vertices[0];
        let minY = vertices[1],
            maxY = vertices[1];
        let minZ = vertices[2],
            maxZ = vertices[2];
        for (let i = 3; i < vertices.length; i += 3) {
            minX = Math.min(minX, vertices[i]);
            maxX = Math.max(maxX, vertices[i]);
            minY = Math.min(minY, vertices[i + 1]);
            maxY = Math.max(maxY, vertices[i + 1]);
            minZ = Math.min(minZ, vertices[i + 2]);
            maxZ = Math.max(maxZ, vertices[i + 2]);
        }
        return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] };
    }

    createBuffer(data, type) {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(type, buffer);
        this.gl.bufferData(type, data, this.gl.STATIC_DRAW);
        return buffer;
    }

    render(shaderProgram, viewMatrix, projectionMatrix) {
        if (this.loaded) {
            shaderProgram.use();

            const modelViewMatrix = mat4.multiply(mat4.create(), viewMatrix, this.modelMatrix);
            const modelView3x3 = mat3.fromMat4(mat3.create(), modelViewMatrix);
            const inverseModelView3x3 = mat3.invert(mat3.create(), modelView3x3);
            const normalMatrix = inverseModelView3x3
                ? mat3.transpose(mat3.create(), inverseModelView3x3)
                : mat3.create();

            shaderProgram.setUniformMatrix4fv('uModelViewMatrix', modelViewMatrix);
            shaderProgram.setUniformMatrix4fv('uProjectionMatrix', projectionMatrix);
            shaderProgram.setUniformMatrix3fv('uNormalMatrix', normalMatrix);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
            this.gl.vertexAttribPointer(shaderProgram.locations.aPosition, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(shaderProgram.locations.aPosition);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
            this.gl.vertexAttribPointer(shaderProgram.locations.aColor, 4, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(shaderProgram.locations.aColor);

            if (this.normals) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
                this.gl.vertexAttribPointer(shaderProgram.locations.aNormal, 3, this.gl.FLOAT, false, 0, 0);
                this.gl.enableVertexAttribArray(shaderProgram.locations.aNormal);
            }

            if (this.texCoords) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
                this.gl.vertexAttribPointer(shaderProgram.locations.aTexCoord, 2, this.gl.FLOAT, false, 0, 0);
                this.gl.enableVertexAttribArray(shaderProgram.locations.aTexCoord);
            }

            if (this.texture) {
                this.gl.activeTexture(this.gl.TEXTURE0);
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
                shaderProgram.setUniform1i('uMaterialTexture', 0);
            }

            if (this.indices) {
                this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
                this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
            } else {
                this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertices.length / 3);
            }
        }
    }
}
