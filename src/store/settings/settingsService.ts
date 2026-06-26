import axios from 'axios';
import { apiService } from '@/services/APIService';
import type {
  NotificationSettings,
  NotificationSettingsPayload,
  PushPayload,
  RemoveDevicePayload,
} from './settingsTypes';

export class SettingsService {
  static async verifyInstallationUrl(url: string): Promise<boolean> {
    try {
      await axios.get(`${url}api`);
      return true;
    } catch {
      return false;
    }
  }

  static async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await apiService.get<NotificationSettings>('notification_settings');
    return response.data;
  }

  static async updateNotificationSettings(
    payload: NotificationSettingsPayload,
  ): Promise<NotificationSettings> {
    const response = await apiService.put<NotificationSettings>('notification_settings', payload);
    return response.data;
  }

  static async getChatwootVersion(installationUrl: string): Promise<{ version: string }> {
    if (!installationUrl) {
      return { version: '' };
    }
    // Normalize to avoid building an invalid URL (e.g. "https://host.comapi")
    // when installationUrl has no trailing slash.
    const baseUrl = installationUrl.endsWith('/') ? installationUrl : `${installationUrl}/`;
    const response = await axios.get(`${baseUrl}api`);
    return response.data;
  }

  static async saveDeviceDetails(payload: PushPayload): Promise<{ fcmToken: string }> {
    const response = await apiService.post<{ fcmToken: string }>(
      'notification_subscriptions',
      payload,
    );
    return response.data;
  }

  static async removeDevice(payload: RemoveDevicePayload): Promise<void> {
    await apiService.delete('notification_subscriptions', { data: payload });
  }
}
