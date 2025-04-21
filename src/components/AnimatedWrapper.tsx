
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedWrapperProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
}

interface MotionVariants {
  initial: {
    opacity: number;
    y?: number;
    x?: number;
  };
  animate: {
    opacity: number;
    y?: number;
    x?: number;
  };
  exit: {
    opacity: number;
    y?: number;
    x?: number;
  };
}

export default function AnimatedWrapper({ 
  children, 
  delay = 0, 
  duration = 0.4, 
  direction = "up", 
  className = "" 
}: AnimatedWrapperProps) {
  // Calculate initial and animate values based on direction
  const getVariants = () => {
    const variants: MotionVariants = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
    
    if (direction === "up") {
      variants.initial = { ...variants.initial, y: 20 };
      variants.animate = { ...variants.animate, y: 0 };
      variants.exit = { ...variants.exit, y: -20 };
    } else if (direction === "down") {
      variants.initial = { ...variants.initial, y: -20 };
      variants.animate = { ...variants.animate, y: 0 };
      variants.exit = { ...variants.exit, y: 20 };
    } else if (direction === "left") {
      variants.initial = { ...variants.initial, x: 20 };
      variants.animate = { ...variants.animate, x: 0 };
      variants.exit = { ...variants.exit, x: -20 };
    } else if (direction === "right") {
      variants.initial = { ...variants.initial, x: -20 };
      variants.animate = { ...variants.animate, x: 0 };
      variants.exit = { ...variants.exit, x: 20 };
    }
    
    return variants;
  };

  const variants = getVariants();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay,
          duration
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
