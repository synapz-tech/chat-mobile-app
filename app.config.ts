import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    name: 'Synapz Chat',
    slug: process.env.EXPO_PUBLIC_APP_SLUG || 'synapz-chat',
    version: '4.1.2',
    orientation: 'portrait',
    icon: './assets/icon-new.png',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    notification: {
      icon: './assets/notification-image.png',
    },
    scheme: 'chatwootapp',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
      enableFullScreenImage_legacy: true,
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.synapz.chat',
      infoPlist: {
        NSCameraUsageDescription:
          'O aplicativo usa a câmera para tirar fotos e gravar vídeos que podem ser enviados nas conversas de atendimento com o suporte.',
        NSPhotoLibraryUsageDescription:
          'O aplicativo acessa sua galeria para permitir o envio de imagens existentes nas conversas com o suporte.',
        NSMicrophoneUsageDescription:
          'O aplicativo utiliza o microfone para gravar áudios e enviá-los nas conversas de atendimento.',
        NSAppleMusicUsageDescription:
          'This app does not use Apple Music, but a system API may require this permission.',
        UIBackgroundModes: ['fetch', 'remote-notification'],
        ITSAppUsesNonExemptEncryption: false,
      },
      // Please use the relative path to the google-services.json file
      googleServicesFile: process.env.EXPO_PUBLIC_IOS_GOOGLE_SERVICES_FILE,
      entitlements: { 'aps-environment': 'production' },
      associatedDomains: ['applinks:chat.synapz.tech'],
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon-new.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.synapz.chat',
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.RECORD_AUDIO',
        'android.permission.READ_MEDIA_IMAGES',
      ],
      // Please use the relative path to the google-services.json file
      googleServicesFile: process.env.EXPO_PUBLIC_ANDROID_GOOGLE_SERVICES_FILE,
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'chat.synapz.tech',
              pathPrefix: '/app/accounts/',
              pathPattern: '/*/conversations/*',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          data: [
            {
              scheme: 'chatwootapp',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    extra: {
      eas: {
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || '8333f67c-4e5c-473b-91d3-31ffc09234a7',
        storybookEnabled: process.env.EXPO_STORYBOOK_ENABLED,
      },
    },
    // owner: 'synapz-chat', // Comentado temporariamente para build local
    plugins: [
      'expo-font',
      ['react-native-permissions', { iosPermissions: ['Camera', 'PhotoLibrary', 'MediaLibrary'] }],
      // [
      //   '@sentry/react-native/expo',
      //   {
      //     url: 'https://sentry.io/',
      //     project: process.env.EXPO_PUBLIC_SENTRY_PROJECT_NAME,
      //     organization: process.env.EXPO_PUBLIC_SENTRY_ORG_NAME,
      //   },
      // ], // Comentado temporariamente para build local
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
      [
        'expo-build-properties',
        {
          // https://github.com/invertase/notifee/issues/808#issuecomment-2175934609
          android: {
            minSdkVersion: 24,
            compileSdkVersion: 35,
            targetSdkVersion: 34,
            enableProguardInReleaseBuilds: true,
          },
          ios: { useFrameworks: 'static' },
        },
      ],
      './with-ffmpeg-pod.js',
    ],
    androidNavigationBar: { backgroundColor: '#ffffff' },
  };
};
