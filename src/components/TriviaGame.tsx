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

interface TriviaGameProps {
  visible: boolean;
  gameSession: GameSession | null;
  currentUserId: string;
  partnerName?: string;
  userName?: string;
  onClose: () => void;
  onGameComplete: () => void;
}

export default function TriviaGame({
  visible,
  gameSession,
  currentUserId,
  partnerName = 'Partner',
  userName = 'You',
  onClose,
  onGameComplete,
}: TriviaGameProps) {
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

    // If game has no questions, set it and let real-time subscription handle loading questions
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

    // If game is completed or all questions answered, show in reveal mode
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

    console.log('🔵 Subscribing to trivia game session for real-time updates:', currentGame.id);

    const unsub = GameService.subscribeToGameSession(currentGame.id, (game) => {
      if (game) {
        console.log('📥 Real-time trivia game update received:', {
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
          // Real-time updates: Game state is always synced via setCurrentGame above
          // Navigation is independent for each player - they can move freely after answering
        }
      }
    });

    unsubscribeRef.current = unsub;

    return () => {
      if (unsubscribeRef.current) {
        console.log('🔴 Unsubscribing from trivia game session');
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
        console.log('🎉 Completing trivia game session:', currentGame.id);
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

  const calculateScore = (game: GameSession, userId: string): number => {
    const userRole = GameService.getUserRole(game, userId);
    if (!userRole) return 0;

    const answers = userRole === 'player1' ? game.player1Answers : game.player2Answers;
    let score = 0;

    game.questions.forEach((question) => {
      const userAnswer = answers[question.id];
      if (userAnswer !== undefined && question.correctAnswer !== undefined) {
        if (userAnswer === question.correctAnswer) {
          score++;
        }
      }
    });

    return score;
  };

  const renderAnswerSelection = (currentQuestion: GameQuestion, hasAnswered: boolean, bothAnswered: boolean) => {
    if (!currentQuestion.options) return null;

    const userRole = GameService.getUserRole(currentGame, currentUserId);
    if (!userRole) return null;

    const questionAnswers = GameService.getQuestionAnswers(currentGame!, currentQuestion.id);
    const userAnswer = userRole === 'player1' ? questionAnswers.player1Answer : questionAnswers.player2Answer;

    return (
      <View style={styles.answerSelectionContainer}>
        <Text style={styles.answerLabel}>Select Your Answer</Text>
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === index || (hasAnswered && userAnswer === index);
          const showResult = revealMode && hasAnswered;
          // Get partner's answer for comparison
          const partnerAnswer = userRole === 'player1' 
            ? questionAnswers.player2Answer 
            : questionAnswers.player1Answer;
          const answersMatch = showResult && partnerAnswer !== undefined && index === partnerAnswer && index === userAnswer;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                isSelected && styles.optionButtonSelected,
                showResult && answersMatch && styles.optionButtonCorrect,
                showResult && isSelected && !answersMatch && styles.optionButtonIncorrect,
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
                  showResult && answersMatch && styles.optionCircleCorrect,
                  showResult && isSelected && !answersMatch && styles.optionCircleIncorrect,
                ]}>
                  {isSelected && (
                    <Ionicons 
                      name={showResult && answersMatch ? 'heart' : showResult && !answersMatch ? 'heart-outline' : 'radio-button-on'} 
                      size={20} 
                      color={showResult && answersMatch ? '#fff' : showResult && !answersMatch ? theme.colors.textSecondary : theme.colors.primary} 
                    />
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                  showResult && answersMatch && styles.optionTextCorrect,
                ]}>
                  {option}
                </Text>
                {showResult && answersMatch && (
                  <Ionicons name="heart" size={20} color={theme.colors.accent} style={styles.correctBadge} />
                )}
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
    // For couples trivia: answers match if both partners chose the same option
    const answersMatch = player1Answer !== undefined && player2Answer !== undefined && player1Answer === player2Answer;

    // Calculate scores
    const player1Score = calculateScore(currentGame, currentGame.player1Id || '');
    const player2Score = calculateScore(currentGame, currentGame.player2Id || '');
    const totalQuestions = currentGame.questions.length;

    return (
      <View style={styles.revealSection}>
        <View style={styles.revealHeader}>
          <Ionicons name="eye" size={24} color={theme.colors.primary} />
          <Text style={styles.revealTitle}>Results</Text>
        </View>

        {/* Show if answers match (for couples trivia) */}
        {player1Answer !== undefined && player2Answer !== undefined && (
          <View style={[
            styles.correctAnswerCard,
            player1Answer === player2Answer ? styles.correctAnswerCardMatch : styles.correctAnswerCardNoMatch
          ]}>
            <View style={styles.correctAnswerHeader}>
              <Ionicons 
                name={player1Answer === player2Answer ? "heart" : "heart-outline"} 
                size={24} 
                color={player1Answer === player2Answer ? theme.colors.success : theme.colors.textSecondary} 
              />
              <Text style={[
                styles.correctAnswerLabel,
                { color: player1Answer === player2Answer ? theme.colors.success : theme.colors.textSecondary }
              ]}>
                {player1Answer === player2Answer ? "You're in sync! 💕" : "Different answers - discuss!"}
              </Text>
            </View>
            {player1Answer === player2Answer && currentQuestion.options && (
              <Text style={styles.correctAnswerText}>
                Both chose: {currentQuestion.options[player1Answer]}
              </Text>
            )}
          </View>
        )}

        {/* Player 1 Answer */}
        <View style={[
          styles.playerAnswerCard,
          answersMatch && styles.playerAnswerCardCorrect,
          !answersMatch && player1Answer !== undefined && player2Answer !== undefined && styles.playerAnswerCardIncorrect,
        ]}>
          <View style={styles.playerAnswerHeader}>
            <View style={styles.playerAvatar}>
              <Ionicons name="person" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.playerName}>
              {isPlayer1 ? userName : partnerName}
            </Text>
            {answersMatch ? (
              <Ionicons name="heart" size={20} color={theme.colors.success} />
            ) : player1Answer !== undefined && player2Answer !== undefined ? (
              <Ionicons name="heart-outline" size={20} color={theme.colors.textSecondary} />
            ) : null}
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
          answersMatch && styles.playerAnswerCardCorrect,
          !answersMatch && player1Answer !== undefined && player2Answer !== undefined && styles.playerAnswerCardIncorrect,
        ]}>
          <View style={styles.playerAnswerHeader}>
            <View style={[styles.playerAvatar, styles.partnerAvatar]}>
              <Ionicons name="person" size={20} color={theme.colors.secondary} />
            </View>
            <Text style={[styles.playerName, styles.partnerName]}>
              {isPlayer1 ? partnerName : userName}
            </Text>
            {answersMatch ? (
              <Ionicons name="heart" size={20} color={theme.colors.success} />
            ) : player1Answer !== undefined && player2Answer !== undefined ? (
              <Ionicons name="heart-outline" size={20} color={theme.colors.textSecondary} />
            ) : null}
          </View>
          {currentQuestion.options && player2Answer !== undefined && (
            <Text style={styles.playerAnswerText}>
              {currentQuestion.options[player2Answer]}
            </Text>
          )}
        </View>

        {/* Score Display (on last question) */}
        {currentQuestionIndex === currentGame.questions.length - 1 && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreTitle}>Final Scores</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>{isPlayer1 ? userName : partnerName}</Text>
              <Text style={styles.scoreValue}>
                {isPlayer1 ? player1Score : player2Score} / {totalQuestions}
              </Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>{isPlayer1 ? partnerName : userName}</Text>
              <Text style={styles.scoreValue}>
                {isPlayer1 ? player2Score : player1Score} / {totalQuestions}
              </Text>
            </View>
            <Text style={styles.scoreMessage}>
              {player1Score === totalQuestions 
                ? `Perfect match! You're completely in sync! 💕🎉` 
                : `You matched on ${player1Score} out of ${totalQuestions} questions! ${player1Score >= totalQuestions * 0.7 ? 'Great connection! 💕' : 'Keep learning about each other! 💕'}`}
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
              title={revealMode ? "Next Question" : "Continue"}
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

        {/* Rating and Comments Section for Completed Games */}
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
    const allQuestionsAnswered = currentGame.questions.every((q) => {
      const answers = GameService.getQuestionAnswers(currentGame, q.id);
      return answers.player1Answer !== undefined && answers.player2Answer !== undefined;
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

          {/* Answer Section - Show reveal if both answered current question, otherwise show selection */}
          {(() => {
            const bothAnsweredCurrent = questionAnswers.player1Answer !== undefined && 
                                       questionAnswers.player2Answer !== undefined;
            return (revealMode || bothAnsweredCurrent)
              ? renderRevealView(currentQuestion, questionAnswers, userRole)
              : renderAnswerSelection(currentQuestion, hasAnswered, bothAnsweredCurrent);
          })()}
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
                    <Ionicons name="trophy" size={24} color={theme.colors.accent} />
                  </View>
                  <View>
                    <Text style={styles.title}>Trivia Game</Text>
                    <Text style={styles.subtitle}>Test your knowledge together</Text>
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
    backgroundColor: theme.colors.accent + '15',
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
  answerSelectionContainer: {
    marginTop: theme.spacing.sm,
  },
  answerLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  optionButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  optionButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  optionButtonCorrect: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success + '15',
  },
  optionButtonIncorrect: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.error + '15',
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
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionCircleSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  optionCircleCorrect: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success,
  },
  optionCircleIncorrect: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.error,
  },
  optionText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
  },
  optionTextSelected: {
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
  },
  optionTextCorrect: {
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.bold,
  },
  correctBadge: {
    marginLeft: 'auto',
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  waitingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
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
  correctAnswerCard: {
    backgroundColor: theme.colors.success + '15',
    borderRadius: 16,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.success + '40',
  },
  correctAnswerCardMatch: {
    backgroundColor: theme.colors.success + '15',
    borderColor: theme.colors.success + '40',
  },
  correctAnswerCardNoMatch: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
  },
  correctAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  correctAnswerLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.success,
    textTransform: 'uppercase',
  },
  correctAnswerText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  playerAnswerCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
  },
  playerAnswerCardCorrect: {
    borderColor: theme.colors.success + '40',
    backgroundColor: theme.colors.success + '10',
  },
  playerAnswerCardIncorrect: {
    borderColor: theme.colors.error + '40',
    backgroundColor: theme.colors.error + '10',
  },
  playerAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
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
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  partnerName: {
    color: theme.colors.secondary,
  },
  playerAnswerText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
  },
  scoreCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  scoreTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  scoreLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
  },
  scoreValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  scoreMessage: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.accent,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
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

