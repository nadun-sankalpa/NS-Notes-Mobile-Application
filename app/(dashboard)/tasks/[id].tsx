import { View, Text, TextInput, Touchable, TouchableOpacity, Alert } from 'react-native'
import React, { useEffect } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { createTask, getTaskById } from '@/services/taskService'
import { useRouter } from 'expo-router'


const TaskFormScreen = () => {

    const {id} = useLocalSearchParams()
    //params.id = {id}

    const isNew = !id || id === "new" //null or id is new -> save
    const [title, setTitle] = React.useState("")
    const [description, setDescription] = React.useState("")

    const router = useRouter()

    useEffect(() => {
        const load = async () => {
          if(!isNew && id){
            const task = await getTaskById(id as string)
            if(task){
                setTitle(task.title)
                setDescription(task.description)
            }
          }
        }
    },[id])

    const handleSubmit = async () => {
        //validation
        if(!title.trim){
            Alert.alert("Title is required")
            return
        }
        try{
            if(isNew){
                await createTask({title, description})
                
            }
            router.back()
        } catch(err){
            console.error("Error saving task", err)
            Alert.alert("Error saving task")
        }
    }
  
  return (
    <View>
      <Text>{isNew ? "New Task" : "Edit Task"}</Text>
      <TextInput className='border border-gray-500 rounded-md px-4 py-2 my-2' placeholder='Title' value={title} onChangeText={setTitle}/>
      <TextInput className='border border-gray-500 rounded-md px-4 py-2 my-2' placeholder='Description' value={description} onChangeText={setDescription}/>
      <TouchableOpacity className='bg-blue-600 px-6 py-3' onPress={handleSubmit}>
        <Text className='text-white text-x1 text-center'>{isNew ? "Save" : "Update"}</Text>
      </TouchableOpacity>
    </View>
  )
}

export default TaskFormScreen