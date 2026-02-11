import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { Ionicons } from '@expo/vector-icons';
import { Input } from './Input';
import { Button } from './Button';
import { GameService, GameSession, GameQuestion } from '../services/game.service';
import * as Haptics from 'expo-haptics';

interface QuestionGameProps {
  visible: boolean;
  gameSession: GameSession | null;
  currentUserId: string;
  partnerName?: string;
  userName?: string;
  onClose: () => void;
  onGameComplete: () => void;
}

export default function QuestionGame({
  visible,
  gameSession,
  currentUserId,
  partnerName = 'Partner',
  userName = 'You',
  onClose,
  onGameComplete,
}: QuestionGameProps) {
  const [currentGame, setCurrentGame] = useState<GameSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [revealMode, setRevealMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState<number>(0);
  const [userComment, setUserComment] = useState<string>('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Animate modal entrance
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  // Initialize game when modal opens or gameSession changes
  useEffect(() => {
    if (!visible) {
      setCurrentGame(null);
      setCurrentQuestionIndex(0);
      setAnswer('');
      setRevealMode(false);
      setLoading(false);
      setUserRating(0);
      setUserComment('');
      return;
    }

    if (!gameSession) {
      setLoading(true);
      setCurrentGame(null);
      return;
    }

    // If game has no questions, set it and let real-time subscription handle loading questions
    if (!gameSession.questions || gameSession.questions.length === 0) {
      console.log('⚠️ Game session has no questions initially, waiting for real-time sync');
      setCurrentGame(gameSession);
      setLoading(true); // Keep loading to wait for questions via real-time sync
      return;
    }

    setCurrentGame(gameSession);
    setAnswer('');
    setLoading(false);

    // Initialize rating and comment from game session
    const userRole = GameService.getUserRole(gameSession, currentUserId);
    if (userRole === 'player1') {
      setUserRating(gameSession.player1Rating || 0);
      setUserComment(gameSession.player1Comment || '');
    } else if (userRole === 'player2') {
      setUserRating(gameSession.player2Rating || 0);
      setUserComment(gameSession.player2Comment || '');
    }

    // Check if game is already completed or all questions answered
    const allAnswered = gameSession.questions.every((q) => {
      const answers = GameService.getQuestionAnswers(gameSession, q.id);
      return answers.player1Answer && answers.player2Answer;
    });

    // If game is completed or all questions answered, show in reveal mode
    if (allAnswered || gameSession.status === 'completed') {
      setRevealMode(true);
      // Start from first question for review (always start at 0 for completed games)
      setCurrentQuestionIndex(0);
    } else {
      setRevealMode(false);
      // For active games, use the current question index from the game session
      setCurrentQuestionIndex(Math.max(0, gameSession.currentQuestionIndex || 0));
    }
  }, [gameSession?.id, visible]);

  // Subscribe to real-time game updates
  useEffect(() => {
    if (!visible || !currentGame?.id) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    console.log('🔵 Subscribing to game session for real-time updates:', currentGame.id);

    const unsub = GameService.subscribeToGameSession(currentGame.id, (game) => {
      if (game) {
        console.log('📥 Real-time game update received:', {
          id: game.id,
          questionsCount: game.questions?.length || 0,
          currentIndex: game.currentQuestionIndex,
          status: game.status,
        });

        // Always update the game state - this ensures questions are synced
        setCurrentGame(game);
        
        // Clear loading state if we now have questions
        if (game.questions && game.questions.length > 0) {
          setLoading(false);
        }

        // Sync user's rating and comment from game state
        const userRole = GameService.getUserRole(game, currentUserId);
        if (userRole === 'player1') {
          if (game.player1Rating !== undefined) setUserRating(game.player1Rating);
          if (game.player1Comment !== undefined) setUserComment(game.player1Comment || '');
        } else if (userRole === 'player2') {
          if (game.player2Rating !== undefined) setUserRating(game.player2Rating);
          if (game.player2Comment !== undefined) setUserComment(game.player2Comment || '');
        }

        // Check if all questions answered or game is completed - auto-enter reveal mode
        if (game.questions && game.questions.length > 0) {
          const allAnswered = game.questions.every((q) => {
            const answers = GameService.getQuestionAnswers(game, q.id);
            return answers.player1Answer && answers.player2Answer;
          });

          const isCompleted = game.status === 'completed' || allAnswered;

          if (isCompleted && !revealMode) {
            setRevealMode(true);
            setCurrentQuestionIndex(0); // Always start from first question for completed games
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else if (!isCompleted) {
            // Only sync currentQuestionIndex for active games
            if (typeof game.currentQuestionIndex === 'number') {
              setCurrentQuestionIndex(game.currentQuestionIndex);
            }
          }
        }
      } else {
        console.warn('⚠️ Game session not found in real-time update');
      }
    });

    unsubscribeRef.current = unsub;

    return () => {
      if (unsubscribeRef.current) {
        console.log('🔴 Unsubscribing from game session');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [visible, currentGame?.id, revealMode]);

  // Ensure currentQuestionIndex is valid
  useEffect(() => {
    if (currentGame && currentGame.questions && currentGame.questions.length > 0) {
      if (currentQuestionIndex >= currentGame.questions.length) {
        setCurrentQuestionIndex(currentGame.questions.length - 1);
      } else if (currentQuestionIndex < 0) {
        setCurrentQuestionIndex(0);
      }
    }
  }, [currentGame?.questions?.length, currentQuestionIndex]);

  const handleSubmitAnswer = async (questionId: string) => {
    if (!answer.trim() || !currentGame?.id || !questionId) return;

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await GameService.submitAnswer(currentGame.id, currentUserId, questionId, answer.trim());
      setAnswer('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (!currentGame?.questions) return;
    if (currentQuestionIndex < currentGame.questions.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setAnswer('');
    } else {
      handleCompleteGame();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setAnswer('');
    }
  };

  const handleSubmitRating = async () => {
    if (!currentGame?.id || userRating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    setSubmittingRating(true);
    try {
      await GameService.submitGameRating(
        currentGame.id, 
        currentUserId, 
        userRating, 
        userComment,
        userName
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Your rating and feedback have been saved!');
    } catch (error: any) {
      console.error('❌ Error submitting rating:', error);
      Alert.alert('Error', error.message || 'Failed to submit rating. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const renderRatingSection = (userRole: 'player1' | 'player2' | null) => {
    if (!currentGame || !userRole) return null;

    const isPlayer1 = userRole === 'player1';
    const userRatingValue = isPlayer1 ? currentGame.player1Rating : currentGame.player2Rating;
    const userCommentValue = isPlayer1 ? currentGame.player1Comment : currentGame.player2Comment;
    const partnerRatingValue = isPlayer1 ? currentGame.player2Rating : currentGame.player1Rating;
    const partnerCommentValue = isPlayer1 ? currentGame.player2Comment : currentGame.player1Comment;
    const hasUserRated = userRatingValue !== undefined && userRatingValue > 0;
    const hasPartnerRated = partnerRatingValue !== undefined && partnerRatingValue > 0;

    return (
      <View style={styles.ratingSection}>
        <View style={styles.ratingHeader}>
          <Ionicons name="star" size={24} color={theme.colors.accent} />
          <Text style={styles.ratingTitle}>Rate This Game</Text>
        </View>

        {/* User's Rating Input */}
        <View style={styles.ratingInputSection}>
          <Text style={styles.ratingLabel}>Your Rating</Text>
          <View style={styles.starRating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => {
                  if (!hasUserRated) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setUserRating(star);
                  }
                }}
                disabled={hasUserRated}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={star <= userRating ? 'star' : 'star-outline'}
                  size={32}
                  color={star <= userRating ? theme.colors.accent : theme.colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>
          {hasUserRated && (
            <Text style={styles.ratingSavedText}>You rated this {userRatingValue}/5</Text>
          )}

          <Input
            label="Your Comment (Optional)"
            value={userComment}
            onChangeText={setUserComment}
            placeholder="Share your thoughts about this game..."
            multiline
            numberOfLines={4}
            editable={!hasUserRated}
            style={[
              styles.commentInput,
              hasUserRated && styles.commentInputDisabled
            ]}
            textAlignVertical="top"
          />

          {!hasUserRated && (
            <Button
              title="Submit Rating"
              onPress={handleSubmitRating}
              variant="primary"
              loading={submittingRating}
              disabled={userRating === 0 || submittingRating}
              style={styles.submitRatingButton}
            />
          )}
        </View>

        {/* Partner's Rating Display */}
        {hasPartnerRated && (
          <View style={styles.partnerRatingSection}>
            <Text style={styles.partnerRatingLabel}>{partnerName}'s Rating</Text>
            <View style={styles.starRating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= partnerRatingValue! ? 'star' : 'star-outline'}
                  size={28}
                  color={star <= partnerRatingValue! ? theme.colors.secondary : theme.colors.border}
                />
              ))}
            </View>
            {partnerCommentValue && (
              <View style={styles.partnerCommentCard}>
                <Text style={styles.partnerCommentText}>{partnerCommentValue}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const handleCompleteGame = async () => {
    if (currentGame?.id) {
      try {
        console.log('🎉 Completing game session:', currentGame.id);
        await GameService.completeGameSession(currentGame.id);
        console.log('✅ Game session completed successfully');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Close immediately - the real-time listener will update the games list
        onGameComplete();
        onClose();
      } catch (error: any) {
        console.error('❌ Error completing game:', error);
        Alert.alert('Error', error.message || 'Failed to complete game');
      }
    }
  };

  const renderAnswerInput = (currentQuestion: GameQuestion, hasAnswered: boolean, allQuestionsAnswered: boolean) => {
    if (hasAnswered) {
      return (
        <View style={styles.answeredContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
          </View>
          <Text style={styles.answeredText}>Answer Submitted! ✨</Text>
          <Text style={styles.waitingText}>
            {allQuestionsAnswered
              ? 'Both players answered! Tap "Reveal Answers" to see each other\'s responses.'
              : 'Waiting for your partner to answer...'}
          </Text>
          {allQuestionsAnswered && (
            <Button
              title="Reveal Answers"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setRevealMode(true);
              }}
              variant="primary"
              style={styles.revealButton}
            />
          )}
          {!allQuestionsAnswered && (
            <View style={styles.waitingIndicator}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={styles.answerInputContainer}>
        <Text style={styles.answerLabel}>Your Answer</Text>
        <View style={styles.inputWrapper}>
          <Input
            label=""
            value={answer}
            onChangeText={setAnswer}
            placeholder="Share your thoughts..."
            multiline
            numberOfLines={6}
            style={styles.answerInput}
            textAlignVertical="top"
          />
        </View>
        <Button
          title="Submit Answer"
          onPress={() => handleSubmitAnswer(currentQuestion.id)}
          variant="primary"
          loading={submitting}
          disabled={!answer.trim() || submitting}
          style={styles.submitButton}
        />
        <Text style={styles.submitHint}>
          Your partner will see your answer once they submit theirs
        </Text>
      </View>
    );
  };

  const renderRevealView = (
    currentQuestion: GameQuestion,
    questionAnswers: any,
    userRole: 'player1' | 'player2' | null
  ) => {
    const player1Answer = questionAnswers.player1Answer;
    const player2Answer = questionAnswers.player2Answer;
    const isPlayer1 = userRole === 'player1';

    return (
      <View style={styles.revealSection}>
        <View style={styles.revealHeader}>
          <Ionicons name="eye" size={24} color={theme.colors.primary} />
          <Text style={styles.revealTitle}>Both Answers</Text>
        </View>

        <View style={styles.answerCard}>
          <View style={styles.answerCardHeader}>
            <View style={styles.playerAvatar}>
              <Ionicons name="person" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.playerName}>
              {isPlayer1 ? userName : partnerName}
            </Text>
          </View>
          <Text style={styles.revealedAnswer}>
            {isPlayer1 ? player1Answer : player2Answer || 'No answer yet'}
          </Text>
        </View>

        <View style={[styles.answerCard, styles.partnerAnswerCard]}>
          <View style={styles.answerCardHeader}>
            <View style={[styles.playerAvatar, styles.partnerAvatar]}>
              <Ionicons name="person" size={20} color={theme.colors.secondary} />
            </View>
            <Text style={[styles.playerName, styles.partnerName]}>
              {isPlayer1 ? partnerName : userName}
            </Text>
          </View>
          <Text style={styles.revealedAnswer}>
            {isPlayer1 ? player2Answer : player1Answer || 'No answer yet'}
          </Text>
        </View>

        <View style={styles.navigationButtons}>
          {currentQuestionIndex > 0 && (
            <Button
              title="Previous"
              onPress={handlePreviousQuestion}
              variant="outline"
              style={{ flex: 1, marginRight: theme.spacing.sm }}
            />
          )}
          {currentGame && currentGame.questions && currentQuestionIndex < currentGame.questions.length - 1 ? (
            <Button
              title="Next Question"
              onPress={handleNextQuestion}
              variant="primary"
              style={{ flex: 1 }}
            />
          ) : currentGame?.status !== 'completed' ? (
            <Button
              title="Complete Game"
              onPress={handleCompleteGame}
              variant="primary"
              style={{ flex: 1 }}
            />
          ) : null}
        </View>

        {/* Rating and Comments Section for Completed Games - Show on Last Question */}
        {currentGame?.status === 'completed' && 
         currentGame.questions && 
         currentQuestionIndex === currentGame.questions.length - 1 &&
         renderRatingSection(userRole)}
      </View>
    );
  };

  const renderContent = () => {
    // Show loading if explicitly loading OR if game exists but has no questions (waiting for sync)
    if (loading || !currentGame || !currentGame.questions || currentGame.questions.length === 0) {
      // If we have a game but no questions, it might be syncing - show loading
      if (currentGame && (!currentGame.questions || currentGame.questions.length === 0)) {
        // Wait a bit longer for real-time sync before showing error
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading questions...</Text>
            <Text style={styles.loadingSubtext}>
              Waiting for game data to sync...
            </Text>
          </View>
        );
      }
      
      // Otherwise show regular loading
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading game...</Text>
        </View>
      );
    }

    const safeQuestionIndex = Math.max(0, Math.min(currentQuestionIndex, currentGame.questions.length - 1));
    const currentQuestion = currentGame.questions[safeQuestionIndex];

    if (!currentQuestion) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>Invalid question</Text>
          <Button
            title="Close"
            onPress={onClose}
            variant="primary"
            style={{ marginTop: theme.spacing.lg }}
          />
        </View>
      );
    }

    const userRole = GameService.getUserRole(currentGame, currentUserId);
    const hasAnswered = GameService.hasAnswered(currentGame, currentUserId, currentQuestion.id);
    const questionAnswers = GameService.getQuestionAnswers(currentGame, currentQuestion.id);
    const allQuestionsAnswered = currentGame.questions.every((q) => {
      const answers = GameService.getQuestionAnswers(currentGame, q.id);
      return answers.player1Answer && answers.player2Answer;
    });

    return (
      <View style={styles.mainContent}>
        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              Question {currentQuestionIndex + 1} of {currentGame.questions.length}
            </Text>
            <Text style={styles.progressPercent}>
              {Math.round(((currentQuestionIndex + 1) / currentGame.questions.length) * 100)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentQuestionIndex + 1) / currentGame.questions.length) * 100}%`,
                  backgroundColor: revealMode ? theme.colors.success : theme.colors.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
        >
          <View style={styles.questionCard}>
            {currentQuestion.category && (
              <View style={styles.categoryBadge}>
                <Ionicons name="pricetag" size={12} color={theme.colors.primary} />
                <Text style={styles.categoryText}>{currentQuestion.category}</Text>
              </View>
            )}
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>

          {/* Answer Section */}
          {revealMode
            ? renderRevealView(currentQuestion, questionAnswers, userRole)
            : renderAnswerInput(currentQuestion, hasAnswered, allQuestionsAnswered)}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <Ionicons name="chatbubbles" size={24} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.title}>Question Game</Text>
                  <Text style={styles.subtitle}>Answer together, grow closer</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Content Container */}
            <View style={styles.contentContainer}>
              {renderContent()}
            </View>
          </SafeAreaView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  safeArea: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  progressSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  progressText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  progressPercent: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.divider,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  questionCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    gap: 4,
  },
  categoryText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    lineHeight: 28,
  },
  answerInputContainer: {
    marginTop: theme.spacing.sm,
  },
  answerLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  inputWrapper: {
    marginBottom: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  answerInput: {
    minHeight: 120,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    lineHeight: 22,
  },
  submitButton: {
    marginBottom: theme.spacing.sm,
  },
  submitHint: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  answeredContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.success + '40',
    borderStyle: 'dashed',
  },
  successIconContainer: {
    marginBottom: theme.spacing.md,
  },
  answeredText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.success,
    marginBottom: theme.spacing.sm,
  },
  waitingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  waitingIndicator: {
    marginTop: theme.spacing.sm,
  },
  revealButton: {
    marginTop: theme.spacing.sm,
  },
  revealSection: {
    marginTop: theme.spacing.md,
  },
  revealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  revealTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  answerCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary + '30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  partnerAnswerCard: {
    borderColor: theme.colors.secondary + '30',
  },
  answerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerAvatar: {
    backgroundColor: theme.colors.secondary + '20',
  },
  playerName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  partnerName: {
    color: theme.colors.secondary,
  },
  revealedAnswer: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    lineHeight: 24,
  },
  navigationButtons: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    minHeight: 300,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  loadingSubtext: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    minHeight: 300,
  },
  errorText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.error,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  errorSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  ratingSection: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  ratingTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  ratingInputSection: {
    marginBottom: theme.spacing.md,
  },
  ratingLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  starRating: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    justifyContent: 'center',
  },
  ratingSavedText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontStyle: 'italic',
  },
  commentInput: {
    minHeight: 100,
    paddingTop: theme.spacing.sm,
  },
  commentInputDisabled: {
    backgroundColor: theme.colors.background,
    opacity: 0.7,
  },
  submitRatingButton: {
    marginTop: theme.spacing.sm,
  },
  partnerRatingSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  partnerRatingLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  partnerCommentCard: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.secondary,
  },
  partnerCommentText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    lineHeight: 20,
  },
});
