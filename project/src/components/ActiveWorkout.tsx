import { useState, useEffect, useRef } from 'react';
import { WorkoutTimer } from './WorkoutTimer';
import { WorkoutProgressBar } from './WorkoutProgressBar';
import { RestTimer } from './RestTimer';
import { ExerciseVideo } from './ExerciseVideo';
import { QuitWorkoutModal } from './QuitWorkoutModal';
import { Exercise } from '../types/workout';
import { CheckCircle, Circle, Timer } from 'lucide-react';
import { formatTime } from '../utils/formatTime';
import { enableWorkoutWakeLock, disableWorkoutWakeLock, requestWakeLock } from '../utils/wakeLock';

interface ActiveWorkoutProps {
  name: string;
  exercises: Exercise[];
  onComplete: (duration: number, completionPercentage: number) => void;
  onQuit?: () => void;
}

export function ActiveWorkout({ name, exercises, onComplete, onQuit }: ActiveWorkoutProps) {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [duration, setDuration] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [exerciseTimers, setExerciseTimers] = useState<Record<string, number>>({});
  const [showQuitModal, setShowQuitModal] = useState(false);
  const currentExerciseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
    
    // Enable workout-specific wake lock when workout starts
    enableWorkoutWakeLock();
    
    // Periodic wake lock check every 30 seconds during workout
    const wakeLockInterval = setInterval(async () => {
      console.log('Periodic wake lock check during workout');
      await requestWakeLock();
    }, 30000);
    
    return () => {
      clearInterval(interval);
      clearInterval(wakeLockInterval);
      // Disable workout-specific wake lock when workout ends
      disableWorkoutWakeLock();
    };
  }, []);

  useEffect(() => {
    // Initialize timers for time-based exercises
    const timers: Record<string, number> = {};
    exercises.forEach(exercise => {
      if (exercise.type === 'time') {
        timers[exercise.id] = exercise.reps;
      }
    });
    setExerciseTimers(timers);
  }, [exercises]);

  useEffect(() => {
    // Handle browser back button and page refresh/close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // For older browsers
      return ''; // For modern browsers
    };

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      setShowQuitModal(true);
      // Push the current state back to prevent navigation
      window.history.pushState(null, '', window.location.href);
    };

    // Add a history entry when the workout starts
    window.history.pushState(null, '', window.location.href);
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    // Scroll to the current exercise when it changes
    if (currentExerciseRef.current) {
      currentExerciseRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentExercise]);

  const handleExerciseComplete = (exerciseId: string) => {
    if (!completedExercises.includes(exerciseId)) {
      setCompletedExercises([...completedExercises, exerciseId]);
      setShowRestTimer(true);
    } else {
      setCompletedExercises(completedExercises.filter(id => id !== exerciseId));
    }
  };

  const handleRestComplete = () => {
    setShowRestTimer(false);
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
    }
  };

  const handleComplete = () => {
    const completionPercentage = (completedExercises.length / exercises.length) * 100;
    onComplete(duration, completionPercentage);
  };

  const handleQuitWorkout = () => {
    if (onQuit) {
      onQuit();
    } else {
      // If no onQuit handler provided, calculate completion and call onComplete
      const completionPercentage = (completedExercises.length / exercises.length) * 100;
      onComplete(duration, completionPercentage);
    }
  };

  const getCompletionPercentage = () => {
    return (completedExercises.length / exercises.length) * 100;
  };

  const startExerciseTimer = (exerciseId: string) => {
    const interval = setInterval(() => {
      setExerciseTimers(prev => {
        const newTime = prev[exerciseId] - 1;
        if (newTime <= 0) {
          clearInterval(interval);
          handleExerciseComplete(exerciseId);
          return { ...prev, [exerciseId]: 0 };
        }
        return { ...prev, [exerciseId]: newTime };
      });
    }, 1000);

    return () => clearInterval(interval);
  };

  return (
    <div className="space-y-6">
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md px-4 pt-4 pb-0 z-10">
        <div className="max-w-7xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">{name}</h2>
          <WorkoutProgressBar total={exercises.length} completed={completedExercises.length} />
          <WorkoutTimer />
        </div>
      </div>

      <div className="space-y-4 pt-28 pb-20">
        {exercises.map((exercise, index) => (
          <div
            key={exercise.id}
            ref={index === currentExercise ? currentExerciseRef : null}
            className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm ${
              index === currentExercise ? 'ring-2 ring-indigo-500' : ''
            }`}
            onClick={() => setCurrentExercise(index)}
          >
            {exercise.type === 'time' && index === currentExercise && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Timer className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-2xl font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {formatTime(exerciseTimers[exercise.id] || exercise.reps)}
                    </span>
                  </div>
                  {exerciseTimers[exercise.id] > 0 && !completedExercises.includes(exercise.id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startExerciseTimer(exercise.id);
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Start Timer
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {index === currentExercise && exercise.videoUrl && (
              <div className="mb-4">
                <ExerciseVideo url={exercise.videoUrl} />
              </div>
            )}
            
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExerciseComplete(exercise.id);
                  }}
                  className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  {completedExercises.includes(exercise.id) ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <Circle className="h-6 w-6" />
                  )}
                </button>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {exercise.name}
                  </h3>
                  <div className="text-sm space-y-1">
                    {exercise.type === 'reps' && (
                      <p className="text-indigo-600 dark:text-indigo-400">
                        {exercise.reps} repetitions
                      </p>
                    )}
                    <p className="text-gray-500 dark:text-gray-400">
                      {exercise.targetMuscles.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {index + 1}/{exercises.length}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 border-t dark:border-gray-700 z-10">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleComplete}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-center font-medium"
          >
            Complete Workout
          </button>
        </div>
      </div>

      {showRestTimer && <RestTimer onComplete={handleRestComplete} />}
      
      <QuitWorkoutModal
        isOpen={showQuitModal}
        onClose={() => setShowQuitModal(false)}
        onConfirm={handleQuitWorkout}
        completionPercentage={getCompletionPercentage()}
      />
    </div>
  );
}