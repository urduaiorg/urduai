# Urdu AI — V3.1 Sprint Guide for Antigravity
**Date:** March 4, 2026
**From:** Qaisar Roonjha
**Project:** Urdu AI Mobile App (React Native / Expo SDK 53)
**Sprint Goal:** Engagement & Growth Features

---

## SPRINT OVERVIEW

Two high-impact features to ship:
1. **Shareable Progress Cards** — Generate beautiful branded cards users share on WhatsApp/Instagram
2. **Achievement Badges System** — Collectible badges for milestones with a profile screen

Both are **client-side only** — no backend changes needed. Pure AsyncStorage + UI.

---

## DESIGN SYSTEM (Same as V3)

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-dark` | `#003366` | Gradient start, backgrounds |
| `--brand-darker` | `#001933` | Gradient end |
| `--brand-gold` | `#FFD700` | Accent, CTAs, highlights |
| `--text-primary` | `#FFFFFF` | All primary text |
| `--text-muted` | `rgba(255,255,255,0.6)` | Descriptions, hints |
| `--card-bg` | `rgba(255,255,255,0.05)` | Card backgrounds |
| `--card-border` | `rgba(255,255,255,0.1)` | Card borders |
| `--success` | `#4CD964` | Success states |
| `--error` | `#FF4444` | Error / urgent states |
| Font heading | `Montserrat-Bold` | All headings |
| Font body | `Montserrat-Regular` | Body text |
| Font semi | `Montserrat-SemiBold` | Labels, sub-headings |
| Border radius | `16px` | Cards |
| Border radius | `12px` | Buttons |

---

## EXISTING CODE YOU WILL USE

### Streak Service (`services/streakService.js`)
```js
import { getStreakData, recordActivity } from '../services/streakService';

// getStreakData() returns:
{
    currentStreak: 12,      // consecutive days
    longestStreak: 25,      // all-time best
    lastActiveDate: '2026-03-04',  // YYYY-MM-DD
    totalDaysActive: 45     // total days ever
}
```

### Course Progress (AsyncStorage)
```js
// Key: 'course_progress_ai-masterclass'
// Value:
{
    modulesCompleted: ['module-1', 'module-2', ...],
    quizScores: { 'module-2': 80, 'module-3': 90, ... },
    finalExamScore: 85  // null if not taken
}
```

### Course Data (`data/courses.json`)
- Course ID: `ai-masterclass`
- Total modules: 8 (module-1 through module-8)
- Module 1 has no quiz (intro video)
- Modules 2-8 each have quiz questions
- Passing score: 70%

### Scholarship Status (AsyncStorage)
```js
// Key: '@urai_scholarship'
// Check if applied:
const data = await AsyncStorage.getItem('@urai_scholarship');
// { applied: true, date: '2026-03-01', ... }
```

### PDF Guides Downloaded (AsyncStorage)
```js
// Key: '@urai_downloads'
// Array of downloaded guide IDs
```

---

## TASK 1: Shareable Progress Cards

### What It Does
When a user hits a milestone, generate a branded image card they can share on WhatsApp, Instagram, etc. This is the **#1 growth feature** — every share = free marketing in Pakistan's WhatsApp groups.

### New File: `services/shareCardService.js`

This service generates the card data and triggers sharing.

