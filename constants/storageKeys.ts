/**
 * Centralized storage keys for AsyncStorage
 * All keys used throughout the app should be defined here to:
 * 1. Prevent key name conflicts
 * 2. Make it easy to track what data is stored
 * 3. Ensure consistency across contexts and components
 */

// User Authentication
export const AUTH_USER_KEY = 'scratch_and_go_user';

// User Preferences & Settings
export const PREFERENCES_KEY = 'scratch_and_go_preferences';
export const MODE_KEY = 'scratch_and_go_mode';

// Location Data
export const LOCATION_KEY = 'scratch_and_go_location';

// Activity Data
export const SAVED_ACTIVITIES_KEY = 'scratch_and_go_saved_activities';
export const HISTORY_KEY = 'scratch_and_go_history';
export const SCRATCH_COUNT_KEY = 'scratch_and_go_count';
export const SCRATCH_MONTH_KEY = 'scratch_and_go_month';
export const INTERACTIONS_KEY = 'scratch_and_go_interactions';
export const LEARNING_PROFILE_KEY = 'scratch_and_go_learning_profile';
export const SAVED_FOR_LATER_KEY = 'scratch_and_go_saved_for_later';
export const COOLDOWN_KEY = 'scratch_and_go_cooldown';

// Collaborative Features
export const COLLABORATIVE_QUEUE_KEY = 'scratch_and_go_collaborative_queue';
export const COLLABORATIVE_USER_KEY = 'scratch_and_go_collaborative_user';

// Onboarding & App State
export const ONBOARDING_KEY = 'scratch_and_go_onboarding';
export const APP_VERSION_KEY = 'scratch_and_go_app_version';

// Analytics
export const ANALYTICS_ENABLED_KEY = 'scratch_and_go_analytics_enabled';
export const ANALYTICS_USER_ID_KEY = 'scratch_and_go_user_id';
export const ANALYTICS_SESSION_START_KEY = 'scratch_and_go_session_start';
