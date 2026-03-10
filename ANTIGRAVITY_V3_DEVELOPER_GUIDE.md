# Urdu AI — V3 Developer Guide for Antigravity
**Date:** March 4, 2026
**From:** Qaisar Roonjha
**Project:** Urdu AI Mobile App (React Native / Expo SDK 53)

---

## WHAT'S ALREADY DONE (just review & test)

These files have been updated and are in the codebase. No new code needed — just verify they work.

### 1. Scholarship Service — Smart Spots Counter
**File:** `services/scholarshipService.js`
- Real Apps Script URL is set (line 3)
- NEW: `getSpotsInfo()` — returns smart Urdu display text based on % remaining
- Shows exact number ONLY when spots are below 50% (creates urgency)
- Above 50%: shows "سکالرشپ دستیاب ہے ✅" (no number)
- Below 50%: shows "⚡ 180 جگہیں باقی — ابھی اپلائی کریں"
- Below 20%: shows "🔥 صرف 45 جگہیں باقی ہیں! جلدی کریں"
- 0 spots: shows "اس ہفتے جگہیں ختم ہو گئیں — اگلے ہفتے کوشش کریں"
- Auto-scales to any MAX (500, 1000, 5000) — no code changes needed
- Old `getSpotsRemaining()` still works for backward compatibility
- Caches offline with AsyncStorage fallback

### 2. Local Notifications — Scholarship Unlock
**File:** `services/localNotifications.js`
- Added scholarship unlock notification in `onCertificateEarned()`
- Fires 2 hours after user earns certificate
- Message: "مفت Google AI سکالرشپ دستیاب ہے! 🎓"
- Identifier: `scholarship_unlock`

