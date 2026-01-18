# Date Reviews Feature

## Overview
The Dates tab now supports reviews for past dates. Both users can leave reviews with ratings, messages, emojis, and upload images/videos.

## Features

### 1. Upcoming Dates
- Shows all upcoming date nights
- Can edit, delete, or mark as complete
- FaceTime button available for virtual dates

### 2. Past Dates
- Shows all completed or past date nights
- **Review Button**: "Leave Review" or "Edit Review" (if already reviewed)
- Reviews section displays both users' reviews

### 3. Review Functionality

#### What Users Can Add:
- **Rating**: 1-5 stars (required)
- **Emoji**: Optional feeling emoji (💖, ❤️, 💕, etc.)
- **Message**: Detailed review text (required)
- **Photos**: Up to 10 images
- **Videos**: Up to 5 videos

#### Review Display:
- Shows both users' reviews under each past date
- Displays:
  - User name (or "You" for your own review)
  - Rating (stars)
  - Emoji (if provided)
  - Review message
  - Images/videos (if uploaded)

## How to Use

1. **Navigate to Dates Tab**
   - Tap the "Dates" tab in the bottom navigation

2. **View Past Dates**
   - Scroll to "Past" section
   - All completed or past dates are listed here

3. **Leave a Review**
   - Tap "Leave Review" button on any past date
   - Fill in:
     - Rating (tap stars 1-5)
     - Optional emoji
     - Review message
     - Optional photos/videos
   - Tap "Submit Review"

4. **Edit Your Review**
   - If you've already reviewed, button shows "Edit Review"
   - Tap to update your rating, message, or media

5. **View Partner's Review**
   - Reviews appear below the date card
   - See your partner's rating, message, and media

## Technical Details

### Firestore Collections

**`dateReviews` Collection:**
```typescript
{
  id: string;
  dateNightId: string;
  userId: string;
  userName?: string;
  rating: number; // 1-5
  message: string;
  emoji?: string;
  images?: string[]; // URLs (currently local URIs, should upload to Firebase Storage)
  videos?: string[]; // URLs (currently local URIs, should upload to Firebase Storage)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Services

**DateReviewService** (`src/services/dateReview.service.ts`):
- `createReview()` - Create a new review
- `getReviews()` - Get all reviews for a date night
- `updateReview()` - Update existing review
- `getUserReview()` - Get user's review for a date night
- `hasUserReviewed()` - Check if user already reviewed

### Components

**DateReviewModal** (`src/components/DateReviewModal.tsx`):
- Modal for creating/editing reviews
- Star rating selector
- Emoji picker
- Image/video upload
- Form validation

## Installation

Make sure to install the required package:

```bash
npx expo install expo-image-picker
```

## Future Enhancements

1. **Firebase Storage Integration**
   - Currently images/videos are stored as local URIs
   - Should upload to Firebase Storage and store URLs
   - Add progress indicators for uploads

2. **Review Notifications**
   - Notify partner when review is submitted
   - Show notification when partner reviews a date

3. **Review Analytics**
   - Average rating per date
   - Most reviewed dates
   - Review timeline

4. **Media Viewer**
   - Full-screen image viewer
   - Video player for uploaded videos

## Notes

- Reviews are automatically loaded when viewing past dates
- Each user can only have one review per date night
- Reviews are displayed in chronological order (newest first)
- Images/videos are currently stored as local URIs (need Firebase Storage for production)

