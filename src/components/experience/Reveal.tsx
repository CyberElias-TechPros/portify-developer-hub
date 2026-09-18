import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

type Mode = 'rise' | 'blur' | 'scale' | 'left' | 'right' | 'mask';

const variantsFor = (mode: Mode, distance: number): Variants => {
  const hidden: Record<string, any> = { opacity: 0 };
  const shown: Record<string, any> = { opacity: 1 };

  switch (mode) {
    case 'blur':
      hidden.filter = 'blur(16px)';
      hidden.y = distance * 0.4;
      break;
    case 'scale':
      hidden.scale = 0.94;
      break;
    case 'left':
      hidden.x = -distance;
      break;
    case 'right':
      hidden.x = distance;
      break;
    case 'mask':
      hidden.clipPath = 'inset(0 0 100% 0)';
      hidden.y = distance * 0.3;
      shown.clipPath = 'inset(0 0 0% 0)';
      break;
    default:
      hidden.y = distance;
  }
  shown.y = 0;
  shown.x = 0;
  shown.scale = 1;
  shown.filter = 'blur(0px)';

  return {
    hidden,
    shown: {
      ...shown,
      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
    },
  };
};

export function Reveal({
  children,
  mode = 'rise',
  delay = 0,
  distance = 28,
  className,
  once = true,
  amount = 0.25,
  as = 'div',
}: {
  children: ReactNode;
  mode?: Mode;
  delay?: number;
  distance?: number;
  className?: string;
  once?: boolean;
  amount?: number;
  as?: 'div' | 'section' | 'li' | 'article' | 'span';
}) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as] as typeof motion.div;

  if (reduceMotion) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <Component
      className={className}
      variants={variantsFor(mode, distance)}
      initial="hidden"
      whileInView="shown"
      viewport={{ once, amount }}
      transition={{ delay }}
    >
      {children}
    </Component>
  );
}

/** Staggered container — children animate in sequence. */
export function RevealGroup({
  children,
  className,
  stagger = 0.09,
  delay = 0,
  once = true,
  amount = 0.2,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  once?: boolean;
  amount?: number;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once, amount }}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  mode = 'rise',
  distance = 24,
}: {
  children: ReactNode;
  className?: string;
  mode?: Mode;
  distance?: number;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={variantsFor(mode, distance)}>
      {children}
    </motion.div>
  );
}

export default Reveal;