```js
import { Share, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStreakData } from './streakService';
import { captureRef } from 'react-native-view-shot';

const SHARE_COUNT_KEY = '@urai_share_count';

// Generate share data for different milestone types
export async function getShareCardData(type, extra = {}) {
    const streak = await getStreakData();
    const progressRaw = await AsyncStorage.getItem('course_progress_ai-masterclass');
    const progress = progressRaw ? JSON.parse(progressRaw) : {};
    const modulesCompleted = progress.modulesCompleted?.length || 0;
    const totalModules = 8;
    const percentage = Math.round((modulesCompleted / totalModules) * 100);

    const base = {
        streak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalDays: streak.totalDaysActive,
        modulesCompleted,
        totalModules,
        percentage,
    };

    switch (type) {
        case 'module_complete':
            return {
                ...base,
                headline: `Module ${extra.moduleNumber} مکمل! ✅`,
                headlineEn: `Completed Module ${extra.moduleNumber} of ${totalModules}`,
                subtext: `${percentage}% مکمل — ${modulesCompleted}/${totalModules} ماڈیولز`,
                emoji: '📚',
            };

        case 'quiz_pass':
            return {
                ...base,
                headline: `کوئز پاس! 🎯 ${extra.score}%`,
                headlineEn: `Scored ${extra.score}% on Module ${extra.moduleNumber} Quiz`,
                subtext: `${streak.currentStreak} دن کی سٹریک 🔥`,
                emoji: '🧠',
            };

        case 'streak_milestone':
            return {
                ...base,
                headline: `${streak.currentStreak} دن کی سٹریک! 🔥`,
                headlineEn: `${streak.currentStreak}-Day Learning Streak`,
                subtext: `مسلسل سیکھ رہا ہوں — Urdu AI پر`,
                emoji: '🔥',
            };

        case 'certificate':
            return {
                ...base,
                headline: `سرٹیفکیٹ حاصل کیا! 🎓`,
                headlineEn: `Earned Urdu AI Master Class Certificate`,
                subtext: `${streak.totalDaysActive} دنوں میں مکمل کیا`,
                emoji: '🎓',
            };

        case 'scholarship':
            return {
                ...base,
                headline: `Google AI سکالرشپ! 💎`,
                headlineEn: `Unlocked FREE Google AI Scholarship`,
                subtext: `اردو اے آئی سے مفت سکالرشپ ملی`,
                emoji: '💎',
            };

        default:
            return {
                ...base,
                headline: `Urdu AI سیکھ رہا ہوں! 📱`,
                headlineEn: `Learning AI in Urdu`,
                subtext: `${percentage}% مکمل — ${streak.currentStreak} دن سٹریک 🔥`,
                emoji: '🚀',
            };
    }
}

// Share the captured card image + text
export async function shareCard(viewRef, type, extra = {}) {
    try {
        // Capture the card component as an image
        const uri = await captureRef(viewRef, {
            format: 'png',
            quality: 1,
        });

        const data = await getShareCardData(type, extra);

        const message = Platform.select({
            android: `${data.headlineEn}\n\n🔥 ${data.streak}-day streak | ${data.percentage}% complete\n\nLearn AI in Urdu — FREE!\n👉 https://urduai.org/app`,
            ios: '',
        });

        await Share.share({
            message,
            url: Platform.OS === 'ios' ? uri : undefined,
            title: 'Urdu AI Progress',
        });

        // Track share count
        const count = parseInt(await AsyncStorage.getItem(SHARE_COUNT_KEY) || '0');
        await AsyncStorage.setItem(SHARE_COUNT_KEY, String(count + 1));

    } catch (err) {
        console.warn('Share failed:', err);
    }
}

export async function getShareCount() {
    return parseInt(await AsyncStorage.getItem(SHARE_COUNT_KEY) || '0');
}
```

### New Component: `components/ShareCard.tsx`

The visual card that gets captured as an image and shared.

**Design Spec:**
- Size: 1080x1080 (square, perfect for Instagram/WhatsApp)
- Background: LinearGradient `['#003366', '#001933']`
- Top: Urdu AI logo/text + gold accent
- Center: Milestone headline (Urdu, large, Montserrat-Bold, white)
- Below: English subtext (smaller, gold)
- Stats row: Streak 🔥 | Modules 📚 | Days 📅
- Bottom: "urduai.org/app" + "Pakistan's First AI Learning App" text
- Gold border (2px) with rounded corners (24px)

```jsx
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ShareCard = forwardRef(({ data }, ref) => (
    <View ref={ref} collapsable={false} style={styles.cardWrapper}>
        <LinearGradient colors={['#003366', '#001933']} style={styles.card}>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logoText}>Urdu <Text style={styles.logoGold}>AI</Text></Text>
            </View>

            {/* Main Emoji */}
            <Text style={styles.emoji}>{data.emoji}</Text>

            {/* Headline (Urdu) */}
            <Text style={styles.headline}>{data.headline}</Text>

            {/* English subtitle */}
            <Text style={styles.subtitleEn}>{data.headlineEn}</Text>

            {/* Subtext */}
            <Text style={styles.subtext}>{data.subtext}</Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{data.streak}</Text>
                    <Text style={styles.statLabel}>🔥 سٹریک</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{data.modulesCompleted}/{data.totalModules}</Text>
                    <Text style={styles.statLabel}>📚 ماڈیولز</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{data.totalDays}</Text>
                    <Text style={styles.statLabel}>📅 دن</Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerUrl}>urduai.org/app</Text>
                <Text style={styles.footerTag}>Pakistan's First AI Learning App</Text>
            </View>

        </LinearGradient>
    </View>
));

