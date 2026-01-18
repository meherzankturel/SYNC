import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';

export interface Pair {
  pairId: string;
  user1Id: string;
  user2Id?: string;
  user1Email: string;
  user2Email?: string;
  status: 'pending' | 'active' | 'inactive';
  createdAt: any;
  updatedAt: any;
  inviteToken?: string;
  inviteExpiresAt?: any;
}

export class PairService {
  /**
   * Create a new pair (user1 invites user2)
   */
  static async createPair(user1Id: string, user1Email: string, user2Email: string): Promise<Pair> {
    try {
      const pairId = `pair_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const inviteToken = Math.random().toString(36).substr(2, 16);
      
      const pair: Pair = {
        pairId,
        user1Id,
        user1Email,
        user2Email,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        inviteToken,
        inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };
      
      await setDoc(doc(db, 'pairs', pairId), pair);
      
      // Update user1's profile with pairId
      await setDoc(
        doc(db, 'users', user1Id),
        { pairId, updatedAt: serverTimestamp() },
        { merge: true }
      );
      
      // Send invite email via Cloud Function
      const sendInvite = httpsCallable(functions, 'sendPairInvite');
      await sendInvite({ pairId, user2Email, inviteToken });
      
      return pair;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create pair');
    }
  }
  
  /**
   * Join an existing pair (user2 accepts invite)
   */
  static async joinPair(pairId: string, user2Id: string, user2Email: string, inviteToken: string): Promise<void> {
    try {
      const pairDoc = await getDoc(doc(db, 'pairs', pairId));
      
      if (!pairDoc.exists()) {
        throw new Error('Pair not found');
      }
      
      const pair = pairDoc.data() as Pair;
      
      // Verify invite token
      if (pair.inviteToken !== inviteToken) {
        throw new Error('Invalid invite token');
      }
      
      // Check if pair is already full
      if (pair.user2Id) {
        throw new Error('Pair is already full');
      }
      
      // Check if invite expired
      if (pair.inviteExpiresAt && new Date(pair.inviteExpiresAt.toDate()) < new Date()) {
        throw new Error('Invite has expired');
      }
      
      // Update pair with user2
      await updateDoc(doc(db, 'pairs', pairId), {
        user2Id,
        user2Email,
        status: 'active',
        updatedAt: serverTimestamp(),
      });
      
      // Update user2's profile with pairId
      await setDoc(
        doc(db, 'users', user2Id),
        { pairId, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (error: any) {
      throw new Error(error.message || 'Failed to join pair');
    }
  }
  
  /**
   * Get pair by ID
   */
  static async getPair(pairId: string): Promise<Pair | null> {
    try {
      const pairDoc = await getDoc(doc(db, 'pairs', pairId));
      if (pairDoc.exists()) {
        return pairDoc.data() as Pair;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get pair');
    }
  }
  
  /**
   * Get pair by user ID
   */
  static async getPairByUserId(userId: string): Promise<Pair | null> {
    try {
      const pairsRef = collection(db, 'pairs');
      const q = query(
        pairsRef,
        where('user1Id', '==', userId)
      );
      
      let snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as Pair;
      }
      
      // Check if user is user2
      const q2 = query(
        pairsRef,
        where('user2Id', '==', userId)
      );
      
      snapshot = await getDocs(q2);
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as Pair;
      }
      
      return null;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get pair by user ID');
    }
  }
  
  /**
   * Leave pair
   */
  static async leavePair(pairId: string, userId: string): Promise<void> {
    try {
      const pair = await this.getPair(pairId);
      if (!pair) {
        throw new Error('Pair not found');
      }
      
      // Update pair status
      await updateDoc(doc(db, 'pairs', pairId), {
        status: 'inactive',
        updatedAt: serverTimestamp(),
      });
      
      // Remove pairId from user profile
      await setDoc(
        doc(db, 'users', userId),
        { pairId: null, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (error: any) {
      throw new Error(error.message || 'Failed to leave pair');
    }
  }
}

