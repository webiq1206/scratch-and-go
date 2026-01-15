import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import BrandedAlert, { AlertButton, BrandedAlertProps } from '@/components/ui/BrandedAlert';
import Toast, { ToastProps } from '@/components/ui/Toast';

// Alert options interface (similar to React Native's Alert.alert signature)
interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: BrandedAlertProps['type'];
}

// Toast options interface
interface ToastOptions {
  title: string;
  message?: string;
  type?: ToastProps['type'];
  duration?: number;
  position?: ToastProps['position'];
}

// Context interface
interface AlertContextType {
  // Show a branded alert dialog (replacement for Alert.alert)
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    type?: BrandedAlertProps['type']
  ) => void;
  // Show a toast notification
  toast: (options: ToastOptions) => void;
  // Convenience methods for common toasts
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

interface AlertProviderProps {
  children: ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertOptions>({
    title: '',
    message: '',
    buttons: [{ text: 'OK' }],
    type: 'info',
  });

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState<ToastOptions>({
    title: '',
    message: '',
    type: 'info',
    duration: 3000,
    position: 'top',
  });

  // Show alert function (matches Alert.alert signature)
  const alert = useCallback((
    title: string,
    message?: string,
    buttons?: AlertButton[],
    type?: BrandedAlertProps['type']
  ) => {
    setAlertConfig({
      title,
      message,
      buttons: buttons || [{ text: 'OK' }],
      type: type || 'info',
    });
    setAlertVisible(true);
  }, []);

  // Show toast function
  const toast = useCallback((options: ToastOptions) => {
    setToastConfig({
      title: options.title,
      message: options.message,
      type: options.type || 'info',
      duration: options.duration ?? 3000,
      position: options.position || 'top',
    });
    setToastVisible(true);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((title: string, message?: string) => {
    toast({ title, message, type: 'success' });
  }, [toast]);

  const showError = useCallback((title: string, message?: string) => {
    toast({ title, message, type: 'error', duration: 4000 });
  }, [toast]);

  const showWarning = useCallback((title: string, message?: string) => {
    toast({ title, message, type: 'warning' });
  }, [toast]);

  const showInfo = useCallback((title: string, message?: string) => {
    toast({ title, message, type: 'info' });
  }, [toast]);

  const handleAlertDismiss = useCallback(() => {
    setAlertVisible(false);
  }, []);

  const handleToastDismiss = useCallback(() => {
    setToastVisible(false);
  }, []);

  return (
    <AlertContext.Provider
      value={{
        alert,
        toast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      
      {/* Branded Alert Modal */}
      <BrandedAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
        onDismiss={handleAlertDismiss}
      />

      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        title={toastConfig.title}
        message={toastConfig.message}
        type={toastConfig.type}
        duration={toastConfig.duration}
        position={toastConfig.position}
        onDismiss={handleToastDismiss}
      />
    </AlertContext.Provider>
  );
}

// Custom hook to use alert context
export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

export default AlertContext;
