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
        };
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
