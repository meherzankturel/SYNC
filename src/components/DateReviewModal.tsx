import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';
import { Input } from './Input';
import { Button } from './Button';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { uploadMedia, MONGODB_API_BASE_URL } from '../config/mongodb';

// Conditionally import expo-file-system (using legacy for getInfoAsync support in newer Expo)
let FileSystem: any = null;
try {
  FileSystem = require('expo-file-system/legacy');
} catch (error) {
  try {
    FileSystem = require('expo-file-system');
  } catch (innerError) {
    console.warn('expo-file-system not available');
  }
}

interface DateReviewModalProps {
  visible: boolean;
  dateNightTitle: string;
  dateNightId: string;
  userId: string;
  userName?: string;
  partnerId?: string;
  partnerName?: string;
  existingReview?: {
    rating: number;
    message: string;
    emoji?: string;
    images?: string[];
    videos?: string[];
  } | null;
  partnerReview?: {
    rating: number;
    message: string;
    emoji?: string;
    images?: string[];
    videos?: string[];
    userName?: string;
  } | null;
  onClose: () => void;
  onSubmit: (review: {
    rating: number;
    message: string;
    emoji?: string;
    images?: string[];
    videos?: string[];
  }) => Promise<void>;
}

const EMOJI_OPTIONS = [
  '😊',  // Happy
  '🥰',  // In love
  '😍',  // Heart eyes
  '😄',  // Grinning
  '🤗',  // Hugging
  '🥳',  // Celebrating
  '😌',  // Relieved/peaceful
  '🤩',  // Star struck
  '😎',  // Cool
  '🫶',  // Heart hands
  '✨',  // Sparkles
  '💫',  // Dizzy star
  '🔥',  // Fire
  '💝',  // Heart with ribbon
  '🌹',  // Rose
  '🎉',  // Party
  '💐',  // Bouquet
  '🌟',  // Glowing star
];