### 3. Certificate Screen — Share + Google AI CTA
**File:** `app/certificate.tsx`
- Added "Share Certificate" button (gold) — opens native share sheet
- Added "Get FREE Google AI Cert" button (Google blue #4285F4) — routes to /scholarship
- Added "Back to Courses" button
- Uses react-native-share for sharing

### 4. Navigation — Scholarship Route
**File:** `app/_layout.tsx`
- Scholarship route added: `<Stack.Screen name="scholarship" />`
- Animation: slide_from_bottom

### 5. PDF Guides Data
**File:** `data/guides.json`
- 9 PDF guides with metadata (id, title, titleUr, description, descriptionUr, driveFileId, category, icon)
- Categories: beginner (3), intermediate (4), advanced (2)
- Google Drive file IDs ready for direct download

### 6. Backend — Apps Script (Already Deployed)
**File:** `SCHOLARSHIP_APPS_SCRIPT_COMBINED.js` (reference only)
- URL: `https://script.google.com/macros/s/AKfycbzSPWYoZ18ry0ih3Sb1nv2UTsaUYmHWmCxlqaqXmSy0nIxpB4nwVKR-LTLdKAOrwTUQ/exec`
- API Key: `URAI-SCHOLARSHIP-2026`
- Endpoints:
  - `POST` — submit scholarship application (fullName, email, city, phone, deviceId)
  - `GET ?action=spots` — returns `{ spotsRemaining, totalSpots, weekOf }`
  - `GET ?action=check&email=x` — returns `{ applied, appliedDate, status }`
  - `GET ?action=stats&key=URAI-SCHOLARSHIP-2026` — admin stats

---

## WHAT ANTIGRAVITY NEEDS TO BUILD

### Task 1: Update Scholarship Screen — Smart Spots Display
**File:** `app/scholarship.tsx`
**Priority:** High
**Effort:** 30 min

Replace the current spots display logic. Instead of:
```js
import { getSpotsRemaining } from '../services/scholarshipService';
const spots = await getSpotsRemaining();
// Then manually showing "🔥 {spots} spots remaining"
```

Use:
```js
import { getSpotsInfo } from '../services/scholarshipService';
const spotsInfo = await getSpotsInfo();
// spotsInfo.displayText  → Ready-to-use Urdu string
// spotsInfo.showCount    → boolean (true only when <50%)
// spotsInfo.spotsRemaining → raw number
// spotsInfo.totalSpots   → max number
```

Just render `spotsInfo.displayText` directly — it handles all 4 states with proper Urdu text and emojis.

---

### Task 2: PDF Library Screen
**File to create:** `app/library.tsx`
**Priority:** High
**Effort:** 3-4 hours

Build a downloadable PDF guides library screen.

**Data source:** `data/guides.json` (already created, 9 guides)

**Design specs:**
- Dark blue background (#003366), gold accents (#FFD700)
- Glassmorphism cards (rgba(255,255,255,0.08) with blur)
- Montserrat font family
- RTL support for Urdu text
- Category filter tabs: All / Beginner / Intermediate / Advanced
- Each card shows: icon, title (English), titleUr (Urdu), description
- Download button per guide
- Show download progress
- "Open" button after downloaded

**Download approach:**
```js
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Google Drive direct download URL format:
const downloadUrl = `https://drive.google.com/uc?export=download&id=${guide.driveFileId}`;

// Download to local:
const fileUri = FileSystem.documentDirectory + `${guide.id}.pdf`;
const download = FileSystem.createDownloadResumable(downloadUrl, fileUri);
const result = await download.downloadAsync();

// Open/share:
await Sharing.shareAsync(result.uri);
```

**Storage tracking:**
- Use AsyncStorage to track which PDFs are downloaded
- Key: `@urai_library_downloaded` → JSON array of guide IDs
- Show download status icon (cloud-download vs checkmark)

**Navigation:**
- Route already works from home screen FAB (library icon)
- Add to `_layout.tsx`: `<Stack.Screen name="library" options={{ headerShown: false, animation: 'slide_from_bottom' }} />`

**Guide data structure (from guides.json):**
```json
{
  "id": "chatgpt-urdu",
  "title": "ChatGPT Urdu Guide",
  "titleUr": "چیٹ جی پی ٹی اردو گائیڈ",
  "description": "Learn how to use ChatGPT effectively in Urdu",
  "descriptionUr": "اردو میں ChatGPT استعمال کرنا سیکھیں",
  "driveFileId": "1_n3sJ94JKi2ek8GL6nqtEYp9jTPyLD4a",
  "category": "beginner",
  "icon": "chatbubbles"
}
```

**Icons used:** chatbubbles, book, logo-whatsapp, rocket, image, eye, logo-google, bulb, code-slash (all Ionicons)

---

### Task 3: OneSignal Push Notifications
**Priority:** Medium
**Effort:** 2-3 hours

Website already uses OneSignal for web push notifications.
- **App ID:** `3f0280f7-88ec-4dc0-9689-074f81ea0074`

**What to do:**
1. Install: `npx expo install onesignal-expo-plugin react-native-onesignal`
2. Add to `app.json` plugins:
```json
["onesignal-expo-plugin", {
  "mode": "production",
  "devTeam": "YOUR_APPLE_TEAM_ID"
}]
```
3. Initialize in `_layout.tsx`:
```js
import { OneSignal } from 'react-native-onesignal';

OneSignal.initialize('3f0280f7-88ec-4dc0-9689-074f81ea0074');
OneSignal.Notifications.requestPermission(true);
```
4. Tag users for segmentation:
```js
OneSignal.User.addTag('platform', 'mobile');
OneSignal.User.addTag('language', 'urdu');
```

**Result:** When Qaisar sends a push from OneSignal dashboard (new article, announcement), BOTH website subscribers AND app users receive it.

**Important:** Keep existing `expo-notifications` for LOCAL notifications (inactivity reminders, course progress, scholarship unlock). OneSignal is ONLY for remote/server-pushed notifications.

---

### Task 4: Learning Streaks
**File to create:** `services/streakService.js`
**Priority:** High
**Effort:** 2-3 hours

Track daily learning activity to keep users coming back.

**How it works:**
- A "streak day" counts when user completes at least 1 module OR opens a course
- Streak resets if user misses a full calendar day
- Show streak counter on home screen (🔥 badge)

**Data structure (AsyncStorage):**
```js
// Key: @urai_streak
{
  currentStreak: 5,          // consecutive days
  longestStreak: 12,         // all-time best
  lastActiveDate: '2026-03-04', // YYYY-MM-DD
  totalDaysActive: 28        // lifetime
}
```

**Core logic:**
```js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = '@urai_streak';

export async function recordActivity() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const data = await getStreakData();

    if (data.lastActiveDate === today) return data; // Already counted today

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newStreak;
    if (data.lastActiveDate === yesterday) {
        // Consecutive day — extend streak
        newStreak = data.currentStreak + 1;
    } else {
        // Streak broken — restart at 1
        newStreak = 1;
    }

    const updated = {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, data.longestStreak),
        lastActiveDate: today,
        totalDaysActive: data.totalDaysActive + 1,
    };

    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updated));
    return updated;
}

