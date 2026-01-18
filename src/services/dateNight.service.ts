import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import * as Linking from 'expo-linking';
import { sendPushNotification } from '../utils/notifications';

// Optional calendar import - will be null if expo-calendar is not installed
let Calendar: any = null;
try {
  Calendar = require('expo-calendar');
} catch (error) {
  console.warn('expo-calendar not available - calendar integration disabled');
}

export interface DateNight {
  id?: string;
  pairId: string;
  createdBy: string;
  title: string;
  description?: string;
  date: any; // Timestamp
  time?: string;
  location?: string;
  duration?: number; // Duration in minutes (default: 120 minutes / 2 hours)
  category?: 'movie' | 'dinner' | 'activity' | 'virtual' | 'other';
  reminders?: {
    enabled: boolean;
    offsetMinutes: number;
  };
  faceTimeLink?: string;
  checklist?: string[];
  completed: boolean;
  createdAt: any;
  updatedAt: any;
  calendarEventIds?: {
    [userId: string]: string; // Map of userId to calendar event ID
  };
}

export class DateNightService {
  /**
   * Create a new date night
   * Also sends notification to partner and adds to both calendars
   */
  static async createDateNight(
    pairId: string,
    createdBy: string,
    dateNight: Omit<DateNight, 'id' | 'pairId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'completed'>,
    partnerId?: string,
    partnerPushToken?: string,
    creatorName?: string
  ): Promise<string> {
    try {
      const dateNightData: Omit<DateNight, 'id'> = {
        ...dateNight,
        pairId,
        createdBy,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'dateNights'), dateNightData);
      
      // Send push notification to partner (non-blocking)
      if (partnerId && partnerPushToken) {
        try {
          const senderName = creatorName || 'Your partner';
          const dateStr = dateNight.date?.toDate 
            ? dateNight.date.toDate().toLocaleDateString() 
            : new Date(dateNight.date).toLocaleDateString();
          
          await sendPushNotification(
            partnerPushToken,
            '📅 New Date Night Planned!',
            `${senderName} planned "${dateNight.title}" for ${dateStr}`,
            {
              type: 'dateNight',
              dateNightId: docRef.id,
              pairId: pairId,
            }
          );
          console.log('✅ Push notification sent to partner');
        } catch (notifError: any) {
          console.warn('Failed to send push notification:', notifError);
          // Don't fail the whole operation if notification fails
        }
      }
      
      // Add to creator's calendar and store event ID
      let creatorEventId: string | null = null;
      if (dateNight.date) {
        try {
          creatorEventId = await this.addToCalendar(docRef.id, dateNight);
          if (creatorEventId) {
            // Store calendar event ID in Firestore
            await updateDoc(docRef, {
              calendarEventIds: {
                [createdBy]: creatorEventId,
              },
            });
            console.log('✅ Calendar event ID stored for creator');
          }
        } catch (err) {
          console.warn('Failed to add to creator calendar:', err);
        }
      }
      
      // Partner will receive notification and add to their calendar automatically
      // The notification includes dateNightId so partner can add it when they open the app
      
      return docRef.id;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create date night');
    }
  }
  
  /**
   * Get date nights for a pair
   */
  static async getDateNights(
    pairId: string,
    upcomingOnly: boolean = false
  ): Promise<DateNight[]> {
    try {
      const dateNightsRef = collection(db, 'dateNights');
      
      // Try with orderBy first (requires index)
      try {
      let q = query(
        dateNightsRef,
        where('pairId', '==', pairId),
        orderBy('date', upcomingOnly ? 'asc' : 'desc')
      );
      
      if (upcomingOnly) {
        const now = new Date();
        q = query(
          dateNightsRef,
          where('pairId', '==', pairId),
          where('date', '>=', now),
          orderBy('date', 'asc')
        );
      }
      
      const snapshot = await getDocs(q);
        const nights = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as DateNight[];
        
        return nights;
      } catch (indexError: any) {
        // If index is missing, use fallback query without orderBy
        console.log('⚠️ Firestore index missing, using fallback query...');
        const fallbackQ = query(
          dateNightsRef,
          where('pairId', '==', pairId)
        );
        
        const snapshot = await getDocs(fallbackQ);
        let nights = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as DateNight[];
        
        // Filter and sort manually
        if (upcomingOnly) {
          const now = new Date();
          nights = nights.filter(night => {
            if (!night.date) return false;
            try {
              const date = night.date?.toDate ? night.date.toDate() : new Date(night.date);
              return date >= now;
            } catch {
              return false;
            }
          });
        }
        
        // Sort manually by date
        nights.sort((a, b) => {
          try {
            const dateA = a.date?.toDate ? a.date.toDate().getTime() : (a.date ? new Date(a.date).getTime() : 0);
            const dateB = b.date?.toDate ? b.date.toDate().getTime() : (b.date ? new Date(b.date).getTime() : 0);
            return upcomingOnly ? dateA - dateB : dateB - dateA; // Ascending for upcoming, descending for all
          } catch {
            return 0;
          }
        });
        
        return nights;
      }
    } catch (error: any) {
      console.error('Error getting date nights:', error);
      throw new Error(error.message || 'Failed to get date nights');
    }
  }
  
  /**
   * Update date night
   * Also updates calendar events and sends notification to partner
   */
  static async updateDateNight(
    dateNightId: string,
    updates: Partial<DateNight>,
    partnerId?: string,
    partnerPushToken?: string,
    updaterName?: string
  ): Promise<void> {
    try {
      // Get current date night data
      const dateNightDoc = await getDoc(doc(db, 'dateNights', dateNightId));
      if (!dateNightDoc.exists()) {
        throw new Error('Date night not found');
      }
      
      const currentData = dateNightDoc.data() as DateNight;
      const calendarEventIds = currentData.calendarEventIds || {};
      
      // If marking as completed, delete from calendars instead of updating
      if (updates.completed === true && !currentData.completed) {
        console.log('🗑️ Date marked as completed - deleting from calendars...');
        
        // Delete calendar events for all users who have this date in their calendar
        const deletePromises: Promise<void>[] = [];
        for (const [userId, eventId] of Object.entries(calendarEventIds)) {
          if (eventId && typeof eventId === 'string') {
            deletePromises.push(
              this.deleteCalendarEvent(eventId)
                .then(() => {
                  console.log(`✅ Deleted calendar event for user ${userId} (completed date)`);
                })
                .catch(async (err) => {
                  console.warn(`⚠️ Failed to delete calendar event for user ${userId}:`, err);
                  // Try searching as fallback
                  try {
                    const deleted = await this.findAndDeleteCalendarEvent(currentData);
                    if (deleted) {
                      console.log(`✅ Found and deleted calendar event by searching for user ${userId}`);
                    }
                  } catch (searchErr) {
                    console.warn(`⚠️ Search deletion also failed for user ${userId}:`, searchErr);
                  }
                })
            );
          }
        }
        
        // Wait for all deletions to complete
        await Promise.allSettled(deletePromises);
        
        // Clear calendar event IDs from Firestore since events are deleted
        await updateDoc(doc(db, 'dateNights', dateNightId), {
          ...updates,
          calendarEventIds: {}, // Clear event IDs since events are deleted
          updatedAt: serverTimestamp(),
        });
      } else if (updates.completed === false && currentData.completed) {
        // If unmarking as completed, we could re-add to calendar, but for now just update Firestore
        // The user can manually add it back if needed
        await updateDoc(doc(db, 'dateNights', dateNightId), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Normal update - update Firestore document
      await updateDoc(doc(db, 'dateNights', dateNightId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
        
        // Update calendar events for all users who have this date in their calendar
        if (updates.date || updates.title || updates.description || updates.location) {
          const updatedDateNight = { ...currentData, ...updates };
          
          // Update calendar for each user who has this event
          for (const [userId, eventId] of Object.entries(calendarEventIds)) {
            if (eventId && typeof eventId === 'string') {
              try {
                await this.updateCalendarEvent(eventId, updatedDateNight);
                console.log(`✅ Updated calendar event for user ${userId}`);
              } catch (err) {
                console.warn(`Failed to update calendar event for user ${userId}:`, err);
              }
            }
          }
        }
      }
      
      // Send notification to partner about the update
      if (partnerId && partnerPushToken) {
        try {
          const senderName = updaterName || 'Your partner';
          let notificationTitle = '📅 Date Night Updated';
          let notificationBody = `${senderName} updated "${updates.title || currentData.title}"`;
          
          // Customize notification for completion status
          if (updates.completed === true && !currentData.completed) {
            notificationTitle = '✅ Date Night Completed';
            notificationBody = `${senderName} marked "${currentData.title}" as completed. It has been removed from your calendar.`;
          } else if (updates.completed === false && currentData.completed) {
            notificationTitle = '📅 Date Night Reopened';
            notificationBody = `${senderName} reopened "${currentData.title}"`;
          }
          
          await sendPushNotification(
            partnerPushToken,
            notificationTitle,
            notificationBody,
            {
              type: 'dateNightUpdated',
              dateNightId: dateNightId,
              pairId: currentData.pairId,
            }
          );
          console.log('✅ Update notification sent to partner');
        } catch (notifError: any) {
          console.warn('Failed to send update notification:', notifError);
        }
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update date night');
    }
  }
  
  /**
   * Delete date night
   * Also deletes from all calendars and sends notification to partner
   */
  static async deleteDateNight(
    dateNightId: string,
    partnerId?: string,
    partnerPushToken?: string,
    deleterName?: string,
    currentUserId?: string
  ): Promise<void> {
    try {
      // Get date night data before deleting
      const dateNightDoc = await getDoc(doc(db, 'dateNights', dateNightId));
      if (!dateNightDoc.exists()) {
        throw new Error('Date night not found');
      }
      
      const dateNightData = dateNightDoc.data() as DateNight;
      const calendarEventIds = dateNightData.calendarEventIds || {};
      
      console.log('🗑️ Deleting date night:', dateNightData.title);
      console.log('📋 Calendar event IDs found:', Object.keys(calendarEventIds).length);
      console.log('📋 Calendar event IDs:', calendarEventIds);
      
      // IMPORTANT: We can only delete from the current user's calendar on this device
      // The partner's calendar must be deleted on THEIR device via notification/listener
      // So we only delete from current user's calendar here
      const deletePromises: Promise<void>[] = [];
      
      // Delete from current user's calendar if they have an event ID stored
      if (currentUserId) {
        const currentUserEventId = calendarEventIds[currentUserId];
        if (currentUserEventId && typeof currentUserEventId === 'string') {
          console.log(`🗑️ Attempting to delete calendar event for current user ${currentUserId} with eventId: ${currentUserEventId}`);
          deletePromises.push(
            this.deleteCalendarEvent(currentUserEventId)
              .then(() => {
                console.log(`✅ Deleted calendar event for current user ${currentUserId} (eventId: ${currentUserEventId})`);
              })
              .catch(async (err) => {
                console.warn(`⚠️ Failed to delete calendar event for current user ${currentUserId} (eventId: ${currentUserEventId}):`, err);
                // If deletion by ID fails, try searching as fallback
                console.log(`🔍 Attempting to find and delete by searching for current user ${currentUserId}...`);
                try {
                  const deleted = await this.findAndDeleteCalendarEvent(dateNightData);
                  if (deleted) {
                    console.log(`✅ Found and deleted calendar event by searching for current user ${currentUserId}`);
                  } else {
                    console.warn(`⚠️ Could not find calendar event to delete by searching for current user ${currentUserId}`);
                  }
                } catch (searchErr) {
                  console.warn(`⚠️ Search deletion also failed for current user ${currentUserId}:`, searchErr);
                }
              })
          );
        } else {
          // No event ID stored, try searching
          console.log(`🔍 No stored event ID for current user ${currentUserId}, searching calendar...`);
          deletePromises.push(
            this.findAndDeleteCalendarEvent(dateNightData)
              .then((deleted) => {
                if (deleted) {
                  console.log(`✅ Found and deleted calendar event by searching for current user ${currentUserId}`);
                } else {
                  console.warn(`⚠️ Could not find calendar event to delete by searching for current user ${currentUserId}`);
                }
              })
              .catch((err) => {
                console.warn(`⚠️ Failed to find/delete calendar event by searching for current user ${currentUserId}:`, err);
              })
          );
        }
      }
      
      // Note: Partner's calendar will be deleted on their device via:
      // 1. Real-time listener detecting the deletion
      // 2. Push notification handler
      
      // Always try to delete from current user's calendar (even if no event ID stored)
      // This is important for dates created before we started storing event IDs
      if (currentUserId) {
        const currentUserEventId = calendarEventIds[currentUserId];
        if (!currentUserEventId) {
          console.log('🔍 No stored event ID for current user, searching calendar...');
          deletePromises.push(
            this.findAndDeleteCalendarEvent(dateNightData)
              .then((deleted) => {
                if (deleted) {
                  console.log('✅ Found and deleted calendar event by searching (current user)');
                } else {
                  console.warn('⚠️ Could not find calendar event to delete by searching (current user)');
                }
              })
              .catch((err) => {
                console.warn('⚠️ Failed to find/delete calendar event by searching (current user):', err);
              })
          );
        }
      }
      
      // CRITICAL: Delete from calendars BEFORE deleting from Firestore
      // This ensures we have the date data available for searching if needed
      console.log('🗑️ Starting calendar deletions...');
      const results = await Promise.allSettled(deletePromises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;
      console.log(`📊 Calendar deletion results: ${successCount} succeeded, ${failCount} failed`);
      
      // If all deletions failed, try one more time with search for current user
      if (successCount === 0 && currentUserId && Calendar) {
        console.log('🔄 All deletions failed, trying one more time with search...');
        try {
          const deleted = await this.findAndDeleteCalendarEvent(dateNightData);
          if (deleted) {
            console.log('✅ Successfully deleted calendar event on retry');
          } else {
            console.warn('⚠️ Retry deletion also failed - event may not exist in calendar');
          }
        } catch (err) {
          console.warn('⚠️ Retry deletion also failed:', err);
        }
      }
      
      // Delete from Firestore AFTER calendar deletion
      await deleteDoc(doc(db, 'dateNights', dateNightId));
      console.log('✅ Date night deleted from Firestore');
      
      // Send notification to partner
      if (partnerId && partnerPushToken) {
        try {
          const senderName = deleterName || 'Your partner';
          await sendPushNotification(
            partnerPushToken,
            '📅 Date Night Cancelled',
            `${senderName} cancelled "${dateNightData.title}"`,
            {
              type: 'dateNightDeleted',
              dateNightId: dateNightId,
              pairId: dateNightData.pairId,
            }
          );
          console.log('✅ Deletion notification sent to partner');
        } catch (notifError: any) {
          console.warn('Failed to send deletion notification:', notifError);
        }
      }
    } catch (error: any) {
      console.error('❌ Error deleting date night:', error);
      throw new Error(error.message || 'Failed to delete date night');
    }
  }
  
  /**
   * Find and delete calendar event by searching for matching title and date
   * This is a fallback when event ID is not stored
   */
  static async findAndDeleteCalendarEvent(dateNight: DateNight): Promise<boolean> {
    if (!Calendar) {
      return false;
    }

    try {
      // Request calendar permissions
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }

      // Get all calendars
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      
      // Get the date
      let targetDate: Date;
      if (dateNight.date instanceof Date) {
        targetDate = dateNight.date;
      } else if (dateNight.date?.toDate) {
        targetDate = dateNight.date.toDate();
      } else {
        targetDate = new Date(dateNight.date);
      }

      // Search for events matching the title and date
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      for (const cal of calendars) {
        try {
          const events = await Calendar.getEventsAsync(
            [cal.id],
            startOfDay,
            endOfDay
          );

          // Find matching event by title and time
          const matchingEvent = events.find((event: any) => {
            const eventDate = new Date(event.startDate);
            
            // Check if titles match (exact or partial)
            const titleMatches = event.title === dateNight.title || 
                                 (event.title && dateNight.title && event.title.includes(dateNight.title)) ||
                                 (event.title && dateNight.title && dateNight.title.includes(event.title));
            
            // Check if dates match (same day)
            const dateMatches = eventDate.getDate() === targetDate.getDate() &&
                               eventDate.getMonth() === targetDate.getMonth() &&
                               eventDate.getFullYear() === targetDate.getFullYear();
            
            // Check if times are close (within 1 hour)
            const timeDiff = Math.abs(eventDate.getTime() - targetDate.getTime());
            const timeMatches = timeDiff < 60 * 60 * 1000; // 1 hour
            
            if (titleMatches && dateMatches) {
              console.log(`✅ Found potential match: "${event.title}" on ${eventDate.toISOString()}`);
            }
            
            return titleMatches && dateMatches && timeMatches;
          });

          if (matchingEvent) {
            await Calendar.deleteEventAsync(matchingEvent.id);
            console.log(`✅ Found and deleted matching calendar event: ${matchingEvent.id}`);
            return true;
          }
        } catch (err) {
          console.warn(`Failed to search calendar ${cal.id}:`, err);
        }
      }

      return false;
    } catch (error: any) {
      console.error('Error finding calendar event:', error);
      return false;
    }
  }
  
  /**
   * Generate FaceTime deep link
   */
  static generateFaceTimeLink(phoneNumber?: string): string {
    // FaceTime deep link format: facetime://phone-number or facetime://email
    if (phoneNumber) {
      return `facetime://${phoneNumber}`;
    }
    // For email-based FaceTime
    return `facetime://`; // Will need partner's email/phone
  }
  
  /**
   * Launch FaceTime call
   */
  static async launchFaceTime(phoneNumberOrEmail: string): Promise<void> {
    try {
      const url = this.generateFaceTimeLink(phoneNumberOrEmail);
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        throw new Error('FaceTime is not available');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to launch FaceTime');
    }
  }
  
  /**
   * Add date night to current user's Apple Calendar
   */
  static async addToCalendar(
    dateNightId: string,
    dateNight: Partial<DateNight> | { date: Date; title?: string; description?: string; location?: string; duration?: number; reminders?: { enabled: boolean; offsetMinutes: number } }
  ): Promise<string | null> {
    if (!Calendar) {
      console.warn('expo-calendar not available - skipping calendar integration');
      return null;
    }

    try {
      console.log('Requesting calendar permissions...');
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('❌ Calendar permission not granted. Status:', status);
        console.log('User needs to grant calendar permissions in Settings');
        throw new Error('Calendar permission denied. Please enable calendar access in Settings.');
      }
      
      console.log('✅ Calendar permission granted');
      console.log('Fetching available calendars...');
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      console.log('Found', calendars.length, 'calendars');
      
      // Find default calendar (prefer one that allows modifications)
      const defaultCalendar = calendars.find((cal: any) => cal.allowsModifications && cal.isPrimary) 
        || calendars.find((cal: any) => cal.allowsModifications) 
        || calendars.find((cal: any) => cal.isPrimary)
        || calendars[0];
      
      if (!defaultCalendar) {
        throw new Error('No calendar available on this device');
      }
      
      console.log('Using calendar:', defaultCalendar.title, '(ID:', defaultCalendar.id + ')');

      // Handle both Timestamp and Date objects
      let startDate: Date;
      if (dateNight.date instanceof Date) {
        startDate = dateNight.date;
      } else if (dateNight.date?.toDate) {
        startDate = dateNight.date.toDate();
      } else {
        startDate = new Date(dateNight.date || new Date());
      }

      // Ensure dates are valid
      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid date provided');
      }

      // Create end date based on duration (default 2 hours if not specified)
      const durationMinutes = (dateNight as any).duration || 120; // Default 2 hours
      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
      
      // Check for existing events to prevent duplicates
      console.log('🔍 Checking for existing events to prevent duplicates...');
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      try {
        const existingEvents = await Calendar.getEventsAsync(
          [defaultCalendar.id],
          startOfDay,
          endOfDay
        );
        
        // Check for matching events (same title and time within 5 minutes)
        const title = dateNight.title || 'Date Night';
        const matchingEvent = existingEvents.find((event: any) => {
          const eventDate = new Date(event.startDate);
          const titleMatches = event.title === title || 
                               (event.title && title && (event.title.includes(title) || title.includes(event.title)));
          const timeMatches = Math.abs(eventDate.getTime() - startDate.getTime()) < 5 * 60 * 1000; // 5 minutes tolerance
          return titleMatches && timeMatches;
        });
        
        if (matchingEvent) {
          console.log('⚠️ Duplicate event found, using existing event ID:', matchingEvent.id);
          return matchingEvent.id;
        }
      } catch (searchError: any) {
        console.log('⚠️ Could not search for existing events:', searchError.message);
        // Continue with creation if search fails
      }
      
      console.log('Creating calendar event:');
      console.log('  Title:', dateNight.title || 'Date Night');
      console.log('  Start:', startDate.toISOString());
      console.log('  End:', endDate.toISOString());
      console.log('  Location:', dateNight.location || 'N/A');
      
      // Ensure dates are in correct format for calendar
      // Use UTC to avoid timezone issues
      const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
        title: dateNight.title || 'Date Night',
        startDate: startDate,
        endDate: endDate,
        allDay: false, // Explicitly set to false for proper highlighting
        notes: dateNight.description || undefined,
        location: dateNight.location || undefined,
        alarms: dateNight.reminders?.enabled && dateNight.reminders?.offsetMinutes
          ? [{ 
              relativeOffset: -dateNight.reminders.offsetMinutes, 
              method: Calendar.AlarmMethod.ALERT 
            }]
          : [],
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Use device timezone
      });
      
      console.log('✅ Date night successfully added to calendar! Event ID:', eventId);
      return eventId;
    } catch (error: any) {
      console.error('❌ Failed to add to calendar:', error);
      console.error('Error details:', error.message || error);
      // Don't throw - calendar is optional
      return null;
    }
  }

  /**
   * Update calendar event
   */
  static async updateCalendarEvent(
    eventId: string,
    dateNight: Partial<DateNight> | { date: Date | any; title?: string; description?: string; location?: string; reminders?: { enabled: boolean; offsetMinutes: number } }
  ): Promise<void> {
    if (!Calendar) {
      console.warn('expo-calendar not available - skipping calendar update');
      return;
    }

    try {
      // Handle both Timestamp and Date objects
      let startDate: Date;
      if (dateNight.date instanceof Date) {
        startDate = dateNight.date;
      } else if (dateNight.date?.toDate) {
        startDate = dateNight.date.toDate();
      } else {
        startDate = new Date(dateNight.date || new Date());
      }

      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid date provided');
      }

      // Create end date based on duration (default 2 hours if not specified)
      const durationMinutes = (dateNight as any).duration || 120; // Default 2 hours
      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
      
      await Calendar.updateEventAsync(eventId, {
        title: dateNight.title || 'Date Night',
        startDate: startDate,
        endDate: endDate,
        notes: dateNight.description || undefined,
        location: dateNight.location || undefined,
        alarms: dateNight.reminders?.enabled && dateNight.reminders?.offsetMinutes
          ? [{ 
              relativeOffset: -dateNight.reminders.offsetMinutes, 
              method: Calendar.AlarmMethod.ALERT 
            }]
          : [],
      });
      
      console.log('✅ Calendar event updated:', eventId);
    } catch (error: any) {
      console.error('❌ Failed to update calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete calendar event
   */
  static async deleteCalendarEvent(eventId: string): Promise<void> {
    if (!Calendar) {
      console.warn('expo-calendar not available - skipping calendar deletion');
      throw new Error('Calendar not available');
    }

    try {
      // Request calendar permissions first
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        console.warn('❌ Calendar permission not granted for deletion');
        throw new Error('Calendar permission denied');
      }

      console.log('🗑️ Attempting to delete calendar event:', eventId);
      console.log('   Event ID type:', typeof eventId);
      console.log('   Event ID length:', eventId?.length);
      
      // Validate event ID format
      if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
        throw new Error('Invalid event ID provided');
      }
      
      // Try to delete the event
      try {
        const result = await Calendar.deleteEventAsync(eventId);
        console.log('✅ Calendar event deleted successfully:', eventId);
        console.log('   Delete result:', result);
        
        // Small delay to ensure deletion propagates to system calendar
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return;
      } catch (deleteError: any) {
        console.error('❌ Calendar.deleteEventAsync error:', deleteError);
        console.error('   Error message:', deleteError.message);
        console.error('   Error code:', deleteError.code);
        console.error('   Error stack:', deleteError.stack);
        
        // Check if error is because event doesn't exist
        const errorMessage = deleteError.message?.toLowerCase() || '';
        const errorCode = deleteError.code?.toLowerCase() || '';
        
        if (errorMessage.includes('not found') || 
            errorMessage.includes('does not exist') ||
            errorMessage.includes('invalid') ||
            errorMessage.includes('not exist') ||
            errorCode === 'not_found' ||
            errorCode === 'invalid') {
          console.log('ℹ️ Event may have already been deleted or event ID is invalid');
          // Don't throw - event is already gone
          return;
        } else {
          // Re-throw other errors so caller can try fallback
          throw deleteError;
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to delete calendar event:', eventId, error);
      throw error; // Re-throw so caller can handle it
    }
  }

  /**
   * Add date to calendar and store event ID for a specific user
   * This is called when partner receives notification and opens the app
   */
  static async addDateToUserCalendar(
    dateNightId: string,
    userId: string,
    dateNight: Partial<DateNight> | { date: Date | any; title?: string; description?: string; location?: string; duration?: number; reminders?: { enabled: boolean; offsetMinutes: number } }
  ): Promise<string | null> {
    try {
      const eventId = await this.addToCalendar(dateNightId, dateNight);
      
      if (eventId) {
        // Update Firestore to store this user's calendar event ID
        const dateNightRef = doc(db, 'dateNights', dateNightId);
        const dateNightDoc = await getDoc(dateNightRef);
        
        if (dateNightDoc.exists()) {
          const currentData = dateNightDoc.data() as DateNight;
          const calendarEventIds = currentData.calendarEventIds || {};
          
          await updateDoc(dateNightRef, {
            calendarEventIds: {
              ...calendarEventIds,
              [userId]: eventId,
            },
          });
          
          console.log(`✅ Calendar event ID stored for user ${userId}`);
        }
      }
      
      return eventId;
    } catch (error: any) {
      console.error('Failed to add date to user calendar:', error);
      return null;
    }
  }

  /**
   * Check if a calendar event still exists by searching for it
   * Uses getEventsAsync to search around the date night's time and match by title
   */
  static async checkCalendarEventExists(
    eventId: string,
    dateNight?: Partial<DateNight>
  ): Promise<boolean> {
    if (!Calendar) {
      return false;
    }

    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }

      // Method 1: Try to get event directly by ID (if getEventAsync is available)
      try {
        if (Calendar.getEventAsync) {
          const event = await Calendar.getEventAsync(eventId);
          if (event) {
            return true;
          }
        }
      } catch (error: any) {
        // Event doesn't exist or getEventAsync not available
        console.log(`📅 getEventAsync failed for ${eventId}, trying search method...`);
      }

      // Method 2: Search for event by matching title and date (fallback)
      if (dateNight && dateNight.title && dateNight.date) {
        try {
          const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
          const defaultCalendar = calendars.find((cal: any) => cal.allowsModifications && cal.isPrimary) 
            || calendars.find((cal: any) => cal.allowsModifications) 
            || calendars[0];

          if (!defaultCalendar) {
            return false;
          }

          // Get date range around the date night
          let startDate: Date;
          if (dateNight.date instanceof Date) {
            startDate = dateNight.date;
          } else if (dateNight.date?.toDate) {
            startDate = dateNight.date.toDate();
          } else {
            startDate = new Date(dateNight.date);
          }

          const searchStart = new Date(startDate);
          searchStart.setHours(0, 0, 0, 0);
          const searchEnd = new Date(startDate);
          searchEnd.setHours(23, 59, 59, 999);

          // Search for events in the date range
          const events = await Calendar.getEventsAsync(
            [defaultCalendar.id],
            searchStart,
            searchEnd
          );

          // Check if we can find an event with matching title
          const matchingEvent = events.find((event: any) => {
            const timeMatches = Math.abs(
              new Date(event.startDate).getTime() - startDate.getTime()
            ) < 60 * 60 * 1000; // Within 1 hour
            const titleMatches = event.title === dateNight.title;
            return timeMatches && titleMatches;
          });

          if (matchingEvent) {
            console.log(`✅ Found matching calendar event for "${dateNight.title}"`);
            return true;
          } else {
            console.log(`❌ Calendar event not found for "${dateNight.title}" (likely deleted)`);
            return false;
          }
        } catch (searchError: any) {
          console.warn('Error searching for calendar event:', searchError);
          // If search fails, assume event exists to avoid false positives
          return true;
        }
      }

      // If we can't verify, return false (assume deleted)
      console.log(`⚠️ Cannot verify event ${eventId} - assuming deleted`);
      return false;
    } catch (error: any) {
      console.warn('Error checking calendar event existence:', error);
      // On error, assume event exists to avoid false positives
      return true;
    }
  }

  /**
   * Check if calendar events for date nights have been deleted and sync accordingly
   * If a date's calendar event is deleted, mark it as completed (moved to past)
   */
  static async checkAndSyncCalendarDeletions(
    dateNights: DateNight[],
    userId: string
  ): Promise<{ updatedCount: number; deletedEventIds: string[] }> {
    if (!Calendar) {
      return { updatedCount: 0, deletedEventIds: [] };
    }

    let updatedCount = 0;
    const deletedEventIds: string[] = [];

    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        console.log('Calendar permissions not granted - skipping deletion check');
        return { updatedCount: 0, deletedEventIds: [] };
      }

      // Check only upcoming, non-completed dates
      const upcomingDates = dateNights.filter((night) => {
        if (night.completed) return false;
        if (!night.date) return false;
        try {
          const date = night.date?.toDate ? night.date.toDate() : new Date(night.date);
          return date > new Date();
        } catch {
          return false;
        }
      });

      console.log(`🔍 Checking ${upcomingDates.length} upcoming dates for calendar deletions...`);

      for (const dateNight of upcomingDates) {
        if (!dateNight.id) continue;

        const calendarEventIds = dateNight.calendarEventIds || {};
        const userEventId = calendarEventIds[userId];

        if (userEventId) {
          // Check if this user's calendar event still exists
          const exists = await this.checkCalendarEventExists(userEventId, dateNight);
          
          if (!exists) {
            console.log(`❌ Calendar event deleted for date: "${dateNight.title}" (eventId: ${userEventId})`);
            deletedEventIds.push(userEventId);

            // Mark as completed to move to past dates
            try {
              // Get the full date night data to delete from partner's calendar too
              const dateNightDoc = await getDoc(doc(db, 'dateNights', dateNight.id));
              const fullDateNight = dateNightDoc.exists() ? dateNightDoc.data() as DateNight : dateNight;
              const calendarEventIds = fullDateNight.calendarEventIds || {};
              
              // Delete from all partners' calendars
              const deletePromises: Promise<void>[] = [];
              for (const [partnerUserId, partnerEventId] of Object.entries(calendarEventIds)) {
                if (partnerEventId && typeof partnerEventId === 'string') {
                  deletePromises.push(
                    this.deleteCalendarEvent(partnerEventId).catch((err) => {
                      console.warn(`Failed to delete calendar event for partner ${partnerUserId}:`, err);
                    })
                  );
                }
              }
              
              // Wait for calendar deletions, then mark as completed
              await Promise.allSettled(deletePromises);
              
              // Mark as completed in Firestore
              await updateDoc(doc(db, 'dateNights', dateNight.id), {
                completed: true,
                updatedAt: serverTimestamp(),
              });
              updatedCount++;
              console.log(`✅ Marked "${dateNight.title}" as completed and deleted from all calendars`);
            } catch (updateError: any) {
              console.error(`Failed to mark date as completed:`, updateError);
            }
          }
        }
      }

      console.log(`✅ Calendar sync complete: ${updatedCount} dates moved to past, ${deletedEventIds.length} events deleted`);
      return { updatedCount, deletedEventIds };
    } catch (error: any) {
      console.error('Error checking calendar deletions:', error);
      return { updatedCount, deletedEventIds };
    }
  }
}

