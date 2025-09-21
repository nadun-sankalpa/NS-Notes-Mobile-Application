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
import { Alert } from 'react-native';
import { login } from '@/services/authService'
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const Login = () => {
    const router = useRouter();
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
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 14,
        marginBottom: 18,
        borderColor: focusedInput === name ? '#19376d' : '#284b8a',
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
            Alert.alert("Please fill out all fields");
            return;
        }
        setLoading(true);
        await login(email, password)
            .then((res) => {
                router.replace('/home');
            })
            .catch((err) => {
                Alert.alert("Login failed", err.message);
                console.error(err);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <LinearGradient
            colors={["#e0eafc", "#cfdef3", "#b6e0fe", "#19376d"]}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
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
                    backgroundColor: '#19376d',
                    opacity: 0.18,
                    shadowColor: '#19376d',
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
                    backgroundColor: '#284b8a',
                    opacity: 0.16,
                    shadowColor: '#284b8a',
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
                        <Ionicons name="book-outline" size={42} color="#19376d" style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#19376d', letterSpacing: 2, textShadowColor: '#284b8a', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 8 }}>NS NOTES</Text>
                    </View>
                    <Text style={{ color: '#19376d', fontSize: 18, fontWeight: '500', opacity: 0.7 }}>Welcome back! Please login to continue.</Text>
                </Animated.View>
                {/* Login Form */}
                <View style={{ width: '90%', maxWidth: 400, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 24, padding: 28, shadowColor: '#19376d', shadowOpacity: 0.12, shadowRadius: 18, elevation: 8 }}>
                    <Text style={{ color: '#19376d', fontSize: 22, fontWeight: '700', marginBottom: 18, textAlign: 'center' }}>Login</Text>
                    <TextInput
                        style={getInputStyle('email')}
                        placeholder="Email"
                        placeholderTextColor="#284b8a"
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
                        placeholderTextColor="#284b8a"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput(null)}
                    />
                    <Animated.View style={buttonAnimatedStyle}>
                      <Pressable
                          style={{ backgroundColor: '#19376d', borderRadius: 14, paddingVertical: 14, marginBottom: 12, shadowColor: '#284b8a', shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}
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
                      <Text style={{ color: '#19376d', marginBottom: 8, fontWeight: '600' }}>Or sign in with</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                        <Pressable
                          style={{ backgroundColor: '#fff', borderRadius: 8, padding: 10, marginHorizontal: 4, borderWidth: 1, borderColor: '#e0eafc', elevation: 2 }}
                          onPress={() => Alert.alert('Google Sign-In', 'Not implemented yet')}
                        >
                          <FontAwesome name="google" size={24} color="#EA4335" />
                        </Pressable>
                        <Pressable
                          style={{ backgroundColor: '#fff', borderRadius: 8, padding: 10, marginHorizontal: 4, borderWidth: 1, borderColor: '#e0eafc', elevation: 2 }}
                          onPress={() => Alert.alert('Facebook Sign-In', 'Not implemented yet')}
                        >
                          <FontAwesome name="facebook" size={24} color="#1877F3" />
                        </Pressable>
                        <Pressable
                          style={{ backgroundColor: '#fff', borderRadius: 8, padding: 10, marginHorizontal: 4, borderWidth: 1, borderColor: '#e0eafc', elevation: 2 }}
                          onPress={() => Alert.alert('GitHub Sign-In', 'Not implemented yet')}
                        >
                          <FontAwesome name="github" size={24} color="#333" />
                        </Pressable>
                      </View>
                    </View>
                    {/* Instead of a button, use a link style for navigation */}
                    <Text
                        style={{ color: '#19376d', fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: 8, textDecorationLine: 'underline' }}
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