import { addDoc, collection, deleteDoc, doc, getDocs, getDoc, query, updateDoc, where, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';

export interface Reminder {
  id?: string;
  userId: string;
  title: string;
  date: Date; // stored in Firestore as Timestamp, but exposed as Date in app
  notificationId?: string;
}

// Firestore collection reference
export const reminderColRef = collection(db, 'reminders');

// Create a reminder
export const createReminder = async (reminder: Reminder): Promise<string> => {
  const { id: _id, ...data } = reminder;
  const toSave = {
    ...data,
    date: Timestamp.fromDate(reminder.date),
  };
  const docRef = await addDoc(reminderColRef, toSave);
  return docRef.id;
};

// Get reminders by userId
export const getAllRemindersByUserId = async (userId: string): Promise<Reminder[]> => {
  const q = query(reminderColRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data() as any;
    const dateVal = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
    return {
      id: d.id,
      userId: data.userId,
      title: data.title,
      date: dateVal,
      notificationId: data.notificationId,
    } as Reminder;
  });
};

// Get single reminder
export const getReminderById = async (id: string): Promise<Reminder | null> => {
  const ref = doc(db, 'reminders', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  const dateVal = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
  return {
    id: snap.id,
    userId: data.userId,
    title: data.title,
    date: dateVal,
    notificationId: data.notificationId,
  } as Reminder;
};

// Update reminder (partial updates allowed)
export const updateReminder = async (
  id: string,
  updates: Partial<Reminder>
): Promise<void> => {
  const ref = doc(db, 'reminders', id);
  const payload: any = { ...updates };
  if (updates.date) {
    payload.date = Timestamp.fromDate(updates.date);
  }
  await updateDoc(ref, payload);
};

// Delete reminder
export const deleteReminder = async (id: string): Promise<void> => {
  const ref = doc(db, 'reminders', id);
  await deleteDoc(ref);
};
