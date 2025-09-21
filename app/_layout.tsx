import { View, Text } from 'react-native'
import React from 'react'
import { Slot, Stack, useRouter, useSegments } from 'expo-router'
import "./../global.css"
import { AuthProvider } from '../context/AuthContext';
import { LoaderProvider } from '@/context/LoaderContext (1)'
import { BeautifulAlertProvider } from "@/components/BeautifulAlert"
import { ThemeProvider } from '../context/ThemeContext';

const RootLayout = () => {
  // Remove auto-navigation to avoid navigation before mounting error
  return (
    <LoaderProvider>
      <AuthProvider>
        <ThemeProvider>
          <BeautifulAlertProvider>
            <Slot/>
          </BeautifulAlertProvider>
        </ThemeProvider>
      </AuthProvider>
    </LoaderProvider>
  )
}

export default RootLayout