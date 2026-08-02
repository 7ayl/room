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

// 4x4 Bayer matrix for ordered dithering
int bayerValue(int x, int y) {
  int m[16];
  m[0]=0; m[1]=8; m[2]=2; m[3]=10;
  m[4]=12; m[5]=4; m[6]=14; m[7]=6;
  m[8]=3; m[9]=11; m[10]=1; m[11]=9;
  m[12]=15; m[13]=7; m[14]=13; m[15]=5;
  int idx = (y%4)*4 + (x%4);
  return m[idx];
}

void main() {
  // sample low-res texture
  vec2 uv = vUv;
  vec2 texSize = uResolution;
  // compute pixel coords in render target
  vec2 px = floor(uv * texSize);
  vec2 centerUV = (px + 0.5) / texSize;
  vec4 col = texture2D(uTexture, centerUV);

  // apply slight animated color shift to make it magical
  col.rgb += 0.02 * sin(uTime + centerUV.yx * 10.0);

  // ordered dither threshold
  int bx = int(mod(px.x, 4.0));
  int by = int(mod(px.y, 4.0));
  int b = bayerValue(bx, by);
  float threshold = float(b) / 16.0;

  // find nearest palette color
  float bestDist = 1e9;
  vec3 bestColor = palette[0];
  for (int i = 0; i < PALETTE_SIZE; i++) {
    vec3 p = palette[i];
    float d = distance(col.rgb, p);
    if (d < bestDist) { bestDist = d; bestColor = p; }
  }

  // apply dithering: blend towards next color based on threshold
  // simple approach: compare luminance
  float lum = dot(col.rgb, vec3(0.299, 0.587, 0.114));
  gl_FragColor = vec4(bestColor, 1.0);
}
`;

export default { vertex, fragment };
