precision mediump float;
varying float vDiffuseFactor;
varying float vSpecularFactor;
varying vec4 vColor;
varying vec2 vTexCoord;
uniform sampler2D uMaterialTexture;
uniform sampler2D uNumberTexture;
uniform float uTextureMixFactor;
uniform float uColorMixFactor;
uniform vec3 uLightColor;
uniform vec3 uAmbientLight;
uniform vec3 uSpecularColor;
uniform float uAttenuationLinear;
uniform float uAttenuationQuadratic;
uniform int uLightingModel;

void main() {
    vec4 materialColor = texture2D(uMaterialTexture, vTexCoord);
    vec4 numberColor = texture2D(uNumberTexture, vTexCoord);
    vec4 mixedTexture = mix(materialColor, numberColor, uTextureMixFactor);

    vec4 baseColor = mix(mixedTexture, mixedTexture * vColor, uColorMixFactor);

    vec3 ambient = uAmbientLight * baseColor.rgb;
    vec3 diffuse = vDiffuseFactor * uLightColor * baseColor.rgb;
    vec3 specular = vSpecularFactor * uLightColor * uSpecularColor;
    vec3 totalColor = ambient + diffuse + specular;

    if (uLightingModel == 3) {
        if (vDiffuseFactor >= 0.95) {
        } else if (vDiffuseFactor >= 0.5) {
            totalColor *= 0.7;
        } else if (vDiffuseFactor >= 0.25) {
            totalColor *= 0.4;
        } else {
            totalColor *= 0.2;
        }
    }

    gl_FragColor = vec4(totalColor, baseColor.a);
}