export async function getStreakData() {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    if (!raw) {
        return { currentStreak: 0, longestStreak: 0, lastActiveDate: null, totalDaysActive: 0 };
    }
    return JSON.parse(raw);
}
```

**Where to call `recordActivity()`:**
- In `course-player.tsx` when a module is completed (alongside existing `onModuleComplete`)
- In `quiz.tsx` when quiz is completed (alongside existing `onQuizComplete`)

**UI — Home screen streak badge:**
- Show 🔥 with number on home screen (e.g., "🔥 5 دن" or "🔥 5 Day Streak")
- Gold color (#FFD700) when active streak
- Gray when streak is 0
- Optional: milestone celebrations at 7, 14, 30 days (small animation/confetti)

**Streak-aware notifications (add to localNotifications.js):**
```js
// Evening reminder if user hasn't opened app today
// "آپ کا 5 دن کا سلسلہ ختم ہونے والا ہے! 🔥"
// "Your 5-day streak is about to end! Open the app to keep it alive."

export async function scheduleStreakReminder() {
    const data = await getStreakData();
    const today = new Date().toISOString().split('T')[0];

    if (data.currentStreak > 0 && data.lastActiveDate !== today) {
        await scheduleNotification(
            `🔥 آپ کا ${data.currentStreak} دن کا سلسلہ ختم ہونے والا ہے!`,
            `Open the app to keep your ${data.currentStreak}-day streak alive!`,
            0, // immediately (call this in evening check)
            'streak_reminder'
        );
    }
}
```

---

### Task 5: Notification Settings & Pause Controls
**File to create:** `app/settings.tsx` (or a modal in home screen)
**Priority:** Medium
**Effort:** 2 hours

Add notification settings so users don't feel spammed.

**Access:** Settings gear icon on home screen (top-right corner)

**Settings screen options:**

| Setting | Type | Storage Key | Default |
|---------|------|-------------|---------|
| Daily Reminder | Toggle | `@urai_daily_reminder` | ON |
| Streak Reminders | Toggle | `@urai_streak_notifications` | ON |
| Article/News (OneSignal) | Toggle | `@urai_onesignal_enabled` | ON |
| Pause All Notifications | Button → picker | `@urai_notifications_paused_until` | OFF |

**Pause options:** 1 day, 3 days, 1 week, Permanently

**Implementation for Pause:**
```js
// Store pause until timestamp
await AsyncStorage.setItem('@urai_notifications_paused_until',
  new Date(Date.now() + days * 86400000).toISOString()
);

// "Permanently" = set to year 2099
await AsyncStorage.setItem('@urai_notifications_paused_until', '2099-01-01T00:00:00.000Z');

// Check before scheduling ANY local notification:
async function isNotificationsPaused() {
    const pausedUntil = await AsyncStorage.getItem('@urai_notifications_paused_until');
    if (pausedUntil && new Date(pausedUntil) > new Date()) {
        return true; // Paused — skip notification
    }
    return false;
}
```

**For OneSignal toggle:**
```js
// User turns OFF article notifications:
OneSignal.User.pushSubscription.optOut();
await AsyncStorage.setItem('@urai_onesignal_enabled', 'false');

