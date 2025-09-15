import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const AuthLayout = () => {
  return <Stack 
  screenOptions={{
    headerShown: false,
    contentStyle: { backgroundColor: 'white' },
    animation: 'slide_from_right',
    animationDuration: 300,
   }}>
    <Stack.Screen name='login' />
    <Stack.Screen name='register' />
  </Stack>
}

export default AuthLayout