export default function DateReviewModal({
  visible,
  dateNightTitle,
  dateNightId,
  userId,
  userName,
  partnerId,
  partnerName,
  existingReview,
  partnerReview,
  onClose,
  onSubmit,
}: DateReviewModalProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [message, setMessage] = useState(existingReview?.message || '');
  const [selectedEmoji, setSelectedEmoji] = useState(existingReview?.emoji || '');
  const [images, setImages] = useState<string[]>(existingReview?.images || []);
  const [videos, setVideos] = useState<string[]>(existingReview?.videos || []);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // Reset form when modal opens/closes or existingReview changes
  useEffect(() => {
    if (visible) {
      setRating(existingReview?.rating || 0);
      setMessage(existingReview?.message || '');
      setSelectedEmoji(existingReview?.emoji || '');

      // Set images/videos from existing review (they're already URLs from Firebase)
      const existingImages = existingReview?.images || [];
      const existingVideos = existingReview?.videos || [];

      setImages(existingImages);
      setVideos(existingVideos);

      setUploadProgress({ current: 0, total: 0 });

      console.log(`📝 Review modal opened. Existing images: ${existingImages.length}, Videos: ${existingVideos.length}`);
    }
  }, [visible, existingReview]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your photos to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: false, // Don't get base64 to save memory, read only during upload
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const currentImageCount = images.length;
        const remainingSlots = 10 - currentImageCount;
        const assetsToAdd = result.assets.slice(0, remainingSlots);

        if (assetsToAdd.length < result.assets.length) {
          Alert.alert(
            'Limit Reached',
            `You can only add ${remainingSlots} more image(s). ${result.assets.length - remainingSlots} image(s) were not added.`
          );
        }

        const newImages: string[] = [];

        assetsToAdd.forEach((asset, index) => {
          const globalIndex = currentImageCount + index;
          if (globalIndex < 10) { // Max 10 images
            newImages.push(asset.uri);
          }
        });

        setImages(prev => [...prev, ...newImages]);

        // Haptic feedback
        if (Platform.OS === 'ios') {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch (error) {
            console.warn('Haptic feedback failed:', error);
          }
        }

        console.log(`✅ Added ${newImages.length} image(s). Total: ${images.length + newImages.length}/10`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
  };

  const handlePickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need access to your videos to upload videos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: false, // Don't get base64 to save memory, read only during upload
        videoMaxDuration: 300, // Max 5 minutes
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const currentVideoCount = videos.length;
        const remainingSlots = 5 - currentVideoCount;
        const assetsToAdd = result.assets.slice(0, remainingSlots);

        if (assetsToAdd.length < result.assets.length) {
          Alert.alert(
            'Limit Reached',
            `You can only add ${remainingSlots} more video(s). ${result.assets.length - remainingSlots} video(s) were not added.`
          );
        }

        const newVideos: string[] = [];

        assetsToAdd.forEach((asset, index) => {
          const globalIndex = currentVideoCount + index;
          if (globalIndex < 5) { // Max 5 videos
            newVideos.push(asset.uri);
          }
        });

        setVideos(prev => [...prev, ...newVideos]);

        // Haptic feedback
        if (Platform.OS === 'ios') {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch (error) {
            console.warn('Haptic feedback failed:', error);
          }
        }

        console.log(`✅ Added ${newVideos.length} video(s). Total: ${videos.length + newVideos.length}/5`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick video');
    }
  };

  const handleRemoveImage = (index: number) => {
    try {
      // Add haptic feedback
      if (Platform.OS === 'ios') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
          console.warn('Haptic feedback failed:', error);
        }
      }

      // Remove image from array
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);

      setImages(newImages);

      console.log(`🗑️ Removed image at index ${index}. Remaining: ${newImages.length}`);
    } catch (error: any) {
      console.error('Failed to remove image:', error);
      Alert.alert('Error', 'Failed to remove image. Please try again.');
    }
  };

  const handleRemoveVideo = (index: number) => {
    try {
      // Add haptic feedback
      if (Platform.OS === 'ios') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
          console.warn('Haptic feedback failed:', error);
        }
      }

      // Remove video from array
      const newVideos = videos.filter((_, i) => i !== index);
      setVideos(newVideos);

      setVideos(newVideos);

      console.log(`🗑️ Removed video at index ${index}. Remaining: ${newVideos.length}`);
    } catch (error: any) {
      console.error('Failed to remove video:', error);
      Alert.alert('Error', 'Failed to remove video. Please try again.');
    }
  };

