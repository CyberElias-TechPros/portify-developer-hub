import { useEffect, useRef } from 'react';

/**
 * A soft light that trails the pointer — the "cinematic" feel on desktop.
 * Pointer-events: none, GPU transform only, disabled for touch + reduced motion.
 */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;

    let raf = 0;
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;
    let targetX = currentX;
    let targetY = currentY;

    const loop = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      node.style.transform = `translate3d(${currentX - 260}px, ${currentY - 260}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      node.style.opacity = '1';
    };
    const onLeave = () => {
      node.style.opacity = '0';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-0 h-[520px] w-[520px] opacity-0 transition-opacity duration-700"
      style={{
        background:
          'radial-gradient(circle, hsl(var(--violet) / 0.14) 0%, hsl(var(--cyan) / 0.07) 34%, transparent 62%)',
        filter: 'blur(24px)',
        mixBlendMode: 'screen',
      }}
    />
  );
}
