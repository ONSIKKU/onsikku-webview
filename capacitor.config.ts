/// <reference types="@capacitor/push-notifications" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.onsikku.app',
  appName: '온식구',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },

  // ✅ iOS: 앱이 포그라운드일 때도 알림 표시(배지/사운드/얼럿)
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
