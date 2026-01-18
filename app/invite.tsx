import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
    SafeAreaView
} from 'react-native';
import { db } from '../src/config/firebase';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { useAuth } from '../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { PairService } from '../src/services/pair.service';

export default function InviteScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [inviteCode, setInviteCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCopyCode = async () => {
        if (generatedCode) {
            await Clipboard.setStringAsync(generatedCode);
            Alert.alert('Copied!', 'Invite code copied to clipboard.');
        }
    };

    const handleGenerateCode = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Check if user already has a partner
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();
            
            if (userData?.pairId || userData?.partnerId) {
                Alert.alert(
                    'Already Paired',
                    'You are already connected with a partner. Please disconnect your current partner before creating a new invite.',
                    [{ text: 'OK' }]
                );
                setLoading(false);
                return;
            }

            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let code = 'LOVE-';
            for (let i = 0; i < 4; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            await setDoc(doc(db, 'invites', code), {
                creatorId: user.uid,
                createdAt: serverTimestamp(),
                status: 'pending'
            });
            setGeneratedCode(code);
        } catch (err: any) {
            console.error('Generate code error:', err);
            Alert.alert('Error', err.message || 'Could not generate code');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!user || !inviteCode) return;
        setLoading(true);
        try {
            const code = inviteCode.toUpperCase().trim();
            const inviteRef = doc(db, 'invites', code);
            const inviteSnap = await getDoc(inviteRef);

            if (!inviteSnap.exists()) {
                Alert.alert('Invalid Code', 'This invite code does not exist.');
                setLoading(false);
                return;
            }

            const inviteData = inviteSnap.data();
            if (inviteData.status !== 'pending') {
                Alert.alert('Code Expired', 'This code has already been used.');
                setLoading(false);
                return;
            }

            if (inviteData.creatorId === user.uid) {
                Alert.alert('Wait!', 'You cannot use your own invite code.');
                setLoading(false);
                return;
            }

            // Check if current user already has a partner
            const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
            const currentUserData = currentUserDoc.data();
            
            if (currentUserData?.pairId || currentUserData?.partnerId) {
                // Check if they're already paired with the creator
                if (currentUserData.partnerId === inviteData.creatorId) {
                    Alert.alert(
                        'Already Connected',
                        'You are already paired with this partner!',
                        [{ text: 'OK' }]
                    );
                } else {
                    Alert.alert(
                        'Already Paired',
                        'You are already connected with another partner. Please disconnect your current partner before joining a new one.',
                        [{ text: 'OK' }]
                    );
                }
                setLoading(false);
                return;
            }

            // Get creator's user data
            const creatorDoc = await getDoc(doc(db, 'users', inviteData.creatorId));
            const creatorData = creatorDoc.data();
            
            // Check if creator already has a partner
            if (creatorData?.pairId || creatorData?.partnerId) {
                // Check if creator is already paired with current user
                if (creatorData.partnerId === user.uid) {
                    Alert.alert(
                        'Already Connected',
                        'You are already paired with this partner!',
                        [{ text: 'OK' }]
                    );
                } else {
                    Alert.alert(
                        'Partner Already Connected',
                        'The person who created this invite code is already connected with another partner.',
                        [{ text: 'OK' }]
                    );
                }
                setLoading(false);
                return;
            }
            
            // Generate a pairId for this connection
            const pairId = `pair_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const batch = writeBatch(db);

            // Create or update the pair document
            const pairRef = doc(db, 'pairs', pairId);
            batch.set(pairRef, {
                pairId: pairId,
                user1Id: inviteData.creatorId,
                user2Id: user.uid,
                user1Email: creatorData?.email || '',
                user2Email: user.email || '',
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // Update both users with partnerId and pairId
            batch.set(doc(db, 'users', user.uid), {
                partnerId: inviteData.creatorId,
                email: user.email,
                pairId: pairId,
                updatedAt: serverTimestamp()
            }, { merge: true });

            batch.set(doc(db, 'users', inviteData.creatorId), {
                partnerId: user.uid,
                pairId: pairId,
                updatedAt: serverTimestamp()
            }, { merge: true });

            batch.update(inviteRef, {
                status: 'accepted',
                acceptedBy: user.uid,
                acceptedAt: serverTimestamp()
            });

            await batch.commit();
            Alert.alert('Success!', 'Accounts linked! Welcome home.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') }
            ]);
        } catch (err: any) {
            console.error('Join error:', err);
            Alert.alert('Error', err.message || 'Something went wrong while joining.');
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
                <Text style={styles.headerTitle}>Connect Partner</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.inner}>
                            <Ionicons name="heart-outline" size={80} color="#FF6B6B" style={styles.icon} />
                            <Text style={styles.title}>Partner Up</Text>
                            <Text style={styles.subtitle}>Send a code to your partner or enter the one you received.</Text>

                            {/* Generate Section */}
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Send an invite</Text>
                                {generatedCode ? (
                                    <View style={styles.codeDisplayContainer}>
                                        <Text style={styles.generatedCode}>{generatedCode}</Text>
                                        <TouchableOpacity onPress={handleCopyCode} style={styles.copyIcon}>
                                            <Ionicons name="copy-outline" size={24} color="#FF6B6B" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.generateButton}
                                        onPress={handleGenerateCode}
                                        disabled={loading}
                                    >
                                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate Code</Text>}
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.divider}>
                                <View style={styles.line} />
                                <Text style={styles.or}>OR</Text>
                                <View style={styles.line} />
                            </View>

                            {/* Join Section */}
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Enter a code</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="LOVE-XXXX"
                                    value={inviteCode}
                                    onChangeText={setInviteCode}
                                    autoCapitalize="characters"
                                />
                                <TouchableOpacity
                                    style={[styles.joinButton, !inviteCode && styles.disabledButton]}
                                    onPress={handleJoin}
                                    disabled={loading || !inviteCode}
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Join Partner</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    backButton: {
        padding: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    scrollContent: {
        flexGrow: 1,
    },
    inner: {
        padding: 30,
        alignItems: 'center',
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 22,
    },
    section: {
        width: '100%',
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    generateButton: {
        backgroundColor: '#FF6B6B',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    codeDisplayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#eee',
        justifyContent: 'center',
    },
    generatedCode: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        letterSpacing: 2,
    },
    copyIcon: {
        marginLeft: 15,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: 30,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#eee',
    },
    or: {
        marginHorizontal: 15,
        color: '#999',
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 15,
        fontSize: 18,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 15,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    joinButton: {
        backgroundColor: '#333',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
