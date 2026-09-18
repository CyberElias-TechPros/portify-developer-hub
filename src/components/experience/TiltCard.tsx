import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * 3D tilt surface with a spotlight that tracks the pointer.
 * Falls back to a static card on touch devices / reduced motion.
 */
export default function TiltCard({
  children,
  className,
  intensity = 8,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
}) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [intensity, -intensity]), { stiffness: 200, damping: 22 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-intensity, intensity]), { stiffness: 200, damping: 22 });
  const glareX = useTransform(x, [0, 1], ['18%', '82%']);
  const glareY = useTransform(y, [0, 1], ['12%', '88%']);
  const glareBackground = useMotionTemplate`radial-gradient(420px circle at ${glareX} ${glareY}, hsl(var(--violet) / 0.16), transparent 60%)`;

  return (
    <motion.div
      className={cn('group relative', className)}
      style={{ rotateX, rotateY, transformPerspective: 1200, transformStyle: 'preserve-3d' }}
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - bounds.left) / bounds.width);
        y.set((event.clientY - bounds.top) / bounds.height);
      }}
      onPointerLeave={() => {
        x.set(0.5);
        y.set(0.5);
      }}
      whileHover={{ z: 24 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
    >
      {children}
      {glare && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: glareBackground }}
        />
      )}
    </motion.div>
  );
}
