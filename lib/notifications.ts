import toast, { Toast } from 'react-hot-toast';
import { Notification } from './types/api';

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Notification configuration
interface NotificationConfig {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  style?: React.CSSProperties;
  className?: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Default notification configuration
const defaultConfig: NotificationConfig = {
  duration: 5000,
  position: 'top-right',
  style: {
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
  },
};

// Notification icons
const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

// Custom notification component
const NotificationComponent = ({ 
  type, 
  title, 
  message, 
  action 
}: { 
  type: NotificationType; 
  title: string; 
  message: string; 
  action?: { label: string; onClick: () => void; };
}) => (
  <div className="flex items-start gap-3">
    <span className="text-lg">{icons[type]}</span>
    <div className="flex-1">
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-sm opacity-90 mt-1">{message}</div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 text-xs underline hover:no-underline"
        >
          {action.label}
        </button>
      )}
    </div>
  </div>
);

// Notification functions
export const notifications = {
  success: (title: string, message: string, config?: NotificationConfig) => {
    return toast.custom(
      (t: Toast) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <NotificationComponent
            type="success"
            title={title}
            message={message}
            action={config?.action}
          />
        </div>
      ),
      {
        duration: config?.duration || defaultConfig.duration,
        position: config?.position || defaultConfig.position,
        style: { ...defaultConfig.style, ...config?.style },
        className: config?.className,
      }
    );
  },

  error: (title: string, message: string, config?: NotificationConfig) => {
    return toast.custom(
      (t: Toast) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-red-50 border border-red-200 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-red-500 ring-opacity-5`}
        >
          <NotificationComponent
            type="error"
            title={title}
            message={message}
            action={config?.action}
          />
        </div>
      ),
      {
        duration: config?.duration || defaultConfig.duration,
        position: config?.position || defaultConfig.position,
        style: { ...defaultConfig.style, ...config?.style },
        className: config?.className,
      }
    );
  },

  warning: (title: string, message: string, config?: NotificationConfig) => {
    return toast.custom(
      (t: Toast) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-yellow-50 border border-yellow-200 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-yellow-500 ring-opacity-5`}
        >
          <NotificationComponent
            type="warning"
            title={title}
            message={message}
            action={config?.action}
          />
        </div>
      ),
      {
        duration: config?.duration || defaultConfig.duration,
        position: config?.position || defaultConfig.position,
        style: { ...defaultConfig.style, ...config?.style },
        className: config?.className,
      }
    );
  },

  info: (title: string, message: string, config?: NotificationConfig) => {
    return toast.custom(
      (t: Toast) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-blue-50 border border-blue-200 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-blue-500 ring-opacity-5`}
        >
          <NotificationComponent
            type="info"
            title={title}
            message={message}
            action={config?.action}
          />
        </div>
      ),
      {
        duration: config?.duration || defaultConfig.duration,
        position: config?.position || defaultConfig.position,
        style: { ...defaultConfig.style, ...config?.style },
        className: config?.className,
      }
    );
  },

  // Dismiss all notifications
  dismissAll: () => {
    toast.dismiss();
  },

  // Dismiss specific notification
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },
};

// Predefined notification messages
export const notificationMessages = {
  auth: {
    loginSuccess: 'Welcome back! You have been successfully logged in.',
    loginError: 'Login failed. Please check your credentials and try again.',
    registerSuccess: 'Account created successfully! Welcome to NoteGPT Dashboard.',
    registerError: 'Registration failed. Please check your information and try again.',
    logoutSuccess: 'You have been successfully logged out.',
    logoutError: 'Logout failed. Please try again.',
    sessionExpired: 'Your session has expired. Please log in again.',
    tokenRefreshSuccess: 'Session refreshed successfully.',
    tokenRefreshError: 'Failed to refresh session. Please log in again.',
  },
  api: {
    networkError: 'Network error. Please check your connection and try again.',
    serverError: 'Server error. Please try again later.',
    unauthorized: 'You are not authorized to perform this action.',
    forbidden: 'Access denied. You do not have permission for this action.',
    notFound: 'The requested resource was not found.',
    validationError: 'Please check your input and try again.',
    timeoutError: 'Request timed out. Please try again.',
    unknownError: 'An unexpected error occurred. Please try again.',
  },
  subscription: {
    planSelected: 'Subscription plan selected successfully.',
    planChanged: 'Your subscription plan has been updated.',
    paymentSuccess: 'Payment processed successfully.',
    paymentFailed: 'Payment failed. Please check your payment method.',
    subscriptionCancelled: 'Your subscription has been cancelled.',
    subscriptionExpired: 'Your subscription has expired. Please renew to continue.',
  },
  aiTools: {
    processingStarted: 'Processing started. This may take a few moments.',
    processingComplete: 'Processing completed successfully.',
    processingFailed: 'Processing failed. Please try again.',
    fileUploaded: 'File uploaded successfully.',
    fileUploadFailed: 'File upload failed. Please try again.',
    resultCopied: 'Result copied to clipboard.',
    resultExported: 'Result exported successfully.',
  },
  general: {
    saved: 'Changes saved successfully.',
    deleted: 'Item deleted successfully.',
    updated: 'Item updated successfully.',
    created: 'Item created successfully.',
    copied: 'Copied to clipboard.',
    exported: 'Exported successfully.',
    imported: 'Imported successfully.',
  },
};

// Notification hook for React components
export function useNotifications() {
  return {
    showSuccess: (title: string, message: string, config?: NotificationConfig) =>
      notifications.success(title, message, config),
    showError: (title: string, message: string, config?: NotificationConfig) =>
      notifications.error(title, message, config),
    showWarning: (title: string, message: string, config?: NotificationConfig) =>
      notifications.warning(title, message, config),
    showInfo: (title: string, message: string, config?: NotificationConfig) =>
      notifications.info(title, message, config),
    dismissAll: notifications.dismissAll,
    dismiss: notifications.dismiss,
  };
}

// Auto-dismiss notifications after a delay
export function autoDismiss(notificationId: string, delay: number = 5000) {
  setTimeout(() => {
    notifications.dismiss(notificationId);
  }, delay);
}

// Notification queue for managing multiple notifications
class NotificationQueue {
  private queue: Notification[] = [];
  private maxSize = 5;

  add(notification: Notification) {
    if (this.queue.length >= this.maxSize) {
      this.queue.shift(); // Remove oldest notification
    }
    this.queue.push(notification);
  }

  remove(id: string) {
    this.queue = this.queue.filter(n => n.id !== id);
  }

  clear() {
    this.queue = [];
  }

  getAll() {
    return [...this.queue];
  }

  getByType(type: NotificationType) {
    return this.queue.filter(n => n.type === type);
  }
}

export const notificationQueue = new NotificationQueue();
