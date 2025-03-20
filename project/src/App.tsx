import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Workouts } from './pages/Workouts';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';
import { requestWakeLock, releaseWakeLock } from './utils/wakeLock';

function App() {
  useEffect(() => {
    // Request wake lock when app starts
    requestWakeLock();
    
    // Release wake lock when app is unmounted
    return () => {
      releaseWakeLock();
    };
  }, []);

  return (
    <BrowserRouter>
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