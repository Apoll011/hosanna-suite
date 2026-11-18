import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { useCursor } from "../../hooks/useCursor";
import { liquidBgVertexShader, liquidBgFragmentShader } from "../../shaders/liquidBg";
import { lensTextVertexShader, lensTextFragmentShader } from "../../shaders/lensText";

export type HeadlineLines = [string, string, string];

interface WebGLCanvasProps {
  headlineLines?: HeadlineLines;
  showTextLayer?: boolean;
  onFontsReady?: () => void;
  impulseTriggerRef?: React.MutableRefObject<
    ((targetUv?: { x: number; y: number }) => void) | null
  >;
}

const MUSICAL_SYMBOLS = ["𝅝", "𝅗𝅥", "♩", "♪", "𝅘𝅥𝅯", "𝅘𝅥𝅰", "𝅘𝅥𝅱", "♫", "♬"] as const;
type MusicalSymbol = (typeof MUSICAL_SYMBOLS)[number];

function generateRandomSymbolLines(): [MusicalSymbol[], MusicalSymbol[], MusicalSymbol[]] {
  const pickRow = (count: number): MusicalSymbol[] => {
    const row: MusicalSymbol[] = [];
    for (let i = 0; i < count; i++) {
      let sym = MUSICAL_SYMBOLS[Math.floor(Math.random() * MUSICAL_SYMBOLS.length)];
      if (i > 0 && sym === row[i - 1]) {
        sym = MUSICAL_SYMBOLS[(MUSICAL_SYMBOLS.indexOf(sym) + 3) % MUSICAL_SYMBOLS.length];
      }
      row.push(sym);
    }
    return row;
  };
  return [pickRow(8), pickRow(4), pickRow(6)];
}

const detectSoftwareWebGL = (): boolean => {
  try {
    const probeCanvas = document.createElement("canvas");
    const gl = probeCanvas.getContext("webgl2") || probeCanvas.getContext("webgl");
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
};

function measureTrackedTextWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  trackingPx: number,
): number {
  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  return widths.reduce((sum, w) => sum + w, 0) + trackingPx * Math.max(0, chars.length - 1);
}

function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  trackingPx: number,
  align: "left" | "right",
): number {
  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalWidth =
    widths.reduce((sum, w) => sum + w, 0) + trackingPx * Math.max(0, chars.length - 1);

  let cursorX = align === "right" ? x - totalWidth : x;
  ctx.textAlign = "left";
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cursorX, y);
    cursorX += widths[i] + trackingPx;
  }
  return totalWidth;
}

