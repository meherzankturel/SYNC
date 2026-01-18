import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User,
  onAuthStateChanged,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  name?: string; // Full name for display
  phoneNumber?: string; // Phone number for cellular calls (SOS)
  faceTimeEmail?: string; // Email for FaceTime calls (SOS)
  photoURL?: string;
  pairId?: string;
  createdAt: any;
  updatedAt: any;
}

export class AuthService {
  /**
   * Sign up a new user
   */
  static async signUp(
    email: string, 
    password: string, 
    name: string,
    phoneNumber: string,
    faceTimeEmail: string
  ): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || email,
        name: name,
        displayName: name, // Use name as displayName for backward compatibility
        phoneNumber: phoneNumber,
        faceTimeEmail: faceTimeEmail,
        pairId: undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      // Send email verification
      if (user.email) {
        await sendEmailVerification(user);
      }
      
      return user;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign up');
    }
  }
  
  /**
   * Sign in existing user
   */
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in');
    }
  }
  
  /**
   * Sign out current user
   */
  static async signOutUser(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  }
  
  /**
   * Reset password via email
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }
  
  /**
   * Get current user
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }
  
  /**
   * Get user profile from Firestore
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get user profile');
    }
  }
  
  /**
   * Update user profile
   */
  static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await setDoc(
        doc(db, 'users', uid),
        {
          ...updates,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update user profile');
    }
  }
  
  /**
   * Subscribe to auth state changes
   */
  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }
}

