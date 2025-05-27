import { useState } from 'react';
import { Bell, Moon, User } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { NotificationSettingsModal } from '../components/NotificationSettingsModal';
import { UserProfileModal } from '../components/UserProfileModal';
import type { NotificationSettings, UserProfile } from '../store/useWorkoutStore';

export function Settings() {
  const { 
    darkMode, 
    toggleDarkMode, 
    notificationSettings, 
    updateNotificationSettings, 
    userProfile, 
    updateUserProfile 
  } = useWorkoutStore();

  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleSaveNotificationSettings = (settings: NotificationSettings) => {
    updateNotificationSettings(settings);
  };

  const handleSaveProfile = (profile: UserProfile) => {
    updateUserProfile(profile);
  };

  const getNotificationStatusText = () => {
    if (!notificationSettings.enabled) return 'Disabled';
    const days = notificationSettings.days.length;
    return `${days} day${days !== 1 ? 's' : ''} at ${notificationSettings.time}`;
  };

  const getProfileStatusText = () => {
    if (!userProfile) return 'Not configured';
    return `BMI: ${userProfile.bmi?.toFixed(1) || 'N/A'} (${userProfile.bmiCategory || 'Unknown'})`;
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm divide-y dark:divide-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Dark Mode
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Toggle dark mode on or off
                </p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
              style={{
                backgroundColor: darkMode ? '#4f46e5' : '#e5e7eb',
              }}
            >
              <span
                className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                style={{
                  transform: `translateX(${darkMode ? '20px' : '0'})`,
                }}
              />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Notifications
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getNotificationStatusText()}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsNotificationModalOpen(true)}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Configure
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Profile
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getProfileStatusText()}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              {userProfile ? 'Edit' : 'Setup'}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onSave={handleSaveNotificationSettings}
        currentSettings={notificationSettings}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        currentProfile={userProfile || undefined}
      />
    </div>
  );
}