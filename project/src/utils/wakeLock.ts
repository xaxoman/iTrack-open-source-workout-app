// Type definition for the experimental WakeLock API
interface WakeLockSentinel {
  release: () => Promise<void>;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
}

// Use type assertion instead of extending Navigator
type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinel>;
  };
}

let wakeLockSentinel: WakeLockSentinel | null = null;

// Function to request a wake lock to prevent screen from turning off
export const requestWakeLock = async (): Promise<void> => {
  try {
    const navigator = window.navigator as NavigatorWithWakeLock;
    
    if ('wakeLock' in navigator && navigator.wakeLock) {
      // Release existing wake lock if any
      if (wakeLockSentinel) {
        try {
          await wakeLockSentinel.release();
        } catch (err) {
          console.warn('Error releasing existing wake lock:', err);
        }
        wakeLockSentinel = null;
      }
      
      // Request a new screen wake lock
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      
      console.log('Wake Lock is active');
      
      // Add event listener for when wake lock is released by the system
      wakeLockSentinel.addEventListener('release', () => {
        console.log('Wake Lock was released by the system');
        wakeLockSentinel = null;
      });
      
      // Only add visibility change listener once
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
      console.log('Wake Lock API not supported in this browser');
    }
  } catch (err) {
    console.error(`Error requesting wake lock: ${err}`);
    wakeLockSentinel = null;
  }
};

// Function to release the wake lock
export const releaseWakeLock = async (): Promise<void> => {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
      console.log('Wake Lock released');
    } catch (err) {
      console.warn(`Error releasing wake lock: ${err}`);
    } finally {
      wakeLockSentinel = null;
    }
  }
};

// Handle visibility change events to manage wake lock
const handleVisibilityChange = async (): Promise<void> => {
  if (document.visibilityState === 'visible') {
    // When page becomes visible (user returns to app), always try to request wake lock
    // The wake lock might have been automatically released by the system
    console.log('Page became visible, re-requesting wake lock');
    // Add a small delay to ensure the app is fully focused
    setTimeout(async () => {
      await requestWakeLock();
    }, 100);
  } else {
    // When page becomes hidden (user switches apps), don't release wake lock
    // Let the system handle it automatically to maintain better user experience
    console.log('Page became hidden, keeping wake lock active');
  }
};

// Auto-request wake lock when the script is imported
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    await requestWakeLock();
  });
}

// Function to enable wake lock for workouts (more aggressive)
export const enableWorkoutWakeLock = async (): Promise<void> => {
  console.log('Enabling workout wake lock');
  await requestWakeLock();
  
  // Add additional listeners for workout mode
  const handleFocus = async () => {
    console.log('Window focused during workout, ensuring wake lock');
    // Add a small delay to ensure the app is fully active
    setTimeout(async () => {
      await requestWakeLock();
    }, 200);
  };
  
  const handleBlur = () => {
    console.log('Window blurred during workout');
    // Don't release wake lock on blur during workouts, just log it
  };

  // Handle page show event (important for mobile browsers)
  const handlePageShow = async (event: PageTransitionEvent) => {
    console.log('Page show event during workout, event.persisted:', event.persisted);
    // Always re-request wake lock when page is shown
    setTimeout(async () => {
      await requestWakeLock();
    }, 100);
  };

  // Handle orientation change (mobile devices)
  const handleOrientationChange = async () => {
    console.log('Orientation changed during workout, re-requesting wake lock');
    setTimeout(async () => {
      await requestWakeLock();
    }, 300);
  };

  // Handle resume from background (mobile apps)
  const handleResume = async () => {
    console.log('App resumed during workout, ensuring wake lock');
    await requestWakeLock();
  };
  
  window.addEventListener('focus', handleFocus);
  window.addEventListener('blur', handleBlur);
  window.addEventListener('pageshow', handlePageShow);
  window.addEventListener('orientationchange', handleOrientationChange);
  
  // For Capacitor/Cordova apps
  if ('Capacitor' in window) {
    document.addEventListener('resume', handleResume);
  }
  
  // Store references to remove later
  (window as any).__workoutWakeLockListeners = { 
    handleFocus, 
    handleBlur, 
    handlePageShow, 
    handleOrientationChange,
    handleResume 
  };
};

// Function to disable workout-specific wake lock
export const disableWorkoutWakeLock = async (): Promise<void> => {
  console.log('Disabling workout wake lock');
  
  // Remove workout-specific listeners
  const listeners = (window as any).__workoutWakeLockListeners;
  if (listeners) {
    window.removeEventListener('focus', listeners.handleFocus);
    window.removeEventListener('blur', listeners.handleBlur);
    window.removeEventListener('pageshow', listeners.handlePageShow);
    window.removeEventListener('orientationchange', listeners.handleOrientationChange);
    
    // For Capacitor/Cordova apps
    if ('Capacitor' in window && listeners.handleResume) {
      document.removeEventListener('resume', listeners.handleResume);
    }
    
    delete (window as any).__workoutWakeLockListeners;
  }
  
  // Keep general wake lock for the app, but could release if needed
  // await releaseWakeLock();
};
