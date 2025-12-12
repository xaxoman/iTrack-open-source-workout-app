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
        await LocalNotifications.createChannel({
          id: 'workout_reminders',
          name: 'Workout Reminders',
          description: 'Reminders to workout',
          importance: 5,
          visibility: 1,
          vibration: true,
        });
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
            },
            allowWhileIdle: true,
            repeats: true,
          },
          channelId: 'workout_reminders',
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
