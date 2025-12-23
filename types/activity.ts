import { z } from 'zod';

export const ActivitySchema = z.object({
  title: z.string().describe('Activity title (3-6 words)'),
  description: z.string().describe('Activity description (2-3 sentences)'),
  emoji: z.string().describe('Single contextual emoji representing the activity'),
  cost: z.enum(['free', '$', '$$', '$$$']).describe('Estimated cost tier'),
  duration: z.string().describe('Estimated duration (e.g., "1-2 hours", "Half day")'),
  supplies: z.string().optional().describe('Supplies or preparation needed'),
  proTip: z.string().describe('One pro tip to enhance the experience'),
  category: z.string().describe('Activity category'),
});

export type Activity = z.infer<typeof ActivitySchema>;

export type Mode = 'couples' | 'family';

export type Filters = {
  mode: Mode;
  category: string;
  budget: string;
  timing: string;
  kidAges?: string;
  setting?: 'indoor' | 'outdoor' | 'either';
};
