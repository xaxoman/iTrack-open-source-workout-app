import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Bell } from 'lucide-react';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: NotificationSettings) => void;
  currentSettings?: NotificationSettings;
}

export interface NotificationSettings {
  enabled: boolean;
  days: string[];
  time: string;
}

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' }
];

export function NotificationSettingsModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentSettings 
}: NotificationSettingsModalProps) {
  const [enabled, setEnabled] = useState(currentSettings?.enabled ?? true);
  const [selectedDays, setSelectedDays] = useState<string[]>(
    currentSettings?.days ?? ['monday', 'wednesday', 'friday']
  );
  const [time, setTime] = useState(currentSettings?.time ?? '18:00');

  if (!isOpen) return null;

  const handleDayToggle = (dayId: string) => {
    setSelectedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  const handleSave = () => {
    onSave({
      enabled,
      days: selectedDays,
      time
    });
    onClose();
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-panel max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/[0.07]">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
              Notification Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                Enable Notifications
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive workout reminders
              </p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
              style={{
                backgroundColor: enabled ? '#4f46e5' : '#e5e7eb',
              }}
            >
              <span
                className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                style={{
                  transform: `translateX(${enabled ? '20px' : '0'})`,
                }}
              />
            </button>
          </div>

          {enabled && (
            <>
              {/* Days Selection */}
              <div>
                <h3 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white mb-3">
                  Reminder Days
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => handleDayToggle(day.id)}
                      className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                        selectedDays.includes(day.id)
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Select the days you want to receive workout reminders
                </p>
              </div>

              {/* Time Selection */}
              <div>
                <h3 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white mb-3">
                  Reminder Time
                </h3>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="input"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Choose when you want to receive daily workout reminders
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 dark:border-white/[0.07]">
          <button
            onClick={onClose}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
