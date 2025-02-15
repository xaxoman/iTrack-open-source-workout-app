import React from 'react';

interface WorkoutProgressBarProps {
  total: number;
  completed: number;
}

export function WorkoutProgressBar({ total, completed }: WorkoutProgressBarProps) {
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
      <div
        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      />
      <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-1">
        {percentage}% Complete
      </div>
    </div>
  );
}