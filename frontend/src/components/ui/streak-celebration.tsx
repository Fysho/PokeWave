import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Star, Zap } from 'lucide-react';

interface StreakCelebrationProps {
  streak: number;
  isVisible: boolean;
  onAnimationComplete?: () => void;
}

const StreakCelebration: React.FC<StreakCelebrationProps> = ({
  streak,
  isVisible,
  onAnimationComplete
}) => {
  const getCelebrationData = () => {
    if (streak >= 10) {
      return {
        icon: Trophy,
        title: 'LEGENDARY STREAK!',
        subtitle: `${streak} in a row!`,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        emoji: '🏆',
        particles: 20
      };
    } else if (streak >= 5) {
      return {
        icon: Star,
        title: 'AMAZING STREAK!',
        subtitle: `${streak} correct guesses!`,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20',
        emoji: '⭐',
        particles: 15
      };
    } else if (streak >= 3) {
      return {
        icon: Flame,
        title: 'ON FIRE!',
        subtitle: `${streak} streak!`,
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        emoji: '🔥',
        particles: 10
      };
    } else {
      return {
        icon: Zap,
        title: 'STREAK STARTED!',
        subtitle: `${streak} correct!`,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        emoji: '⚡',
        particles: 5
      };
    }
  };

  const celebration = getCelebrationData();
  const Icon = celebration.icon;

  // Generate particle positions
  const particles = Array.from({ length: celebration.particles }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 0.5
  }));

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={onAnimationComplete}
        >
          {/* Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute text-2xl"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
              initial={{ scale: 0, opacity: 0, rotate: 0 }}
              animate={{ 
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
                rotate: [0, 360],
                y: [0, -100, -200]
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: "easeOut"
              }}
            >
              {celebration.emoji}
            </motion.div>
          ))}

          {/* Main celebration */}
          <motion.div
            className={`${celebration.bgColor} backdrop-blur-sm rounded-2xl border border-white/20 p-8 max-w-md mx-4 text-center`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 0.6
            }}
          >
            <motion.div
              className="flex justify-center mb-4"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 0.6,
                repeat: 2,
                ease: "easeInOut"
              }}
            >
              <Icon className={`h-16 w-16 ${celebration.color}`} />
            </motion.div>

            <motion.h2
              className={`text-3xl font-bold ${celebration.color} mb-2`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {celebration.title}
            </motion.h2>

            <motion.p
              className="text-lg text-white/80"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {celebration.subtitle}
            </motion.p>

            <motion.div
              className="mt-4 text-4xl"
              animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, 15, -15, 0]
              }}
              transition={{
                duration: 0.8,
                repeat: 1,
                delay: 0.5
              }}
            >
              {celebration.emoji}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StreakCelebration;