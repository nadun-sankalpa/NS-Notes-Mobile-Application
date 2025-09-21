import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface Reminder {
  id?: string;
  title: string;
  date: Date;
  notificationId?: string;
  userId: string;
  createdAt: number;
}

// Create a new reminder in Firebase
export const createReminder = async (reminderData: Omit<Reminder, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'reminders'), {
      ...reminderData,
      date: reminderData.date.toISOString(), // Convert Date to string for Firebase
    });
    console.log('✅ Reminder saved to Firebase with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating reminder in Firebase:', error);
    throw error;
  }
};

// Get all reminders for a specific user from Firebase
export const getAllRemindersByUserId = async (userId: string): Promise<Reminder[]> => {
  try {
    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', userId),
      orderBy('date', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const reminders: Reminder[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reminders.push({
        id: doc.id,
        title: data.title,
        date: new Date(data.date), // Convert string back to Date
        notificationId: data.notificationId,
        userId: data.userId,
        createdAt: data.createdAt,
      });
    });
    
    console.log('✅ Loaded', reminders.length, 'reminders from Firebase');
    return reminders;
  } catch (error) {
    console.error('❌ Error fetching reminders from Firebase:', error);
    throw error;
  }
};

// Delete a reminder from Firebase
export const deleteReminder = async (reminderId: string) => {
  try {
    await deleteDoc(doc(db, 'reminders', reminderId));
    console.log('✅ Reminder deleted from Firebase:', reminderId);
  } catch (error) {
    console.error('❌ Error deleting reminder from Firebase:', error);
    throw error;
  }
};

// Update a reminder in Firebase
export const updateReminder = async (reminderId: string, reminderData: Partial<Reminder>) => {
  try {
    const updateData = { ...reminderData };
    if (updateData.date) {
      updateData.date = reminderData.date!.toISOString() as any; // Convert Date to string
    }
    
    await updateDoc(doc(db, 'reminders', reminderId), updateData);
    console.log('✅ Reminder updated in Firebase:', reminderId);
  } catch (error) {
    console.error('❌ Error updating reminder in Firebase:', error);
    throw error;
  }
};
