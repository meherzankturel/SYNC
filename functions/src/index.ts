import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// --- Types ---
interface InviteData {
    creatorId: string;
    createdAt: admin.firestore.Timestamp;
    status: 'pending' | 'accepted';
}

// --- Helpers ---
const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'LOVE-' + code; // Code format: LOVE-XXXX
};

export const onMoodCreated = functions.firestore
    .document("moods/{moodId}")
    .onCreate(async (snapshot, context) => {
        const mood = snapshot.data();
        const userId = mood.userId;

        // Get user profile to find partner
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data();

        if (!userData || !userData.partnerId) {
            console.log("No partner found for user notification");
            return;
        }

        const partnerId = userData.partnerId;

        // Send notification to partner (placeholder for now)
        console.log(`Sending notification to partner ${partnerId}: ${mood.emoji} ${mood.text}`);
    });

/**
 * Generates a unique invite code for the calling user.
 */
export const createInvite = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }
    const uid = context.auth.uid;
    const code = generateCode();

    // Save invite to database
    await db.collection("invites").doc(code).set({
        creatorId: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
    } as InviteData);

    return { code };
});

/**
 * Accepts an invite code and links the two users.
 */
export const acceptInvite = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }
    const uid = context.auth.uid; // The person accepting the invite
    const code = data.code;

    if (!code) {
        throw new functions.https.HttpsError("invalid-argument", "Invite code is required.");
    }

    const inviteRef = db.collection("invites").doc(code);

    await db.runTransaction(async (transaction) => {
        const inviteDoc = await transaction.get(inviteRef);

        if (!inviteDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Invalid invite code.");
        }

        const inviteData = inviteDoc.data() as InviteData;

        if (inviteData.status !== 'pending') {
            throw new functions.https.HttpsError("failed-precondition", "This invite has already been used.");
        }

        if (inviteData.creatorId === uid) {
            throw new functions.https.HttpsError("failed-precondition", "You cannot accept your own invite.");
        }

        const creatorId = inviteData.creatorId;

        // Link users
        const creatorRef = db.collection("users").doc(creatorId);
        const acceptorRef = db.collection("users").doc(uid);

        transaction.update(creatorRef, { partnerId: uid });
        transaction.update(acceptorRef, { partnerId: creatorId });

        // Mark invite as accepted
        transaction.update(inviteRef, {
            status: 'accepted',
            acceptedBy: uid,
            acceptedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });

    return { success: true };
});

/**
 * Generate AI-powered game questions for couples
 */
export const generateGameQuestions = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    const { pairId, gameType, count = 5 } = data;

    if (!pairId || !gameType) {
        throw new functions.https.HttpsError("invalid-argument", "pairId and gameType are required.");
    }

    try {
        // For Question Game, generate personalized questions
        if (gameType === 'question') {
            // TODO: Integrate with OpenAI/Gemini API for AI-generated questions
            // For now, return a curated question set that can be personalized
            
            const questionTemplates = [
                {
                    id: `q_${Date.now()}_1`,
                    question: "What is your favorite memory of us together?",
                    type: "text",
                    category: "Memories"
                },
                {
                    id: `q_${Date.now()}_2`,
                    question: "What makes you feel most loved in our relationship?",
                    type: "text",
                    category: "Love Languages"
                },
                {
                    id: `q_${Date.now()}_3`,
                    question: "What is something you've always wanted to tell me but haven't?",
                    type: "text",
                    category: "Deep Connection"
                },
                {
                    id: `q_${Date.now()}_4`,
                    question: "What is your dream for our future together?",
                    type: "text",
                    category: "Future"
                },
                {
                    id: `q_${Date.now()}_5`,
                    question: "What is something you appreciate about me that I might not know?",
                    type: "text",
                    category: "Appreciation"
                },
                {
                    id: `q_${Date.now()}_6`,
                    question: "What is your favorite way we communicate?",
                    type: "text",
                    category: "Communication"
                },
                {
                    id: `q_${Date.now()}_7`,
                    question: "What is one thing you'd like us to try together?",
                    type: "text",
                    category: "Adventure"
                },
                {
                    id: `q_${Date.now()}_8`,
                    question: "What makes you feel safe and secure with me?",
                    type: "text",
                    category: "Security"
                },
                {
                    id: `q_${Date.now()}_9`,
                    question: "What is a challenge we've overcome that made us stronger?",
                    type: "text",
                    category: "Growth"
                },
                {
                    id: `q_${Date.now()}_10`,
                    question: "What is something small I do that makes you smile?",
                    type: "text",
                    category: "Little Things"
                }
            ];

            // Shuffle and return requested count
            const shuffled = questionTemplates.sort(() => Math.random() - 0.5);
            return shuffled.slice(0, Math.min(count, questionTemplates.length));
        }

        // Add other game types here
        return [];
    } catch (error: any) {
        console.error("Error generating questions:", error);
        throw new functions.https.HttpsError(
            "internal",
            "Failed to generate questions: " + error.message
        );
    }
});
