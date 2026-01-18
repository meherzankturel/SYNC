import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { theme } from '../src/config/theme';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    // If user is authenticated, redirect to tabs
    if (user) {
      router.replace('/(tabs)');
    } else {
      // If not authenticated, redirect to login
      router.replace('/(auth)/login');
    }
  }, [user, loading, router]);

  // Show loading while checking auth state
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

