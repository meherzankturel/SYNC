import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard iPhone 14 / iPhone 13 (390 x 844)
// This is a common baseline for current React Native development
const GUIDELINE_BASE_WIDTH = 390;
const GUIDELINE_BASE_HEIGHT = 844;

/**
 * Returns a linear scaled result of the provided size, based on your device's screen width.
 * Usage: Horizontal positioning, width, margins, paddingLeft/paddingRight
 */
const scale = (size: number) => {
    return (SCREEN_WIDTH / GUIDELINE_BASE_WIDTH) * size;
};

/**
 * Returns a linear scaled result of the provided size, based on your device's screen height.
 * Usage: Vertical positioning, height, marginTop/marginBottom
 */
const verticalScale = (size: number) => {
    return (SCREEN_HEIGHT / GUIDELINE_BASE_HEIGHT) * size;
};

/**
 * Sometimes you don't want to scale everything linearly.
 * moderateScale(10) -> 10 on standard, might be 15 on large (if factor is 0.5)
 * moderateScale(10, 0.1) -> Closer to the original value regardless of screen size
 * Usage: Font sizes, icon sizes, standard spacing where scale() might be too aggressive
 */
const moderateScale = (size: number, factor = 0.5) => {
    return size + (scale(size) - size) * factor;
};

/**
 * Specifically for fonts - keeps text readable but responsive.
 * Uses PixelRatio to ensure crisp text on high density screens.
 */
const fontScale = (size: number) => {
    const newSize = scale(size);
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize));
    } else {
        // Android font scaling can be tricky, moderateScale is often safer to prevent huge text
        return Math.round(PixelRatio.roundToNearestPixel(moderateScale(size, 0.5)));
    }
};

/**
 * Helper to get responsive dimensions
 */
export const wp = (percentage: number) => {
    const value = (percentage * SCREEN_WIDTH) / 100;
    return Math.round(value);
};

export const hp = (percentage: number) => {
    const value = (percentage * SCREEN_HEIGHT) / 100;
    return Math.round(value);
};

export const ResponsiveUtils = {
    scale,
    verticalScale,
    moderateScale,
    fontScale,
    wp,
    hp,
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    isSmallDevice: SCREEN_WIDTH < 375, // iPhone SE size or smaller
    isTablet: SCREEN_WIDTH > 768,      // iPad / Tablet
};
