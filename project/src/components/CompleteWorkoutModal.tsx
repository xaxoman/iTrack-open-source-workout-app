import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { formatTime } from '../utils/formatTime';

interface CompleteWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  completedExercises: number;
  totalExercises: number;
  duration: number;
}

export function CompleteWorkoutModal({
  isOpen,
  onClose,
  onConfirm,
  completedExercises,
  totalExercises,
  duration
}: CompleteWorkoutModalProps) {
  if (!isOpen) return null;

  const remaining = Math.max(totalExercises - completedExercises, 0);
  const isFullyCompleted = remaining === 0;
  const completionPercentage = totalExercises > 0
    ? (completedExercises / totalExercises) * 100
    : 0;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-panel max-w-md p-6">
        <div className="flex items-center justify-center mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isFullyCompleted
                ? 'bg-indigo-50 dark:bg-indigo-500/10'
                : 'bg-amber-50 dark:bg-amber-500/10'
            }`}
          >
            {isFullyCompleted ? (
              <CheckCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            )}
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
            Finish this workout?
          </h3>
          <div className="mb-4">
            <div className="text-3xl font-semibold tracking-tight text-indigo-600 dark:text-indigo-400">
              {Math.round(completionPercentage)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {completedExercises}/{totalExercises} exercises &middot; {formatTime(duration)}
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isFullyCompleted
              ? 'Your workout will be saved to your history.'
              : `You still have ${remaining} ${remaining === 1 ? 'exercise' : 'exercises'} to go. Finishing now saves the workout as it is.`}
          </p>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleConfirm}
            className="btn-primary w-full"
          >
            Finish Workout
          </button>
          <button
            onClick={onClose}
            className="btn-secondary w-full"
          >
            Keep Training
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