const styles = StyleSheet.create({
    cardWrapper: {
        width: 360,
        height: 360,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    card: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
    },
    logoText: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 22,
        color: '#fff',
    },
    logoGold: {
        color: '#FFD700',
    },
    emoji: {
        fontSize: 48,
    },
    headline: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 22,
        color: '#fff',
        textAlign: 'center',
    },
    subtitleEn: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 13,
        color: '#FFD700',
        textAlign: 'center',
        marginTop: -4,
    },
    subtext: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 18,
        color: '#FFD700',
    },
    statLabel: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    footer: {
        alignItems: 'center',
    },
    footerUrl: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 14,
        color: '#FFD700',
    },
    footerTag: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
    },
});

export default ShareCard;
```

### Required Package
```bash
npx expo install react-native-view-shot
```
This lets us capture a React Native view as a PNG image for sharing.

### Where to Add Share Buttons

**1. Course Player — After module completion (`app/course-player.tsx`)**
When user marks a module complete, show a "Share Progress" button:
```jsx
import { shareCard, getShareCardData } from '../services/shareCardService';
import ShareCard from '../components/ShareCard';

// In the module completion success handler:
// Show a modal with ShareCard + "Share on WhatsApp" button
```

**2. Quiz Results Screen (`app/quiz.tsx`)**
After showing quiz score, add share button:
```jsx
// In the isFinished results view, add:
<TouchableOpacity onPress={() => shareCard(cardRef, 'quiz_pass', { score, moduleNumber })}>
    <Text>📤 شیئر کریں</Text>
</TouchableOpacity>
```

**3. Certificate Screen (`app/certificate.tsx`)**
Already has share — enhance it with the branded card instead of plain text.

**4. Streak Milestones — Auto-prompt**
In `services/streakService.js`, after `recordActivity()` returns, check if streak is 7, 14, 30, 60, 100. If milestone hit, return a flag:
```js
const milestones = [7, 14, 30, 60, 100];
if (milestones.includes(newStreak)) {
    updated.milestoneHit = true;
}
```
Then in `app/course-player.tsx` and `app/quiz.tsx`, if `milestoneHit === true`, show a congratulations modal with the share card.

### Share Card Triggers Summary

| Trigger | Type | When |
|---------|------|------|
| Module complete | `module_complete` | After marking module done |
| Quiz passed | `quiz_pass` | On results screen, score >= 70 |
| Streak milestone | `streak_milestone` | 7, 14, 30, 60, 100 day streak |
| Certificate earned | `certificate` | After certificate generation |
| Scholarship applied | `scholarship` | After successful application |

---

## TASK 2: Achievement Badges System

### What It Does
Collectible badges for milestones. Displayed on a new Profile/Achievements screen. Each badge earned = a shareable moment (uses ShareCard from Task 1).

### New File: `services/badgeService.js`

```js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStreakData } from './streakService';

const BADGES_KEY = '@urai_badges';

