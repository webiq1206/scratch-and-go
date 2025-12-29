# Scratch & Go - Testing Checklist

## Overview
This document provides a comprehensive testing checklist to ensure the Scratch & Go app is production-ready across all platforms and devices.

---

## Phase 5.9: Testing & QA

### Platform Testing

#### iOS Testing
- [ ] Test on iPhone SE (small screen)
- [ ] Test on iPhone 14/15 Pro (standard screen)
- [ ] Test on iPhone 14/15 Pro Max (large screen)
- [ ] Test on iPad (tablet view)
- [ ] Verify safe area handling on notched devices
- [ ] Test dark mode appearance
- [ ] Verify haptic feedback works correctly
- [ ] Test location permissions flow
- [ ] Test calendar permissions flow
- [ ] Verify share sheet functionality

#### Android Testing
- [ ] Test on small Android phone (5-6 inch screen)
- [ ] Test on standard Android phone (6-6.5 inch)
- [ ] Test on large Android phone (6.5+ inch)
- [ ] Test on Android tablet
- [ ] Verify safe area handling
- [ ] Test dark mode appearance
- [ ] Verify haptic feedback works correctly
- [ ] Test location permissions flow
- [ ] Test calendar permissions flow
- [ ] Verify share functionality

#### Web Testing
- [ ] Test on Chrome desktop
- [ ] Test on Safari desktop
- [ ] Test on Firefox desktop
- [ ] Test on mobile Chrome (responsive)
- [ ] Test on mobile Safari (responsive)
- [ ] Verify location fallback (web geolocation API)
- [ ] Verify calendar feature shows informative message
- [ ] Verify haptics gracefully skip on web
- [ ] Test share fallback on web

---

### Feature Testing

#### 1. Welcome & Onboarding
- [ ] Welcome screen displays correctly with polaroid images
- [ ] Mode selection (Couples/Family) works
- [ ] Preference questionnaire flows smoothly
- [ ] All 4 preference questions save correctly
- [ ] Religion picker works (if religious activities enabled)
- [ ] Preferences persist after closing app
- [ ] Skip/back navigation works
- [ ] What's New modal shows for new version (if implemented)

#### 2. Core Scratch Experience
- [ ] Scratch card renders with gradient overlay
- [ ] Shimmer animation plays smoothly
- [ ] Scratch gesture reveals activity underneath
- [ ] Activity generation completes successfully
- [ ] Loading state shows during generation
- [ ] Generated activity matches selected filters
- [ ] Scratch counter decrements correctly
- [ ] Scratch limit alert shows at 3 scratches (free users)
- [ ] Regenerate button works
- [ ] "Not Interested" button works and clears activity

#### 3. Filters & Wizard
- [ ] Category filter works (all options)
- [ ] Budget filter works (all options)
- [ ] Timing filter works (all options)
- [ ] Setting filter works (indoor/outdoor/either)
- [ ] Wizard progresses through all 4 steps
- [ ] Back button works in wizard
- [ ] Progress bar updates correctly
- [ ] Premium category shows premium badge
- [ ] Premium category prompts upgrade for free users
- [ ] "Change preferences" link restarts wizard

#### 4. Location Features
- [ ] Auto-location detection works (with permission)
- [ ] Manual location selection works
- [ ] Location selector displays current city
- [ ] Location persists across sessions
- [ ] Weather data fetches correctly
- [ ] Weather displays in activity card
- [ ] Location influences activity suggestions
- [ ] Weather influences indoor/outdoor suggestions
- [ ] Location permission denial handled gracefully

#### 5. Memory Book
- [ ] "Save to Memory Book" button works
- [ ] Saved activities appear in Memory Book
- [ ] Search filters activities correctly
- [ ] Category filter works
- [ ] Budget filter works
- [ ] Sort options work (date, alphabetical, rating)
- [ ] "Saved" tab shows all saved activities
- [ ] "Completed" tab shows only completed activities
- [ ] Mark as complete/incomplete works
- [ ] Star rating system works (1-5 stars)
- [ ] Edit notes functionality works
- [ ] Delete activity works with confirmation
- [ ] Activity cards display all information correctly
- [ ] Pull-to-refresh works
- [ ] Empty states display correctly

