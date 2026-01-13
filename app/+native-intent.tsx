/**
 * Handles native intent redirects for deep linking
 * This function is called by Expo Router when the app is opened via a native intent
 * (e.g., from another app, notification, or system-level deep link)
 * 
 * @param path - The path from the native intent
 * @param initial - Whether this is the initial navigation
 * @returns The route path to navigate to
 */
export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }): string {
  // Handle activity-shared deep links
  if (path.startsWith('/activity-shared/') || path.includes('activity-shared')) {
    // Extract the activity ID from the path
    const match = path.match(/activity-shared\/([^/]+)/);
    if (match && match[1]) {
      return `/activity-shared/${match[1]}`;
    }
    return '/activity-shared';
  }

  // Handle activity detail deep links
  if (path.startsWith('/activity/')) {
    return path;
  }

  // Handle main app routes
  if (path.startsWith('/(main)')) {
    return path;
  }

  // Handle welcome/onboarding
  if (path === '/welcome' || path.startsWith('/welcome')) {
    return '/welcome';
  }

  // Handle paywall
  if (path === '/paywall' || path.startsWith('/paywall')) {
    return '/paywall';
  }

  // Default to home for unknown paths
  return '/(main)/(home)';
}