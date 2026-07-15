import { useEffect, useState } from 'react';

interface WorkoutProgressBarProps {
  total: number;
  completed: number;
  className?: string;
}

export function WorkoutProgressBar({ total, completed, className = '' }: WorkoutProgressBarProps) {
  const percentage = Math.round((completed / total) * 100);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check if running as PWA/mobile app
    const isRunningAsPWA = 
      window.matchMedia('(display-mode: standalone)').matches ||
      // Check for iOS Safari standalone mode
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      // Use safer check for Capacitor
      'Capacitor' in window;
      
    setIsPWA(isRunningAsPWA);
  }, []);

  return (
    <div className={`${isPWA ? 'pt-12 mt-10' : 'pt-3 mt-3'} ${className}`}>
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-4">
        <div
          className="bg-gradient-to-r from-indigo-600 to-violet-500 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
        <div className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 mt-1.5">
          {percentage}% Complete
        </div>
      </div>
    </div>
  );
}