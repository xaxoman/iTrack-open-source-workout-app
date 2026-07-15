import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workout, WorkoutTemplate, EquipmentItem, WeightEntry } from '../types/workout';

export interface NotificationSettings {
  enabled: boolean;
  days: string[];
  time: string;
}

export interface UserProfile {
  height: number; // in centimeters
  weight: number; // in kilograms
  age: number;
  gender: 'MALE' | 'FEMALE';
  neckCm?: number;
  waistCm?: number;
  bmi?: number;
  bmiCategory?: string;
  bodyFatPercentage?: number;
  bodyFatMethod?: string;
}

/** Config + inputs for the AI Coach feature. */
export interface AICoachConfig {
  /** Device-local Gemini API key (never included in cloud sync). */
  apiKey: string;
  /** Gemini model id, e.g. 'gemini-3.5-flash'. */
  model: string;
  /** Reasoning effort for Gemini 3 models (thinkingLevel). */
  thinkingLevel: 'low' | 'high';
}

interface WorkoutStore {
  workouts: Workout[];
  templates: WorkoutTemplate[];
  activeWorkout: Workout | null;
  isWorkoutActive: boolean;
  darkMode: boolean;
  notificationSettings: NotificationSettings;
  userProfile: UserProfile | null;
  /** Body-weight log, kept sorted by date ascending, one entry per day. */
  weightLog: WeightEntry[];
  // --- AI Coach ---
  aiCoach: AICoachConfig;
  equipment: EquipmentItem[];
  /** Current working weight (kg) per exercise name. */
  exerciseWeights: Record<string, number>;
  /** Whether the first-time equipment/weights onboarding is done. */
  aiOnboarded: boolean;
  addWorkout: (workout: Workout) => void;
  updateWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
  setActiveWorkout: (workout: Workout | null) => void;
  setIsWorkoutActive: (active: boolean) => void;
  toggleDarkMode: () => void;
  addTemplate: (template: WorkoutTemplate) => void;
  updateTemplate: (template: WorkoutTemplate) => void;
  deleteTemplate: (id: string) => void;
  updateNotificationSettings: (settings: NotificationSettings) => void;
  updateUserProfile: (profile: UserProfile) => void;
  addWeightEntry: (entry: WeightEntry) => void;
  deleteWeightEntry: (id: string) => void;
  setAICoachConfig: (config: Partial<AICoachConfig>) => void;
  updateEquipment: (equipment: EquipmentItem[]) => void;
  updateExerciseWeights: (weights: Record<string, number>) => void;
  setAiOnboarded: (onboarded: boolean) => void;
  importData: (data: Partial<WorkoutStore>) => void;
}

const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';
// Models known to be retired/unavailable for new keys or paid-only — existing
// installs on these get moved to the current default via the persist migration.
const STALE_MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-flash-latest'];

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set) => ({
      workouts: [],
      templates: [],
      activeWorkout: null,
      isWorkoutActive: false,
      darkMode: false,
      notificationSettings: {
        enabled: true,
        days: ['monday', 'wednesday', 'friday'],
        time: '18:00'
      },
      userProfile: null,
      weightLog: [],
      aiCoach: { apiKey: '', model: DEFAULT_GEMINI_MODEL, thinkingLevel: 'high' },
      equipment: [],
      exerciseWeights: {},
      aiOnboarded: false,
      addWorkout: (workout) =>
        set((state) => ({ workouts: [...state.workouts, workout] })),
      updateWorkout: (workout) =>
        set((state) => ({
          workouts: state.workouts.map((w) => (w.id === workout.id ? workout : w)),
        })),
      deleteWorkout: (id) =>
        set((state) => ({
          workouts: state.workouts.filter((w) => w.id !== id),
        })),
      setActiveWorkout: (workout) => set({ activeWorkout: workout }),
      setIsWorkoutActive: (active) => set({ isWorkoutActive: active }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      addTemplate: (template) =>
        set((state) => ({
          templates: [...state.templates, {
            ...template,
            numberOfSets: template.numberOfSets || 1 // Default to 1 if not provided
          }],
        })),
      updateTemplate: (template) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === template.id ? {
              ...template,
              numberOfSets: template.numberOfSets || 1 // Default to 1 if not provided
            } : t
          ),
        })),
      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),
      updateNotificationSettings: (settings) =>
        set({ notificationSettings: settings }),
      updateUserProfile: (profile) =>
        set({ userProfile: profile }),
      addWeightEntry: (entry) =>
        set((state) => {
          // One measurement per calendar day: a new entry for the same day
          // replaces the old one (like editing the value in a plan table).
          const day = entry.date.slice(0, 10);
          const rest = state.weightLog.filter((e) => e.date.slice(0, 10) !== day);
          return {
            weightLog: [...rest, entry].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            ),
          };
        }),
      deleteWeightEntry: (id) =>
        set((state) => ({
          weightLog: state.weightLog.filter((e) => e.id !== id),
        })),
      setAICoachConfig: (config) =>
        set((state) => ({ aiCoach: { ...state.aiCoach, ...config } })),
      updateEquipment: (equipment) => set({ equipment }),
      updateExerciseWeights: (weights) =>
        set((state) => ({ exerciseWeights: { ...state.exerciseWeights, ...weights } })),
      setAiOnboarded: (onboarded) => set({ aiOnboarded: onboarded }),
      importData: (data) =>
        set((state) => ({
          workouts: data.workouts || state.workouts,
          templates: data.templates || state.templates,
          userProfile: data.userProfile || state.userProfile,
          weightLog: data.weightLog || state.weightLog,
          notificationSettings: data.notificationSettings || state.notificationSettings,
          darkMode: data.darkMode ?? state.darkMode,
          // AI Coach user data (equipment/weights) syncs; the API key stays local.
          equipment: data.equipment || state.equipment,
          exerciseWeights: data.exerciseWeights || state.exerciseWeights,
          aiOnboarded: data.aiOnboarded ?? state.aiOnboarded,
        })),
    }),
    {
      name: 'workout-storage',
      version: 3,
      migrate: (persisted, version) => {
        const state = persisted as Partial<WorkoutStore> | undefined;
        // Move known-stale default models to the current default, and backfill
        // thinkingLevel for installs that predate it. Only rewrites stale
        // defaults, never a deliberate custom model choice.
        if (version < 3 && state?.aiCoach) {
          const ai = state.aiCoach as Partial<AICoachConfig>;
          state.aiCoach = {
            apiKey: ai.apiKey ?? '',
            model: STALE_MODELS.includes(ai.model ?? '')
              ? DEFAULT_GEMINI_MODEL
              : ai.model ?? DEFAULT_GEMINI_MODEL,
            thinkingLevel: ai.thinkingLevel ?? 'high',
          };
        }
        return state as WorkoutStore;
      },
    }
  )
);