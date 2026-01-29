import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { theme } from '../src/config/theme';
import { AuthService } from '../src/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { ResponsiveUtils } from '../src/utils/responsive'; // Ensure responsive utils are used

export default function SignUpScreen() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [faceTimeEmail, setFaceTimeEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const TOTAL_STEPS = 5;

  // Validation Helpers
  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    return /^\d{10,15}$/.test(cleaned);
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Step Navigators
  const nextStep = () => {
    setError('');

    // Validation Logic
    switch (step) {
      case 1: // Name
        if (!name.trim()) return setError('Name is required');
        break;

      case 2: // Email
        if (!email.trim()) return setError('Email is required');
        if (!validateEmail(email)) return setError('Invalid email format');
        break;

      case 3: // Password
        if (!password) return setError('Password is required');
        if (password.length < 6) return setError('Password must be at least 6 characters');
        if (password !== confirmPassword) return setError('Passwords do not match');
        break;

      case 4: // Phone
        if (!phoneNumber) return setError('Phone number is required');
        if (!validatePhoneNumber(phoneNumber)) return setError('Invalid phone number');
        break;

      case 5: // FaceTime (Final Step)
        handleSignUp();
        return; // handleSignUp handles the rest
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleSignUp = async () => {
    if (!faceTimeEmail) return setError('FaceTime email is required');
    if (!validateEmail(faceTimeEmail)) return setError('Invalid FaceTime email format');

    setLoading(true);
    try {
      await AuthService.signUp(
        email,
        password,
        name.trim(),
        phoneNumber.trim(),
        faceTimeEmail.trim()
      );
      Alert.alert(
        'Success',
        'Account created! Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => router.push('/login') }]
      );
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      Alert.alert('Error', err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Render Step Content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepSubtitle}>This is how your partner will see you.</Text>
            <Input
              label=""
              placeholder="First Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              autoFocus={true}
              containerStyle={styles.inputContainer}
            />
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>What's your email?</Text>
            <Text style={styles.stepSubtitle}>We'll use this to verify your account.</Text>
            <Input
              label=""
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus={true}
              containerStyle={styles.inputContainer}
            />
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>Create a password</Text>
            <Text style={styles.stepSubtitle}>Make it secure (min 6 characters).</Text>
            <Input
              label="Password"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoFocus={true}
              containerStyle={styles.inputContainer}
            />
            <Input
              label="Confirm Password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              containerStyle={styles.inputContainer}
            />
          </>
        );
      case 4:
        return (
          <>
            <Text style={styles.stepTitle}>What's your number?</Text>
            <Text style={styles.stepSubtitle}>Used for emergency SOS calls.</Text>
            <Input
              label=""
              placeholder="+1 555 123 4567"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoComplete="tel"
              autoFocus={true}
              containerStyle={styles.inputContainer}
            />
          </>
        );
      case 5:
        return (
          <>
            <Text style={styles.stepTitle}>FaceTime Email</Text>
            <Text style={styles.stepSubtitle}>For video emergency calls.</Text>
            <Input
              label=""
              placeholder="facetime@apple.com"
              value={faceTimeEmail}
              onChangeText={setFaceTimeEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus={true}
              containerStyle={styles.inputContainer}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />

      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prevStep} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(step / TOTAL_STEPS) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.stepCounter}>Step {step} of {TOTAL_STEPS}</Text>
        </View>

        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {renderStepContent()}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            title={step === TOTAL_STEPS ? (loading ? "Creating Account..." : "Create Account") : "Next"}
            onPress={nextStep}
            loading={loading}
            style={styles.mainButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerRightSpacer: {
    width: 40,
  },
  progressContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  stepCounter: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing['2xl'],
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  stepTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    lineHeight: 40,
  },
  stepSubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  mainButton: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full, // Pill shape for modern feel
    height: 56,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
});

