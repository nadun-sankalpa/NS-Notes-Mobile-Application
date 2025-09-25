import React, { useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const StartupSplash = () => {
  // Background pulse
  const bgPulse = useSharedValue(0.9);
  useEffect(() => {
    bgPulse.value = withRepeat(withTiming(1.05, { duration: 1800, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const bgPulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: bgPulse.value }] }));

  // Rotating ring (outer accent)
  const ringRot = useSharedValue(0);
  useEffect(() => {
    ringRot.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear }), -1, false);
  }, []);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${ringRot.value * 360}deg` }] }));

  // Title subtle float
  const titleFloat = useSharedValue(0);
  useEffect(() => {
    titleFloat.value = withRepeat(withTiming(-6, { duration: 1600 }), -1, true);
  }, []);
  const titleStyle = useAnimatedStyle(() => ({ transform: [{ translateY: titleFloat.value }] }));

  // Shimmer sweep across text
  const sweep = useSharedValue(-width);
  useEffect(() => {
    sweep.value = withRepeat(withTiming(width * 1.5, { duration: 1800, easing: Easing.inOut(Easing.ease) }), -1, false);
  }, []);
  const sweepStyle = useAnimatedStyle(() => ({ transform: [{ translateX: sweep.value }] }));

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={{ flex: 1 }}>
      <LinearGradient
        colors={[ '#000000', '#0a0a0a', '#111111' ]}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Glowing amber blobs */}
        <Animated.View style={[{
          position: 'absolute',
          top: -height * 0.2,
          left: -width * 0.25,
          width: width * 0.9,
          height: width * 0.9,
          borderRadius: width * 0.45,
          backgroundColor: '#F59E0B',
          opacity: 0.12,
          shadowColor: '#F59E0B',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.8,
          shadowRadius: 40,
        }, bgPulseStyle]} />
        <Animated.View style={[{
          position: 'absolute',
          bottom: -height * 0.22,
          right: -width * 0.25,
          width: width * 0.75,
          height: width * 0.75,
          borderRadius: width * 0.375,
          backgroundColor: '#F59E0B',
          opacity: 0.1,
          shadowColor: '#F59E0B',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.8,
          shadowRadius: 40,
        }, bgPulseStyle]} />

        {/* Emblem: layered 3D badge */}
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {/* Outer glowing ring */}
          <Animated.View style={[{
            width: 200,
            height: 200,
            borderRadius: 100,
            borderWidth: 3,
            borderColor: '#F59E0B',
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            shadowColor: '#F59E0B',
            shadowOpacity: 0.9,
            shadowRadius: 18,
          }, ringStyle]} />

          {/* Middle bevel ring */}
          <View style={{
            position: 'absolute',
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: '#0b0b0b',
            borderWidth: 2,
            borderColor: '#F59E0B',
            shadowColor: '#F59E0B',
            shadowOpacity: 0.6,
            shadowRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Inner glossy panel */}
            <LinearGradient
              colors={[ '#0b0b0b', '#111111' ]}
              style={{ position: 'absolute', width: 148, height: 148, borderRadius: 74, borderWidth: 0 }}
            />
            <LinearGradient
              colors={[ 'transparent', 'rgba(245,158,11,0.25)' ]}
              style={{ position: 'absolute', width: 148, height: 148, borderRadius: 74, opacity: 0.3 }}
            />

            {/* NS NOTES stacked with 3D effect */}
            <View style={{ alignItems: 'center' }}>
              <Animated.Text style={[{
                color: '#F59E0B',
                fontSize: 38,
                fontWeight: '900',
                letterSpacing: 2,
                textShadowColor: '#000',
                textShadowOffset: { width: 0, height: 3 },
                textShadowRadius: 8,
              }, titleStyle]}>NS</Animated.Text>
              <View style={{ height: 6 }} />
              <View style={{ overflow: 'hidden' }}>
                <Animated.Text style={[{
                  color: '#FDE68A',
                  fontSize: 16,
                  fontWeight: '800',
                  letterSpacing: 6,
                  textTransform: 'uppercase',
                  textShadowColor: '#000',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 10,
                }, titleStyle]}>NOTES</Animated.Text>
                {/* Animated sweep highlight */}
                <Animated.View pointerEvents="none" style={[{
                  position: 'absolute', top: 0, bottom: 0, left: -width,
                  width: width,
                }, sweepStyle]}
                >
                  <LinearGradient
                    colors={[ 'rgba(255,255,255,0)', 'rgba(253,230,138,0.45)', 'rgba(255,255,255,0)' ]}
                    start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                    style={{ flex: 1 }}
                  />
                </Animated.View>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default StartupSplash;
