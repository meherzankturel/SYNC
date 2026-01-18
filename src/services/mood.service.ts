import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
  doc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export type MoodType = 'happy' | 'calm' | 'neutral' | 'sad' | 'anxious' | 'excited' | 'grateful' | 'loved';

// Mood causes - why do you feel this way?
export type MoodCause = 
  | 'partner'      // 💕 My Partner
  | 'work'         // 💼 Work
  | 'health'       // 🏃 Health
  | 'family'       // 👨‍👩‍👧 Family
  | 'friends'      // 👥 Friends
  | 'weather'      // 🌤️ Weather
  | 'sleep'        // 😴 Sleep
  | 'food'         // 🍽️ Food
  | 'money'        // 💰 Money
  | 'achievement'  // 🏆 Achievement
  | 'relaxing'     // 🧘 Relaxing
  | 'missing_you'  // 💭 Missing You
  | 'just_because' // ✨ Just Because
  | 'other';       // 📝 Other

// Reaction types for partner's mood
export type MoodReaction = 'hug' | 'heart' | 'support' | 'celebrate' | 'comfort' | 'thinking_of_you';

export interface MoodReactionData {
  type: MoodReaction;
  fromUserId: string;
  createdAt: any;
}

export interface Mood {
  id?: string;
  userId: string;
  pairId: string;
  mood: MoodType;
  note?: string;
  cause?: MoodCause;        // Why do you feel this way?
  reactions?: MoodReactionData[]; // Partner's reactions
  createdAt: any;
  updatedAt: any;
}

// Mood cause display info
export const MOOD_CAUSES: Array<{ type: MoodCause; emoji: string; label: string }> = [
  { type: 'partner', emoji: '💕', label: 'My Partner' },
  { type: 'work', emoji: '💼', label: 'Work' },
  { type: 'health', emoji: '🏃', label: 'Health' },
  { type: 'family', emoji: '👨‍👩‍👧', label: 'Family' },
  { type: 'friends', emoji: '👥', label: 'Friends' },
  { type: 'sleep', emoji: '😴', label: 'Sleep' },
  { type: 'weather', emoji: '🌤️', label: 'Weather' },
  { type: 'achievement', emoji: '🏆', label: 'Achievement' },
  { type: 'relaxing', emoji: '🧘', label: 'Relaxing' },
  { type: 'missing_you', emoji: '💭', label: 'Missing You' },
  { type: 'just_because', emoji: '✨', label: 'Just Because' },
];

// Reaction display info
export const MOOD_REACTIONS: Array<{ type: MoodReaction; emoji: string; label: string }> = [
  { type: 'hug', emoji: '🤗', label: 'Sending Hug' },
  { type: 'heart', emoji: '❤️', label: 'Love You' },
  { type: 'support', emoji: '💪', label: "I'm Here" },
  { type: 'celebrate', emoji: '🎉', label: 'Yay!' },
  { type: 'comfort', emoji: '🫂', label: 'Comfort' },
  { type: 'thinking_of_you', emoji: '💭', label: 'Thinking of You' },
];

