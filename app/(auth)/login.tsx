import { View, Text, Pressable, TextInput } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { Alert } from 'react-native';
import { login } from '@/services/authService'

const Login = () => {
    const router = useRouter()

    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [loading, setLoading] = React.useState(false)

    const handleLogin = async() => {
        if(loading) return; // Prevent multiple submissions
        if(email === "" || password === "") {
            Alert.alert("Please fill out all fields")
            return
        }

        setLoading(true)

        await login(email, password)
        .then((res) => {
            router.back()
        })
        .catch((err) => {
            Alert.alert("Login failed", err.message)
            console.error(err)
        })
        .finally(() => {
            setLoading(false)
            
        })
        
    }
  return (
    <View className='flex-1 w-full justify-center align-items-center'>
      <Text className='text-4xl'>Login</Text>
      <TextInput className='border border-gray-500 rounded-md px-4 py-2 my-2' placeholder='Email' value={email} onChangeText={setEmail} />
      <TextInput className='border border-gray-500 rounded-md px-4 py-2 my-2' placeholder='Password' value={password} onChangeText={setPassword} />
      <Pressable className='bg-green-500 px-6 py-3' onPress={handleLogin}>
        <Text className='text-white text-center'>{loading ? "Loading..." : "Login"}</Text>
      </Pressable>
      <Pressable className='bg-blue-600 px-6 py-3' onPress={() => router.push("/register")}>
        <Text className='text-white text-center'>Go to Register</Text>
      </Pressable>
    </View>
  )
}

export default Login