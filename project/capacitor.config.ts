import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iTrack.app',
  appName: 'iTrack workout tracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    webContentsDebuggingEnabled: true
  }
};

export default config;