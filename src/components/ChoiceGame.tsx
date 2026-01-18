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
import { Input } from './Input';
import { GameService, GameSession, GameQuestion } from '../services/game.service';
import * as Haptics from 'expo-haptics';

interface ChoiceGameProps {
  visible: boolean;
  gameSession: GameSession | null;
  currentUserId: string;
  partnerName?: string;
  userName?: string;
  onClose: () => void;
  onGameComplete: () => void;
  gameType: 'would-you-rather' | 'this-or-that';
}

export default function ChoiceGame({
  visible,
  gameSession,
  currentUserId,
  partnerName = 'Partner',
  userName = 'You',
  onClose,
  onGameComplete,
  gameType,
}: ChoiceGameProps) {
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

  const isWouldYouRather = gameType === 'would-you-rather';
  const gameTitle = isWouldYouRather ? 'Would You Rather' : 'This or That';
  const gameSubtitle = isWouldYouRather ? 'Discover preferences together' : 'Quick choices, fun comparisons';
  const gameIcon = isWouldYouRather ? 'swap-horizontal' : 'shuffle';
  const gameColor = isWouldYouRather ? theme.colors.secondary : theme.colors.primary;

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

    // Check if game is already completed or all questions answered
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

    // Initialize rating and comment from game session
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

    console.log(`🔵 Subscribing to ${gameType} game session for real-time updates:`, currentGame.id);

    const unsub = GameService.subscribeToGameSession(currentGame.id, (game) => {
      if (game) {
        console.log(`📥 Real-time ${gameType} game update received:`, {
          id: game.id,
          questionsCount: game.questions?.length || 0,
          currentIndex: game.currentQuestionIndex,
          status: game.status,
        });

        setCurrentGame(game);
        
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

        // Check if all questions answered or game is completed
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
        console.log(`🔴 Unsubscribing from ${gameType} game session`);
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [visible, currentGame?.id, revealMode, currentUserId, gameType]);

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
      Alert.alert('Choice Required', 'Please select an option before continuing.');
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
      Alert.alert('Error', error.message || 'Failed to submit choice. Please try again.');
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
        console.log(`🎉 Completing ${gameType} game session:`, currentGame.id);
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

  const calculateMatchCount = (game: GameSession): number => {
    let matchCount = 0;
    game.questions.forEach((question) => {
      const answers = GameService.getQuestionAnswers(game, question.id);
      if (answers.player1Answer !== undefined && 
          answers.player2Answer !== undefined && 
          answers.player1Answer === answers.player2Answer) {
        matchCount++;
      }
    });
    return matchCount;
  };

  const renderChoiceSelection = (currentQuestion: GameQuestion, hasAnswered: boolean, bothAnswered: boolean) => {
    if (!currentQuestion.options || currentQuestion.options.length !== 2) return null;

    const userRole = GameService.getUserRole(currentGame, currentUserId);
    if (!userRole) return null;

    const questionAnswers = GameService.getQuestionAnswers(currentGame!, currentQuestion.id);
    const userAnswer = userRole === 'player1' ? questionAnswers.player1Answer : questionAnswers.player2Answer;

    return (
      <View style={styles.choiceContainer}>
        <Text style={styles.choiceLabel}>
          {isWouldYouRather ? 'What would you choose?' : 'Pick one!'}
        </Text>
        
        <View style={styles.choiceButtonsRow}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index || (hasAnswered && userAnswer === index);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.choiceButton,
                  { borderColor: index === 0 ? gameColor : theme.colors.accent },
                  isSelected && styles.choiceButtonSelected,
                  isSelected && { backgroundColor: (index === 0 ? gameColor : theme.colors.accent) + '20' },
                  hasAnswered && !isSelected && styles.choiceButtonDisabled,
                ]}
                onPress={() => {
                  if (!hasAnswered) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setSelectedAnswer(index);
                  }
                }}
                disabled={hasAnswered}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.choiceButtonText,
                  isSelected && { color: index === 0 ? gameColor : theme.colors.accent },
                ]}>
                  {option}
                </Text>
                {isSelected && (
                  <View style={[styles.checkBadge, { backgroundColor: index === 0 ? gameColor : theme.colors.accent }]}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {isWouldYouRather && (
          <Text style={styles.orDivider}>OR</Text>
        )}

        {!hasAnswered && (
          <Button
            title="Lock In Choice"
            onPress={() => handleSubmitAnswer(currentQuestion.id)}
            variant="primary"
            loading={submitting}
            disabled={selectedAnswer === null || submitting}
            style={[styles.submitButton, { backgroundColor: gameColor }]}
          />
        )}
        
        {hasAnswered && !bothAnswered && (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="small" color={gameColor} />
            <Text style={styles.waitingText}>Choice locked! Waiting for {partnerName}...</Text>
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
    if (!userRole || !currentGame || !currentQuestion.options) return null;

    const player1Answer = questionAnswers.player1Answer;
    const player2Answer = questionAnswers.player2Answer;
    const isPlayer1 = userRole === 'player1';
    const answersMatch = player1Answer !== undefined && player2Answer !== undefined && player1Answer === player2Answer;

    // Calculate match count for the game
    const matchCount = calculateMatchCount(currentGame);
    const totalQuestions = currentGame.questions.length;

    return (
      <View style={styles.revealSection}>
        {/* Match status */}
        <View style={[
          styles.matchStatusCard,
          answersMatch ? styles.matchStatusMatch : styles.matchStatusNoMatch
        ]}>
          <Ionicons 
            name={answersMatch ? "heart" : "heart-dislike"} 
            size={32} 
            color={answersMatch ? theme.colors.success : theme.colors.textSecondary} 
          />
          <Text style={[
            styles.matchStatusText,
            { color: answersMatch ? theme.colors.success : theme.colors.textSecondary }
          ]}>
            {answersMatch ? "You both chose the same! 💕" : "Different choices! Interesting..."}
          </Text>
        </View>

        {/* Both choices displayed side by side */}
        <View style={styles.choicesRevealContainer}>
          {/* Player 1 Choice */}
          <View style={[
            styles.revealChoiceCard,
            answersMatch && styles.revealChoiceCardMatch,
          ]}>
            <View style={[styles.revealAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="person" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.revealPlayerName}>
              {isPlayer1 ? userName : partnerName}
            </Text>
            <Text style={[styles.revealChoiceText, { color: player1Answer === 0 ? gameColor : theme.colors.accent }]}>
              {player1Answer !== undefined ? currentQuestion.options[player1Answer] : 'No choice'}
            </Text>
          </View>

          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* Player 2 Choice */}
          <View style={[
            styles.revealChoiceCard,
            answersMatch && styles.revealChoiceCardMatch,
          ]}>
            <View style={[styles.revealAvatar, { backgroundColor: theme.colors.secondary + '20' }]}>
              <Ionicons name="person" size={20} color={theme.colors.secondary} />
            </View>
            <Text style={styles.revealPlayerName}>
              {isPlayer1 ? partnerName : userName}
            </Text>
            <Text style={[styles.revealChoiceText, { color: player2Answer === 0 ? gameColor : theme.colors.accent }]}>
              {player2Answer !== undefined ? currentQuestion.options[player2Answer] : 'No choice'}
            </Text>
          </View>
        </View>

        {/* Final Score (on last question) */}
        {currentQuestionIndex === currentGame.questions.length - 1 && (
          <View style={styles.finalScoreCard}>
            <Text style={styles.finalScoreTitle}>🎉 Game Complete!</Text>
            <Text style={styles.finalScoreValue}>
              {matchCount} / {totalQuestions} matches
            </Text>
            <Text style={styles.finalScoreMessage}>
              {matchCount === totalQuestions 
                ? "Perfect sync! You two think alike! 💕" 
                : matchCount >= totalQuestions * 0.7 
                  ? "Great connection! You're pretty in sync! 💕"
                  : matchCount >= totalQuestions * 0.5 
                    ? "Nice! You have things in common! 💕"
                    : "Opposites attract! Embrace your differences! 💕"}
            </Text>
          </View>
        )}

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
              title="Next"
              onPress={handleNextQuestion}
              variant="primary"
              style={[{ flex: 1 }, { backgroundColor: gameColor }]}
            />
          ) : currentGame?.status !== 'completed' ? (
            <Button
              title="Complete Game"
              onPress={handleCompleteGame}
              variant="primary"
              style={[{ flex: 1 }, { backgroundColor: gameColor }]}
            />
          ) : null}
        </View>

        {/* Rating Section */}
        {currentGame?.status === 'completed' && 
         currentGame.questions && 
         currentQuestionIndex === currentGame.questions.length - 1 &&
         renderRatingSection(userRole)}
      </View>
    );
  };

  const renderRatingSection = (userRole: 'player1' | 'player2' | null) => {
    if (!currentGame || !userRole) return null;

    const isPlayer1 = userRole === 'player1';
    const userRatingValue = isPlayer1 ? currentGame.player1Rating : currentGame.player2Rating;
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
            numberOfLines={3}
            editable={!hasUserRated}
            style={[styles.commentInput, hasUserRated && styles.commentInputDisabled]}
            textAlignVertical="top"
          />

          {!hasUserRated && (
            <Button
              title="Submit Rating"
              onPress={handleSubmitRating}
              variant="primary"
              loading={submittingRating}
              disabled={userRating === 0 || submittingRating}
              style={[styles.submitRatingButton, { backgroundColor: gameColor }]}
            />
          )}
        </View>

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

  const renderContent = () => {
    if (loading || !currentGame || !currentGame.questions || currentGame.questions.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={gameColor} />
          <Text style={styles.loadingText}>
            {currentGame ? 'Loading questions...' : 'Loading game...'}
          </Text>
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
          <Button title="Close" onPress={onClose} variant="primary" />
        </View>
      );
    }

    const userRole = GameService.getUserRole(currentGame, currentUserId);
    const hasAnswered = GameService.hasAnswered(currentGame, currentUserId, currentQuestion.id);
    const questionAnswers = GameService.getQuestionAnswers(currentGame, currentQuestion.id);
    const bothAnsweredCurrent = questionAnswers.player1Answer !== undefined && 
                                questionAnswers.player2Answer !== undefined;

    return (
      <View style={styles.mainContent}>
        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              {currentQuestionIndex + 1} / {currentGame.questions.length}
            </Text>
            <Text style={[styles.progressPercent, { color: gameColor }]}>
              {Math.round(((currentQuestionIndex + 1) / currentGame.questions.length) * 100)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentQuestionIndex + 1) / currentGame.questions.length) * 100}%`,
                  backgroundColor: revealMode ? theme.colors.success : gameColor,
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
          <View style={[styles.questionCard, { borderColor: gameColor + '30' }]}>
            {currentQuestion.category && (
              <View style={[styles.categoryBadge, { backgroundColor: gameColor + '20' }]}>
                <Ionicons name="pricetag" size={12} color={gameColor} />
                <Text style={[styles.categoryText, { color: gameColor }]}>{currentQuestion.category}</Text>
              </View>
            )}
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>

          {/* Choice/Reveal Section */}
          {(revealMode || bothAnsweredCurrent)
            ? renderRevealView(currentQuestion, questionAnswers, userRole)
            : renderChoiceSelection(currentQuestion, hasAnswered, bothAnsweredCurrent)}
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
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
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
                  <View style={[styles.headerIcon, { backgroundColor: gameColor + '15' }]}>
                    <Ionicons name={gameIcon as any} size={24} color={gameColor} />
                  </View>
                  <View>
                    <Text style={styles.title}>{gameTitle}</Text>
                    <Text style={styles.subtitle}>{gameSubtitle}</Text>
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
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    gap: 4,
  },
  categoryText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    lineHeight: 30,
    textAlign: 'center',
  },
  choiceContainer: {
    marginTop: theme.spacing.sm,
  },
  choiceLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  choiceButtonsRow: {
    gap: theme.spacing.md,
  },
  choiceButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    borderWidth: 3,
    position: 'relative',
  },
  choiceButtonSelected: {
    transform: [{ scale: 1.02 }],
  },
  choiceButtonDisabled: {
    opacity: 0.5,
  },
  choiceButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orDivider: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginVertical: -theme.spacing.sm,
  },
  submitButton: {
    marginTop: theme.spacing.lg,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  waitingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  revealSection: {
    marginTop: theme.spacing.md,
  },
  matchStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: 16,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  matchStatusMatch: {
    backgroundColor: theme.colors.success + '20',
  },
  matchStatusNoMatch: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  matchStatusText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  choicesRevealContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  revealChoiceCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  revealChoiceCardMatch: {
    borderColor: theme.colors.success + '60',
    backgroundColor: theme.colors.success + '10',
  },
  revealAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  revealPlayerName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  revealChoiceText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  vsContainer: {
    paddingHorizontal: theme.spacing.xs,
  },
  vsText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textLight,
  },
  finalScoreCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  finalScoreTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  finalScoreValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  finalScoreMessage: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.error,
    marginTop: theme.spacing.md,
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
    minHeight: 80,
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

