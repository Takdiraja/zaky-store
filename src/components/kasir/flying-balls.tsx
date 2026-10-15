"use client";

import { useEffect, useRef } from "react";
import { useFlyingBallStore } from "@/stores/use-flying-ball-store";
import { Icon } from "@/lib/icon-map";

export default function FlyingBalls() {
  const balls = useFlyingBallStore((s) => s.balls);
  if (balls.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      {balls.map((ball) => (
        <Ball key={ball.id} ball={ball} />
      ))}
    </div>
  );
}

function Ball({
  ball,
}: {
  ball: { id: number; fromX: number; fromY: number; toX: number; toY: number };
}) {
  const removeBall = useFlyingBallStore((s) => s.removeBall);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const netRef = useRef<HTMLDivElement>(null);

  const dx = ball.toX - ball.fromX;
  const dy = ball.toY - ball.fromY;
  // Arc peak: always go upward first regardless of target direction
  const peakY = Math.min(ball.fromY, ball.toY) - 60 - Math.abs(dy) * 0.15;

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    // Outer: flight path (translate) — no rotation
    const flight = outer.animate(
      [
        { transform: "translate(-50%, -50%) translate(0px, 0px)", offset: 0 },
        { transform: `translate(-50%, -50%) translate(${dx * 0.4}px, ${peakY - ball.fromY}px)`, offset: 0.3 },
        { transform: `translate(-50%, -50%) translate(${dx * 0.78}px, ${dy * 0.55}px)`, offset: 0.65 },
        { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px)`, offset: 1 },
      ],
      { duration: 500, easing: "cubic-bezier(0.22, 0.95, 0.35, 1)", fill: "forwards" }
    );

    // Inner: spin only
    const spin = inner.animate(
      [{ transform: "rotate(0deg)" }, { transform: "rotate(720deg)" }],
      { duration: 500, easing: "linear", fill: "forwards" }
    );

    // Net at ~85%
    const netTimer = setTimeout(() => {
      const net = netRef.current;
      if (net) {
        net.hidden = false;
        net.animate(
          [
            { opacity: 0, transform: "translate(-50%, -50%) scale(0.2)" },
            { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
          ],
          { duration: 220, easing: "ease-out", fill: "forwards" }
        );
      }
    }, 420);

    const removeTimer = setTimeout(() => removeBall(ball.id), 750);
    return () => {
      flight.cancel();
      spin.cancel();
      clearTimeout(netTimer);
      clearTimeout(removeTimer);
    };
  }, [ball, dx, dy, peakY, removeBall]);

  return (
    <>
      {/* Outer container — handles flight path */}
      <div
        ref={outerRef}
        className="absolute z-10 will-change-transform"
        style={{ left: ball.fromX, top: ball.fromY, transform: "translate(-50%, -50%)" }}
      >
        {/* Inner ball — handles spin */}
        <div ref={innerRef} className="will-change-transform">
          <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-orange-200/40" />
          </div>
        </div>
      </div>

      {/* Hoop net + check */}
      <div
        ref={netRef}
        hidden
        className="absolute z-10 flex-col items-center"
        style={{ left: ball.toX, top: ball.toY, transform: "translate(-50%, -50%)" }}
      >
        <div className="w-10 h-[3px] rounded-full bg-secondary border border-secondary shadow-sm" />
        <div className="flex gap-[3px] justify-center mt-[1px]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[2px] h-5 bg-secondary/40 rounded-full" />
          ))}
        </div>
        <div className="mt-1">
          <Icon name="check_circle" size={16} className="text-success-paid" />
        </div>
      </div>
    </>
  );
}
