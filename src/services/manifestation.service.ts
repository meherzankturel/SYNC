import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

export interface Manifestation {
  id?: string;
  pairId: string;
  createdBy: string;
  title: string;
  description?: string;
  type: 'shared' | 'individual';
  category?: 'travel' | 'relationship' | 'personal' | 'financial' | 'home' | 'career' | 'health' | 'other';
  targetDate?: any; // Timestamp
  progress: number; // 0-100
  milestones?: string[];
  completedMilestones?: string[];
  reminderEnabled: boolean;
  reminderTime?: string; // HH:mm format
  createdAt: any;
  updatedAt: any;
}

export class ManifestationService {
  /**
   * Create a new manifestation
   */
  static async createManifestation(
    pairId: string,
    createdBy: string,
    manifestation: Omit<Manifestation, 'id' | 'pairId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'progress' | 'completedMilestones'>
  ): Promise<string> {
    try {
      const manifestationData: Omit<Manifestation, 'id'> = {
        ...manifestation,
        pairId,
        createdBy,
        progress: 0,
        completedMilestones: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'manifestations'), manifestationData);
      
      // Schedule reminder if enabled
      if (manifestation.reminderEnabled && manifestation.reminderTime) {
        await this.scheduleReminder(docRef.id, manifestation.reminderTime);
      }
      
      return docRef.id;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create manifestation');
    }
  }
  
  /**
   * Get manifestations for a pair
   */
  static async getManifestations(
    pairId: string,
    type?: 'shared' | 'individual'
  ): Promise<Manifestation[]> {
    try {
      const manifestationsRef = collection(db, 'manifestations');
      let q;
      
      try {
        // Try with orderBy first
        if (type) {
          q = query(
            manifestationsRef,
            where('pairId', '==', pairId),
            where('type', '==', type),
            orderBy('createdAt', 'desc')
          );
        } else {
          q = query(
            manifestationsRef,
            where('pairId', '==', pairId),
            orderBy('createdAt', 'desc')
          );
        }
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Manifestation[];
      } catch (orderByError: any) {
        // If orderBy fails (missing index), try without orderBy
        if (orderByError.code === 'failed-precondition' || orderByError.message?.includes('index')) {
          console.warn('Manifestations query requires index. Using fallback query without orderBy.');
          
          if (type) {
            q = query(
              manifestationsRef,
              where('pairId', '==', pairId),
              where('type', '==', type)
            );
          } else {
            q = query(
              manifestationsRef,
              where('pairId', '==', pairId)
            );
          }
          
          const snapshot = await getDocs(q);
          let manifestations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Manifestation[];
          
          // Sort manually by createdAt
          manifestations.sort((a, b) => {
            const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds * 1000 || 0);
            const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds * 1000 || 0);
            return bTime - aTime;
          });
          
          return manifestations;
        } else {
          throw orderByError;
        }
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get manifestations');
    }
  }
  
  /**
   * Update manifestation progress
   */
  static async updateProgress(
    manifestationId: string,
    progress: number,
    completedMilestone?: string
  ): Promise<void> {
    try {
      const manifestationRef = doc(db, 'manifestations', manifestationId);
      const current = await getDoc(manifestationRef);
      const currentData = current.data() as Manifestation;
      
      const updates: any = {
        progress: Math.min(100, Math.max(0, progress)),
        updatedAt: serverTimestamp(),
      };
      
      if (completedMilestone && currentData.milestones) {
        const completed = currentData.completedMilestones || [];
        if (!completed.includes(completedMilestone)) {
          updates.completedMilestones = [...completed, completedMilestone];
        }
      }
      
      await updateDoc(manifestationRef, updates);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update progress');
    }
  }
  
  /**
   * Schedule nightly reminder
   */
  static async scheduleReminder(
    manifestationId: string,
    reminderTime: string
  ): Promise<void> {
    try {
      // Parse time (HH:mm format)
      const [hours, minutes] = reminderTime.split(':').map(Number);
      
      // Schedule daily notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Manifestation Reminder',
          body: 'Time to check in on your goals together!',
          sound: true,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });
    } catch (error: any) {
      console.error('Failed to schedule reminder:', error);
    }
  }
  
  /**
   * Update manifestation
   */
  static async updateManifestation(
    manifestationId: string,
    updates: Partial<Manifestation>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'manifestations', manifestationId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update manifestation');
    }
  }

  /**
   * Delete manifestation
   */
  static async deleteManifestation(manifestationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'manifestations', manifestationId));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete manifestation');
    }
  }
}

