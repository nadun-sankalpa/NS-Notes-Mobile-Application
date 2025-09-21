import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, Platform, Dimensions, FlatList, Linking } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import * as Application from 'expo-application';
import { useAuth } from '../../../context/AuthContext';
import { createReminder, getAllRemindersByUserId, deleteReminder as deleteReminderFromFirebase, Reminder as FirebaseReminder, updateReminder } from '../../../services/reminderService';
import AlarmPopup from '../../../components/AlarmPopup';

const { width, height } = Dimensions.get('window');

// Configure notifications to play sound and show alerts like a real alarm
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('🔔 Notification handler called:', notification);
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

interface Reminder {
  id: string;
  title: string;
  date: Date;
  notificationId?: string;
}

const RemindersScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDarkMode = theme === 'dark';
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Alarm popup state
  const [showAlarmPopup, setShowAlarmPopup] = useState(false);
  const [currentAlarmReminder, setCurrentAlarmReminder] = useState<Reminder | null>(null);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

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
    loadReminders();
    requestNotificationPermissions();
    setupNotificationListeners();

    return () => {
      // Clean up notification listeners
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const setupNotificationListeners = () => {
    console.log('🔧 Setting up notification listeners...');
    
    // Listen for notifications when app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received in foreground:', notification);
      console.log('   - Identifier:', notification.request.identifier);
      console.log('   - Title:', notification.request.content.title);
      console.log('   - Body:', notification.request.content.body);
      console.log('   - Data:', notification.request.content.data);
      
      // Find the reminder that triggered this notification
      const triggerredReminder = reminders.find(r => 
        r.notificationId === notification.request.identifier ||
        notification.request.content.data?.reminderId === r.id
      );
      
      console.log('🔍 Looking for reminder with ID:', notification.request.identifier);
      console.log('📋 Available reminders:', reminders.map(r => ({ id: r.id, notificationId: r.notificationId, title: r.title })));
      
      if (triggerredReminder) {
        console.log('✅ Found matching reminder:', triggerredReminder.title);
        // Show full-screen alarm popup
        setCurrentAlarmReminder(triggerredReminder);
        setShowAlarmPopup(true);
      } else {
        console.log('❌ No matching reminder found for notification');
        // Still show alarm popup with notification data
        const fallbackReminder: Reminder = {
          id: notification.request.content.data?.reminderId || notification.request.identifier,
          title: notification.request.content.data?.reminderTitle || notification.request.content.body || 'Reminder',
          date: new Date(),
          notificationId: notification.request.identifier,
        };
        setCurrentAlarmReminder(fallbackReminder);
        setShowAlarmPopup(true);
      }
    });

    // Listen for notification responses (when user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 Notification response received:', response);
      console.log('   - Identifier:', response.notification.request.identifier);
      console.log('   - Action:', response.actionIdentifier);
      
      // Find the reminder that triggered this notification
      const triggerredReminder = reminders.find(r => 
        r.notificationId === response.notification.request.identifier ||
        response.notification.request.content.data?.reminderId === r.id
      );
      
      if (triggerredReminder) {
        console.log('✅ Found matching reminder for response:', triggerredReminder.title);
        // Show full-screen alarm popup
        setCurrentAlarmReminder(triggerredReminder);
        setShowAlarmPopup(true);
      } else {
        console.log('❌ No matching reminder found for notification response');
        // Still show alarm popup with notification data
        const fallbackReminder: Reminder = {
          id: response.notification.request.content.data?.reminderId || response.notification.request.identifier,
          title: response.notification.request.content.data?.reminderTitle || response.notification.request.content.body || 'Reminder',
          date: new Date(),
          notificationId: response.notification.request.identifier,
        };
        setCurrentAlarmReminder(fallbackReminder);
        setShowAlarmPopup(true);
      }
    });
    
    console.log('✅ Notification listeners set up successfully');
  };

  const requestNotificationPermissions = async () => {
    console.log('🔐 Requesting notification permissions...');
    
    try {
      // First check current permissions
      const currentPermissions = await Notifications.getPermissionsAsync();
      console.log('📋 Current permissions:', currentPermissions);
      
      if (currentPermissions.status !== 'granted') {
        console.log('❌ Permissions not granted, requesting...');
        const { status, canAskAgain } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: false,
          },
        });
        
        console.log('📋 Permission request result:', { status, canAskAgain });
        
        if (status !== 'granted') {
          Alert.alert(
            'Notification Permission Required',
            'Please enable notifications in your device settings to receive reminder alerts with sound. Without this permission, reminders will not work.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openURL('package:' + Application.applicationId);
                  }
                }
              }
            ]
          );
          return false;
        }
      }
      
      console.log('✅ Notification permissions granted');
      
      // Test immediate notification to verify it works
      console.log('🧪 Testing immediate notification...');
      const testNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'If you see this, notifications are working!',
          sound: 'default',
        },
        trigger: {
          seconds: 2,
        },
      });
      console.log('✅ Test notification scheduled with ID:', testNotificationId);
      
      return true;
    } catch (error) {
      console.error('❌ Error with notification permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions. Please try again.');
      return false;
    }
  };

  const handleAlarmDismiss = async () => {
    if (currentAlarmReminder) {
      // Remove the reminder from Firebase and local storage
      try {
        await deleteReminderFromFirebase(currentAlarmReminder.id);
        const updatedReminders = reminders.filter(r => r.id !== currentAlarmReminder.id);
        await saveReminders(updatedReminders);
        console.log('✅ Alarm dismissed and reminder deleted:', currentAlarmReminder.title);
      } catch (error) {
        console.error('Failed to delete reminder after dismiss:', error);
      }
    }
    
    setShowAlarmPopup(false);
    setCurrentAlarmReminder(null);
  };

  const handleAlarmSnooze = async (minutes: number) => {
    if (currentAlarmReminder && user?.uid) {
      try {
        // Calculate new snooze time
        const snoozeDate = new Date();
        snoozeDate.setMinutes(snoozeDate.getMinutes() + minutes);
        
        // Cancel the current notification
        if (currentAlarmReminder.notificationId) {
          await Notifications.cancelScheduledNotificationAsync(currentAlarmReminder.notificationId);
        }
        
        // Schedule new notification for snooze time
        const newNotificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🔔 Reminder Alert (Snoozed)',
            body: currentAlarmReminder.title,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
            vibrate: [0, 250, 250, 250],
          },
          trigger: {
            date: snoozeDate,
          },
        });
        
        // Update reminder in Firebase with new date and notification ID
        const updatedReminderData = {
          date: snoozeDate,
          notificationId: newNotificationId,
        };
        
        await updateReminder(currentAlarmReminder.id, updatedReminderData);
        
        // Update local state
        const updatedReminders = reminders.map(r => 
          r.id === currentAlarmReminder.id 
            ? { ...r, date: snoozeDate, notificationId: newNotificationId }
            : r
        ).sort((a, b) => a.date.getTime() - b.date.getTime());
        
        await saveReminders(updatedReminders);
        
        console.log(`⏰ Alarm snoozed for ${minutes} minutes:`, currentAlarmReminder.title);
        Alert.alert('⏰ Snoozed', `Reminder snoozed for ${minutes} minutes. You'll be alerted again at ${snoozeDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
        
      } catch (error) {
        console.error('Failed to snooze alarm:', error);
        Alert.alert('Error', 'Failed to snooze reminder. Please try again.');
      }
    }
    
    setShowAlarmPopup(false);
    setCurrentAlarmReminder(null);
  };

  const debugNotifications = async () => {
    console.log('🐛 DEBUG: Starting notification system debug...');
    
    try {
      // Check permissions
      const permissions = await Notifications.getPermissionsAsync();
      console.log('🔐 Current permissions:', permissions);
      
      // Get all scheduled notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log('📅 Scheduled notifications:', scheduled.length);
      scheduled.forEach((notif, index) => {
        console.log(`   ${index + 1}. ID: ${notif.identifier}, Trigger: ${JSON.stringify(notif.trigger)}`);
      });
      
      // Test immediate notification
      console.log('🧪 Scheduling test notification in 3 seconds...');
      const testId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Debug Test',
          body: 'This is a test notification to verify the system works!',
          sound: 'default',
          data: { isTest: true },
        },
        trigger: { seconds: 3 },
      });
      
      Alert.alert(
        '🐛 Debug Info',
        `Permissions: ${permissions.status}\nScheduled: ${scheduled.length} notifications\nTest notification scheduled for 3 seconds\n\nCheck console for detailed logs.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Debug error:', error);
      Alert.alert('Debug Error', error.message);
    }
  };

  const loadReminders = async () => {
    if (!user?.uid) return;
    
    try {
      // First, try to load from Firebase (primary source)
      const firebaseReminders = await getAllRemindersByUserId(user.uid);
      
      // Convert Firebase reminders to local format
      const localReminders: Reminder[] = firebaseReminders.map(reminder => ({
        id: reminder.id!,
        title: reminder.title,
        date: reminder.date,
        notificationId: reminder.notificationId,
      }));
      
      setReminders(localReminders);
      
      // Also save to local storage for offline access
      await AsyncStorage.setItem('reminders', JSON.stringify(localReminders));
      
      console.log('✅ Loaded', localReminders.length, 'reminders from Firebase');
    } catch (error) {
      console.error('❌ Failed to load from Firebase, trying local storage:', error);
      
      // Fallback to local storage if Firebase fails
      try {
        const savedReminders = await AsyncStorage.getItem('reminders');
        if (savedReminders) {
          const parsedReminders = JSON.parse(savedReminders).map((reminder: any) => ({
            ...reminder,
            date: new Date(reminder.date),
          }));
          setReminders(parsedReminders);
          console.log('✅ Loaded', parsedReminders.length, 'reminders from local storage');
        }
      } catch (localError) {
        console.error('❌ Failed to load from local storage:', localError);
      }
    }
  };

  const saveReminders = async (newReminders: Reminder[]) => {
    try {
      // Save to local storage for offline access
      await AsyncStorage.setItem('reminders', JSON.stringify(newReminders));
      setReminders(newReminders);
    } catch (error) {
      console.error('Failed to save reminders to local storage:', error);
    }
  };

  const scheduleNotification = async (reminder: Reminder) => {
    try {
      // Check if the date is in the future
      const now = new Date();
      if (reminder.date <= now) {
        console.error('❌ Cannot schedule notification for past date:', reminder.date);
        Alert.alert('Error', 'Cannot schedule reminder for a past date and time.');
        return null;
      }

      console.log('⏰ Scheduling notification for:', reminder.date.toISOString(), 'Current time:', now.toISOString());
      
      // Schedule a local notification with sound alert like a real phone alarm
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Reminder Alert',
          body: reminder.title,
          sound: 'default', // This plays the default notification sound
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 250, 250, 250], // Vibration pattern
          data: {
            reminderId: reminder.id,
            reminderTitle: reminder.title,
          },
        },
        trigger: {
          date: reminder.date,
        },
      });
      
      console.log('✅ Notification scheduled successfully!');
      console.log('   - Notification ID:', notificationId);
      console.log('   - Scheduled for:', reminder.date.toISOString());
      console.log('   - Title:', reminder.title);
      console.log('   - Time until trigger:', Math.round((reminder.date.getTime() - now.getTime()) / 1000), 'seconds');
      
      // Verify the notification was scheduled by getting all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('📋 Total scheduled notifications:', scheduledNotifications.length);
      const ourNotification = scheduledNotifications.find(n => n.identifier === notificationId);
      if (ourNotification) {
        console.log('✅ Verified: Our notification is in the scheduled list');
      } else {
        console.log('❌ Warning: Our notification was not found in scheduled list');
      }
      
      // Show confirmation that the alarm is set
      Alert.alert(
        '🔔 Reminder Set!', 
        `You'll get a sound alert for "${reminder.title}" on ${reminder.date.toLocaleDateString()} at ${reminder.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n\n📱 Your phone will play a sound and vibrate when the time comes!\n\nNotification ID: ${notificationId}`
      );
      
      return notificationId;
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      Alert.alert('Error', 'Failed to schedule reminder alert. Please check notification permissions.');
      return null;
    }
  };

  const handleAddReminder = async () => {
    if (!reminderTitle.trim()) {
      Alert.alert('Error', 'Please enter a reminder title.');
      return;
    }

    if (selectedDate <= new Date()) {
      Alert.alert('Error', 'Please select a future date and time.');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    setLoading(true);
    try {
      // Create temporary reminder for notification scheduling
      const tempReminder: Reminder = {
        id: Date.now().toString(),
        title: reminderTitle,
        date: selectedDate,
      };

      // Schedule the notification first
      const notificationId = await scheduleNotification(tempReminder);

      // Prepare Firebase reminder data
      const firebaseReminderData: Omit<FirebaseReminder, 'id'> = {
        title: reminderTitle,
        date: selectedDate,
        notificationId: notificationId || undefined,
        userId: user.uid,
        createdAt: Date.now(),
      };

      // Save to Firebase
      const firebaseId = await createReminder(firebaseReminderData);

      // Create the final reminder object with Firebase ID
      const newReminder: Reminder = {
        id: firebaseId,
        title: reminderTitle,
        date: selectedDate,
        notificationId: notificationId || undefined,
      };

      // Update local state and storage
      const updatedReminders = [...reminders, newReminder].sort((a, b) => a.date.getTime() - b.date.getTime());
      await saveReminders(updatedReminders);

      setShowAddModal(false);
      setReminderTitle('');
      setSelectedDate(new Date());
      
      Alert.alert(
        '✅ Reminder Saved!', 
        `Your reminder has been saved to the cloud and you'll get a sound alert on ${selectedDate.toLocaleDateString()} at ${selectedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
      );
    } catch (error) {
      console.error('Failed to create reminder:', error);
      Alert.alert('Error', 'Failed to set reminder. Please try again.');
    }
    setLoading(false);
  };

  const handleDeleteReminder = async (reminder: Reminder) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder? It will be removed from the cloud and the scheduled alarm will be cancelled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Cancel the scheduled notification if it exists
              if (reminder.notificationId) {
                await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
                console.log('🚫 Cancelled alarm notification for:', reminder.title);
              }

              // Delete from Firebase
              await deleteReminderFromFirebase(reminder.id);
              console.log('✅ Deleted reminder from Firebase:', reminder.title);

              // Update local state and storage
              const updatedReminders = reminders.filter(r => r.id !== reminder.id);
              await saveReminders(updatedReminders);

              Alert.alert('✅ Deleted', 'Reminder has been deleted from the cloud and alarm cancelled.');
            } catch (error) {
              console.error('Failed to delete reminder:', error);
              Alert.alert('Error', 'Failed to delete reminder. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString();
  };

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bubble, { top: -height * 0.1, left: -width * 0.2 }, bubble1Style]} />
      <Animated.View style={[styles.bubble, { bottom: -height * 0.15, right: -width * 0.18 }, bubble2Style]} />

      <Animated.View entering={FadeInUp.duration(1000).springify()} style={styles.header}>
        <Text style={styles.title}>Reminders</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={[styles.debugButton, { backgroundColor: '#ffc107', marginRight: 10 }]} onPress={debugNotifications}>
            <FontAwesome name="bug" size={16} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <FontAwesome name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {reminders.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(1000).delay(200).springify()} style={styles.emptyState}>
            <FontAwesome name="bell-slash" size={64} color={isDarkMode ? '#555' : '#ccc'} />
            <Text style={styles.emptyText}>No reminders set</Text>
            <Text style={styles.emptySubText}>Tap the + button to add your first reminder</Text>
          </Animated.View>
        ) : (
          <FlatList
            data={reminders}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInUp.duration(1000).delay(index * 100).springify()} style={styles.reminderCard}>
                <View style={styles.reminderContent}>
                  <Text style={styles.reminderTitle}>{item.title}</Text>
                  <Text style={styles.reminderDate}>{formatDateTime(item.date)}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteReminder(item)} style={styles.deleteButton}>
                  <FontAwesome name="trash" size={20} color="#ef4444" />
                </TouchableOpacity>
              </Animated.View>
            )}
          />
        )}
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Reminder</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Reminder title"
              placeholderTextColor={isDarkMode ? '#888' : '#999'}
              value={reminderTitle}
              onChangeText={setReminderTitle}
            />

            <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
              <FontAwesome name="calendar" size={20} color="#19376d" />
              <View style={styles.dateTimeContent}>
                <Text style={styles.dateTimeLabel}>Date</Text>
                <Text style={styles.dateTimeValue}>{selectedDate.toDateString()}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowTimePicker(true)}>
              <FontAwesome name="clock-o" size={20} color="#19376d" />
              <View style={styles.dateTimeContent}>
                <Text style={styles.dateTimeLabel}>Time</Text>
                <Text style={styles.dateTimeValue}>{selectedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.reminderInfo}>
              <FontAwesome name="bell" size={16} color={isDarkMode ? '#888' : '#666'} />
              <Text style={styles.reminderInfoText}>
                You'll be reminded on {selectedDate.toLocaleDateString()} at {selectedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddModal(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddReminder} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Setting...' : 'Set Reminder'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display="default"
          onChange={(event, date) => {
            setShowTimePicker(false);
            if (date) {
              const newDate = new Date(selectedDate);
              newDate.setHours(date.getHours());
              newDate.setMinutes(date.getMinutes());
              setSelectedDate(newDate);
            }
          }}
        />
      )}

      {/* Full-Screen Alarm Popup */}
      <AlarmPopup
        visible={showAlarmPopup}
        reminderTitle={currentAlarmReminder?.title || ''}
        onDismiss={handleAlarmDismiss}
        onSnooze={handleAlarmSnooze}
      />
    </View>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0a0a0a' : '#f7fafd',
  },
  bubble: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: '#000080',
    opacity: 0.08,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#19376d',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  addButton: {
    backgroundColor: '#19376d',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#19376d',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 16,
    color: isDarkMode ? '#888' : '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  reminderCard: {
    backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#19376d',
    marginBottom: 4,
  },
  reminderDate: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#666',
  },
  deleteButton: {
    padding: 8,
  },
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
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#19376d',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    fontSize: 16,
    padding: 15,
    backgroundColor: isDarkMode ? '#333' : '#f7fafd',
    borderRadius: 10,
    marginBottom: 15,
    color: isDarkMode ? '#fff' : '#000',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: isDarkMode ? '#333' : '#f7fafd',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: isDarkMode ? '#444' : '#e5e7eb',
  },
  dateTimeContent: {
    marginLeft: 15,
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: isDarkMode ? '#888' : '#666',
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  dateTimeValue: {
    fontSize: 16,
    color: isDarkMode ? '#fff' : '#19376d',
    fontWeight: '600',
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f0f9ff',
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: isDarkMode ? '#333' : '#bfdbfe',
  },
  reminderInfoText: {
    fontSize: 14,
    color: isDarkMode ? '#888' : '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#9ca3af',
    borderRadius: 30,
    alignItems: 'center',
    marginRight: 10,
  },
  saveButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#22c55e',
    borderRadius: 30,
    alignItems: 'center',
    marginLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RemindersScreen;
