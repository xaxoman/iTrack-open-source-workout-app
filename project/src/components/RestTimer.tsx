import React, { useEffect, useRef } from 'react';
import { FastForward, Rewind, SkipForward } from 'lucide-react';
import { formatTime } from '../utils/formatTime';
import { useTimer } from '../hooks/useTimer';

interface RestTimerProps {
  onComplete: () => void;
}

export function RestTimer({ onComplete }: RestTimerProps) {
  const { timeLeft, adjustTime } = useTimer(60, onComplete);
  const isWarning = timeLeft <= 5;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create and preload audio when component mounts
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.load(); // Preload the audio file
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle warning state and audio playback
  useEffect(() => {
    if (!audioRef.current || timeLeft > 5) return;

    // Play audio immediately when entering warning state
    const playBeep = () => {
      if (audioRef.current && timeLeft > 0) {
        // Clone the audio node for each play to avoid delay
        const beep = audioRef.current.cloneNode() as HTMLAudioElement;
        beep.volume = 0.5; // Reduce volume slightly
        beep.play().catch(() => {
          // Ignore play() errors
        });
      }
    };

    if (isWarning) {
      playBeep(); // Play immediately when entering warning state
      const interval = setInterval(playBeep, 1000);
      return () => clearInterval(interval);
    }
  }, [isWarning, timeLeft]);

  const handleSkip = () => {
    adjustTime(-timeLeft);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center w-[90%] max-w-md mx-auto">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Rest Time
        </h3>
        <div 
          className={`text-4xl font-mono mb-8 transition-colors duration-300 ${
            isWarning 
              ? 'text-red-600 dark:text-red-400 animate-[shake_0.5s_ease-in-out_infinite]' 
              : 'text-indigo-600 dark:text-indigo-400'
          }`}
        >
          {formatTime(timeLeft)}
        </div>
        <div className="flex justify-center space-x-8">
          <button
            onClick={() => adjustTime(-10)}
            className="p-3 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 active:scale-95 transition-transform"
          >
            <Rewind className="h-8 w-8" />
          </button>
          <button
            onClick={handleSkip}
            className="p-3 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 active:scale-95 transition-transform"
          >
            <SkipForward className="h-8 w-8" />
          </button>
          <button
            onClick={() => adjustTime(10)}
            className="p-3 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 active:scale-95 transition-transform"
          >
            <FastForward className="h-8 w-8" />
          </button>
        </div>
      </div>
    </div>
  );
}