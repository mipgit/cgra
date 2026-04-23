attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;
uniform sampler2D uSampler2;
uniform float timeFactor;

varying vec2 vTextureCoord;

void main() {
	vec2 animatedTexCoord = aTextureCoord + vec2(timeFactor * 0.0015, 0.0);
	vec4 heightSample = texture2D(uSampler2, animatedTexCoord);
	float height = heightSample.b;
	vec3 offset = aVertexNormal * height * 0.05;

	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition + offset, 1.0);

	vTextureCoord = animatedTexCoord;
}

