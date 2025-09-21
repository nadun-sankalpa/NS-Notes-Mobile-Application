import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, Dimensions, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile, sendPasswordResetEmail, deleteUser, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../../firebase';
import Animated, { FadeInUp, FadeInDown, withRepeat, withTiming, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { getAllTasksByUserId } from '../../services/taskService';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

// Re-using the imgbb API key and upload function logic from home.tsx
const IMGBB_API_KEY = '0e1db39eeceeb3305730e6efa431f38b';

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
          if (data?.success) {
            resolve(data.data.url);
          } else {
            resolve(null);
          }
        } catch (err) {
          resolve(null);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    return null;
  }
};

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [newImage, setNewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [noteCount, setNoteCount] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Animated bubbles
  const bubble1Scale = useSharedValue(1);
  const bubble2Scale = useSharedValue(1);
  useEffect(() => {
    bubble1Scale.value = withRepeat(withTiming(1.12, { duration: 2200 }), -1, true);
    bubble2Scale.value = withRepeat(withTiming(1.08, { duration: 1800 }), -1, true);
  }, []);
  const bubble1Style = useAnimatedStyle(() => ({ transform: [{ scale: bubble1Scale.value }] }));
  const bubble2Style = useAnimatedStyle(() => ({ transform: [{ scale: bubble2Scale.value }] }));

  useEffect(() => {
    const fetchNoteCount = async () => {
      if (user) {
        const notes = await getAllTasksByUserId(user.uid);
        setNoteCount(notes.length);
      }
    };
    fetchNoteCount();
  }, [user]);

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setNewImage(result.assets[0].uri);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let photoURL = user.photoURL;
      if (newImage) {
        const uploadedUrl = await uploadImageToImgbb(newImage);
        if (uploadedUrl) {
          photoURL = uploadedUrl;
        }
      }

      await updateProfile(user, { displayName, photoURL });
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
      setNewImage(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile.');
    }
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    if (!user || !user.email) return;

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      Alert.alert('Success', 'Your password has been updated.');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', 'Failed to update password. Please check your current password and try again.');
    }
    setLoading(false);
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (user) {
              try {
                await deleteUser(user);
                Alert.alert('Success', 'Your account has been successfully deleted.');
                logout();
              } catch (error: any) {
                console.error("Delete Account Error:", error);
                let errorMessage = 'Failed to delete account. Please try again later.';
                if (error.code === 'auth/requires-recent-login') {
                  errorMessage = 'This is a sensitive operation. Please log out and log back in before trying again.';
                }
                Alert.alert('Error', errorMessage);
              }
            }
          },
        },
      ]
    );
  };

  const styles = getStyles(isDarkMode);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View style={[styles.bubble, { top: -height * 0.1, left: -width * 0.2, backgroundColor: '#000080' }, bubble1Style]} />
      <Animated.View style={[styles.bubble, { bottom: -height * 0.15, right: -width * 0.18, backgroundColor: '#000080' }, bubble2Style]} />

      <Animated.View entering={FadeInUp.duration(1000).springify()} style={styles.profileContainer}>
        <TouchableOpacity onPress={handlePickImage} disabled={!isEditing}>
          <Image 
            source={{ uri: newImage || user?.photoURL || 'https://via.placeholder.com/150' }} 
            style={styles.profileImage} 
          />
          <View style={styles.verifiedBadge}>
            <MaterialIcons name="verified" size={24} color="#fff" />
          </View>
          {isEditing && (
            <View style={styles.editIcon}>
              <FontAwesome name="camera" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(1000).delay(200).springify()} style={styles.card}>
        <Text style={styles.cardTitle}>Profile Details</Text>
        <Text style={styles.label}>Display Name</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
          />
        ) : (
          <Text style={styles.value}>{user?.displayName || 'No name set'}</Text>
        )}

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>

        {isEditing ? (
          <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(1000).delay(400).springify()} style={styles.card}>
        <Text style={styles.cardTitle}>User Stats</Text>
        <View style={styles.statItem}>
          <FontAwesome name="sticky-note" size={24} color="#19376d" />
          <Text style={styles.statText}>Total Notes Created: {noteCount}</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(1000).delay(600).springify()} style={styles.card}>
        <Text style={styles.cardTitle}>Account Management</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
          <FontAwesome name="key" size={20} color="#fff" />
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDeleteAccount}>
          <FontAwesome name="trash" size={20} color="#fff" />
          <Text style={styles.buttonText}>Delete Account</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(1000).delay(800).springify()} style={{width: '100%', marginTop: 10}}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Current Password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleUpdatePassword} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#0a0a0a' : '#f7fafd',
    padding: 20,
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
  profileContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  profileImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: isDarkMode ? '#333' : '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#1e6fe9',
    borderRadius: 20,
    padding: 5,
  },
  editIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#19376d',
    borderRadius: 20,
    padding: 8,
  },
  card: {
    width: '100%',
    backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#19376d',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: isDarkMode ? '#888' : '#9ca3af',
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    color: isDarkMode ? '#fff' : '#19376d',
    marginBottom: 20,
    fontWeight: '500',
  },
  input: {
    fontSize: 18,
    color: isDarkMode ? '#fff' : '#19376d',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#444' : '#d1d5db',
    paddingBottom: 5,
  },
  editButton: {
    backgroundColor: '#19376d',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#f59e0b',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  statText: {
    fontSize: 18,
    color: isDarkMode ? '#fff' : '#19376d',
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#19376d',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    fontSize: 16,
    padding: 15,
    backgroundColor: isDarkMode ? '#333' : '#f7fafd',
    borderRadius: 10,
    marginBottom: 15,
    color: isDarkMode ? '#fff' : '#000',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#9ca3af',
    marginRight: 10,
  },
});

export default ProfileScreen;