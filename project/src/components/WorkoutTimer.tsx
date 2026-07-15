import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

export function WorkoutTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-center gap-2.5 py-3">
      <Timer className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      <span className="text-2xl font-mono font-medium tabular-nums tracking-tight text-gray-900 dark:text-white">
        {formatTime(seconds)}
      </span>
    </div>
  );
}