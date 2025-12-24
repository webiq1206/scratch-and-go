import { Platform, Share, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import type { Activity } from '@/types/activity';
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
  
  let text = `${activity.emoji} ${activity.title}\n\n`;
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
