import { Platform, Share } from 'react-native';
import type { Activity } from '@/types/activity';

export async function shareActivity(activity: Activity): Promise<void> {
  const shareText = formatActivityShareText(activity);
  
  try {
    if (Platform.OS === 'web') {
      if (navigator.share) {
        await navigator.share({
          title: activity.title,
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Activity details copied to clipboard!');
      }
    } else {
      await Share.share({
        message: shareText,
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

function formatActivityShareText(activity: Activity): string {
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
  
  text += `\n✨ Discover more activities with Scratch & Go!`;
  
  return text;
}

export function canShare(): boolean {
  if (Platform.OS === 'web') {
    return !!(navigator.share || navigator.clipboard);
  }
  return true;
}
