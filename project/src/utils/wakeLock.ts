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
      // Request a screen wake lock
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      
      console.log('Wake Lock is active');
      
      // Release wake lock if page visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
      console.log('Wake Lock API not supported in this browser');
    }
  } catch (err) {
    console.error(`Error requesting wake lock: ${err}`);
  }
};

// Function to release the wake lock
export const releaseWakeLock = async (): Promise<void> => {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
      console.log('Wake Lock released');
      
      // Remove event listener
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    } catch (err) {
      console.error(`Error releasing wake lock: ${err}`);
    }
  }
};

// Handle visibility change events to manage wake lock
const handleVisibilityChange = async (): Promise<void> => {
  if (document.visibilityState === 'visible' && !wakeLockSentinel) {
    // If the page is visible and there's no wake lock, request one
    await requestWakeLock();
  }
};

// Auto-request wake lock when the script is imported
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    await requestWakeLock();
  });
}
