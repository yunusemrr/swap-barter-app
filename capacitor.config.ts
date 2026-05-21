import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swapbarter.app',
  appName: 'Swap Barter',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: false,
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'app',
    allowNavigation: [
      'localhost',
      '*.firebaseio.com',
      '*.googleapis.com',
      '*.firebaseapp.com',
      '*'
    ]
  }
};

export default config;