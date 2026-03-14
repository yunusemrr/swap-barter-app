import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swapbarter.app',
  appName: 'Swap-barter-app',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
  },
  server: {
    iosScheme: 'https',
    allowNavigation: [
      '*.firebaseapp.com',
      '*.googleapis.com',
      '*.firebase.com',
      '*.firestore.googleapis.com',
      '*.firebasestorage.app'
    ]
  }
};

export default config;