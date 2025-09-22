import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Beautiful3DAlert } from '../components/Beautiful3DAlert';
import { Beautiful3DLoader } from '../components/Beautiful3DLoader';
import { Beautiful3DToast } from '../components/Beautiful3DToast';

interface AlertConfig {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface ToastConfig {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top' | 'bottom';
}

interface LoaderConfig {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

interface Beautiful3DContextType {
  // Alert methods
  showAlert: (config: AlertConfig) => void;
  showSuccessAlert: (title: string, message: string, onConfirm?: () => void) => void;
  showErrorAlert: (title: string, message: string, onConfirm?: () => void) => void;
  showWarningAlert: (title: string, message: string, onConfirm?: () => void) => void;
  showConfirmAlert: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
  hideAlert: () => void;

  // Toast methods
  showToast: (config: ToastConfig) => void;
  showSuccessToast: (message: string, duration?: number) => void;
  showErrorToast: (message: string, duration?: number) => void;
  showWarningToast: (message: string, duration?: number) => void;
  showInfoToast: (message: string, duration?: number) => void;
  hideToast: () => void;

  // Loader methods
  showLoader: (config?: LoaderConfig) => void;
  hideLoader: () => void;
  setLoading: (loading: boolean, config?: LoaderConfig) => void;
}

const Beautiful3DContext = createContext<Beautiful3DContextType | undefined>(undefined);

interface Beautiful3DProviderProps {
  children: ReactNode;
}

export const Beautiful3DProvider: React.FC<Beautiful3DProviderProps> = ({ children }) => {
  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    title: '',
    message: '',
  });

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState<ToastConfig>({
    message: '',
  });

  // Loader state
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [loaderConfig, setLoaderConfig] = useState<LoaderConfig>({});

  // Alert methods
  const showAlert = (config: AlertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  };

  const showSuccessAlert = (title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      title,
      message,
      type: 'success',
      onConfirm,
    });
  };

  const showErrorAlert = (title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      title,
      message,
      type: 'error',
      onConfirm,
    });
  };

  const showWarningAlert = (title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      title,
      message,
      type: 'warning',
      onConfirm,
    });
  };

  const showConfirmAlert = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    showAlert({
      title,
      message,
      type: 'warning',
      onConfirm,
      onCancel,
      showCancel: true,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
    });
  };

  const hideAlert = () => {
    setAlertVisible(false);
  };

  // Toast methods
  const showToast = (config: ToastConfig) => {
    setToastConfig(config);
    setToastVisible(true);
  };

  const showSuccessToast = (message: string, duration = 3000) => {
    showToast({
      message,
      type: 'success',
      duration,
    });
  };

  const showErrorToast = (message: string, duration = 3000) => {
    showToast({
      message,
      type: 'error',
      duration,
    });
  };

  const showWarningToast = (message: string, duration = 3000) => {
    showToast({
      message,
      type: 'warning',
      duration,
    });
  };

  const showInfoToast = (message: string, duration = 3000) => {
    showToast({
      message,
      type: 'info',
      duration,
    });
  };

  const hideToast = () => {
    setToastVisible(false);
  };

  // Loader methods
  const showLoader = (config: LoaderConfig = {}) => {
    setLoaderConfig(config);
    setLoaderVisible(true);
  };

  const hideLoader = () => {
    setLoaderVisible(false);
  };

  const setLoading = (loading: boolean, config: LoaderConfig = {}) => {
    if (loading) {
      showLoader(config);
    } else {
      hideLoader();
    }
  };

  const contextValue: Beautiful3DContextType = {
    // Alert methods
    showAlert,
    showSuccessAlert,
    showErrorAlert,
    showWarningAlert,
    showConfirmAlert,
    hideAlert,

    // Toast methods
    showToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    hideToast,

    // Loader methods
    showLoader,
    hideLoader,
    setLoading,
  };

  return (
    <Beautiful3DContext.Provider value={contextValue}>
      {children}
      
      {/* 3D Alert Component */}
      <Beautiful3DAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => {
          alertConfig.onConfirm?.();
          hideAlert();
        }}
        onCancel={() => {
          alertConfig.onCancel?.();
          hideAlert();
        }}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        showCancel={alertConfig.showCancel}
      />

      {/* 3D Toast Component */}
      <Beautiful3DToast
        visible={toastVisible}
        message={toastConfig.message}
        type={toastConfig.type}
        duration={toastConfig.duration}
        position={toastConfig.position}
        onHide={hideToast}
      />

      {/* 3D Loader Component */}
      <Beautiful3DLoader
        visible={loaderVisible}
        text={loaderConfig.text}
        size={loaderConfig.size}
        color={loaderConfig.color}
      />
    </Beautiful3DContext.Provider>
  );
};

export const useBeautiful3D = (): Beautiful3DContextType => {
  const context = useContext(Beautiful3DContext);
  if (!context) {
    throw new Error('useBeautiful3D must be used within a Beautiful3DProvider');
  }
  return context;
};
