import React, { useState } from 'react';
import { NavLink as RouterNavLink, Link, Outlet } from 'react-router-dom';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useAuthStore } from '../store/useAuthStore';
import { AuthModal } from './AuthModal';
import {
  Home,
  Dumbbell,
  LineChart,
  Settings,
  Sun,
  Moon,
  User,
  UserCircle2,
  Sparkles
} from 'lucide-react';

export function Layout() {
  const { darkMode, toggleDarkMode } = useWorkoutStore();
  const user = useAuthStore((state) => state.user);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-950' : 'bg-gray-50'} transition-colors`}>
      <nav className="fixed top-0 w-full z-50 pt-safe bg-white/85 dark:bg-gray-950/85 backdrop-blur-xl border-b border-gray-200/70 dark:border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 shadow-sm shadow-indigo-600/30">
                  <Dumbbell className="h-[18px] w-[18px] text-white" />
                </span>
                <span className="font-semibold tracking-tight text-gray-900 dark:text-white">FitTrack</span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                <NavLink to="/" icon={<Home className="h-4 w-4" />} text="Home" />
                <NavLink to="/workouts" icon={<Dumbbell className="h-4 w-4" />} text="Workouts" />
                <NavLink to="/progress" icon={<LineChart className="h-4 w-4" />} text="Progress" />
                <NavLink to="/coach" icon={<Sparkles className="h-4 w-4" />} text="Coach" />
                <NavLink to="/settings" icon={<Settings className="h-4 w-4" />} text="Settings" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="icon-btn relative"
                title={user ? `Signed in as ${user.email}` : 'Sign in / Sign up'}
                aria-label={user ? 'Account' : 'Sign in or sign up'}
              >
                {user ? (
                  <UserCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <User className="h-5 w-5" />
                )}
                {user && (
                  <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-950" />
                )}
              </button>
              <button
                onClick={toggleDarkMode}
                className="icon-btn"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Increased top padding to account for the navbar */}
      <main className="pt-28 md:pt-24 pb-28 md:pb-16 px-4 max-w-7xl mx-auto">
        <Outlet />
      </main>

      {/* Coach is deliberately not in the tab bar — it opens from the Home banner. */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-t border-gray-200/70 dark:border-white/[0.07] pb-safe">
        <div className="flex justify-around px-2 py-2">
          <MobileNavLink to="/" icon={<Home className="h-5 w-5" />} label="Home" />
          <MobileNavLink to="/workouts" icon={<Dumbbell className="h-5 w-5" />} label="Workouts" />
          <MobileNavLink to="/progress" icon={<LineChart className="h-5 w-5" />} label="Progress" />
          <MobileNavLink to="/settings" icon={<Settings className="h-5 w-5" />} label="Settings" />
        </div>
      </nav>
    </div>
  );
}

function NavLink({ to, icon, text }: { to: string; icon: React.ReactNode; text: string }) {
  return (
    <RouterNavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/70'
        }`
      }
    >
      {icon}
      <span>{text}</span>
    </RouterNavLink>
  );
}

function MobileNavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <RouterNavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors ${
          isActive
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </RouterNavLink>
  );
}
