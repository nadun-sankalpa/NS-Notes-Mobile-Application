import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Alert } from 'react-native';
import Animated, { FadeIn, SlideInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface AlarmPopupProps {
  visible: boolean;
  reminderTitle: string;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
}

const AlarmPopup: React.FC<AlarmPopupProps> = ({ visible, reminderTitle, onDismiss, onSnooze }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [currentTime, setCurrentTime] = useState(new Date());

  // Animated values for pulsing alarm effect
  const pulseScale = useSharedValue(1);
  const bellRotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Start pulsing animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );

      // Start bell ringing animation
      bellRotation.value = withRepeat(
        withSequence(
          withTiming(-15, { duration: 100 }),
          withTiming(15, { duration: 200 }),
          withTiming(-15, { duration: 200 }),
          withTiming(0, { duration: 100 })
        ),
        -1,
        false
      );

      // Update time every second
      const timeInterval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(timeInterval);
    } else {
      // Stop animations when not visible
      pulseScale.value = withTiming(1);
      bellRotation.value = withTiming(0);
    }
  }, [visible]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bellRotation.value}deg` }],
  }));

  const handleSnooze = (minutes: number) => {
    Alert.alert(
      'Snooze Alarm',
      `Snooze for ${minutes} minutes?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Snooze', 
          onPress: () => onSnooze(minutes),
          style: 'default'
        }
      ]
    );
  };

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#1a1a2e' }]}>
      <StatusBar barStyle="light-content" backgroundColor={isDarkMode ? '#000000' : '#1a1a2e'} />
      
      {/* Background gradient effect */}
      <View style={[styles.gradientOverlay, { backgroundColor: isDarkMode ? 'rgba(25, 55, 109, 0.3)' : 'rgba(25, 55, 109, 0.5)' }]} />
      
      {/* Current Time Display */}
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: '#ffffff' }]}>
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={[styles.dateText, { color: '#cccccc' }]}>
          {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {/* Animated Alarm Bell Icon */}
      <Animated.View style={[styles.alarmIconContainer, pulseStyle]} entering={FadeIn.duration(500)}>
        <Animated.View style={bellStyle}>
          <FontAwesome name="bell" size={80} color="#ff6b6b" />
        </Animated.View>
      </Animated.View>

      {/* Reminder Title */}
      <Animated.View style={styles.reminderContainer} entering={SlideInUp.delay(300).duration(600)}>
        <Text style={[styles.alarmLabel, { color: '#cccccc' }]}>REMINDER</Text>
        <Text style={[styles.reminderTitle, { color: '#ffffff' }]} numberOfLines={3}>
          {reminderTitle}
        </Text>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View style={styles.buttonsContainer} entering={SlideInUp.delay(600).duration(600)}>
        {/* Snooze Options */}
        <View style={styles.snoozeContainer}>
          <Text style={[styles.snoozeLabel, { color: '#cccccc' }]}>Snooze</Text>
          <View style={styles.snoozeButtons}>
            <TouchableOpacity 
              style={[styles.snoozeButton, { backgroundColor: 'rgba(255, 193, 7, 0.2)', borderColor: '#ffc107' }]}
              onPress={() => handleSnooze(5)}
            >
              <Text style={[styles.snoozeButtonText, { color: '#ffc107' }]}>5 min</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.snoozeButton, { backgroundColor: 'rgba(255, 193, 7, 0.2)', borderColor: '#ffc107' }]}
              onPress={() => handleSnooze(10)}
            >
              <Text style={[styles.snoozeButtonText, { color: '#ffc107' }]}>10 min</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.snoozeButton, { backgroundColor: 'rgba(255, 193, 7, 0.2)', borderColor: '#ffc107' }]}
              onPress={() => handleSnooze(15)}
            >
              <Text style={[styles.snoozeButtonText, { color: '#ffc107' }]}>15 min</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dismiss Button */}
        <TouchableOpacity 
          style={[styles.dismissButton, { backgroundColor: '#ff6b6b' }]}
          onPress={onDismiss}
        >
          <FontAwesome name="times" size={24} color="#ffffff" style={{ marginRight: 10 }} />
          <Text style={[styles.dismissButtonText, { color: '#ffffff' }]}>Dismiss</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
  },
  alarmIconContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderContainer: {
    alignItems: 'center',
    marginBottom: 60,
    paddingHorizontal: 20,
  },
  alarmLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 10,
  },
  reminderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  snoozeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  snoozeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  snoozeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: width * 0.7,
  },
  snoozeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    minWidth: 70,
    alignItems: 'center',
  },
  snoozeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    minWidth: width * 0.6,
  },
  dismissButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AlarmPopup;
