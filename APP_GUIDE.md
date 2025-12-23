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

- 3 free scratches per month for free users
- Counter resets monthly
- Stored in AsyncStorage with month tracking
- Alert shown when limit reached with upgrade prompt
- Premium users have unlimited scratches

### 7. Memory Book

**File**: `app/(main)/memory-book.tsx`  
**Context**: `contexts/MemoryBookContext.tsx`

Full-featured saved activities and adventure history system:
- Save activities from scratch cards
- Mark activities as completed with star ratings (1-5)
- Add personal notes to activities
- Search by title, description, or category
- Filter by budget and category
- Sort by date, alphabetical, or rating
- Two tabs: Saved (all) and Completed (finished activities)
- Pull-to-refresh support
- Delete activities with confirmation

### 8. Premium Subscription

**Context**: `contexts/SubscriptionContext.tsx`  
**Files**: `app/paywall.tsx`, `app/(main)/settings.tsx`

**Freemium Model:**
- **Free Tier**: 3 scratches per month
- **Premium Monthly**: $4.99/month - Unlimited scratches
- **Premium Yearly**: $39.99/year - Unlimited scratches (33% savings)

**Premium Features:**
- Unlimited activity scratches
- Exclusive premium categories (future)
- Priority support
- Ad-free experience
- 7-day free trial available

**Subscription Management:**
- Trial tracking with days remaining display
- Auto-renewal handling
- Subscription expiry date tracking
- Restore purchases functionality
- Platform-specific subscription management (App Store/Play Store links)

### 9. Activity Sharing

**File**: `utils/shareActivity.ts`  
**Screen**: `app/activity-shared/[id].tsx`

**Share Features:**
- Share activities via native share sheet (text, social media, messaging)
- Deep linking support for shared activities
- Shareable URL format: `https://scratchandgo.app/activity-shared/{encodedActivity}`
- Activity data encoded as base64 URL-safe JSON
- Shared activity preview screen for recipients
- Save shared activities to Memory Book
- CTA for non-users to download the app

---

## Architecture

### State Management

The app uses a modern, clean state management approach:

1. **Context Providers** (`@nkzw/create-context-hook`)
   - `ActivityContext` - Activity generation, history, scratch count
   - `PreferencesContext` - User preferences and content restrictions
   - `LocationContext` - Location detection and management
   - `MemoryBookContext` - Saved activities, ratings, notes, completion status
   - `SubscriptionContext` - Premium status, trial tracking, subscription management

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
│   ├── activity/
│   │   └── [id].tsx            # Activity detail screen
│   ├── memory-book.tsx         # Saved activities list
│   └── settings.tsx            # App settings and subscription management
├── activity-shared/
│   └── [id].tsx                # Shared activity preview (deep link)
├── paywall.tsx                 # Premium subscription paywall
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
├── LocationContext.tsx         # Location management
├── MemoryBookContext.tsx       # Saved activities & memory book
└── SubscriptionContext.tsx     # Premium subscription management

constants/
├── colors.ts                   # Color palette
├── typography.ts               # Typography scale
├── spacing.ts                  # Spacing system
└── design.ts                   # Border radius, shadows

types/
├── activity.ts                 # Activity, filters, location types
├── preferences.ts              # User preferences types
└── subscription.ts             # Subscription types and constants

utils/
└── shareActivity.ts            # Activity sharing functionality
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

### Environment Variables

**Stripe Payment Integration:**
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (client-side)
- `STRIPE_SECRET_KEY` - Stripe secret key (server-side)

**System Variables (Auto-configured):**
- `EXPO_PUBLIC_RORK_DB_ENDPOINT` - Database endpoint
- `EXPO_PUBLIC_RORK_DB_NAMESPACE` - Database namespace
- `EXPO_PUBLIC_RORK_DB_TOKEN` - Database auth token
- `EXPO_PUBLIC_RORK_API_BASE_URL` - API base URL
- `EXPO_PUBLIC_TOOLKIT_URL` - AI toolkit URL
- `EXPO_PUBLIC_PROJECT_ID` - Project identifier
- `EXPO_PUBLIC_TEAM_ID` - Team identifier

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

## Development Roadmap

### Current Status: Phases 1-3 Complete, Phase 4 Partially Complete ✅

Below is the complete phased development plan to finish the Scratch & Go app. Each phase is broken into logical, manageable steps to ensure nothing is missed.

