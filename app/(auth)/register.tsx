import { View, Text, Pressable, TextInput, TouchableOpacity, Alert } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import { register } from '@/services/authService'

const Register = () => {
    const router = useRouter()
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [confirmPassword, setConfirmPassword] = React.useState("")

    const handleRegister = async() => {
        if(email === "" || password === "" || confirmPassword === "") {
            Alert.alert("Please fill out all fields")
            return
        }
        if(password !== confirmPassword) {
            Alert.alert("Passwords do not match")
            return
        }

        await register(email, password)
        .then((res)=>{
            router.back()
        })
        .catch((err)=>{
            Alert.alert("Registration failed", err.message)
            console.error(err)
        })
        .finally(()=>{
            
        })
    }
  return (
    <View className='flex-1 w-full justify-center align-items-center'>
      <Text className='text-4xl'>Register</Text>
      <TextInput className='border border-gray-500 rounded-md px-4 py-2 my-2' placeholder='Email' value={email} onChangeText={setEmail} />
      <TextInput className='border border-gray-500 rounded-md px-4 py-2 my-2' placeholder='Password' value={password} onChangeText={setPassword} />
      <TextInput className='border border-gray-500 rounded-md px-4 py-2 my-2' placeholder='Confirm Password' value={confirmPassword} onChangeText={setConfirmPassword} />
      <TouchableOpacity className='bg-green-500 px-6 py-3' onPress={handleRegister}>
        <Text className='text-white text-center'>Register</Text>
      </TouchableOpacity>
      <Pressable className='bg-blue-600 px-6 py-3' onPress={() => router.back()}>
        <Text className='text-white text-center'>Already have an account? Go to Login</Text>
      </Pressable>
    </View>
  )
}

export default Register