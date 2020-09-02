precision mediump float;

uniform vec2 dimensions;
uniform float backgroundSize;

vec2 coordToUV(vec2 coord)
{
    coord *= 2.0 / dimensions;
    coord -= 1.0;
    coord.y *= dimensions.y / dimensions.x;
    return coord;
}

float lenToUV(float length)
{
    return length * 2.0 / dimensions.x;
}

void main()
{
    vec2 uv = coordToUV(gl_FragCoord);

    vec3 left = vec4(1.0, 0.5, 0.5);
    vec3 right = vec4(1.0, 0.9, 0.5);

    float fac = smoothstep(0, .5, dot(uv, uv));
    gl_FragColor = vec4(mix(left, right, fac), 1.0);
}