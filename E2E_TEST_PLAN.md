# Scratch & Go - Comprehensive End-to-End Test Plan

**Version:** 1.0.0  
**Last Updated:** January 7, 2026  
**Status:** Pre-Launch Final Testing

---

## Table of Contents

1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [User Flows & Scenarios](#user-flows--scenarios)
4. [Feature-by-Feature Testing](#feature-by-feature-testing)
5. [Scratch Card Deep Dive](#scratch-card-deep-dive)
6. [Filter & Recommendation Testing](#filter--recommendation-testing)
7. [Platform-Specific Testing](#platform-specific-testing)
8. [Edge Cases & Failure Scenarios](#edge-cases--failure-scenarios)
9. [Performance Testing](#performance-testing)
10. [Security & Privacy Testing](#security--privacy-testing)
11. [Accessibility Testing](#accessibility-testing)
12. [Regression Checklist](#regression-checklist)
13. [Sign-Off Requirements](#sign-off-requirements)

---

## 1. Overview

This document serves as the **final source of truth** for testing the Scratch & Go app before production launch. Every test case includes:

- **Test ID**: Unique identifier
- **Description**: What is being tested
- **Steps**: How to execute the test
- **Expected Result**: What should happen
- **Priority**: Critical / High / Medium / Low
- **Status**: ⬜ Not Started / 🟡 In Progress / ✅ Pass / ❌ Fail

---

## 2. Test Environment Setup

### Required Devices

| Platform | Device | Screen Size | OS Version |
|----------|--------|-------------|------------|
| iOS | iPhone SE | Small (4.7") | iOS 16+ |
| iOS | iPhone 14/15 Pro | Standard (6.1") | iOS 17+ |
| iOS | iPhone 14/15 Pro Max | Large (6.7") | iOS 17+ |
| iOS | iPad Pro | Tablet (11"+) | iPadOS 17+ |
| Android | Pixel 6 | Standard (6.4") | Android 13+ |
| Android | Samsung Galaxy S23 | Large (6.6") | Android 14+ |
| Android | Small budget phone | Small (5.5") | Android 12+ |
| Web | Chrome Desktop | 1920x1080 | Latest |
| Web | Safari Desktop | 1920x1080 | Latest |
| Web | Mobile Chrome | 375x812 | Latest |
| Web | Mobile Safari | 375x812 | Latest |

### Pre-Test Checklist

- [ ] Fresh app install (clear all data)
- [ ] Location services enabled
- [ ] Network connection stable
- [ ] Test accounts ready (free + premium)
- [ ] Console logging accessible
- [ ] Screen recording enabled

---

## 3. User Flows & Scenarios

### 3.1 First-Time User Journey

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| FTU-001 | App launches to mode selection | 1. Fresh install app 2. Open app | Mode selection screen displays with Couples and Family options | Critical | ⬜ |
| FTU-002 | Couples mode selection | 1. Tap "Couples Mode" card | Mode selected, wizard welcome screen appears | Critical | ⬜ |
| FTU-003 | Family mode selection | 1. Tap "Family Mode" card | Mode selected, wizard welcome screen appears | Critical | ⬜ |
| FTU-004 | Polaroid images load correctly | 1. View mode selection cards | All polaroid images load without errors, show relevant content | High | ⬜ |
| FTU-005 | Mode persists after app restart | 1. Select mode 2. Force close app 3. Reopen | Previously selected mode is remembered | Critical | ⬜ |

### 3.2 Onboarding Wizard Flow

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| OBW-001 | Wizard starts correctly | 1. Select mode 2. Tap "Let's Go!" | Progress to Question 1 (Category) | Critical | ⬜ |
| OBW-002 | Category selection | 1. Tap any category option | Option highlights, progresses to Question 2 | Critical | ⬜ |
| OBW-003 | Budget selection | 1. Select category 2. Tap budget option | Option highlights, progresses to Question 3 | Critical | ⬜ |
| OBW-004 | Timing selection | 1. Progress to Q3 2. Tap timing option | Option highlights, progresses to Question 4 | Critical | ⬜ |
| OBW-005 | Setting selection triggers generation | 1. Progress to Q4 2. Tap Indoor/Outdoor/Either | Activity generation starts, scratch card appears | Critical | ⬜ |
| OBW-006 | Progress bar updates correctly | 1. Progress through wizard | Bar fills proportionally: 25%, 50%, 75%, 100% | Medium | ⬜ |
| OBW-007 | Back button works | 1. Progress to Q3 2. Tap "Back" | Returns to Q2, progress bar updates | High | ⬜ |
| OBW-008 | Back button not shown on welcome | 1. View wizard welcome | No back button visible | Medium | ⬜ |
| OBW-009 | All category options visible | 1. Progress to Q1 | Couples: Chill, Active, Creative, Foodie, Adventure. Family: Chill, Active, Creative, Educational, Outdoor | High | ⬜ |
| OBW-010 | Premium category badge shows | 1. View category options as free user | Adventure (Couples) / Outdoor (Family) shows "PRO" badge | High | ⬜ |
| OBW-011 | Premium category prompts upgrade | 1. As free user, tap premium category | Alert shows with upgrade option | High | ⬜ |

### 3.3 Complete User Session Flow

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| CUS-001 | Full flow: Mode → Wizard → Scratch → Save | 1. Select mode 2. Complete wizard 3. Scratch card 4. Save to Memory Book | Activity saved, confirmation shown | Critical | ⬜ |
| CUS-002 | Generate → Regenerate → Save | 1. Generate activity 2. Tap regenerate 3. Scratch new card 4. Save | New activity generated, scratch count increments | Critical | ⬜ |
| CUS-003 | Save → View in Memory Book | 1. Save activity 2. Navigate to Memory Book tab | Saved activity appears in list | Critical | ⬜ |
| CUS-004 | Complete activity workflow | 1. Save activity 2. Open from Memory Book 3. Mark complete 4. Add rating | Activity shows as completed with stars | High | ⬜ |
| CUS-005 | Share activity workflow | 1. Generate activity 2. Tap Share | Native share sheet opens with formatted text | High | ⬜ |

---

## 4. Feature-by-Feature Testing

### 4.1 Mode Selection Screen

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| MODE-001 | Couples polaroid images are relevant | Inspect couples mode card images | Shows couples on dates, romantic activities | High | ⬜ |
| MODE-002 | Family polaroid images are relevant | Inspect family mode card images | Shows families doing activities together | High | ⬜ |
| MODE-003 | Card tap feedback | 1. Press and hold mode card | Visual press state (opacity change) | Medium | ⬜ |
| MODE-004 | "You can switch anytime" text visible | View mode selection | Text shown below cards | Low | ⬜ |
| MODE-005 | Mode switch from header | 1. Select mode 2. Navigate to Settings 3. Change mode | Mode changes, wizard resets | High | ⬜ |

### 4.2 Home Screen Header

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| HDR-001 | Logo displays correctly | View home screen | App logo icon visible | Medium | ⬜ |
| HDR-002 | App name shows | View home screen | "Scratch & Go" text visible | Medium | ⬜ |
| HDR-003 | Mode label accurate | 1. Select Couples 2. View header | Shows "Couples Mode" | High | ⬜ |
| HDR-004 | Premium badge shows for premium users | 1. As premium user, view header | "PRO" badge next to app name | High | ⬜ |
| HDR-005 | Location selector visible | View home screen | Location button in header right | High | ⬜ |

### 4.3 Location Features

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| LOC-001 | Auto-location detection (with permission) | 1. Allow location permission 2. View header | Current city name shown | Critical | ⬜ |
| LOC-002 | Location permission denial handling | 1. Deny location permission | App continues to work, manual entry available | Critical | ⬜ |
| LOC-003 | Manual location entry | 1. Tap location selector 2. Enter city name | Location updates, persists | High | ⬜ |
| LOC-004 | Location persists across sessions | 1. Set location 2. Close app 3. Reopen | Location retained | High | ⬜ |
| LOC-005 | Weather data displays | 1. With location set 2. View wizard Q4 | Shows current temp and conditions | Medium | ⬜ |
| LOC-006 | Weather influences suggestions | 1. Set location with rain 2. Generate activity | Activity mentions indoor or accounts for weather | Medium | ⬜ |
| LOC-007 | Location influences activity content | 1. Set specific city 2. Generate activity | Activity references local venues/features | Medium | ⬜ |
| LOC-008 | Web geolocation fallback | 1. On web browser 2. Allow location | Location detected via web API | High | ⬜ |

### 4.4 Memory Book

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| MEM-001 | Empty state displays correctly | 1. Fresh user 2. Navigate to Memory Book | Helpful empty state message shown | High | ⬜ |
| MEM-002 | Saved activities appear | 1. Save activity 2. Open Memory Book | Activity card visible in list | Critical | ⬜ |
| MEM-003 | Activity card shows all info | View saved activity card | Title, description, emoji, category, cost visible | High | ⬜ |
| MEM-004 | Tabs work: Saved vs Completed | 1. Save activity 2. Complete activity 3. Switch tabs | Saved tab shows all, Completed tab shows only completed | High | ⬜ |
| MEM-005 | Search filters by title | 1. Enter search term 2. View results | Only matching activities shown | High | ⬜ |
| MEM-006 | Search filters by description | 1. Search word in description | Matching activities found | Medium | ⬜ |
| MEM-007 | Category filter works | 1. Apply category filter | Only that category's activities shown | High | ⬜ |
| MEM-008 | Budget filter works | 1. Apply budget filter | Only matching budget activities shown | High | ⬜ |
| MEM-009 | Sort by date (newest first) | 1. Apply "Recently Saved" sort | Most recent at top | Medium | ⬜ |
| MEM-010 | Sort alphabetically | 1. Apply "A to Z" sort | Alphabetical order | Medium | ⬜ |
| MEM-011 | Sort by rating | 1. Rate activities 2. Apply "Highest Rated" sort | Highest rated at top | Medium | ⬜ |
| MEM-012 | Pull-to-refresh works | 1. Pull down on list | Refresh animation, list updates | Medium | ⬜ |
| MEM-013 | Delete activity with confirmation | 1. Tap delete 2. Confirm in dialog | Activity removed from list | High | ⬜ |
| MEM-014 | Delete activity cancellation | 1. Tap delete 2. Cancel in dialog | Activity remains | Medium | ⬜ |
| MEM-015 | Mark as complete | 1. Tap complete button | Activity moves to completed, shows checkmark | High | ⬜ |
| MEM-016 | Mark as incomplete | 1. On completed activity, tap incomplete | Removes from completed tab | High | ⬜ |
| MEM-017 | Star rating works (1-5) | 1. Tap stars on completed activity | Rating saves and displays | High | ⬜ |
| MEM-018 | Navigate to detail screen | 1. Tap activity card | Opens activity detail screen | High | ⬜ |
| MEM-019 | Filter badge shows when active | 1. Apply any filter | Badge indicator visible | Medium | ⬜ |
| MEM-020 | Clear filters works | 1. Apply filters 2. Clear all | All activities shown again | Medium | ⬜ |

### 4.5 Activity Detail Screen

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| DET-001 | All activity info displays | Open saved activity | Title, description, emoji, category, cost, duration, pro tip visible | Critical | ⬜ |
| DET-002 | Share button works | 1. Tap Share button | Native share sheet opens | High | ⬜ |
| DET-003 | Add to Queue button works | 1. Tap Add to Queue 2. Enter optional note | Activity added to queue, confirmation shown | High | ⬜ |
| DET-004 | Add to Calendar button works | 1. Tap Add to Calendar 2. Select date/time | Date/time picker opens | High | ⬜ |
| DET-005 | Calendar event created | 1. Complete calendar flow | Event created in device calendar | High | ⬜ |
| DET-006 | Calendar permission handling | 1. Deny calendar permission 2. Try Add to Calendar | Graceful error message | High | ⬜ |
| DET-007 | Notes editing works | 1. Tap edit notes 2. Enter text 3. Save | Notes saved and displayed | High | ⬜ |
| DET-008 | Rating displays correctly | View rated activity | Stars filled according to rating | Medium | ⬜ |
| DET-009 | Delete from detail screen | 1. Tap delete 2. Confirm | Activity deleted, navigates back | High | ⬜ |
| DET-010 | Back navigation works | 1. Tap back button/gesture | Returns to Memory Book | High | ⬜ |
| DET-011 | Supplies info shows when present | View activity with supplies | Supplies section visible | Medium | ⬜ |

### 4.6 Collaborative Queue

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| QUE-001 | Queue tab accessible | Navigate to Queue tab | Queue screen loads | High | ⬜ |
| QUE-002 | Empty state shows | 1. Fresh queue 2. View | Helpful empty state message | High | ⬜ |
| QUE-003 | Add from scratch card | 1. Generate activity 2. Tap "Save for Later" | Activity appears in queue | High | ⬜ |
| QUE-004 | Add from activity detail | 1. Open saved activity 2. Tap "Add to Queue" | Activity added with optional note | High | ⬜ |
| QUE-005 | Pending tab shows unvoted | View Pending tab | Activities awaiting votes shown | High | ⬜ |
| QUE-006 | Approved tab shows consensus | View Approved tab | Activities with enough yes votes shown | High | ⬜ |
| QUE-007 | Thumbs up voting | 1. Tap thumbs up | Vote recorded, count updates | Critical | ⬜ |
| QUE-008 | Thumbs down voting | 1. Tap thumbs down | Vote recorded, count updates | Critical | ⬜ |
| QUE-009 | Vote counts display | View activity in queue | Yes/No vote counts visible | High | ⬜ |
| QUE-010 | Activity moves to approved (2 yes) | 1. Give 2 yes votes | Activity moves to Approved tab | High | ⬜ |
| QUE-011 | Activity removed (2 no votes) | 1. Give 2 no votes | Activity removed from queue | High | ⬜ |
| QUE-012 | Change vote works | 1. Vote yes 2. Vote no | Vote changes, counts update | Medium | ⬜ |
| QUE-013 | Voted state shown | After voting | Button shows user's choice highlighted | Medium | ⬜ |
| QUE-014 | Save approved to Memory Book | 1. Go to approved activity 2. Tap Save | Activity saved to Memory Book | High | ⬜ |
| QUE-015 | Delete from queue | 1. Tap delete 2. Confirm | Activity removed | High | ⬜ |
| QUE-016 | Pull-to-refresh works | Pull down on queue list | List refreshes | Medium | ⬜ |

### 4.7 Stats Dashboard

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| STA-001 | Stats tab accessible | Navigate to Stats tab | Stats screen loads | High | ⬜ |
| STA-002 | Empty state for new users | 1. Fresh user 2. View stats | Friendly message encouraging activity | High | ⬜ |
| STA-003 | Total scratches accurate | 1. Scratch N times 2. View stats | Counter shows N | High | ⬜ |
| STA-004 | Total saved accurate | 1. Save N activities 2. View stats | Counter shows N | High | ⬜ |
| STA-005 | Total completed accurate | 1. Complete N activities 2. View stats | Counter shows N | High | ⬜ |
| STA-006 | Current month scratches | 1. Scratch this month 2. View stats | Monthly counter accurate | Medium | ⬜ |
| STA-007 | Time spent calculation | 1. Complete activities 2. View stats | Time displayed (hours/minutes) | Medium | ⬜ |
| STA-008 | Money invested calculation | 1. Complete activities with cost 2. View | Estimated money shown | Medium | ⬜ |
| STA-009 | Favorite categories display | 1. Scratch various categories 2. View | Top categories with percentages | Medium | ⬜ |
| STA-010 | Current streak shows | 1. Complete activities in consecutive weeks 2. View | Streak counter displays | Medium | ⬜ |
| STA-011 | Longest streak tracks | Build and break streak | Longest streak recorded | Low | ⬜ |
| STA-012 | Monthly recap section | View stats | Current month stats summarized | Medium | ⬜ |
| STA-013 | Weekly activity chart | View stats | Last 12 weeks bar chart visible | Low | ⬜ |

### 4.8 Settings Screen

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| SET-001 | Settings accessible | Navigate to Settings | Settings screen loads | High | ⬜ |
| SET-002 | Subscription status accurate (free) | As free user, view subscription | Shows "Free" with "3 free scratches per month" | High | ⬜ |
| SET-003 | Subscription status accurate (premium) | As premium user, view subscription | Shows "Premium" badge with renewal date | High | ⬜ |
| SET-004 | Trial days remaining shows | During trial, view subscription | Shows "X days remaining in trial" | High | ⬜ |
| SET-005 | Upgrade button works (free user) | 1. As free user 2. Tap Upgrade | Navigates to paywall | High | ⬜ |
| SET-006 | Manage Subscription button (premium) | 1. As premium 2. Tap Manage | Shows platform-specific instructions/link | High | ⬜ |
| SET-007 | Restore Purchases works | 1. Tap Restore Purchases | Loading state, then result message | High | ⬜ |
| SET-008 | Mode selection works | 1. Tap Couples/Family mode buttons | Mode changes with confirmation | High | ⬜ |
| SET-009 | Mode gradient on active | View mode buttons | Active mode has gradient styling | Low | ⬜ |
| SET-010 | Alcohol activities toggle | Toggle switch | Preference saves immediately | High | ⬜ |
| SET-011 | Religious activities toggle | Toggle on | Religion picker appears | High | ⬜ |
| SET-012 | Religion selection | 1. Enable religious 2. Select religion | Religion saves and displays | High | ⬜ |
| SET-013 | Religion edit button | 1. With religion set 2. Tap Edit | Religion picker reopens | Medium | ⬜ |
| SET-014 | Kid-friendly toggle | Toggle switch | Preference saves | Medium | ⬜ |
| SET-015 | Outdoor adventures toggle | Toggle switch | Preference saves | Medium | ⬜ |
| SET-016 | Arts & culture toggle | Toggle switch | Preference saves | Medium | ⬜ |
| SET-017 | Live entertainment toggle | Toggle switch | Preference saves | Medium | ⬜ |
| SET-018 | Reset preferences with confirmation | 1. Tap Reset 2. Confirm | All preferences reset to defaults | High | ⬜ |
| SET-019 | Reset preferences cancellation | 1. Tap Reset 2. Cancel | Preferences unchanged | Medium | ⬜ |
| SET-020 | Privacy Policy link | Tap Privacy Policy | Opens URL (or shows message) | High | ⬜ |
| SET-021 | Terms of Service link | Tap Terms of Service | Opens URL (or shows message) | High | ⬜ |
| SET-022 | Version number displays | View settings footer | Shows "Version 1.0.0" | Low | ⬜ |

### 4.9 Premium Subscription & Paywall

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| PAY-001 | Paywall opens as modal | Navigate to paywall | Full-screen modal with close button | High | ⬜ |
| PAY-002 | Benefits list displays | View paywall | Unlimited scratches, exclusive categories, priority support, ad-free | High | ⬜ |
| PAY-003 | Monthly plan shows | View paywall | $4.99/month option visible | Critical | ⬜ |
| PAY-004 | Yearly plan shows | View paywall | $39.99/year option with savings badge | Critical | ⬜ |
| PAY-005 | "Save 33%" badge on yearly | View yearly plan | Badge visible | Medium | ⬜ |
| PAY-006 | Plan selection highlights | 1. Tap monthly 2. Tap yearly | Selected plan visually highlighted | High | ⬜ |
| PAY-007 | Subscribe button works | 1. Select plan 2. Tap Subscribe | Purchase flow initiates (mock in dev) | Critical | ⬜ |
| PAY-008 | Loading state during purchase | Initiate purchase | Loading indicator shows | High | ⬜ |
| PAY-009 | Success state after purchase | Complete purchase | Success message, premium status updates | Critical | ⬜ |
| PAY-010 | Restore purchases button | Tap Restore | Checks for previous purchases | High | ⬜ |
| PAY-011 | Close button dismisses | Tap X button | Modal closes, returns to previous screen | High | ⬜ |
| PAY-012 | Terms and privacy links | View paywall footer | Links to legal documents | Medium | ⬜ |
| PAY-013 | Auto-renewal disclaimer | View paywall | Subscription terms clearly stated | High | ⬜ |

---

## 5. Scratch Card Deep Dive

This is the core interaction of the app and requires extensive testing.

### 5.1 Basic Scratch Functionality

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| SCR-001 | Card renders with gradient | Complete wizard | Scratch card displays with pink gradient overlay | Critical | ⬜ |
| SCR-002 | Shimmer animation plays | View unscratched card | Shimmer effect animates across card | Medium | ⬜ |
| SCR-003 | "Scratch to Reveal" text visible | View unscratched card | Text clearly visible on gradient | High | ⬜ |
| SCR-004 | Touch registers scratch | Touch and drag on card | Scratch marks appear where finger touches | Critical | ⬜ |
| SCR-005 | Multi-touch scratching | Use multiple fingers | All touches register scratches | Medium | ⬜ |
| SCR-006 | Scratch reveals content underneath | Scratch card surface | Activity content visible through scratched areas | Critical | ⬜ |
| SCR-007 | Progressive reveal | Scratch ~25% of card | Full content reveals automatically | Critical | ⬜ |
| SCR-008 | Reveal animation smooth | Reach threshold | Gradient fades away smoothly (400ms) | High | ⬜ |
| SCR-009 | Haptic feedback on scratch (mobile) | Scratch on native mobile | Light haptic pulses during scratching | Medium | ⬜ |
| SCR-010 | Success haptic on reveal | Complete scratch | Stronger success haptic fires | Medium | ⬜ |
| SCR-011 | Scroll disabled during scratch | Touch card to scratch | Page doesn't scroll while scratching | Critical | ⬜ |
| SCR-012 | Scroll re-enabled after scratch | Complete scratch | Page scrolling works again | High | ⬜ |

### 5.2 Scratch Card - Web Specific

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| SCRW-001 | Mouse scratching works | Click and drag with mouse | Scratches appear | Critical | ⬜ |
| SCRW-002 | Touch scratching works (mobile web) | Touch and drag on mobile browser | Scratches appear | Critical | ⬜ |
| SCRW-003 | Cursor changes to crosshair | Hover over card | Cursor shows as crosshair | Medium | ⬜ |
| SCRW-004 | Clip-path reveals work | Scratch on web | Content shows through scratched holes | Critical | ⬜ |
| SCRW-005 | No page scroll during scratch | Scratch with touch on mobile web | Page stays in place | Critical | ⬜ |
| SCRW-006 | Mouse leave ends scratch | Move mouse off card | Scratch session ends cleanly | Medium | ⬜ |

### 5.3 Scratch Card - Native Specific

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| SCRN-001 | MaskedView renders correctly | View card on iOS/Android | Gradient mask displays properly | Critical | ⬜ |
| SCRN-002 | PanResponder captures gestures | Touch card | Gestures captured without conflicts | Critical | ⬜ |
| SCRN-003 | Gesture doesn't leak to parent | Scratch near edges | Only card responds, not parent scroll | High | ⬜ |
| SCRN-004 | Fast scratching works | Quickly swipe across card | All strokes register | High | ⬜ |
| SCRN-005 | Scratch on device rotation | Rotate device mid-scratch | Card adjusts, scratch continues | Medium | ⬜ |

### 5.4 Scratch Card States

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| SCS-001 | Loading state during generation | Start generation | "Creating your adventure..." with spinner | Critical | ⬜ |
| SCS-002 | Disabled state blocks interaction | During generation, try to scratch | No scratching occurs | High | ⬜ |
| SCS-003 | Revealed state shows all content | After full reveal | Activity title, description, stats, buttons all visible | Critical | ⬜ |
| SCS-004 | Reset on regenerate | 1. Reveal card 2. Tap regenerate | Fresh scratch layer appears | Critical | ⬜ |
| SCS-005 | Reset on "Change preferences" | 1. Reveal card 2. Tap change preferences | Wizard restarts, card resets when returning | High | ⬜ |

### 5.5 Revealed Content

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| REV-001 | Activity title displays | Reveal card | Title visible (3-6 words, not truncated) | Critical | ⬜ |
| REV-002 | Description displays | Reveal card | 2-3 sentence description visible | Critical | ⬜ |
| REV-003 | Duration stat shows | Reveal card | Duration badge visible (e.g., "1-2 hours") | High | ⬜ |
| REV-004 | Cost stat shows | Reveal card | Cost badge visible (Free, $, $$, $$$) | High | ⬜ |
| REV-005 | Pro tip displays | Reveal card | Pro tip section with useful advice | High | ⬜ |
| REV-006 | Weather box shows (if location set) | With location, reveal card | Current weather displayed | Medium | ⬜ |
| REV-007 | Save to Memory Book button | View revealed card | Primary save button visible | Critical | ⬜ |
| REV-008 | Save button disabled after saving | 1. Save activity 2. View button | Button shows "Saved to Memory Book", disabled | High | ⬜ |
| REV-009 | Generate New Idea button | View revealed card | Regenerate button visible | Critical | ⬜ |
| REV-010 | Share link works | Tap Share link | Share sheet opens | High | ⬜ |
| REV-011 | Save for Later link works | Tap Save for Later | Activity added to queue | High | ⬜ |
| REV-012 | Not Interested link works | Tap Not Interested | Confirmation dialog, then clears activity | High | ⬜ |
| REV-013 | Long title doesn't break layout | Generate activity with long title | Text wraps or truncates gracefully | High | ⬜ |
| REV-014 | Long description doesn't overflow | Generate verbose activity | Description contained within card | High | ⬜ |

---

## 6. Filter & Recommendation Testing

### 6.1 Filter Accuracy

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| FIL-001 | Category "Chill" produces chill activities | Select Chill, generate 5x | Activities are relaxed, low-key | Critical | ⬜ |
| FIL-002 | Category "Active" produces active activities | Select Active, generate 5x | Activities involve movement/sports | Critical | ⬜ |
| FIL-003 | Category "Creative" produces creative activities | Select Creative, generate 5x | Activities involve making/creating | Critical | ⬜ |
| FIL-004 | Category "Foodie" produces food activities | Select Foodie (Couples), generate 5x | Activities involve food/dining | High | ⬜ |
| FIL-005 | Category "Educational" produces learning activities | Select Educational (Family), generate 5x | Activities involve learning | High | ⬜ |
| FIL-006 | Budget "Free" = $0 activities | Select Free, generate 10x | No activities suggest spending money | Critical | ⬜ |
| FIL-007 | Budget "$" = under $25 | Select $, generate 5x | Suggested costs under $25 | Critical | ⬜ |
| FIL-008 | Budget "$$" = $25-75 | Select $$, generate 5x | Suggested costs in range | High | ⬜ |
| FIL-009 | Budget "$$$" = $75+ | Select $$$, generate 5x | Higher-end activities | High | ⬜ |
| FIL-010 | Timing "Quick" = 1-2 hours | Select Quick, generate 5x | Activities completable in 1-2 hours | Critical | ⬜ |
| FIL-011 | Timing "Half Day" = 3-5 hours | Select Half Day, generate 5x | Activities take ~half day | High | ⬜ |
| FIL-012 | Timing "Full Day" = 6+ hours | Select Full Day, generate 5x | All-day activities | High | ⬜ |
| FIL-013 | Setting "Indoor" = indoor only | Select Indoor, generate 5x | All activities are indoors | Critical | ⬜ |
| FIL-014 | Setting "Outdoor" = outdoor only | Select Outdoor, generate 5x | All activities are outdoors | Critical | ⬜ |
| FIL-015 | Setting "Either" = mixed | Select Either, generate 5x | Mix of indoor and outdoor | High | ⬜ |

### 6.2 Mode-Specific Suggestions

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| MOD-001 | Couples mode = romantic/date activities | In Couples mode, generate 10x | Activities suitable for couples, romantic undertones | Critical | ⬜ |
| MOD-002 | Couples mode avoids kid activities | In Couples mode, generate 10x | No activities specifically for children | High | ⬜ |
| MOD-003 | Family mode = family-friendly | In Family mode, generate 10x | Activities suitable for kids and parents | Critical | ⬜ |
| MOD-004 | Family mode avoids adult-only | In Family mode, generate 10x | No bars, nightclubs, adult venues | Critical | ⬜ |

### 6.3 Content Preference Filtering

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| PRF-001 | Alcohol OFF excludes bars | 1. Disable alcohol 2. Generate 10x | No bars, breweries, wine tastings | Critical | ⬜ |
| PRF-002 | Alcohol ON includes bars | 1. Enable alcohol 2. Generate 10x | May include alcohol-related venues | High | ⬜ |
| PRF-003 | Religious ON includes faith activities | 1. Enable religious 2. Select religion 3. Generate | May include church/temple activities | High | ⬜ |
| PRF-004 | Religious OFF excludes faith activities | 1. Disable religious 2. Generate 10x | No religious venues or activities | Critical | ⬜ |

### 6.4 Location-Based Recommendations

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| LRE-001 | Activities reference local area | 1. Set NYC location 2. Generate | References NYC-area venues/features | High | ⬜ |
| LRE-002 | Coastal city gets beach activities | 1. Set Miami 2. Select Outdoor 3. Generate | Beach-related suggestions | Medium | ⬜ |
| LRE-003 | Mountain area gets hiking activities | 1. Set Denver 2. Select Active 3. Generate | Hiking/mountain suggestions | Medium | ⬜ |
| LRE-004 | Weather integration | 1. Rainy weather 2. Select Either | Indoor activities preferred | High | ⬜ |

### 6.5 Intelligent Recommendations (Learning)

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| INT-001 | "Not Interested" influences future | 1. Mark 3 similar activities "Not Interested" 2. Generate | Avoids similar activities | High | ⬜ |
| INT-002 | Completed activities influence suggestions | 1. Complete 5 "Chill" activities 2. Select Any 3. Generate | Leans toward Chill-style activities | Medium | ⬜ |
| INT-003 | History prevents duplicates | 1. Generate 10 activities 2. Generate more | No exact title repeats | High | ⬜ |
| INT-004 | Preferred budget learned | 1. Save/complete mostly "$" activities 2. Select Any budget | Tends toward $ activities | Low | ⬜ |

### 6.6 Activity Quality

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| QUA-001 | Activities are specific, not generic | Generate 20 activities | Specific venues/actions, not "go for a walk" | Critical | ⬜ |
| QUA-002 | Activities are realistic | Generate 20 activities | Actually doable, not over-the-top | Critical | ⬜ |
| QUA-003 | Activities match everyday life | Generate with $ budget | Affordable, accessible suggestions | High | ⬜ |
| QUA-004 | Pro tips are genuinely useful | Read 10 pro tips | Actionable advice, not generic | High | ⬜ |
| QUA-005 | Descriptions are clear | Read 20 descriptions | Explain what to do specifically | High | ⬜ |
| QUA-006 | No cheesy/cliche suggestions | Generate 20 activities | Avoid "romantic picnic under stars" unless natural | Medium | ⬜ |

---

## 7. Platform-Specific Testing

### 7.1 iOS Testing

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| IOS-001 | Safe area on notched devices | View on iPhone X+ | Content respects notch, home bar | Critical | ⬜ |
| IOS-002 | Haptics work | Scratch card, complete actions | Haptic feedback fires | High | ⬜ |
| IOS-003 | Share sheet opens | Tap Share | Native iOS share sheet | High | ⬜ |
| IOS-004 | Calendar permission flow | Tap Add to Calendar | iOS permission dialog | High | ⬜ |
| IOS-005 | Location permission flow | First launch | iOS location permission dialog | High | ⬜ |
| IOS-006 | Dark mode appearance | System dark mode enabled | App looks correct (already dark theme) | Medium | ⬜ |
| IOS-007 | Background/foreground transitions | Background app, return | State preserved | High | ⬜ |
| IOS-008 | iOS keyboard handling | Open search/input fields | Keyboard doesn't obscure input | High | ⬜ |
| IOS-009 | Swipe back gesture | Swipe from left edge | Navigates back | Medium | ⬜ |

### 7.2 Android Testing

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| AND-001 | Safe area handling | View on various Android phones | Status bar, navigation bar respected | Critical | ⬜ |
| AND-002 | Haptics work | Scratch card, complete actions | Haptic feedback fires | High | ⬜ |
| AND-003 | Share functionality | Tap Share | Android share intent opens | High | ⬜ |
| AND-004 | Calendar permission flow | Tap Add to Calendar | Android permission dialog | High | ⬜ |
| AND-005 | Location permission flow | First launch | Android location permission | High | ⬜ |
| AND-006 | Back button behavior | Press hardware/gesture back | Proper navigation | High | ⬜ |
| AND-007 | Keyboard handling | Open input fields | Keyboard adjusts view properly | High | ⬜ |
| AND-008 | Memory management | Use app for 30+ minutes | No crashes, OOM errors | High | ⬜ |

### 7.3 Web Testing

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| WEB-001 | Chrome desktop works | Full test on Chrome | All features functional | Critical | ⬜ |
| WEB-002 | Safari desktop works | Full test on Safari | All features functional | High | ⬜ |
| WEB-003 | Firefox desktop works | Full test on Firefox | All features functional | Medium | ⬜ |
| WEB-004 | Mobile Chrome responsive | Test on mobile viewport | Layout adapts correctly | Critical | ⬜ |
| WEB-005 | Mobile Safari responsive | Test on iOS Safari | Layout adapts correctly | Critical | ⬜ |
| WEB-006 | Scratch card works on web | Mouse and touch scratching | Both input methods work | Critical | ⬜ |
| WEB-007 | Haptics skipped on web | Perform haptic actions | No errors, graceful skip | High | ⬜ |
| WEB-008 | Location falls back to web API | Allow location in browser | Location detected | High | ⬜ |
| WEB-009 | Calendar shows info message | Tap Add to Calendar | Shows "not available on web" message | High | ⬜ |
| WEB-010 | Share works on web | Tap Share | Web Share API or fallback | High | ⬜ |
| WEB-011 | AsyncStorage works | Save data, refresh, data persists | localStorage polyfill works | Critical | ⬜ |

---

## 8. Edge Cases & Failure Scenarios

### 8.1 Network Errors

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| NET-001 | No internet - activity generation | 1. Disable network 2. Try to generate | User-friendly error, retry option | Critical | ⬜ |
| NET-002 | Slow network - generation timeout | 1. Throttle to very slow 2. Generate | Timeout after 30s, error message | High | ⬜ |
| NET-003 | Network restored - retry works | 1. Get error 2. Restore network 3. Retry | Generation succeeds | High | ⬜ |
| NET-004 | Offline - Memory Book works | 1. Disable network 2. View saved activities | Saved activities display from cache | High | ⬜ |
| NET-005 | Intermittent connection | 1. Flaky network 2. Generate | Retry logic handles failures | Medium | ⬜ |

### 8.2 Permission Errors

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| PRM-001 | Location denied - app continues | Deny location | Manual location entry available | Critical | ⬜ |
| PRM-002 | Calendar denied - graceful message | Deny calendar, try Add to Calendar | Helpful error message | High | ⬜ |
| PRM-003 | Permissions changed in settings | 1. Deny permission 2. Enable in system settings 3. Return | App respects new permissions | Medium | ⬜ |

### 8.3 Data Edge Cases

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| DAT-001 | 0 saved activities | Fresh user views Memory Book | Empty state displays | High | ⬜ |
| DAT-002 | 100+ saved activities | Save many activities | List performs smoothly | High | ⬜ |
| DAT-003 | Very long activity title | (If generated) view card | Text wraps or truncates | High | ⬜ |
| DAT-004 | Special characters in notes | Add notes with emojis, symbols | Saves and displays correctly | Medium | ⬜ |
| DAT-005 | Corrupted AsyncStorage | (Manual test) corrupt data | App handles gracefully, resets if needed | High | ⬜ |

### 8.4 User Behavior Edge Cases

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| BHV-001 | Rapid button tapping | Tap Save button 10x quickly | Only one save, no duplicates | High | ⬜ |
| BHV-002 | Rapid regenerate tapping | Tap regenerate 5x quickly | One generation at a time | High | ⬜ |
| BHV-003 | App backgrounded during generation | 1. Start generating 2. Background app 3. Return | Generation completes or shows error | High | ⬜ |
| BHV-004 | Force kill during generation | 1. Start generating 2. Force kill | App restarts cleanly | High | ⬜ |
| BHV-005 | Back navigation during wizard | 1. Start wizard 2. Navigate away 3. Return | Wizard state preserved or reset cleanly | Medium | ⬜ |
| BHV-006 | Screen rotation | Rotate device mid-use | Layout adapts, no crashes | Medium | ⬜ |
| BHV-007 | Low memory conditions | (Simulate on device) | App doesn't crash | Medium | ⬜ |

### 8.5 Scratch Limit Edge Cases

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| LIM-001 | Free user at limit | Use 3 scratches, try 4th | Alert shows, upgrade prompt | Critical | ⬜ |
| LIM-002 | Counter resets monthly | 1. Use scratches 2. Change month 3. Open app | Counter reset to 0 | High | ⬜ |
| LIM-003 | Premium user unlimited | As premium, scratch 10+ times | No limit message | Critical | ⬜ |
| LIM-004 | Regenerate counts against limit | 1. Generate 2. Regenerate | Both count toward limit | High | ⬜ |
| LIM-005 | Scratch count persists | 1. Use 2 scratches 2. Close app 3. Reopen | Shows 1 remaining | High | ⬜ |

---

## 9. Performance Testing

### 9.1 Load Times

| Test ID | Description | Target | Steps | Status |
|---------|-------------|--------|-------|--------|
| PRF-001 | App cold start | <3 seconds | Fresh launch, time to interactive | ⬜ |
| PRF-002 | Activity generation | <10 seconds typical | Generate activity, measure time | ⬜ |
| PRF-003 | Memory Book load | <1 second | Navigate to Memory Book | ⬜ |
| PRF-004 | Stats dashboard load | <1 second | Navigate to Stats | ⬜ |
| PRF-005 | Screen transitions | <300ms | Navigate between tabs | ⬜ |
| PRF-006 | Image loading | <2 seconds | Polaroid images on mode selection | ⬜ |

### 9.2 Animation Performance

| Test ID | Description | Target | Steps | Status |
|---------|-------------|--------|-------|--------|
| ANI-001 | Scratch card animation | 60fps | Scratch while watching frame rate | ⬜ |
| ANI-002 | Shimmer animation | 60fps, smooth | Watch shimmer effect | ⬜ |
| ANI-003 | Screen transitions | 60fps | Navigate rapidly between screens | ⬜ |
| ANI-004 | Progress bar animation | Smooth | Watch wizard progress bar | ⬜ |
| ANI-005 | Pull-to-refresh | Smooth | Pull down on lists | ⬜ |
| ANI-006 | Modal presentation | Smooth | Open paywall, settings | ⬜ |

### 9.3 Memory Usage

| Test ID | Description | Steps | Expected Result | Status |
|---------|-------------|-------|-----------------|--------|
| MEM-001 | No memory leaks | Use app for 30+ minutes, monitor memory | Memory stable, no growth | ⬜ |
| MEM-002 | Image memory management | Navigate between screens with images | Images released from memory when not visible | ⬜ |
| MEM-003 | Long list performance | Scroll Memory Book with 100+ items | No jank, smooth scrolling | ⬜ |
| MEM-004 | Background memory | Background app for 10 minutes | App resumes without crash | ⬜ |

---

## 10. Security & Privacy Testing

### 10.1 Data Storage

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| SEC-001 | No sensitive data in logs | Check console output | No PII, API keys, or secrets logged | Critical | ⬜ |
| SEC-002 | AsyncStorage data appropriate | Inspect stored data | Only necessary data stored | High | ⬜ |
| SEC-003 | No API keys in client code | Search codebase | Keys only via environment variables | Critical | ⬜ |
| SEC-004 | Environment variables used correctly | Check config | Secrets not hardcoded | Critical | ⬜ |

### 10.2 Network Security

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| NET-001 | HTTPS for all requests | Monitor network | All API calls use HTTPS | Critical | ⬜ |
| NET-002 | No data leakage in URLs | Check request URLs | No sensitive data in query strings | High | ⬜ |

### 10.3 Privacy Compliance

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| PRI-001 | Privacy policy accessible | Navigate to Settings | Link to privacy policy works | Critical | ⬜ |
| PRI-002 | Terms of service accessible | Navigate to Settings | Link to ToS works | Critical | ⬜ |
| PRI-003 | Location data handling | Grant/revoke location | Data cleared when permission revoked | High | ⬜ |
| PRI-004 | Data deletion possible | Check reset functionality | User can clear their data | High | ⬜ |

---

## 11. Accessibility Testing

### 11.1 Visual Accessibility

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| ACC-001 | Text contrast ratios | Inspect all text | Meets WCAG AA (4.5:1 minimum) | High | ⬜ |
| ACC-002 | Touch targets | Measure interactive elements | Minimum 44x44 points | High | ⬜ |
| ACC-003 | Focus indicators | Tab through elements (web) | Focused element clearly visible | Medium | ⬜ |
| ACC-004 | Color not sole indicator | Review UI | Color + shape/text for status | Medium | ⬜ |

### 11.2 Screen Reader Testing

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| SR-001 | VoiceOver navigation (iOS) | Enable VoiceOver, navigate app | All elements announced | High | ⬜ |
| SR-002 | TalkBack navigation (Android) | Enable TalkBack, navigate app | All elements announced | High | ⬜ |
| SR-003 | Button labels | Navigate to buttons | Purpose clearly announced | High | ⬜ |
| SR-004 | Image descriptions | Navigate to images | Alt text or decorative marked | Medium | ⬜ |
| SR-005 | Form input labels | Navigate to inputs | Labels announced | High | ⬜ |
| SR-006 | Reading order logical | Read through screen | Logical top-to-bottom, left-to-right | Medium | ⬜ |

### 11.3 Motor Accessibility

| Test ID | Description | Steps | Expected Result | Priority | Status |
|---------|-------------|-------|-----------------|----------|--------|
| MOT-001 | Scratch card alternative | For users who can't scratch | Consider auto-reveal option | Medium | ⬜ |
| MOT-002 | No time limits | Review all timed elements | No forced time constraints | High | ⬜ |
| MOT-003 | Large tap targets | Inspect all buttons | Easy to tap | High | ⬜ |

---

## 12. Regression Checklist

Run this checklist after any code changes to ensure nothing is broken.

### Quick Smoke Test (5 minutes)

- [ ] App launches
- [ ] Mode selection works
- [ ] Wizard completes
- [ ] Scratch card scratches
- [ ] Activity generates
- [ ] Activity saves to Memory Book
- [ ] Memory Book displays saved activities
- [ ] Settings screen opens
- [ ] No console errors

### Full Regression (30 minutes)

- [ ] All FTU tests pass
- [ ] All wizard tests pass
- [ ] All scratch card tests pass
- [ ] All Memory Book tests pass
- [ ] All Queue tests pass
- [ ] All Stats tests pass
- [ ] All Settings tests pass
- [ ] All filter tests pass
- [ ] Share functionality works
- [ ] Location functionality works
- [ ] Premium features work
- [ ] Web compatibility verified
- [ ] No TypeScript errors
- [ ] No ESLint errors

---

## 13. Sign-Off Requirements

### Pre-Launch Sign-Off

**QA Lead Sign-Off**

- [ ] All Critical priority tests pass
- [ ] All High priority tests pass (or documented exceptions)
- [ ] No known crash bugs
- [ ] Performance targets met
- [ ] Security checklist complete

**Signature:** _________________ **Date:** _________

**Product Owner Sign-Off**

- [ ] Feature set complete
- [ ] User experience acceptable
- [ ] Known issues documented and acceptable
- [ ] Ready for app store submission

**Signature:** _________________ **Date:** _________

**Developer Sign-Off**

- [ ] All automated tests pass
- [ ] No unresolved TypeScript/ESLint errors
- [ ] Error handling in place
- [ ] Logging appropriate for production

**Signature:** _________________ **Date:** _________

---

## Test Results Summary

| Category | Total Tests | Pass | Fail | Blocked | Not Run |
|----------|-------------|------|------|---------|---------|
| User Flows | 17 | | | | |
| Mode Selection | 5 | | | | |
| Header | 5 | | | | |
| Location | 8 | | | | |
| Memory Book | 20 | | | | |
| Activity Detail | 11 | | | | |
| Queue | 16 | | | | |
| Stats | 13 | | | | |
| Settings | 22 | | | | |
| Paywall | 13 | | | | |
| Scratch Card | 36 | | | | |
| Filters | 27 | | | | |
| Platform: iOS | 9 | | | | |
| Platform: Android | 8 | | | | |
| Platform: Web | 11 | | | | |
| Edge Cases | 22 | | | | |
| Performance | 14 | | | | |
| Security | 7 | | | | |
| Accessibility | 14 | | | | |
| **TOTAL** | **278** | | | | |

---

## Issue Tracking Template

### Issue #[NUMBER]

**Title:** [Brief description]

**Severity:** Critical / High / Medium / Low

**Test ID:** [Related test ID]

**Environment:** [Device, OS, Browser]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:** [What should happen]

**Actual Result:** [What happened]

**Screenshots/Videos:** [Attach if applicable]

**Notes:** [Additional context]

**Status:** Open / In Progress / Fixed / Verified / Won't Fix

---

## Appendix: Test Data

### Test Accounts

| Account Type | Email | Password | Notes |
|--------------|-------|----------|-------|
| Free User | test.free@example.com | [secure] | 0 scratches used |
| Premium Monthly | test.premium@example.com | [secure] | Active subscription |
| Trial User | test.trial@example.com | [secure] | 3 days remaining |

### Test Locations

| Location | Lat/Long | Weather (typical) | Use Case |
|----------|----------|-------------------|----------|
| New York, NY | 40.7128, -74.0060 | Variable | Urban activities |
| Miami, FL | 25.7617, -80.1918 | Warm/Sunny | Beach activities |
| Denver, CO | 39.7392, -104.9903 | Cold/Dry | Mountain activities |
| Seattle, WA | 47.6062, -122.3321 | Rainy | Indoor fallback |

---

**Document Version History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-07 | Rork | Initial comprehensive test plan |

---

*This document is the final source of truth for pre-launch testing. All tests must be executed and documented before app store submission.*
