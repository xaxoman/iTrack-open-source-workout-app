import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { pushDataToCloud, pullDataFromCloud } from '../lib/cloudSync';
import { useWorkoutStore } from './useWorkoutStore';

export type StorageMode = 'local' | 'supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  /** Where the user's data lives: local JSON (localStorage) or Supabase cloud. */
  storageMode: StorageMode;
  /** True once the initial session lookup + listener are set up. */
  initialized: boolean;
  /** An auth request (sign in / up / out) is in flight. */
  loading: boolean;
  /** A cloud read/write is in flight. */
  syncing: boolean;
  lastSyncedAt: number | null;
  error: string | null;

  init: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setStorageMode: (mode: StorageMode) => Promise<void>;
  /** Push the current local data up to the cloud (manual "Sync now"). */
  syncNow: () => Promise<void>;
  clearError: () => void;
}

// Debounced auto-push machinery (module scoped, not part of persisted state).
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
let suppressAutoSave = false;
let subscribed = false;

function scheduleAutoSave() {
  const { storageMode, user } = useAuthStore.getState();
  if (storageMode !== 'supabase' || !user || suppressAutoSave) return;

  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    useAuthStore.getState().syncNow().catch((err) => {
      console.error('Auto cloud sync failed:', err);
    });
  }, 1500);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      storageMode: 'local',
      initialized: false,
      loading: false,
      syncing: false,
      lastSyncedAt: null,
      error: null,

      init: async () => {
        // Auto-save local changes to the cloud whenever we're in cloud mode.
        if (!subscribed) {
          subscribed = true;
          useWorkoutStore.subscribe(() => scheduleAutoSave());
        }

        if (!isSupabaseConfigured || !supabase) {
          set({ initialized: true, storageMode: 'local' });
          return;
        }

        const { data } = await supabase.auth.getSession();
        set({
          session: data.session,
          user: data.session?.user ?? null,
          initialized: true,
        });

        // Pull cloud data on first load if we're signed in and using the cloud.
        if (data.session?.user && get().storageMode === 'supabase') {
          await reconcileWithCloud(data.session.user.id);
        }

        supabase.auth.onAuthStateChange((event, session) => {
          set({ session, user: session?.user ?? null });
          if (event === 'SIGNED_IN' && session?.user && get().storageMode === 'supabase') {
            reconcileWithCloud(session.user.id).catch((err) =>
              console.error('Cloud reconcile failed:', err)
            );
          }
        });
      },

      signUp: async (email, password) => {
        if (!supabase) throw new Error('Cloud storage is not configured.');
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signUp({ email, password });
          if (error) throw error;
          // When email confirmation is enabled there is no session yet.
          return { needsConfirmation: !data.session };
        } catch (err) {
          set({ error: messageFrom(err) });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      signIn: async (email, password) => {
        if (!supabase) throw new Error('Cloud storage is not configured.');
        set({ loading: true, error: null });
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        } catch (err) {
          set({ error: messageFrom(err) });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      signOut: async () => {
        if (!supabase) return;
        set({ loading: true, error: null });
        try {
          await supabase.auth.signOut();
          // Fall back to local storage so the app keeps working while signed out.
          set({ session: null, user: null, storageMode: 'local' });
        } finally {
          set({ loading: false });
        }
      },

      setStorageMode: async (mode) => {
        if (mode === 'supabase') {
          if (!isSupabaseConfigured) {
            set({ error: 'Cloud storage is not configured for this build.' });
            return;
          }
          set({ storageMode: 'supabase', error: null });
          const user = get().user;
          // If already signed in, reconcile immediately; otherwise the AuthModal
          // prompts the user to sign in and reconcile happens on SIGNED_IN.
          if (user) await reconcileWithCloud(user.id);
        } else {
          set({ storageMode: 'local', error: null });
        }
      },

      syncNow: async () => {
        const { user, storageMode } = get();
        if (storageMode !== 'supabase' || !user) return;
        set({ syncing: true, error: null });
        try {
          await pushDataToCloud(user.id);
          set({ lastSyncedAt: Date.now() });
        } catch (err) {
          set({ error: messageFrom(err) });
          throw err;
        } finally {
          set({ syncing: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      // Only remember the user's storage preference; the Supabase SDK manages
      // its own session persistence separately.
      partialize: (state) => ({ storageMode: state.storageMode }),
    }
  )
);

/**
 * Reconcile local and cloud data when entering cloud mode / signing in:
 * - If the cloud already has data, pull it down (cloud is the source of truth).
 * - If the cloud is empty, push the current local data up so nothing is lost.
 */
async function reconcileWithCloud(userId: string) {
  useAuthStore.setState({ syncing: true, error: null });
  try {
    const cloudData = await pullDataFromCloud(userId);
    if (cloudData) {
      suppressAutoSave = true;
      useWorkoutStore.getState().importData(cloudData);
      suppressAutoSave = false;
    } else {
      await pushDataToCloud(userId);
    }
    useAuthStore.setState({ lastSyncedAt: Date.now() });
  } catch (err) {
    useAuthStore.setState({ error: messageFrom(err) });
  } finally {
    suppressAutoSave = false;
    useAuthStore.setState({ syncing: false });
  }
}

function messageFrom(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Something went wrong. Please try again.';
}