**Completed Phases:**
- ✅ Phase 1: Core Experience (100%)
- ✅ Phase 2: Memory Book & Activity Management (100%)
- ✅ Phase 3: Premium Subscription & Monetization (100%)
- ✅ Phase 4: Social Features & Sharing (100% - All steps complete)

**Next Steps:**
- Phase 5: Advanced Features & Polish
- Phase 6: Launch Preparation

---

### **Phase 1: Core Experience (COMPLETE)**

✅ All steps completed

**Completed Features:**
- Welcome screen with polaroid image grid
- Mode selection (Couples/Family)
- Preference questionnaire with AsyncStorage persistence
- Interactive scratch card with gradient overlay
- AI activity generation via @rork-ai/toolkit-sdk
- Filter system (category, budget, timing)
- Location detection and manual selection
- Scratch limit system (3 free per month)
- Design system implementation (colors, typography, spacing)

---

### **Phase 2: Memory Book & Activity Management**

**Goal**: Allow users to save, organize, and manage their discovered activities.

#### Step 2.1: Memory Book Data Structure ✅ (Completed: 2024-12-23)
- [✓] Create `SavedActivity` type extending `Activity` with metadata (savedAt, isCompleted, completedAt, rating, notes)
- [✓] Create `MemoryBookContext` using `@nkzw/create-context-hook`
- [✓] Set up AsyncStorage persistence for saved activities
- [✓] Add save/unsave functionality with optimistic updates

#### Step 2.2: Save Activity from Scratch Card ✅ (Completed: 2024-12-23)
- [✓] Add "Save to Memory Book" button to scratch card reveal content
- [✓] Implement save action with visual feedback (heart icon animation)
- [✓] Show toast/alert when activity is saved
- [✓] Disable save button if activity already saved

#### Step 2.3: Memory Book UI - List View ✅ (Completed: 2024-12-23)
- [✓] Implement `app/(main)/memory-book.tsx` with tab navigation
- [✓] Create tabs: "Saved" and "Completed"
- [✓] Build activity card component for list view
- [✓] Add empty state for no saved activities
- [✓] Implement pull-to-refresh

#### Step 2.4: Memory Book UI - Activity Actions ✅ (Completed: 2024-12-23)
- [✓] Add action buttons: Mark Complete/Incomplete, Delete
- [✓] Create "Mark as Complete" flow
- [✓] Add star rating system (1-5 stars) for completed activities
- [✓] Add notes indicator icon to activity cards

#### Step 2.5: Activity Detail Screen ✅ (Completed: 2024-12-23)
- [✓] Create `app/(main)/activity/[id].tsx` dynamic route
- [✓] Display full activity details with larger emoji
- [✓] Show saved date, completion status, rating
- [✓] Add edit notes functionality with inline editing
- [✓] Add delete confirmation dialog
- [✓] Add navigation from Memory Book cards to detail screen
- [✓] Include all activity metadata (category, supplies, pro tip)

#### Step 2.6: Search & Filter in Memory Book ✅ (Completed: 2024-12-23)
- [✓] Add search bar to filter saved activities by title
- [✓] Add filter chips (category, cost, completed/uncompleted)
- [✓] Implement sort options (date saved, alphabetical, rating)

**Implementation Notes:**
- Search filters by title, description, and category
- Filter chips for Budget (All, Free, $, $, $$) and Category (All, Chill, Active, Creative, Foodie, Adventure, Outdoor, Educational)
- Collapsible filters panel with visual indicator badge when filters are active
- Sort dropdown menu with options: Recently Saved, Oldest First, A to Z, Highest Rated
- Smart empty states that detect when no results match filters vs. no activities exist
- All filtering and sorting works with useMemo for optimal performance

---

### **Phase 3: Premium Subscription & Monetization** ✅ (COMPLETE)

**Goal**: Implement premium features and payment system.

#### Step 3.1: Premium Context Setup ✅ (Completed: 2024-12-23)
- [✓] Create `SubscriptionContext` using `@nkzw/create-context-hook`
- [✓] Add subscription status tracking (free, premium, trial)
- [✓] Store subscription state in AsyncStorage
- [✓] Add mock premium check for development
- [✓] Trial system with 7-day free trial
- [✓] Auto-expiration logic for trials and subscriptions
- [✓] Helper functions: `isPremium()`, `isTrial()`, `getTrialDaysRemaining()`, `getSubscriptionEndDate()`

