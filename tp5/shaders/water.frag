#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform sampler2D uSampler2;
uniform float timeFactor;

void main() {
	vec2 animatedTexCoord = vTextureCoord + vec2(timeFactor * 0.0008, 0.0);
	vec4 color = texture2D(uSampler, animatedTexCoord);
	vec4 filter = texture2D(uSampler2, vec2(0.0,0.1)+animatedTexCoord);
	
	float height = filter.b;
	float shade = 0.75 + 0.50 * height;
	color.rgb *= shade;
	
	gl_FragColor = color;
}