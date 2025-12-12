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
    <div className="fixed inset-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Notification Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Reminder Days
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => handleDayToggle(day.id)}
                      className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                        selectedDays.includes(day.id)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Reminder Time
                </h3>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Choose when you want to receive daily workout reminders
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