export class MoodService {
  /**
   * Submit a mood update with optional cause
   */
  static async submitMood(
    userId: string,
    pairId: string,
    mood: MoodType,
    note?: string,
    cause?: MoodCause
  ): Promise<string> {
    try {
      const moodData: any = {
        userId,
        pairId,
        mood,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Only include note if it's provided and not empty
      if (note && note.trim()) {
        moodData.note = note.trim();
      }
      
      // Include cause if selected
      if (cause) {
        moodData.cause = cause;
      }
      
      const docRef = await addDoc(collection(db, 'moods'), moodData);
      return docRef.id;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to submit mood');
    }
  }
  
  /**
   * React to partner's mood
   */
  static async reactToMood(
    moodId: string,
    fromUserId: string,
    reaction: MoodReaction
  ): Promise<void> {
    try {
      const moodRef = doc(db, 'moods', moodId);
      await updateDoc(moodRef, {
        reactions: arrayUnion({
          type: reaction,
          fromUserId,
          createdAt: new Date().toISOString(),
        }),
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to react to mood');
    }
  }
  
  /**
   * Get mood insights for a pair (last 7 days)
   */
  static async getMoodInsights(
    pairId: string,
    userId: string,
    partnerId: string
  ): Promise<{
    userHappyDays: number;
    partnerHappyDays: number;
    syncedDays: number;
    topUserMood: MoodType | null;
    topPartnerMood: MoodType | null;
    lovedMoments: number;
    totalMoods: number;
  }> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      
      const moodsRef = collection(db, 'moods');
      const q = query(
        moodsRef,
        where('pairId', '==', pairId),
        where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const moods = snapshot.docs.map(doc => doc.data() as Mood);
      
      const userMoods = moods.filter(m => m.userId === userId);
      const partnerMoods = moods.filter(m => m.userId === partnerId);
      
      // Count happy days (happy, excited, loved, grateful)
      const happyTypes = ['happy', 'excited', 'loved', 'grateful'];
      const userHappyDays = new Set(
        userMoods
          .filter(m => happyTypes.includes(m.mood))
          .map(m => new Date(m.createdAt?.toDate?.() || m.createdAt).toDateString())
      ).size;
      
      const partnerHappyDays = new Set(
        partnerMoods
          .filter(m => happyTypes.includes(m.mood))
          .map(m => new Date(m.createdAt?.toDate?.() || m.createdAt).toDateString())
      ).size;
      
      // Count synced days (both shared moods on same day)
      const userDays = new Set(userMoods.map(m => new Date(m.createdAt?.toDate?.() || m.createdAt).toDateString()));
      const partnerDays = new Set(partnerMoods.map(m => new Date(m.createdAt?.toDate?.() || m.createdAt).toDateString()));
      const syncedDays = [...userDays].filter(day => partnerDays.has(day)).length;
      
      // Find top moods
      const countMoods = (moodsList: Mood[]): MoodType | null => {
        const counts: Record<string, number> = {};
        moodsList.forEach(m => {
          counts[m.mood] = (counts[m.mood] || 0) + 1;
        });
        const entries = Object.entries(counts);
        if (entries.length === 0) return null;
        return entries.sort((a, b) => b[1] - a[1])[0][0] as MoodType;
      };
      
      // Count "loved" moments (when cause is 'partner' or mood is 'loved')
      const lovedMoments = moods.filter(
        m => m.mood === 'loved' || m.cause === 'partner' || m.cause === 'missing_you'
      ).length;
      
      return {
        userHappyDays,
        partnerHappyDays,
        syncedDays,
        topUserMood: countMoods(userMoods),
        topPartnerMood: countMoods(partnerMoods),
        lovedMoments,
        totalMoods: moods.length,
      };
    } catch (error: any) {
      console.error('Error getting mood insights:', error);
      return {
        userHappyDays: 0,
        partnerHappyDays: 0,
        syncedDays: 0,
        topUserMood: null,
        topPartnerMood: null,
        lovedMoments: 0,
        totalMoods: 0,
      };
    }
  }
  
  /**
   * Get mood timeline for a pair
   */
  static async getMoodTimeline(
    pairId: string,
    limitCount: number = 50
  ): Promise<Mood[]> {
    try {
      const moodsRef = collection(db, 'moods');
      const q = query(
        moodsRef,
        where('pairId', '==', pairId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Mood[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get mood timeline');
    }
  }
  
  /**
   * Get today's mood for a user
   */
  static async getTodayMood(userId: string, pairId: string): Promise<Mood | null> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);
      
      const moodsRef = collection(db, 'moods');
      const q = query(
        moodsRef,
        where('pairId', '==', pairId),
        where('userId', '==', userId),
        where('createdAt', '>=', todayTimestamp),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
        } as Mood;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get today mood');
    }
  }
}

