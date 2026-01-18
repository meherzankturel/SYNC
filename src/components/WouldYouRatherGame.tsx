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
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { theme } from '../config/theme';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { GameService, GameSession, GameQuestion } from '../services/game.service';
import * as Haptics from 'expo-haptics';

interface WouldYouRatherGameProps {
  visible: boolean;
  gameSession: GameSession | null;
  currentUserId: string;
  partnerName?: string;
  userName?: string;
  onClose: () => void;
  onGameComplete: () => void;
}

export default function WouldYouRatherGame({
  visible,
  gameSession,
  currentUserId,
  partnerName = 'Partner',
  userName = 'You',
  onClose,
  onGameComplete,
}: WouldYouRatherGameProps) {
  const [currentGame, setCurrentGame] = useState<GameSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [revealMode, setRevealMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState<number>(0);
  const [userComment, setUserComment] = useState<string>('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Animation effects
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
          tension: 50,
          friction: 7,
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
      setSelectedAnswer(null);
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

    if (!gameSession.questions || gameSession.questions.length === 0) {
      console.log('⚠️ Game session has no questions initially, waiting for real-time sync');
      setCurrentGame(gameSession);
      setLoading(true);
      return;
    }

    setCurrentGame(gameSession);
    setSelectedAnswer(null);
    setLoading(false);

    const allAnswered = gameSession.questions.every((q) => {
      const answers = GameService.getQuestionAnswers(gameSession, q.id);
      return answers.player1Answer !== undefined && answers.player2Answer !== undefined;
    });

    if (allAnswered || gameSession.status === 'completed') {
      setRevealMode(true);
      setCurrentQuestionIndex(0);
    } else {
      setRevealMode(false);
      setCurrentQuestionIndex(Math.max(0, gameSession.currentQuestionIndex || 0));
    }

    const userRole = GameService.getUserRole(gameSession, currentUserId);
    if (userRole === 'player1') {
      setUserRating(gameSession.player1Rating || 0);
      setUserComment(gameSession.player1Comment || '');
    } else if (userRole === 'player2') {
      setUserRating(gameSession.player2Rating || 0);
      setUserComment(gameSession.player2Comment || '');
    }
  }, [gameSession?.id, visible, currentUserId]);

  // Subscribe to real-time game updates
  useEffect(() => {
    if (!visible || !currentGame?.id) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    console.log('🔵 Subscribing to Would You Rather game session for real-time updates:', currentGame.id);

    const unsub = GameService.subscribeToGameSession(currentGame.id, (game) => {
      if (game) {
        console.log('📥 Real-time Would You Rather game update received:', {
          id: game.id,
          questionsCount: game.questions?.length || 0,
          currentIndex: game.currentQuestionIndex,
          status: game.status,
        });

        setCurrentGame(game);
        
        if (game.questions && game.questions.length > 0) {
          setLoading(false);
        }

        const userRole = GameService.getUserRole(game, currentUserId);
        if (userRole === 'player1') {
          if (game.player1Rating !== undefined) setUserRating(game.player1Rating);
          if (game.player1Comment !== undefined) setUserComment(game.player1Comment || '');
        } else if (userRole === 'player2') {
          if (game.player2Rating !== undefined) setUserRating(game.player2Rating);
          if (game.player2Comment !== undefined) setUserComment(game.player2Comment || '');
        }

        if (game.questions && game.questions.length > 0) {
          const allAnswered = game.questions.every((q) => {
            const answers = GameService.getQuestionAnswers(game, q.id);
            return answers.player1Answer !== undefined && answers.player2Answer !== undefined;
          });

          const isCompleted = game.status === 'completed' || allAnswered;

          if (isCompleted && !revealMode) {
            setRevealMode(true);
            setCurrentQuestionIndex(0);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      }
    });

    unsubscribeRef.current = unsub;

    return () => {
      if (unsubscribeRef.current) {
        console.log('🔴 Unsubscribing from Would You Rather game session');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [visible, currentGame?.id, revealMode, currentUserId]);

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
    if (!currentGame?.id || selectedAnswer === null) {
      Alert.alert('Answer Required', 'Please select an answer before submitting.');
      return;
    }

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await GameService.submitAnswer(currentGame.id, currentUserId, questionId, selectedAnswer);
      setSelectedAnswer(null);
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
      setSelectedAnswer(null);
    } else {
      handleCompleteGame();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(null);
    }
  };

  const handleCompleteGame = async () => {
    if (currentGame?.id) {
      try {
        console.log('🎉 Completing Would You Rather game session:', currentGame.id);
        await GameService.completeGameSession(currentGame.id);
        console.log('✅ Game session completed successfully');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onGameComplete();
        onClose();
      } catch (error: any) {
        console.error('❌ Error completing game:', error);
        Alert.alert('Error', error.message || 'Failed to complete game');
      }
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

  const renderAnswerSelection = (currentQuestion: GameQuestion, hasAnswered: boolean, bothAnswered: boolean) => {
    if (!currentQuestion.options) return null;

    const userRole = GameService.getUserRole(currentGame, currentUserId);
    if (!userRole) return null;

    const questionAnswers = GameService.getQuestionAnswers(currentGame!, currentQuestion.id);
    const userAnswer = userRole === 'player1' ? questionAnswers.player1Answer : questionAnswers.player2Answer;

    return (
      <View style={styles.answerSelectionContainer}>
        <Text style={styles.answerLabel}>Choose Your Answer</Text>
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === index || (hasAnswered && userAnswer === index);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                isSelected && styles.optionButtonSelected,
                hasAnswered && !isSelected && styles.optionButtonDisabled,
              ]}
              onPress={() => {
                if (!hasAnswered) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedAnswer(index);
                }
              }}
              disabled={hasAnswered}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.optionCircle,
                  isSelected && styles.optionCircleSelected,
                ]}>
                  {isSelected && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}>
                  {option}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        {!hasAnswered && (
          <Button
            title="Submit Answer"
            onPress={() => handleSubmitAnswer(currentQuestion.id)}
            variant="primary"
            loading={submitting}
            disabled={selectedAnswer === null || submitting}
            style={styles.submitButton}
          />
        )}
        {hasAnswered && !bothAnswered && (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.waitingText}>Answer submitted! Waiting for your partner to answer...</Text>
          </View>
        )}
      </View>
    );
  };

  const renderRevealView = (
    currentQuestion: GameQuestion,
    questionAnswers: any,
    userRole: 'player1' | 'player2' | null
  ) => {
    if (!userRole || !currentGame) return null;

    const player1Answer = questionAnswers.player1Answer;
    const player2Answer = questionAnswers.player2Answer;
    const isPlayer1 = userRole === 'player1';
    const answersMatch = player1Answer !== undefined && player2Answer !== undefined && player1Answer === player2Answer;

    return (
      <View style={styles.revealSection}>
        <View style={styles.revealHeader}>
          <Ionicons name="eye" size={24} color={theme.colors.primary} />
          <Text style={styles.revealTitle}>Results</Text>
        </View>

        {player1Answer !== undefined && player2Answer !== undefined && (
          <View style={[
            styles.matchCard,
            answersMatch ? styles.matchCardMatch : styles.matchCardNoMatch
          ]}>
            <View style={styles.matchHeader}>
              <Ionicons 
                name={answersMatch ? "heart" : "heart-outline"} 
                size={24} 
                color={answersMatch ? theme.colors.success : theme.colors.textSecondary} 
              />
              <Text style={[
                styles.matchLabel,
                { color: answersMatch ? theme.colors.success : theme.colors.textSecondary }
              ]}>
                {answersMatch ? "You chose the same! 💕" : "Different choices - discuss why!"}
              </Text>
            </View>
            {answersMatch && currentQuestion.options && (
              <Text style={styles.matchText}>
                Both chose: {currentQuestion.options[player1Answer]}
              </Text>
            )}
          </View>
        )}

        {/* Player 1 Answer */}
        <View style={[
          styles.playerAnswerCard,
          answersMatch && styles.playerAnswerCardMatch,
        ]}>
          <View style={styles.playerAnswerHeader}>
            <View style={styles.playerAvatar}>
              <Ionicons name="person" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.playerName}>
              {isPlayer1 ? userName : partnerName}
            </Text>
            {answersMatch && (
              <Ionicons name="heart" size={20} color={theme.colors.success} />
            )}
          </View>
          {currentQuestion.options && player1Answer !== undefined && (
            <Text style={styles.playerAnswerText}>
              {currentQuestion.options[player1Answer]}
            </Text>
          )}
        </View>

        {/* Player 2 Answer */}
        <View style={[
          styles.playerAnswerCard,
          answersMatch && styles.playerAnswerCardMatch,
        ]}>
          <View style={styles.playerAnswerHeader}>
            <View style={[styles.playerAvatar, styles.partnerAvatar]}>
              <Ionicons name="person" size={20} color={theme.colors.secondary} />
            </View>
            <Text style={[styles.playerName, styles.partnerName]}>
              {isPlayer1 ? partnerName : userName}
            </Text>
            {answersMatch && (
              <Ionicons name="heart" size={20} color={theme.colors.success} />
            )}
          </View>
          {currentQuestion.options && player2Answer !== undefined && (
            <Text style={styles.playerAnswerText}>
              {currentQuestion.options[player2Answer]}
            </Text>
          )}
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
          ) : (
            <View style={styles.ratingSection}>
              <Text style={styles.ratingTitle}>Rate this game</Text>
              <View style={styles.starRating}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setUserRating(star)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={userRating >= star ? 'star' : 'star-outline'}
                      size={32}
                      color={userRating >= star ? theme.colors.accent : theme.colors.textLight}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Button
                title="Submit Rating"
                onPress={handleSubmitRating}
                variant="primary"
                loading={submittingRating}
                disabled={userRating === 0 || submittingRating}
                style={{ marginTop: theme.spacing.md }}
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (loading || !currentGame || !currentGame.questions || currentGame.questions.length === 0) {
      if (currentGame && (!currentGame.questions || currentGame.questions.length === 0)) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading questions...</Text>
            <Text style={styles.loadingSubtext}>Waiting for game data to sync...</Text>
          </View>
        );
      }
      
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
    const bothAnswered = questionAnswers.player1Answer !== undefined && 
                         questionAnswers.player2Answer !== undefined;

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
          {(revealMode || bothAnswered)
            ? renderRevealView(currentQuestion, questionAnswers, userRole)
            : renderAnswerSelection(currentQuestion, hasAnswered, bothAnswered)}
        </ScrollView>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.modalOverlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.contentContainer}
          >
            <SafeAreaView style={styles.safeArea}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.headerIcon}>
                    <Ionicons name="swap-horizontal" size={24} color={theme.colors.secondary} />
                  </View>
                  <View>
                    <Text style={styles.title}>Would You Rather</Text>
                    <Text style={styles.subtitle}>Choose your preference</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              {renderContent()}
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
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
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.secondary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  mainContent: {
    flex: 1,
  },
  progressSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  progressText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  progressPercent: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.semibold,
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
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
  loadingSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.error,
    marginTop: theme.spacing.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
  questionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  categoryText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  questionText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    lineHeight: 32,
  },
  answerSelectionContainer: {
    gap: theme.spacing.md,
  },
  answerLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  optionButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  optionButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  optionButtonDisabled: {
    opacity: 0.6,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  optionCircle: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionCircleSelected: {
    // Handled by icon color
  },
  optionText: {
    flex: 1,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
  },
  optionTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  waitingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  revealSection: {
    gap: theme.spacing.md,
  },
  revealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  revealTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  matchCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  matchCardMatch: {
    backgroundColor: theme.colors.success + '15',
    borderWidth: 2,
    borderColor: theme.colors.success,
  },
  matchCardNoMatch: {
    backgroundColor: theme.colors.textLight + '10',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  matchLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  matchText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  playerAnswerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  playerAnswerCardMatch: {
    borderWidth: 2,
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success + '10',
  },
  playerAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerAvatar: {
    backgroundColor: theme.colors.secondary + '15',
  },
  playerName: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  partnerName: {
    color: theme.colors.secondary,
  },
  playerAnswerText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  ratingSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  ratingTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  starRating: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
});

