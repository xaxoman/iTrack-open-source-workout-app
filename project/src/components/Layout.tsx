import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { 
  Home, 
  Dumbbell, 
  LineChart, 
  Settings, 
  Sun, 
  Moon 
} from 'lucide-react';

export function Layout() {
  const { darkMode, toggleDarkMode } = useWorkoutStore();

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <nav className="fixed top-0 w-full bg-white dark:bg-gray-800 shadow-sm z-50 pt-safe">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <Dumbbell className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-gray-900 dark:text-white">FitTrack</span>
              </Link>
              <div className="hidden md:flex items-center space-x-4">
                <NavLink to="/" icon={<Home className="h-5 w-5" />} text="Home" />
                <NavLink to="/workouts" icon={<Dumbbell className="h-5 w-5" />} text="Workouts" />
                <NavLink to="/progress" icon={<LineChart className="h-5 w-5" />} text="Progress" />
                <NavLink to="/settings" icon={<Settings className="h-5 w-5" />} text="Settings" />
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-gray-200" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Increased top padding to account for the navbar */}
      <main className="pt-28 md:pt-24 pb-16 px-4 max-w-7xl mx-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white dark:bg-gray-800 border-t dark:border-gray-700 pb-safe">
        <div className="flex justify-around py-3">
          <MobileNavLink to="/" icon={<Home className="h-5 w-5" />} />
          <MobileNavLink to="/workouts" icon={<Dumbbell className="h-5 w-5" />} />
          <MobileNavLink to="/progress" icon={<LineChart className="h-5 w-5" />} />
          <MobileNavLink to="/settings" icon={<Settings className="h-5 w-5" />} />
        </div>
      </nav>
    </div>
  );
}

function NavLink({ to, icon, text }: { to: string; icon: React.ReactNode; text: string }) {
  return (
    <Link
      to={to}
      className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
    >
      {icon}
      <span>{text}</span>
    </Link>
  );
}

function MobileNavLink({ to, icon }: { to: string; icon: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
    >
      {icon}
    </Link>
  );
}