import { Activity } from './activity';

export type VoteStatus = 'pending' | 'approved' | 'rejected';

export interface Vote {
  userId: string;
  userName: string;
  vote: 'yes' | 'no';
  votedAt: number;
}

export interface CollaborativeActivity extends Activity {
  id: string;
  addedBy: string;
  addedByName: string;
  addedAt: number;
  votes: Vote[];
  status: VoteStatus;
  note?: string;
}

export interface CollaborativeUser {
  id: string;
  name: string;
}

export const VOTE_THRESHOLD = 2;
