import { Platform, Share, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import type { Activity, SavedActivity } from '@/types/activity';
import type { User } from '@/contexts/AuthContext';

function generateShareableLink(activity: Activity): string {
  const activityJson = JSON.stringify(activity);
  const encodedActivity = encodeURIComponent(btoa(activityJson));
  
  const deepLink = `https://scratchandgo.app/activity-shared/${encodedActivity}`;
  return deepLink;
}

export async function shareActivity(activity: Activity): Promise<void> {
  const shareLink = generateShareableLink(activity);
  const shareText = formatActivityShareText(activity, shareLink);
  
  try {
    if (Platform.OS === 'web') {
      if (navigator.share) {
        await navigator.share({
          title: activity.title,
          text: shareText,
          url: shareLink,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Activity details copied to clipboard!');
      }
    } else {
      await Share.share({
        message: shareText,
        url: shareLink,
        title: activity.title,
      });
    }
    
    console.log('Activity shared successfully');
  } catch (error) {
    if ((error as Error).message !== 'User did not share') {
      console.error('Error sharing activity:', error);
      throw error;
    }
  }
}

function formatActivityShareText(activity: Activity, shareLink: string): string {
  const costSymbol = activity.cost === 'free' ? 'Free' : activity.cost.toUpperCase();
  
  let text = `${activity.title}\n\n`;
  text += `${activity.description}\n\n`;
  text += `Cost: ${costSymbol}\n`;
  text += `Duration: ${activity.duration}\n`;
  
  if (activity.supplies) {
    text += `Supplies: ${activity.supplies}\n`;
  }
  
  if (activity.proTip) {
    text += `\nPro Tip: ${activity.proTip}\n`;
  }
  
  text += `\nDiscover more activities with Scratch & Go!\n`;
  text += `\n${shareLink}`;
  
  return text;
}

export function canShare(): boolean {
  if (Platform.OS === 'web') {
    return !!(navigator.share || navigator.clipboard);
  }
  return true;
}

export async function shareToFacebook(activity: Activity, user: User | null): Promise<void> {
  if (!user || user.provider !== 'facebook') {
    Alert.alert(
      'Facebook Login Required',
      'Please log in with Facebook to share to Facebook.'
    );
    return;
  }

  const shareText = formatActivityShareText(activity, generateShareableLink(activity));

  try {
    const facebookUrl = `https://www.facebook.com/dialog/share?app_id=${process.env.EXPO_PUBLIC_FACEBOOK_APP_ID}&display=popup&href=${encodeURIComponent(generateShareableLink(activity))}&quote=${encodeURIComponent(shareText)}`;
    
    const supported = await Linking.canOpenURL(facebookUrl);
    if (supported) {
      await Linking.openURL(facebookUrl);
    } else {
      Alert.alert('Error', 'Cannot open Facebook');
    }
  } catch (error) {
    console.error('Error sharing to Facebook:', error);
    Alert.alert('Error', 'Failed to share to Facebook');
  }
}

export async function shareToInstagram(activity: Activity, user: User | null, imageUri?: string): Promise<void> {
  if (!user || user.provider !== 'facebook') {
    Alert.alert(
      'Facebook Login Required',
      'Please log in with Facebook to share to Instagram.'
    );
    return;
  }

  if (!user.accessToken) {
    Alert.alert('Error', 'No access token available');
    return;
  }

  try {
    if (imageUri) {
      const instagramUrl = `instagram://library?AssetPath=${encodeURIComponent(imageUri)}`;
      const supported = await Linking.canOpenURL(instagramUrl);
      
      if (supported) {
        await Linking.openURL(instagramUrl);
      } else {
        Alert.alert(
          'Instagram Not Available',
          'Please make sure Instagram is installed on your device.'
        );
      }
    } else {
      Alert.alert(
        'Photo Required',
        'Please add a photo to this activity to share on Instagram.'
      );
    }
  } catch (error) {
    console.error('Error sharing to Instagram:', error);
    Alert.alert('Error', 'Failed to share to Instagram');
  }
}

export async function shareToSocialMedia(
  activity: Activity,
  user: User | null,
  platform: 'facebook' | 'instagram',
  imageUri?: string
): Promise<void> {
  if (platform === 'facebook') {
    await shareToFacebook(activity, user);
  } else if (platform === 'instagram') {
    await shareToInstagram(activity, user, imageUri);
  }
}

// Memory-specific sharing functions
function formatMemoryShareText(memory: SavedActivity, shareLink: string): string {
  const date = memory.completedAt 
    ? new Date(memory.completedAt).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : 'Recently';
  
  let text = `✨ ${memory.title} ✨\n\n`;
  
  if (memory.notes) {
    text += `${memory.notes}\n\n`;
  }
  
  text += `📍 ${memory.locationSnapshot?.city || 'Location'}, ${memory.locationSnapshot?.region || ''}\n`;
  text += `📅 ${date}\n`;
  text += `⏱️ ${memory.duration}\n`;
  
  if (memory.cost !== 'free') {
    text += `💰 ${memory.cost}\n`;
  }
  
  text += `\n💫 Made with Scratch & Go\n`;
  text += `Discover your next adventure: ${shareLink}`;
  
  return text;
}

export async function shareMemory(memory: SavedActivity): Promise<void> {
  const shareLink = generateShareableLink(memory);
  const shareText = formatMemoryShareText(memory, shareLink);
  
  try {
    if (Platform.OS === 'web') {
      if (navigator.share) {
        await navigator.share({
          title: memory.title,
          text: shareText,
          url: shareLink,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Memory details copied to clipboard!');
      }
    } else {
      await Share.share({
        message: shareText,
        url: shareLink,
        title: memory.title,
      });
    }
    
    console.log('Memory shared successfully');
  } catch (error) {
    if ((error as Error).message !== 'User did not share') {
      console.error('Error sharing memory:', error);
      throw error;
    }
  }
}

export async function shareMemoryToFacebook(memory: SavedActivity): Promise<void> {
  const shareLink = generateShareableLink(memory);
  const shareText = formatMemoryShareText(memory, shareLink);
  
  try {
    // Use Facebook's share dialog
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}&quote=${encodeURIComponent(shareText)}`;
    
    const supported = await Linking.canOpenURL(facebookUrl);
    if (supported) {
      await Linking.openURL(facebookUrl);
    } else {
      // Fallback to generic share
      await shareMemory(memory);
    }
  } catch (error) {
    console.error('Error sharing to Facebook:', error);
    // Fallback to generic share
    try {
      await shareMemory(memory);
    } catch (fallbackError) {
      Alert.alert('Error', 'Failed to share memory');
    }
  }
}

export async function shareMemoryToInstagram(memory: SavedActivity): Promise<void> {
  // Instagram requires an image to share
  if (!memory.photos || memory.photos.length === 0) {
    Alert.alert(
      'Photo Required',
      'Please add a photo to this memory to share on Instagram. Instagram requires an image to share.'
    );
    return;
  }
  
  try {
    // Use the first photo for Instagram sharing
    const imageUri = memory.photos[0];
    
    // On iOS, use Instagram's URL scheme
    if (Platform.OS === 'ios') {
      const instagramUrl = `instagram://library?AssetPath=${encodeURIComponent(imageUri)}`;
      const supported = await Linking.canOpenURL(instagramUrl);
      
      if (supported) {
        await Linking.openURL(instagramUrl);
      } else {
        Alert.alert(
          'Instagram Not Available',
          'Please make sure Instagram is installed on your device.'
        );
      }
    } else if (Platform.OS === 'android') {
      // On Android, use Instagram's content URI
      const instagramUrl = `content://com.instagram.contentprovider/${encodeURIComponent(imageUri)}`;
      const supported = await Linking.canOpenURL(instagramUrl);
      
      if (supported) {
        await Linking.openURL(instagramUrl);
      } else {
        // Fallback: try to open Instagram app
        const instagramAppUrl = `intent://share?image=${encodeURIComponent(imageUri)}#Intent;package=com.instagram.android;scheme=https;end`;
        try {
          await Linking.openURL(instagramAppUrl);
        } catch {
          Alert.alert(
            'Instagram Not Available',
            'Please make sure Instagram is installed on your device.'
          );
        }
      }
    } else {
      // Web fallback
      Alert.alert(
        'Not Supported',
        'Instagram sharing is only available on mobile devices. Please use the mobile app.'
      );
    }
  } catch (error) {
    console.error('Error sharing to Instagram:', error);
    Alert.alert('Error', 'Failed to share to Instagram');
  }
}
