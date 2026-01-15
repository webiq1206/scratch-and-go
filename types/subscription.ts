export type SubscriptionTier = 'free' | 'premium' | 'trial';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  expiresAt?: string;
  cancelAtPeriodEnd?: boolean;
  trialEndsAt?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  discount?: number;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 4.99,
    interval: 'monthly',
    features: [
      'Unlimited scratches',
      'No cooldown between scratches',
      'Advanced filters (cuisine, budget range, accessibility)',
      'Exclusive activity categories',
      'Priority support',
      'Ad-free experience',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 39.99,
    interval: 'yearly',
    features: [
      'Unlimited scratches',
      'No cooldown between scratches',
      'Advanced filters (cuisine, budget range, accessibility)',
      'Exclusive activity categories',
      'Priority support',
      'Ad-free experience',
      'Save 33% vs monthly',
    ],
    discount: 33,
  },
];

export const DEFAULT_SUBSCRIPTION_STATUS: SubscriptionStatus = {
  tier: 'free',
};
