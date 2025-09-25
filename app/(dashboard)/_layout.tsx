import { View, Text } from 'react-native'
import React from 'react'
import { Slot, Tabs } from 'expo-router'
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Beautiful3DProvider } from '../../context/Beautiful3DContext';
import { useTheme } from '../../context/ThemeContext';

const DashBoardLayout = () => {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    return <Beautiful3DProvider><Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDarkMode ? "#FBBF24" : "#F59E0B",
        tabBarInactiveTintColor: isDarkMode ? "#666" : "#757575",
        tabBarStyle: {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            borderTopWidth: 0,
            elevation: 20,
            shadowColor: isDarkMode ? '#FBBF24' : '#F59E0B',
            shadowOpacity: isDarkMode ? 0.4 : 0.15,
            shadowRadius: 15,
            shadowOffset: { width: 0, height: -3 },
            height: 75,
            paddingBottom: 12,
            paddingTop: 12,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            position: 'absolute',
            left: 10,
            right: 10,
            bottom: 10,
            marginHorizontal: 5,
        },
        tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
            letterSpacing: 0.5,
        },
        tabBarIconStyle: {
            marginBottom: 0,
        },
    }}>
        <Tabs.Screen name="home"
                     options={{
                         title: "Notes",
                         tabBarIcon: ({ color, size, focused }) => (
                             <View style={{
                                backgroundColor: focused ? (isDarkMode ? '#FBBF2433' : '#F59E0B33') : 'transparent',
                                borderRadius: 16,
                                padding: 10,
                                minWidth: 45,
                                minHeight: 45,
                                alignItems: 'center',
                                justifyContent: 'center',
                                transform: [{ scale: focused ? 1.1 : 1 }],
                            }}>
                                 <Ionicons
                                     name={focused ? "document-text" : "document-text-outline"}
                                     size={focused ? 24 : 22}
                                     color={color}
                                 />
                             </View>
                         )
                     }}
        />
        <Tabs.Screen name="tasks" options={{
            title: "Reminders",
            tabBarLabel: "Reminders",
            tabBarIcon: ({ color, size, focused }) => (
                <View style={{
                    backgroundColor: focused ? (isDarkMode ? '#FBBF2433' : '#F59E0B33') : 'transparent',
                    borderRadius: 16,
                    padding: 10,
                    minWidth: 45,
                    minHeight: 45,
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{ scale: focused ? 1.1 : 1 }],
                }}>
                    <MaterialIcons
                        name={focused ? "notifications-active" : "notifications-none"}
                        size={focused ? 24 : 22}
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
                                 backgroundColor: focused ? (isDarkMode ? '#FBBF2433' : '#F59E0B33') : 'transparent',
                                 borderRadius: 16,
                                 padding: 10,
                                 minWidth: 45,
                                 minHeight: 45,
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 transform: [{ scale: focused ? 1.1 : 1 }],
                             }}>
                                 <Ionicons
                                     name={focused ? "person" : "person-outline"}
                                     size={focused ? 24 : 22}
                                     color={color}
                                 />
                             </View>
                         )
                     }} />
        <Tabs.Screen name="setting" options={{ title: "Settings",
            tabBarIcon: ({ color, size, focused }) => (
                <View style={{
                    backgroundColor: focused ? (isDarkMode ? '#FBBF2433' : '#F59E0B33') : 'transparent',
                    borderRadius: 16,
                    padding: 10,
                    minWidth: 45,
                    minHeight: 45,
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{ scale: focused ? 1.1 : 1 }],
                }}>
                    <Ionicons
                        name={focused ? "settings" : "settings-outline"}
                        size={focused ? 24 : 22}
                        color={color}
                    />
                </View>
            )
        }} />
    </Tabs></Beautiful3DProvider>
}

export default DashBoardLayout
