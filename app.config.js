module.exports = {
  expo: {
    name: 'LiveNote',
    slug: 'livenote',
    scheme: 'livenote',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0A0E1A',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.livenote.app',
      buildNumber: '1.0.0',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0A0E1A',
      },
      package: 'com.livenote.app',
      versionCode: 1,
    },
    plugins: [
      'expo-notifications',
      'expo-secure-store',
      'expo-asset',
      [
        'expo-calendar',
        {
          calendarPermission:
            'LiveNote liest deinen Kalender, um Termine anzuzeigen. Deine Daten bleiben auf deinem Gerät.',
        },
      ],
    ],
    extra: {
      SUPABASE_URL:      process.env.EXPO_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      ANTHROPIC_API_KEY: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
    },
  },
};
