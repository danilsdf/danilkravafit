"use client";

import { useEffect, useRef, useState } from "react";

interface HeroDividerProps {
  /** x position of the diagonal at the top edge, as a fraction (e.g. 0.53) */
  topX?: number;
  /** x position of the diagonal at the bottom edge, as a fraction (e.g. 0.47) */
  bottomX?: number;
  color?: string;
  thickness?: number;
}

export default function HeroDivider({
  topX = 0.53,
  bottomX = 0.47,
  color = "#d6a936",
  thickness = 3,
}: HeroDividerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState(0);
  const midX = ((topX + bottomX) / 2) * 100;

  useEffect(() => {
    function compute() {
      const container = ref.current?.parentElement;
      if (!container) return;
      const { width, height } = container.getBoundingClientRect();
      if (!height) return;
      const dx = Math.abs(topX - bottomX) * width;
      const deg = (Math.atan2(dx, height) * 180) / Math.PI;
      // topX > bottomX means the line leans left going down → negative rotation
      setAngle(topX > bottomX ? -deg : deg);
    }

    compute();
    const ro = new ResizeObserver(compute);
    const container = ref.current?.parentElement;
    if (container) ro.observe(container);
    return () => ro.disconnect();
  }, [topX, bottomX]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute -top-[10%] z-20 hidden h-[120%] lg:block"
      style={{
        left: `${midX}%`,
        width: `${thickness}px`,
        background: color,
        transform: `translateX(-50%) rotate(${angle}deg)`,
      }}
    />
  );
}
