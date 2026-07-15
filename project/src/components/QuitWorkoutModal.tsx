import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface QuitWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  completionPercentage: number;
}

export function QuitWorkoutModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  completionPercentage 
}: QuitWorkoutModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-panel max-w-md p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
            Do you want to quit now?
          </h3>
          <div className="mb-4">
            <div className="text-3xl font-semibold tracking-tight text-indigo-600 dark:text-indigo-400">
              {Math.round(completionPercentage)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Workout completed
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleConfirm}
            className="btn-danger w-full"
          >
            Quit
          </button>
          <button
            onClick={onClose}
            className="btn-secondary w-full"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
