import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../../src/config/firebase';
import { theme } from '../../src/config/theme';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';

export default function LoginScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [faceTimeEmail, setFaceTimeEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Helper function to validate phone number
    const validatePhoneNumber = (phone: string): boolean => {
        const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
        return /^\d{10,15}$/.test(cleaned);
    };

    // Helper function to validate email
    const validateEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        if (isSignUp) {
            // Validate all required fields for signup
            if (!name || !phoneNumber || !faceTimeEmail) {
                Alert.alert('Error', 'Please fill in all fields');
                return;
            }

            if (password !== confirmPassword) {
                Alert.alert('Error', 'Passwords do not match');
                return;
            }

            // Validate email format
            if (!validateEmail(email)) {
                Alert.alert('Error', 'Please enter a valid email address');
                return;
            }

            // Validate phone number
            if (!validatePhoneNumber(phoneNumber)) {
                Alert.alert('Error', 'Please enter a valid phone number (10-15 digits)');
                return;
            }

            // Validate FaceTime email
            if (!validateEmail(faceTimeEmail)) {
                Alert.alert('Error', 'Please enter a valid FaceTime email address');
                return;
            }
        }

        setLoading(true);
        try {
            if (isSignUp) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const newUser = userCredential.user;

                // Initialize User Profile in Firestore with all fields
                await setDoc(doc(db, 'users', newUser.uid), {
                    uid: newUser.uid,
                    email: newUser.email || email,
                    name: name.trim(),
                    displayName: name.trim(), // For backward compatibility
                    phoneNumber: phoneNumber.trim(),
                    faceTimeEmail: faceTimeEmail.trim(),
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    partnerId: null
                });

                await signOut(auth); // Prevent auto-login
                Alert.alert('Success', 'Successfully Signed-up', [
                    {
                        text: 'OK',
                        onPress: () => {
                            setIsSignUp(false);
                            setPassword('');
                            setConfirmPassword('');
                            setName('');
                            setPhoneNumber('');
                            setFaceTimeEmail('');
                        }
                    }
                ]);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (error: any) {
            let title = 'Oops!';
            let msg = error.message;

            if (error.code === 'auth/email-already-in-use') {
                title = 'Account Exists';
                msg = 'That email is already registered. Try logging in instead.';
            } else if (error.code === 'auth/invalid-email') {
                title = 'Invalid Email';
                msg = 'Please enter a valid email address.';
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                title = 'Login Failed';
                msg = 'Incorrect email or password.';
            } else if (error.code === 'auth/weak-password') {
                title = 'Weak Password';
                msg = 'Password should be at least 6 characters.';
            }

            Alert.alert(title, msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={theme.gradients.primary as [string, string]}
            style={styles.gradient}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.container}>
                            {/* Decorative header */}
                            <Text style={styles.emoji}>💕</Text>
                            <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
                            <Text style={styles.subtitle}>
                                {isSignUp ? 'Start your love journey together' : 'We missed you!'}
                            </Text>

                            <View style={styles.formCard}>
                                <View style={styles.inputContainer}>
                                    {isSignUp && (
                                        <TextInput
                                            placeholder="Name *"
                                            placeholderTextColor={theme.colors.textLight}
                                            value={name}
                                            onChangeText={setName}
                                            autoCapitalize="words"
                                            textContentType="name"
                                            autoComplete="name"
                                            style={styles.input}
                                        />
                                    )}

                                    <TextInput
                                        placeholder="Email"
                                        placeholderTextColor={theme.colors.textLight}
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        textContentType="emailAddress"
                                        autoComplete="email"
                                        style={styles.input}
                                    />

                                    <View style={styles.passwordContainer}>
                                        <TextInput
                                            placeholder="Password"
                                            placeholderTextColor={theme.colors.textLight}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            textContentType={isSignUp ? "newPassword" : "password"}
                                            autoComplete={isSignUp ? "password-new" : "password"}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            style={styles.passwordInput}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                            <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={theme.colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>

                                    {isSignUp && (
                                        <>
                                            <View style={styles.passwordContainer}>
                                                <TextInput
                                                    placeholder="Confirm Password *"
                                                    placeholderTextColor={theme.colors.textLight}
                                                    value={confirmPassword}
                                                    onChangeText={setConfirmPassword}
                                                    secureTextEntry={!showPassword}
                                                    textContentType="newPassword"
                                                    autoComplete="password-new"
                                                    autoCapitalize="none"
                                                    autoCorrect={false}
                                                    style={styles.passwordInput}
                                                />
                                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={theme.colors.textSecondary} />
                                                </TouchableOpacity>
                                            </View>

                                            <TextInput
                                                placeholder="Phone Number * - For SOS calls"
                                                placeholderTextColor={theme.colors.textLight}
                                                value={phoneNumber}
                                                onChangeText={setPhoneNumber}
                                                keyboardType="phone-pad"
                                                textContentType="telephoneNumber"
                                                autoComplete="tel"
                                                style={styles.input}
                                            />

                                            <TextInput
                                                placeholder="FaceTime Email * - For SOS FaceTime"
                                                placeholderTextColor={theme.colors.textLight}
                                                value={faceTimeEmail}
                                                onChangeText={setFaceTimeEmail}
                                                autoCapitalize="none"
                                                keyboardType="email-address"
                                                textContentType="emailAddress"
                                                autoComplete="email"
                                                style={styles.input}
                                            />
                                        </>
                                    )}
                                </View>

                                {!isSignUp && (
                                    <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotButton}>
                                        <Text style={styles.forgotText}>Forgot Password?</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity onPress={handleAuth} style={styles.button} disabled={loading}>
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Log In'}</Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.linkButton}>
                                <Text style={styles.linkText}>
                                    {isSignUp ? 'Already have an account? Log In' : 'New here? Create Account'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    // 🎀 Cozy Cloud Love Theme - Login Screen
    gradient: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        padding: theme.spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 48,
        marginBottom: theme.spacing.sm,
    },
    title: {
        fontSize: theme.typography.fontSize['3xl'],
        fontWeight: '700',
        marginBottom: theme.spacing.xs,
        textAlign: 'center',
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
    },
    formCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius['2xl'],
        padding: theme.spacing.lg,
        width: '100%',
        ...theme.shadows.lg,
    },
    inputContainer: {
        marginBottom: theme.spacing.md,
    },
    input: {
        backgroundColor: theme.colors.surfaceSoft,
        padding: 16,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    passwordContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceSoft,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    passwordInput: {
        flex: 1,
        padding: 16,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text,
    },
    eyeIcon: {
        padding: 12,
    },
    button: {
        backgroundColor: theme.colors.primary,
        padding: 16,
        borderRadius: theme.borderRadius.xl,
        alignItems: 'center',
        ...theme.shadows.lifted,
    },
    buttonText: {
        color: theme.colors.textOnPrimary,
        fontWeight: '700',
        fontSize: theme.typography.fontSize.md,
    },
    linkButton: {
        marginTop: theme.spacing.lg,
        alignItems: 'center',
    },
    linkText: {
        color: theme.colors.text,
        fontWeight: '500',
    },
    forgotButton: {
        alignSelf: 'flex-end',
        marginBottom: theme.spacing.md,
        marginTop: -theme.spacing.xs,
    },
    forgotText: {
        color: theme.colors.primary,
        fontWeight: '600',
        fontSize: theme.typography.fontSize.sm,
    },
});