#### 6. Activity Detail Screen
- [ ] Activity detail opens from Memory Book
- [ ] All activity information displays correctly
- [ ] Share button works
- [ ] Add to Queue button works
- [ ] Add to Calendar button works
- [ ] Calendar date/time picker works
- [ ] Calendar event created successfully
- [ ] Notes display correctly
- [ ] Rating displays correctly
- [ ] Delete confirmation works
- [ ] Navigation back to Memory Book works

#### 7. Collaborative Queue
- [ ] Queue tab appears in navigation
- [ ] Add activity to queue works
- [ ] Optional note field works when adding
- [ ] Pending tab shows activities awaiting votes
- [ ] Approved tab shows consensus activities
- [ ] Thumbs up/down voting works
- [ ] Vote counts update correctly
- [ ] Activities move to approved at 2 yes votes
- [ ] Activities disappear at 2 no votes
- [ ] "Save to Memory Book" works for approved activities
- [ ] Delete from queue works with confirmation
- [ ] Empty states display correctly
- [ ] Pull-to-refresh works

#### 8. Activity Sharing
- [ ] Share button appears on scratch card reveal
- [ ] Share button appears in activity detail
- [ ] Share sheet opens with activity details
- [ ] Share text includes emoji, title, description
- [ ] Share URL format is correct
- [ ] Deep link opens shared activity screen
- [ ] Shared activity displays correctly
- [ ] "Save to Memory Book" works from shared view
- [ ] "Try Scratch & Go" CTA shows for non-users
- [ ] Invalid shared links show error message

#### 9. Premium Subscription
- [ ] Paywall displays correctly
- [ ] Monthly and yearly plans shown
- [ ] "Save 33%" badge on yearly plan
- [ ] Trial information displayed (if applicable)
- [ ] Purchase flow works (mock system)
- [ ] Premium badge shows after upgrade
- [ ] Unlimited scratches work for premium users
- [ ] Premium categories unlock for premium users
- [ ] Restore purchases button works
- [ ] Subscription status shows in settings
- [ ] Expiry date displays correctly
- [ ] "Manage Subscription" links to platform store

#### 10. Settings Screen
- [ ] Settings screen displays correctly
- [ ] Subscription status section shows correct info
- [ ] Premium badge appears for premium users
- [ ] Trial countdown shows for trial users
- [ ] Upgrade button works for free users
- [ ] Manage subscription button links correctly
- [ ] Restore purchases button works
- [ ] Mode selection (Couples/Family) works
- [ ] Mode change persists
- [ ] Content preferences toggles work
- [ ] Religion selection works
- [ ] "Reset All Preferences" works with confirmation
- [ ] Navigation works

#### 11. Stats Dashboard
- [ ] Stats tab appears in navigation
- [ ] Total scratches counter accurate
- [ ] Total saved counter accurate
- [ ] Total completed counter accurate
- [ ] Current month scratches accurate
- [ ] Time spent calculation correct
- [ ] Money invested calculation correct
- [ ] Favorite categories display correctly
- [ ] Category percentages accurate
- [ ] Current streak calculation correct
- [ ] Longest streak tracking works
- [ ] Monthly recap shows current month
- [ ] Monthly recap calculations accurate
- [ ] Weekly activity chart displays correctly
- [ ] Empty state shows for new users

#### 12. Year Recap (if implemented)
- [ ] Year recap accessible
- [ ] Statistics accurate for the year
- [ ] Visual presentation works
- [ ] Share year recap works

---

### Error Handling & Edge Cases

#### Network Errors
- [ ] No internet alert shows appropriately
- [ ] Retry button works after network failure
- [ ] Offline mode works for saved activities
- [ ] AI generation timeout handled (30 seconds)
- [ ] AI generation retry works (2 attempts)

#### Permission Errors
- [ ] Location permission denial handled
- [ ] Calendar permission denial handled
- [ ] Graceful fallbacks work

#### Data Errors
- [ ] Invalid shared activity link handled
- [ ] Empty states display correctly
- [ ] Missing data doesn't crash app
- [ ] AsyncStorage errors handled

#### Edge Cases
- [ ] App works with 0 saved activities
- [ ] App works with 100+ saved activities
- [ ] Long activity titles/descriptions don't break UI
- [ ] Special characters in input fields handled
- [ ] Rapid button tapping doesn't cause issues
- [ ] App backgrounding/foregrounding works
- [ ] App works after force quit and relaunch
- [ ] Data persists correctly across sessions