// ── Badge Definitions ──
export const BADGE_DEFINITIONS = [
    {
        id: 'first_step',
        title: 'First Step',
        titleUr: 'پہلا قدم',
        description: 'Complete your first module',
        descriptionUr: 'اپنا پہلا ماڈیول مکمل کریں',
        emoji: '🌟',
        color: '#FFD700',
        category: 'course',
    },
    {
        id: 'halfway',
        title: 'Halfway There',
        titleUr: 'آدھا سفر',
        description: 'Complete 4 modules',
        descriptionUr: '4 ماڈیول مکمل کریں',
        emoji: '⚡',
        color: '#FF9500',
        category: 'course',
    },
    {
        id: 'graduate',
        title: 'Graduate',
        titleUr: 'فارغ التحصیل',
        description: 'Earn your certificate',
        descriptionUr: 'اپنا سرٹیفکیٹ حاصل کریں',
        emoji: '🎓',
        color: '#4CD964',
        category: 'course',
    },
    {
        id: 'quiz_master',
        title: 'Quiz Master',
        titleUr: 'کوئز ماسٹر',
        description: 'Score 100% on any quiz',
        descriptionUr: 'کسی بھی کوئز میں 100% سکور کریں',
        emoji: '🧠',
        color: '#5856D6',
        category: 'quiz',
    },
    {
        id: 'perfect_run',
        title: 'Perfect Run',
        titleUr: 'مکمل کامیابی',
        description: 'Score 100% on the Final Exam',
        descriptionUr: 'فائنل ایگزام میں 100% سکور',
        emoji: '💯',
        color: '#FF2D55',
        category: 'quiz',
    },
    {
        id: 'week_warrior',
        title: 'Week Warrior',
        titleUr: 'ہفتے کا بہادر',
        description: '7-day learning streak',
        descriptionUr: '7 دن کی سٹریک',
        emoji: '🔥',
        color: '#FF3B30',
        category: 'streak',
    },
    {
        id: 'month_strong',
        title: 'Month Strong',
        titleUr: 'مہینے کا چیمپئن',
        description: '30-day learning streak',
        descriptionUr: '30 دن کی سٹریک',
        emoji: '🏔️',
        color: '#007AFF',
        category: 'streak',
    },
    {
        id: 'century',
        title: 'Century Club',
        titleUr: 'سنچری کلب',
        description: '100-day learning streak',
        descriptionUr: '100 دن کی سٹریک',
        emoji: '👑',
        color: '#FFD700',
        category: 'streak',
    },
    {
        id: 'bookworm',
        title: 'Bookworm',
        titleUr: 'کتابی کیڑا',
        description: 'Download 5 PDF guides',
        descriptionUr: '5 پی ڈی ایف گائیڈز ڈاؤنلوڈ کریں',
        emoji: '📚',
        color: '#34C759',
        category: 'library',
    },
    {
        id: 'scholar',
        title: 'Scholar',
        titleUr: 'سکالر',
        description: 'Apply for Google AI Scholarship',
        descriptionUr: 'Google AI سکالرشپ کے لیے اپلائی کریں',
        emoji: '💎',
        color: '#5AC8FA',
        category: 'scholarship',
    },
    {
        id: 'speed_learner',
        title: 'Speed Learner',
        titleUr: 'تیز سیکھنے والا',
        description: 'Complete 3 modules in one day',
        descriptionUr: 'ایک دن میں 3 ماڈیول مکمل کریں',
        emoji: '⚡',
        color: '#FFCC00',
        category: 'course',
    },
    {
        id: 'sharer',
        title: 'Community Builder',
        titleUr: 'کمیونٹی بلڈر',
        description: 'Share your progress 3 times',
        descriptionUr: 'اپنی پیشرفت 3 بار شیئر کریں',
        emoji: '🤝',
        color: '#FF6B6B',
        category: 'social',
    },
];

// ── Get all earned badges ──
export async function getEarnedBadges() {
    const raw = await AsyncStorage.getItem(BADGES_KEY);
    return raw ? JSON.parse(raw) : [];
    // Returns array of: { id: 'first_step', earnedAt: '2026-03-01T10:30:00Z' }
}

// ── Award a badge (if not already earned) ──
export async function awardBadge(badgeId) {
    const earned = await getEarnedBadges();
    if (earned.find(b => b.id === badgeId)) return null; // Already earned

    const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId);
    if (!badge) return null;

    earned.push({
        id: badgeId,
        earnedAt: new Date().toISOString(),
    });

    await AsyncStorage.setItem(BADGES_KEY, JSON.stringify(earned));
    return badge; // Return badge data for celebration popup
}

