import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';

/**
 * The atmosphere: layered aurora light, a fine architectural grid, drifting
 * dust and film grain. Everything is GPU-friendly (transform/opacity only)
 * and honours `prefers-reduced-motion`.
 */
export default function Background({ intensity = 1 }: { intensity?: number }) {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothed = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 0.6 });
  const hueShift = useTransform(smoothed, [0, 1], [0, 46]);
  const drift = useTransform(smoothed, [0, 1], [0, -140]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Subtle parallax response to the pointer (desktop only).
  useEffect(() => {
    if (reduceMotion || window.matchMedia('(hover: none)').matches) return;
    const node = containerRef.current;
    if (!node) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - 0.5) * 26;
        const y = (event.clientY / window.innerHeight - 0.5) * 22;
        node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, [reduceMotion]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[hsl(var(--ink))]">
      {/* base wash */}
      <motion.div
        className="absolute inset-0"
        style={{ filter: `hue-rotate(${hueShift}deg)` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,hsl(258_90%_18%/.55),transparent_60%),radial-gradient(90%_70%_at_100%_0%,hsl(189_94%_20%/.35),transparent_55%),radial-gradient(80%_60%_at_0%_100%,hsl(42_96%_18%/.22),transparent_60%)]" />
      </motion.div>

      <motion.div ref={containerRef} style={{ y: drift }} className="absolute inset-0">
        <div
          className="aurora animate-drift"
          style={{
            width: '52vw',
            height: '52vw',
            top: '-14vw',
            left: '-8vw',
            background: 'radial-gradient(circle at 40% 40%, hsl(258 90% 62% / 0.85), transparent 68%)',
            opacity: 0.5 * intensity,
          }}
        />
        <div
          className="aurora animate-drift-reverse"
          style={{
            width: '46vw',
            height: '46vw',
            top: '18vh',
            right: '-12vw',
            background: 'radial-gradient(circle at 60% 40%, hsl(189 94% 55% / 0.7), transparent 68%)',
            opacity: 0.42 * intensity,
          }}
        />
        <div
          className="aurora animate-drift"
          style={{
            width: '38vw',
            height: '38vw',
            bottom: '-10vh',
            left: '22vw',
            background: 'radial-gradient(circle at 50% 50%, hsl(330 90% 62% / 0.55), transparent 70%)',
            opacity: 0.3 * intensity,
            animationDuration: '38s',
          }}
        />
      </motion.div>

      {/* architectural grid */}
      <div className="absolute inset-0 grid-overlay opacity-[0.55]" />

      {/* horizon line */}
      <div className="absolute left-0 right-0 top-[62%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_50%,transparent_42%,hsl(240_30%_2%/.78)_100%)]" />

      {/* film grain */}
      <div className="noise absolute inset-0" />
    </div>
  );
}
