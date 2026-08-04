const vertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragment = `
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 palette[PALETTE_SIZE];

varying vec2 vUv;

// Simple Bayer 4x4 matrix
float bayer(vec2 uv) {
  vec2 p = floor(uv * uResolution);
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  int idx = x + y * 4;
  int m[16];
  m[0]=0; m[1]=8; m[2]=2; m[3]=10;
  m[4]=12; m[5]=4; m[6]=14; m[7]=6;
  m[8]=3; m[9]=11; m[10]=1; m[11]=9;
  m[12]=15; m[13]=7; m[14]=13; m[15]=5;
  return float(m[idx]) / 16.0;
}

void main() {
  // sample center of low-res pixel
  vec2 texSize = uResolution;
  vec2 px = floor(vUv * texSize);
  vec2 centerUV = (px + 0.5) / texSize;
  vec4 col = texture2D(uTexture, centerUV);

  // slight shimmer
  col.rgb += 0.02 * sin(uTime + centerUV.yx * 10.0);

  // find nearest palette color
  float best = 1e9;
  vec3 pick = palette[0];
  for (int i=0;i<PALETTE_SIZE;i++) {
    vec3 p = palette[i];
    float d = distance(col.rgb, p);
    if (d < best) { best = d; pick = p; }
  }

  // apply ordered dither
  float th = bayer(vUv);
  // brighten slightly if above threshold
  vec3 outc = pick;
  gl_FragColor = vec4(outc, 1.0);
}
`;

export default { vertex, fragment };
