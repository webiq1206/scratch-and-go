# Scratch & Go - App Guide

## Overview

**Scratch & Go** is a mobile-first activity suggestion app that helps couples and families discover personalized date nights and activities. Users scratch interactive cards to reveal AI-generated activity ideas tailored to their preferences, location, and filters.

### Core Concept

- **Scratch-to-Reveal Mechanic**: Interactive scratch cards make discovering activities fun and engaging
- **Two Modes**: Couples Mode (date nights) and Family Mode (family activities)
- **AI-Powered**: Uses AI to generate personalized, location-aware activity suggestions
- **Freemium Model**: 3 free scratches per month, with premium option for unlimited access

---

## Key Features

### 1. Welcome & Onboarding Flow

**File**: `app/welcome.tsx`

- Beautiful welcome screen with polaroid image grid and gradient overlay
- Mode selection (Couples or Family)
- Preference questionnaire covering:
  - Alcohol-related activities
  - Religious/faith-based activities
  - Gambling activities
  - Weapons-related activities
- Preferences stored in AsyncStorage and used to filter AI suggestions

### 2. Mode Selection

**File**: `app/(main)/(home)/index.tsx`

Users can choose between:
- **Couples Mode**: Date night ideas, romantic activities, partner experiences
- **Family Mode**: Kid-friendly activities, educational experiences, family bonding

Mode can be changed anytime and is persisted across sessions.

### 3. Scratch Card Interaction

**Component**: `components/ui/ScratchCard.tsx`

- Interactive scratch-off layer with shimmer effect
- Golden gradient scratch surface
- Reveals AI-generated activity underneath
- Smooth animation and touch feedback

### 4. Activity Generation

**Context**: `contexts/ActivityContext.tsx`

AI-powered activity generation using `@rork-ai/toolkit-sdk`:
- Generates activities based on user filters and preferences
- Considers current location, season, and user history
- Respects content restrictions from user preferences
- Includes title, description, emoji, cost, duration, and pro tips

**Activity Filters:**
- **Category**: Any, Chill, Active, Creative, Foodie/Educational, Adventure/Outdoor
- **Budget**: Any, Free, $, $$, $$$
- **Timing**: Anytime, Quick (1-2h), Half Day, Full Day

### 5. Location-Based Suggestions

**Context**: `contexts/LocationContext.tsx`

- Automatic location detection (with permission)
- Manual location selection via `LocationSelector` component
- Location stored in AsyncStorage
- Activities personalized to local attractions, weather, and regional features
- Cross-platform: Uses native APIs on mobile, web geolocation API on web

### 6. Scratch Limit System

- 3 free scratches per month
- Counter resets monthly
- Stored in AsyncStorage with month tracking
- Alert shown when limit reached with upgrade prompt

### 7. Memory Book (Coming Soon)

**File**: `app/(main)/memory-book.tsx`

Placeholder for saved activities and adventure history.

---

## Architecture

### State Management

The app uses a modern, clean state management approach:

1. **Context Providers** (`@nkzw/create-context-hook`)
   - `ActivityContext` - Activity generation, history, scratch count
   - `PreferencesContext` - User preferences and content restrictions
   - `LocationContext` - Location detection and management

2. **React Query** (`@tanstack/react-query`)
   - Used for async mutations (activity generation)
   - Handles loading states automatically

3. **AsyncStorage** (`@react-native-async-storage/async-storage`)
   - Persists mode selection, preferences, location
   - Stores scratch count and activity history

### File Structure

```
app/
├── (main)/                      # Main app screens
│   ├── _layout.tsx             # Main layout with context providers
│   ├── (home)/                 # Home tab with nested stack
│   │   ├── _layout.tsx         # Home stack layout
│   │   └── index.tsx           # Main scratch screen
│   └── memory-book.tsx         # Saved activities (future)
├── welcome.tsx                 # Onboarding flow
├── _layout.tsx                 # Root layout
└── +not-found.tsx              # 404 screen

components/
└── ui/
    ├── ScratchCard.tsx         # Interactive scratch card
    ├── FilterPill.tsx          # Filter selection pills
    ├── LocationSelector.tsx    # Location picker
    ├── Card.tsx                # Generic card component
    ├── Button.tsx              # Button component
    └── LoadingSpinner.tsx      # Loading indicator

contexts/
├── ActivityContext.tsx         # Activity generation & history
├── PreferencesContext.tsx      # User preferences
└── LocationContext.tsx         # Location management

constants/
├── colors.ts                   # Color palette
├── typography.ts               # Typography scale
├── spacing.ts                  # Spacing system
└── design.ts                   # Border radius, shadows

types/
├── activity.ts                 # Activity, filters, location types
└── preferences.ts              # User preferences types
```

