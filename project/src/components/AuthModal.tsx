import { useEffect, useState } from 'react';
import { Check, CheckCircle2, CloudOff, Eye, EyeOff, Loader2, Minus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Sheet } from './ui';
import { useAuthStore } from '../store/useAuthStore';
import { isSupabaseConfigured } from '../lib/supabase';
import { useI18n } from '../i18n';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'signin' | 'signup';

/** Optional Supabase account: sign in / up, or manage sync when signed in. */
export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { t } = useI18n();
  const { user, storageMode, loading, syncing, error, signIn, signUp, signOut, setStorageMode, syncNow, clearError } = useAuthStore();

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo(null);
    try {
      if (mode === 'signup') {
        const { needsConfirmation } = await signUp(email.trim(), password);
        if (needsConfirmation) {
          setInfo(t('auth.checkEmail'));
          setMode('signin');
          return;
        }
        await setStorageMode('supabase');
        toast.success(t('auth.createdToast'));
      } else {
        await signIn(email.trim(), password);
        await setStorageMode('supabase');
        toast.success(t('auth.signedInToast'));
      }
      onClose();
    } catch {
      // Surfaced through `error` from the store.
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success(t('auth.signedOutToast'));
    onClose();
  };

  const handleSync = async () => {
    try {
      await syncNow();
      toast.success(t('auth.syncedToast'));
    } catch {
      /* surfaced via store */
    }
  };

  const synced = [t('auth.syncWorkouts'), t('auth.syncRoutines'), t('auth.syncNotes'), t('auth.syncWeight'), t('auth.syncProfile'), t('auth.syncEquipment')];

  return (
    <Sheet open={isOpen} onClose={onClose} title={user ? t('auth.accountTitle') : t('auth.title')} subtitle={user ? undefined : t('auth.optional')}>
      <div className="px-6">
        {!isSupabaseConfigured ? (
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-[14px] text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <CloudOff className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">{t('auth.notConfiguredTitle')}</p>
              <p className="mt-1">{t('auth.notConfiguredBody')}</p>
            </div>
          </div>
        ) : user ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <div className="min-w-0">
                <p className="text-[13px] text-gray-500 dark:text-gray-400">{t('auth.signedInAs')}</p>
                <p className="truncate font-medium text-gray-900 dark:text-white">{user.email}</p>
              </div>
            </div>
            <div className="group-list">
              <div className="flex items-center justify-between px-4 py-3 text-[15px]">
                <span className="text-gray-900 dark:text-white">{storageMode === 'supabase' ? t('auth.cloudOn') : t('auth.localOnly')}</span>
                <button onClick={() => setStorageMode(storageMode === 'supabase' ? 'local' : 'supabase')} className="text-[14px] font-medium text-indigo-600 dark:text-indigo-400">
                  {storageMode === 'supabase' ? t('auth.switchLocal') : t('auth.useCloud')}
                </button>
              </div>
              {storageMode === 'supabase' && (
                <button onClick={handleSync} disabled={syncing} className="flex w-full items-center gap-2 px-4 py-3 text-[15px] text-gray-900 disabled:opacity-60 dark:text-white">
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? t('auth.syncing') : t('auth.syncNow')}
                </button>
              )}
            </div>
            {error && <p className="text-[14px] text-red-600 dark:text-red-400">{error}</p>}
            <button onClick={handleSignOut} disabled={loading} className="pill w-full bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400">
              {t('auth.signOut')}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-3">
            <p className="text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">{t('auth.intro')}</p>
            <div className="mt-5 space-y-4">
              <label className="relative block rounded-xl border hairline px-4 pb-2.5 pt-4 focus-within:border-indigo-600 dark:focus-within:border-indigo-400">
                <span className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">{t('auth.email')}</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none dark:text-white dark:placeholder:text-gray-600"
                />
              </label>
              <label className="relative flex items-center rounded-xl border hairline px-4 pb-2.5 pt-4 focus-within:border-indigo-600 dark:focus-within:border-indigo-400">
                <span className="absolute -top-2 left-3 bg-white px-1 text-[11px] font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">{t('auth.password')}</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordHint')}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-300 focus:outline-none dark:text-white dark:placeholder:text-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </label>
            </div>
            {info && <p className="mt-3 text-[14px] text-emerald-600 dark:text-emerald-400">{info}</p>}
            {error && <p className="mt-3 text-[14px] text-red-600 dark:text-red-400">{error}</p>}
            <div className="mt-5 space-y-2.5">
              <button type="submit" disabled={loading} className="pill-primary w-full">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
              </button>
              <button type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="pill-secondary w-full">
                {mode === 'signin' ? t('auth.createAccount') : t('auth.haveAccount')}
              </button>
            </div>
            <div className="mt-6 border-t hairline pt-4">
              <p className="cap">{t('auth.whatSyncs')}</p>
              <div className="mt-2 grid grid-cols-2 gap-y-1.5 text-[13px] text-gray-700 dark:text-gray-300">
                {synced.map((s) => (
                  <span key={s} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
                    {s}
                  </span>
                ))}
                <span className="col-span-2 flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                  <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {t('auth.keyStays')}
                </span>
              </div>
            </div>
          </form>
        )}
      </div>
    </Sheet>
  );
}