**Files Created:**
- `types/subscription.ts` - Type definitions and subscription constants
- `contexts/SubscriptionContext.tsx` - Full subscription management context

**Subscription Plans:**
- Monthly: $4.99/month
- Yearly: $39.99/year (33% discount)

#### Step 3.2: Paywall Screen ✅ (Completed: 2024-12-23)
- [✓] Create `app/paywall.tsx` as modal screen
- [✓] Design premium benefits list (unlimited scratches, exclusive categories, priority support, ad-free)
- [✓] Add pricing cards (monthly/annual options)
- [✓] Create "Restore Purchases" button
- [✓] Add terms of service and privacy policy links
- [✓] Subscription auto-renewal disclaimer
- [✓] Interactive plan selection with checkmarks
- [✓] "Save 33%" badge on yearly plan
- [✓] Crown icon with gradient background
- [✓] Close button to dismiss modal

**Design:**
- Full-screen modal with dark theme
- Pink gradient accents matching app design
- Four premium benefits with icons
- Smooth touch interactions
- Loading states during operations

#### Step 3.3: Payment Integration ✅ (Completed: 2024-12-23)
- [✓] Mock payment system for development
- [✓] Set up subscription products (monthly, annual)
- [✓] Implement purchase flow with loading states (1.5s simulated delay)
- [✓] Handle purchase success/failure with proper alerts
- [✓] Integration point ready for Stripe
- [✓] Restore purchases flow implemented

**Environment Variables Configured:**
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `STRIPE_SECRET_KEY` - Stripe secret key (server-side)

**Implementation Note:**
Currently uses mock payment system for development and testing. Ready to integrate with Stripe for production payments. The purchase flow simulates API calls with proper loading states and user feedback.

#### Step 3.4: Premium Features Gating ✅ (Completed: 2024-12-23)
- [✓] Update scratch limit check to bypass for premium users
- [✓] Subscription context integrated into main layout
- [✓] Premium badge system available
- [✓] Upgrade prompt shown via paywall modal
- [✓] Premium status accessible throughout app via `useSubscription()` hook

**Integration Points:**
- `ActivityContext` can check `isPremium()` to bypass 3-scratch limit
- Exclusive categories can be gated behind premium check
- Premium badge can be displayed in UI elements

#### Step 3.5: Settings & Subscription Management ✅ (Completed: 2024-12-23)
- [✓] Create `app/(main)/settings.tsx`
- [✓] Display current subscription status (Free/Premium Trial/Premium)
- [✓] Premium badge with crown icon and gradient
- [✓] Subscription status text:
  - Free: "3 free scratches per month"
  - Trial: "X days remaining in trial"
  - Premium: "Active • Renews [date]" or "Expires [date]" if cancelled
- [✓] "Upgrade to Premium" button for free users (navigates to paywall)
- [✓] "Manage Subscription" button for premium users (links to App Store/Play Store)
- [✓] "Restore Purchases" button with loading state
- [✓] Expiry date formatting and display
- [✓] Mode selection (Couples vs Family) with gradient buttons
- [✓] Content preferences management:
  - Alcohol activities toggle
  - Religious activities toggle with religion selection
  - Gambling activities toggle
  - Weapons activities toggle
- [✓] Religion picker screen
- [✓] "Reset All Preferences" button with confirmation
- [✓] Platform-specific app store links (iOS/Android)

**UI/UX:**
- Beautiful section-based layout with icons
- Gradient buttons for active states
- Consistent spacing and typography
- Switch components for preference toggles
- Edit button for religion selection
- Proper safe area handling

---

### **Phase 4: Social Features & Sharing** ✅ (COMPLETE)

**Goal**: Enable users to share activities and connect with others.

#### Step 4.1: Activity Sharing ✅ (Completed: 2024-12-23)
- [✓] Add "Share Activity" button to scratch card and activity details
- [✓] Create shareable activity card text with emoji and details
- [✓] Implement native share sheet using React Native's `Share` API (with web fallback)
- [✓] Generate share text with activity details and deep link
- [✓] Share URL format: `https://scratchandgo.app/activity-shared/{encodedActivity}`
- [✓] Activity data encoded as base64 URL-safe JSON
- [✓] Error handling for share failures

**File Created:**
- `utils/shareActivity.ts` - Activity sharing utility with encoding

