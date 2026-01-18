import { db } from '../config/firebase';
import { doc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import NetInfo from '@react-native-community/netinfo';
import { sendPushNotification } from '../utils/notifications';

export interface SOSEvent {
  id?: string;
  userId: string;
  pairId: string;
  message?: string;
  timestamp: any;
  responded: boolean;
}

export class SOSService {
  /**
   * Trigger SOS - immediate FaceTime + urgent notification to partner
   * @param partnerFaceTimeContact - Email or phone number for FaceTime
   * @param partnerPhoneNumber - Phone number for regular calls (fallback)
   */
  static async triggerSOS(
    userId: string,
    pairId: string,
    partnerPushToken?: string,
    userName?: string,
    partnerFaceTimeContact?: string,
    partnerPhoneNumber?: string,
    message?: string
  ): Promise<void> {
    try {
      // Check internet FIRST - if no internet, launch phone call IMMEDIATELY
      // Add timeout to NetInfo.fetch() so it doesn't hang
      let networkState: any;
      try {
        const netInfoPromise = NetInfo.fetch();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('NetInfo timeout')), 1000)
        );
        networkState = await Promise.race([netInfoPromise, timeoutPromise]);
      } catch (error: any) {
        // If NetInfo times out or fails, assume no internet
        console.warn('⚠️ NetInfo check failed or timed out, assuming no internet:', error.message);
        networkState = { isConnected: false, isInternetReachable: false };
      }
      
      const hasInternet = networkState.isConnected === true && networkState.isInternetReachable === true;
      
      // If NO internet, launch phone call IMMEDIATELY (but still try to save event and notify partner)
      let phoneCallLaunched = false;
      if (!hasInternet) {
        console.log('❌ NO INTERNET - Launching phone call IMMEDIATELY');
        
        if (partnerPhoneNumber) {
          try {
            const telUrl = `tel:${partnerPhoneNumber.replace(/[\s\-\(\)]/g, '')}`;
            const canOpenTel = await Linking.canOpenURL(telUrl);
            
            if (canOpenTel) {
              await Linking.openURL(telUrl);
              console.log('✅ Phone call launched IMMEDIATELY (no internet)');
              phoneCallLaunched = true;
              
              // Show local notification immediately (non-blocking)
              // This provides backup feedback in case Alert doesn't show
              Notifications.scheduleNotificationAsync({
                content: {
                  title: '✅ SOS Sent',
                  body: 'Phone call launched. Partner will be notified when connection is restored.',
                  sound: true,
                  priority: Notifications.AndroidNotificationPriority.MAX,
                  badge: 1,
                },
                trigger: null,
              }).catch(err => console.warn('Notification error:', err));
              
              console.log('✅ Phone call launched and notification scheduled');
            } else {
              throw new Error('Cannot open phone URL');
            }
          } catch (error: any) {
            console.warn('Phone call launch failed:', error.message);
            // If phone call fails and no internet, there's nothing we can do
            throw new Error('No internet and phone call failed. Please check your connection and try again.');
          }
        } else {
          // No internet and no phone number - can't do anything
          throw new Error('No internet connection and no phone number available. Please connect to internet or add partner phone number.');
        }
      }
      
      // Background tasks (fire and forget) - don't wait for these
      // IMPORTANT: Always try to save to Firestore and send push notification, even when offline
      // Firestore will queue the write and sync when internet comes back
      // Push notification will fail if offline, but partner might have internet
      const backgroundTasks = async () => {
        // 1. Create SOS event in Firestore (non-blocking with timeout)
        // ALWAYS try to save, even when offline - Firestore offline persistence will queue it
        try {
          const sosEvent: Omit<SOSEvent, 'id'> = {
            userId,
            pairId,
            message,
            timestamp: serverTimestamp(),
            responded: false,
          };
          
          const firestorePromise = addDoc(collection(db, 'sosEvents'), sosEvent);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Firestore timeout')), hasInternet ? 2000 : 5000)
          );
          
          try {
            await Promise.race([firestorePromise, timeoutPromise]);
            console.log('✅ SOS event saved to Firestore' + (hasInternet ? '' : ' (queued for sync)'));
          } catch (error: any) {
            // If offline, Firestore will queue the write - this is expected
            if (!hasInternet) {
              console.log('📝 SOS event queued in Firestore (will sync when internet restored)');
            } else {
              console.warn('⚠️ Firestore save failed or timed out:', error.message);
            }
          }
        } catch (error: any) {
          // If offline, Firestore will queue the write - this is expected
          if (!hasInternet) {
            console.log('📝 SOS event queued in Firestore (will sync when internet restored)');
          } else {
            console.warn('⚠️ Firestore save error:', error.message);
          }
        }

        // 2. Send urgent notification to partner (non-blocking with timeout)
        // ALWAYS try to send, even when offline - partner might have internet
        if (partnerPushToken) {
          try {
            const senderName = userName || 'Your partner';
            const pushPromise = sendPushNotification(
              partnerPushToken,
              "🚨 SOS ALERT",
              `${senderName} needs you right now!`,
              {
                type: 'sos',
                userId: userId,
                pairId: pairId,
                message: message,
                urgent: true,
              }
            );
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Push notification timeout')), hasInternet ? 2000 : 5000)
            );
            
            try {
              await Promise.race([pushPromise, timeoutPromise]);
              console.log('✅ Push notification sent to partner');
            } catch (error: any) {
              if (!hasInternet) {
                console.warn('⚠️ Push notification failed (offline) - partner will be notified via Firestore when they come online');
              } else {
                console.warn('⚠️ Push notification failed or timed out:', error.message);
              }
            }
          } catch (error: any) {
            if (!hasInternet) {
              console.warn('⚠️ Push notification error (offline) - partner will be notified via Firestore when they come online');
            } else {
              console.warn('⚠️ Push notification error:', error.message);
            }
          }
        }
      };
      
      // Start background tasks but don't wait for them
      backgroundTasks().catch(err => console.warn('Background tasks error:', err));
      
      // If we already launched phone call when offline, return early (background tasks will still run)
      if (phoneCallLaunched) {
        return;
      }

        // 3. Smart call logic: Check connectivity and launch appropriate call method
        // (We already checked internet above, but verify again for call logic)
        let faceTimeLaunched = false;
        
        // Re-check network state for call logic (in case it changed)
        let callNetworkState: any;
        try {
          const netInfoPromise = NetInfo.fetch();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('NetInfo timeout')), 1000)
          );
          callNetworkState = await Promise.race([netInfoPromise, timeoutPromise]);
        } catch (error: any) {
          console.warn('⚠️ NetInfo re-check failed, using previous state');
          callNetworkState = networkState;
        }
        
        // STRICT internet check: Only try FaceTime if we're CERTAIN we have internet
        // - Must be connected
        // - Internet must be EXPLICITLY reachable (true), not null/undefined/false
        const isConnected = callNetworkState.isConnected === true;
        const isInternetReachable = callNetworkState.isInternetReachable;
      
      // CRITICAL: Only try FaceTime if internet is EXPLICITLY reachable (true)
      // If null/undefined/false, skip FaceTime and use phone call
      // This prevents trying FaceTime when internet is actually off
      // Use different variable name to avoid conflict
      const hasInternetForCall = isConnected === true && isInternetReachable === true;
      
      // Start with NO internet assumption - only confirm if we can prove it
      let confirmedHasInternet = false;
      
      if (!hasInternetForCall) {
        // NetInfo says NO internet - skip FaceTime immediately
        console.log('❌ NetInfo says NO internet - will use phone call only');
        console.log('   NetInfo state:', {
          isConnected: isConnected,
          isInternetReachable: isInternetReachable,
          type: callNetworkState.type
        });
      } else {
        // NetInfo says we have internet - double-check with actual connectivity test
        console.log('🔍 NetInfo says internet available - verifying with connectivity test...');
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          
          // Use GET request (not HEAD with no-cors) - this will fail if no real internet
          const response = await fetch('https://www.google.com/favicon.ico?t=' + Date.now(), {
            method: 'GET',
            signal: controller.signal as any,
            cache: 'no-store'
          });
          
          clearTimeout(timeoutId);
          
          // Only confirm if response is actually OK
          if (response && response.ok) {
            confirmedHasInternet = true;
            console.log('✅ Real internet connectivity CONFIRMED via test');
          } else {
            confirmedHasInternet = false;
            console.warn('⚠️ Connectivity test returned non-OK response - no real internet');
          }
        } catch (error: any) {
          // Connectivity test failed - no real internet
          confirmedHasInternet = false;
          console.warn('⚠️ Connectivity test FAILED - no real internet, will use phone call');
          console.warn('   Error:', error.message || error);
        }
      }
      
      console.log('🔍 SOS Network Check (STRICT):', {
        isConnected: callNetworkState.isConnected,
        isInternetReachable: callNetworkState.isInternetReachable,
        type: callNetworkState.type,
        hasInternetForCall: hasInternetForCall,
        confirmedHasInternet: confirmedHasInternet,
        willTryFaceTime: confirmedHasInternet && !!partnerFaceTimeContact,
        hasFaceTimeContact: !!partnerFaceTimeContact,
        faceTimeContact: partnerFaceTimeContact ? (partnerFaceTimeContact.includes('@') ? partnerFaceTimeContact : 'phone number') : 'none',
        hasPhoneNumber: !!partnerPhoneNumber
      });
      
      // Try FaceTime ONLY if we have confirmed internet connection (both NetInfo and connectivity test)
      // (FaceTime requires internet on both ends)
      if (confirmedHasInternet && partnerFaceTimeContact) {
        console.log('📞 Attempting FaceTime FIRST (confirmed internet connection)');
        try {
          console.log('📞 Launching FaceTime with:', partnerFaceTimeContact.includes('@') ? partnerFaceTimeContact : 'phone number');
          await this.launchFaceTime(partnerFaceTimeContact);
          console.log('✅ FaceTime launched successfully - call should connect');
          faceTimeLaunched = true;
        } catch (error: any) {
          console.warn('⚠️ FaceTime launch failed, will try phone call:', error.message);
          // FaceTime failed - could be because:
          // 1. Partner doesn't have internet
          // 2. Number not registered for FaceTime
          // 3. Other FaceTime error
          // Continue to phone call fallback
        }
      } else {
        // NO internet or no FaceTime contact - skip FaceTime, use phone call
        if (!confirmedHasInternet) {
          console.log('❌ NO INTERNET CONFIRMED - Skipping FaceTime, using phone call directly');
        } else if (!partnerFaceTimeContact) {
          console.log('⚠️ Have internet but no FaceTime contact available - will use phone call');
        } else {
          console.log('⚠️ Unknown condition - will use phone call');
        }
      }
      
      // Fallback to regular phone call if:
      // - FaceTime failed (partner may not have internet)
      // - FaceTime contact not available
      // (Note: We already handled no-internet case above with early return)
      if (!faceTimeLaunched && partnerPhoneNumber) {
        try {
          // Launch regular phone call (works without internet)
          const telUrl = `tel:${partnerPhoneNumber.replace(/[\s\-\(\)]/g, '')}`;
          const canOpenTel = await Linking.canOpenURL(telUrl);
          
          if (canOpenTel) {
            await Linking.openURL(telUrl);
            console.log('✅ Regular phone call launched (FaceTime unavailable)');
          } else {
            console.warn('Phone call URL not supported');
            throw new Error('Phone call URL not supported');
          }
        } catch (error: any) {
          console.warn('Phone call launch failed:', error.message);
          throw new Error('Failed to launch phone call. Please try again.');
        }
      } else if (!partnerFaceTimeContact && !partnerPhoneNumber) {
        throw new Error('No contact information available. Please add partner phone number or FaceTime contact.');
      }

      // Show local notification confirmation (non-blocking)
      // This provides backup feedback in case Alert doesn't show
      Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ SOS Sent',
          body: 'Your partner has been notified',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          badge: 1,
        },
        trigger: null,
      }).catch(err => console.warn('Notification error:', err));
      
      console.log('✅ SOS completed - call launched and partner notified');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to trigger SOS');
    }
  }

  /**
   * Launch FaceTime call
   * Supports both phone numbers and email addresses
   * Falls back to regular phone call if FaceTime not available
   */
  static async launchFaceTime(phoneNumberOrEmail: string): Promise<void> {
    try {
      // Clean phone number (remove spaces, dashes, parentheses)
      const cleaned = phoneNumberOrEmail.replace(/[\s\-\(\)]/g, '');
      
      // If it's an email, try FaceTime with email
      if (cleaned.includes('@')) {
        const facetimeUrl = `facetime://${cleaned}`;
        const facetimeAudioUrl = `facetime-audio://${cleaned}`;
        
        // Try FaceTime video first
        const canOpenVideo = await Linking.canOpenURL(facetimeUrl);
        if (canOpenVideo) {
          await Linking.openURL(facetimeUrl);
          return;
        }
        
        // Try FaceTime audio
        const canOpenAudio = await Linking.canOpenURL(facetimeAudioUrl);
        if (canOpenAudio) {
          await Linking.openURL(facetimeAudioUrl);
          return;
        }
        
        throw new Error('FaceTime not available for this email address.');
      }

      // If it's a phone number
      if (/^\+?[\d]+$/.test(cleaned)) {
        // Try FaceTime first
        const facetimeUrl = `facetime://${cleaned}`;
        const canOpenFaceTime = await Linking.canOpenURL(facetimeUrl);

        if (canOpenFaceTime) {
          try {
            await Linking.openURL(facetimeUrl);
            // Note: If FaceTime fails (number not registered), it will show an error
            // but we can't catch that error here. The fallback below handles it.
            return;
          } catch (error) {
            // FaceTime URL opened but might fail - fall through to phone call
            console.warn('FaceTime launch attempted, falling back to phone call');
          }
        }

        // Fallback: Regular phone call (always works if number is valid)
        const telUrl = `tel:${cleaned}`;
        const canOpenTel = await Linking.canOpenURL(telUrl);
        
        if (canOpenTel) {
          await Linking.openURL(telUrl);
          return;
        }

        throw new Error('Could not launch phone call. Please check if the number is valid.');
      }

      throw new Error('Invalid phone number or email format.');
    } catch (error: any) {
      // If FaceTime fails, try regular phone call as last resort
      if (phoneNumberOrEmail && /^\+?[\d\s\-\(\)]+$/.test(phoneNumberOrEmail.replace(/[\s\-\(\)]/g, ''))) {
        try {
          const cleaned = phoneNumberOrEmail.replace(/[\s\-\(\)]/g, '');
          const telUrl = `tel:${cleaned}`;
          const canOpenTel = await Linking.canOpenURL(telUrl);
          if (canOpenTel) {
            await Linking.openURL(telUrl);
            return;
          }
        } catch (telError) {
          // Both failed
        }
      }
      throw new Error(error.message || 'Failed to launch FaceTime or phone call');
    }
  }

  /**
   * Mark SOS as responded
   */
  static async markResponded(sosEventId: string): Promise<void> {
    try {
      const sosRef = doc(db, 'sosEvents', sosEventId);
      await updateDoc(sosRef, {
        responded: true,
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark SOS as responded');
    }
  }
}

