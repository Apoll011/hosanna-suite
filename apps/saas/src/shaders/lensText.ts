export const lensTextVertexShader = /* glsl */ `
  varying vec2 vUv;

  uniform vec2 uMouse;
  uniform vec2 uVelocity;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uImpulse;
  uniform float uLensRadiusPx;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // 3D plane deformation ripple proportional to cursor proximity & velocity (disabled when lens hidden on mobile)
    float lensEnabled = step(0.5, uLensRadiusPx);
    vec2 mouseNdc = uMouse * 2.0 - 1.0;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 diff = (pos.xy - mouseNdc) * vec2(aspect, 1.0);
    float dist = length(diff);

    float speed = length(uVelocity);
    float rippleAmp = clamp(speed * 1.9 + uImpulse * 0.035, 0.0, 0.065) * lensEnabled;
    float wave = sin(dist * 16.0 - uTime * 6.5) * exp(-dist * 3.2) * rippleAmp;

    pos.z += wave;
    // Subtle lateral micro-displacement during fast sweeps so orthographic plane feels alive
    if (dist > 0.0001) {
      pos.xy += (diff / dist) * wave * 0.18;
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const lensTextFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform sampler2D uEnglishTex;
  uniform sampler2D uJapaneseTex;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform vec2 uVelocity;
  uniform float uLensRadiusPx;
  uniform float uTime;
  uniform vec3 uLineProgress;
  uniform vec4 uLineBounds; // (line1Top, line12Mid, line23Mid, line3Bot) in UV [0..1]

  vec4 sampleMaskedEnglish(vec2 uv) {
    float top1 = uLineBounds.x;
    float mid12 = uLineBounds.y;
    float mid23 = uLineBounds.z;
    float bot3 = uLineBounds.w;

    float prog = 0.0;
    float bandMin = 0.0;
    float bandMax = 0.0;

    if (uv.y <= top1 && uv.y > mid12) {
      prog = uLineProgress.x;
      bandMin = mid12;
      bandMax = top1;
    } else if (uv.y <= mid12 && uv.y > mid23) {
      prog = uLineProgress.y;
      bandMin = mid23;
      bandMax = mid12;
    } else if (uv.y <= mid23 && uv.y >= bot3) {
      prog = uLineProgress.z;
      bandMin = bot3;
      bandMax = mid23;
    } else {
      return vec4(0.0);
    }

    float bandH = bandMax - bandMin;
    float offsetY = (1.0 - prog) * bandH * 1.05;
    vec2 shiftedUv = vec2(uv.x, uv.y - offsetY);

    // Clip strictly inside the line's horizontal mask window
    float mask = step(bandMin, shiftedUv.y) * step(shiftedUv.y, bandMax);
    vec4 tex = texture2D(uEnglishTex, clamp(shiftedUv, 0.0, 1.0));
    float fade = smoothstep(0.0, 0.18, prog);
    return vec4(tex.rgb, tex.a * mask * fade);
  }

  vec4 sampleMaskedJapanese(vec2 uv) {
    float top1 = uLineBounds.x;
    float mid12 = uLineBounds.y;
    float mid23 = uLineBounds.z;
    float bot3 = uLineBounds.w;

    float prog = 0.0;
    float bandMin = 0.0;
    float bandMax = 0.0;

    if (uv.y <= top1 && uv.y > mid12) {
      prog = uLineProgress.x;
      bandMin = mid12;
      bandMax = top1;
    } else if (uv.y <= mid12 && uv.y > mid23) {
      prog = uLineProgress.y;
      bandMin = mid23;
      bandMax = mid12;
    } else if (uv.y <= mid23 && uv.y >= bot3) {
      prog = uLineProgress.z;
      bandMin = bot3;
      bandMax = mid23;
    } else {
      return vec4(0.0);
    }

    float bandH = bandMax - bandMin;
    float offsetY = (1.0 - prog) * bandH * 1.05;
    vec2 shiftedUv = vec2(uv.x, uv.y - offsetY);

    float mask = step(bandMin, shiftedUv.y) * step(shiftedUv.y, bandMax);
    vec4 tex = texture2D(uJapaneseTex, clamp(shiftedUv, 0.0, 1.0));
    float fade = smoothstep(0.0, 0.18, prog);
    return vec4(tex.rgb, tex.a * mask * fade);
  }

  void main() {
    vec2 pixelPos = vUv * uResolution;
    vec2 mousePos = uMouse * uResolution;
    vec2 delta = pixelPos - mousePos;
    float dist = length(delta);

    float lensEnabled = step(0.5, uLensRadiusPx);
    float speed = length(uVelocity);
    float radius = uLensRadiusPx * (1.0 + clamp(speed * 2.5, 0.0, 0.05));
    float normDist = dist / max(radius, 1.0);

    // Base English layer outside the lens
    vec4 enSample = sampleMaskedEnglish(vUv);

    // Soft circle mask for inside the convex glass lens (0 completely disables on mobile)
    float lensMask = (1.0 - smoothstep(radius - 1.6, radius + 1.0, dist)) * lensEnabled;

    vec4 jpSample = vec4(0.0);
    if (lensEnabled > 0.5 && normDist < 1.05) {
      // True radial optical lens refraction: convex magnification + spherical edge curvature
      float mag = 0.062;
      float barrel = pow(clamp(normDist, 0.0001, 1.0), 2.35) * 0.24;
      vec2 refractedDelta = delta * (1.0 - mag - barrel);
      vec2 jpUv = (mousePos + refractedDelta) / uResolution;

      // Subtle rainbow prismatic dispersion around musical notes inside the glass lens
      vec2 dir = dist > 0.001 ? delta / dist : vec2(1.0, 0.0);
      float dispPx = 0.85 + pow(clamp(normDist, 0.0001, 1.0), 2.1) * 1.85;
      vec2 rawDisp = dir + vec2(0.32, -0.10);
      float rawLen = length(rawDisp);
      vec2 dispVec = rawLen > 0.001 ? rawDisp / rawLen : vec2(1.0, 0.0);
      vec2 dispUv = (dispVec * dispPx) / uResolution;

      vec4 jpR = sampleMaskedJapanese(jpUv + dispUv);
      vec4 jpG = sampleMaskedJapanese(jpUv);
      vec4 jpB = sampleMaskedJapanese(jpUv - dispUv);

      jpSample = vec4(
        mix(jpG.r, jpR.r, 0.84),
        jpG.g,
        mix(jpG.b, jpB.b, 0.84),
        max(jpG.a, max(jpR.a, jpB.a) * 0.74)
      );
    }

    // Cross-mask English out and musical symbols in
    vec3 textRgb = mix(enSample.rgb, jpSample.rgb, lensMask);
    float textAlpha = mix(enSample.a, jpSample.a, lensMask);

    // Subtle directional specular crescents & slight chromatic dispersion on glass border (no flat uniform outline)
    float glassAlpha = 0.0;
    vec3 glassRgb = vec3(1.0);

    if (lensEnabled > 0.5 && normDist < 1.025) {
      vec2 dir = dist > 0.001 ? delta / dist : vec2(0.0, 1.0);

      float upperLeftBias = clamp(dot(dir, normalize(vec2(-0.68, 0.73))), 0.0, 1.0);
      float arcPrimary = pow(upperLeftBias, 2.3);
      float rimBandPrimary = smoothstep(0.89, 0.985, normDist) * (1.0 - smoothstep(0.992, 1.012, normDist));

      float lowerRightBias = clamp(dot(dir, normalize(vec2(0.65, -0.76))), 0.0, 1.0);
      float arcSecondary = pow(lowerRightBias, 2.6);
      float rimBandSecondary = smoothstep(0.92, 0.99, normDist) * (1.0 - smoothstep(0.995, 1.012, normDist));

      float edgeAngle = atan(dir.y, dir.x);
      vec3 prismTint = vec3(
        0.88 + 0.12 * sin(edgeAngle * 2.0 + 0.4),
        0.93 + 0.07 * sin(edgeAngle * 2.0 + 2.4),
        1.0
      );
      float prismRim = smoothstep(0.955, 0.990, normDist) * (1.0 - smoothstep(0.994, 1.010, normDist));

      float specIntensity =
        arcPrimary * rimBandPrimary * 0.46 +
        arcSecondary * rimBandSecondary * 0.22 +
        prismRim * (0.04 + 0.14 * max(arcPrimary, arcSecondary));

      glassRgb = mix(
        prismTint,
        vec3(1.0, 1.0, 1.0),
        arcPrimary * 0.65
      );
      glassAlpha = clamp(specIntensity, 0.0, 0.56);
    }

    // Composite specular crescents cleanly over the cross-masked typography
    float outAlpha = clamp(textAlpha + glassAlpha * (1.0 - textAlpha * 0.35), 0.0, 1.0);
    vec3 outRgb = mix(glassRgb, textRgb, clamp(textAlpha / max(outAlpha, 0.001), 0.0, 1.0));
    outRgb = clamp(outRgb + glassRgb * glassAlpha * 0.22, 0.0, 1.0);

    gl_FragColor = vec4(outRgb, outAlpha);
  }
`;
