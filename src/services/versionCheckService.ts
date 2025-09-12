import i18n from '@/i18n';
import remoteConfig from '@react-native-firebase/remote-config';
import * as Application from 'expo-application';
import { Alert } from 'react-native';

export interface VersionCheckResult {
  isVersionSupported: boolean;
  minVersion: string;
  currentVersion: string;
}

export class VersionCheckService {
  private static MIN_VERSION_KEY = 'min_app_version';

  /**
   * Initializes Firebase Remote Config with default values
   */
  static async initialize(): Promise<void> {
    try {
      // Set default values
      await remoteConfig().setDefaults({
        [this.MIN_VERSION_KEY]: '0.0.0',
      });

      // Set config settings
      await remoteConfig().setConfigSettings({
        minimumFetchIntervalMillis: 300000, // 5 minutes
      });

      // Fetch and activate remote config
      await remoteConfig().fetchAndActivate();
    } catch (error) {
      console.error('Error initializing Remote Config:', error);
    }
  }

  /**
   * Checks if the current app version meets the minimum required version
   */
  static async checkVersion(): Promise<VersionCheckResult> {
    try {
      const currentVersion = Application.nativeApplicationVersion || '0.0.0';
      const minVersion = remoteConfig().getValue(this.MIN_VERSION_KEY).asString();

      const isVersionSupported = this.compareVersions(currentVersion, minVersion) >= 0;

      return {
        isVersionSupported,
        minVersion,
        currentVersion,
      };
    } catch (error) {
      console.error('Error checking version:', error);
      // In case of error, allow the user to continue
      return {
        isVersionSupported: true,
        minVersion: '0.0.0',
        currentVersion: Application.nativeApplicationVersion || '0.0.0',
      };
    }
  }

  /**
   * Shows version update alert
   */
  static showVersionUpdateAlert(minVersion: string): void {
    Alert.alert(
      i18n.t('VERSION_CHECK.TITLE'),
      i18n.t('VERSION_CHECK.MESSAGE', { version: minVersion }),
      [
        {
          text: i18n.t('VERSION_CHECK.OK'),
          style: 'default',
        },
      ],
      { cancelable: false },
    );
  }

  /**
   * Compares two version strings
   * Returns: 1 if version1 > version2, -1 if version1 < version2, 0 if equal
   */
  private static compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    const maxLength = Math.max(v1Parts.length, v2Parts.length);

    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }

    return 0;
  }
}
