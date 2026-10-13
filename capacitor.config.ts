import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.notfree.app',
  appName: 'NotFree',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    preferredContentMode: 'mobile',
    scheme: 'NotFree',
  },
};

export default config;
