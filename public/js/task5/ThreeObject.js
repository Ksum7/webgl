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


        objLoader.load(objPath, (object) => {
            // @ts-ignore
            const geometry = object.children[0].geometry;

            //@ts-ignore
            console.log('Bounding box:', geometry.boundingBox);

            this.vertices = geometry.attributes.position.array;
            this.normals = geometry.attributes.normal.array;
            //this.texCoords = geometry.attributes.uv.array;

            if (geometry.index) {
                this.indices = [...geometry.index.array];
            } else {
                this.indices = Array.from({ length: this.vertices.length / 3 }, (_, i) => i);
            }

            this.vertexBuffer = this.createBuffer(new Float32Array(this.vertices), this.gl.ARRAY_BUFFER);
            this.colorBuffer = this.createBuffer(new Float32Array(this.colors), this.gl.ARRAY_BUFFER);
            this.normalBuffer = this.createBuffer(new Float32Array(this.normals), this.gl.ARRAY_BUFFER);
            this.texCoordBuffer = this.createBuffer(new Float32Array(this.texCoords), this.gl.ARRAY_BUFFER);
            this.indexBuffer = this.createBuffer(new Uint16Array(this.indices), this.gl.ELEMENT_ARRAY_BUFFER);

            this.setPosition(position[0], position[1], position[2]);
            this.setRotation(rotation.x, rotation.y)
            this.setScale(scale)
            this.loaded = true

            
        });



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

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
            this.gl.vertexAttribPointer(shaderProgram.locations.aTexCoord, 2, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(shaderProgram.locations.aTexCoord);

            if (this.texture) {
                this.gl.activeTexture(this.gl.TEXTURE0);
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
                shaderProgram.setUniform1i('uMaterialTexture', 0);
            }

            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
        }
    }
}
