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
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
      <div
      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
      style={{ width: `${percentage}%` }}
      />
      <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-1">
      {percentage}% Complete
      </div>
      </div>
    </div>
  );
}