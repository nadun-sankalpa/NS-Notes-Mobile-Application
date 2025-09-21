import { View, Text } from 'react-native'
import React from 'react'
import { Slot, Tabs } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const DashBoardLayout = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: isDarkMode ? "#fff" : "#040f72",
    tabBarInactiveTintColor: isDarkMode ? "#888" : "#2c3e50",
    tabBarStyle: {
      backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
      borderTopWidth: 0,
      elevation: 8,
      shadowColor: '#1e6fe9',
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -2 },
      height: 65,
      paddingBottom: 8,
      paddingTop: 8,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 4,
    },
    tabBarIconStyle: {
      marginBottom: 2,
    },
  }}>
    <Tabs.Screen name="home" 
    options={{ 
        title: "Home",
        tabBarIcon: ({ color, size, focused }) => (
          <View style={{
            backgroundColor: focused ? (isDarkMode ? '#ffffff15' : '#e91e6315') : 'transparent',
            borderRadius: 12,
            padding: 8,
            minWidth: 40,
            alignItems: 'center',
          }}>
            <MaterialIcons 
              name="home" 
              size={focused ? size + 2 : size} 
              color={color} 
            />
          </View>
        )
    }} 
    />
    <Tabs.Screen name="tasks/index" options={{ title: "Task", 
      tabBarIcon: ({ color, size, focused }) => (
        <View style={{
          backgroundColor: focused ? (isDarkMode ? '#ffffff15' : '#e91e6315') : 'transparent',
          borderRadius: 12,
          padding: 8,
          minWidth: 40,
          alignItems: 'center',
        }}>
          <MaterialIcons 
            name="check-circle" 
            size={focused ? size + 2 : size} 
            color={color} 
          />
        </View>
      )
     }} />
    <Tabs.Screen name="profile" 
    options={{
         title: "Profile",
         tabBarIcon: ({ color, size, focused }) => (
           <View style={{
             backgroundColor: focused ? (isDarkMode ? '#ffffff15' : '#e91e6315') : 'transparent',
             borderRadius: 12,
             padding: 8,
             minWidth: 40,
             alignItems: 'center',
           }}>
             <MaterialIcons 
               name="person" 
               size={focused ? size + 2 : size} 
               color={color} 
             />
           </View>
         )
         }} />
    <Tabs.Screen name="setting" options={{ title: "Setting",
      tabBarIcon: ({ color, size, focused }) => (
        <View style={{
          backgroundColor: focused ? (isDarkMode ? '#ffffff15' : '#e91e6315') : 'transparent',
          borderRadius: 12,
          padding: 8,
          minWidth: 40,
          alignItems: 'center',
        }}>
          <MaterialIcons 
            name="settings" 
            size={focused ? size + 2 : size} 
            color={color} 
          />
        </View>
      )
     }} />
  </Tabs>
}

export default DashBoardLayout
