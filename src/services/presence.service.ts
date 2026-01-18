import {
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Presence {
  userId: string;
  pairId: string;
  isOnline: boolean;
  lastSeen: any;
  appOpenedAt?: any;
}

export class PresenceService {
  /**
   * Update user presence when app opens
   */
  static async updatePresence(
    userId: string,
    pairId: string,
    isOnline: boolean = true
  ): Promise<void> {
    try {
      const presenceRef = doc(db, 'presence', `${pairId}_${userId}`);
      await setDoc(
        presenceRef,
        {
          userId,
          pairId,
          isOnline,
          lastSeen: serverTimestamp(),
          appOpenedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update presence');
    }
  }
  
  /**
   * Set user offline
   */
  static async setOffline(userId: string, pairId: string): Promise<void> {
    try {
      const presenceRef = doc(db, 'presence', `${pairId}_${userId}`);
      await setDoc(
        presenceRef,
        {
          userId,
          pairId,
          isOnline: false,
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error: any) {
      throw new Error(error.message || 'Failed to set offline');
    }
  }
  
  /**
   * Subscribe to partner's presence
   */
  static subscribeToPartnerPresence(
    pairId: string,
    partnerUserId: string,
    callback: (presence: Presence | null) => void
  ): Unsubscribe {
    const presenceRef = doc(db, 'presence', `${pairId}_${partnerUserId}`);
    
    return onSnapshot(
      presenceRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as Presence);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Presence subscription error:', error);
        callback(null);
      }
    );
  }
}

