import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  StyleSheet,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface Beautiful3DToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onHide?: () => void;
  position?: 'top' | 'bottom';
}

const { width } = Dimensions.get('window');

export const Beautiful3DToast: React.FC<Beautiful3DToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
  position = 'top',
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const translateAnim = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 3D entrance animation
      Animated.parallel([
        Animated.spring(translateAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateAnim, {
        toValue: position === 'top' ? -100 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          color: '#4CAF50',
          backgroundColor: isDarkMode ? '#1B5E20' : '#E8F5E8',
          borderColor: '#4CAF50',
        };
      case 'error':
        return {
          icon: 'close-circle',
          color: '#F44336',
          backgroundColor: isDarkMode ? '#B71C1C' : '#FFEBEE',
          borderColor: '#F44336',
        };
      case 'warning':
        return {
          icon: 'warning',
          color: '#FF9800',
          backgroundColor: isDarkMode ? '#E65100' : '#FFF3E0',
          borderColor: '#FF9800',
        };
      default:
        return {
          icon: 'information-circle',
          color: '#2196F3',
          backgroundColor: isDarkMode ? '#0D47A1' : '#E3F2FD',
          borderColor: '#2196F3',
        };
    }
  };

  const typeConfig = getTypeConfig();

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: position === 'top' ? 60 : undefined,
          bottom: position === 'bottom' ? 100 : undefined,
          transform: [
            { translateY: translateAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.toastContainer,
          {
            backgroundColor: typeConfig.backgroundColor,
            borderColor: typeConfig.borderColor,
            shadowColor: typeConfig.color,
          },
        ]}
        onPress={hideToast}
        activeOpacity={0.9}
      >
        {/* 3D Icon with rotation and glow */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: typeConfig.color,
              shadowColor: typeConfig.color,
              transform: [{ rotate }],
              shadowOpacity: glow,
            },
          ]}
        >
          <Ionicons
            name={typeConfig.icon as any}
            size={24}
            color="#ffffff"
          />
        </Animated.View>

        {/* Message with 3D text effect */}
        <Text
          style={[
            styles.message,
            {
              color: isDarkMode ? '#ffffff' : '#333333',
              textShadowColor: isDarkMode ? '#000000' : typeConfig.color,
            },
          ]}
        >
          {message}
        </Text>

        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideToast}
        >
          <Ionicons
            name="close"
            size={20}
            color={isDarkMode ? '#ffffff' : '#666666'}
          />
        </TouchableOpacity>

        {/* 3D Border Effect */}
        <View
          style={[
            styles.borderEffect,
            {
              borderColor: typeConfig.borderColor,
            },
          ]}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
    minHeight: 60,
    maxWidth: width - 40,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 10,
    elevation: 10,
  },
  message: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    marginLeft: 10,
    padding: 5,
  },
  borderEffect: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 21,
    borderWidth: 1,
    opacity: 0.3,
  },
});
