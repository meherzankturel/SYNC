import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { sendPushNotification } from '../utils/notifications';

export interface GameSession {
  id?: string;
  pairId: string;
  gameType: 'question' | 'trivia' | 'would-you-rather' | 'this-or-that';
  status: 'pending' | 'active' | 'completed';
  questions: GameQuestion[];
  currentQuestionIndex: number;
  player1Answers: { [questionId: string]: any };
  player2Answers: { [questionId: string]: any };
  player1Id?: string; // User ID of player 1
  player2Id?: string; // User ID of player 2
  // Ratings and feedback (1-5 stars, optional comments)
  player1Rating?: number; // 1-5
  player2Rating?: number; // 1-5
  player1Comment?: string;
  player2Comment?: string;
  createdAt: any;
  updatedAt: any;
}

export interface GameQuestion {
  id: string;
  question: string;
  type: 'text' | 'multiple-choice' | 'true-false';
  options?: string[];
  correctAnswer?: string | number; // For trivia: the correct option index or answer text
  category?: string;
}

export class GameService {
  /**
   * Fallback question bank for Question Game
   */
  private static getFallbackQuestions(count: number): GameQuestion[] {
    const questionTemplates = [
      { question: 'What is your favorite memory of us together?', category: 'Memories' },
      { question: 'What is something you\'ve always wanted to tell me but haven\'t?', category: 'Deep' },
      { question: 'What makes you feel most loved?', category: 'Love Languages' },
      { question: 'What is your dream for our future together?', category: 'Future' },
      { question: 'What is something you appreciate about me that I might not know?', category: 'Appreciation' },
      { question: 'What is your favorite way to spend time with me?', category: 'Activities' },
      { question: 'What is one thing you\'d like us to try together?', category: 'Adventure' },
      { question: 'What makes you feel safe and secure in our relationship?', category: 'Emotional' },
      { question: 'What is something you learned about yourself through our relationship?', category: 'Growth' },
      { question: 'What is your favorite thing about our communication?', category: 'Communication' },
      { question: 'What is a challenge we\'ve overcome together that made us stronger?', category: 'Challenges' },
      { question: 'What is something small I do that makes you happy?', category: 'Little Things' },
      { question: 'What is your ideal date night with me?', category: 'Dates' },
      { question: 'What is one way you\'d like to see our relationship grow?', category: 'Growth' },
      { question: 'What is something about me that surprised you when you first learned it?', category: 'Discovery' },
    ];

    // Shuffle and return requested count with unique IDs
    const shuffled = [...questionTemplates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, questionTemplates.length)).map((q, index) => ({
      id: `fallback_${Date.now()}_${index}`,
      question: q.question,
      type: 'text' as const,
      category: q.category,
    }));
  }

  /**
   * Fallback trivia questions bank - Couples/Relationship focused
   */
  private static getFallbackTriviaQuestions(count: number): GameQuestion[] {
    const triviaQuestions = [
      {
        question: 'What is your partner\'s biggest fear?',
        options: ['Heights', 'Being alone', 'Failure', 'Spiders'],
        correctAnswer: 1, // Note: In real couples trivia, correct answer would be partner's actual answer
        category: 'Know Your Partner',
      },
      {
        question: 'What is your partner\'s favorite way to relax?',
        options: ['Reading a book', 'Watching TV/Movies', 'Going for a walk', 'Listening to music'],
        correctAnswer: 2,
        category: 'Know Your Partner',
      },
      {
        question: 'What is your partner\'s dream vacation destination?',
        options: ['Tropical beach', 'Mountain adventure', 'European cities', 'Staycation at home'],
        correctAnswer: 0,
        category: 'Know Your Partner',
      },
      {
        question: 'What makes your partner feel most loved?',
        options: ['Words of affirmation', 'Quality time together', 'Physical touch', 'Acts of service'],
        correctAnswer: 1,
        category: 'Love Languages',
      },
      {
        question: 'What is your partner\'s favorite childhood memory?',
        options: ['Family vacations', 'School days', 'Playing with friends', 'Holiday celebrations'],
        correctAnswer: 0,
        category: 'Know Your Partner',
      },
      {
        question: 'What is your partner\'s biggest pet peeve?',
        options: ['Being late', 'Messy spaces', 'Loud noises', 'Interruptions'],
        correctAnswer: 1,
        category: 'Know Your Partner',
      },
      {
        question: 'What is your partner\'s favorite comfort food?',
        options: ['Ice cream', 'Pizza', 'Chocolate', 'Home-cooked meal'],
        correctAnswer: 2,
        category: 'Know Your Partner',
      },
      {
        question: 'What is your partner\'s ideal weekend?',
        options: ['Adventure and exploring', 'Relaxing at home', 'Socializing with friends', 'Trying new restaurants'],
        correctAnswer: 1,
        category: 'Know Your Partner',
      },
      {
        question: 'What is your partner\'s favorite way to show affection?',
        options: ['Hugs and cuddles', 'Surprise gifts', 'Doing chores', 'Words of encouragement'],
        correctAnswer: 0,
        category: 'Love Languages',
      },
      {
        question: 'What is your partner\'s biggest goal for this year?',
        options: ['Career advancement', 'Health and fitness', 'Travel more', 'Learn something new'],
        correctAnswer: 1,
        category: 'Know Your Partner',
      },
      {
        question: 'What is your partner\'s favorite season?',
        options: ['Spring', 'Summer', 'Fall/Autumn', 'Winter'],
        correctAnswer: 2,
        category: 'Know Your Partner',
      },
      {
        question: 'What is your partner\'s love language?',
        options: ['Words of Affirmation', 'Quality Time', 'Physical Touch', 'Acts of Service'],
        correctAnswer: 1,
        category: 'Love Languages',
      },
      {
        question: 'What is your partner\'s favorite way to spend a rainy day?',
        options: ['Cozy movie marathon', 'Cooking together', 'Reading', 'Playing games'],
        correctAnswer: 0,
        category: 'Know Your Partner',
      },
      {
        question: 'What is your partner\'s biggest strength?',
        options: ['Patience', 'Creativity', 'Kindness', 'Determination'],
        correctAnswer: 2,
        category: 'Know Your Partner',
      },
      {
        question: 'What is your partner\'s favorite memory of you two together?',
        options: ['First date', 'A special trip', 'A simple moment at home', 'Overcoming a challenge'],
        correctAnswer: 1,
        category: 'Our Relationship',
      },
    ];

    // Shuffle and return requested count
    const shuffled = [...triviaQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, triviaQuestions.length)).map((q, index) => ({
      id: `trivia_fallback_${Date.now()}_${index}`,
      question: q.question,
      type: 'multiple-choice' as const,
      options: q.options,
      correctAnswer: q.correctAnswer,
      category: q.category,
    }));
  }

  /**
   * Fallback "Would You Rather" questions bank - Couples/Relationship focused
   */
  private static getFallbackWouldYouRatherQuestions(count: number): GameQuestion[] {
    const wouldYouRatherQuestions = [
      {
        question: 'Would you rather have a quiet night in or go out for an adventure?',
        options: ['Quiet night in', 'Go out for adventure'],
        category: 'Lifestyle',
      },
      {
        question: 'Would you rather receive a surprise gift or plan something together?',
        options: ['Surprise gift', 'Plan together'],
        category: 'Love Languages',
      },
      {
        question: 'Would you rather spend all day talking or comfortable silence?',
        options: ['Talking all day', 'Comfortable silence'],
        category: 'Communication',
      },
      {
        question: 'Would you rather cook together at home or try a new restaurant?',
        options: ['Cook at home', 'New restaurant'],
        category: 'Dates',
      },
      {
        question: 'Would you rather take a spontaneous trip or plan everything in advance?',
        options: ['Spontaneous trip', 'Plan everything'],
        category: 'Travel',
      },
      {
        question: 'Would you rather celebrate small moments or save for big celebrations?',
        options: ['Small moments', 'Big celebrations'],
        category: 'Memories',
      },
      {
        question: 'Would you rather share everything or keep some things private?',
        options: ['Share everything', 'Keep some private'],
        category: 'Privacy',
      },
      {
        question: 'Would you rather have similar interests or learn from each other\'s differences?',
        options: ['Similar interests', 'Learn from differences'],
        category: 'Growth',
      },
      {
        question: 'Would you rather stay up late talking or wake up early together?',
        options: ['Stay up late', 'Wake up early'],
        category: 'Routine',
      },
      {
        question: 'Would you rather have frequent small gestures or occasional grand gestures?',
        options: ['Frequent small gestures', 'Occasional grand gestures'],
        category: 'Romance',
      },
      {
        question: 'Would you rather resolve conflicts immediately or take time to think?',
        options: ['Resolve immediately', 'Take time to think'],
        category: 'Conflict Resolution',
      },
      {
        question: 'Would you rather have matching routines or independent schedules?',
        options: ['Matching routines', 'Independent schedules'],
        category: 'Lifestyle',
      },
      {
        question: 'Would you rather celebrate achievements together or keep them personal?',
        options: ['Celebrate together', 'Keep personal'],
        category: 'Growth',
      },
      {
        question: 'Would you rather share passwords/accounts or keep them separate?',
        options: ['Share accounts', 'Keep separate'],
        category: 'Trust',
      },
      {
        question: 'Would you rather plan date nights together or surprise each other?',
        options: ['Plan together', 'Surprise each other'],
        category: 'Dates',
      },
    ];

    const shuffled = [...wouldYouRatherQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, wouldYouRatherQuestions.length)).map((q, index) => ({
      id: `would_you_rather_${Date.now()}_${index}`,
      question: q.question,
      type: 'multiple-choice' as const,
      options: q.options,
      category: q.category,
    }));
  }

  /**
   * Fallback "This or That" questions bank - Couples/Relationship focused
   */
  private static getFallbackThisOrThatQuestions(count: number): GameQuestion[] {
    const thisOrThatQuestions = [
      {
        question: 'Beach vacation or mountain getaway?',
        options: ['Beach vacation', 'Mountain getaway'],
        category: 'Travel',
      },
      {
        question: 'Netflix marathon or board games?',
        options: ['Netflix marathon', 'Board games'],
        category: 'Entertainment',
      },
      {
        question: 'Morning person or night owl?',
        options: ['Morning person', 'Night owl'],
        category: 'Routine',
      },
      {
        question: 'Sweet or savory?',
        options: ['Sweet', 'Savory'],
        category: 'Food',
      },
      {
        question: 'Text or call?',
        options: ['Text', 'Call'],
        category: 'Communication',
      },
      {
        question: 'Adventure or comfort zone?',
        options: ['Adventure', 'Comfort zone'],
        category: 'Lifestyle',
      },
      {
        question: 'City life or country living?',
        options: ['City life', 'Country living'],
        category: 'Lifestyle',
      },
      {
        question: 'Coffee or tea?',
        options: ['Coffee', 'Tea'],
        category: 'Food',
      },
      {
        question: 'Public displays of affection or keep it private?',
        options: ['Public PDA', 'Keep it private'],
        category: 'Romance',
      },
      {
        question: 'Spontaneous or planned?',
        options: ['Spontaneous', 'Planned'],
        category: 'Lifestyle',
      },
      {
        question: 'Summer or winter?',
        options: ['Summer', 'Winter'],
        category: 'Seasons',
      },
      {
        question: 'Dogs or cats?',
        options: ['Dogs', 'Cats'],
        category: 'Pets',
      },
      {
        question: 'Comedy or drama?',
        options: ['Comedy', 'Drama'],
        category: 'Entertainment',
      },
      {
        question: 'Quality time or gifts?',
        options: ['Quality time', 'Gifts'],
        category: 'Love Languages',
      },
      {
        question: 'Talk it out or give space?',
        options: ['Talk it out', 'Give space'],
        category: 'Conflict Resolution',
      },
      {
        question: 'Early riser or sleep in?',
        options: ['Early riser', 'Sleep in'],
        category: 'Routine',
      },
      {
        question: 'Homebody or social butterfly?',
        options: ['Homebody', 'Social butterfly'],
        category: 'Social',
      },
      {
        question: 'Fancy dinner or casual meal?',
        options: ['Fancy dinner', 'Casual meal'],
        category: 'Dates',
      },
      {
        question: 'Save money or spend on experiences?',
        options: ['Save money', 'Spend on experiences'],
        category: 'Finance',
      },
      {
        question: 'Workout together or separately?',
        options: ['Workout together', 'Separately'],
        category: 'Health',
      },
    ];

    const shuffled = [...thisOrThatQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, thisOrThatQuestions.length)).map((q, index) => ({
      id: `this_or_that_${Date.now()}_${index}`,
      question: q.question,
      type: 'multiple-choice' as const,
      options: q.options,
      category: q.category,
    }));
  }

  /**
   * Generate AI-powered questions via Cloud Function (with fallback)
   */
  static async generateQuestions(
    pairId: string,
    gameType: GameSession['gameType'],
    count: number = 5
  ): Promise<GameQuestion[]> {
    // For specific game types, use dedicated fallback questions
    if (gameType === 'trivia') {
      console.log('Using relationship-focused trivia questions');
      return GameService.getFallbackTriviaQuestions(count);
    }
    
    if (gameType === 'would-you-rather') {
      console.log('Using relationship-focused Would You Rather questions');
      return GameService.getFallbackWouldYouRatherQuestions(count);
    }
    
    if (gameType === 'this-or-that') {
      console.log('Using relationship-focused This or That questions');
      return GameService.getFallbackThisOrThatQuestions(count);
    }

    try {
      // Try AI generation first for other game types (like 'question')
      const generateQuestions = httpsCallable(functions, 'generateGameQuestions');
      const result = await generateQuestions({
        pairId,
        gameType,
        count,
      });
      
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        return result.data as GameQuestion[];
      }
      
      // Fallback to question bank if AI fails or returns empty
      console.log('Using fallback question bank');
      return GameService.getFallbackQuestions(count);
    } catch (error: any) {
      console.warn('AI question generation failed, using fallback:', error.message);
      // Use fallback questions if Cloud Function fails
      return GameService.getFallbackQuestions(count);
    }
  }
  
  /**
   * Create a new game session
   */
  static async createGameSession(
    pairId: string,
    gameType: GameSession['gameType'],
    questions: GameQuestion[],
    player1Id: string,
    player2Id: string
  ): Promise<string> {
    try {
      const gameSession: Omit<GameSession, 'id'> = {
        pairId,
        gameType,
        status: 'active',
        questions,
        currentQuestionIndex: 0,
        player1Answers: {},
        player2Answers: {},
        player1Id,
        player2Id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'games'), gameSession);
      return docRef.id;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create game session');
    }
  }
  
  /**
   * Submit answer to a question
   */
  static async submitAnswer(
    gameSessionId: string,
    userId: string,
    questionId: string,
    answer: any
  ): Promise<void> {
    try {
      const gameDoc = await getDoc(doc(db, 'games', gameSessionId));
      if (!gameDoc.exists()) {
        throw new Error('Game session not found');
      }
      
      const game = gameDoc.data() as GameSession;
      
      // Determine if user is player1 or player2
      const isPlayer1 = game.player1Id === userId;
      const isPlayer2 = game.player2Id === userId;
      
      if (!isPlayer1 && !isPlayer2) {
        throw new Error('You are not a player in this game');
      }
      
      const answersKey = isPlayer1 ? 'player1Answers' : 'player2Answers';
      const otherAnswersKey = isPlayer1 ? 'player2Answers' : 'player1Answers';
      
      // Update answers
      const currentAnswers = game[answersKey] || {};
      currentAnswers[questionId] = answer;
      
      // Find the current question index
      const currentQuestionIndex = game.questions.findIndex(q => q.id === questionId);
      
      // Check if both players have answered the current question
      const otherAnswers = game[otherAnswersKey] || {};
      const bothAnsweredCurrentQuestion = currentAnswers[questionId] && otherAnswers[questionId];
      
      // Check if both players have answered all questions
      const allQuestionsAnswered = game.questions.every((q) => {
        return currentAnswers[q.id] && otherAnswers[q.id];
      });
      
      // Update currentQuestionIndex if both players answered current question
      // and there's a next question
      let nextQuestionIndex = game.currentQuestionIndex;
      if (bothAnsweredCurrentQuestion && currentQuestionIndex >= 0) {
        // Move to next question if not the last one
        if (currentQuestionIndex < game.questions.length - 1) {
          nextQuestionIndex = currentQuestionIndex + 1;
        }
      }
      
      await updateDoc(doc(db, 'games', gameSessionId), {
        [answersKey]: currentAnswers,
        currentQuestionIndex: nextQuestionIndex,
        updatedAt: serverTimestamp(),
        ...(allQuestionsAnswered && { status: 'completed' }),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to submit answer');
    }
  }
  
  /**
   * Subscribe to real-time game session updates
   */
  static subscribeToGameSession(
    gameSessionId: string,
    callback: (game: GameSession | null) => void
  ): Unsubscribe {
    return onSnapshot(
      doc(db, 'games', gameSessionId),
      (snapshot) => {
        if (snapshot.exists()) {
          callback({
            id: snapshot.id,
            ...snapshot.data(),
          } as GameSession);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error subscribing to game session:', error);
        callback(null);
      }
    );
  }
  
  /**
   * Get game session
   */
  static async getGameSession(gameSessionId: string): Promise<GameSession | null> {
    try {
      const gameDoc = await getDoc(doc(db, 'games', gameSessionId));
      if (gameDoc.exists()) {
        return {
          id: gameDoc.id,
          ...gameDoc.data(),
        } as GameSession;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get game session');
    }
  }
  
  /**
   * Get active games for a pair
   */
  static async getActiveGames(pairId: string): Promise<GameSession[]> {
    try {
      const gamesRef = collection(db, 'games');
      
      // Try query with 'in' operator first (for active and pending)
      let q;
      try {
        q = query(
          gamesRef,
          where('pairId', '==', pairId),
          where('status', 'in', ['active', 'pending'])
        );
      } catch (error) {
        // Fallback to just 'active' if 'in' doesn't work
        q = query(
          gamesRef,
          where('pairId', '==', pairId),
          where('status', '==', 'active')
        );
      }
      
      const snapshot = await getDocs(q);
      const games = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as GameSession[];
      
      // Filter manually if 'in' operator didn't work
      return games.filter(g => g.status === 'active' || g.status === 'pending');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get active games');
    }
  }
  
  /**
   * Get active game of specific type for a pair
   */
  static async getActiveGameByType(pairId: string, gameType: GameSession['gameType']): Promise<GameSession | null> {
    try {
      const activeGames = await this.getActiveGames(pairId);
      return activeGames.find(g => g.gameType === gameType) || null;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get active game by type');
    }
  }
  
  /**
   * Complete a game session
   */
  static async completeGameSession(gameSessionId: string): Promise<void> {
    try {
      console.log('🔄 Completing game session in Firestore:', gameSessionId);
      await updateDoc(doc(db, 'games', gameSessionId), {
        status: 'completed',
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Game session status updated to "completed" in Firestore');
    } catch (error: any) {
      console.error('❌ Error completing game session:', error);
      throw new Error(error.message || 'Failed to complete game session');
    }
  }

  /**
   * Delete a game session
   */
  static async deleteGameSession(gameSessionId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting game session:', gameSessionId);
      await deleteDoc(doc(db, 'games', gameSessionId));
      console.log('✅ Game session deleted successfully');
    } catch (error: any) {
      console.error('❌ Error deleting game session:', error);
      throw new Error(error.message || 'Failed to delete game session');
    }
  }

  /**
   * Submit rating and comment for a completed game
   */
  static async submitGameRating(
    gameSessionId: string,
    userId: string,
    rating: number,
    comment?: string,
    userName?: string,
    partnerPushToken?: string
  ): Promise<void> {
    try {
      const game = await this.getGameSession(gameSessionId);
      if (!game) {
        throw new Error('Game session not found');
      }

      if (game.status !== 'completed') {
        throw new Error('Can only rate completed games');
      }

      const isPlayer1 = game.player1Id === userId;
      const ratingField = isPlayer1 ? 'player1Rating' : 'player2Rating';
      const commentField = isPlayer1 ? 'player1Comment' : 'player2Comment';
      const partnerId = isPlayer1 ? game.player2Id : game.player1Id;

      const updateData: any = {
        [ratingField]: rating,
        updatedAt: serverTimestamp(),
      };

      if (comment !== undefined) {
        updateData[commentField] = comment.trim() || null;
      }

      await updateDoc(doc(db, 'games', gameSessionId), updateData);
      console.log(`✅ Rating and comment submitted for ${isPlayer1 ? 'player1' : 'player2'}`);

      // Send notification to partner
      if (partnerId && partnerPushToken) {
        try {
          const senderName = userName || 'Your partner';
          const gameTypeName = game.gameType === 'question' ? 'Question Game' : game.gameType;
          const ratingText = `${rating}/5 ${'⭐'.repeat(rating)}`;
          const notificationBody = comment 
            ? `${senderName} rated your ${gameTypeName} ${ratingText} and left a comment`
            : `${senderName} rated your ${gameTypeName} ${ratingText}`;

          await sendPushNotification(
            partnerPushToken,
            '⭐ Game Review Received!',
            notificationBody,
            {
              type: 'gameRating',
              gameId: gameSessionId,
              pairId: game.pairId,
            }
          );
          console.log('✅ Push notification sent to partner about game rating');
        } catch (notifError: any) {
          console.warn('Failed to send push notification for game rating:', notifError);
          // Don't fail the whole operation if notification fails
        }
      } else if (partnerId && !partnerPushToken) {
        // Try to fetch partner's push token from user document
        try {
          const partnerUserDoc = await getDoc(doc(db, 'users', partnerId));
          if (partnerUserDoc.exists()) {
            const partnerData = partnerUserDoc.data();
            const partnerToken = partnerData.pushToken;

            if (partnerToken) {
              const senderName = userName || 'Your partner';
              const gameTypeName = game.gameType === 'question' ? 'Question Game' : game.gameType;
              const ratingText = `${rating}/5 ${'⭐'.repeat(rating)}`;
              const notificationBody = comment 
                ? `${senderName} rated your ${gameTypeName} ${ratingText} and left a comment`
                : `${senderName} rated your ${gameTypeName} ${ratingText}`;

              await sendPushNotification(
                partnerToken,
                '⭐ Game Review Received!',
                notificationBody,
                {
                  type: 'gameRating',
                  gameId: gameSessionId,
                  pairId: game.pairId,
                }
              );
              console.log('✅ Push notification sent to partner about game rating (fetched token)');
            }
          }
        } catch (fetchError: any) {
          console.warn('Failed to fetch partner push token or send notification:', fetchError);
          // Don't fail the whole operation if notification fails
        }
      }
    } catch (error: any) {
      console.error('❌ Error submitting game rating:', error);
      throw new Error(error.message || 'Failed to submit rating');
    }
  }
  
  /**
   * Get user's role in a game (player1 or player2)
   */
  static getUserRole(game: GameSession | null, userId: string): 'player1' | 'player2' | null {
    if (!game) return null;
    if (game.player1Id === userId) return 'player1';
    if (game.player2Id === userId) return 'player2';
    return null;
  }
  
  /**
   * Check if user has answered a specific question
   */
  static hasAnswered(game: GameSession, userId: string, questionId: string): boolean {
    const role = this.getUserRole(game, userId);
    if (!role) return false;
    const answers = role === 'player1' ? game.player1Answers : game.player2Answers;
    return !!answers[questionId];
  }
  
  /**
   * Get both players' answers for a question
   */
  static getQuestionAnswers(game: GameSession, questionId: string): {
    player1Answer?: any;
    player2Answer?: any;
  } {
    return {
      player1Answer: game.player1Answers[questionId],
      player2Answer: game.player2Answers[questionId],
    };
  }
}

