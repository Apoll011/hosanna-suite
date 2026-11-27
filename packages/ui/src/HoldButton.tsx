import { Check, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type PointerEvent } from "react";

export type HoldButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  holdDuration?: number;
  holdingLabel?: string;
  completeLabel?: string;
  onHoldComplete: () => void;
};

export function HoldButton({
  holdDuration = 900,
  holdingLabel = "Keep holding",
  completeLabel = "Confirmed",
  onHoldComplete,
  disabled,
  children = "Hold to confirm",
  className = "",
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onKeyDown,
  onKeyUp,
  onBlur,
  ...props
}: HoldButtonProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "holding" | "complete">("idle");
  const start = useRef(0);
  const frame = useRef<number>(0);
  const progressRef = useRef(0);
  const phaseRef = useRef(phase);
  const cancel = () => {
    cancelAnimationFrame(frame.current);
    if (phaseRef.current !== "holding") return;
    phaseRef.current = "idle";
    setPhase("idle");
    const from = progressRef.current;
    const duration = Math.max(90, from * 260);
    const releasedAt = performance.now();
    const drain = (now: number) => {
      const t = Math.min(1, (now - releasedAt) / duration);
      const next = from * (1 - t) ** 3;
      progressRef.current = next;
      setProgress(next);
      if (t < 1) frame.current = requestAnimationFrame(drain);
      else progressRef.current = 0;
    };
    frame.current = requestAnimationFrame(drain);
  };
  const begin = () => {
    if (disabled || phaseRef.current !== "idle") return;
    cancelAnimationFrame(frame.current);
    phaseRef.current = "holding";
    setPhase("holding");
    const initialProgress = progressRef.current;
    const remainingDuration = Math.max(1, holdDuration * (1 - initialProgress));
    start.current = performance.now();
    const tick = (now: number) => {
      const next = Math.min(1, initialProgress + (now - start.current) / remainingDuration);
      progressRef.current = next;
      setProgress(next);
      if (next >= 1) {
        phaseRef.current = "complete";
        setPhase("complete");
        onHoldComplete();
      } else frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const onDown = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(event);
    if (event.button === 0) begin();
  };
  const label =
    phase === "complete" ? completeLabel : phase === "holding" ? holdingLabel : children;
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      disabled={disabled || phase === "complete"}
      aria-disabled={phase === "complete" || undefined}
      data-holding={phase === "holding" || undefined}
      data-complete={phase === "complete" || undefined}
      className={`hosanna-hold-button ${className}`}
      onPointerDown={onDown}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        cancel();
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        cancel();
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        cancel();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        cancel();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if ((event.key === " " || event.key === "Enter") && !event.repeat) {
          event.preventDefault();
          begin();
        }
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event);
        if (event.key === " " || event.key === "Enter") cancel();
      }}
    >
      <span
        aria-hidden="true"
        className="hosanna-hold-fill"
        style={{ transform: `scaleX(${progress})` }}
      />
      <span className="hosanna-hold-label">
        {phase === "complete" ? (
          <Check size={16} />
        ) : phase === "holding" ? (
          <LoaderCircle size={16} />
        ) : null}
        {label}
      </span>
      <span className="sr-only" aria-live="polite">
        {phase === "complete" ? completeLabel : ""}
      </span>
    </button>
  );
}
