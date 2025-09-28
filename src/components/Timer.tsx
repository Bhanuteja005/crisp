import React, { useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimerProps {
  timeLeft: number;
  totalTime: number;
  isActive: boolean;
  onTick: () => void;
  onTimeUp: () => void;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({
  timeLeft,
  totalTime,
  isActive,
  onTick,
  onTimeUp,
  className = '',
}) => {
  useEffect(() => {
    let interval: number | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        onTick();
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      onTimeUp();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, onTick, onTimeUp]);

  const percentage = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const isWarning = timeLeft <= 10 && timeLeft > 5;
  const isCritical = timeLeft <= 5;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getColorClasses = () => {
    if (isCritical) return 'text-red-600 bg-red-50 border-red-200';
    if (isWarning) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  return (
    <motion.div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-mono font-semibold ${getColorClasses()} ${className}`}
      animate={isCritical ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
    >
      {isCritical ? (
        <AlertCircle className="w-4 h-4 animate-pulse" />
      ) : (
        <Clock className="w-4 h-4" />
      )}
      
      <span className="text-sm">
        {formatTime(timeLeft)}
      </span>

      {/* Progress bar */}
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${
            isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'
          }`}
          initial={{ width: '0%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
};