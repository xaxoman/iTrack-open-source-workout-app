import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Delete",
  message = "Do you really want to delete this workout?"
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-panel max-w-md p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {message}
          </p>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handleConfirm}
            className="btn-danger w-full"
          >
            Delete
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