---

## Design System

### Colors

**File**: `constants/colors.ts`

The app uses a sophisticated dark theme with pink accents:

- **Background**: `#000000` (pure black) and `#1A1A1A` (dark gray)
- **Primary**: `#FF6B9D` (pink) with gradient to `#FFB3D9`
- **Text**: `#FFFFFF` (white) and `#B8B8B8` (light gray)
- **Cards**: `#262626` with `#3A3A3A` borders
- **Accent**: `#FBBF24` (gold/yellow for highlights)

### Typography

**File**: `constants/typography.ts`

- **Font Weight**: Consistently `400` (regular) throughout the entire app
- **Sizes**:
  - Hero: 32px
  - H1: 28px
  - H2: 24px
  - H3: 20px
  - Body: 16px
  - Caption: 14px
  - Small: 12px

### Spacing

**File**: `constants/spacing.ts`

Consistent spacing scale: xs (4), sm (8), md (12), lg (16), xl (24), xxl (32)

### Visual Elements

1. **Gradient Overlays**
   - Welcome screen: `rgba(0,0,0,0.2)` → `rgba(0,0,0,0.5)` → `rgba(0,0,0,0.85)` → `#000000`
   - Creates depth and ensures text readability over images

2. **Polaroid Images**
   - White frames with shadow effects
   - Used for mode selection cards
   - Grid layout on welcome screen

3. **Scratch Card**
   - Golden gradient: `#FFD700` → `#FFA500` → `#FF8C00` → `#FFD700`
   - Shimmer animation effect
   - Sparkles icon and "Scratch Me" text

---

## How Activity Generation Works

### Flow

1. User selects filters (category, budget, timing)
2. User scratches the card
3. `ActivityContext.generateActivity()` is called
4. AI generates activity using `generateObject()` from `@rork-ai/toolkit-sdk`
5. System prompt includes:
   - Mode (couples/family)
   - User filters
   - Location context
   - Content restrictions from preferences
   - Activity history (to avoid repeats)
   - Current season
6. Activity is validated against Zod schema
7. Result displayed in scratch card reveal

### Activity Schema

```typescript
{
  title: string,           // 3-6 words
  description: string,     // 2-3 sentences
  emoji: string,           // Single emoji
  cost: 'free' | '$' | '$$' | '$$$',
  duration: string,        // e.g., "1-2 hours"
  supplies?: string,       // Optional supplies needed
  proTip: string,         // Enhancement tip
  category: string        // Activity category
}
```

---

## Platform Compatibility

### Web Support

The app is fully compatible with React Native Web:

- **Location**: Uses web geolocation API on web, native `expo-location` on mobile
- **Storage**: AsyncStorage works across all platforms
- **Animations**: Uses React Native's Animated API (web-compatible)
- **Responsive**: Adapts to screen sizes using `Dimensions`

### Polyfills

The following APIs are polyfilled for web compatibility:
- AsyncStorage (polyfilled with localStorage)
- Basic touch gestures and interactions

---

## Customization Guide

### Adding New Filter Options

**File**: `app/(main)/(home)/index.tsx`

```typescript
// Add to categories array
const categories = mode === 'couples' 
  ? ['Any', 'Chill', 'Active', 'Creative', 'Foodie', 'Adventure', 'YOUR_NEW_CATEGORY']
  : ['Any', 'Chill', 'Active', 'Creative', 'Educational', 'Outdoor', 'YOUR_NEW_CATEGORY'];
```

### Adding New Preference Questions

