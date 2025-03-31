#version 300 es
precision mediump float;

#define MAX_LIGHTS 10
uniform int uNumLights;
uniform int uLightTypes[MAX_LIGHTS]; // 0 - point, 1 - directional, 2 - spot

uniform vec3 uLightPositions[MAX_LIGHTS];
uniform vec3 uLightDirections[MAX_LIGHTS];
uniform vec3 uLightColors[MAX_LIGHTS];
uniform float uLightIntensities[MAX_LIGHTS];
uniform float uLightAttenuationLinear[MAX_LIGHTS];
uniform float uLightAttenuationQuadratic[MAX_LIGHTS];
uniform float uLightCutoffs[MAX_LIGHTS];

in vec3 vPositionEye;
in vec3 vNormalEye;
in vec4 vColor;
in vec2 vTexCoord;

out vec4 fragColor;

uniform vec3 uAmbientLight;
uniform vec3 uSpecularColor;
uniform float uShininess;
uniform bool uUseSpecular;
uniform sampler2D uMaterialTexture;
uniform sampler2D uBumpTexture;
uniform vec2 uBumpTextureSize;
uniform bool uUseBumpTexture;

void main() {
    vec4 baseColor = texture(uMaterialTexture, vTexCoord);
    vec3 normal = normalize(vNormalEye);
    vec3 viewDir = normalize(-vPositionEye);
    vec3 totalDiffuse = vec3(0.0);
    vec3 totalSpecular = vec3(0.0);

    if (uUseBumpTexture) {
        vec2 texelSize = vec2(1.0 / uBumpTextureSize.x, 1.0 / uBumpTextureSize.y);

        vec4 right = texture(uBumpTexture, vec2(vTexCoord.x + texelSize.x, vTexCoord.y));
        vec4 left = texture(uBumpTexture, vec2(vTexCoord.x - texelSize.x, vTexCoord.y));
        vec4 top = texture(uBumpTexture, vec2(vTexCoord.x, vTexCoord.y - texelSize.y));
        vec4 bottom = texture(uBumpTexture, vec2(vTexCoord.x, vTexCoord.y + texelSize.y));
        float bumpStrength = 1.0;
        float dx = (right.r - left.r) * bumpStrength;
        float dy = (bottom.r - top.r) * bumpStrength;
        normal = vec3(normal.x + dx, normal.y + dy, normal.z);
        normal = normalize(normal);
    }

    for (int i = 0; i < uNumLights; i++) {
        vec3 lightColor = uLightColors[i] * uLightIntensities[i];
        vec3 lightDir;
        float attenuation = 1.0;
        float diffuse = 0.0;

        if (uLightTypes[i] == 0) { // Точечный источник
            lightDir = normalize(uLightPositions[i] - vPositionEye);
            float distance = length(uLightPositions[i] - vPositionEye);
            attenuation = 1.0 / (1.0 + uLightAttenuationLinear[i] * distance + uLightAttenuationQuadratic[i] * distance * distance);
            diffuse = max(dot(normal, lightDir), 0.0);
        } else if (uLightTypes[i] == 1) { // Направленный источник
            lightDir = normalize(-uLightDirections[i]);
            diffuse = max(dot(normal, lightDir), 0.0);
        } else if (uLightTypes[i] == 2) { // Прожекторный источник
            lightDir = normalize(uLightPositions[i] - vPositionEye);
            float distance = length(uLightPositions[i] - vPositionEye);
            attenuation = 1.0 / (1.0 + uLightAttenuationLinear[i] * distance + uLightAttenuationQuadratic[i] * distance * distance);
            vec3 spotDir = normalize(-uLightDirections[i]);
            float spotEffect = dot(spotDir, lightDir);
            if (spotEffect > uLightCutoffs[i]) {
                diffuse = max(dot(normal, lightDir), 0.0) * (spotEffect - uLightCutoffs[i]) / (1.0 - uLightCutoffs[i]);
            } else {
                diffuse = 0.0;
            }
        }

        totalDiffuse += attenuation * diffuse * lightColor;

        if (uUseSpecular && diffuse > 0.0) {
            vec3 halfDir = normalize(lightDir + viewDir);
            float specular = pow(max(dot(normal, halfDir), 0.0), uShininess);
            totalSpecular += attenuation * specular * lightColor * uSpecularColor;
        }
    }

    vec3 totalColor = uAmbientLight * baseColor.rgb + totalDiffuse + totalSpecular;
    fragColor = vec4(totalColor, baseColor.a);
}