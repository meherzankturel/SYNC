import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, SafeAreaView } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../src/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleReset = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert(
                'Link Sent',
                'We have sent a secure password reset link to your email. Please check your inbox (and spam folder).',
                [{ text: 'Back to Login', onPress: () => router.back() }]
            );
        } catch (error: any) {
            let msg = 'Failed to send reset email. Please check the email address.';
            if (error.code === 'auth/user-not-found') {
                msg = 'No account found with this email.';
            }
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-open-outline" size={80} color="#FF6B6B" />
                    </View>

                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>
                        Don't worry! It happens. Enter your email below and we'll send you a secure link to reset it.
                    </Text>

                    <TextInput
                        placeholder="your@email.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={styles.input}
                    />

                    <TouchableOpacity onPress={handleReset} style={styles.button} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Send Reset Link</Text>
                        )}
                    </TouchableOpacity>

                    {/* Troubleshooting Tips */}
                    <View style={styles.troubleSection}>
                        <Text style={styles.troubleTitle}>Didn't receive it?</Text>
                        <Text style={styles.troubleText}>• Check your "Promotions" or Spam folder</Text>
                        <Text style={styles.troubleText}>• Ensure you typed the email correctly</Text>
                        <Text style={styles.troubleText}>• Wait a few minutes and try again</Text>
                    </View>

                    <TouchableOpacity onPress={() => router.back()} style={styles.linkButton}>
                        <View style={styles.linkRow}>
                            <Ionicons name="arrow-back-outline" size={16} color="#999" />
                            <Text style={styles.linkText}> Back to Login</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
    },
    backButton: {
        padding: 10,
        marginLeft: -10,
    },
    content: {
        flex: 1,
        padding: 30,
        paddingTop: 20,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 25,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 35,
        lineHeight: 22,
    },
    input: {
        width: '100%',
        backgroundColor: '#f9f9f9',
        padding: 18,
        borderRadius: 15,
        marginBottom: 20,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    button: {
        backgroundColor: '#FF6B6B',
        padding: 18,
        borderRadius: 15,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    troubleSection: {
        marginTop: 40,
        width: '100%',
        backgroundColor: '#fefefe',
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    troubleTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 10,
    },
    troubleText: {
        fontSize: 13,
        color: '#888',
        marginBottom: 5,
    },
    linkButton: {
        marginTop: 'auto',
        marginBottom: 20,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    linkText: {
        color: '#999',
        fontSize: 15,
        fontWeight: '600',
    },
});
