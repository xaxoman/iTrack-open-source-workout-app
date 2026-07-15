interface WorkoutProgressBarProps {
  total: number;
  completed: number;
  className?: string;
}

export function WorkoutProgressBar({ total, completed, className = '' }: WorkoutProgressBarProps) {
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className={`pt-1 ${className}`}>
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-indigo-600 to-violet-500 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 mt-1.5">
        {percentage}% Complete
      </div>
    </div>
  );
}
