import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type FeelingChip = 
  | 'tender' 
  | 'calm' 
  | 'tired' 
  | 'needing_space' 
  | 'extra_love' 
  | 'fragile' 
  | 'grateful' 
  | 'anxious' 
  | 'peaceful' 
  | 'sensitive' 
  | 'content' 
  | 'overwhelmed';

export type CareActionType = 'message' | 'voice_note' | 'facetime' | 'virtual_hug';

export interface GentleDaysSettings {
  id?: string;
  userId: string;
  pairId: string;
  shareStatus: boolean;
  shareCalendar: boolean;
  notificationsEnabled: boolean;
  gentleRemindersEnabled: boolean;
  gentleDaysModeEnabled: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface GentleDaysStatus {
  id?: string;
  userId: string;
  pairId: string;
  selectedChips: FeelingChip[];
  sos?: boolean;
  timestamp?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface GentleDaysPartnerMessage {
  id?: string;
  partnerUserId: string;
  pairId: string;
  message: string;
  timestamp?: any;
  updatedAt?: any;
}

export interface PeriodCalendar {
  id?: string;
  userId: string;
  pairId: string;
  startDate: any;
  startTime?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface CareAction {
  id?: string;
  pairId: string;
  fromUserId: string;
  toUserId: string;
  type: CareActionType;
  content: string;
  metadata?: {
    scheduledDate?: any;
    voiceDuration?: number;
  };
  createdAt?: any;
  readAt?: any;
}

// ============================================================================
// Feeling Chip Definitions
// ============================================================================

export const FEELING_CHIPS: Array<{ id: FeelingChip; label: string; emoji: string }> = [
  { id: 'tender', label: 'tender', emoji: '💜' },
  { id: 'calm', label: 'calm', emoji: '☁️' },
  { id: 'tired', label: 'tired', emoji: '😴' },
  { id: 'needing_space', label: 'needing space', emoji: '🌙' },
  { id: 'extra_love', label: 'extra love today', emoji: '💕' },
  { id: 'fragile', label: 'fragile', emoji: '🦋' },
  { id: 'grateful', label: 'grateful', emoji: '🙏' },
  { id: 'anxious', label: 'anxious', emoji: '🌀' },
  { id: 'peaceful', label: 'peaceful', emoji: '🕊️' },
  { id: 'sensitive', label: 'sensitive', emoji: '🌺' },
  { id: 'content', label: 'content', emoji: '✨' },
  { id: 'overwhelmed', label: 'overwhelmed', emoji: '🌊' },
];

// ============================================================================
// Service Class
// ============================================================================

export class GentleDaysService {
  private static getDateKey(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private static async getLocalStorageKey(key: string, userId: string, dateKey?: string): Promise<string> {
    if (dateKey) {
      return `gentleDays_${key}_${userId}_${dateKey}`;
    }
    return `gentleDays_${key}_${userId}`;
  }

  // ============================================================================
  // Settings
  // ============================================================================

  /**
   * Get or create settings for a user
   */
  static async getSettings(userId: string, pairId: string): Promise<GentleDaysSettings> {
    try {
      const settingsRef = doc(db, 'gentleDaysSettings', `${pairId}_${userId}`);
      const snapshot = await getDoc(settingsRef);

      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...snapshot.data(),
        } as GentleDaysSettings;
      }

      // Create default settings (all false)
      const defaultSettings: GentleDaysSettings = {
        userId,
        pairId,
        shareStatus: false,
        shareCalendar: false,
        notificationsEnabled: false,
        gentleRemindersEnabled: false,
        gentleDaysModeEnabled: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(settingsRef, defaultSettings);
      return { id: settingsRef.id, ...defaultSettings };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get settings');
    }
  }

  /**
   * Update settings
   */
  static async updateSettings(
    userId: string,
    pairId: string,
    updates: Partial<Omit<GentleDaysSettings, 'id' | 'userId' | 'pairId' | 'createdAt'>>
  ): Promise<void> {
    try {
      const settingsRef = doc(db, 'gentleDaysSettings', `${pairId}_${userId}`);
      await updateDoc(settingsRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update settings');
    }
  }

  // ============================================================================
  // Status (Check-In)
  // ============================================================================

  /**
   * Save status (check-in) - local first, then sync to Firestore
   */
  static async saveStatus(
    userId: string,
    pairId: string,
    selectedChips: FeelingChip[],
    sos: boolean = false
  ): Promise<void> {
    try {
      const dateKey = this.getDateKey();
      const statusRef = doc(db, 'gentleDaysStatus', `${pairId}_${userId}_${dateKey}`);

      // Save locally first (for offline support)
      const localKey = await this.getLocalStorageKey('status', userId, dateKey);
      const statusData: GentleDaysStatus = {
        userId,
        pairId,
        selectedChips,
        sos,
        timestamp: new Date(),
      };
      await AsyncStorage.setItem(localKey, JSON.stringify(statusData));

      // Write to Firestore
      await setDoc(
        statusRef,
        {
          userId,
          pairId,
          selectedChips,
          sos,
          timestamp: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error: any) {
      throw new Error(error.message || 'Failed to save status');
    }
  }

  /**
   * Get today's status
   */
  static async getTodayStatus(userId: string, pairId: string): Promise<GentleDaysStatus | null> {
    try {
      const dateKey = this.getDateKey();
      const statusRef = doc(db, 'gentleDaysStatus', `${pairId}_${userId}_${dateKey}`);
      const snapshot = await getDoc(statusRef);

      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...snapshot.data(),
        } as GentleDaysStatus;
      }

      // Try local storage as fallback
      const localKey = await this.getLocalStorageKey('status', userId, dateKey);
      const localData = await AsyncStorage.getItem(localKey);
      if (localData) {
        return JSON.parse(localData) as GentleDaysStatus;
      }

      return null;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get status');
    }
  }

  /**
   * Trigger SOS
   */
  static async triggerSOS(userId: string, pairId: string): Promise<void> {
    try {
      // Check rate limit (3 per 24 hours)
      const oneDayAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
      const statusRef = collection(db, 'gentleDaysStatus');
      const q = query(
        statusRef,
        where('userId', '==', userId),
        where('pairId', '==', pairId),
        where('sos', '==', true),
        where('timestamp', '>', oneDayAgo),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      if (snapshot.docs.length >= 3) {
        throw new Error('Maximum 3 SOS per day');
      }

      // Save SOS status
      await this.saveStatus(userId, pairId, [], true);
    } catch (error: any) {
      if (error.message === 'Maximum 3 SOS per day') {
        throw error;
      }
      throw new Error(error.message || 'Failed to trigger SOS');
    }
  }

  // ============================================================================
  // Partner Messages
  // ============================================================================

  /**
   * Generate partner message from chips (client-side fallback)
   */
  private static generatePartnerMessageFromChips(chipIds: FeelingChip[]): string {
    const chipLabels: Record<FeelingChip, string> = {
      tender: 'tender',
      calm: 'calm',
      tired: 'tired',
      needing_space: 'needing some space',
      extra_love: 'could use extra love',
      fragile: 'fragile',
      grateful: 'grateful',
      anxious: 'anxious',
      peaceful: 'peaceful',
      sensitive: 'sensitive',
      content: 'content',
      overwhelmed: 'overwhelmed',
    };

    const priorityOrder: FeelingChip[] = [
      'fragile',
      'overwhelmed',
      'anxious',
      'needing_space',
      'tired',
      'sensitive',
      'tender',
      'extra_love',
      'grateful',
      'calm',
      'peaceful',
      'content',
    ];

    // Sort by priority
    const sorted = [...chipIds].sort((a, b) => {
      const aIdx = priorityOrder.indexOf(a);
      const bIdx = priorityOrder.indexOf(b);
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });

    const labels = sorted.map((id) => chipLabels[id] || id).filter(Boolean);

    if (labels.length === 0) return "Shared how they're feeling";
    if (labels.length === 1) return `Feeling ${labels[0]} today`;
    if (labels.length === 2) {
      return `Feeling ${labels[0]} and ${labels[1]}`;
    }

    // 3+ chips: Use commas and "and"
    const last = labels.pop()!;
    return `Feeling ${labels.join(', ')}, and ${last}`;
  }

  /**
   * Get partner's message (derived, not raw chips)
   * Falls back to generating from partner's status if Cloud Function hasn't created message yet
   */
  static async getPartnerMessage(userId: string, pairId: string): Promise<GentleDaysPartnerMessage | null> {
    try {
      // Get partner's user ID from pair
      const pairRef = doc(db, 'pairs', pairId);
      const pairDoc = await getDoc(pairRef);
      if (!pairDoc.exists()) {
        return null;
      }

      const pairData = pairDoc.data();
      const partnerUserId = pairData.user1Id === userId ? pairData.user2Id : pairData.user1Id;
      if (!partnerUserId) {
        return null;
      }

      // Check if partner has sharing enabled
      const partnerSettingsRef = doc(db, 'gentleDaysSettings', `${pairId}_${partnerUserId}`);
      const partnerSettingsDoc = await getDoc(partnerSettingsRef);
      const partnerSettings = partnerSettingsDoc.data() as GentleDaysSettings | undefined;

      if (!partnerSettings?.shareStatus) {
        return null; // Partner hasn't enabled sharing
      }

      // Try to get Cloud Function-generated message first
      const messageRef = doc(db, 'gentleDaysPartnerMessages', `${pairId}_${userId}`);
      const snapshot = await getDoc(messageRef);

      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...snapshot.data(),
        } as GentleDaysPartnerMessage;
      }

      // Fallback: Generate message from partner's status directly
      const partnerStatus = await this.getTodayStatus(partnerUserId, pairId);
      if (partnerStatus && partnerStatus.selectedChips.length > 0) {
        const message = this.generatePartnerMessageFromChips(partnerStatus.selectedChips);
        return {
          partnerUserId,
          pairId,
          message,
          timestamp: partnerStatus.timestamp,
          updatedAt: partnerStatus.updatedAt,
        };
      }

      return null;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get partner message');
    }
  }

  /**
   * Subscribe to partner's message updates
   * Falls back to watching partner's status if Cloud Function message doesn't exist
   */
  static subscribeToPartnerMessage(
    userId: string,
    pairId: string,
    callback: (message: GentleDaysPartnerMessage | null) => void
  ): Unsubscribe {
    let unsubscribeStatus: Unsubscribe | null = null;
    let unsubscribeMessage: Unsubscribe | null = null;
    let isCleanedUp = false;

    // Helper to clean up
    const cleanup = () => {
      if (unsubscribeMessage) {
        unsubscribeMessage();
        unsubscribeMessage = null;
      }
      if (unsubscribeStatus) {
        unsubscribeStatus();
        unsubscribeStatus = null;
      }
    };

    // First, get partner ID and settings
    const pairRef = doc(db, 'pairs', pairId);
    getDoc(pairRef)
      .then((pairDoc) => {
        if (isCleanedUp || !pairDoc.exists()) {
          callback(null);
          return;
        }

        const pairData = pairDoc.data();
        const partnerUserId = pairData.user1Id === userId ? pairData.user2Id : pairData.user1Id;
        if (!partnerUserId) {
          callback(null);
          return;
        }

        // Check partner's sharing settings
        const partnerSettingsRef = doc(db, 'gentleDaysSettings', `${pairId}_${partnerUserId}`);
        getDoc(partnerSettingsRef)
          .then((settingsDoc) => {
            if (isCleanedUp) return;

            const partnerSettings = settingsDoc.data() as GentleDaysSettings | undefined;
            if (!partnerSettings?.shareStatus) {
              callback(null);
              return;
            }

            // Try to subscribe to Cloud Function-generated message first
            const messageRef = doc(db, 'gentleDaysPartnerMessages', `${pairId}_${userId}`);
            unsubscribeMessage = onSnapshot(
              messageRef,
              (snapshot) => {
                if (isCleanedUp) return;

                if (snapshot.exists()) {
                  callback({
                    id: snapshot.id,
                    ...snapshot.data(),
                  } as GentleDaysPartnerMessage);
                } else {
                  // Fallback: Watch partner's status directly
                  const dateKey = this.getDateKey();
                  const statusRef = doc(db, 'gentleDaysStatus', `${pairId}_${partnerUserId}_${dateKey}`);
                  
                  // Clean up any existing status subscription
                  if (unsubscribeStatus) {
                    unsubscribeStatus();
                  }

                  unsubscribeStatus = onSnapshot(
                    statusRef,
                    (statusSnapshot) => {
                      if (isCleanedUp) return;

                      if (statusSnapshot.exists()) {
                        const statusData = statusSnapshot.data() as GentleDaysStatus;
                        if (statusData.selectedChips && statusData.selectedChips.length > 0) {
                          const message = this.generatePartnerMessageFromChips(statusData.selectedChips);
                          callback({
                            partnerUserId,
                            pairId,
                            message,
                            timestamp: statusData.timestamp,
                            updatedAt: statusData.updatedAt,
                          });
                        } else {
                          callback(null);
                        }
                      } else {
                        callback(null);
                      }
                    },
                    (error) => {
                      if (!isCleanedUp) {
                        console.error('Partner status subscription error:', error);
                        callback(null);
                      }
                    }
                  );
                }
              },
              (error) => {
                if (!isCleanedUp) {
                  console.error('Partner message subscription error:', error);
                  callback(null);
                }
              }
            );
          })
          .catch((error) => {
            if (!isCleanedUp) {
              console.error('Error getting partner settings:', error);
              callback(null);
            }
          });
      })
      .catch((error) => {
        if (!isCleanedUp) {
          console.error('Error getting pair:', error);
          callback(null);
        }
      });

    // Return cleanup function
    return () => {
      isCleanedUp = true;
      cleanup();
    };
  }

  // ============================================================================
  // Care Actions
  // ============================================================================

  /**
   * Send a care action to partner
   */
  static async sendCareAction(
    fromUserId: string,
    toUserId: string,
    pairId: string,
    type: CareActionType,
    content: string,
    metadata?: CareAction['metadata']
  ): Promise<string> {
    try {
      const actionsRef = collection(db, 'careActions');
      const actionData: Omit<CareAction, 'id'> = {
        pairId,
        fromUserId,
        toUserId,
        type,
        content,
        metadata: metadata || {},
        createdAt: serverTimestamp(),
      };

      const docRef = doc(actionsRef);
      await setDoc(docRef, actionData);
      return docRef.id;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send care action');
    }
  }

  /**
   * Get care actions for a user (received)
   */
  static async getCareActions(userId: string, pairId: string, limitCount: number = 20): Promise<CareAction[]> {
    try {
      const actionsRef = collection(db, 'careActions');
      const q = query(
        actionsRef,
        where('pairId', '==', pairId),
        where('toUserId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CareAction[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get care actions');
    }
  }

  /**
   * Mark care action as read
   */
  static async markCareActionRead(actionId: string): Promise<void> {
    try {
      const actionRef = doc(db, 'careActions', actionId);
      await updateDoc(actionRef, {
        readAt: serverTimestamp(),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark action as read');
    }
  }

  // ============================================================================
  // Period Calendar
  // ============================================================================

  /**
   * Save period calendar entry
   */
  static async savePeriodCalendar(
    userId: string,
    pairId: string,
    startDate: Date,
    startTime?: Date
  ): Promise<string> {
    try {
      const calendarRef = collection(db, 'periodCalendar');
      const calendarData: Omit<PeriodCalendar, 'id'> = {
        userId,
        pairId,
        startDate: Timestamp.fromDate(startDate),
        startTime: startTime ? Timestamp.fromDate(startTime) : undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = doc(calendarRef);
      await setDoc(docRef, calendarData);
      return docRef.id;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to save period calendar');
    }
  }

  /**
   * Get period calendar entries for user
   */
  static async getPeriodCalendar(userId: string, pairId: string, limitCount: number = 12): Promise<PeriodCalendar[]> {
    try {
      const calendarRef = collection(db, 'periodCalendar');
      const q = query(
        calendarRef,
        where('userId', '==', userId),
        where('pairId', '==', pairId),
        orderBy('startDate', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PeriodCalendar[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get period calendar');
    }
  }
}