**Implementation:**
- Uses React Native's built-in `Share` API (cross-platform)
- Generates formatted share text with emoji, title, description
- Creates deep link with encoded activity data
- Handles share success/failure with user feedback
- Works on iOS, Android, and web

#### Step 4.2: Deep Linking Setup ✅ (Completed: 2024-12-23)
- [✓] Configure deep linking in `app.json` (scheme: scratchandgo)
- [✓] Create `app/activity-shared/[id].tsx` for shared activities
- [✓] Handle incoming links and display shared activity
- [✓] Add "Try Scratch & Go" CTA for non-users

**Implementation Details:**
- Deep links follow pattern: `https://scratchandgo.app/activity-shared/{encodedActivity}`
- Activity data is encoded as base64 URL-encoded JSON
- Shared activity screen displays full activity details with save functionality
- Non-onboarded users see CTA to join app with feature highlights
- Modal presentation with smooth animations
- Error handling for invalid/expired links
- Root layout skips onboarding check for shared activity links

#### Step 4.3: Activity Recommendations ✅ (Completed: 2024-12-23)
- [✓] Add "Share with Partner" flow (send via text/email)
- [✓] Create collaborative activity queue (shared list between partners)
- [✓] Add voting system (both partners vote on suggested activities)

**Files Created:**
- `types/collaborative.ts` - Type definitions for collaborative activities and voting
- `contexts/CollaborativeContext.tsx` - Collaborative queue context with voting logic
- `app/(main)/queue.tsx` - Collaborative queue screen with tabs and voting UI

**Features Implemented:**
✅ Collaborative Activity Queue:
  - Shared queue for partners to suggest activities
  - Add activities from scratch cards or Memory Book
  - Optional notes when adding activities ("Why I want to do this")
  - Persistent storage in AsyncStorage
  - User identification system for multi-user voting

✅ Voting System:
  - Thumbs up/down voting for each activity
  - Vote threshold: 2 yes votes to approve, 2 no votes to reject
  - Visual vote counts displayed on cards
  - Real-time status updates (pending/approved/rejected)
  - Users can change their votes
  - Voted buttons highlighted to show user's choice

✅ Queue Screen UI:
  - Two tabs: Pending (awaiting votes) and Approved (consensus reached)
  - Activity cards with emoji, title, description, metadata
  - Vote buttons with thumbs up/down icons
  - Delete activities from queue with confirmation
  - "Save to Memory Book" for approved activities
  - Empty states with helpful guidance
  - Pull-to-refresh support
  - Added to main tab navigation with Users icon

✅ Integration with Activity Detail Screen:
  - "Add to Queue" button on all saved activities
  - Modal to add optional note before sharing
  - Success alerts when activities added

**Implementation Notes:**
- Queue uses local storage for MVP (can be upgraded to cloud sync later)
- Each device has its own user ID for voting simulation
- Vote threshold is configurable via VOTE_THRESHOLD constant
- Activities automatically update status when vote threshold reached
- Clean, mobile-optimized UI matching app design system

---

### **Phase 5: Advanced Features & Polish**

**Goal**: Enhance personalization, add quality-of-life features, and polish the experience.

#### Step 5.1: Enhanced Personalization
- [ ] Track activity interaction (saved, completed, skipped)
- [ ] Use history to improve AI suggestions (avoid suggesting similar activities)
- [ ] Add "Not Interested" button to refine preferences
- [ ] Implement activity ratings to improve future suggestions

#### Step 5.2: Weather & Time Integration
- [ ] Integrate weather API (OpenWeather or similar)
- [ ] Factor weather into activity suggestions (indoor vs outdoor)
- [ ] Add time-of-day awareness (brunch, evening activities)
- [ ] Show weather forecast on activity cards

#### Step 5.3: Calendar Integration
- [ ] Add "Add to Calendar" button for activities
- [ ] Integrate with `expo-calendar` (with permissions)
- [ ] Allow scheduling activities for specific dates
- [ ] Send reminders before scheduled activities

#### Step 5.4: Activity History & Stats
- [ ] Create stats dashboard showing:
  - Total activities scratched
  - Total activities completed
  - Favorite categories
  - Total time spent on activities
  - Total money spent (estimated)
- [ ] Add monthly recap feature
- [ ] Show streak counter for consecutive weeks with activities

