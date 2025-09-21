import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import React from 'react'
import { router } from 'expo-router'
import "./../global.css"
import { useRouter } from 'expo-router';
import  { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

const index = () => {
  const router = useRouter()
  const {user, loading} = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/(auth)/login")
      } else {
        router.push("/(auth)/login")
      }
    }
  }, [user, loading])

  return loading ? (
    <View className='flex-1 w-full justify-center align-items-center'>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  ):null
}

export default index