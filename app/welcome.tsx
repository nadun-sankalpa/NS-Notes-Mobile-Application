import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <AnimatedWave />
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome</Text>
        <Text style={styles.subtitle}>Lorem ipsum dolor sit amet consectetur. Lorem id sit</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const AnimatedWave = () => {
  const waveAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width * 0.5],
  });

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, width, height: height * 0.35, overflow: 'hidden', zIndex: 1 }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: width * 1.5,
          height: height * 0.35,
          transform: [{ translateX }],
        }}
      >
        <View
          style={{
            width: width * 1.5,
            height: height * 0.35,
            backgroundColor: '#fff',
            borderBottomLeftRadius: width,
            borderBottomRightRadius: width,
            opacity: 0.93,
          }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#19376d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    zIndex: 2,
    marginBottom: 60,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 60,
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 36,
    opacity: 0.8,
    paddingHorizontal: 32,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    elevation: 3,
    marginTop: 24,
  },
  buttonText: {
    color: '#19376d',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
