import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';
import Typography from '@/constants/typography';
import Spacing from '@/constants/spacing';
import { BorderRadius } from '@/constants/design';

const PRIVACY_POLICY_CONTENT = `Privacy Policy for Scratch & Go

Last Updated: December 29, 2024

INTRODUCTION

Welcome to Scratch & Go. We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.

Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.

INFORMATION WE COLLECT

Information You Provide to Us

User Preferences
• Activity preferences (alcohol, religious activities, gambling, weapons-related activities)
• Selected mode (Couples or Family)
• Filter selections (category, budget, timing, setting)
• Religion selection (if applicable)

Activity Data
• Activities you save to your Memory Book
• Activity ratings and notes
• Activities marked as completed
• Activities added to collaborative queue
• Voting history on shared activities

Account Information
• Subscription status (free, trial, or premium)
• Subscription purchase history
• In-app purchase receipts (stored by Apple/Google)

Information Collected Automatically

Device Information
• Device type and model
• Operating system version
• Unique device identifiers
• App version

Usage Data
• Activities generated
• Scratch count and history
• Feature usage statistics
• App crashes and errors
• Performance data

Location Information (Optional)
• Approximate location (city, region, country)
• Location is only collected when you actively use location features
• You can manually enter location instead of using automatic detection
• Location is not tracked in the background

Calendar Information (Optional)
• Only accessed when you explicitly add an activity to your calendar
• We do not read or store your existing calendar events

HOW WE USE YOUR INFORMATION

We use the information we collect to:

1. Provide and Improve Services
   • Generate personalized activity suggestions
   • Display location-relevant activities
   • Remember your preferences across sessions
   • Improve AI suggestion accuracy based on your feedback

2. Enhance User Experience
   • Save your activity history and favorites
   • Track statistics and achievements
   • Enable collaborative features (queue, voting)
   • Provide weather-appropriate suggestions

3. Process Subscriptions
   • Manage premium subscription status
   • Process in-app purchases
   • Provide premium features to subscribers

4. Analytics and Improvement
   • Understand how users interact with the app
   • Identify and fix bugs and crashes
   • Improve app performance
   • Develop new features

5. Communication
   • Send important app updates
   • Notify about subscription status changes
   • Respond to support requests

DATA STORAGE AND SECURITY

Local Storage
Most of your data is stored locally on your device using secure storage:
• Activity preferences and history
• Memory Book activities
• Collaborative queue
• Statistics and achievements
• Subscription status

Cloud Storage
Minimal data is stored on our servers:
• Anonymous usage analytics
• Crash reports (anonymized)
• AI generation requests (not linked to your identity)

Security Measures
We implement appropriate technical and organizational security measures to protect your information:
• Data encryption in transit (HTTPS)
• Secure local storage (AsyncStorage with device encryption)
• No storage of sensitive payment information (handled by Apple/Google)
• Regular security audits
• Limited data retention

THIRD-PARTY SERVICES

We use the following third-party services:

Anthropic (AI Generation)
• Purpose: Generate personalized activity suggestions
• Data Shared: Your filter selections, location (city-level), preferences

Stripe (Payment Processing)
• Purpose: Process premium subscription payments
• Data Shared: Payment information (handled directly by Stripe)

Apple App Store / Google Play Store
• Purpose: In-app purchase processing and subscription management
• Data Shared: Purchase history, subscription status

Weather API
• Purpose: Provide current weather information for activity suggestions
• Data Shared: Your approximate location (city-level)
• Data is only shared when you use location features

YOUR PRIVACY RIGHTS

Access and Control
You have the right to:
• Access your personal data stored in the app
• Update your preferences at any time
• Delete your account and all associated data
• Export your data (Memory Book activities, ratings, notes)
• Opt out of location services
• Opt out of analytics (if implemented)

How to Exercise Your Rights
• View and edit preferences: Open Settings in the app
• Delete your data: Use "Reset All Preferences" in Settings
• Request data deletion: Contact support@scratchandgo.app
• Unsubscribe: Manage subscription through App Store or Google Play

Data Retention
• User preferences: Stored until you reset or delete them
• Activity history: Stored until you delete activities
• Analytics: Retained for 90 days, then anonymized
• Subscription data: Retained as required by law

CHILDREN'S PRIVACY

Scratch & Go is designed for general audiences and does not knowingly collect personal information from children under 13 years of age. The Family Mode is intended for use by parents/guardians to find activities for their families.

If you believe we have inadvertently collected information from a child under 13, please contact us immediately at support@scratchandgo.app.

LOCATION SERVICES

How We Use Location
• To suggest activities near you
• To provide weather-appropriate recommendations
• To display local attractions and venues

Location Permissions
• Location access is optional
• You can manually enter your location instead
• Location is only accessed when you use the app
• No background location tracking
• You can revoke location permission at any time in device settings

SHARING YOUR INFORMATION

We Do NOT Sell Your Data
We do not sell, rent, or trade your personal information to third parties for marketing purposes.

We May Share Information:
1. With Your Consent: When you explicitly share activities with others
2. Service Providers: With trusted third parties who help us operate the app (AI generation, payments)
3. Legal Requirements: If required by law or to protect our rights
4. Business Transfer: In the event of a merger, acquisition, or sale of assets

Activity Sharing
When you share an activity:
• You choose what to share
• Shared activities include only the activity details, not your personal information
• Recipients see the activity without identifying you

INTERNATIONAL DATA TRANSFERS

Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this privacy policy.

CHANGES TO THIS PRIVACY POLICY

We may update this Privacy Policy from time to time. We will notify you of any changes by:
• Updating the "Last Updated" date
• Showing an in-app notification (for material changes)
• Sending an email (if we have your email address)

Your continued use of the app after changes are posted constitutes acceptance of the updated Privacy Policy.

CALIFORNIA PRIVACY RIGHTS (CCPA)

If you are a California resident, you have additional rights under the California Consumer Privacy Act:
• Right to know what personal information is collected
• Right to delete personal information
• Right to opt-out of the sale of personal information (we don't sell data)
• Right to non-discrimination for exercising your rights

To exercise these rights, contact us at support@scratchandgo.app.

EUROPEAN PRIVACY RIGHTS (GDPR)

If you are in the European Economic Area, you have rights under the General Data Protection Regulation:
• Right to access your personal data
• Right to rectification of inaccurate data
• Right to erasure ("right to be forgotten")
• Right to restrict processing
• Right to data portability
• Right to object to processing
• Right to withdraw consent

To exercise these rights, contact us at support@scratchandgo.app.

CONTACT US

If you have questions or concerns about this Privacy Policy or our privacy practices, please contact us:

Email: support@scratchandgo.app
Website: https://scratchandgo.app

We will respond to your inquiry within 30 days.

CONSENT

By using Scratch & Go, you consent to our Privacy Policy and agree to its terms.`;

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Privacy Policy',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '400' as const },
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.content}>{PRIVACY_POLICY_CONTENT}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  content: {
    fontSize: Typography.sizes.body,
    lineHeight: 24,
    color: Colors.text,
  },
});
