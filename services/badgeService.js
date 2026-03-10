import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStreakData } from './streakService';
import { maybeRequestReview } from './reviewPromptService';

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
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
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
    await maybeRequestReview('badge', {
        badgeId,
        badgeCount: earned.length,
    });
    return badge; // Return badge data for celebration popup
}

// ── Check and award all eligible badges ──
export async function checkAndAwardBadges() {
    let progress = {};
    let downloads = [];
    let scholarship = {};

    try {
        const progressRaw = await AsyncStorage.getItem('course_progress_ai-masterclass');
        progress = progressRaw ? JSON.parse(progressRaw) : {};
    } catch (e) {
        // silent
    }

    const streak = await getStreakData();

    try {
        const downloadsRaw = await AsyncStorage.getItem('@urai_downloads');
        downloads = downloadsRaw ? JSON.parse(downloadsRaw) : [];
    } catch (e) {
        // silent
    }

    try {
        const scholarshipRaw = await AsyncStorage.getItem('@urai_scholarship');
        scholarship = scholarshipRaw ? JSON.parse(scholarshipRaw) : {};
    } catch (e) {
        // silent
    }

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

    return newBadges;
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
