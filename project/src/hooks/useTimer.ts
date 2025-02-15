import { useState, useEffect } from 'react';

export function useTimer(initialSeconds: number, onComplete: () => void) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [endTime, setEndTime] = useState(Date.now() + initialSeconds * 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
        onComplete();
      }
    }, 100); // Update more frequently to prevent visual stuttering

    return () => clearInterval(interval);
  }, [endTime, onComplete]);

  const adjustTime = (seconds: number) => {
    const newTimeLeft = Math.max(0, timeLeft + seconds);
    setTimeLeft(newTimeLeft);
    setEndTime(Date.now() + newTimeLeft * 1000);
  };

  return { timeLeft, adjustTime };
}