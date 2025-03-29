precision mediump float;
varying vec3 vPositionEye;
varying vec3 vNormalEye;
varying vec4 vColor;
varying vec2 vTexCoord;
uniform vec3 uLightPositionEye;
uniform vec3 uLightColor;
uniform vec3 uAmbientLight;
uniform vec3 uSpecularColor;
uniform float uShininess;
uniform float uAttenuationLinear;
uniform float uAttenuationQuadratic;
uniform bool uUseSpecular;
uniform int uLightingModel;
uniform sampler2D uMaterialTexture;
uniform sampler2D uNumberTexture;
uniform float uTextureMixFactor;
uniform float uColorMixFactor;

void main() {
    vec4 materialColor = texture2D(uMaterialTexture, vTexCoord);
    vec4 numberColor = texture2D(uNumberTexture, vTexCoord);
    vec4 mixedTexture = mix(materialColor, numberColor, uTextureMixFactor);

    vec4 baseColor = mix(mixedTexture, mixedTexture * vColor, uColorMixFactor);

    vec3 normal = normalize(vNormalEye);
    vec3 lightDir = normalize(uLightPositionEye - vPositionEye);
    float distance = length(uLightPositionEye - vPositionEye);
    float attenuation = 1.0 / (1.0 + uAttenuationLinear * distance + uAttenuationQuadratic * distance * distance);
    float diffuse = max(dot(normal, lightDir), 0.0);

    vec3 ambient = uAmbientLight * baseColor.rgb;
    vec3 diffuseColor = diffuse * uLightColor * baseColor.rgb;
    vec3 totalColor = ambient;

    if (uUseSpecular) {
        vec3 viewDir = normalize(-vPositionEye);
        float specular = 0.0;
        if (uLightingModel == 1) { // Phong
            vec3 reflectDir = reflect(-lightDir, normal);
            specular = pow(max(dot(reflectDir, viewDir), 0.0), uShininess);
        } else if (uLightingModel == 2) { // Blinn-Phong
            vec3 halfDir = normalize(lightDir + viewDir);
            specular = pow(max(dot(normal, halfDir), 0.0), uShininess);
        } else if (uLightingModel == 3) { // Toon
            specular = dot(normal, lightDir) > 0.95 ? 1.0 : 0.0;
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
            totalColor *= 0.4;
        } else {
            totalColor *= 0.2;
        }
    }

    gl_FragColor = vec4(totalColor, baseColor.a);
}