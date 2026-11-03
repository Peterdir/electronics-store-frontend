import { Component, lazy, Suspense, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { Cpu } from "lucide-react";

const HeroScene = lazy(() => import("./HeroScene"));
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(notify: () => void) {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

function prefersReducedMotion() {
  return window.matchMedia(reducedMotionQuery).matches;
}

function StaticChip() {
  return (
    <div aria-hidden="true" className="relative mx-auto grid size-44 place-items-center">
      <div className="absolute inset-2 rotate-12 rounded-3xl border border-primary/25" />
      <div className="absolute inset-5 -rotate-6 rounded-2xl border border-violet-400/35" />
      <div className="grid size-24 place-items-center rounded-2xl border border-primary/40 bg-background shadow-lg">
        <Cpu className="size-12 text-primary" strokeWidth={1.25} />
      </div>
    </div>
  );
}

class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <>
          <StaticChip />
          <p role="status" className="text-center text-xs text-muted-foreground">
            Không thể mở mô hình 3D. Đang hiển thị hình tĩnh.
          </p>
        </>
      );
    }

    return this.props.children;
  }
}

function supportsWebGL2() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;

    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function HeroShowcase() {
  const [open, setOpen] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    prefersReducedMotion,
  );

  const showScene = open && !reducedMotion && !unavailable;

  function toggleScene() {
    if (open) {
      setOpen(false);
      return;
    }

    if (!supportsWebGL2()) {
      setUnavailable(true);
      return;
    }

    setOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-3">
      {!reducedMotion && !unavailable && (
        <div className="text-center">
          <button
            type="button"
            aria-expanded={showScene}
            aria-controls="hero-showcase-content"
            onClick={toggleScene}
            className="min-h-11 rounded-xl border border-primary/40 bg-card px-4 text-sm font-medium text-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {open ? "Đóng 3D" : "Xem 3D"}
          </button>
        </div>
      )}

      <div id="hero-showcase-content">
        {showScene ? (
          <SceneBoundary>
            <Suspense fallback={<p role="status" className="grid h-56 place-items-center">Đang tải mô hình…</p>}>
              <HeroScene />
            </Suspense>
          </SceneBoundary>
        ) : (
          <StaticChip />
        )}
      </div>

      {unavailable && (
        <p role="status" className="text-center text-xs text-muted-foreground">
          Trình duyệt này đang hiển thị phiên bản tĩnh.
        </p>
      )}
    </div>
  );
}