// ── Check and award all eligible badges ──
// Call this after any progress change
export async function checkAndAwardBadges() {
    const progressRaw = await AsyncStorage.getItem('course_progress_ai-masterclass');
    const progress = progressRaw ? JSON.parse(progressRaw) : {};
    const streak = await getStreakData();
    const downloadsRaw = await AsyncStorage.getItem('@urai_downloads');
    const downloads = downloadsRaw ? JSON.parse(downloadsRaw) : [];
    const scholarshipRaw = await AsyncStorage.getItem('@urai_scholarship');
    const scholarship = scholarshipRaw ? JSON.parse(scholarshipRaw) : {};
    const shareCount = parseInt(await AsyncStorage.getItem('@urai_share_count') || '0');

    const modulesCompleted = progress.modulesCompleted || [];
    const quizScores = progress.quizScores || {};
    const newBadges = [];

    // Course badges
    if (modulesCompleted.length >= 1) {
        const b = await awardBadge('first_step');
        if (b) newBadges.push(b);
    }
    if (modulesCompleted.length >= 4) {
        const b = await awardBadge('halfway');
        if (b) newBadges.push(b);
    }
    if (progress.certificateId) {
        const b = await awardBadge('graduate');
        if (b) newBadges.push(b);
    }

    // Quiz badges
    const hasHundred = Object.values(quizScores).some(s => s === 100);
    if (hasHundred) {
        const b = await awardBadge('quiz_master');
        if (b) newBadges.push(b);
    }
    if (progress.finalExamScore === 100) {
        const b = await awardBadge('perfect_run');
        if (b) newBadges.push(b);
    }

    // Streak badges
    if (streak.currentStreak >= 7 || streak.longestStreak >= 7) {
        const b = await awardBadge('week_warrior');
        if (b) newBadges.push(b);
    }
    if (streak.currentStreak >= 30 || streak.longestStreak >= 30) {
        const b = await awardBadge('month_strong');
        if (b) newBadges.push(b);
    }
    if (streak.currentStreak >= 100 || streak.longestStreak >= 100) {
        const b = await awardBadge('century');
        if (b) newBadges.push(b);
    }

    // Library badge
    if (downloads.length >= 5) {
        const b = await awardBadge('bookworm');
        if (b) newBadges.push(b);
    }

    // Scholarship badge
    if (scholarship.applied) {
        const b = await awardBadge('scholar');
        if (b) newBadges.push(b);
    }

    // Sharer badge
    if (shareCount >= 3) {
        const b = await awardBadge('sharer');
        if (b) newBadges.push(b);
    }

    // Speed learner — check modulesCompleted timestamps
    // This requires tracking completion timestamps (see note below)

    return newBadges; // Array of newly awarded badges (for popup celebrations)
}

