import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Workouts } from './pages/Workouts';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';
import { requestWakeLock, releaseWakeLock } from './utils/wakeLock';
import { backupManager } from './utils/backupManager';
import { notificationManager } from './utils/notificationManager';
import { useWorkoutStore } from './store/useWorkoutStore';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const { notificationSettings, darkMode } = useWorkoutStore();

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

  // Re-schedule notifications when settings change
  useEffect(() => {
    notificationManager.schedule(notificationSettings);
  }, [notificationSettings]);

  return (
    <BrowserRouter future={{ 
      v7_startTransition: true,
      v7_relativeSplatPath: true 
    }}>
      <Toaster />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="workouts" element={<Workouts />} />
          <Route path="progress" element={<Progress />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;