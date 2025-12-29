export type AnalyticsEvent = 
  | 'app_launched'
  | 'onboarding_completed'
  | 'mode_selected'
  | 'activity_generated'
  | 'activity_regenerated'
  | 'activity_saved'
  | 'activity_completed'
  | 'activity_rated'
  | 'activity_shared'
  | 'activity_not_interested'
  | 'activity_added_to_queue'
  | 'activity_added_to_calendar'
  | 'queue_vote_yes'
  | 'queue_vote_no'
  | 'subscription_started'
  | 'subscription_upgraded'
  | 'subscription_cancelled'
  | 'paywall_viewed'
  | 'preferences_updated'
  | 'location_permission_granted'
  | 'location_permission_denied'
  | 'calendar_permission_granted'
  | 'calendar_permission_denied'
  | 'scratch_limit_reached'
  | 'error_occurred';

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

export interface AnalyticsUser {
  userId?: string;
  mode?: 'couples' | 'family';
  isPremium?: boolean;
  totalActivitiesGenerated?: number;
  totalActivitiesSaved?: number;
  totalActivitiesCompleted?: number;
}