// ── Get full badge display data ──
export async function getBadgesForDisplay() {
    const earned = await getEarnedBadges();
    const earnedIds = new Set(earned.map(b => b.id));

    return BADGE_DEFINITIONS.map(badge => ({
        ...badge,
        earned: earnedIds.has(badge.id),
        earnedAt: earned.find(b => b.id === badge.id)?.earnedAt || null,
    }));
}
```

### New Screen: `app/achievements.tsx`

A profile/achievements screen showing all badges.

**Design Spec:**
- Same gradient background as all screens
- Header: "کامیابیاں / Achievements" with back button
- Stats summary card at top: Total Badges Earned / Total Available
- Badge grid (3 columns)
- Earned badges: Full color, emoji, title
- Locked badges: Greyed out, lock icon, description of how to earn
- Tap earned badge → shows celebration card with share button
- Tap locked badge → shows requirement

```jsx
// Screen structure:
// <LinearGradient>
//   <SafeAreaView>
//     <Header with back button>
//
//     <Stats Card>
//       🏆 {earned}/{total} Badges Earned
//       🔥 {currentStreak} Day Streak
//       📅 {totalDays} Days Active
//     </Stats Card>
//
//     <ScrollView>
//       <Section "Course Badges">
//         <BadgeGrid> ... </BadgeGrid>
//       </Section>
//       <Section "Quiz Badges">
//         <BadgeGrid> ... </BadgeGrid>
//       </Section>
//       <Section "Streak Badges">
//         <BadgeGrid> ... </BadgeGrid>
//       </Section>
//       <Section "Other Badges">
//         <BadgeGrid> ... </BadgeGrid>
//       </Section>
//     </ScrollView>
//   </SafeAreaView>
// </LinearGradient>
```

**Badge Tile Design (Earned):**
```
┌──────────────┐
│     🌟       │  ← emoji, large (40px)
│  First Step  │  ← title, Montserrat-Bold, 12px, white
│  پہلا قدم    │  ← titleUr, Montserrat-Bold, 12px, gold
└──────────────┘
Background: rgba(255,215,0,0.1) with badge.color as border-left (3px)
```

**Badge Tile Design (Locked):**
```
┌──────────────┐
│     🔒       │  ← lock icon, greyed
│  Week Warr.  │  ← title, dimmed (0.3 opacity)
│  7-day str.. │  ← description hint, muted
└──────────────┘
Background: rgba(255,255,255,0.03), no border color
```

### Add Route in `app/_layout.tsx`
```jsx
<Stack.Screen name="achievements" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
```

### Navigation Entry Point

Add an "Achievements" button on the **courses screen** (`app/courses.tsx`) or the **home screen** (`app/index.js`).

**Option A — Courses Screen (Recommended):**
Add a row below the course card:
```jsx
<TouchableOpacity onPress={() => router.push('/achievements')} style={styles.achievementButton}>
    <Text style={styles.achievementEmoji}>🏆</Text>
    <View>
        <Text style={styles.achievementTitle}>کامیابیاں</Text>
        <Text style={styles.achievementSubtitle}>Achievements — {earnedCount}/{totalCount} badges</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#FFD700" />
