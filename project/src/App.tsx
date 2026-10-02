import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Workouts } from './pages/Workouts';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';
import { Coach } from './pages/Coach';
import { requestWakeLock, releaseWakeLock } from './utils/wakeLock';
import { backupManager } from './utils/backupManager';
import { notificationManager } from './utils/notificationManager';
import { useWorkoutStore } from './store/useWorkoutStore';
import { useAuthStore } from './store/useAuthStore';
import { useI18n } from './i18n';
import { unlockAudio } from './utils/sound';

function App() {
  const { notificationSettings, darkMode } = useWorkoutStore();
  const { lang } = useI18n();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Audio starts suspended until a user gesture; unlock it on the first tap so
  // the rest-timer beep can play later on its own.
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // Request wake lock when app starts
    requestWakeLock();
    
    // Initialize auto-backup system
    backupManager.init();

    // Initialize notifications
    notificationManager.init();

    // Initialize auth / cloud sync (restores session, sets up auto-sync)
    useAuthStore.getState().init();

    // Release wake lock when app is unmounted
    return () => {
      releaseWakeLock();
    };
  }, []);

  // Re-schedule notifications when settings (or their language) change
  useEffect(() => {
    notificationManager.schedule(notificationSettings);
  }, [notificationSettings, lang]);

  return (
    <BrowserRouter future={{ 
      v7_startTransition: true,
      v7_relativeSplatPath: true 
    }}>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '999px',
            background: darkMode ? '#f9fafb' : '#111827',
            color: darkMode ? '#111827' : '#f9fafb',
            fontSize: '14px',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="workouts" element={<Workouts />} />
          <Route path="progress" element={<Progress />} />
          <Route path="coach" element={<Coach />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;