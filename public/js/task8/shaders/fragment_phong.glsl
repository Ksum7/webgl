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
uniform int uTextureMode;
uniform float uTime;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(random(i + vec2(0.0,0.0)), random(i + vec2(1.0,0.0)), u.x),
               mix(random(i + vec2(0.0,1.0)), random(i + vec2(1.0,1.0)), u.x), u.y);
}

mat2 rotate2d(float angle) {
    return mat2(cos(angle),-sin(angle), sin(angle),cos(angle));
}

float lines(vec2 pos, float b) {
    float scale = 10.0;
    pos *= scale;
    return smoothstep(0.0, .5+b*.5, abs((sin(pos.x*3.1415)+b*2.0))*.5);
}


void main() {
    vec4 baseColor;

    if (uTextureMode == 1) {
        vec2 uv = vTexCoord * 2.0 - 1.0;
        
        float r = length(uv);
        float phi = atan(uv.y, uv.x);
        
        float spiralSpeed = 0.0005;
        float spiralTightness = 10.0;
        float maxRadius = 1.0;
        
        float twist = spiralTightness * (maxRadius - r) * sin(uTime * spiralSpeed);
        phi += twist;
        
        vec2 spiralUV = vec2(cos(phi), sin(phi)) * r;
        
        spiralUV = spiralUV * 0.5 + 0.5;

        baseColor = texture(uMaterialTexture, spiralUV);
    } else if (uTextureMode == 2) {
        vec2 pos = vTexCoord.yx * vec2(5, 5);
        pos = rotate2d(noise(pos)) * pos;
        float pattern = lines(pos, 0.5);
        baseColor = vec4(mix(vec3(0.82, 0.67, 0.46), vec3(0.38, 0.24, 0.12), pattern), 1.0);
    } else {
        baseColor = texture(uMaterialTexture, vTexCoord);
    }

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