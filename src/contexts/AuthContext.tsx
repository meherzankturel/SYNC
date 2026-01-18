import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { useRouter, useSegments } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { Alert } from 'react-native';

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (usr) => {
            setUser(usr);
            setLoading(false);

            if (usr) {
                // Register for push notifications when user is logged in
                const token = await registerForPushNotificationsAsync();
                if (token) {
                    try {
                        await updateDoc(doc(db, 'users', usr.uid), {
                            pushToken: token
                        });
                        console.log('Push Token saved successfully');
                    } catch (error) {
                        console.error('Failed to update push token:', error);
                    }
                } else {
                    console.warn('No push token generated.');
                }
            }
        });
        return unsubscribe;
    }, []);

    // Protected Route Logic
    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            // Redirect to login if not authenticated
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            // Redirect to tabs if already authenticated
            router.replace('/(tabs)');
        }
    }, [user, loading, segments]);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
