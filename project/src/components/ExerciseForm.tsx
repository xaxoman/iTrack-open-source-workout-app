import React from 'react';
import { X } from 'lucide-react';

interface ExerciseFormProps {
  exercise: {
    name: string;
    reps: number;
    type: 'reps' | 'time';
    videoUrl: string;
    targetMuscles: string[];
    description: string;
  };
  onChange: (field: string, value: string | string[] | number) => void;
  onRemove: () => void;
}

export function ExerciseForm({ exercise, onChange, onRemove }: ExerciseFormProps) {
  const muscleGroups = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
    'Legs', 'Core', 'Glutes', 'Calves', 'Forearms'
  ];

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? 1 : Math.max(1, parseInt(e.target.value, 10));
    onChange('reps', value);
  };

  return (
    <div className="border dark:border-gray-700 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Exercise Details</h3>
        <button
          onClick={onRemove}
          className="text-gray-500 hover:text-red-500 dark:text-gray-400"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Exercise Name
          </label>
          <input
            type="text"
            value={exercise.name}
            onChange={(e) => onChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={exercise.type}
              onChange={(e) => onChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="reps">Repetitions</option>
              <option value="time">Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {exercise.type === 'reps' ? 'Repetitions' : 'Time (seconds)'}
            </label>
            <input
              type="number"
              min="1"
              value={exercise.reps || 1}
              onChange={handleNumberChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Video URL (YouTube or demonstration link)
          </label>
          <input
            type="url"
            value={exercise.videoUrl}
            onChange={(e) => onChange('videoUrl', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Target Muscles
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {muscleGroups.map((muscle) => (
              <label key={muscle} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={exercise.targetMuscles.includes(muscle)}
                  onChange={(e) => {
                    const newMuscles = e.target.checked
                      ? [...exercise.targetMuscles, muscle]
                      : exercise.targetMuscles.filter((m) => m !== muscle);
                    onChange('targetMuscles', newMuscles);
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{muscle}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description / Notes
          </label>
          <textarea
            value={exercise.description}
            onChange={(e) => onChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
}