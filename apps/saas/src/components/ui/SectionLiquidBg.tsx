import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { liquidBgVertexShader, liquidBgFragmentShader } from "@/shaders/liquidBg";
import { cn } from "@/lib/utils";

interface SectionLiquidBgProps {
  variant?: "blue" | "white";
  className?: string;
  linesAmount?: number;
}

const PRESETS = {
  blue: {
    color1: new THREE.Vector3(74 / 255, 137 / 255, 184 / 255), // #4A89B8
    color2: new THREE.Vector3(20 / 255, 184 / 255, 196 / 255), // #14B8C4
    color3: new THREE.Vector3(2 / 255, 20 / 255, 51 / 255),   // #021433
    noise: 0.075,
    clearColor: 0x021433,
  },
  white: {
    color1: new THREE.Vector3(1.0, 1.0, 1.0),                  // #FFFFFF
    color2: new THREE.Vector3(224 / 255, 242 / 255, 254 / 255),// #E0F2FE
    color3: new THREE.Vector3(186 / 255, 230 / 255, 253 / 255),// #BAE6FD
    noise: 0.025,                                              // Softened for light clarity
    clearColor: 0xffffff,
  },
};

export function SectionLiquidBg({
  variant = "white",
  className,
  linesAmount = 5.0,
}: SectionLiquidBgProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // Monitor viewport visibility to recycle WebGL contexts and avoid browser limits
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "absolute inset-0 z-0 pointer-events-none overflow-hidden",
        variant === "blue" ? "bg-[#021433]" : "bg-white",
        className,
      )}
    >
      {inView && (
        <SectionLiquidCanvas
          variant={variant}
          linesAmount={linesAmount}
          containerRef={containerRef}
        />
      )}
    </div>
  );
}

function SectionLiquidCanvas({
  variant,
  linesAmount,
  containerRef,
}: {
  variant: "blue" | "white";
  linesAmount: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let disposed = false;
    let animId = 0;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const rect = container.getBoundingClientRect();
    const width = Math.max(10, rect.width || window.innerWidth || 1024);
    const height = Math.max(10, rect.height || 600);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const preset = PRESETS[variant] || PRESETS.white;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: false,
        powerPreference: "low-power",
        precision: "mediump",
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    renderer.setClearColor(preset.clearColor, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const getLinesAmount = (w: number) => (w >= 768 ? linesAmount : linesAmount * 2.2);
    const getBackgroundScale = (w: number) => (w >= 768 ? 1.0 : w * 0.001 * 1.45);

    const bgUniforms = {
      uTime: { value: 0 },
      uColor1: { value: preset.color1 },
      uColor2: { value: preset.color2 },
      uColor3: { value: preset.color3 },
      uColorAccent: { value: new THREE.Color(0, 0, 0) },
      uLinesBlur: { value: 0.25 },
      uNoise: { value: preset.noise },
      uOffsetX: { value: 0.34 },
      uOffsetY: { value: 0.0 },
      uLinesAmount: { value: getLinesAmount(width) },
      uPlaneRes: { value: new THREE.Vector2(width * 1.001, height * 1.001) },
      uMouse2D: { value: new THREE.Vector2(0.0, 0.0) },
      uBackgroundScale: { value: getBackgroundScale(width) },
    };

    const geometry = new THREE.PlaneGeometry(2, 2, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: bgUniforms,
      vertexShader: liquidBgVertexShader,
      fragmentShader: liquidBgFragmentShader,
      side: THREE.FrontSide,
      depthWrite: false,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resizeObserver = new ResizeObserver((entries) => {
      if (disposed || !entries[0]) return;
      const { width: newW, height: newH } = entries[0].contentRect;
      if (newW <= 0 || newH <= 0 || !renderer) return;
      renderer.setSize(newW, newH);
      bgUniforms.uPlaneRes.value.set(newW * 1.001, newH * 1.001);
      bgUniforms.uLinesAmount.value = getLinesAmount(newW);
      bgUniforms.uBackgroundScale.value = getBackgroundScale(newW);
    });
    resizeObserver.observe(container);

    const clock = new THREE.Clock();

    const renderLoop = () => {
      if (disposed || !renderer) return;
      const elapsed = clock.getElapsedTime();

      // Autonomous incommensurate sine/cosine drift bounded within [-0.55, 0.55]
      const driftRate = prefersReducedMotion ? 0.03 : 0.2;
      const t = elapsed * driftRate;
      const mx = Math.sin(t * 0.77) * 0.32 + Math.cos(t * 0.43) * 0.22;
      const my = Math.cos(t * 0.63) * 0.31 + Math.sin(t * 0.37) * 0.21;

      bgUniforms.uMouse2D.value.set(mx, my);
      bgUniforms.uTime.value = prefersReducedMotion ? elapsed * 0.1 : elapsed;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();

      geometry.dispose();
      material.dispose();

      if (renderer) {
        const gl = renderer.getContext();
        try {
          gl?.getExtension("WEBGL_lose_context")?.loseContext();
        } catch {}
        renderer.dispose();
        renderer = null;
      }
    };
  }, [variant, linesAmount, containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block animate-in fade-in duration-500 pointer-events-none"
    />
  );
}

export default SectionLiquidBg;
