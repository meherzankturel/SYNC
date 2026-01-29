import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
    Dimensions
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../../src/config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Doodle Theme Colors
const colors = {
    background: '#fefefe',
    surface: '#ffffff',
    surfaceSoft: '#f8f5ff',
    primary: '#7f13ec',
    primaryDark: '#6910c2',
    text: '#141118',
    textSecondary: '#756189',
    textMuted: '#9a8ba8',
    border: '#e8e0f0',
    doodlePink: '#ff85a2',
    doodlePurple: '#a855f7',
    error: '#FF6B6B',
    success: '#4ADE80',
};

// Decorative Doodle Components (using Views instead of SVG)
const HeartDoodle = ({ style }: { style?: any }) => (
    <View style={[{ width: 24, height: 22 }, style]}>
        <View style={{
            width: 24,
            height: 22,
            backgroundColor: colors.doodlePink,
            borderRadius: 12,
            opacity: 0.7,
            transform: [{ rotate: '-45deg' }],
        }} />
    </View>
);

const SparklesDoodle = ({ style }: { style?: any }) => (
    <View style={[{ width: 16, height: 16 }, style]}>
        <Ionicons name="sparkles" size={16} color={colors.doodlePurple} style={{ opacity: 0.5 }} />
    </View>
);

const DotDoodle = ({ style, color = colors.doodlePurple }: { style?: any; color?: string }) => (
    <View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: 0.3 }, style]} />
);

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
    const [signupStep, setSignupStep] = useState(1);
    const TOTAL_SIGNUP_STEPS = 5;

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
            // Note: Individual steps already validated fields, but double check here
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
                Alert.alert('Error', 'Please enter a valid phone number');
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
                Alert.alert('Success', 'Account created successfully!', [
                    {
                        text: 'Sign In',
                        onPress: () => {
                            setIsSignUp(false);
                            setSignupStep(1);
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
                msg = 'That email is already registered. Try signing in instead.';
            } else if (error.code === 'auth/invalid-email') {
                title = 'Invalid Email';
                msg = 'Please enter a valid email address.';
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                title = 'Sign In Failed';
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

    const handleNextStep = () => {
        switch (signupStep) {
            case 1: // Name
                if (!name.trim()) { Alert.alert('Error', 'Name is required'); return; }
                break;
            case 2: // Email
                if (!email.trim()) { Alert.alert('Error', 'Email is required'); return; }
                if (!validateEmail(email)) { Alert.alert('Error', 'Invalid email format'); return; }
                break;
            case 3: // Password
                if (!password) { Alert.alert('Error', 'Password is required'); return; }
                if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
                if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
                break;
            case 4: // Phone
                if (!phoneNumber) { Alert.alert('Error', 'Phone number is required'); return; }
                if (!validatePhoneNumber(phoneNumber)) { Alert.alert('Error', 'Invalid phone number'); return; }
                break;
            case 5: // FaceTime -> Submit
                handleAuth();
                return;
        }
        setSignupStep(signupStep + 1);
    };

    const handlePrevStep = () => {
        if (signupStep > 1) {
            setSignupStep(signupStep - 1);
        } else {
            setIsSignUp(false); // Go back to login
        }
    };

    const renderSignupStep = () => {
        switch (signupStep) {
            case 1:
                return (
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>Full Name</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                placeholder="Enter your name"
                                placeholderTextColor={colors.textMuted}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                textContentType="name"
                                autoComplete="name"
                                style={styles.input}
                                autoFocus
                            />
                        </View>
                    </View>
                );
            case 2:
                return (
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>Email address</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                placeholder="your@email.com"
                                placeholderTextColor={colors.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                textContentType="emailAddress"
                                autoComplete="email"
                                style={styles.input}
                                autoFocus
                            />
                        </View>
                    </View>
                );
            case 3:
                return (
                    <>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    textContentType="newPassword"
                                    autoComplete="password-new"
                                    autoCapitalize="none"
                                    style={[styles.input, { flex: 1 }]}
                                    autoFocus
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textMuted} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Confirm Password</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.textMuted}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                    textContentType="newPassword"
                                    autoComplete="password-new"
                                    autoCapitalize="none"
                                    style={[styles.input, { flex: 1 }]}
                                />
                            </View>
                        </View>
                    </>
                );
            case 4:
                return (
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>Phone Number (for SOS)</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                placeholder="+1 234 567 8900"
                                placeholderTextColor={colors.textMuted}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                                textContentType="telephoneNumber"
                                autoComplete="tel"
                                style={styles.input}
                                autoFocus
                            />
                        </View>
                    </View>
                );
            case 5:
                return (
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>FaceTime Email (for SOS)</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="videocam-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                placeholder="facetime@email.com"
                                placeholderTextColor={colors.textMuted}
                                value={faceTimeEmail}
                                onChangeText={setFaceTimeEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                textContentType="emailAddress"
                                autoComplete="email"
                                style={styles.input}
                                autoFocus
                            />
                        </View>
                    </View>
                );
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <HeartDoodle style={styles.heartDoodle} />
            <SparklesDoodle style={styles.sparklesDoodle} />
            <DotDoodle style={styles.dotDoodle1} />
            <DotDoodle style={styles.dotDoodle2} color={colors.doodlePink} />

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
                        <View style={styles.logoSection}>
                            <View style={styles.logoContainer}>
                                <Text style={styles.logoText}>SYNC</Text>
                                <View style={styles.logoUnderline} />
                            </View>

                            <Text style={styles.welcomeText}>
                                {isSignUp ? `Step ${signupStep} of ${TOTAL_SIGNUP_STEPS}` : 'Welcome Back'}
                            </Text>
                            <Text style={styles.tagline}>
                                {isSignUp ? 'Start your journey together' : 'Stay connected, always'}
                            </Text>
                        </View>

                        {/* Progress Bar for Sign Up */}
                        {isSignUp && (
                            <View style={styles.progressBarContainer}>
                                <View style={[styles.progressBarFill, { width: `${(signupStep / TOTAL_SIGNUP_STEPS) * 100}%` }]} />
                            </View>
                        )}

                        <View style={styles.formSection}>
                            {isSignUp ? (
                                renderSignupStep()
                            ) : (
                                // Login Form (Unchanged)
                                <>
                                    <View style={styles.inputWrapper}>
                                        <Text style={styles.inputLabel}>Email address</Text>
                                        <View style={styles.inputContainer}>
                                            <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                                            <TextInput
                                                placeholder="your@email.com"
                                                placeholderTextColor={colors.textMuted}
                                                value={email}
                                                onChangeText={setEmail}
                                                autoCapitalize="none"
                                                keyboardType="email-address"
                                                textContentType="emailAddress"
                                                autoComplete="email"
                                                style={styles.input}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputWrapper}>
                                        <Text style={styles.inputLabel}>Password</Text>
                                        <View style={styles.inputContainer}>
                                            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                                            <TextInput
                                                placeholder="••••••••"
                                                placeholderTextColor={colors.textMuted}
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry={!showPassword}
                                                textContentType="password"
                                                autoComplete="password"
                                                autoCapitalize="none"
                                                style={[styles.input, { flex: 1 }]}
                                            />
                                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textMuted} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => router.push('/(auth)/forgot-password')}
                                        style={styles.forgotButton}
                                    >
                                        <Text style={styles.forgotText}>Forgot Password?</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {/* Buttons */}
                            {isSignUp ? (
                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
                                    <TouchableOpacity onPress={handlePrevStep} style={[styles.secondaryButton, { flex: 1 }]}>
                                        <Text style={styles.secondaryButtonText}>{signupStep === 1 ? "Cancel" : "Back"}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleNextStep} style={[styles.primaryButton, { flex: 1, marginTop: 0 }]}>
                                        <View style={styles.buttonInner}>
                                            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>{signupStep === TOTAL_SIGNUP_STEPS ? "Create Account" : "Next"}</Text>}
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={handleAuth}
                                    style={styles.primaryButton}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.buttonInner}>
                                        {loading ? (
                                            <ActivityIndicator color="#ffffff" />
                                        ) : (
                                            <Text style={styles.buttonText}>Sign In</Text>
                                        )}
                                    </View>
                                    <View style={styles.buttonLines} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Toggle Sign Up / Sign In (Only show if not in middle of signup steps or separate logic) */}
                        {!isSignUp && (
                            <View style={styles.toggleSection}>
                                <Text style={styles.toggleText}>Don't have an account?</Text>
                                <TouchableOpacity onPress={() => { setIsSignUp(true); setSignupStep(1); }}>
                                    <Text style={styles.toggleLink}>Create Account</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* If in signup, maybe show "Already have account?" at step 1 only to keep clean? kept it simple above for now */}

                        <View style={styles.footer}>
                            <View style={styles.themeToggle}>
                                <Ionicons name="contrast-outline" size={20} color={colors.textMuted} />
                            </View>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    // ... (keep existing styles)
    heartDoodle: { position: 'absolute', top: 100, left: 30, zIndex: 1 },
    sparklesDoodle: { position: 'absolute', top: 80, right: 40, zIndex: 1 },
    dotDoodle1: { position: 'absolute', top: 200, right: 60, zIndex: 1 },
    dotDoodle2: { position: 'absolute', bottom: 200, left: 50, zIndex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 28,
        paddingTop: 80,
        paddingBottom: 40,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoText: {
        fontSize: 42,
        fontWeight: '300',
        color: colors.primary,
        fontStyle: 'italic',
        letterSpacing: 2,
    },
    logoUnderline: {
        width: 60,
        height: 2,
        backgroundColor: colors.doodlePurple,
        marginTop: 4,
        borderRadius: 1,
        transform: [{ rotate: '-2deg' }],
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 15,
        color: colors.textSecondary,
        letterSpacing: 0.3,
    },
    formSection: {
        marginBottom: 24,
    },
    inputWrapper: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 8,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderBottomWidth: 1.5,
        borderBottomColor: colors.border,
        paddingHorizontal: 4,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: colors.text,
    },
    eyeButton: {
        padding: 8,
        marginLeft: 8,
    },
    forgotButton: {
        alignSelf: 'flex-end',
        marginBottom: 24,
        marginTop: -8,
    },
    forgotText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    primaryButton: {
        backgroundColor: colors.primary,
        borderRadius: 28,
        overflow: 'hidden',
        marginTop: 8,
        position: 'relative',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    secondaryButtonText: {
        color: colors.textSecondary,
        fontSize: 16,
        fontWeight: '600',
    },
    buttonInner: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonLines: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundColor: 'transparent', borderWidth: 0,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    toggleSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        gap: 6,
    },
    toggleText: {
        color: colors.textSecondary,
        fontSize: 15,
    },
    toggleLink: {
        color: colors.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
    },
    themeToggle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surfaceSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressBarContainer: {
        width: '100%',
        height: 6,
        backgroundColor: colors.surfaceSoft,
        borderRadius: 3,
        marginBottom: 30,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 3,
    },
});
