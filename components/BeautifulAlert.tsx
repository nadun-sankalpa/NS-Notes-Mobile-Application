import React from 'react';
import { Modal, View, Text, TouchableOpacity, Animated, Easing } from 'react-native';

interface BeautifulAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const BeautifulAlertComponent: React.FC<BeautifulAlertProps> = ({ visible, title, message, type, onClose }) => {
  const scaleValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    } else {
      scaleValue.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)' }}>
        <Animated.View
          style={{
            width: 320,
            padding: 32,
            borderRadius: 24,
            backgroundColor: '#fff',
            alignItems: 'center',
            elevation: 8,
            transform: [{ scale: scaleValue }],
          }}
        >
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: type === 'success' ? '#22c55e' : '#ef4444', marginBottom: 12 }}>{title}</Text>
          <Text style={{ fontSize: 17, color: '#444', marginBottom: 20, textAlign: 'center' }}>{message}</Text>
          <TouchableOpacity
            style={{ backgroundColor: type === 'success' ? '#22c55e' : '#ef4444', borderRadius: 8, paddingHorizontal: 32, paddingVertical: 10 }}
            onPress={onClose}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>OK</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Singleton helper for showing alert
class BeautifulAlertSingleton {
  private listeners: ((title: string, message: string, type: 'success' | 'error', onClose: () => void) => void)[] = [];
  show(title: string, message: string, type: 'success' | 'error', onClose: () => void) {
    this.listeners.forEach(l => l(title, message, type, onClose));
  }
  subscribe(listener: (title: string, message: string, type: 'success' | 'error', onClose: () => void) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const BeautifulAlert = new BeautifulAlertSingleton();

export const BeautifulAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [type, setType] = React.useState<'success' | 'error'>('success');
  const [onClose, setOnClose] = React.useState<() => void>(() => () => {});

  React.useEffect(() => {
    return BeautifulAlert.subscribe((t, m, ty, cb) => {
      setTitle(t);
      setMessage(m);
      setType(ty);
      setOnClose(() => () => {
        setVisible(false);
        setTimeout(cb, 250); // Delay for animation
      });
      setVisible(true);
    });
  }, []);

  return (
    <>
      {children}
      <BeautifulAlertComponent
        visible={visible}
        title={title}
        message={message}
        type={type}
        onClose={onClose}
      />
    </>
  );
};