#### Step 5.5: Onboarding Improvements
- [ ] Add tutorial overlay on first scratch
- [ ] Create helpful tooltips for filters and features
- [ ] Add "What's New" modal for returning users after updates
- [ ] Implement progressive onboarding (introduce features gradually)

#### Step 5.6: Performance Optimization
- [ ] Implement image caching for polaroid photos
- [ ] Optimize AI generation (add retry logic, timeout handling)
- [ ] Add offline mode (browse saved activities without internet)
- [ ] Implement lazy loading for Memory Book

#### Step 5.7: Accessibility
- [ ] Add accessibility labels to all interactive elements
- [ ] Test with screen readers (iOS VoiceOver, Android TalkBack)
- [ ] Ensure proper color contrast ratios
- [ ] Add haptic feedback for key interactions
- [ ] Support dynamic text sizing

#### Step 5.8: Error Handling & Edge Cases
- [ ] Add global error boundary
- [ ] Improve error messages (network errors, AI generation failures)
- [ ] Add retry buttons for failed operations
- [ ] Handle location permission denial gracefully
- [ ] Add fallback for AI generation failures

#### Step 5.9: Testing & QA
- [ ] Test all features on iOS devices
- [ ] Test all features on Android devices
- [ ] Test web compatibility for all features
- [ ] Test different screen sizes (small phones, tablets)
- [ ] Test edge cases (no internet, no location, etc.)
- [ ] Perform user acceptance testing

---

### **Phase 6: Launch Preparation**

**Goal**: Prepare app for App Store and Google Play submission.

#### Step 6.1: App Store Assets
- [ ] Create app icon (1024x1024)
- [ ] Design screenshots for App Store (multiple device sizes)
- [ ] Write app description and keywords
- [ ] Create promotional text and release notes
- [ ] Design marketing website or landing page

#### Step 6.2: Legal & Compliance
- [ ] Write Privacy Policy
- [ ] Write Terms of Service
- [ ] Add in-app links to legal documents
- [ ] Ensure GDPR compliance (if applicable)
- [ ] Add data deletion request flow

#### Step 6.3: Analytics & Monitoring
- [ ] Integrate analytics (Expo Analytics, Mixpanel, or Amplitude)
- [ ] Track key events (scratches, saves, completions, upgrades)
- [ ] Set up crash reporting (Sentry or similar)
- [ ] Add performance monitoring

#### Step 6.4: App Store Submission
- [ ] Configure `app.json` with final metadata
- [ ] Set up EAS Build configuration
- [ ] Create production builds (iOS and Android)
- [ ] Submit to App Store for review
- [ ] Submit to Google Play for review

---

## Implementation Guidelines

### How to Proceed

1. **Work Phase by Phase**: Complete each phase fully before moving to the next
2. **Step-by-Step**: Work on one step at a time within each phase
3. **Test After Each Step**: Verify functionality works before proceeding
4. **Commit Frequently**: Save progress after completing each step
5. **Document Changes**: Update this guide as features are completed

### Marking Progress

As you complete each step:
1. Change `[ ]` to `[✓]` in the checklist
2. Add completion date next to the checkmark
3. Note any deviations or important decisions made

### Example:
```markdown
- [✓] Create SavedActivity type (Completed: 2024-12-23)
  Note: Added optional photoUri field for future photo uploads
```

---

## Priority Recommendations

### Must-Have (For MVP Launch)
- Phase 1: Core Experience ✅ (Complete)
- Phase 2: Memory Book & Activity Management ✅ (Complete - All Steps)
- Phase 3: Premium Subscription & Monetization ✅ (Complete - All Steps)
- Phase 4: Social Features & Sharing ✅ (Steps 4.1-4.2 Complete - Core sharing done)
- Phase 5: Error Handling & Edge Cases (Step 5.8)
- Phase 6: Launch Preparation (All steps)

### Nice-to-Have (Post-Launch)
- Phase 4: Advanced Collaborative Features (Step 4.3)
- Phase 5: Advanced Features (Steps 5.1-5.7, 5.9)

### Future Enhancements
- Multi-language support
- Dark/light theme toggle (currently dark only)
- Activity recommendations based on friends
- Integration with ticket booking services (Eventbrite, etc.)
- AR features for discovering nearby activities
- Gamification (achievements, badges, leaderboards)

---

## Credits

Built with ❤️ using React Native, Expo, and AI-powered activity generation.

**Version**: 1.0.0  
**Last Updated**: December 2024
