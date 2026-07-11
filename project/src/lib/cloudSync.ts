import { supabase, USER_DATA_TABLE } from './supabase';
import { useWorkoutStore } from '../store/useWorkoutStore';
import type { NotificationSettings, UserProfile } from '../store/useWorkoutStore';
import type { Workout, WorkoutTemplate } from '../types/workout';

/**
 * The shape of the app data we persist to the cloud. It mirrors exactly what
 * the "Export Data" feature writes to a local JSON file, so local and cloud
 * storage stay interchangeable.
 */
export interface SyncableData {
  workouts: Workout[];
  templates: WorkoutTemplate[];
  userProfile: UserProfile | null;
  notificationSettings: NotificationSettings;
  darkMode: boolean;
}

/** Read the syncable slice of the current store state. */
export function getSyncableData(): SyncableData {
  const state = useWorkoutStore.getState();
  return {
    workouts: state.workouts,
    templates: state.templates,
    userProfile: state.userProfile,
    notificationSettings: state.notificationSettings,
    darkMode: state.darkMode,
  };
}

/** Upsert the current local data to the signed-in user's cloud row. */
export async function pushDataToCloud(userId: string): Promise<void> {
  if (!supabase) throw new Error('Cloud storage is not configured.');

  const { error } = await supabase.from(USER_DATA_TABLE).upsert(
    {
      user_id: userId,
      data: getSyncableData(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) throw error;
}

/**
 * Fetch the user's cloud data. Returns null when the user has no row yet
 * (i.e. their first time signing in on this device / account).
 */
export async function pullDataFromCloud(userId: string): Promise<SyncableData | null> {
  if (!supabase) throw new Error('Cloud storage is not configured.');

  const { data, error } = await supabase
    .from(USER_DATA_TABLE)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return (data.data as SyncableData) ?? null;
}