---

### Performance Testing

#### Load Times
- [ ] App launches in under 3 seconds
- [ ] Scratch card loads quickly
- [ ] Activity generation completes in under 10 seconds (typical)
- [ ] Memory Book loads instantly
- [ ] Stats dashboard loads quickly
- [ ] Image loading doesn't block UI

#### Animations
- [ ] Scratch card animation smooth (60fps)
- [ ] Shimmer effect smooth
- [ ] Screen transitions smooth
- [ ] Modal presentations smooth
- [ ] Pull-to-refresh smooth
- [ ] No janky scrolling

#### Memory Usage
- [ ] App doesn't leak memory
- [ ] Long usage session stable
- [ ] Image memory managed correctly
- [ ] AsyncStorage queries efficient

---

### Accessibility Testing

#### Visual
- [ ] Text contrast meets WCAG AA standards
- [ ] All text readable on dark background
- [ ] Icons clear and recognizable
- [ ] Button states visually distinct
- [ ] Touch targets minimum 44x44 points

#### Touch & Interaction
- [ ] All buttons easily tappable
- [ ] Haptic feedback works appropriately
- [ ] Gestures work smoothly
- [ ] No unintended touches

#### Screen Reader (Requires Device Testing)
- [ ] VoiceOver navigation works (iOS)
- [ ] TalkBack navigation works (Android)
- [ ] All interactive elements labeled
- [ ] Reading order logical
- [ ] Announcements clear and helpful

---

### Security & Privacy

#### Data Storage
- [ ] Sensitive data not logged
- [ ] AsyncStorage data appropriate
- [ ] No API keys in client code
- [ ] Environment variables used correctly

#### Permissions
- [ ] Only required permissions requested
- [ ] Permission rationale clear
- [ ] Graceful fallbacks for denied permissions

#### Network
- [ ] HTTPS used for all network requests
- [ ] API endpoints secure
- [ ] No data leakage in logs

---

### User Experience Polish

#### Visual Polish
- [ ] All screens visually consistent
- [ ] Typography consistent
- [ ] Color usage consistent
- [ ] Spacing consistent
- [ ] No visual glitches or flickers
- [ ] Images crisp and well-sized
- [ ] Gradients smooth
- [ ] Shadows appropriate

#### Copy & Messaging
- [ ] All text clear and concise
- [ ] No typos or grammatical errors
- [ ] Error messages helpful
- [ ] Success messages encouraging
- [ ] Tone consistent throughout
- [ ] No developer language exposed

#### Interaction Polish
- [ ] Buttons have press states
- [ ] Loading indicators present
- [ ] Success feedback provided
- [ ] Error feedback clear
- [ ] Transitions feel natural
- [ ] No dead ends in navigation
- [ ] Back button works everywhere expected

---

## Test Results Template

### Device Information
- Device: [e.g., iPhone 14 Pro]
- OS Version: [e.g., iOS 17.0]
- App Version: [e.g., 1.0.0]
- Test Date: [YYYY-MM-DD]

### Critical Issues Found
1. [Description of issue]
   - Severity: [Critical/High/Medium/Low]
   - Steps to reproduce: [Steps]
   - Expected result: [What should happen]
   - Actual result: [What happened]

### Minor Issues Found
1. [Description of issue]

### Notes
[Any additional observations]

---

## Sign-Off

### QA Tester Sign-Off
- [ ] All critical features tested and working
- [ ] All known issues documented
- [ ] App ready for beta testing

Tester Name: ________________
Date: ________________

### Product Owner Sign-Off
- [ ] Feature set complete
- [ ] User experience acceptable
- [ ] Ready for app store submission

Name: ________________
Date: ________________

---

## Post-Launch Monitoring

### Week 1 Checklist
- [ ] Monitor crash reports daily
- [ ] Check user reviews
- [ ] Monitor analytics for usage patterns
- [ ] Track subscription conversions
- [ ] Verify AI generation success rate
- [ ] Check server costs and performance

### Month 1 Checklist
- [ ] Analyze user retention
- [ ] Review most-used features
- [ ] Identify pain points
- [ ] Gather user feedback
- [ ] Plan updates based on data

---

**Version**: 1.0.0
**Last Updated**: December 2024
