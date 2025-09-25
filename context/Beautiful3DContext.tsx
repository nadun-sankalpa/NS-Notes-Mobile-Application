import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Beautiful3DAlert } from '../components/Beautiful3DAlert';
import { Beautiful3DToast } from '../components/Beautiful3DToast';

export type Beautiful3DAlertOptions = {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
};

export type Beautiful3DToastOptions = {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
};

export type Beautiful3DContextType = {
  showAlert: (opts: Beautiful3DAlertOptions) => void;
  showToast: (opts: Beautiful3DToastOptions) => void;
};

const Beautiful3DContext = createContext<Beautiful3DContextType | null>(null);

export const Beautiful3DProvider = ({ children }: { children: ReactNode }) => {
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertOpts, setAlertOpts] = useState<Beautiful3DAlertOptions | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastOpts, setToastOpts] = useState<Beautiful3DToastOptions | null>(null);

  const showAlert = useCallback((opts: Beautiful3DAlertOptions) => {
    setAlertOpts(opts);
    setAlertVisible(true);
  }, []);

  const showToast = useCallback((opts: Beautiful3DToastOptions) => {
    setToastOpts(opts);
    setToastVisible(true);
  }, []);

  const handleConfirm = () => {
    setAlertVisible(false);
    const cb = alertOpts?.onConfirm;
    setTimeout(() => cb?.(), 0);
  };
  const handleCancel = () => {
    setAlertVisible(false);
    const cb = alertOpts?.onCancel;
    setTimeout(() => cb?.(), 0);
  };

  return (
    <Beautiful3DContext.Provider value={{ showAlert, showToast }}>
      {children}
      {/* 3D Alert Overlay */}
      <Beautiful3DAlert
        visible={alertVisible}
        title={alertOpts?.title ?? ''}
        message={alertOpts?.message ?? ''}
        type={alertOpts?.type ?? 'info'}
        confirmText={alertOpts?.confirmText ?? 'OK'}
        cancelText={alertOpts?.cancelText ?? 'Cancel'}
        showCancel={!!alertOpts?.showCancel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      {/* 3D Toast Overlay */}
      <Beautiful3DToast
        visible={toastVisible}
        message={toastOpts?.message ?? ''}
        type={toastOpts?.type ?? 'info'}
        onHide={() => setToastVisible(false)}
        position="top"
      />
    </Beautiful3DContext.Provider>
  );
};

export const useBeautiful3D = (): Beautiful3DContextType => {
  const ctx = useContext(Beautiful3DContext);
  if (!ctx) {
    // Provide safe defaults even without wrapping provider
    return {
      showAlert: ({ title, message, confirmText }) => Alert.alert(title, message, [{ text: confirmText ?? 'OK' }]),
      showToast: ({ message }) => Alert.alert('', message),
    };
  }
  return ctx;
};
