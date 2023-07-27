uniform float uPixelRatio;
uniform float uSize;
uniform float uTime;

attribute float aScale;


void main()
{
    float time = uTime;
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    modelPosition.y += sin(time + modelPosition.x * 100.0) * aScale * 0.2 - 0.5;
    modelPosition.x += sin(time + modelPosition.z * 100.0) * aScale * 0.2 - 0.5;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;
    
    gl_PointSize = uSize * aScale * uPixelRatio;
    gl_PointSize *= (1.0 / - viewPosition.z);
}