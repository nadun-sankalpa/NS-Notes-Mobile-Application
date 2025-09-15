import { View, Text, Pressable, ScrollView, Alert } from 'react-native'
import React, { use } from 'react'
import { getAllTasks, taskColRef } from '@/services/taskService'
import { useEffect } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router' 
import { Task } from '@/types/task'
import { useSegments } from 'expo-router'
import { onSnapshot } from 'firebase/firestore'

const TaskScreen = () => {

  const [tasks, setTasks] = React.useState<Task[]>([])
    
    const handleFetchData = async () =>{

       await getAllTasks().then((data) =>{
            setTasks(data)
            console.log(data)
       })
        // await getTasks().then((data) =>{
        //     console.log(data)
        // })
         .catch((err) => console.error(err))
    }

    const segment = useSegments()

    // useEffect(() => {
    //     handleFetchData()
    // },[segment])

    useEffect(() => {
      const unsubscribe =onSnapshot(taskColRef, (snapshot)=>{
        const taskList : Task[] = snapshot.docs.map((taskRef) =>({
            id: taskRef.id,
            ...taskRef.data()
        })) as Task[]
        setTasks(taskList)
      },
      (err) => console.error(err)
      )
      return () => unsubscribe()
      
    },[])

    const handleDelete = () =>{
      Alert.alert("Alert Title", "Alert Desc" , [{text: "Cancel"}, {text: "Delete", onPress: async () => {
        //user is confirmed so delete
      }}])
    }

    const router = useRouter()
  return (
    <View className='flex-1 w-full justify-center align-items-center'>
      <Text className='text-center text-4xl'>TaskScreen</Text>

      <View className='absolute bottom-5 right-5'>
        <Pressable className='bg-blue-600 px-6 py-3 rounded-full' onPress={() => router.push("/(dashboard)/tasks/new")}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      <ScrollView className='mt-8'>
        {tasks.map((task) =>{
          return (
            <View key={task.id} className='bg-gray-200 p-4 rounded-md mb-2'>
              <Text className='text-lg font-bold'>{task.title}</Text>
              <Text className='text-sm'>{task.description}</Text>
              <View className='flex-row justify-end mt-2'>
                <Pressable className='bg-blue-600 px-6 py-3 rounded-full mr-2' onPress={() => router.push(`/(dashboard)/tasks/${task.id}`)}>
                  <MaterialIcons name="edit" size={24} color="#fff" />
                </Pressable>
                <Pressable className='bg-red-600 px-6 py-3 rounded-full' onPress={handleDelete}>
                  <MaterialIcons name="delete" size={24} color="#fff" />
                </Pressable>
              </View>
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

export default TaskScreen