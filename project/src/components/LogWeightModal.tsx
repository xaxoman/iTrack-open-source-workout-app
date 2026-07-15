import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Scale, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkoutStore } from '../store/useWorkoutStore';

interface LogWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional heading override, e.g. for the post-workout prompt. */
  title?: string;
  subtitle?: string;
}

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function LogWeightModal({
  isOpen,
  onClose,
  title = 'Log body weight',
  subtitle = 'One measurement per day — logging twice replaces that day\'s value.',
}: LogWeightModalProps) {
  const { weightLog, addWeightEntry, deleteWeightEntry } = useWorkoutStore();
  const lastEntry = weightLog[weightLog.length - 1];

  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(todayISO());

  useEffect(() => {
    if (isOpen) {
      setWeight(lastEntry ? String(lastEntry.weightKg) : '');
      setDate(todayISO());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const parsed = parseFloat(weight);
  const isValid = !Number.isNaN(parsed) && parsed > 20 && parsed < 400 && Boolean(date);

  const handleSave = () => {
    if (!isValid) return;
    addWeightEntry({
      id: crypto.randomUUID(),
      date,
      weightKg: Math.round(parsed * 10) / 10,
    });
    toast.success('Weight logged');
    onClose();
  };

  const recentEntries = [...weightLog].reverse().slice(0, 5);

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-panel max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/[0.07]">
          <div className="flex items-center space-x-2">
            <Scale className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
          <button onClick={onClose} className="icon-btn" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="weight-kg">
                Weight (kg)
              </label>
              <input
                id="weight-kg"
                type="number"
                inputMode="decimal"
                min="20"
                max="400"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 70.5"
                className="input"
                autoFocus
              />
            </div>
            <div>
              <label className="label" htmlFor="weight-date">
                Date
              </label>
              <input
                id="weight-date"
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {recentEntries.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Recent entries
              </p>
              <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {recentEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {entry.weightKg} kg
                      </span>
                      <button
                        onClick={() => deleteWeightEntry(entry.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                        aria-label={`Delete entry from ${entry.date}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 dark:border-white/[0.07]">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!isValid} className="btn-primary">
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
