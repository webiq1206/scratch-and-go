import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity } from '@/types/activity';
import { CollaborativeActivity, CollaborativeUser, Vote, VoteStatus, VOTE_THRESHOLD } from '@/types/collaborative';

const QUEUE_KEY = 'scratch_and_go_collaborative_queue';
const USER_KEY = 'scratch_and_go_collaborative_user';

export const [CollaborativeProvider, useCollaborative] = createContextHook(() => {
  const [queue, setQueue] = useState<CollaborativeActivity[]>([]);
  const [currentUser, setCurrentUser] = useState<CollaborativeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storedQueue, storedUser] = await Promise.all([
        AsyncStorage.getItem(QUEUE_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (storedQueue) {
        setQueue(JSON.parse(storedQueue));
      }

      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      } else {
        const defaultUser: CollaborativeUser = {
          id: generateUserId(),
          name: 'You',
        };
        setCurrentUser(defaultUser);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(defaultUser));
      }
    } catch (error) {
      console.error('Failed to load collaborative data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveQueue = async (updatedQueue: CollaborativeActivity[]) => {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
      setQueue(updatedQueue);
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  };

  const addToQueue = async (activity: Activity, note?: string) => {
    if (!currentUser) return;

    const newActivity: CollaborativeActivity = {
      ...activity,
      id: generateActivityId(),
      addedBy: currentUser.id,
      addedByName: currentUser.name,
      addedAt: Date.now(),
      votes: [],
      status: 'pending',
      note,
    };

    const updatedQueue = [newActivity, ...queue];
    await saveQueue(updatedQueue);
  };

  const voteOnActivity = async (activityId: string, vote: 'yes' | 'no') => {
    if (!currentUser) return;

    const updatedQueue = queue.map((activity) => {
      if (activity.id !== activityId) return activity;

      const existingVoteIndex = activity.votes.findIndex(
        (v) => v.userId === currentUser.id
      );

      let updatedVotes = [...activity.votes];

      if (existingVoteIndex >= 0) {
        updatedVotes[existingVoteIndex] = {
          userId: currentUser.id,
          userName: currentUser.name,
          vote,
          votedAt: Date.now(),
        };
      } else {
        updatedVotes.push({
          userId: currentUser.id,
          userName: currentUser.name,
          vote,
          votedAt: Date.now(),
        });
      }

      const yesVotes = updatedVotes.filter((v) => v.vote === 'yes').length;
      const noVotes = updatedVotes.filter((v) => v.vote === 'no').length;

      let newStatus: VoteStatus = 'pending';
      if (yesVotes >= VOTE_THRESHOLD) {
        newStatus = 'approved';
      } else if (noVotes >= VOTE_THRESHOLD) {
        newStatus = 'rejected';
      }

      return {
        ...activity,
        votes: updatedVotes,
        status: newStatus,
      };
    });

    await saveQueue(updatedQueue);
  };

  const removeFromQueue = async (activityId: string) => {
    const updatedQueue = queue.filter((activity) => activity.id !== activityId);
    await saveQueue(updatedQueue);
  };

  const updateUserName = async (name: string) => {
    if (!currentUser) return;

    const updatedUser: CollaborativeUser = {
      ...currentUser,
      name,
    };

    setCurrentUser(updatedUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  const clearQueue = async () => {
    await saveQueue([]);
  };

  const getActivityById = (activityId: string): CollaborativeActivity | undefined => {
    return queue.find((activity) => activity.id === activityId);
  };

  const getUserVote = (activity: CollaborativeActivity): Vote | undefined => {
    if (!currentUser) return undefined;
    return activity.votes.find((v) => v.userId === currentUser.id);
  };

  const getVoteCounts = (activity: CollaborativeActivity) => {
    const yesVotes = activity.votes.filter((v) => v.vote === 'yes').length;
    const noVotes = activity.votes.filter((v) => v.vote === 'no').length;
    return { yesVotes, noVotes };
  };

  const pendingActivities = queue.filter((a) => a.status === 'pending');
  const approvedActivities = queue.filter((a) => a.status === 'approved');
  const rejectedActivities = queue.filter((a) => a.status === 'rejected');

  return {
    queue,
    currentUser,
    isLoading,
    addToQueue,
    voteOnActivity,
    removeFromQueue,
    updateUserName,
    clearQueue,
    getActivityById,
    getUserVote,
    getVoteCounts,
    pendingActivities,
    approvedActivities,
    rejectedActivities,
  };
});

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateActivityId(): string {
  return `collab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
