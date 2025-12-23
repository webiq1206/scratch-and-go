import { Platform, Share } from 'react-native';
import type { Activity } from '@/types/activity';

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
  text += `💰 Cost: ${costSymbol}\n`;
  text += `⏱️ Duration: ${activity.duration}\n`;
  
  if (activity.supplies) {
    text += `🎒 Supplies: ${activity.supplies}\n`;
  }
  
  if (activity.proTip) {
    text += `\n💡 Pro Tip: ${activity.proTip}\n`;
  }
  
  text += `\n✨ Discover more activities with Scratch & Go!\n`;
  text += `\n${shareLink}`;
  
  return text;
}

export function canShare(): boolean {
  if (Platform.OS === 'web') {
    return !!(navigator.share || navigator.clipboard);
  }
  return true;
}
