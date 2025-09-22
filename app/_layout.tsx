import { View, Text } from 'react-native'
import React from 'react'
import { Slot, Stack, useRouter, useSegments } from 'expo-router'
import "./../global.css"
import { AuthProvider } from '../context/AuthContext';
import { LoaderProvider } from '@/context/LoaderContext (1)'
import { BeautifulAlertProvider } from "@/components/BeautifulAlert"
import { Beautiful3DProvider } from '../context/Beautiful3DContext';
import { ThemeProvider } from '../context/ThemeContext';
import { SettingsProvider } from '../context/SettingsContext';

const RootLayout = () => {
  // Remove auto-navigation to avoid navigation before mounting error
  return (
    <LoaderProvider>
      <AuthProvider>
        <ThemeProvider>
          <SettingsProvider>
            <BeautifulAlertProvider>
              <Beautiful3DProvider>
                <Slot/>
              </Beautiful3DProvider>
            </BeautifulAlertProvider>
          </SettingsProvider>
        </ThemeProvider>
      </AuthProvider>
    </LoaderProvider>
  )
}

export default RootLayout