import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Dimensions, RefreshControl, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Platform, Image, Alert, PermissionsAndroid } from 'react-native';
import Animated, { FadeIn, SlideInUp, withRepeat, withTiming, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../context/AuthContext';
import { getAllTasksByUserId, createTask, deleteTask, updateTask } from '../../services/taskService';
import { FontAwesome } from '@expo/vector-icons';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import Voice from '@react-native-voice/voice';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';

const { width, height } = Dimensions.get('window');

const IMGBB_API_KEY = '0e1db39eeceeb3305730e6efa431f38b';

const HomeScreen = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { settings } = useSettings();
  const isDarkMode = theme === 'dark';
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animated bubbles
  const bubble1Scale = useSharedValue(1);
  const bubble2Scale = useSharedValue(1);
  useEffect(() => {
    bubble1Scale.value = withRepeat(withTiming(1.12, { duration: 2200 }), -1, true);
    bubble2Scale.value = withRepeat(withTiming(1.08, { duration: 1800 }), -1, true);
  }, []);
  const bubble1Style = useAnimatedStyle(() => ({ transform: [{ scale: bubble1Scale.value }] }));
  const bubble2Style = useAnimatedStyle(() => ({ transform: [{ scale: bubble2Scale.value }] }));

  // Fetch notes
  const fetchNotes = async () => {
    if (!user) return;
    setLoading(true);
    const userNotes = await getAllTasksByUserId(user.uid);
    setNotes(userNotes.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  };
  useEffect(() => { fetchNotes(); }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotes();
    setRefreshing(false);
  };

  // --- Add Note Modal State ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [fontSize, setFontSize] = useState(settings.defaultFontSize);
  const [fontFamily, setFontFamily] = useState('System');
  const [fontColor, setFontColor] = useState('#19376d');
  const [saving, setSaving] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  // When opening the modal for a new note, set the default styles from settings
  const handleAddNewNote = () => {
    setEditMode(false);
    setEditNote(null);
    setNoteTitle('');
    setNoteBody('');
    setFontSize(settings.defaultFontSize);
    setFontFamily(settings.defaultFont === 'SpaceMono' ? 'SpaceMono-Regular' : 'System');
    setFontColor('#19376d');
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setImage(null);
    setShowAddModal(true);
  };

  // --- Voice Typing State ---
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Voice.onSpeechResults = (event) => {
        if (event.value && event.value.length > 0) {
          setNoteBody(prev => prev + (prev ? ' ' : '') + event.value[0]);
        }
      };
      Voice.onSpeechEnd = () => setIsListening(false);
      return () => {
        Voice.destroy().then(Voice.removeAllListeners);
      };
    }
  }, []);

  const requestMicPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // First check if permission is already granted
        const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        if (hasPermission) {
          return true;
        }
        
        // Request permission with a clear dialog
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission Required',
            message: 'This app needs access to your microphone to record voice notes. Please allow microphone access.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Deny',
            buttonPositive: 'Allow',
          },
        );
        
        console.log('Permission result:', granted);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.log('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  const handleStartVoice = async () => {
    if (Platform.OS === 'web') {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition is not supported in this browser.');
        return;
      }
      setIsListening(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          setNoteBody(prev => prev + (prev ? ' ' : '') + event.results[0][0].transcript);
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
      // Save to state for stop
      window._currentRecognition = recognition;
    } else {
      try {
        const hasPermission = await requestMicPermission();
        if (!hasPermission) {
          Alert.alert('Permission Denied', 'Microphone permission is required for voice typing.');
          return;
        }
        
        // Check if Voice is available
        const isAvailable = await Voice.isAvailable();
        if (!isAvailable) {
          Alert.alert('Voice Recognition Unavailable', 'Speech recognition is not available on this device. Please make sure Google Speech Services is installed and enabled.');
          return;
        }
        
        setIsListening(true);
        await Voice.start('en-US');
      } catch (e) {
        console.log('Voice error details:', e);
        setIsListening(false);
        Alert.alert('Voice Error', 'Could not start voice recognition. Please check if Google Speech Services is enabled on your device.');
      }
    }
  };
  const handleStopVoice = async () => {
    if (Platform.OS === 'web') {
      if (window._currentRecognition) {
        window._currentRecognition.stop();
        window._currentRecognition = null;
      }
      setIsListening(false);
    } else {
      setIsListening(false);
      await Voice.stop();
    }
  };

  // --- View/Edit Modal State ---
  const [viewNote, setViewNote] = useState<any | null>(null);
  const [editNote, setEditNote] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);

  const fontSizes = [14, 16, 18, 22, 28];
  const fontColors = ['#19376d', '#284b8a', '#EA4335', '#1877F3', '#24292e', '#FFB300'];

  const handleSaveNote = async () => {
    if (!noteBody.trim()) return;
    setSaving(true);
    let imageUrl = null;
    if (image) {
      imageUrl = await uploadImageToImgbb(image);
    }
    await createTask({
      title: noteTitle,
      body: noteBody,
      fontSize,
      fontFamily,
      fontColor,
      isBold,
      isItalic,
      isUnderline,
      image: imageUrl,
      userId: user?.uid,
      createdAt: Date.now(),
    });
    setSaving(false);
    setShowAddModal(false);
    setNoteTitle('');
    setNoteBody('');
    setFontSize(settings.defaultFontSize);
    setFontFamily(settings.defaultFont === 'SpaceMono' ? 'SpaceMono-Regular' : 'System');
    setFontColor('#19376d');
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setImage(null);
    fetchNotes();
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status === 'granted') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.cancelled) {
        setImage(result.uri);
      }
    }
  };

  // Camera photo handler
  const handleTakePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleShareNote = async () => {
    if (image) {
      await Sharing.shareAsync(image);
    } else {
      await Sharing.shareAsync(noteBody);
    }
  };

  const handleDeleteNote = (id: string) => {
    const deleteAction = async () => {
      await deleteTask(id);
      fetchNotes();
    };

    if (settings.confirmDelete) {
      Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteAction },
      ]);
    } else {
      deleteAction();
    }
  };

  const handleEditNote = (note: any) => {
    setEditNote(note);
    setEditMode(true);
    setShowAddModal(true);
    setNoteTitle(note.title || '');
    setNoteBody(note.body || '');
    setFontSize(note.fontSize || 16);
    setFontFamily(note.fontFamily || 'System');
    setFontColor(note.fontColor || '#19376d');
    setIsBold(note.isBold || false);
    setIsItalic(note.isItalic || false);
    setIsUnderline(note.isUnderline || false);
    setImage(note.image || null);
  };

  const handleSaveEdit = async () => {
    if (!noteBody.trim() || !editNote) return;
    setSaving(true);
    let imageUrl = editNote.image;
    if (image && image !== editNote.image) {
      imageUrl = await uploadImageToImgbb(image);
    }
    await updateTask(editNote.id, {
      ...editNote,
      title: noteTitle,
      body: noteBody,
      fontSize,
      fontFamily,
      fontColor,
      isBold,
      isItalic,
      isUnderline,
      image: imageUrl,
    });
    setSaving(false);
    setShowAddModal(false);
    setEditNote(null);
    setEditMode(false);
    setNoteTitle('');
    setNoteBody('');
    setFontSize(settings.defaultFontSize);
    setFontFamily(settings.defaultFont === 'SpaceMono' ? 'SpaceMono-Regular' : 'System');
    setFontColor('#19376d');
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setImage(null);
    fetchNotes();
  };

  const uploadImageToImgbb = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          const formData = new FormData();
          formData.append('key', IMGBB_API_KEY);
          formData.append('image', base64data);
          try {
            const res = await fetch('https://api.imgbb.com/1/upload', {
              method: 'POST',
              body: formData,
            });
            const data = await res.json();
            if (data && data.success && data.data && data.data.url) {
              resolve(data.data.url);
            } else {
              resolve(null);
            }
          } catch (err) {
            resolve(null);
          }
        };
        reader.onerror = () => reject(null);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      return null;
    }
  };

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      {/* Animated bubbles */}
      <Animated.View
        entering={FadeIn.duration(1200)}
        style={[
          {
            position: 'absolute',
            top: -height * 0.13,
            left: -width * 0.22,
            width: width * 0.68,
            height: width * 0.68,
            borderRadius: width * 0.34,
            backgroundColor: isDarkMode ? '#000080' : '#000080', // Navy blue for both themes
            opacity: 0.09,
            zIndex: 0,
          },
          bubble1Style,
        ]}
      />
      <Animated.View
        entering={FadeIn.delay(400).duration(1500)}
        style={[
          {
            position: 'absolute',
            bottom: -height * 0.15,
            right: -width * 0.18,
            width: width * 0.48,
            height: width * 0.48,
            borderRadius: width * 0.24,
            backgroundColor: isDarkMode ? '#000080' : '#000080', // Navy blue for both themes
            opacity: 0.08,
            zIndex: 0,
          },
          bubble2Style,
        ]}
      />
      {/* Welcome section */}
      <Animated.View
        entering={SlideInUp.springify().damping(16)}
        style={styles.welcomeBox}
      >
        <Text style={styles.welcomeText}>Welcome{user?.displayName ? `, ${user.displayName}` : ''}!</Text>
        <Text style={styles.subText}>Here are your recent notes:</Text>
      </Animated.View>
      {/* Notes list */}
      <View style={{ flex: 1, zIndex: 1, marginTop: 12, width: '100%', paddingHorizontal: 16 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#19376d" style={{ marginTop: 40 }} />
        ) : notes.length === 0 ? (
          <Text style={{ textAlign: 'center', color: isDarkMode ? '#777' : '#888', marginTop: 60, fontSize: 18 }}>No notes found.</Text>
        ) : (
          <FlatList
            data={notes.slice(0, 6)}
            keyExtractor={item => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item }) => (
              <Animated.View entering={FadeIn.springify()} style={styles.noteCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={styles.noteTitle}>{item.title || 'Untitled Note'}</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => setViewNote(item)} style={{ marginRight: 4 }}>
                      <FontAwesome name="eye" size={20} color={isDarkMode ? '#fff' : '#284b8a'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleEditNote(item)} style={{ marginRight: 4 }}>
                      <FontAwesome name="edit" size={20} color={isDarkMode ? '#fff' : '#1877F3'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteNote(item.id)}>
                      <FontAwesome name="trash" size={20} color={isDarkMode ? '#fff' : '#EA4335'} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.noteBody} numberOfLines={2}>{item.body || item.content || ''}</Text>
                {item.image && (
                  <View style={{ marginTop: 8, marginBottom: 4 }}>
                    <Image 
                      source={{ uri: item.image }} 
                      style={{ width: 100, height: 100, borderRadius: 12 }}
                      onError={(error) => console.log('Image load error:', error)}
                      onLoad={() => console.log('Image loaded successfully:', item.image)}
                    />
                  </View>
                )}
                <Text style={styles.noteDate}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</Text>
              </Animated.View>
            )}
          />
        )}
      </View>
      {/* Add Note Floating Button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          right: 24,
          bottom: 36,
          backgroundColor: isDarkMode ? '#fff' : '#19376d',
          borderRadius: 32,
          width: 56,
          height: 56,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 6,
          zIndex: 10,
        }}
        onPress={handleAddNewNote}
        activeOpacity={0.85}
      >
        <Text style={{ color: isDarkMode ? '#19376d' : '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 2 }}>+</Text>
      </TouchableOpacity>

      {/* Add Note Modal - Beautiful Card Style, Improved Layout */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <BlurView intensity={20} tint={isDarkMode ? 'dark' : 'light'} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: isDarkMode ? '#1e1e1e' : '#fff', borderRadius: 24, padding: 28, width: width * 0.92, maxWidth: 420, shadowColor: isDarkMode ? '#fff' : '#19376d', shadowOpacity: 0.13, shadowRadius: 18, elevation: 8 }}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#19376d', marginBottom: 18, textAlign: 'center' }}>{editMode ? 'Edit Note' : 'Add Note'}</Text>
                {/* Title Input */}
                <TextInput
                  style={{ fontSize: 18, fontWeight: '600', color: isDarkMode ? '#fff' : '#19376d', backgroundColor: isDarkMode ? '#2e2e2e' : '#f2f6ff', borderRadius: 8, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: isDarkMode ? '#333' : '#e0eafc' }}
                  placeholder="Title (optional)"
                  value={noteTitle}
                  onChangeText={setNoteTitle}
                  maxLength={60}
                />
                {/* Formatting Toolbar */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 12, justifyContent: 'center' }}>
                  <TouchableOpacity onPress={() => setIsBold(v => !v)} style={{ backgroundColor: isBold ? (isDarkMode ? '#fff' : '#19376d') : (isDarkMode ? '#333' : '#e0eafc'), borderRadius: 6, padding: 8, margin: 2 }}>
                    <Text style={{ color: isBold ? (isDarkMode ? '#333' : '#fff') : (isDarkMode ? '#fff' : '#19376d'), fontWeight: 'bold', fontSize: 18 }}>B</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsItalic(v => !v)} style={{ backgroundColor: isItalic ? (isDarkMode ? '#fff' : '#19376d') : (isDarkMode ? '#333' : '#e0eafc'), borderRadius: 6, padding: 8, margin: 2 }}>
                    <Text style={{ color: isItalic ? (isDarkMode ? '#333' : '#fff') : (isDarkMode ? '#fff' : '#19376d'), fontStyle: 'italic', fontSize: 18 }}>I</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsUnderline(v => !v)} style={{ backgroundColor: isUnderline ? (isDarkMode ? '#fff' : '#19376d') : (isDarkMode ? '#333' : '#e0eafc'), borderRadius: 6, padding: 8, margin: 2 }}>
                    <Text style={{ color: isUnderline ? (isDarkMode ? '#333' : '#fff') : (isDarkMode ? '#fff' : '#19376d'), textDecorationLine: 'underline', fontSize: 18 }}>U</Text>
                  </TouchableOpacity>
                  <Text style={{ color: isDarkMode ? '#fff' : '#19376d', fontWeight: '600', marginLeft: 10 }}>Size:</Text>
                  {fontSizes.map(size => (
                    <TouchableOpacity key={size} onPress={() => setFontSize(size)} style={{ backgroundColor: fontSize === size ? (isDarkMode ? '#fff' : '#19376d') : (isDarkMode ? '#333' : '#e0eafc'), borderRadius: 6, paddingHorizontal: 8, marginHorizontal: 2, marginVertical: 2 }}>
                      <Text style={{ color: fontSize === size ? (isDarkMode ? '#333' : '#fff') : (isDarkMode ? '#fff' : '#19376d'), fontWeight: 'bold' }}>{size}</Text>
                    </TouchableOpacity>
                  ))}
                  <Text style={{ color: isDarkMode ? '#fff' : '#19376d', fontWeight: '600', marginLeft: 10 }}>Color:</Text>
                  {fontColors.map(color => (
                    <TouchableOpacity key={color} onPress={() => setFontColor(color)} style={{ backgroundColor: color, borderRadius: 12, width: 22, height: 22, marginHorizontal: 2, marginVertical: 2, borderWidth: fontColor === color ? 2 : 0, borderColor: isDarkMode ? '#fff' : '#19376d' }} />
                  ))}
                  <TouchableOpacity onPress={handleStartVoice} style={{ backgroundColor: isListening ? (isDarkMode ? '#EA4335' : '#EA4335') : (isDarkMode ? '#333' : '#e0eafc'), borderRadius: 6, padding: 8, margin: 2 }}>
                    <Text style={{ color: isListening ? (isDarkMode ? '#fff' : '#fff') : (isDarkMode ? '#fff' : '#19376d'), fontSize: 18 }}>{isListening ? 'Stop' : 'Voice'}</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[
                    {
                      fontSize,
                      color: fontColor,
                      fontWeight: isBold ? 'bold' : 'normal',
                      fontStyle: isItalic ? 'italic' : 'normal',
                      textDecorationLine: isUnderline ? 'underline' : 'none',
                      backgroundColor: isDarkMode ? '#2e2e2e' : '#f8fafd',
                      borderRadius: 8,
                      padding: 12,
                      minHeight: 80,
                      marginBottom: 16,
                      textAlignVertical: 'top',
                      borderWidth: 1,
                      borderColor: isDarkMode ? '#333' : '#e0eafc',
                      fontFamily: fontFamily,
                    },
                  ]}
                  placeholder="Type your note..."
                  value={noteBody}
                  onChangeText={setNoteBody}
                  multiline
                  maxLength={1000}
                />
                {/* Image, Camera, Mic, and Share Buttons Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 16, gap: 14 }}>
                  <TouchableOpacity onPress={handlePickImage} style={{ backgroundColor: isDarkMode ? '#333' : '#e0eafc', borderRadius: 8, padding: 10, marginRight: 4 }}>
                    <FontAwesome name="image" size={22} color={isDarkMode ? '#fff' : '#19376d'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleTakePhoto} style={{ backgroundColor: isDarkMode ? '#333' : '#e0eafc', borderRadius: 8, padding: 10, marginRight: 4 }}>
                    <FontAwesome name="camera" size={22} color={isDarkMode ? '#fff' : '#19376d'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={isListening ? handleStopVoice : handleStartVoice} style={{ backgroundColor: isListening ? (isDarkMode ? '#EA4335' : '#EA4335') : (isDarkMode ? '#333' : '#e0eafc'), borderRadius: 8, padding: 10, marginRight: 4 }}>
                    <FontAwesome name="microphone" size={22} color={isListening ? (isDarkMode ? '#fff' : '#fff') : (isDarkMode ? '#fff' : '#19376d')} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleShareNote} style={{ backgroundColor: isDarkMode ? '#1877F3' : '#1877F3', borderRadius: 8, padding: 10 }}>
                    <FontAwesome name="share-alt" size={22} color={isDarkMode ? '#fff' : '#fff'} />
                  </TouchableOpacity>
                </View>
                {image && (
                  <View style={{ marginBottom: 12, alignSelf: 'flex-start' }}>
                    <Text style={{ color: isDarkMode ? '#fff' : '#19376d', marginBottom: 4 }}>Attached Image:</Text>
                    <Image source={{ uri: image }} style={{ width: 120, height: 120, borderRadius: 12 }} />
                  </View>
                )}
                {/* Save/Cancel Buttons */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%' }}>
                  <TouchableOpacity
                    style={{ backgroundColor: isDarkMode ? '#333' : '#e0eafc', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, marginRight: 8 }}
                    onPress={() => setShowAddModal(false)}
                    disabled={saving}
                  >
                    <Text style={{ color: isDarkMode ? '#fff' : '#19376d', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: isDarkMode ? '#fff' : '#19376d', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 }}
                    onPress={editMode ? handleSaveEdit : handleSaveNote}
                    disabled={saving || !noteBody.trim()}
                  >
                    <Text style={{ color: isDarkMode ? '#333' : '#fff', fontWeight: 'bold', fontSize: 16 }}>{saving ? 'Saving...' : editMode ? 'Save Changes' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>

      {/* View Note Modal */}
      <Modal
        visible={!!viewNote}
        animationType="slide"
        transparent
        onRequestClose={() => setViewNote(null)}
      >
        <BlurView tint={isDarkMode ? 'dark' : 'light'} intensity={100} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: isDarkMode ? '#1e1e1e' : '#fff', borderRadius: 22, padding: 28, width: width * 0.92, maxWidth: 420, shadowColor: isDarkMode ? '#fff' : '#19376d', shadowOpacity: 0.13, shadowRadius: 18, elevation: 8 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: isDarkMode ? '#fff' : '#19376d', marginBottom: 12, textAlign: 'center' }}>{viewNote?.title || 'Untitled Note'}</Text>
            {viewNote?.image && (
              <Image source={{ uri: viewNote.image }} style={{ width: 180, height: 180, borderRadius: 16, alignSelf: 'center', marginBottom: 16 }} />
            )}
            <ScrollView style={{ maxHeight: 220 }}>
              <Text style={{ fontSize: viewNote?.fontSize || 16, color: viewNote?.fontColor || (isDarkMode ? '#fff' : '#19376d'), fontWeight: viewNote?.isBold ? 'bold' : 'normal', fontStyle: viewNote?.isItalic ? 'italic' : 'normal', textDecorationLine: viewNote?.isUnderline ? 'underline' : 'none', marginBottom: 10 }}>
                {viewNote?.body}
              </Text>
            </ScrollView>
            <Text style={{ fontSize: 13, color: isDarkMode ? '#777' : '#888', textAlign: 'right', marginTop: 12 }}>{viewNote?.createdAt ? new Date(viewNote.createdAt).toLocaleString() : ''}</Text>
            <TouchableOpacity
              style={{ backgroundColor: isDarkMode ? '#333' : '#e0eafc', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, marginTop: 18, alignSelf: 'center' }}
              onPress={() => setViewNote(null)}
            >
              <Text style={{ color: isDarkMode ? '#fff' : '#19376d', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0a0a0a' : '#f7fafd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: isDarkMode ? '#000080' : '#000080', // Navy blue for both themes
    opacity: 0.08,
    zIndex: 0,
  },
  welcomeBox: {
    padding: 20,
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#19376d',
  },
  subText: {
    fontSize: 18,
    color: isDarkMode ? '#aaa' : '#555',
    marginTop: 8,
  },
  noteCard: {
    backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#19376d',
  },
  noteBody: {
    fontSize: 14,
    color: isDarkMode ? '#ccc' : '#666',
    marginTop: 4,
  },
  noteDate: {
    fontSize: 12,
    color: isDarkMode ? '#888' : '#aaa',
    marginTop: 8,
    textAlign: 'right',
  },
});

export default HomeScreen;