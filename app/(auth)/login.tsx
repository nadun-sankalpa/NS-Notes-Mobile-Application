import Animated, { FadeIn, SlideInUp, withRepeat, withTiming, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import React from 'react';

import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image
} from 'react-native'
import { useRouter } from 'expo-router';
import { login } from '@/services/authService'
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useBeautiful3D } from '../../context/Beautiful3DContext';

const { width, height } = Dimensions.get('window');

const Login = () => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  const { showAlert, showToast } = useBeautiful3D();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // --- Live Animations ---
  const bubble1Scale = useSharedValue(1);
  const bubble2Scale = useSharedValue(1);
  React.useEffect(() => {
    bubble1Scale.value = withRepeat(withTiming(1.15, { duration: 2200 }), -1, true);
    bubble2Scale.value = withRepeat(withTiming(1.1, { duration: 1800 }), -1, true);
  }, []);
  const bubble1Style = useAnimatedStyle(() => ({ transform: [{ scale: bubble1Scale.value }] }));
  const bubble2Style = useAnimatedStyle(() => ({ transform: [{ scale: bubble2Scale.value }] }));
  const formEntering = SlideInUp.springify().damping(12);
  const [focusedInput, setFocusedInput] = React.useState<string | null>(null);
  const getInputStyle = (name: string) => [
    {
      backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
      color: isDarkMode ? '#fff' : '#111',
      borderRadius: 12,
      padding: 14,
      marginBottom: 18,
      borderColor: focusedInput === name ? '#F59E0B' : (isDarkMode ? '#333' : '#FDE68A'),
      borderWidth: 1,
      fontSize: 16,
    },
  ];

  const buttonScale = useSharedValue(1);
  const buttonAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));
  const handleButtonPressIn = () => { buttonScale.value = withTiming(0.96, { duration: 100 }); };
  const handleButtonPressOut = () => { buttonScale.value = withTiming(1, { duration: 100 }); };

  const handleLogin = async () => {
    if (loading) return;
    if (email === "" || password === "") {
      showAlert({
        title: "Missing Information",
        message: "Please fill out all fields",
        type: "warning",
        confirmText: "OK"
      });
      return;
    }
    setLoading(true);
    await login(email, password)
        .then((res) => {
          showToast({
            message: "Login successful! Welcome back!",
            type: "success"
          });
          router.replace('/home');
        })
        .catch((err) => {
          showAlert({
            title: "Login Failed",
            message: err.message,
            type: "error",
            confirmText: "Try Again"
          });
          console.error(err);
        })
        .finally(() => {
          setLoading(false);
        });
  };

  return (
      <LinearGradient
          colors={isDarkMode ? ["#0a0a0a", "#111827", "#1f2937"] : ["#FFF7ED", "#FFFBEB", "#fde68a"]}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
      >
        {/* Theme Toggle */}
        <View style={{ position: 'absolute', top: 48, right: 20, zIndex: 2, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: isDarkMode ? '#fff' : '#7c2d12', fontWeight: '700', marginRight: 8 }}>{isDarkMode ? 'Dark' : 'Light'}</Text>
          <Pressable onPress={toggleTheme} style={{ backgroundColor: isDarkMode ? '#374151' : '#F59E0B', borderRadius: 16, padding: 8 }}>
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={18} color={isDarkMode ? '#F59E0B' : '#fff'} />
          </Pressable>
        </View>

        {/* 3D Animated Bubbles */}
        <Animated.View
            entering={FadeIn.duration(1200)}
            style={[
              {
                position: 'absolute',
                top: -height * 0.15,
                left: -width * 0.2,
                width: width * 0.7,
                height: width * 0.7,
                borderRadius: width * 0.35,
                backgroundColor: isDarkMode ? '#F59E0B' : '#F59E0B',
                opacity: isDarkMode ? 1 : 0.15,
                shadowColor: '#F59E0B',

                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 30,
                zIndex: 0,
              },
              bubble1Style,
            ]}
        />
        <Animated.View
            entering={FadeIn.delay(400).duration(1500)}
            style={[
              {
                position: 'absolute',
                bottom: -height * 0.18,
                right: -width * 0.18,
                width: width * 0.55,
                height: width * 0.55,
                borderRadius: width * 0.275,
                backgroundColor: isDarkMode ? '#CA8A04' : '#FDE68A',
                opacity: isDarkMode ? 1 : 0.18,
                shadowColor: isDarkMode ? '#CA8A04' : '#F59E0B',

                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 30,
                zIndex: 0,
              },
              bubble2Style,
            ]}
        />
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1 }}
        >
          {/* Logo */}
          <Animated.View
              entering={formEntering}
              style={{ alignItems: 'center', marginBottom: 48 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="book-outline" size={42} color={isDarkMode ? '#F59E0B' : '#F59E0B'} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 40, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#7c2d12', letterSpacing: 2, textShadowColor: isDarkMode ? '#000' : '#FDE68A', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 8 }}>NS NOTES</Text>
            </View>
            <Text style={{ color: isDarkMode ? '#e5e7eb' : '#7c2d12', fontSize: 18, fontWeight: '500', opacity: 0.8 }}>Welcome back! Please login to continue.</Text>
          </Animated.View>
          {/* Login Form */}
          <View style={{ width: '90%', maxWidth: 400, backgroundColor: isDarkMode ? 'rgba(31,31,31,0.9)' : 'rgba(255,255,255,0.9)', borderRadius: 24, padding: 28, shadowColor: '#F59E0B', shadowOpacity: 0.12, shadowRadius: 18, elevation: 8 }}>
            <Text style={{ color: isDarkMode ? '#F59E0B' : '#7c2d12', fontSize: 22, fontWeight: '700', marginBottom: 18, textAlign: 'center' }}>Login</Text>
            <TextInput
                style={getInputStyle('email')}
                placeholder="Email"
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#7c2d12'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
            />
            <TextInput
                style={getInputStyle('password')}
                placeholder="Password"
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#7c2d12'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
            />
            <Animated.View style={buttonAnimatedStyle}>
              <Pressable
                  style={{ backgroundColor: '#F59E0B', borderRadius: 14, paddingVertical: 14, marginBottom: 12, shadowColor: '#F59E0B', shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  onPress={handleLogin}
              >
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : 'Login'}
                </Text>
              </Pressable>
            </Animated.View>
            {/* Social Sign-in Options */}
            <View style={{ width: '100%', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
              <Text style={{ color: isDarkMode ? '#e5e7eb' : '#7c2d12', marginBottom: 8, fontWeight: '600' }}>Or sign in with</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                <Pressable
                    style={{ backgroundColor: isDarkMode ? '#1f1f1f' : '#fff', borderRadius: 8, padding: 10, marginHorizontal: 4, borderWidth: 1, borderColor: isDarkMode ? '#333' : '#FDE68A', elevation: 2 }}
                    onPress={() => showAlert({
                      title: "Google Sign-In",
                      message: "This feature is coming soon! Stay tuned for updates.",
                      type: "info",
                      confirmText: "Got it"
                    })}
                >
                  <FontAwesome name="google" size={24} color="#EA4335" />
                </Pressable>
                <Pressable
                    style={{ backgroundColor: isDarkMode ? '#1f1f1f' : '#fff', borderRadius: 8, padding: 10, marginHorizontal: 4, borderWidth: 1, borderColor: isDarkMode ? '#333' : '#FDE68A', elevation: 2 }}
                    onPress={() => showAlert({
                      title: "Facebook Sign-In",
                      message: "This feature is coming soon! Stay tuned for updates.",
                      type: "info",
                      confirmText: "Got it"
                    })}
                >
                  <FontAwesome name="facebook" size={24} color="#1877F3" />
                </Pressable>
                <Pressable
                    style={{ backgroundColor: isDarkMode ? '#1f1f1f' : '#fff', borderRadius: 8, padding: 10, marginHorizontal: 4, borderWidth: 1, borderColor: isDarkMode ? '#333' : '#FDE68A', elevation: 2 }}
                    onPress={() => showAlert({
                      title: "GitHub Sign-In",
                      message: "This feature is coming soon! Stay tuned for updates.",
                      type: "info",
                      confirmText: "Got it"
                    })}
                >
                  <FontAwesome name="github" size={24} color="#333" />
                </Pressable>
              </View>
            </View>
            {/* Instead of a button, use a link style for navigation */}
            <Text
                style={{ color: isDarkMode ? '#F59E0B' : '#7c2d12', fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: 8, textDecorationLine: 'underline' }}
                onPress={() => router.push("/(auth)/register")}
            >
              Create Account
            </Text>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>

  );
}

export default Login