import React, { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { WorkoutTemplate } from '../types/workout';
import { ExerciseForm } from './ExerciseForm';

interface CreateRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExerciseData {
  id: string;
  name: string;
  reps: number;
  type: 'reps' | 'time';
  videoUrl: string;
  targetMuscles: string[];
  description: string;
}

export function CreateRoutineModal({ isOpen, onClose }: CreateRoutineModalProps) {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const { addTemplate } = useWorkoutStore();
  const lastExerciseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lastExerciseRef.current) {
      lastExerciseRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [exercises.length]); // Scroll when exercises array length changes

  if (!isOpen) return null;

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        id: crypto.randomUUID(),
        name: '',
        reps: 1,
        type: 'reps',
        videoUrl: '',
        targetMuscles: [],
        description: '',
      },
    ]);
  };

  const updateExercise = (id: string, field: string, value: string | string[] | number) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    );
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const template: WorkoutTemplate = {
      id: crypto.randomUUID(),
      name,
      exercises: exercises.map(({ id, name, reps, type, videoUrl, targetMuscles, description }) => ({
        id,
        name,
        reps,
        type,
        videoUrl,
        targetMuscles,
        description,
      })),
    };
    addTemplate(template);
    onClose();
    setName('');
    setExercises([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Routine
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Routine Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div className="mb-6">
            <div className="sticky top-[73px] bg-white dark:bg-gray-800 z-10 flex justify-between items-center py-4 px-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Exercises</h3>
              <button
                type="button"
                onClick={addExercise}
                className="flex items-center px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Exercise
              </button>
            </div>
            {exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                ref={index === exercises.length - 1 ? lastExerciseRef : null}
              >
                <ExerciseForm
                  exercise={exercise}
                  onChange={(field, value) => updateExercise(exercise.id, field, value)}
                  onRemove={() => removeExercise(exercise.id)}
                />
              </div>
            ))}
          </div>

          <div className="sticky bottom-0 bg-white dark:bg-gray-800 flex justify-end space-x-3 border-t dark:border-gray-700 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
            >
              Create Routine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}