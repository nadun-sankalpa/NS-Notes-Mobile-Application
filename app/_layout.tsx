import { View, Text } from "react-native"
import React, { useEffect, useState } from "react"
import { Slot, Stack } from "expo-router"
import "./../global.css"
import { AuthProvider } from "../context/AuthContext"
import { LoaderProvider } from "../context/LoaderContext"
import { ThemeProvider } from "../context/ThemeContext"
import { SettingsProvider } from "../context/SettingsContext"
import { Beautiful3DProvider } from "../context/Beautiful3DContext"
import StartupSplash from "../components/StartupSplash"

const RootLayout = () => {
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(t);
  }, []);
  return (
    <LoaderProvider>
      <AuthProvider>
        <ThemeProvider>
          <SettingsProvider>
            <Beautiful3DProvider>
              {showSplash ? <StartupSplash /> : <Slot />}
            </Beautiful3DProvider>
          </SettingsProvider>
        </ThemeProvider>
      </AuthProvider>
    </LoaderProvider>
  )
}

export default RootLayout