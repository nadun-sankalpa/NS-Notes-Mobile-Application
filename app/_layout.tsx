import { View, Text } from 'react-native'
import React from 'react'
import { Slot, Stack } from 'expo-router'
import "./../global.css"
import { AuthProvider } from '@/context/AuthContext'
import { LoaderProvider } from '@/context/LoaderContext (1)'
import { BeautifulAlertProvider } from "@/components/BeautifulAlert"

const RootLayout = () => {
  return (
    <LoaderProvider>
      <AuthProvider>
        <BeautifulAlertProvider>
          <Slot/>
        </BeautifulAlertProvider>
      </AuthProvider>
    </LoaderProvider>
  )
}

export default RootLayout