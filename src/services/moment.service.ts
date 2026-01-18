import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';

export interface DailyMoment {
    date: string; // Format: YYYY-MM-DD
    userId: string;
    photoUrl: string;
    caption?: string;
    uploadedAt: Date;
}

export interface CoupleMoment {
    id: string;
    date: string;
    user1Photo?: DailyMoment;
    user2Photo?: DailyMoment;
    createdAt: Date;
}

export class MomentService {
    /**
     * Request camera/photo library permissions
     */
    static async requestPermissions(): Promise<boolean> {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        return cameraStatus === 'granted' && libraryStatus === 'granted';
    }

    /**
     * Pick an image from library
     */
    static async pickImage(): Promise<string | null> {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                return result.assets[0].uri;
            }
            return null;
        } catch (error) {
            console.error('Error picking image:', error);
            return null;
        }
    }

    /**
     * Take a photo with camera
     */
    static async takePhoto(): Promise<string | null> {
        try {
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                return result.assets[0].uri;
            }
            return null;
        } catch (error) {
            console.error('Error taking photo:', error);
            return null;
        }
    }

    /**
     * Upload image to Firebase Storage
     */
    static async uploadImage(uri: string, userId: string, date: string): Promise<string | null> {
        try {
            // Fetch the image
            const response = await fetch(uri);
            const blob = await response.blob();

            // Create a reference
            const filename = `moments/${userId}/${date}.jpg`;
            const storageRef = ref(storage, filename);

            // Upload
            await uploadBytes(storageRef, blob);

            // Get download URL
            const downloadUrl = await getDownloadURL(storageRef);
            return downloadUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    }

    /**
     * Get today's date string (YYYY-MM-DD)
     */
    static getTodayDate(): string {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    /**
     * Get the moment document ID for a couple
     */
    static getMomentDocId(user1Id: string, user2Id: string, date: string): string {
        const [id1, id2] = [user1Id, user2Id].sort();
        return `${id1}_${id2}_${date}`;
    }

    /**
     * Upload/update today's moment
     */
    static async uploadMoment(
        userId: string,
        partnerId: string,
        imageUri: string,
        caption?: string
    ): Promise<boolean> {
        try {
            const date = this.getTodayDate();
            const docId = this.getMomentDocId(userId, partnerId, date);

            // Upload image to storage
            const photoUrl = await this.uploadImage(imageUri, userId, date);
            if (!photoUrl) return false;

            // Create moment data
            const momentData: DailyMoment = {
                date,
                userId,
                photoUrl,
                caption,
                uploadedAt: new Date(),
            };

            // Get existing document
            const docRef = doc(db, 'coupleMoments', docId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                // Update existing document
                const existing = docSnap.data();
                const updateData: any = {
                    date,
                };

                // Determine which user's photo to update
                if (existing.user1Photo?.userId === userId) {
                    updateData.user1Photo = momentData;
                } else if (existing.user2Photo?.userId === userId) {
                    updateData.user2Photo = momentData;
                } else if (!existing.user1Photo) {
                    updateData.user1Photo = momentData;
                } else {
                    updateData.user2Photo = momentData;
                }

                await setDoc(docRef, updateData, { merge: true });
            } else {
                // Create new document
                await setDoc(docRef, {
                    id: docId,
                    date,
                    user1Photo: momentData,
                    createdAt: Timestamp.now(),
                });
            }

            return true;
        } catch (error) {
            console.error('Error uploading moment:', error);
            return false;
        }
    }

    /**
     * Get today's moment for a couple
     */
    static async getTodayMoment(userId: string, partnerId: string): Promise<CoupleMoment | null> {
        try {
            const date = this.getTodayDate();
            const docId = this.getMomentDocId(userId, partnerId, date);
            const docRef = doc(db, 'coupleMoments', docId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    id: data.id,
                    date: data.date,
                    user1Photo: data.user1Photo,
                    user2Photo: data.user2Photo,
                    createdAt: data.createdAt?.toDate() || new Date(),
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting moment:', error);
            return null;
        }
    }

    /**
     * Listen to today's moment in real-time
     */
    static listenToTodayMoment(
        userId: string,
        partnerId: string,
        callback: (moment: CoupleMoment | null) => void
    ): () => void {
        const date = this.getTodayDate();
        const docId = this.getMomentDocId(userId, partnerId, date);
        const docRef = doc(db, 'coupleMoments', docId);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                callback({
                    id: data.id,
                    date: data.date,
                    user1Photo: data.user1Photo,
                    user2Photo: data.user2Photo,
                    createdAt: data.createdAt?.toDate() || new Date(),
                });
            } else {
                callback(null);
            }
        });

        return unsubscribe;
    }

    /**
     * Get user's photo from couple moment
     */
    static getUserPhoto(moment: CoupleMoment | null, userId: string): DailyMoment | null {
        if (!moment) return null;

        if (moment.user1Photo?.userId === userId) {
            return moment.user1Photo;
        }
        if (moment.user2Photo?.userId === userId) {
            return moment.user2Photo;
        }
        return null;
    }

    /**
     * Get partner's photo from couple moment
     */
    static getPartnerPhoto(moment: CoupleMoment | null, userId: string): DailyMoment | null {
        if (!moment) return null;

        if (moment.user1Photo?.userId !== userId && moment.user1Photo) {
            return moment.user1Photo;
        }
        if (moment.user2Photo?.userId !== userId && moment.user2Photo) {
            return moment.user2Photo;
        }
        return null;
    }
}
