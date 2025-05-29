export class ShaderProgram {
    constructor(gl, vertexShaderSource, fragmentShaderSource) {
        this.gl = gl;
        this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
        this.locations = {
            aPosition: gl.getAttribLocation(this.program, 'aPosition'),
            aColor: gl.getAttribLocation(this.program, 'aColor'),
            aNormal: gl.getAttribLocation(this.program, 'aNormal'),
            aTexCoord: gl.getAttribLocation(this.program, 'aTexCoord'),
            uModelViewMatrix: gl.getUniformLocation(this.program, 'uModelViewMatrix'),
            uProjectionMatrix: gl.getUniformLocation(this.program, 'uProjectionMatrix'),
            uNormalMatrix: gl.getUniformLocation(this.program, 'uNormalMatrix'),
            uLightPositionEye: gl.getUniformLocation(this.program, 'uLightPositionEye'),
            uLightColor: gl.getUniformLocation(this.program, 'uLightColor'),
            uAmbientLight: gl.getUniformLocation(this.program, 'uAmbientLight'),
            uSpecularColor: gl.getUniformLocation(this.program, 'uSpecularColor'),
            uShininess: gl.getUniformLocation(this.program, 'uShininess'),
            uAttenuationLinear: gl.getUniformLocation(this.program, 'uAttenuationLinear'),
            uAttenuationQuadratic: gl.getUniformLocation(this.program, 'uAttenuationQuadratic'),
            uUseSpecular: gl.getUniformLocation(this.program, 'uUseSpecular'),
            uLightingModel: gl.getUniformLocation(this.program, 'uLightingModel'),
            uMaterialTexture: gl.getUniformLocation(this.program, 'uMaterialTexture'),
            uNumberTexture: gl.getUniformLocation(this.program, 'uNumberTexture'),
            uTextureMixFactor: gl.getUniformLocation(this.program, 'uTextureMixFactor'),
            uColorMixFactor: gl.getUniformLocation(this.program, 'uColorMixFactor'),
            uBumpTexture: gl.getUniformLocation(this.program, 'uBumpTexture'),
            uUseBumpTexture: gl.getUniformLocation(this.program, 'uUseBumpTexture'),
            uBumpTextureSize: gl.getUniformLocation(this.program, 'uBumpTextureSize'),
            uTextureMode: gl.getUniformLocation(this.program, 'uTextureMode'),
            uTime: gl.getUniformLocation(this.program, 'uTime'),
        };
    }

    setLights(lights, viewMatrix) {
        const types = [];
        const positions = [];
        const directions = [];
        const colors = [];
        const intensities = [];
        const attenuationLinears = [];
        const attenuationQuadratics = [];
        const cutoffs = [];

        lights.forEach((light) => {
            const data = light.getLightDataInEyeSpace(viewMatrix);
            types.push(data.type);
            positions.push(...data.position);
            directions.push(...data.direction);
            colors.push(...data.color);
            intensities.push(data.intensity);
            attenuationLinears.push(data.attenuationLinear || 0.0);
            attenuationQuadratics.push(data.attenuationQuadratic || 0.0);
            cutoffs.push(data.cutoff || 0.0); // Для прожекторов, 0 для других типов
        });

        this.gl.uniform1i(this.gl.getUniformLocation(this.program, 'uNumLights'), lights.length);
        this.gl.uniform1iv(this.gl.getUniformLocation(this.program, 'uLightTypes'), new Int32Array(types));
        this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uLightPositions'), new Float32Array(positions));
        this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uLightDirections'), new Float32Array(directions));
        this.gl.uniform3fv(this.gl.getUniformLocation(this.program, 'uLightColors'), new Float32Array(colors));
        this.gl.uniform1fv(
            this.gl.getUniformLocation(this.program, 'uLightIntensities'),
            new Float32Array(intensities)
        );
        this.gl.uniform1fv(
            this.gl.getUniformLocation(this.program, 'uLightAttenuationLinear'),
            new Float32Array(attenuationLinears)
        );
        this.gl.uniform1fv(
            this.gl.getUniformLocation(this.program, 'uLightAttenuationQuadratic'),
            new Float32Array(attenuationQuadratics)
        );
        this.gl.uniform1fv(this.gl.getUniformLocation(this.program, 'uLightCutoffs'), new Float32Array(cutoffs));
    }

    createProgram(vsSource, fsSource) {
        const program = this.gl.createProgram();
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Ошибка при линковке программы:', this.gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Ошибка компиляции шейдера:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    use() {
        this.gl.useProgram(this.program);
    }

    setUniformMatrix4fv(name, value) {
        this.gl.uniformMatrix4fv(this.locations[name], false, value);
    }

    setUniformMatrix3fv(name, value) {
        this.gl.uniformMatrix3fv(this.locations[name], false, value);
    }

    setUniform3fv(name, value) {
        this.gl.uniform3fv(this.locations[name], value);
    }

    setUniform2fv(name, value) {
        this.gl.uniform2fv(this.locations[name], value);
    }

    setUniform1f(name, value) {
        this.gl.uniform1f(this.locations[name], value);
    }

    setUniform1i(name, value) {
        this.gl.uniform1i(this.locations[name], value);
    }

    setUniform4fv(name, value) {
        this.gl.uniform4fv(this.locations[name], value);
    }
}