</TouchableOpacity>
```

**Option B — Home Screen FAB:**
Add a trophy icon next to the existing library FAB button in `app/index.js`.

### Where to Call `checkAndAwardBadges()`

Call after every progress event to check if new badges should be awarded:

| Location | File | When |
|----------|------|------|
| Module complete | `app/course-player.tsx` | After `AsyncStorage.setItem` for progress |
| Quiz complete | `app/quiz.tsx` | After saving quiz score |
| Certificate earned | `app/certificate.tsx` | After certificate generation |
| Scholarship applied | `app/scholarship.tsx` | After successful application |
| PDF downloaded | `app/library.tsx` | After download completes |
| App launch | `app/_layout.tsx` | On mount (catch any missed badges) |

**Important:** `checkAndAwardBadges()` returns an array of newly awarded badges. If array is not empty, show a celebration modal:
```jsx
const newBadges = await checkAndAwardBadges();
if (newBadges.length > 0) {
    // Show celebration modal for first badge in array
    // With haptic feedback: Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    // Include "Share" button that uses ShareCard from Task 1
}
```

### New Component: `components/BadgeCelebration.tsx`

Modal popup when a new badge is earned.

**Design Spec:**
- Full-screen overlay with blur/dim background
- Centered card with confetti-style gold particles (or simple gold glow)
- Large emoji (80px)
- "نیا بیج حاصل کیا! 🎉" (New Badge Earned!)
- Badge name (Urdu + English)
- Description
- Two buttons: "شیئر کریں" (Share) | "ٹھیک ہے" (OK)
- Haptic feedback on appear

---

## TASK 3: Integration Points (Connecting Both Tasks)

### Speed Learner Badge — Track Module Timestamps
To award `speed_learner` (3 modules in 1 day), you need to track WHEN each module was completed.

Update course-player.tsx module completion to save timestamp:
```js
// When completing a module, also track the timestamp
const timestampKey = `@urai_module_timestamp_${moduleId}`;
await AsyncStorage.setItem(timestampKey, new Date().toISOString());
```

Then in `badgeService.js`, add a check:
```js
// Count modules completed today
const today = new Date().toISOString().split('T')[0];
let todayCount = 0;
for (const modId of modulesCompleted) {
    const ts = await AsyncStorage.getItem(`@urai_module_timestamp_${modId}`);
    if (ts && ts.startsWith(today)) todayCount++;
}
if (todayCount >= 3) {
    const b = await awardBadge('speed_learner');
    if (b) newBadges.push(b);
}
```

### Badge Count on Home Screen
Show badge count next to streak on the home screen (`app/index.js`):
```
🔥 12  |  🏆 5/12
```

### Share Card Integration
Every badge celebration modal should have a Share button that:
1. Renders the `ShareCard` component with badge data
2. Captures it with `react-native-view-shot`
3. Opens native share dialog with WhatsApp-friendly text

---

## FILE MAP — What to Create / Modify

### New Files (Create)
| File | Purpose |
|------|---------|
| `services/shareCardService.js` | Share card data generation + sharing logic |
| `services/badgeService.js` | Badge definitions, awarding, checking |
| `components/ShareCard.tsx` | Visual share card component |
| `components/BadgeCelebration.tsx` | Badge earned celebration modal |
| `app/achievements.tsx` | Achievements/Profile screen |

### Modified Files
| File | Change |
|------|--------|
| `app/_layout.tsx` | Add `achievements` route |
| `app/course-player.tsx` | Add share button on module complete, call `checkAndAwardBadges()`, track timestamps |
| `app/quiz.tsx` | Add share button on results, call `checkAndAwardBadges()` |
| `app/certificate.tsx` | Enhance share with ShareCard, call `checkAndAwardBadges()` |
| `app/scholarship.tsx` | Call `checkAndAwardBadges()` after apply |
| `app/library.tsx` | Call `checkAndAwardBadges()` after download |
| `app/courses.tsx` | Add Achievements entry button with badge count |
| `app/index.js` | Add badge count next to streak display |
| `services/streakService.js` | Add `milestoneHit` flag for 7/14/30/60/100 streaks |

### New Package
```bash
npx expo install react-native-view-shot
```

---

## TESTING CHECKLIST

### Share Cards
- [ ] Module completion shows share button
- [ ] Quiz pass (>= 70%) shows share button
- [ ] Share opens native share dialog
- [ ] Shared image shows correct Urdu text, streak count, progress
- [ ] WhatsApp share includes app link text
- [ ] Share count increments in AsyncStorage
- [ ] Card looks good on both Android and iOS

### Badges
- [ ] `first_step` awards after completing module-1
- [ ] `halfway` awards after completing 4 modules
- [ ] `graduate` awards after earning certificate
- [ ] `quiz_master` awards when any quiz score = 100
- [ ] `perfect_run` awards when final exam = 100
- [ ] `week_warrior` awards at 7-day streak
- [ ] `bookworm` awards after 5 PDF downloads
- [ ] `scholar` awards after scholarship application
- [ ] `sharer` awards after 3 shares
- [ ] Already-earned badges don't award twice
- [ ] Celebration modal appears with haptic feedback
- [ ] Locked badges show greyed with requirement text
- [ ] Achievements screen loads correctly with badge grid
- [ ] Badge count shows on courses/home screen

### Edge Cases
- [ ] No crash if AsyncStorage is empty (fresh install)
- [ ] Share works offline (image capture, share dialog)
- [ ] Badges persist across app restarts
- [ ] Multiple badges earned at once (e.g., first module + first_step badge)

---

## PRIORITY ORDER

1. **`services/badgeService.js`** — Foundation for everything
2. **`services/shareCardService.js`** — Sharing engine
3. **`components/ShareCard.tsx`** — Visual card
4. **`components/BadgeCelebration.tsx`** — Celebration modal
5. **`app/achievements.tsx`** — Achievements screen
6. **Integration** — Wire badges + share into existing screens
7. **Testing** — Full checklist above

---

## NOTES

- All text is bilingual (Urdu + English) — same pattern as existing screens
- All colors follow the existing design system — no new colors
- All fonts are Montserrat (Regular, SemiBold, Bold) — already loaded in `_layout.tsx`
- Haptic feedback on all celebrations: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`
- AsyncStorage keys all start with `@urai_` prefix — consistent with existing code
- No backend needed — everything is client-side
- Version remains `3.0.1` for this sprint
