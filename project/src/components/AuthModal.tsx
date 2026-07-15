import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  LogOut,
  Cloud,
  CloudOff,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { isSupabaseConfigured } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'signin' | 'signup';

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const {
    user,
    storageMode,
    loading,
    syncing,
    error,
    signIn,
    signUp,
    signOut,
    setStorageMode,
    syncNow,
    clearError,
  } = useAuthStore();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setInfo(null);
      clearError();
    }
  }, [isOpen, clearError]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo(null);
    try {
      if (mode === 'signup') {
        const { needsConfirmation } = await signUp(email.trim(), password);
        if (needsConfirmation) {
          setInfo('Account created! Check your email to confirm, then sign in.');
          setMode('signin');
          return;
        }
        // Auto-signed-in: use the cloud from here on.
        await setStorageMode('supabase');
        toast.success('Account created — cloud sync enabled');
        onClose();
      } else {
        await signIn(email.trim(), password);
        await setStorageMode('supabase');
        toast.success('Signed in — cloud sync enabled');
        onClose();
      }
    } catch {
      // Error is surfaced from the store via `error`.
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out — data stays on this device');
    onClose();
  };

  const handleSyncNow = async () => {
    try {
      await syncNow();
      toast.success('Data synced to the cloud');
    } catch {
      /* error surfaced via store */
    }
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-panel max-w-md flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/[0.07]">
          <div className="flex items-center space-x-2">
            <Cloud className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
              {user ? 'Account' : 'Cloud Sync'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!isSupabaseConfigured ? (
            <div className="flex items-start space-x-3 rounded-xl border border-amber-200/70 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-500/10">
              <CloudOff className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <p className="font-medium">Cloud sync isn't set up for this build.</p>
                <p className="mt-1">
                  Your data is safely stored locally on this device. To enable
                  cloud sync, add your Supabase credentials to a <code>.env</code>{' '}
                  file (see <code>.env.example</code>) and rebuild.
                </p>
              </div>
            </div>
          ) : user ? (
            /* ---------- Signed-in account view ---------- */
            <div className="space-y-5">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as</p>
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {storageMode === 'supabase' ? (
                      <Cloud className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <CloudOff className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {storageMode === 'supabase' ? 'Cloud storage on' : 'Local storage'}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setStorageMode(storageMode === 'supabase' ? 'local' : 'supabase')
                    }
                    className="link"
                  >
                    {storageMode === 'supabase' ? 'Switch to local' : 'Use cloud'}
                  </button>
                </div>
                {storageMode === 'supabase' && (
                  <button
                    onClick={handleSyncNow}
                    disabled={syncing}
                    className="btn-secondary mt-3 w-full py-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? 'Syncing…' : 'Sync now'}</span>
                  </button>
                )}
              </div>

              {error && <ErrorText message={error} />}

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="flex w-full items-center justify-center space-x-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:pointer-events-none disabled:opacity-50 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            /* ---------- Sign in / sign up form ---------- */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
                <TabButton active={mode === 'signin'} onClick={() => setMode('signin')}>
                  Sign In
                </TabButton>
                <TabButton active={mode === 'signup'} onClick={() => setMode('signup')}>
                  Sign Up
                </TabButton>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                {mode === 'signin'
                  ? 'Sign in to sync your workouts across devices.'
                  : 'Create an account to back up and sync your data in the cloud.'}
              </p>

              <div>
                <label className="label">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="input pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="input pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((show) => !show)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {info && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">{info}</p>
              )}
              {error && <ErrorText message={error} />}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full space-x-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === 'signin' ? (
                  <LogIn className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-300 shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function ErrorText({ message }: { message: string }) {
  return <p className="text-sm text-red-600 dark:text-red-400">{message}</p>;
}
