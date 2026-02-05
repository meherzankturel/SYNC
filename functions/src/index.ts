import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// --- Types ---
interface InviteData {
  creatorId: string;
  createdAt: admin.firestore.Timestamp;
  status: "pending" | "accepted";
}

// --- Helpers ---
const generateCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return "LOVE-" + code;
};

export const onMoodCreated = onDocumentCreated(
  "moods/{moodId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const mood = snapshot.data();
    const userId = mood.userId;

    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (!userData || !userData.partnerId) {
      console.log("No partner found for user notification");
      return;
    }

    const partnerId = userData.partnerId;
    console.log(
      `Notification to partner ${partnerId}: ` +
      `${mood.emoji} ${mood.text}`,
    );
  },
);

/**
 * Generates a unique invite code for the calling user.
 */
export const createInvite = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "User must be logged in.",
    );
  }
  const uid = request.auth.uid;
  const code = generateCode();

  await db.collection("invites").doc(code).set({
    creatorId: uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: "pending",
  } as InviteData);

  return {code};
});

/**
 * Accepts an invite code and links the two users.
 */
export const acceptInvite = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "User must be logged in.",
    );
  }
  const uid = request.auth.uid;
  const code = request.data.code;

  if (!code) {
    throw new HttpsError(
      "invalid-argument",
      "Invite code is required.",
    );
  }

  const inviteRef = db.collection("invites").doc(code);

  const result = await db.runTransaction(async (transaction) => {
    const inviteDoc = await transaction.get(inviteRef);

    if (!inviteDoc.exists) {
      throw new HttpsError(
        "not-found",
        "Invalid invite code.",
      );
    }

    const inviteData = inviteDoc.data() as InviteData;

    if (inviteData.status !== "pending") {
      throw new HttpsError(
        "failed-precondition",
        "This invite has already been used.",
      );
    }

    if (inviteData.creatorId === uid) {
      throw new HttpsError(
        "failed-precondition",
        "You cannot accept your own invite.",
      );
    }

    const creatorId = inviteData.creatorId;

    const creatorRef = db.collection("users").doc(creatorId);
    const acceptorRef = db.collection("users").doc(uid);
    const creatorDoc = await transaction.get(creatorRef);
    const acceptorDoc = await transaction.get(acceptorRef);

    const creatorData = creatorDoc.data();
    const acceptorData = acceptorDoc.data();

    if (acceptorData?.pairId || acceptorData?.partnerId) {
      if (acceptorData.partnerId === creatorId) {
        throw new HttpsError(
          "already-exists",
          "You are already paired with this partner.",
        );
      }
      throw new HttpsError(
        "failed-precondition",
        "You are already connected with another partner.",
      );
    }

    if (creatorData?.pairId || creatorData?.partnerId) {
      if (creatorData.partnerId === uid) {
        throw new HttpsError(
          "already-exists",
          "You are already paired with this partner.",
        );
      }
      throw new HttpsError(
        "failed-precondition",
        "The invite creator is already connected " +
        "with another partner.",
      );
    }

    const pairId = `pair_${Date.now()}_` +
      `${Math.random().toString(36).substr(2, 9)}`;
    const pairRef = db.collection("pairs").doc(pairId);

    transaction.set(pairRef, {
      pairId: pairId,
      user1Id: creatorId,
      user2Id: uid,
      user1Email: creatorData?.email || "",
      user2Email: acceptorData?.email || "",
      status: "active",
      createdAt:
        admin.firestore.FieldValue.serverTimestamp(),
      updatedAt:
        admin.firestore.FieldValue.serverTimestamp(),
    });

    transaction.update(creatorRef, {
      partnerId: uid,
      pairId: pairId,
      updatedAt:
        admin.firestore.FieldValue.serverTimestamp(),
    });
    transaction.update(acceptorRef, {
      partnerId: creatorId,
      pairId: pairId,
      updatedAt:
        admin.firestore.FieldValue.serverTimestamp(),
    });

    transaction.update(inviteRef, {
      status: "accepted",
      acceptedBy: uid,
      acceptedAt:
        admin.firestore.FieldValue.serverTimestamp(),
    });

    return {pairId};
  });

  return {success: true, pairId: result.pairId};
});

/**
 * Generate AI-powered game questions for couples
 */
export const generateGameQuestions = onCall(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "User must be logged in.",
      );
    }

    const {pairId, gameType, count = 5} = request.data;

    if (!pairId || !gameType) {
      throw new HttpsError(
        "invalid-argument",
        "pairId and gameType are required.",
      );
    }

    try {
      if (gameType === "question") {
        const questionTemplates = [
          {
            id: `q_${Date.now()}_1`,
            question:
              "What is your favorite memory " +
              "of us together?",
            type: "text",
            category: "Memories",
          },
          {
            id: `q_${Date.now()}_2`,
            question:
              "What makes you feel most loved " +
              "in our relationship?",
            type: "text",
            category: "Love Languages",
          },
          {
            id: `q_${Date.now()}_3`,
            question:
              "What is something you've always " +
              "wanted to tell me but haven't?",
            type: "text",
            category: "Deep Connection",
          },
          {
            id: `q_${Date.now()}_4`,
            question:
              "What is your dream for our " +
              "future together?",
            type: "text",
            category: "Future",
          },
          {
            id: `q_${Date.now()}_5`,
            question:
              "What is something you appreciate " +
              "about me that I might not know?",
            type: "text",
            category: "Appreciation",
          },
          {
            id: `q_${Date.now()}_6`,
            question:
              "What is your favorite way " +
              "we communicate?",
            type: "text",
            category: "Communication",
          },
          {
            id: `q_${Date.now()}_7`,
            question:
              "What is one thing you'd like " +
              "us to try together?",
            type: "text",
            category: "Adventure",
          },
          {
            id: `q_${Date.now()}_8`,
            question:
              "What makes you feel safe " +
              "and secure with me?",
            type: "text",
            category: "Security",
          },
          {
            id: `q_${Date.now()}_9`,
            question:
              "What is a challenge we've overcome " +
              "that made us stronger?",
            type: "text",
            category: "Growth",
          },
          {
            id: `q_${Date.now()}_10`,
            question:
              "What is something small I do " +
              "that makes you smile?",
            type: "text",
            category: "Little Things",
          },
        ];

        const shuffled = questionTemplates
          .sort(() => Math.random() - 0.5);
        return shuffled.slice(
          0,
          Math.min(count, questionTemplates.length),
        );
      }

      return [];
    } catch (error: unknown) {
      const message = error instanceof Error ?
        error.message : "Unknown error";
      console.error("Error generating questions:", error);
      throw new HttpsError(
        "internal",
        "Failed to generate questions: " + message,
      );
    }
  },
);
