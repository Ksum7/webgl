import { mat3, vec3 } from 'gl-matrix';

export class Light {
    constructor(type, color = [1, 1, 1], intensity = 1.0) {
        this.type = type; // 0 - точечный, 1 - направленный, 2 - прожекторный
        this.color = color;
        this.intensity = intensity;
    }

    getLightData() {
        throw new Error('getLightData must be implemented in derived classes');
    }

    getLightDataInEyeSpace(viewMatrix) {
        throw new Error('getLightDataInEyeSpace must be implemented in derived classes');
    }
}

export class PointLight extends Light {
    constructor(position, color, intensity = 1.0, attenuationLinear = 0.1, attenuationQuadratic = 0.01) {
        super(0, color, intensity); // type 0 - точечный
        this.position = position;
        this.attenuationLinear = attenuationLinear;
        this.attenuationQuadratic = attenuationQuadratic;
    }

    getLightData() {
        return {
            type: this.type,
            position: this.position,
            color: this.color,
            intensity: this.intensity,
            attenuationLinear: this.attenuationLinear,
            attenuationQuadratic: this.attenuationQuadratic,
            direction: [0, 0, 0],
        };
    }

    getLightDataInEyeSpace(viewMatrix) {
        // @ts-ignore
        const positionEye = vec3.transformMat4(vec3.create(), this.position, viewMatrix);
        return {
            type: this.type,
            // @ts-ignore
            position: Array.from(positionEye),
            color: this.color,
            intensity: this.intensity,
            attenuationLinear: this.attenuationLinear,
            attenuationQuadratic: this.attenuationQuadratic,
            direction: [0, 0, 0],
        };
    }
}

export class DirectionalLight extends Light {
    constructor(direction, color = [1, 1, 1], intensity = 1.0) {
        super(1, color, intensity); // type 1 - направленный
        this.direction = direction;
    }

    getLightData() {
        return {
            type: this.type,
            direction: this.direction,
            color: this.color,
            intensity: this.intensity,
            position: [0, 0, 0],
            attenuationLinear: 0.0,
            attenuationQuadratic: 0.0,
        };
    }

    getLightDataInEyeSpace(viewMatrix) {
        const rotationMatrix = mat3.fromMat4(mat3.create(), viewMatrix);
        // @ts-ignore
        const directionEye = vec3.transformMat3(vec3.create(), this.direction, rotationMatrix);
        vec3.normalize(directionEye, directionEye);
        return {
            type: this.type,
            // @ts-ignore
            direction: Array.from(directionEye),
            color: this.color,
            intensity: this.intensity,
            position: [0, 0, 0],
            attenuationLinear: 0.0,
            attenuationQuadratic: 0.0,
        };
    }
}

export class SpotLight extends Light {
    constructor(
        position,
        direction,
        color = [1, 1, 1],
        intensity = 1.0,
        cutoff = 0.9,
        attenuationLinear = 0.1,
        attenuationQuadratic = 0.01
    ) {
        super(2, color, intensity); // type 2 - прожекторный
        this.position = position;
        this.direction = direction;
        this.cutoff = cutoff;
        this.attenuationLinear = attenuationLinear;
        this.attenuationQuadratic = attenuationQuadratic;
    }

    getLightData() {
        return {
            type: this.type,
            position: this.position,
            direction: this.direction,
            color: this.color,
            intensity: this.intensity,
            cutoff: this.cutoff,
            attenuationLinear: this.attenuationLinear,
            attenuationQuadratic: this.attenuationQuadratic,
        };
    }

    getLightDataInEyeSpace(viewMatrix) {
        // @ts-ignore
        const positionEye = vec3.transformMat4(vec3.create(), this.position, viewMatrix);
        const rotationMatrix = mat3.fromMat4(mat3.create(), viewMatrix);
        // @ts-ignore
        const directionEye = vec3.transformMat3(vec3.create(), this.direction, rotationMatrix);
        vec3.normalize(directionEye, directionEye);
        return {
            type: this.type,
            // @ts-ignore
            position: Array.from(positionEye),
            // @ts-ignore
            direction: Array.from(directionEye),
            color: this.color,
            intensity: this.intensity,
            cutoff: this.cutoff,
            attenuationLinear: this.attenuationLinear,
            attenuationQuadratic: this.attenuationQuadratic,
        };
    }
}
