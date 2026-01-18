// Design System - "Echoes of Us" Theme
// Warm Cloud Palette - Calm, peaceful, soft mid-tones

export const theme = {
  colors: {
    // Primary - Muted mauve-gray
    primary: '#9A8F96',           // Main accent (muted mauve)
    primaryDark: '#7A7078',       // Pressed/hover state
    primaryLight: '#C0B5BC',      // Lighter variant (dusty pink)

    // Secondary - Soft sage-teal
    secondary: '#8FA5A0',         // Secondary actions
    secondaryDark: '#708885',     // Darker variant
    secondaryLight: '#B0C4C0',    // Lighter variant

    // Background - Warm cloud gray (mid-tone)
    background: '#EDEAE7',        // Main page background (90% light)
    backgroundAlt: '#E5E2DF',     // Alternate sections
    surface: '#F7F5F3',           // Cards, modals (soft cream)
    surfaceElevated: '#FFFFFF',   // Elevated cards (pure white)
    surfaceSoft: '#F2EFEC',       // Subtle surface

    // Text colors - Warm charcoal
    text: '#48444A',              // Primary text (warm charcoal)
    textSecondary: '#8A868E',     // Muted gray
    textMuted: '#A8A4AA',         // Very muted (placeholder)
    textLight: '#8A868E',         // Alias for compatibility
    textAccent: '#9A8F96',        // Accent text (mauve)
    textOnPrimary: '#FFFFFF',     // White on primary buttons

    // Accent colors
    accent: '#9A8F96',            // Same as primary
    accentPink: '#C4A5B0',        // Dusty rose (love/heart elements)
    accentMint: '#8AAA98',        // Soft sage (online)
    accentGold: '#C4AA8A',        // Warm muted gold
    accentSky: '#8AA5B8',         // Soft dusty blue

    // Status colors - Soft variants
    success: '#8AAA98',           // Muted sage green
    warning: '#C4AA8A',           // Muted warm gold
    error: '#C09090',             // Soft rose-red
    info: '#8AA5B8',              // Soft dusty blue

    // Online/Offline indicators
    online: '#8AAA98',            // Sage green dot
    offline: '#A8A4AA',           // Muted gray

    // Mood colors - Calm, muted versions
    moodHappy: '#C4B88A',         // Muted sunshine
    moodCalm: '#8AB0B8',          // Soft sky
    moodNeutral: '#A8A4AA',       // Neutral gray
    moodSad: '#9A94B0',           // Soft purple
    moodAnxious: '#C0A0A0',       // Dusty rose
    moodLoved: '#C4A5B0',         // Dusty pink
    moodExcited: '#C4AA8A',       // Muted gold
    moodGrateful: '#8AAA98',      // Sage green

    // Borders & Dividers
    border: '#DDD8D4',            // Warm gray border
    borderLight: '#E8E4E0',       // Very subtle
    divider: '#E0DBD7',           // Divider line

    // Special effects
    glow: 'rgba(154, 143, 150, 0.2)',        // Soft mauve glow
    glowStrong: 'rgba(154, 143, 150, 0.35)', // Stronger glow
    overlay: 'rgba(72, 68, 74, 0.5)',        // Dark overlay
    overlayLight: 'rgba(72, 68, 74, 0.25)',  // Light overlay
  },

  // Gradient definitions
  gradients: {
    // Soft neutral gradients
    background: ['#F7F5F3', '#EDEAE7'],
    surface: ['#FFFFFF', '#F7F5F3'],
    card: ['#FFFFFF', '#FAF8F6'],

    // Accent gradients
    primary: ['#C0B5BC', '#9A8F96'],
    rose: ['#D4B8C0', '#C4A5B0'],
    sage: ['#A5C0B8', '#8FA5A0'],

    // Photo overlay gradient
    photoOverlay: ['transparent', 'rgba(72, 68, 74, 0.4)'],

    // Memories screen soft gradient
    memories: ['#F5F0EC', '#EDE5E0', '#E5DDD8'],
    memoriesAlt: ['#F7F5F3', '#EDEAE7'],

    // Button gradients
    button: ['#A8A0A4', '#9A8F96'],
    buttonSoft: ['#F7F5F3', '#EDEAE7'],

    // Tab bar
    tabBar: ['#F7F5F3', '#EDEAE7'],

    // Calm cloud gradient
    cloud: ['#F7F5F3', '#EDEAE7', '#E5E2DF'],
  },

  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      rounded: 'System',
    },

    fontSize: {
      xs: 10,
      sm: 12,
      base: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 36,
      '5xl': 48,
    },

    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      heavy: '800' as const,
    },

    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },

    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
      wider: 1,
      widest: 2,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },

  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    pill: 50,
    full: 9999,
  },

  shadows: {
    // Soft, calm shadows
    sm: {
      shadowColor: '#48444A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#48444A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#48444A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 8,
    },
    // Soft glow effects
    glow: {
      shadowColor: '#9A8F96',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6,
    },
    glowStrong: {
      shadowColor: '#9A8F96',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 10,
    },
    // Lifted button
    lifted: {
      shadowColor: '#48444A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 8,
    },
  },

  animations: {
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },

    duration: {
      instant: 100,
      fast: 200,
      normal: 300,
      slow: 500,
      gentle: 700,
    },

    spring: {
      gentle: { tension: 40, friction: 7 },
      bouncy: { tension: 100, friction: 5 },
      stiff: { tension: 200, friction: 10 },
    },
  },

  // Card preset styles
  cards: {
    default: {
      backgroundColor: '#F7F5F3',
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: '#DDD8D4',
    },
    elevated: {
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      padding: 20,
    },
    organic: {
      backgroundColor: '#F7F5F3',
      borderRadius: 28,
      padding: 20,
    },
  },

  // Component-specific tokens
  components: {
    // Tab bar
    tabBar: {
      height: 80,
      fabSize: 56,
      iconSize: 24,
    },

    // Avatar
    avatar: {
      sm: 32,
      md: 48,
      lg: 64,
      xl: 80,
      borderWidth: 3,
    },

    // Input
    input: {
      height: 48,
      borderRadius: 12,
    },

    // Button
    button: {
      heightSm: 36,
      heightMd: 44,
      heightLg: 52,
    },
  },
};

export type Theme = typeof theme;

// Helper function to get gradient colors array
export const getGradient = (name: keyof typeof theme.gradients): string[] => {
  return theme.gradients[name] as string[];
};
