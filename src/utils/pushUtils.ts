import { Platform } from 'react-native';
import { NOTIFICATION_TYPES } from '@/constants';
import { Notification } from '@/types/Notification';

let notifee: typeof import('@notifee/react-native').default | undefined;

if (Platform.OS === 'ios') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  notifee = require('@notifee/react-native')
    .default as typeof import('@notifee/react-native').default;
}

export const clearAllDeliveredNotifications = async () => {
  if (Platform.OS === 'ios' && notifee) {
    await notifee.cancelAllNotifications();
  }
};

export const updateBadgeCount = async ({ count = 0 }) => {
  if (Platform.OS === 'ios' && count >= 0 && notifee) {
    await notifee.setBadgeCount(count);
  }
};

export const findConversationLinkFromPush = ({
  notification,
  installationUrl,
}: {
  notification: Notification;
  installationUrl: string;
}) => {
  const { notificationType } = notification;

  if (NOTIFICATION_TYPES.includes(notificationType)) {
    const { primaryActor, primaryActorId, primaryActorType } = notification;
    let conversationId = null;
    if (primaryActorType === 'Conversation') {
      conversationId = primaryActor.id;
    } else if (primaryActorType === 'Message') {
      conversationId = primaryActor.conversationId;
    }
    if (conversationId) {
      const conversationLink = `${installationUrl}/app/accounts/1/conversations/${conversationId}/${primaryActorId}/${primaryActorType}`;
      return conversationLink;
    }
  }
  return;
};

interface FCMMessage {
  data?: {
    payload?: string;
    notification?: string;
    type?: string;
    account_id?: string;
    id_login?: string;
    churn_risk_score?: string;
  };
}

export interface ChurnRiskNotificationData {
  accountId?: string;
  idLogin?: string;
  churnRiskScore?: string;
}

/**
 * Detects a "churn_risk" push notification and returns its (camelCased) data.
 * Returns null when the message is not a churn_risk notification.
 *
 * The churn_risk push delivers its fields directly on `message.data`
 * (not wrapped in a JSON `payload`/`notification` string like Chatwoot pushes).
 */
export const findChurnRiskFromPush = ({
  message,
}: {
  message: FCMMessage;
}): ChurnRiskNotificationData | null => {
  if (message?.data?.type !== 'churn_risk') {
    return null;
  }

  return {
    accountId: message.data.account_id,
    idLogin: message.data.id_login,
    churnRiskScore: message.data.churn_risk_score,
  };
};

export const findNotificationFromFCM = ({ message }: { message: FCMMessage }) => {
  let notification = null;
  // FCM HTTP v1
  if (message?.data?.payload) {
    const parsedPayload = JSON.parse(message.data.payload);
    notification = parsedPayload.data.notification;
  }
  // FCM legacy. It will be deprecated soon
  else if (message?.data?.notification) {
    notification = JSON.parse(message.data.notification);
  }
  return notification;
};
