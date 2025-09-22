import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  StyleSheet,
  Easing,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface Beautiful3DLoaderProps {
  visible: boolean;
  text?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const { width, height } = Dimensions.get('window');

export const Beautiful3DLoader: React.FC<Beautiful3DLoaderProps> = ({
  visible,
  text = 'Loading...',
  size = 'medium',
  color,
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start all animations
      Animated.parallel([
        // Entrance animation
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous spinning animation
      const spinAnimation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      // Continuous pulsing animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      // Floating animation
      const floatAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -10,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      spinAnimation.start();
      pulseAnimation.start();
      floatAnimation.start();

      return () => {
        spinAnimation.stop();
        pulseAnimation.stop();
        floatAnimation.stop();
      };
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      spinAnim.setValue(0);
      pulseAnim.setValue(1);
      floatAnim.setValue(0);
    }
  }, [visible]);

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { loaderSize: 40, fontSize: 14 };
      case 'large':
        return { loaderSize: 80, fontSize: 18 };
      default:
        return { loaderSize: 60, fontSize: 16 };
    }
  };

  const sizeConfig = getSizeConfig();
  const loaderColor = color || (isDarkMode ? '#4FC3F7' : '#1976D2');

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: opacityAnim,
          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
        },
      ]}
    >
      <Animated.View
        style={[
          styles.loaderContainer,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: floatAnim },
            ],
          },
        ]}
      >
        {/* 3D Spinning Loader */}
        <Animated.View
          style={[
            styles.spinnerContainer,
            {
              width: sizeConfig.loaderSize,
              height: sizeConfig.loaderSize,
              transform: [
                { rotate: spin },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          {/* Outer Ring */}
          <View
            style={[
              styles.outerRing,
              {
                width: sizeConfig.loaderSize,
                height: sizeConfig.loaderSize,
                borderColor: loaderColor,
                shadowColor: loaderColor,
              },
            ]}
          />
          
          {/* Inner Ring */}
          <View
            style={[
              styles.innerRing,
              {
                width: sizeConfig.loaderSize * 0.7,
                height: sizeConfig.loaderSize * 0.7,
                borderColor: loaderColor,
                shadowColor: loaderColor,
              },
            ]}
          />
          
          {/* Center Dot */}
          <View
            style={[
              styles.centerDot,
              {
                width: sizeConfig.loaderSize * 0.3,
                height: sizeConfig.loaderSize * 0.3,
                backgroundColor: loaderColor,
                shadowColor: loaderColor,
              },
            ]}
          />
        </Animated.View>

        {/* 3D Loading Text */}
        <Animated.Text
          style={[
            styles.loadingText,
            {
              fontSize: sizeConfig.fontSize,
              color: isDarkMode ? '#ffffff' : '#333333',
              textShadowColor: isDarkMode ? '#000000' : '#cccccc',
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          {text}
        </Animated.Text>

        {/* Floating Particles */}
        <View style={styles.particlesContainer}>
          {[...Array(6)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  backgroundColor: loaderColor,
                  transform: [
                    {
                      rotate: spinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [`${index * 60}deg`, `${(index * 60) + 360}deg`],
                      }),
                    },
                    { translateX: sizeConfig.loaderSize * 0.8 },
                    { scale: pulseAnim },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 1000,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  innerRing: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 1000,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  centerDot: {
    borderRadius: 1000,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 15,
  },
  loadingText: {
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 1,
  },
  particlesContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
});
