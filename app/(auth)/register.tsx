import {
  View,
  Text,
  Pressable,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native"
import React, { useState } from "react"
import { useRouter } from "expo-router"
import { register } from "@/services/authService"
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'

const Register = () => {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const isDarkMode = theme === 'dark'
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [cPassword, setCPassword] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleRegister = async () => {
    // if(email)
    // password
    if (isLoading) return
    if (password !== cPassword) {
      Alert.alert("Title", "description")
      return
    }
    setIsLoading(true)
    await register(email, password)
      .then((res) => {
        // const res = await register(email, password)
        // success
        router.back()
      })
      .catch((err) => {
        Alert.alert("Registration failed", "Somthing went wrong")
        console.error(err)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="person-add-outline" size={40} color={isDarkMode ? '#F59E0B' : '#F59E0B'} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#7c2d12', letterSpacing: 1 }}>Create Account</Text>
          </View>
          <Text style={{ color: isDarkMode ? '#e5e7eb' : '#7c2d12', opacity: 0.8 }}>Join NS Notes in a few seconds</Text>
        </View>

        {/* Card */}
        <View style={{ width: '90%', maxWidth: 420, backgroundColor: isDarkMode ? 'rgba(31,31,31,0.9)' : 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 24, shadowColor: '#F59E0B', shadowOpacity: 0.12, shadowRadius: 18, elevation: 8 }}>
          <Text style={{ color: isDarkMode ? '#F59E0B' : '#7c2d12', fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' }}>Register</Text>
          <TextInput
            placeholder="Email"
            placeholderTextColor={isDarkMode ? '#9ca3af' : '#7c2d12'}
            value={email}
            onChangeText={setEmail}
            style={{ backgroundColor: isDarkMode ? '#1f1f1f' : '#fff', color: isDarkMode ? '#fff' : '#111', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: isDarkMode ? '#333' : '#FDE68A', marginBottom: 12 }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={isDarkMode ? '#9ca3af' : '#7c2d12'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ backgroundColor: isDarkMode ? '#1f1f1f' : '#fff', color: isDarkMode ? '#fff' : '#111', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: isDarkMode ? '#333' : '#FDE68A', marginBottom: 12 }}
          />
          <TextInput
            placeholder="Confirm password"
            placeholderTextColor={isDarkMode ? '#9ca3af' : '#7c2d12'}
            value={cPassword}
            onChangeText={setCPassword}
            secureTextEntry
            style={{ backgroundColor: isDarkMode ? '#1f1f1f' : '#fff', color: isDarkMode ? '#fff' : '#111', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: isDarkMode ? '#333' : '#FDE68A', marginBottom: 8 }}
          />

          <TouchableOpacity onPress={handleRegister} style={{ backgroundColor: '#F59E0B', paddingVertical: 12, borderRadius: 12, marginTop: 6 }}>
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: '#fff', textAlign: 'center', fontSize: 18, fontWeight: '700' }}>Register</Text>
            )}
          </TouchableOpacity>

          <Pressable onPress={() => router.back()} style={{ paddingVertical: 12 }}>
            <Text style={{ color: isDarkMode ? '#F59E0B' : '#7c2d12', textAlign: 'center', fontWeight: '600', textDecorationLine: 'underline' }}>
              Already have an account? Login
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

export default Register
