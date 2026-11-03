import { Canvas } from "@react-three/fiber";
import { LazyMotion, domAnimation } from "motion/react";
import * as m from "motion/react-m";
import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

const pinPositions = [-0.72, -0.48, -0.24, 0, 0.24, 0.48, 0.72];

export default function HeroScene() {
  const [rotation, setRotation] = useState({ x: -0.32, y: -0.48 });
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  function rotate(dx: number, dy: number) {
    setRotation((current) => ({
      x: Math.max(-1.1, Math.min(1.1, current.x + dy)),
      y: current.y + dx,
    }));
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;

    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    lastPoint.current = { x: event.clientX, y: event.clientY };
  }

  function drag(event: PointerEvent<HTMLDivElement>) {
    const previous = lastPoint.current;
    if (!previous || !event.currentTarget.hasPointerCapture(event.pointerId)) return;

    rotate(
      (event.clientX - previous.x) * 0.012,
      (event.clientY - previous.y) * 0.012,
    );

    lastPoint.current = { x: event.clientX, y: event.clientY };
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowLeft": rotate(-0.15, 0); break;
      case "ArrowRight": rotate(0.15, 0); break;
      case "ArrowUp": rotate(0, -0.15); break;
      case "ArrowDown": rotate(0, 0.15); break;
      default: return;
    }

    event.preventDefault();
  }

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
        className="space-y-2"
      >
        <div
          role="group"
          aria-label="Mô hình chip 3D"
          aria-describedby="hero-scene-help"
          tabIndex={0}
          onPointerDown={startDrag}
          onPointerMove={drag}
          onLostPointerCapture={() => { lastPoint.current = null; }}
          onKeyDown={handleKeyDown}
          className="h-56 w-full touch-none cursor-grab rounded-2xl bg-background/60 active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Canvas
            frameloop="demand"
            dpr={[1, 1.5]}
            camera={{ position: [0, 0, 5], fov: 38 }}
          >
            <ambientLight intensity={1.4} />
            <directionalLight position={[3, 4, 5]} intensity={3} />
            <pointLight position={[-3, -2, 3]} color="#a78bfa" intensity={12} />

            <group rotation={[rotation.x, rotation.y, 0]}>
              {/* Đế chip */}
              <mesh>
                <boxGeometry args={[2, 2, 0.22]} />
                <meshStandardMaterial color="#334155" metalness={0.45} roughness={0.4} />
              </mesh>

              {/* Mặt chip nổi lên trên đế */}
              <mesh position={[0, 0, 0.17]}>
                <boxGeometry args={[1.48, 1.48, 0.16]} />
                <meshStandardMaterial color="#0e7490" metalness={0.5} roughness={0.32} />
              </mesh>

              {/* Các chân tiếp xúc ở bốn cạnh */}
              {pinPositions.map((offset) => (
                <group key={offset}>
                  {[-1, 1].map((side) => (
                    <group key={side}>
                      <mesh position={[side * 1.11, offset, 0]}>
                        <boxGeometry args={[0.24, 0.07, 0.08]} />
                        <meshStandardMaterial color="#67e8f9" />
                      </mesh>
                      <mesh position={[offset, side * 1.11, 0]}>
                        <boxGeometry args={[0.07, 0.24, 0.08]} />
                        <meshStandardMaterial color="#67e8f9" />
                      </mesh>
                    </group>
                  ))}
                </group>
              ))}
            </group>
          </Canvas>
        </div>

        <p id="hero-scene-help" className="text-center text-xs text-muted-foreground">
          Kéo để xoay, hoặc chọn mô hình bằng phím Tab rồi dùng các phím mũi tên.
        </p>
      </m.div>
    </LazyMotion>
  );
}