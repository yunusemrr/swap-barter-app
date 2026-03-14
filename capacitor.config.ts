import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swapbarter.app',
  appName: 'Swap-barter-app',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: false,
  },
  server: {
    iosScheme: 'app',
    allowNavigation: ['*']
  }
};

export default config;