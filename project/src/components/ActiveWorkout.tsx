import React, { useState, useEffect } from 'react';
import { WorkoutTimer } from './WorkoutTimer';
import { WorkoutProgressBar } from './WorkoutProgressBar';
import { RestTimer } from './RestTimer';
import { ExerciseVideo } from './ExerciseVideo';
import { Exercise } from '../types/workout';
import { CheckCircle, Circle, Play, ChevronRight, Timer } from 'lucide-react';
import { formatTime } from '../utils/formatTime';

interface ActiveWorkoutProps {
  name: string;
  exercises: Exercise[];
  onComplete: (duration: number, completionPercentage: number) => void;
}

export function ActiveWorkout({ name, exercises, onComplete }: ActiveWorkoutProps) {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [duration, setDuration] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [exerciseTimers, setExerciseTimers] = useState<Record<string, number>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
    return () => clearInterval(interval);
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
    <div className="space-y-6 pb-20"> {/* Added padding-bottom */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md p-4 z-10">
        <div className="max-w-7xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">{name}</h2>
          <WorkoutProgressBar total={exercises.length} completed={completedExercises.length} />
          <WorkoutTimer seconds={duration} />
        </div>
      </div>

      <div className="space-y-4 pt-48">
        {exercises.map((exercise, index) => (
          <div
            key={exercise.id}
            className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm ${
              index === currentExercise ? 'ring-2 ring-indigo-500' : ''
            }`}
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
                      onClick={() => startExerciseTimer(exercise.id)}
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
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleExerciseComplete(exercise.id)}
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
              
              {index === currentExercise && index < exercises.length - 1 && (
                <button
                  onClick={() => setCurrentExercise(index + 1)}
                  className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                >
                  <span className="text-sm">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex px-4 md:px-0">
        <button
          onClick={handleComplete}
          className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-center"
        >
          Complete Workout
        </button>
      </div>

      {showRestTimer && <RestTimer onComplete={handleRestComplete} />}
    </div>
  );
}