const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating (1-5 stars)');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please write a review message');
      return;
    }

    setSubmitting(true);
    try {
      // Show uploading progress
      let uploadProgress = 0;
      const totalUploads = (images?.length || 0) + (videos?.length || 0);

      // Upload images via MongoDB backend
      const uploadedImageURLs: string[] = [];
      const newImageURIs: { uri: string; index: number }[] = [];
      const existingImageURLs: string[] = [];

      if (images && images.length > 0) {
        // Separate existing URLs from new local URIs
        images.forEach((imageUri, index) => {
          if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
            // Already uploaded - keep as is
            existingImageURLs.push(imageUri);
            uploadedImageURLs.push(imageUri);
          } else {
            // New image that needs uploading
            newImageURIs.push({
              uri: imageUri,
              index: index,
            });
          }
        });

        // Upload new images via MongoDB
        if (newImageURIs.length > 0) {
          const existingCount = existingImageURLs.length;
          setUploadProgress({ current: existingCount, total: images.length });

          console.log(`📤 Uploading ${newImageURIs.length} images via MongoDB API...`);
          console.log(`📍 API URL: ${MONGODB_API_BASE_URL}`);
          
          const filesToUpload = newImageURIs.map(({ uri }) => ({
            uri,
            type: 'image' as const,
          }));

          const uploadedURLs = await uploadMedia(filesToUpload, (progress) => {
            const current = existingCount + Math.round((progress / 100) * newImageURIs.length);
            setUploadProgress({ current, total: images.length });
          });

          // Check if we got valid URLs
          if (uploadedURLs && uploadedURLs.length > 0) {
            // Map uploaded URLs back to their original positions
            uploadedURLs.forEach((url, i) => {
              if (url && typeof url === 'string' && url.startsWith('http')) {
                uploadedImageURLs[newImageURIs[i].index] = url;
              }
            });

            const successfulUploads = uploadedURLs.filter(url => url && url.startsWith('http')).length;
            setUploadProgress({ current: existingCount + successfulUploads, total: images.length });
            console.log(`✅ Successfully uploaded ${successfulUploads}/${newImageURIs.length} images to MongoDB`);
          } else {
            throw new Error('Upload failed: No URLs returned from server');
          }

          // Verify all images uploaded
          const finalImageURLs = uploadedImageURLs.filter(url => url && (url.startsWith('http://') || url.startsWith('https://')));
          if (finalImageURLs.length < newImageURIs.length) {
            const failedCount = newImageURIs.length - (finalImageURLs.length - existingImageURLs.length);
            Alert.alert(
              'Some Images Failed',
              `${failedCount} image(s) failed to upload. ${finalImageURLs.length} image(s) were uploaded successfully.`,
              [{ text: 'OK', style: 'default' }]
            );
          }

          // Update to use final URLs
          uploadedImageURLs.splice(0, uploadedImageURLs.length, ...finalImageURLs);
        }
      }

      // Upload videos via MongoDB backend
      const uploadedVideoURLs: string[] = [];
      const newVideoURIs: { uri: string; index: number }[] = [];
      const existingVideoURLs: string[] = [];

      if (videos && videos.length > 0) {
        // Separate existing URLs from new local URIs
        videos.forEach((videoUri, index) => {
          if (videoUri.startsWith('http://') || videoUri.startsWith('https://')) {
            // Already uploaded - keep as is
            existingVideoURLs.push(videoUri);
            uploadedVideoURLs.push(videoUri);
          } else {
            // New video that needs uploading
            newVideoURIs.push({
              uri: videoUri,
              index: index,
            });
          }
        });

        // Upload new videos via MongoDB
        if (newVideoURIs.length > 0) {
          const totalItems = images.length + videos.length;
          const existingCount = existingVideoURLs.length + uploadedImageURLs.filter(url => url && url.startsWith('http')).length;
          setUploadProgress({ current: existingCount, total: totalItems });

          console.log(`📤 Uploading ${newVideoURIs.length} videos via MongoDB API...`);
          console.log(`📍 API URL: ${MONGODB_API_BASE_URL}`);
          
          const filesToUpload = newVideoURIs.map(({ uri }) => ({
            uri,
            type: 'video' as const,
          }));

          const uploadedURLs = await uploadMedia(filesToUpload, (progress) => {
            const current = existingCount + Math.round((progress / 100) * newVideoURIs.length);
            setUploadProgress({ current, total: totalItems });
          });

          // Check if we got valid URLs
          if (uploadedURLs && uploadedURLs.length > 0) {
            // Map uploaded URLs back to their original positions
            uploadedURLs.forEach((url, i) => {
              if (url && typeof url === 'string' && url.startsWith('http')) {
                uploadedVideoURLs[newVideoURIs[i].index] = url;
              }
            });

            const successfulUploads = uploadedURLs.filter(url => url && url.startsWith('http')).length;
            const newTotal = uploadedImageURLs.filter(url => url && url.startsWith('http')).length + successfulUploads;
            setUploadProgress({ current: newTotal, total: totalItems });
            console.log(`✅ Successfully uploaded ${successfulUploads}/${newVideoURIs.length} videos to MongoDB`);
          } else {
            throw new Error('Upload failed: No URLs returned from server');
          }

          // Verify all videos uploaded
          const finalVideoURLs = uploadedVideoURLs.filter(url => url && (url.startsWith('http://') || url.startsWith('https://')));
          if (finalVideoURLs.length < newVideoURIs.length) {
            const failedCount = newVideoURIs.length - (finalVideoURLs.length - existingVideoURLs.length);
            Alert.alert(
              'Some Videos Failed',
              `${failedCount} video(s) failed to upload. ${finalVideoURLs.length} video(s) were uploaded successfully.`,
              [{ text: 'OK', style: 'default' }]
            );
          }

          // Update to use final URLs
          uploadedVideoURLs.splice(0, uploadedVideoURLs.length, ...finalVideoURLs);
        }
      }

      // Prepare review data - use uploaded URLs (already filtered)
      const finalImages = uploadedImageURLs.filter((url): url is string =>
        url && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))
      );
      const finalVideos = uploadedVideoURLs.filter((url): url is string =>
        url && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))
      );

      const reviewData: {
        rating: number;
        message: string;
        emoji?: string;
        images?: string[];
        videos?: string[];
      } = {
        rating,
        message: message.trim(),
      };

      // Only add optional fields if they have values
      if (selectedEmoji && selectedEmoji.trim()) {
        reviewData.emoji = selectedEmoji.trim();
      }

      if (finalImages.length > 0) {
        reviewData.images = finalImages;
      }

      if (finalVideos.length > 0) {
        reviewData.videos = finalVideos;
      }

      console.log('📤 Submitting review with media:', {
        images: uploadedImageURLs.length,
        videos: uploadedVideoURLs.length,
      });

      await onSubmit(reviewData);
      console.log('✅ Review submitted successfully');
      onClose();
    } catch (error: any) {
      console.error('❌ Submit review error:', error);
      
      // Provide helpful error message based on error type
      let errorMessage = error.message || 'Failed to submit review';
      let errorTitle = 'Error';
      
      // Check if it's a backend connection error
      if (error.message?.includes('Cannot connect') || 
          error.message?.includes('Network') ||
          error.message?.includes('localhost') ||
          error.message?.includes('backend')) {
        errorTitle = 'Backend Not Running';
        errorMessage = 'Cannot connect to the upload server.\n\nTo fix this:\n1. Open a new terminal\n2. Run: cd backend && npm run dev\n3. Try uploading again\n\nMake sure your phone and computer are on the same Wi-Fi network.';
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayPress = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleOverlayPress}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Pressable
          style={styles.overlay}
          onPress={handleOverlayPress}
          accessible={false}
        >
          <Pressable
            style={styles.content}
            onPress={(e) => {
              e.stopPropagation();
            }}
            onStartShouldSetResponder={() => true}
            onResponderGrant={() => {
              // Dismiss keyboard when content area is pressed
              Keyboard.dismiss();
            }}
          >
            <View style={styles.header}>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.title}>Review: {dateNightTitle}</Text>
                {partnerId && (
                  <View style={styles.reviewStatusContainer}>
                    <View style={[styles.reviewStatusBadge, existingReview && styles.reviewStatusBadgeComplete]}>
                      <Ionicons
                        name={existingReview ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={existingReview ? theme.colors.success : theme.colors.textSecondary}
                      />
                      <Text style={[styles.reviewStatusText, existingReview && styles.reviewStatusTextComplete]}>
                        {userName || 'You'}
                      </Text>
                    </View>
                    <View style={[styles.reviewStatusBadge, partnerReview && styles.reviewStatusBadgeComplete]}>
                      <Ionicons
                        name={partnerReview ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={partnerReview ? theme.colors.success : theme.colors.textSecondary}
                      />
                      <Text style={[styles.reviewStatusText, partnerReview && styles.reviewStatusTextComplete]}>
                        {partnerName || 'Partner'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  onClose();
                }}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Show partner's review if available */}
            {partnerReview && (
              <View style={styles.partnerReviewSection}>
                <Text style={styles.partnerReviewTitle}>
                  {partnerName || 'Partner'}'s Review
                </Text>
                <View style={styles.partnerReviewContent}>
                  <View style={styles.partnerRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= partnerReview.rating ? 'star' : 'star-outline'}
                        size={20}
                        color={star <= partnerReview.rating ? '#FFD700' : theme.colors.border}
                      />
                    ))}
                  </View>
                  {partnerReview.emoji && (
                    <Text style={styles.partnerEmoji}>{partnerReview.emoji}</Text>
                  )}
                  <Text style={styles.partnerMessage}>{partnerReview.message}</Text>
                  {partnerReview.images && partnerReview.images.length > 0 && (
                    <View style={styles.partnerMediaGrid}>
                      {partnerReview.images.map((uri, index) => {
                        const [imageError, setImageError] = useState(false);

                        if (__DEV__) {
                          console.log(`🖼️ Loading partner review image ${index + 1}/${partnerReview.images?.length || 0}:`, {
                            uri: uri?.substring(0, 100),
                            isFirebaseURL: uri?.includes('firebasestorage') || uri?.includes('googleapis'),
                          });
                        }

                        return imageError ? (
                          <View key={index} style={[styles.partnerMediaPreview, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.divider }]}>
                            <Ionicons name="image-outline" size={20} color={theme.colors.textSecondary} />
                          </View>
                        ) : (
                          <Image
                            key={index}
                            source={{ uri }}
                            style={styles.partnerMediaPreview}
                            onError={(error) => {
                              console.error(`❌ Failed to load partner review image ${index + 1}:`, {
                                uri: uri?.substring(0, 100),
                                error: error.nativeEvent?.error || 'Unknown error',
                              });
                              setImageError(true);
                            }}
                            onLoad={() => {
                              if (__DEV__) {
                                console.log(`✅ Successfully loaded partner review image ${index + 1}`);
                              }
                            }}
                          />
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Reminder if partner hasn't reviewed yet */}
            {partnerId && !partnerReview && (
              <View style={styles.reminderBanner}>
                <Ionicons name="information-circle" size={20} color={theme.colors.info} />
                <Text style={styles.reminderText}>
                  {partnerName || 'Your partner'} hasn't reviewed this date yet. Both reviews are required.
                </Text>
              </View>
            )}

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              onScrollBeginDrag={Keyboard.dismiss}
            >
              {/* Rating */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={Keyboard.dismiss}
                style={styles.section}
              >
                <Text style={styles.label}>Rating *</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => {
                        Keyboard.dismiss();
                        setRating(star);
                      }}
                      style={styles.starButton}
                    >
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={40}
                        color={star <= rating ? '#FFD700' : theme.colors.border}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>

              {/* Emoji Selection */}
              <View style={styles.section}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={Keyboard.dismiss}
                >
                  <Text style={styles.label}>How did it feel? (Optional)</Text>
                </TouchableOpacity>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.emojiScroll}
                  keyboardShouldPersistTaps="handled"
                  onScrollBeginDrag={Keyboard.dismiss}
                >
                  <TouchableOpacity
                    style={[styles.emojiOption, !selectedEmoji && styles.emojiOptionActive]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setSelectedEmoji('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={24}
                      color={!selectedEmoji ? theme.colors.primary : theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                  {EMOJI_OPTIONS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiOption,
                        selectedEmoji === emoji && styles.emojiOptionActive,
                      ]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setSelectedEmoji(emoji);
                      }}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Message */}
              <View style={styles.section}>
                <Text style={styles.label}>Your Review *</Text>
                <Input
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Share your thoughts about this date..."
                  multiline
                  numberOfLines={5}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>

              {/* Images */}
              <View style={styles.section}>
                <Text style={styles.label}>Photos ({images.length}/10)</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePickImage();
                  }}
                  disabled={images.length >= 10}
                >
                  <Ionicons name="image-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.uploadButtonText}>Add Photos</Text>
                </TouchableOpacity>
                {images.length > 0 && (
                  <View style={styles.mediaGrid}>
                    {images.map((uri, index) => {
                      // Use URI as key for stable identity (URI is unique per image)
                      const imageKey = uri.substring(uri.length - 20) || `img-${index}`;
                      return (
                        <View key={`image-${imageKey}`} style={styles.mediaItem}>
                          <Image
                            source={{ uri }}
                            style={styles.mediaPreview}
                            resizeMode="cover"
                          />
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              Keyboard.dismiss();
                              handleRemoveImage(index);
                            }}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="close-circle" size={28} color={theme.colors.error} />
                          </TouchableOpacity>
                          {/* Image number badge */}
                          <View style={styles.mediaBadge}>
                            <Text style={styles.mediaBadgeText}>{index + 1}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Videos */}
              <View style={styles.section}>
                <Text style={styles.label}>Videos ({videos.length}/5)</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePickVideo();
                  }}
                  disabled={videos.length >= 5}
                >
                  <Ionicons name="videocam-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.uploadButtonText}>Add Videos</Text>
                </TouchableOpacity>
                {videos.length > 0 && (
                  <View style={styles.mediaGrid}>
                    {videos.map((uri, index) => {
                      // Use URI as key for stable identity (URI is unique per video)
                      const videoKey = uri.substring(uri.length - 20) || `vid-${index}`;
                      return (
                        <View key={`video-${videoKey}`} style={styles.mediaItem}>
                          <View style={styles.videoPreview}>
                            <Ionicons name="play-circle" size={40} color="#fff" />
                          </View>
                          {/* Video thumbnail - try to show if available */}
                          {uri && (
                            <Image
                              source={{ uri }}
                              style={[styles.mediaPreview, styles.videoThumbnail]}
                              resizeMode="cover"
                            />
                          )}
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              Keyboard.dismiss();
                              handleRemoveVideo(index);
                            }}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="close-circle" size={28} color={theme.colors.error} />
                          </TouchableOpacity>
                          {/* Video number badge */}
                          <View style={styles.mediaBadge}>
                            <Ionicons name="videocam" size={12} color="#fff" />
                            <Text style={styles.mediaBadgeText}>{index + 1}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

            </ScrollView>

            {/* Upload Progress Indicator */}
            {submitting && uploadProgress.total > 0 && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  Uploading {uploadProgress.current} of {uploadProgress.total} files...
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Fixed Action Buttons */}
            <View style={styles.actionsContainer}>
              <Button
                title="Cancel"
                onPress={() => {
                  Keyboard.dismiss();
                  onClose();
                }}
                variant="outline"
                style={{ flex: 1, marginRight: theme.spacing.sm }}
                disabled={submitting}
              />
              <Button
                title={existingReview ? 'Update Review' : 'Submit Review'}
                onPress={() => {
                  Keyboard.dismiss();
                  handleSubmit();
                }}
                variant="primary"
                loading={submitting}
                disabled={submitting || rating === 0 || !message.trim()}
                style={{ flex: 1, marginLeft: theme.spacing.sm }}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  reviewStatusContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  reviewStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.divider,
  },
  reviewStatusBadgeComplete: {
    backgroundColor: theme.colors.success + '20',
  },
  reviewStatusText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  reviewStatusTextComplete: {
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  partnerReviewSection: {
    backgroundColor: theme.colors.divider,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  partnerReviewTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  partnerReviewContent: {
    gap: theme.spacing.xs,
  },
  partnerRating: {
    flexDirection: 'row',
    gap: theme.spacing.xs / 2,
  },
  partnerEmoji: {
    fontSize: theme.typography.fontSize['2xl'],
  },
  partnerMessage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  partnerMediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  partnerMediaPreview: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.divider,
  },
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.info + '20',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.info,
  },
  reminderText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  starButton: {
    padding: theme.spacing.xs,
  },
  emojiScroll: {
    marginTop: theme.spacing.xs,
  },
  emojiOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    minWidth: 50,
    minHeight: 50,
  },
  emojiOptionActive: {
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  emojiText: {
    fontSize: 24,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    gap: theme.spacing.xs,
  },
  uploadButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  mediaItem: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: theme.spacing.xs,
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.divider,
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  mediaBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mediaBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  videoThumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.6,
  },
  progressContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  progressText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.divider,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
});

