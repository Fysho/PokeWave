import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Zap, Trophy, Swords } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'battle' | 'victory' | 'electric';
  message?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  message,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const getIcon = () => {
    switch (variant) {
      case 'battle':
        return <Swords className={sizeClasses[size]} />;
      case 'victory':
        return <Trophy className={sizeClasses[size]} />;
      case 'electric':
        return <Zap className={sizeClasses[size]} />;
      default:
        return <Loader2 className={sizeClasses[size]} />;
    }
  };

  const getColor = () => {
    switch (variant) {
      case 'battle':
        return 'text-red-500';
      case 'victory':
        return 'text-yellow-500';
      case 'electric':
        return 'text-blue-500';
      default:
        return 'text-primary';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <motion.div
        className={`${getColor()} animate-spin`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        {getIcon()}
      </motion.div>
      {message && (
        <motion.p
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

interface PokeBallLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const PokeBallLoading: React.FC<PokeBallLoadingProps> = ({
  size = 'md',
  message,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-b from-red-500 to-red-600 border-2 border-gray-800"
          animate={{
            rotateY: [0, 180, 360],
            rotateX: [0, 45, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-t from-gray-100 to-gray-200 border-2 border-gray-800"
          animate={{
            rotateY: [0, -180, -360],
            rotateX: [0, -45, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.1
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-gray-800 rounded-full border-2 border-gray-600" />
        </div>
      </div>
      {message && (
        <motion.p
          className="text-sm text-muted-foreground text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

interface BattleLoadingProps {
  pokemon1Name?: string;
  pokemon2Name?: string;
  className?: string;
}

const BattleLoading: React.FC<BattleLoadingProps> = ({
  pokemon1Name = 'Pokemon',
  pokemon2Name = 'Pokemon',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-6 p-8 ${className}`}>
      <motion.div
        className="text-lg font-semibold text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Battle Simulation in Progress
      </motion.div>
      
      <div className="flex items-center space-x-8">
        <motion.div
          className="flex flex-col items-center space-y-2"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">1</span>
          </div>
          <span className="text-sm font-medium">{pokemon1Name}</span>
        </motion.div>

        <motion.div
          className="flex flex-col items-center space-y-2"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Swords className="w-8 h-8 text-red-500" />
          <span className="text-xs text-muted-foreground">VS</span>
        </motion.div>

        <motion.div
          className="flex flex-col items-center space-y-2"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">2</span>
          </div>
          <span className="text-sm font-medium">{pokemon2Name}</span>
        </motion.div>
      </div>

      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex justify-center space-x-1">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Simulating 10 battles...
        </p>
      </motion.div>
    </div>
  );
};

export { LoadingSpinner, PokeBallLoading, BattleLoading };