// User turns ON:
OneSignal.User.pushSubscription.optIn();
await AsyncStorage.setItem('@urai_onesignal_enabled', 'true');
```

**Add pause check to existing localNotifications.js:**
Update `scheduleNotification()` to check `isNotificationsPaused()` before scheduling. This way ALL local notifications respect the pause setting automatically.

**Settings screen design:**
- Same dark blue background
- Section headers in gold (#FFD700)
- Toggle switches (white track, gold thumb)
- Pause button opens bottom sheet with duration options

---

## DESIGN SYSTEM REFERENCE

| Token | Value | Usage |
|-------|-------|-------|
| Background | #003366 | All screens |
| Gold/Accent | #FFD700 | CTAs, highlights, "AI" text |
| Card BG | rgba(255,255,255,0.08) | Glassmorphism cards |
| Card Border | rgba(255,255,255,0.15) | Card borders |
| Text Primary | #FFFFFF | Headings, body |
| Text Secondary | rgba(255,255,255,0.7) | Subtitles, hints |
| Google Blue | #4285F4 | Google-related buttons |
| Success Green | #4CAF50 | Completed states |
| Font Regular | Montserrat-Regular | Body text |
| Font Bold | Montserrat-Bold | Headings |
| Font SemiBold | Montserrat-SemiBold | Subheadings |
| Border Radius | 16px | Cards |
| Border Radius | 12px | Buttons |

---

## FILE MAP — What's Where

```
services/
  scholarshipService.js    ← Updated (smart spots counter)
  localNotifications.js    ← Updated (scholarship unlock + ADD streak reminders)
  certificateSync.js       ← Existing (no changes)
  streakService.js         ← TO CREATE (daily learning streaks)
  downloadManager.js       ← TO CREATE (for PDF library)

data/
  guides.json              ← Created (9 PDF guides)
  scholarshipCourses.json  ← Existing (7 Google AI courses)

app/
  _layout.tsx              ← Updated (scholarship route added, ADD settings route)
  index.js                 ← Home screen (library FAB already there, ADD streak badge)
  scholarship.tsx          ← UPDATE NEEDED (use getSpotsInfo)
  certificate.tsx          ← Updated (share + Google AI buttons)
  library.tsx              ← TO CREATE (PDF library screen)
  settings.tsx             ← TO CREATE (notification controls)
  courses.tsx              ← Existing
  course-player.tsx        ← UPDATE (call recordActivity on module complete)
  quiz.tsx                 ← UPDATE (call recordActivity on quiz complete)
```

---

## TESTING CHECKLIST

- [ ] Scholarship: Complete masterclass → certificate → see share buttons + Google AI CTA
- [ ] Scholarship: Navigate to scholarship screen → see smart Urdu message (NOT a raw number when spots are plenty)
- [ ] Scholarship: Fill form → submit → check Google Sheet for new row
- [ ] Scholarship: Try duplicate email → should show "already applied" message
- [ ] Notifications: Earn certificate → get scholarship unlock notification after 2 hours
- [ ] Streaks: Complete a module → streak count goes to 1
- [ ] Streaks: Come back next day → streak increments to 2
- [ ] Streaks: Skip a day → streak resets to 0
- [ ] Streaks: Streak badge visible on home screen with 🔥
- [ ] Streaks: Evening reminder fires if user hasn't opened app today
- [ ] Settings: Toggle daily reminder ON/OFF
- [ ] Settings: Toggle streak reminders ON/OFF
- [ ] Settings: Toggle article notifications ON/OFF (OneSignal)
- [ ] Notifications: Test pause for 1 day → verify no notifications during pause
- [ ] Library: See all 9 guides with category filters
- [ ] Library: Download a PDF → progress shown → "Open" button appears
- [ ] Library: Offline → downloaded PDFs still accessible
- [ ] OneSignal: Send test notification from dashboard → app receives it
- [ ] OneSignal: Toggle off article notifications → stop receiving remote pushes
- [ ] Share: Certificate share opens native share sheet with bilingual message

---

## QUESTIONS?

Contact Qaisar: ai@urduai.org