**File**: `types/preferences.ts`

1. Add to `UserPreferences` interface
2. Add to `DEFAULT_PREFERENCES`
3. Add new question to `ONBOARDING_QUESTIONS` array
4. Update `getContentRestrictions()` in `contexts/PreferencesContext.tsx`

### Customizing Colors

**File**: `constants/colors.ts`

Update the color object with your brand colors. The system automatically applies them throughout the app.

### Changing Scratch Limit

**File**: `contexts/ActivityContext.tsx`

```typescript
// Change limit from 3 to your desired number
const FREE_SCRATCH_LIMIT = 3; // Change this value

// Update in multiple locations:
if (scratchCount >= FREE_SCRATCH_LIMIT) { ... }
isLimitReached: scratchCount >= FREE_SCRATCH_LIMIT,
remainingScratches: Math.max(0, FREE_SCRATCH_LIMIT - scratchCount),
```

---

## Key Technical Decisions

### Why @nkzw/create-context-hook?

- Reduces boilerplate for React Context
- Automatic type safety
- Cleaner API than raw Context
- Easy to combine with React Query and AsyncStorage

### Why React Query for Mutations?

- Automatic loading state management
- Better error handling
- Consistent patterns across the app
- Future-ready for server state

### Why AsyncStorage?

- Cross-platform (web, iOS, Android)
- Simple API for local persistence
- Perfect for preferences and small data
- No setup required

### Design Philosophy

1. **Mobile-First**: Optimized for mobile screens and touch interactions
2. **Font Weight 400**: Consistent, clean typography throughout
3. **Dark Theme**: Reduces eye strain, modern aesthetic
4. **Interactive Elements**: Scratch cards make discovery fun
5. **Location-Aware**: Activities feel relevant and local

---

## Future Enhancements

### Planned Features

1. **Memory Book Implementation**
   - Save favorite activities
   - Share activities with friends
   - Mark activities as "completed"

2. **Premium Subscription**
   - Unlimited scratches
   - Exclusive activity categories
   - Advanced filters

3. **Social Features**
   - Share activities
   - Activity ratings and reviews
   - Community suggestions

4. **Enhanced Personalization**
   - Learning from saved activities
   - Time-of-day recommendations
   - Weather-aware suggestions

---

## Environment & Dependencies

### Core Dependencies

- **expo**: ~54.0.0 - Expo SDK
- **react-native**: 0.76.5 - React Native core
- **expo-router**: ~4.0.15 - File-based routing
- **@tanstack/react-query**: ^5.62.12 - Server state management
- **@rork-ai/toolkit-sdk**: ^0.0.34 - AI generation
- **@nkzw/create-context-hook**: ^0.2.1 - Context helper
- **expo-linear-gradient**: ~14.0.1 - Gradients
- **lucide-react-native**: ^0.468.0 - Icons
- **zod**: ^3.24.1 - Schema validation

### Development

```bash
# Install dependencies
bun install

# Start development server
bun run start

# Start web preview
bun run start-web

# Run on iOS
bun run start -- --ios

# Run on Android
bun run start -- --android
```

---

## Testing Your Changes

### Quick Test Checklist

1. **Welcome Flow**
   - Test onboarding questionnaire
   - Verify preference saving
   - Check mode selection

2. **Scratch Card**
   - Test scratch interaction
   - Verify activity generation
   - Check loading states

3. **Filters**
   - Test all filter combinations
   - Verify filter persistence

4. **Location**
   - Test auto-detection
   - Test manual location entry
   - Verify location in suggestions

5. **Scratch Limit**
   - Use 3 scratches
   - Verify limit alert
   - Test monthly reset

### Debug Tips

- Check console logs for AI generation details
- AsyncStorage can be inspected in React Native Debugger
- Use `console.log()` extensively in contexts for state tracking

---

## Support & Resources

- **Expo Documentation**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/
- **React Query Docs**: https://tanstack.com/query/latest
- **Rork Support**: https://rork.com/faq

---

## Credits

Built with ❤️ using React Native, Expo, and AI-powered activity generation.

**Version**: 1.0.0  
**Last Updated**: December 2024