// Vector fallback in case any browser/OS lacks an SMP Unicode Musical Symbols glyph
function drawVectorMusicalNote(
  ctx: CanvasRenderingContext2D,
  sym: MusicalSymbol,
  cx: number,
  cy: number,
  size: number,
) {
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const rx = size * 0.145;
  const ry = size * 0.105;
  const stemH = size * 0.56;
  const lw = Math.max(1.8, size * 0.055);
  ctx.lineWidth = lw;

  const drawHead = (x: number, y: number, hollow: boolean) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.32);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    if (hollow) {
      ctx.lineWidth = Math.max(2, size * 0.065);
      ctx.stroke();
    } else {
      ctx.fill();
    }
    ctx.restore();
  };

  const drawFlags = (xTop: number, yTop: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const fy = yTop + i * size * 0.11;
      ctx.beginPath();
      ctx.moveTo(xTop, fy);
      ctx.bezierCurveTo(
        xTop + size * 0.22,
        fy + size * 0.06,
        xTop + size * 0.24,
        fy + size * 0.24,
        xTop + size * 0.11,
        fy + size * 0.34,
      );
      ctx.stroke();
    }
  };

  if (sym === "𝅝") {
    drawHead(cx, cy + size * 0.12, true);
  } else if (sym === "𝅗𝅥") {
    const hx = cx - rx * 0.3;
    const hy = cy + size * 0.22;
    drawHead(hx, hy, true);
    ctx.beginPath();
    ctx.moveTo(hx + rx * 0.85, hy);
    ctx.lineTo(hx + rx * 0.85, hy - stemH);
    ctx.stroke();
  } else if (sym === "♩") {
    const hx = cx - rx * 0.3;
    const hy = cy + size * 0.22;
    drawHead(hx, hy, false);
    ctx.beginPath();
    ctx.moveTo(hx + rx * 0.85, hy);
    ctx.lineTo(hx + rx * 0.85, hy - stemH);
    ctx.stroke();
  } else if (sym === "♪" || sym === "𝅘𝅥𝅯" || sym === "𝅘𝅥𝅰" || sym === "𝅘𝅥𝅱") {
    const flagCount = sym === "♪" ? 1 : sym === "𝅘𝅥𝅯" ? 2 : sym === "𝅘𝅥𝅰" ? 3 : 4;
    const hx = cx - rx * 0.5;
    const hy = cy + size * 0.22;
    const sx = hx + rx * 0.85;
    drawHead(hx, hy, false);
    ctx.beginPath();
    ctx.moveTo(sx, hy);
    ctx.lineTo(sx, hy - stemH);
    ctx.stroke();
    drawFlags(sx, hy - stemH, flagCount);
  } else {
    // Beamed eighth (♫) or sixteenth (♬)
    const beamCount = sym === "♬" ? 2 : 1;
    const leftX = cx - size * 0.18;
    const rightX = cx + size * 0.16;
    const leftY = cy + size * 0.24;
    const rightY = cy + size * 0.19;
    drawHead(leftX, leftY, false);
    drawHead(rightX, rightY, false);
    const s1x = leftX + rx * 0.82;
    const s2x = rightX + rx * 0.82;
    const top1 = leftY - stemH;
    const top2 = rightY - stemH;
    ctx.beginPath();
    ctx.moveTo(s1x, leftY);
    ctx.lineTo(s1x, top1);
    ctx.moveTo(s2x, rightY);
    ctx.lineTo(s2x, top2);
    ctx.stroke();
    for (let b = 0; b < beamCount; b++) {
      const off = b * size * 0.105;
      ctx.beginPath();
      ctx.lineWidth = Math.max(3, size * 0.085);
      ctx.moveTo(s1x - lw * 0.3, top1 + off);
      ctx.lineTo(s2x + lw * 0.3, top2 + off);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function isGlyphRenderable(fontSpec: string, sym: string): boolean {
  const probe = document.createElement("canvas");
  probe.width = 48;
  probe.height = 48;
  const pCtx = probe.getContext("2d");
  if (!pCtx) return false;
  pCtx.font = fontSpec;
  const wSym = pCtx.measureText(sym).width;
  const wNotdef = pCtx.measureText("\uFFFD").width;
  const wTofu = pCtx.measureText("\u25A1").width;
  if (wSym <= 0) return false;
  // Detect fallback .notdef boxes via pixel fingerprint comparison against tofu
  pCtx.clearRect(0, 0, 48, 48);
  pCtx.fillStyle = "#FFFFFF";
  pCtx.textBaseline = "middle";
  pCtx.fillText(sym, 8, 24);
  const symData = pCtx.getImageData(0, 0, 48, 48).data;

  pCtx.clearRect(0, 0, 48, 48);
  pCtx.fillText("\u25A1", 8, 24);
  const tofuData = pCtx.getImageData(0, 0, 48, 48).data;

  let diff = 0;
  let ink = 0;
  for (let i = 3; i < symData.length; i += 4) {
    if (symData[i] > 10) ink++;
    if (Math.abs(symData[i] - tofuData[i]) > 16) diff++;
  }
  if (ink < 8) return false;
  if (Math.abs(wSym - wTofu) < 0.5 && diff < 12) return false;
  if (Math.abs(wSym - wNotdef) < 0.5 && diff < 12) {
    pCtx.clearRect(0, 0, 48, 48);
    pCtx.fillText("\uFFFD", 8, 24);
    const notdefData = pCtx.getImageData(0, 0, 48, 48).data;
    let diff2 = 0;
    for (let i = 3; i < symData.length; i += 4) {
      if (Math.abs(symData[i] - notdefData[i]) > 16) diff2++;
    }
    if (diff2 < 12) return false;
  }
  return true;
}

function drawSymbolRow(
  ctx: CanvasRenderingContext2D,
  symbols: MusicalSymbol[],
  startX: number,
  endX: number,
  y: number,
  fontSize: number,
  fontSpec: string,
  renderableMap: Map<string, boolean>,
) {
  ctx.font = fontSpec;
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  const count = symbols.length;
  const span = Math.max(fontSize, endX - startX);
  const step = count > 1 ? span / (count - 0.35) : 0;
  const padStart = startX + fontSize * 0.25;

  for (let i = 0; i < count; i++) {
    const sym = symbols[i];
    const cx = count === 1 ? (startX + endX) * 0.5 : padStart + i * step;
    if (renderableMap.get(sym)) {
      ctx.fillText(sym, cx, y);
    } else {
      drawVectorMusicalNote(ctx, sym, cx, y, fontSize);
    }
  }
}

interface PaintedHeadlineResult {
  enCanvas: HTMLCanvasElement;
  jpCanvas: HTMLCanvasElement;
  lineBounds: THREE.Vector4;
}

function getHeadlineFontFamily(): string {
  return '"Fraunces", Georgia, serif';
}

interface TextSegment {
  text: string;
  italic?: boolean;
}

function splitHeadlineSegments(line: string, isLine3: boolean): TextSegment[] {
  if (!isLine3) {
    return [{ text: line, italic: false }];
  }
  const lastSpaceIdx = line.lastIndexOf(" ");
  if (lastSpaceIdx === -1) {
    return [{ text: line, italic: true }];
  }
  const prefix = line.slice(0, lastSpaceIdx + 1);
  const lastWord = line.slice(lastSpaceIdx + 1);
  return [
    { text: prefix, italic: false },
    { text: lastWord, italic: true },
  ];
}

function measureSegmentsWidth(
  ctx: CanvasRenderingContext2D,
  segments: TextSegment[],
  fontSize: number,
  fontFamily: string,
  trackingPx: number,
): number {
  let total = 0;
  for (const seg of segments) {
    ctx.font = `${seg.italic ? "italic 400" : "400"} ${fontSize}px ${fontFamily}`;
    const chars = Array.from(seg.text);
    const widths = chars.map((ch) => ctx.measureText(ch).width);
    total += widths.reduce((sum, w) => sum + w, 0) + trackingPx * chars.length;
  }
  return total - trackingPx;
}

function drawSegments(
  ctx: CanvasRenderingContext2D,
  segments: TextSegment[],
  startX: number,
  y: number,
  fontSize: number,
  fontFamily: string,
  trackingPx: number,
): number {
  let cursorX = startX;
  ctx.textAlign = "left";
  for (const seg of segments) {
    ctx.font = `${seg.italic ? "italic 400" : "400"} ${fontSize}px ${fontFamily}`;
    const chars = Array.from(seg.text);
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], cursorX, y);
      cursorX += ctx.measureText(chars[i]).width + trackingPx;
    }
  }
  return cursorX - startX - trackingPx;
}

