import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Debug utility to check pairId consistency between partners
 */
export async function debugPairIdConsistency(userId: string): Promise<void> {
  try {
    console.log('\n🔍 === PAIR ID DEBUG START ===');
    console.log('Checking for user:', userId);
    
    // Get current user data
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.error('❌ User document not found');
      return;
    }
    
    const userData = userDoc.data();
    console.log('\n📱 Current User Data:');
    console.log('  - User ID:', userId);
    console.log('  - pairId:', userData.pairId || 'MISSING');
    console.log('  - partnerId:', userData.partnerId || 'MISSING');
    console.log('  - displayName:', userData.displayName || userData.name || 'N/A');
    
    // Check if partner exists
    if (userData.partnerId) {
      const partnerDoc = await getDoc(doc(db, 'users', userData.partnerId));
      if (partnerDoc.exists()) {
        const partnerData = partnerDoc.data();
        console.log('\n👫 Partner Data:');
        console.log('  - User ID:', userData.partnerId);
        console.log('  - pairId:', partnerData.pairId || 'MISSING');
        console.log('  - partnerId:', partnerData.partnerId || 'MISSING');
        console.log('  - displayName:', partnerData.displayName || partnerData.name || 'N/A');
        
        // Check if pairIds match
        if (userData.pairId && partnerData.pairId) {
          if (userData.pairId === partnerData.pairId) {
            console.log('\n✅ SUCCESS: Both users have matching pairId:', userData.pairId);
          } else {
            console.error('\n❌ ERROR: pairId MISMATCH!');
            console.error('  - Your pairId:', userData.pairId);
            console.error('  - Partner pairId:', partnerData.pairId);
            console.error('  - Date nights will NOT sync between devices!');
          }
        } else {
          console.warn('\n⚠️ WARNING: One or both users missing pairId');
          console.warn('  - Your pairId:', userData.pairId || 'MISSING');
          console.warn('  - Partner pairId:', partnerData.pairId || 'MISSING');
        }
      } else {
        console.error('\n❌ Partner document not found:', userData.partnerId);
      }
    } else {
      console.warn('\n⚠️ No partnerId found - user is not connected');
    }
    
    // Check date nights for this user's pairId
    if (userData.pairId) {
      console.log('\n📅 Checking date nights for pairId:', userData.pairId);
      const dateNightsQuery = query(
        collection(db, 'dateNights'),
        where('pairId', '==', userData.pairId)
      );
      const dateNightsSnapshot = await getDocs(dateNightsQuery);
      console.log('  - Found', dateNightsSnapshot.docs.length, 'date nights');
      
      dateNightsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ${data.title} (created by: ${data.createdBy === userId ? 'YOU' : 'PARTNER'})`);
      });
    }
    
    console.log('\n🔍 === PAIR ID DEBUG END ===\n');
  } catch (error) {
    console.error('Error in pairId debug:', error);
  }
}

/**
 * Quick check to see if pairIds match
 */
export async function checkPairIdMatch(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    if (!userData.pairId || !userData.partnerId) return false;
    
    const partnerDoc = await getDoc(doc(db, 'users', userData.partnerId));
    if (!partnerDoc.exists()) return false;
    
    const partnerData = partnerDoc.data();
    return userData.pairId === partnerData.pairId;
  } catch (error) {
    console.error('Error checking pairId match:', error);
    return false;
  }
}

