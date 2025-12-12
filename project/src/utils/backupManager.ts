import { Filesystem, Directory, Encoding, FileInfo } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { useWorkoutStore } from '../store/useWorkoutStore';
import toast from 'react-hot-toast';

const BACKUP_DIR = 'backups';
const MAX_BACKUPS = 2;
const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const backupManager = {
  /**
   * Initialize the backup scheduler.
   * Should be called when the app starts.
   */
  init: async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log('Auto-backup skipped: Not running on a native platform');
      return;
    }

    try {
      await backupManager.ensureBackupDir();
      await backupManager.checkAndPerformBackup();
    } catch (error) {
      console.error('Failed to initialize backup manager:', error);
    }
  },

  /**
   * Ensure the backup directory exists
   */
  ensureBackupDir: async () => {
    try {
      await Filesystem.readdir({
        path: BACKUP_DIR,
        directory: Directory.Documents,
      });
    } catch (e) {
      // Directory likely doesn't exist, try to create it
      await Filesystem.mkdir({
        path: BACKUP_DIR,
        directory: Directory.Documents,
        recursive: true,
      });
    }
  },

  /**
   * Check if a backup is needed and perform it if so
   */
  checkAndPerformBackup: async () => {
    try {
      const files = await backupManager.getBackupFiles();
      const sortedFiles = backupManager.sortFilesByDate(files);

      const lastBackup = sortedFiles[0];
      const now = Date.now();

      let shouldBackup = false;

      if (!lastBackup) {
        shouldBackup = true;
      } else {
        const lastBackupTime = backupManager.getTimestampFromFilename(lastBackup.name);
        if (now - lastBackupTime > BACKUP_INTERVAL_MS) {
          shouldBackup = true;
        }
      }

      if (shouldBackup) {
        console.log('Performing auto-backup...');
        await backupManager.createBackup();
        await backupManager.pruneBackups();
        toast.success('Backup completed', {
          position: 'top-center',
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      } else {
        console.log('Skipping auto-backup: Last backup is recent enough');
      }
    } catch (error) {
      console.error('Error during backup check:', error);
    }
  },

  /**
   * Create a new backup file with current store data
   */
  createBackup: async () => {
    const state = useWorkoutStore.getState();
    // Extract only the data we want to save (exclude functions)
    const dataToSave = {
      workouts: state.workouts,
      templates: state.templates,
      userProfile: state.userProfile,
      notificationSettings: state.notificationSettings,
      darkMode: state.darkMode,
      timestamp: new Date().toISOString(),
    };

    const timestamp = Date.now();
    const filename = `${BACKUP_DIR}/itrack-backup-${timestamp}.json`;

    await Filesystem.writeFile({
      path: filename,
      data: JSON.stringify(dataToSave, null, 2),
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });

    console.log(`Backup created: ${filename}`);
  },

  /**
   * Delete old backups, keeping only the most recent ones
   */
  pruneBackups: async () => {
    const files = await backupManager.getBackupFiles();
    const sortedFiles = backupManager.sortFilesByDate(files);

    if (sortedFiles.length > MAX_BACKUPS) {
      const filesToDelete = sortedFiles.slice(MAX_BACKUPS);
      
      for (const file of filesToDelete) {
        try {
          await Filesystem.deleteFile({
            path: `${BACKUP_DIR}/${file.name}`,
            directory: Directory.Documents,
          });
          console.log(`Deleted old backup: ${file.name}`);
        } catch (error) {
          console.error(`Failed to delete backup ${file.name}:`, error);
        }
      }
    }
  },

  /**
   * Helper to get list of backup files
   */
  getBackupFiles: async (): Promise<FileInfo[]> => {
    try {
      const result = await Filesystem.readdir({
        path: BACKUP_DIR,
        directory: Directory.Documents,
      });
      return result.files.filter(f => f.name.startsWith('itrack-backup-') && f.name.endsWith('.json'));
    } catch (error) {
      return [];
    }
  },

  /**
   * Helper to sort files by timestamp (newest first)
   */
  sortFilesByDate: (files: FileInfo[]) => {
    return files.sort((a, b) => {
      const timeA = backupManager.getTimestampFromFilename(a.name);
      const timeB = backupManager.getTimestampFromFilename(b.name);
      return timeB - timeA;
    });
  },

  /**
   * Extract timestamp from filename (itrack-backup-1234567890.json)
   */
  getTimestampFromFilename: (filename: string): number => {
    try {
      const match = filename.match(/itrack-backup-(\d+)\.json/);
      return match ? parseInt(match[1], 10) : 0;
    } catch {
      return 0;
    }
  }
};