function paintHeadlineCanvases(
  width: number,
  height: number,
  dpr: number,
  headlineLines: HeadlineLines,
  symbolLines: [MusicalSymbol[], MusicalSymbol[], MusicalSymbol[]],
  headlineFontFamily = getHeadlineFontFamily(),
): PaintedHeadlineResult {
  const cw = Math.max(1, Math.round(width * dpr));
  const ch = Math.max(1, Math.round(height * dpr));

  const enCanvas = document.createElement("canvas");
  enCanvas.width = cw;
  enCanvas.height = ch;
  const enCtx = enCanvas.getContext("2d")!;

  const jpCanvas = document.createElement("canvas");
  jpCanvas.width = cw;
  jpCanvas.height = ch;
  const jpCtx = jpCanvas.getContext("2d")!;

  enCtx.scale(dpr, dpr);
  jpCtx.scale(dpr, dpr);
  enCtx.clearRect(0, 0, width, height);
  jpCtx.clearRect(0, 0, width, height);

  const isDesktop = width >= 768;
  const padX = isDesktop ? 36 : 22;
  const fontSize = Math.min(98, Math.max(isDesktop ? 34 : 32, width * 0.061));
  const lineHeight = fontSize * 1.08;
  const trackingPx = -0.03 * fontSize;
  const symFontSize = fontSize * 0.86;

  const centerY = height * 0.435;
  const y1 = centerY - lineHeight;
  const y2 = centerY;
  const y3 = centerY + lineHeight;

  const segments1 = splitHeadlineSegments(headlineLines[0], false);
  const segments2 = splitHeadlineSegments(headlineLines[1], false);
  const segments3 = splitHeadlineSegments(headlineLines[2], true);

  enCtx.fillStyle = "#FFFFFF";
  enCtx.textBaseline = "middle";

  const w1 = measureSegmentsWidth(
    enCtx,
    segments1,
    fontSize,
    headlineFontFamily,
    trackingPx,
  );
  const w2 = measureSegmentsWidth(
    enCtx,
    segments2,
    fontSize,
    headlineFontFamily,
    trackingPx,
  );
  const w3 = measureSegmentsWidth(
    enCtx,
    segments3,
    fontSize,
    headlineFontFamily,
    trackingPx,
  );

  // Relative offsets for the abstract right-stepped staircase disposition
  const relStart1 = 0;
  const relStart3 = Math.max(fontSize * 0.55, Math.max(w1, w2, w3) * 0.14);
  const relStart2 = isDesktop
    ? Math.max(relStart3 + fontSize * 0.65, Math.max(relStart3 + fontSize * 0.45, (Math.max(w1, w3) - w2) * 0.85))
    : relStart3 + Math.max(fontSize * 0.45, (w1 - w2) * 0.5);

  const minX = Math.min(relStart1, relStart2, relStart3);
  const maxX = Math.max(relStart1 + w1, relStart2 + w2, relStart3 + w3);
  const totalWidth = maxX - minX;

  const maxAvail = width - padX * 2;
  const scale = totalWidth > maxAvail && maxAvail > 0 ? maxAvail / totalWidth : 1;

  const effectiveTotalWidth = totalWidth * scale;
  const originX = (width - effectiveTotalWidth) * 0.5 - minX * scale;

  const startX1 = originX + relStart1 * scale;
  const startX2 = originX + relStart2 * scale;
  const startX3 = originX + relStart3 * scale;

  const line1Width = drawSegments(
    enCtx,
    segments1,
    startX1,
    y1,
    fontSize,
    headlineFontFamily,
    trackingPx,
  );
  const line2Width = drawSegments(
    enCtx,
    segments2,
    startX2,
    y2,
    fontSize,
    headlineFontFamily,
    trackingPx,
  );
  const line3Width = drawSegments(
    enCtx,
    segments3,
    startX3,
    y3,
    fontSize,
    headlineFontFamily,
    trackingPx,
  );

  // Paint randomized musical notation behind the glass lens matching each line's exact spatial footprint
  const symFontSpec = `400 ${symFontSize}px "Noto Music", "Noto Sans Symbols 2", "Apple Symbols", "Segoe UI Symbol", sans-serif`;
  const renderableMap = new Map<string, boolean>();
  for (const sym of MUSICAL_SYMBOLS) {
    renderableMap.set(sym, isGlyphRenderable(symFontSpec, sym));
  }

  drawSymbolRow(
    jpCtx,
    symbolLines[0],
    startX1,
    startX1 + line1Width,
    y1,
    symFontSize,
    symFontSpec,
    renderableMap,
  );
  drawSymbolRow(
    jpCtx,
    symbolLines[1],
    startX2,
    startX2 + line2Width,
    y2,
    symFontSize,
    symFontSpec,
    renderableMap,
  );
  drawSymbolRow(
    jpCtx,
    symbolLines[2],
    startX3,
    startX3 + line3Width,
    y3,
    symFontSize,
    symFontSpec,
    renderableMap,
  );

  // Compute WebGL UV Y-boundaries (0 = bottom, 1 = top)
  const top1 = y1 - lineHeight * 0.56;
  const mid12 = (y1 + y2) * 0.5;
  const mid23 = (y2 + y3) * 0.5;
  const bot3 = y3 + lineHeight * 0.56;

  const lineBounds = new THREE.Vector4(
    1.0 - top1 / height,
    1.0 - mid12 / height,
    1.0 - mid23 / height,
    1.0 - bot3 / height,
  );

  return { enCanvas, jpCanvas, lineBounds };
}

