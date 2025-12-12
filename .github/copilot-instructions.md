# iTrack AI Coding Instructions

You are working on **iTrack**, an open-source workout tracking application built with **React**, **TypeScript**, **Vite**, and **Capacitor** for Android.

## 🏗 Architecture & Core Concepts

- **Platform Strategy**: Web-first architecture wrapped in Capacitor for Android. The app runs as a SPA (Single Page Application) inside a WebView.
- **State Management**: 
  - Uses **Zustand** (`src/store/useWorkoutStore.ts`) for global state.
  - **Persistence**: Data is saved to `localStorage` via Zustand's `persist` middleware (`workout-storage`).
  - **Key Stores**: `workouts`, `templates`, `activeWorkout`, `userProfile`.
- **Routing**: **React Router DOM v6**.
  - Routes defined in `src/App.tsx`.
  - Uses `future` flags (`v7_startTransition`, `v7_relativeSplatPath`).
- **Styling**: **Tailwind CSS** for all styling.
- **Icons**: **Lucide React**.

## 📂 Directory Structure

- `project/src/store/`: Global state logic (Zustand).
- `project/src/pages/`: Main screens (`Home`, `Workouts`, `Progress`, `Settings`).
- `project/src/components/`: Reusable UI components.
- `project/src/types/`: TypeScript interfaces (`Workout`, `Exercise`, `Set`).
- `project/src/utils/`: Shared utilities (e.g., `wakeLock.ts`).
- `project/android/`: Native Android project files (Gradle, Manifest).
- `project/public/`: Static assets (manifest.json, icons).

## 🛠 Critical Workflows

- **Development**: `npm run dev` (starts Vite server).
- **Build**: `npm run build` (outputs to `dist`).
- **Android Sync**: After building, run `npx cap sync` to update the Android native project with web assets.
- **Linting**: `npm run lint` (ESLint).

## 🧩 Patterns & Conventions

### 1. Wake Lock Management
- **Do not** use a Capacitor plugin for wake lock.
- **Use** the custom utility in `src/utils/wakeLock.ts`.
- Call `requestWakeLock()` on component mount if the screen needs to stay on.
- The utility handles `visibilitychange` events to re-acquire the lock when the app comes to the foreground.

### 2. Data Model (`src/types/workout.ts`)
- **Workouts**: Composed of `Exercise` objects.
- **Exercises**: Can be `reps` based or `time` based.
- **Sets**: Track `weight`, `reps`, and `completed` status.
- **Templates**: Used to spawn new workouts; stored separately from completed workouts.

### 3. Component Structure
- Prefer **functional components** with hooks.
- Use **Tailwind** classes for layout and styling.
- Isolate complex logic into custom hooks (e.g., `useTimer.ts`).

### 4. Android Specifics
- The app ID is `com.iTrack.app`.
- Android scheme is configured to `https` in `capacitor.config.ts`.
- Native build artifacts are in `project/android/app/build/outputs/apk/`.

## ⚠️ Common Pitfalls

- **Persistence**: Changes to the Zustand store schema may require clearing local storage or handling migrations, as `persist` saves the raw state.
- **Wake Lock**: Ensure `releaseWakeLock()` is called in cleanup functions to prevent battery drain.
- **Navigation**: Use `useNavigate` hook for programmatic navigation.
