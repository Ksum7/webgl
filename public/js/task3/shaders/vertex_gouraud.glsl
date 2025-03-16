attribute vec4 aPosition;
attribute vec3 aNormal;
attribute vec4 aColor;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;
uniform vec3 uLightPositionEye;
uniform vec3 uLightColor;
uniform vec3 uAmbientLight;
uniform vec3 uSpecularColor;
uniform float uShininess;
uniform float uAttenuationLinear;
uniform float uAttenuationQuadratic;
uniform bool uUseSpecular;
uniform int uLightingModel; // 0: Lambert, 1: Phong, 2: Blinn-Phong, 3: Toon
varying vec4 vColor;

void main() {
    vec4 positionEye = uModelViewMatrix * aPosition;
    vec3 normalEye = normalize(uNormalMatrix * aNormal);
    vec3 lightDir = normalize(uLightPositionEye - positionEye.xyz);
    float distance = length(uLightPositionEye - positionEye.xyz);
    float attenuation = 1.0 / (1.0 + uAttenuationLinear * distance + uAttenuationQuadratic * distance * distance);
    float diffuse = max(dot(normalEye, lightDir), 0.0);
    vec3 diffuseColor = diffuse * uLightColor * aColor.rgb;
    vec3 ambientColor = uAmbientLight * aColor.rgb;
    vec3 totalColor = ambientColor;

    if (uUseSpecular) {
        vec3 viewDir = normalize(-positionEye.xyz);
        float specular = 0.0;
        if (uLightingModel == 1) { // Phong
            vec3 reflectDir = reflect(-lightDir, normalEye);
            specular = pow(max(dot(reflectDir, viewDir), 0.0), uShininess);
        } else if (uLightingModel == 2) { // Blinn-Phong
            vec3 halfDir = normalize(lightDir + viewDir);
            specular = pow(max(dot(normalEye, halfDir), 0.0), uShininess);
        } else if (uLightingModel == 3) { // Toon
            specular = dot(normalEye, lightDir) > 0.95 ? 1.0 : 0.0;
        }
        vec3 specularColor = specular * uLightColor * uSpecularColor;
        totalColor += attenuation * (diffuseColor + specularColor);
    } else {
        totalColor += attenuation * diffuseColor;
    }
    if (uLightingModel == 3) {
        if (diffuse >= 0.95) {
        } else if (diffuse >= 0.5) {
            totalColor *= 0.7;
        } else if (diffuse >= 0.25) {
            totalColor *=  0.4;
        } else {
            totalColor *= 0.2;
        }
    }
    vColor = vec4(totalColor, aColor.a);
    gl_Position = uProjectionMatrix * positionEye;
}