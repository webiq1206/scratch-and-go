# Payment Integration Setup Guide

## Overview

Scratch & Go uses **RevenueCat** for subscription management. RevenueCat handles both iOS App Store and Google Play Store subscriptions, making it the ideal solution for cross-platform apps.

## Current Status

✅ **Code is production-ready** - The subscription system is fully implemented  
⚠️ **Needs configuration** - Requires RevenueCat API keys and product setup

---

## Step 1: Create RevenueCat Account

1. Go to [https://www.revenuecat.com](https://www.revenuecat.com)
2. Sign up for a free account
3. Create a new project called "Scratch & Go"

---

## Step 2: Configure Products in RevenueCat Dashboard

### 2.1 Create Products

1. Navigate to **Products** in RevenueCat dashboard
2. Create two products:
   - **Monthly Premium** (`monthly`)
     - Price: $4.99/month
     - Platform: iOS & Android
   - **Annual Premium** (`annual`)
     - Price: $39.99/year
     - Platform: iOS & Android

### 2.2 Create Entitlement

1. Navigate to **Entitlements** in RevenueCat dashboard
2. Create entitlement: **premium**
3. Attach both products (monthly and annual) to this entitlement

### 2.3 Create Offering

1. Navigate to **Offerings** in RevenueCat dashboard
2. Create offering: **default**
3. Add both packages (monthly and annual) to the offering

---

## Step 3: Configure App Store Connect (iOS)

### 3.1 Create In-App Purchase Products

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app → **Features** → **In-App Purchases**
3. Create two subscription products:
   - **Monthly Premium**
     - Product ID: `com.scratchandgo.premium.monthly`
     - Subscription Group: Create new group "Premium"
     - Price: $4.99/month
   - **Annual Premium**
     - Product ID: `com.scratchandgo.premium.annual`
     - Same subscription group
     - Price: $39.99/year

### 3.2 Link to RevenueCat

1. In RevenueCat dashboard, go to **Integrations** → **App Store Connect**
2. Connect your App Store Connect account
3. RevenueCat will automatically sync your products

---

## Step 4: Configure Google Play Console (Android)

### 4.1 Create Subscription Products

1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to your app → **Monetize** → **Products** → **Subscriptions**
3. Create two subscription products:
   - **Monthly Premium**
     - Product ID: `premium_monthly`
     - Price: $4.99/month
   - **Annual Premium**
     - Product ID: `premium_annual`
     - Price: $39.99/year

### 4.2 Link to RevenueCat

1. In RevenueCat dashboard, go to **Integrations** → **Google Play**
2. Connect your Google Play account
3. RevenueCat will automatically sync your products

---

## Step 5: Get RevenueCat API Keys

1. In RevenueCat dashboard, go to **Project Settings** → **API Keys**
2. Copy the following keys:
   - **iOS API Key** (for production iOS builds)
   - **Android API Key** (for production Android builds)
   - **Test API Key** (for development/testing)

---

## Step 6: Configure Environment Variables

### 6.1 Create `.env` file (or add to your environment)

```bash
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_ios_api_key_here
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_android_api_key_here
EXPO_PUBLIC_REVENUECAT_TEST_API_KEY=your_test_api_key_here
```

### 6.2 For Production Builds

When building with EAS, add these to your `eas.json` or EAS secrets:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value your_ios_key
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY --value your_android_key
```

---

## Step 7: Test the Integration

### 7.1 Test on iOS

1. Use a sandbox tester account in App Store Connect
2. Build and run the app on a physical iOS device
3. Navigate to the paywall screen
4. Attempt to purchase (will use sandbox account)
5. Verify subscription status updates correctly

### 7.2 Test on Android

1. Use a test account in Google Play Console
2. Build and run the app on a physical Android device
3. Navigate to the paywall screen
4. Attempt to purchase (will use test account)
5. Verify subscription status updates correctly

---

## Troubleshooting

### Issue: "No subscription plans available"

**Cause:** RevenueCat API key not configured or products not set up

**Solution:**
1. Verify API keys are set in environment variables
2. Check RevenueCat dashboard for product configuration
3. Ensure products are attached to the "premium" entitlement
4. Verify offering is created and set as default

### Issue: "Purchase failed" errors

**Possible causes:**
- Products not configured in App Store Connect/Google Play
- Sandbox/test account not set up
- Network connectivity issues

**Solution:**
1. Verify products exist in both stores
2. Set up sandbox/test accounts
3. Check RevenueCat dashboard for error logs

### Issue: Subscription status not updating

**Solution:**
1. Check RevenueCat webhooks are configured
2. Verify customer info is being refreshed after purchase
3. Check app logs for RevenueCat errors

---

## Code Reference

The subscription system is implemented in:
- `contexts/SubscriptionContext.tsx` - Main subscription logic
- `app/paywall.tsx` - Paywall UI
- `app/(main)/settings.tsx` - Subscription management

Key functions:
- `isPremium()` - Check if user has active premium subscription
- `purchasePackage()` - Purchase a subscription package
- `restorePurchases()` - Restore previous purchases

---

## Production Checklist

Before launching:
- [ ] RevenueCat account created and configured
- [ ] Products created in App Store Connect (iOS)
- [ ] Products created in Google Play Console (Android)
- [ ] Products linked to RevenueCat
- [ ] Entitlement created and products attached
- [ ] Offering created with packages
- [ ] API keys added to environment variables
- [ ] Tested on iOS with sandbox account
- [ ] Tested on Android with test account
- [ ] Restore purchases functionality verified
- [ ] Subscription cancellation flow tested
- [ ] Webhooks configured (optional, for analytics)

---

## Additional Resources

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [RevenueCat React Native SDK](https://docs.revenuecat.com/docs/react-native)
- [App Store Connect In-App Purchases](https://developer.apple.com/in-app-purchase/)
- [Google Play Billing](https://developer.android.com/google/play/billing)

---

## Support

If you encounter issues:
1. Check RevenueCat dashboard for error logs
2. Review RevenueCat documentation
3. Check app console logs for detailed error messages
4. Verify all configuration steps were completed

---

**Last Updated:** January 2025  
**Status:** Ready for configuration
