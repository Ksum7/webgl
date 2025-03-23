attribute vec4 aPosition;
attribute vec3 aNormal;
attribute vec4 aColor;
attribute vec2 aTexCoord;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;
uniform vec3 uLightPositionEye;
uniform float uShininess;
uniform bool uUseSpecular;
uniform mediump int uLightingModel;
varying float vDiffuseFactor;
varying float vSpecularFactor;
varying float vAttenuation;
varying vec4 vColor;
varying vec2 vTexCoord;
uniform float uAttenuationLinear;
uniform float uAttenuationQuadratic;

void main() {
    vec4 positionEye = uModelViewMatrix * aPosition;
    vec3 normalEye = normalize(uNormalMatrix * aNormal);
    vec3 lightDir = normalize(uLightPositionEye - positionEye.xyz);
    float distance = length(uLightPositionEye - positionEye.xyz);
    float attenuation = 1.0 / (1.0 + uAttenuationLinear * distance + uAttenuationQuadratic * distance * distance);
    vAttenuation= attenuation;
    float diffuse = max(dot(normalEye, lightDir), 0.0);
    vDiffuseFactor = diffuse;

    vSpecularFactor = 0.0;
    if (uUseSpecular) {
        vec3 viewDir = normalize(-positionEye.xyz);
        if (uLightingModel == 1) { // Phong
            vec3 reflectDir = reflect(-lightDir, normalEye);
            vSpecularFactor = pow(max(dot(reflectDir, viewDir), 0.0), uShininess);
        } else if (uLightingModel == 2) { // Blinn-Phong
            vec3 halfDir = normalize(lightDir + viewDir);
            vSpecularFactor = pow(max(dot(normalEye, halfDir), 0.0), uShininess);
        } else if (uLightingModel == 3) { // Toon
            vSpecularFactor = dot(normalEye, lightDir) > 0.95 ? 1.0 : 0.0;
        }
    }

    vColor = aColor;
    vTexCoord = aTexCoord;
    gl_Position = uProjectionMatrix * positionEye;
}