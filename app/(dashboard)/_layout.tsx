import { View, Text } from 'react-native'
import React from 'react'
import { Slot, Tabs } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons';

const DashBoardLayout = () => {
  return <Tabs screenOptions={{headerShown: false, tabBarActiveTintColor: "#e91e63", tabBarInactiveTintColor: "#2c3e50"}}>
    <Tabs.Screen name="home" 
    options={{ 
        title: "Home" ,
        tabBarIcon:(data)=>(
            <MaterialIcons 
            name="home" 
            size={data.size} 
            color={data.color} />
        )
    }} 
    />
    <Tabs.Screen name="profile" 
    options={{
         title: "Profile" ,
         tabBarIcon:(data)=>(
            <MaterialIcons 
            name="person" 
            size={data.size} 
            color={data.color} />
        )
         }} />
    <Tabs.Screen name="setting" options={{ title: "Setting",
      tabBarIcon:(data)=>(
            <MaterialIcons 
            name="settings" 
            size={data.size} 
            color={data.color} />
        )
     }} />
    <Tabs.Screen name="tasks/index" options={{ title: "Task", 
      tabBarIcon:(data)=>(
            <MaterialIcons 
            name="check-circle" 
            size={data.size} 
            color={data.color} />
        )
     }} />
  </Tabs>
}

export default DashBoardLayout