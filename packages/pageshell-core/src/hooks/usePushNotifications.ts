'use client';

import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// Types
// =============================================================================

/**
 * Error codes for push notification operations.
 * Use with translations: t(`pushNotifications.errors.${errorCode}`)
 */
export type PushNotificationErrorCode = 'permission' | 'denied' | 'subscribe' | 'unsubscribe' | null;

export interface PushNotificationState {
  /** Whether push notifications are supported in this browser */
  isSupported: boolean;
  /** Whether currently subscribed to push notifications */
  isSubscribed: boolean;
  /** Whether an operation is in progress */
  isLoading: boolean;
  /** Current notification permission state */
  permission: NotificationPermission | 'default';
  /** Error code if an operation failed - use with i18n */
  errorCode: PushNotificationErrorCode;
}

export interface UsePushNotificationsReturn extends PushNotificationState {
  /** Subscribe to push notifications */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>;
  /** Request notification permission from the user */
  requestPermission: () => Promise<NotificationPermission>;
  /**
   * Send a test notification (local).
   * Title and body should be provided using translations.
   */
  sendTestNotification: (title: string, body: string, options?: NotificationOptions) => void;
}

export interface UsePushNotificationsOptions {
  /** Icon path for notifications (default: '/icons/icon-192x192.png') */
  iconPath?: string;
  /** Badge path for notifications */
  badgePath?: string;
  /** localStorage key for subscription preference */
  storageKey?: string;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_ICON_PATH = '/icons/icon-192x192.png';
const DEFAULT_STORAGE_KEY = 'push-notifications-enabled';

// =============================================================================
// Hook
// =============================================================================

/**
 * usePushNotifications - Manage push notification subscriptions
 *
 * Provides a complete push notification management solution including:
 * - Browser support detection
 * - Permission request handling
 * - Subscription management
 * - Local test notifications
 *
 * Note: Full push notification requires backend integration with VAPID keys.
 * This hook manages the frontend subscription state and local notifications.
 *
 * @example
 * ```tsx
 * const {
 *   isSupported,
 *   isSubscribed,
 *   subscribe,
 *   unsubscribe,
 *   sendTestNotification,
 * } = usePushNotifications();
 *
 * // Subscribe
 * const success = await subscribe();
 *
 * // Send test notification
 * sendTestNotification(
 *   t('notifications.test.title'),
 *   t('notifications.test.body')
 * );
 * ```
 */
export function usePushNotifications(
  options: UsePushNotificationsOptions = {}
): UsePushNotificationsReturn {
  const {
    iconPath = DEFAULT_ICON_PATH,
    badgePath = DEFAULT_ICON_PATH,
    storageKey = DEFAULT_STORAGE_KEY,
  } = options;

  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    permission: 'default',
    errorCode: null,
  });

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported =
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      if (!isSupported) {
        setState((prev) => ({
          ...prev,
          isSupported: false,
          isLoading: false,
        }));
        return;
      }

      // Check current permission
      const permission = Notification.permission;

      // Check if already subscribed
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        setState({
          isSupported: true,
          isSubscribed: !!subscription || localStorage.getItem(storageKey) === 'true',
          isLoading: false,
          permission,
          errorCode: null,
        });
      } catch {
        setState({
          isSupported: true,
          isSubscribed: localStorage.getItem(storageKey) === 'true',
          isLoading: false,
          permission,
          errorCode: null,
        });
      }
    };

    checkSupport();
  }, [storageKey]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!state.isSupported) return 'denied';

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));
      return permission;
    } catch {
      setState((prev) => ({ ...prev, errorCode: 'permission' }));
      return 'denied';
    }
  }, [state.isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    setState((prev) => ({ ...prev, isLoading: true, errorCode: null }));

    try {
      // Request permission if not granted
      if (Notification.permission !== 'granted') {
        const permission = await requestPermission();
        if (permission !== 'granted') {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            errorCode: 'denied',
          }));
          return false;
        }
      }

      // For local notifications (without backend push server),
      // we just mark as subscribed and use local notifications.
      // Full push would require VAPID keys and backend integration.
      localStorage.setItem(storageKey, 'true');

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      return true;
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        errorCode: 'subscribe',
      }));
      return false;
    }
  }, [state.isSupported, requestPermission, storageKey]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    setState((prev) => ({ ...prev, isLoading: true, errorCode: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      localStorage.removeItem(storageKey);

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      return true;
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        errorCode: 'unsubscribe',
      }));
      return false;
    }
  }, [state.isSupported, storageKey]);

  // Send a test notification (local)
  const sendTestNotification = useCallback(
    (title: string, body: string, notificationOptions?: NotificationOptions) => {
      if (!state.isSupported || Notification.permission !== 'granted') return;

      new Notification(title, {
        body,
        icon: iconPath,
        badge: badgePath,
        ...notificationOptions,
      });
    },
    [state.isSupported, iconPath, badgePath]
  );

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission,
    sendTestNotification,
  };
}
