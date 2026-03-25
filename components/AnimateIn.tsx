'use client';

import React from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimateInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  threshold?: number;
}

export function AnimateIn({ 
  children, 
  className = '',
  delay = 0,
  direction = 'up',
  duration = 0.6,
  threshold = 0.1
}: AnimateInProps) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: threshold });

  const directions = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { x: 30, y: 0 },
    right: { x: -30, y: 0 },
    none: { x: 0, y: 0 }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ 
        opacity: 0, 
        ...directions[direction] 
      }}
      animate={isInView ? { 
        opacity: 1, 
        x: 0, 
        y: 0 
      } : {}}
      transition={{ 
        duration: duration, 
        delay: delay,
        ease: [0.21, 0.47, 0.32, 0.98] // Snappy cubic-bezier
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ 
  children, 
  className = '',
  threshold = 0.1,
  delayChildren = 0,
  staggerChildren = 0.1
}: { 
  children: React.ReactNode; 
  className?: string;
  threshold?: number;
  delayChildren?: number;
  staggerChildren?: number;
}) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: threshold });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "show" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: staggerChildren,
            delayChildren: delayChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ 
  children, 
  className = '',
  direction = 'up'
}: { 
  children: React.ReactNode; 
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}) {
  const directions = {
    up: { y: 20, x: 0 },
    down: { y: -20, x: 0 },
    left: { x: 20, y: 0 },
    right: { x: -20, y: 0 },
    none: { x: 0, y: 0 }
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, ...directions[direction] },
        show: { opacity: 1, x: 0, y: 0 },
      }}
      transition={{ 
        duration: 0.5,
        ease: [0.21, 0.47, 0.32, 0.98]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
