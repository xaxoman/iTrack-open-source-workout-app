import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { NotificationSettings } from '../store/useWorkoutStore';

export const notificationManager = {
  /**
   * Initialize notifications and request permissions
   */
  init: async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display === 'granted') {
        // Create a new channel with high importance for sound and vibration
        // We use a new ID 'workout_reminders_v2' to ensure settings are updated
        // as Android channels are immutable once created.
        await LocalNotifications.createChannel({
          id: 'workout_reminders_v2',
          name: 'Workout Reminders',
          description: 'Reminders to workout',
          importance: 5, // High importance for sound and peek
          visibility: 1,
          vibration: true,
          sound: 'default', // Explicitly request default sound
        });
        
        // Clean up old channel if it exists
        try {
          await LocalNotifications.deleteChannel({ id: 'workout_reminders' });
        } catch (e) {
          // Ignore error if channel doesn't exist
        }
      }
    } catch (error) {
      console.error('Failed to init notifications:', error);
    }
  },

  /**
   * Schedule notifications based on settings
   */
  schedule: async (settings: NotificationSettings) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Cancel existing notifications first
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
      }

      if (!settings.enabled) return;

      const [hours, minutes] = settings.time.split(':').map(Number);
      const notifications = [];
      const dayMap: { [key: string]: number } = {
        sunday: 1,
        monday: 2,
        tuesday: 3,
        wednesday: 4,
        thursday: 5,
        friday: 6,
        saturday: 7,
      };

      let idCounter = 100;

      for (const day of settings.days) {
        const dayOfWeek = dayMap[day.toLowerCase()];
        if (!dayOfWeek) continue;

        notifications.push({
          id: idCounter++,
          title: 'Time to Workout! 💪',
          body: 'Your scheduled workout time has arrived. Let\'s crush it!',
          schedule: {
            on: {
              weekday: dayOfWeek,
              hour: hours,
              minute: minutes,
              second: 0, // Explicitly set second to 0
            },
            allowWhileIdle: true, // Allow executing even in Doze mode
            repeats: true,
          },
          channelId: 'workout_reminders_v2', // Use the new channel ID
          sound: 'default', // Fallback for some devices
        });
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`Scheduled ${notifications.length} notifications`);
      }
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
    }
  }
};
