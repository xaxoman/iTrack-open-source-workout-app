import { useState } from 'react';
import {
  Bell,
  Moon,
  User,
  Download,
  Upload,
  HardDrive,
  Cloud,
  RefreshCw,
  Database,
  ChevronDown,
  Sparkles,
  Dumbbell,
} from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationSettingsModal } from '../components/NotificationSettingsModal';
import { UserProfileModal } from '../components/UserProfileModal';
import { AuthModal } from '../components/AuthModal';
import { AICoachOnboardingModal } from '../components/AICoachOnboardingModal';
import { isSupabaseConfigured } from '../lib/supabase';
import type { NotificationSettings, UserProfile } from '../store/useWorkoutStore';

export function Settings() {
  const {
    darkMode,
    toggleDarkMode,
    notificationSettings,
    updateNotificationSettings,
    userProfile,
    updateUserProfile,
    workouts,
    templates,
    importData,
    aiCoach,
    setAICoachConfig,
    aiOnboarded,
  } = useWorkoutStore();

  const {
    user,
    storageMode,
    syncing,
    lastSyncedAt,
    setStorageMode,
    syncNow,
  } = useAuthStore();

  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);
  const [isCoachOnboardingOpen, setIsCoachOnboardingOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(aiCoach.apiKey);
  const [modelInput, setModelInput] = useState(aiCoach.model);
  const [reasoningInput, setReasoningInput] = useState<'low' | 'high'>(aiCoach.thinkingLevel);

  const handleSelectStorage = (mode: 'local' | 'supabase') => {
    if (mode === 'supabase') {
      if (!isSupabaseConfigured) {
        setIsAuthModalOpen(true);
        return;
      }
      if (!user) {
        // Need an account first — prompt sign in/up, then reconcile on success.
        setIsAuthModalOpen(true);
        return;
      }
    }
    setStorageMode(mode);
  };

  const getStorageStatusText = () => {
    if (storageMode !== 'supabase') return 'Stored locally on this device';
    if (!user) return 'Cloud selected — sign in to sync';
    if (syncing) return 'Syncing…';
    if (lastSyncedAt) return `Synced ${new Date(lastSyncedAt).toLocaleTimeString()}`;
    return `Cloud (${user.email})`;
  };

  const handleSaveNotificationSettings = (settings: NotificationSettings) => {
    updateNotificationSettings(settings);
  };

  const handleSaveProfile = (profile: UserProfile) => {
    updateUserProfile(profile);
  };

  const handleExport = () => {
    const data = {
      workouts,
      templates,
      userProfile,
      notificationSettings,
      darkMode
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `itrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        importData(data);
        alert('Data imported successfully!');
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import data. Invalid file format.');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const getNotificationStatusText = () => {
    if (!notificationSettings.enabled) return 'Disabled';
    const days = notificationSettings.days.length;
    return `${days} day${days !== 1 ? 's' : ''} at ${notificationSettings.time}`;
  };

  const getProfileStatusText = () => {
    if (!userProfile) return 'Not configured';

    const summaryParts = [
      `${userProfile.gender}, ${userProfile.age}y`,
      `BMI: ${userProfile.bmi?.toFixed(1) || 'N/A'} (${userProfile.bmiCategory || 'Unknown'})`,
    ];

    if (typeof userProfile.bodyFatPercentage === 'number') {
      summaryParts.push(`Body fat: ${userProfile.bodyFatPercentage.toFixed(1)}%`);
    }

    return summaryParts.join(' | ');
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      {/* Data Storage */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-1">
            {storageMode === 'supabase' ? (
              <Cloud className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <HardDrive className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Data Storage
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getStorageStatusText()}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StorageOption
              active={storageMode === 'local'}
              icon={<HardDrive className="h-5 w-5" />}
              title="This device"
              description="Save data locally as JSON. Works offline, stays private."
              onClick={() => handleSelectStorage('local')}
            />
            <StorageOption
              active={storageMode === 'supabase'}
              icon={<Cloud className="h-5 w-5" />}
              title="Cloud (Supabase)"
              description="Back up and sync across devices with your account."
              onClick={() => handleSelectStorage('supabase')}
            />
          </div>

          {storageMode === 'supabase' && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {user ? (
                <button
                  onClick={() => syncNow()}
                  disabled={syncing}
                  className="flex items-center space-x-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Syncing…' : 'Sync now'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  Sign in to sync
                </button>
              )}
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Manage account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Coach */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">AI Coach</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gemini API key & model (stored only on this device)
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Gemini API key
          </label>
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="AIza..."
            autoComplete="off"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white placeholder-gray-400"
          />
          <p className="mt-1 text-xs text-gray-400">
            Get a free key at{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="underline text-indigo-600 dark:text-indigo-400"
            >
              aistudio.google.com/apikey
            </a>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Model
          </label>
          <input
            type="text"
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            placeholder="gemini-3.5-flash"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white placeholder-gray-400"
          />
          <p className="mt-1 text-xs text-gray-400">
            Free tier: <code>gemini-3.5-flash</code> or <code>gemini-flash-latest</code>. Pro
            models (e.g. <code>gemini-3.1-pro-preview</code>) need billing.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reasoning
          </label>
          <select
            value={reasoningInput}
            onChange={(e) => setReasoningInput(e.target.value as 'low' | 'high')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
          >
            <option value="high">High — deeper analysis (slower)</option>
            <option value="low">Low — faster, cheaper</option>
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Applies to Gemini 3 models (thinking level).
          </p>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsCoachOnboardingOpen(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <Dumbbell className="h-4 w-4" />
            {aiOnboarded ? 'Edit equipment & weights' : 'Set up equipment & weights'}
          </button>
          <button
            onClick={() => {
              setAICoachConfig({
                apiKey: apiKeyInput.trim(),
                model: modelInput.trim() || 'gemini-3.5-flash',
                thinkingLevel: reasoningInput,
              });
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
          >
            Save
          </button>
        </div>
      </div>

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

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Backup &amp; Data
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Export or import your data
                </p>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setIsDataMenuOpen((open) => !open)}
                aria-haspopup="true"
                aria-expanded={isDataMenuOpen}
                className="flex items-center space-x-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                <span>Manage</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isDataMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isDataMenuOpen && (
                <>
                  {/* Invisible backdrop to close the menu on outside click */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsDataMenuOpen(false)}
                  />
                  <div className="absolute right-0 bottom-full mb-2 w-56 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-20 overflow-hidden">
                    <button
                      onClick={() => {
                        handleExport();
                        setIsDataMenuOpen(false);
                      }}
                      className="flex w-full items-center space-x-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Download className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Export Data
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Download a backup of your data
                        </p>
                      </div>
                    </button>

                    <label className="flex w-full cursor-pointer items-center space-x-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700">
                      <Upload className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Import Data
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Restore data from a backup file
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          handleImport(e);
                          setIsDataMenuOpen(false);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <AICoachOnboardingModal
        isOpen={isCoachOnboardingOpen}
        onClose={() => setIsCoachOnboardingOpen(false)}
      />
    </div>
  );
}

function StorageOption({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-lg border-2 p-4 transition-colors ${
        active
          ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-center space-x-2">
        <span
          className={
            active
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-gray-500 dark:text-gray-400'
          }
        >
          {icon}
        </span>
        <span className="font-medium text-gray-900 dark:text-white">{title}</span>
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </button>
  );
}