#ifdef GL_ES
precision highp float;
#endif

struct lightProperties {
    vec4 position;                  
    vec4 ambient;                   
    vec4 diffuse;                   
    vec4 specular;                  
    vec4 half_vector;
    vec3 spot_direction;            
    float spot_exponent;            
    float spot_cutoff;              
    float constant_attenuation;     
    float linear_attenuation;       
    float quadratic_attenuation;    
    bool enabled;                   
};

#define NUMBER_OF_LIGHTS 8
uniform lightProperties uLight[NUMBER_OF_LIGHTS];


varying vec4 vPositionNDC;

void main() {
	// Normalize the y coordinate from NDC [-1, 1] to [0, 1]
	// where 1.0 is top of screen, 0.0 is bottom of screen
	float yNormalized = vPositionNDC.y / vPositionNDC.w;
	yNormalized = (yNormalized + 1.0) / 2.0;
	
	// If y > 0.5 (upper half), show yellow; else show bluish purple
	if (yNormalized > 0.5) {
		gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0); //yellooooow
	} else {
		gl_FragColor =  vec4(0.6,0.6,0.9, 1.0) * uLight[0].diffuse;
	}
}
