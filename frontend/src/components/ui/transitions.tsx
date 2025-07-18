import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 0.5,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  );
};

interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
}

const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  className = ''
}) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left':
        return { x: -50, y: 0 };
      case 'right':
        return { x: 50, y: 0 };
      case 'up':
        return { x: 0, y: 20 };
      case 'down':
        return { x: 0, y: -20 };
      default:
        return { x: 0, y: 20 };
    }
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...getInitialPosition() }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  );
};

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  delay = 0,
  duration = 0.5,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  );
};

interface BounceInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

const BounceIn: React.FC<BounceInProps> = ({
  children,
  delay = 0,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.68, -0.55, 0.265, 1.55] // Bounce ease
      }}
    >
      {children}
    </motion.div>
  );
};

interface StaggeredFadeInProps {
  children: React.ReactNode[];
  delay?: number;
  staggerDelay?: number;
  duration?: number;
  className?: string;
}

const StaggeredFadeIn: React.FC<StaggeredFadeInProps> = ({
  children,
  delay = 0,
  staggerDelay = 0.1,
  duration = 0.5,
  className = ''
}) => {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn
          key={index}
          delay={delay + (index * staggerDelay)}
          duration={duration}
        >
          {child}
        </FadeIn>
      ))}
    </div>
  );
};

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

interface ResultRevealProps {
  children: React.ReactNode;
  isVisible: boolean;
  isCorrect?: boolean;
  className?: string;
}

const ResultReveal: React.FC<ResultRevealProps> = ({
  children,
  isVisible,
  isCorrect,
  className = ''
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={className}
          initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, scale: 0.8, rotateY: -90 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            animate={isCorrect !== undefined ? {
              scale: [1, 1.05, 1],
              rotateZ: isCorrect ? [0, 5, -5, 0] : [0, -2, 2, 0]
            } : {}}
            transition={{
              duration: 0.5,
              delay: 0.2,
              ease: "easeInOut"
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface CountupProps {
  from: number;
  to: number;
  duration?: number;
  className?: string;
}

const Countup: React.FC<CountupProps> = ({
  from,
  to,
  duration = 1,
  className = ''
}) => {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: duration,
        onComplete: () => {
          // Animation completed
        }
      }}
    >
      <motion.span
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {from !== undefined ? from : to}
      </motion.span>
    </motion.span>
  );
};

interface PulseProps {
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}

const Pulse: React.FC<PulseProps> = ({
  children,
  isActive = true,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      animate={isActive ? {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
};

export {
  FadeIn,
  SlideIn,
  ScaleIn,
  BounceIn,
  StaggeredFadeIn,
  PageTransition,
  ResultReveal,
  Countup,
  Pulse
};