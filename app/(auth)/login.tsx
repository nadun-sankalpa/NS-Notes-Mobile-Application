import { View, Text, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { Alert } from 'react-native';
import { login } from '@/services/authService'
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const Login = () => {
    const router = useRouter();
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [loading, setLoading] = React.useState(false);

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
                style={{
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
                }}
            />
            <Animated.View
                entering={FadeIn.delay(400).duration(1500)}
                style={{
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
                }}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1 }}
            >
                {/* Logo */}
                <Animated.View
                    entering={SlideInUp.springify().damping(12)}
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
                        style={{ backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 18, borderColor: '#284b8a', borderWidth: 1, fontSize: 16 }}
                        placeholder="Email"
                        placeholderTextColor="#284b8a"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={{ backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 18, borderColor: '#284b8a', borderWidth: 1, fontSize: 16 }}
                        placeholder="Password"
                        placeholderTextColor="#284b8a"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    <Pressable
                        style={{ backgroundColor: '#19376d', borderRadius: 14, paddingVertical: 14, marginBottom: 12, shadowColor: '#284b8a', shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}
                        onPress={handleLogin}
                    >
                        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center', letterSpacing: 1 }}>
                            {loading ? <ActivityIndicator color="#fff" /> : 'Login'}
                        </Text>
                    </Pressable>
                    <Pressable
                        style={{ backgroundColor: '#4f8ef7', borderRadius: 14, paddingVertical: 12, marginBottom: 4 }}
                        onPress={() => router.push("/(auth)/register")}
                    >
                        <Text style={{ color: '#19376d', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                            Create Account
                        </Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

export default Login