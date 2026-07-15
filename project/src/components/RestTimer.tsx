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
    <div className="modal-overlay">
      <div className="modal-panel max-w-md p-8 text-center">
        <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-6">
          Rest Time
        </h3>
        <div
          className={`text-6xl font-mono font-semibold tabular-nums tracking-tight mb-8 transition-colors duration-300 ${
            isWarning
              ? 'text-red-600 dark:text-red-400 animate-[shake_0.5s_ease-in-out_infinite]'
              : 'text-indigo-600 dark:text-indigo-400'
          }`}
        >
          {formatTime(timeLeft)}
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => adjustTime(-10)}
            aria-label="Subtract 10 seconds"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900 active:scale-95 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <Rewind className="h-6 w-6" />
          </button>
          <button
            onClick={handleSkip}
            aria-label="Skip rest"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 transition-all hover:bg-indigo-500 active:scale-95"
          >
            <SkipForward className="h-6 w-6" />
          </button>
          <button
            onClick={() => adjustTime(10)}
            aria-label="Add 10 seconds"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900 active:scale-95 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <FastForward className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}