const DEFAULT_HEADLINE: HeadlineLines = ["We bring clarity", "to every", "worship set"];

export default function WebGLCanvas({
  headlineLines = DEFAULT_HEADLINE,
  showTextLayer = true,
  onFontsReady,
  impulseTriggerRef,
}: WebGLCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const { stepLerp, setTargetUV, targetRef } = useCursor();
  const lensCurrentRef = useRef({ x: 0.5, y: 0.465 });
  const onFontsReadyRef = useRef(onFontsReady);
  onFontsReadyRef.current = onFontsReady;

  const headlineLinesRef = useRef<HeadlineLines>(headlineLines);
  headlineLinesRef.current = headlineLines;

  const symbolLinesRef = useRef<[MusicalSymbol[], MusicalSymbol[], MusicalSymbol[]] | null>(null);
  if (!symbolLinesRef.current) {
    symbolLinesRef.current = generateRandomSymbolLines();
  }

  const rebuildTexturesRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    rebuildTexturesRef.current?.();
  }, [headlineLines]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;
    let frameId = 0;

    const isSoftwareGl = detectSoftwareWebGL();
    const dpr = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const getViewportSize = () => ({
      width: window.innerWidth || 1440,
      height: window.innerHeight || 900,
    });

    const isMobileOrTablet = (w: number) =>
      w < 1024 ||
      (typeof window !== "undefined" &&
        window.matchMedia("(hover: none) and (pointer: coarse)").matches);

    const getLensRadiusPx = (w: number) => (isMobileOrTablet(w) ? 0 : 92);

    const { width: initW, height: initH } = getViewportSize();
    let currentViewportWidth = initW;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(dpr);
    renderer.setSize(initW, initH);
    renderer.setClearColor(0x021433, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 2;

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    const emptyCanvas = document.createElement("canvas");
    emptyCanvas.width = 4;
    emptyCanvas.height = 4;
    let enTexture = new THREE.CanvasTexture(emptyCanvas);
    let jpTexture = new THREE.CanvasTexture(emptyCanvas);

    const configureTextTexture = (canvas: HTMLCanvasElement): THREE.CanvasTexture => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.anisotropy = maxAnisotropy;
      tex.needsUpdate = true;
      return tex;
    };

    const impulseState = { value: 0 };

    const TABLET_BREAKPOINT = 767;
    const BASE_LINES_AMOUNT = 5.0;
    const getLinesAmount = (w: number) =>
      w >= TABLET_BREAKPOINT ? BASE_LINES_AMOUNT : BASE_LINES_AMOUNT * 3.8;
    const getBackgroundScale = (w: number) => (w >= TABLET_BREAKPOINT ? 1.0 : w * 0.001 * 1.45);

    const heroColor1 = new THREE.Vector3(74 / 255, 137 / 255, 184 / 255); // #4A89B8
    const heroColor2 = new THREE.Vector3(20 / 255, 184 / 255, 196 / 255); // #14B8C4
    const heroColor3 = new THREE.Vector3(2 / 255, 20 / 255, 51 / 255);   // #021433
    const heroNoise = 0.075;

    document.documentElement.dataset.canvasTheme = "blue";

    const bgUniforms = {
      uTime: { value: 0 },
      uColor1: { value: heroColor1 },
      uColor2: { value: heroColor2 },
      uColor3: { value: heroColor3 },
      uColorAccent: { value: new THREE.Color(0.0, 0.0, 0.0) },
      uLinesBlur: { value: 0.25 },
      uNoise: { value: heroNoise },
      uLightBias: { value: 0.0 },
      uOffsetX: { value: 0.34 },
      uOffsetY: { value: 0.0 },
      uLinesAmount: { value: getLinesAmount(initW) },
      uPlaneRes: { value: new THREE.Vector2(initW * 1.001, initH * 1.001) },
      uMouse2D: { value: new THREE.Vector2(0.0, -0.07) },
      uBackgroundScale: { value: getBackgroundScale(initW) },
    };

    const bgGeometry = new THREE.PlaneGeometry(2, 2, 32, 32);
    const bgMaterial = new THREE.ShaderMaterial({
      uniforms: bgUniforms,
      vertexShader: liquidBgVertexShader,
      fragmentShader: liquidBgFragmentShader,
      side: THREE.FrontSide,
      depthWrite: false,
      depthTest: false,
    });
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    bgMesh.position.z = 0;
    bgMesh.renderOrder = -1;
    scene.add(bgMesh);

    const textUniforms = {
      uEnglishTex: { value: enTexture },
      uJapaneseTex: { value: jpTexture },
      uResolution: { value: new THREE.Vector2(initW, initH) },
      uMouse: { value: new THREE.Vector2(0.5, 0.465) },
      uVelocity: { value: new THREE.Vector2(0, 0) },
      uLensRadiusPx: { value: getLensRadiusPx(initW) },
      uTime: { value: 0 },
      uLineProgress: { value: new THREE.Vector3(1, 1, 1) },
      uLineBounds: { value: new THREE.Vector4(0.65, 0.55, 0.45, 0.35) },
      uImpulse: { value: 0 },
      uScrollProgress: { value: 0 },
      uReducedMotion: { value: prefersReducedMotion ? 1 : 0 },
    };

    const textGeometry = new THREE.PlaneGeometry(2, 2, 64, 48);
    const textMaterial = new THREE.ShaderMaterial({
      uniforms: textUniforms,
      vertexShader: lensTextVertexShader,
      fragmentShader: lensTextFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.z = 0.2;
    if (showTextLayer) {
      scene.add(textMesh);
    }

    const rebuildTextTextures = () => {
      if (disposed || !symbolLinesRef.current) return;
      const { width, height } = getViewportSize();
      const { enCanvas, jpCanvas, lineBounds } = paintHeadlineCanvases(
        width,
        height,
        dpr,
        headlineLinesRef.current,
        symbolLinesRef.current,
      );

      const nextEn = configureTextTexture(enCanvas);
      const nextJp = configureTextTexture(jpCanvas);

      enTexture.dispose();
      jpTexture.dispose();
      enTexture = nextEn;
      jpTexture = nextJp;

      textUniforms.uEnglishTex.value = enTexture;
      textUniforms.uJapaneseTex.value = jpTexture;
      textUniforms.uLineBounds.value.copy(lineBounds);
    };

    rebuildTexturesRef.current = rebuildTextTextures;

    const handleResize = () => {
      if (disposed) return;
      const { width, height } = getViewportSize();
      currentViewportWidth = width;
      renderer.setSize(width, height);

      bgUniforms.uPlaneRes.value.set(width * 1.001, height * 1.001);
      bgUniforms.uLinesAmount.value = getLinesAmount(width);
      bgUniforms.uBackgroundScale.value = getBackgroundScale(width);

      textUniforms.uResolution.value.set(width, height);
      textUniforms.uLensRadiusPx.value = getLensRadiusPx(width);

      rebuildTextTextures();
    };

    window.addEventListener("resize", handleResize);

    if (impulseTriggerRef) {
      impulseTriggerRef.current = (targetUv) => {
        if (targetUv) {
          setTargetUV(targetUv.x, targetUv.y);
        }
        gsap.killTweensOf(impulseState);
        impulseState.value = 1.0;
        gsap.to(impulseState, {
          value: 0,
          duration: 1.4,
          ease: "power3.out",
        });
      };
    }

    const startEntrance = () => {
      if (disposed) return;
      rebuildTextTextures();
      textUniforms.uLineProgress.value.set(1, 1, 1);
      onFontsReadyRef.current?.();
    };

    Promise.all([
      document.fonts.ready,
      document.fonts.load('400 72px "Fraunces"').catch(() => []),
      document.fonts.load('italic 400 72px "Fraunces"').catch(() => []),
      document.fonts.load('400 64px "Noto Music"').catch(() => []),
    ]).then(() => {
      startEntrance();
    });

    const clock = new THREE.Clock();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === "function") {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    };

    let smoothedScroll = 0;

    const tick = () => {
      if (disposed) return;
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      const scrollTarget = Math.min(
        1.0,
        Math.max(0.0, (window.scrollY || 0) / (Math.max(window.innerHeight, 400) * 0.55)),
      );
      smoothedScroll += (scrollTarget - smoothedScroll) * Math.min(1.0, delta * 12.0);
      textUniforms.uScrollProgress.value = smoothedScroll;

      // Lens radius smoothly collapses to 0 after scrolling away from the hero
      const heroVisibility = Math.max(0.0, 1.0 - smoothedScroll * 1.2);
      const baseLensRadius = getLensRadiusPx(currentViewportWidth);
      textUniforms.uLensRadiusPx.value = baseLensRadius * heroVisibility;

      const isAutonomousMode = isMobileOrTablet(currentViewportWidth);

      bgUniforms.uTime.value = prefersReducedMotion ? elapsed * 0.15 : elapsed;

      if (isAutonomousMode) {
        // Mobile & tablet: autonomous, infinite, smooth and controlled background drift
        const driftRate = prefersReducedMotion ? 0.04 : 0.24;
        const t = elapsed * driftRate;
        const autoX = Math.sin(t) * 0.44 + Math.sin(t * 0.618 + 1.15) * 0.18;
        const autoY = Math.cos(t * 0.785 + 0.45) * 0.38 + Math.sin(t * 0.43 + 2.25) * 0.16;
        bgUniforms.uMouse2D.value.set(autoX, autoY);

        textUniforms.uTime.value = elapsed;
        textUniforms.uMouse.value.set(0.5, 0.435);
        textUniforms.uVelocity.value.set(0, 0);
        textUniforms.uImpulse.value = 0;
      } else {
        // Desktop: 0.07 * 1.2 = 0.084 ease for mouse2D cursor smoothing + full optical lens
        const cursor = stepLerp(0.084, delta);
        bgUniforms.uMouse2D.value.set(cursor.x * 2.0 - 1.0, cursor.y * 2.0 - 1.0);

        const lensFactor = 1.0 - Math.pow(1.0 - 0.38, Math.min(Math.max(delta, 0.001), 0.05) * 60.0);
        lensCurrentRef.current.x += (targetRef.current.x - lensCurrentRef.current.x) * lensFactor;
        lensCurrentRef.current.y += (targetRef.current.y - lensCurrentRef.current.y) * lensFactor;

        textUniforms.uTime.value = elapsed;
        textUniforms.uMouse.value.set(lensCurrentRef.current.x, lensCurrentRef.current.y);
        textUniforms.uVelocity.value.set(cursor.vx, cursor.vy);
        textUniforms.uImpulse.value = impulseState.value;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      tick();
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      rebuildTexturesRef.current = null;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener("resize", handleResize);
      gsap.killTweensOf(impulseState);

      if (impulseTriggerRef) {
        impulseTriggerRef.current = null;
      }

      bgGeometry.dispose();
      bgMaterial.dispose();
      textGeometry.dispose();
      textMaterial.dispose();
      enTexture.dispose();
      jpTexture.dispose();

      scene.remove(bgMesh);
      scene.remove(textMesh);
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [stepLerp, setTargetUV, impulseTriggerRef]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-0 h-full w-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
