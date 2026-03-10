import { Share, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStreakData } from './streakService';
import { captureRef } from 'react-native-view-shot';
import { getWeeklyProgressSummary } from './weeklyProgressService';

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
        streak: streak.currentStreak || 0,
        longestStreak: streak.longestStreak || 0,
        totalDays: streak.totalDaysActive || 0,
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
                subtext: `${base.streak} دن کی سٹریک 🔥`,
                emoji: '🧠',
            };

        case 'streak_milestone':
            return {
                ...base,
                headline: `${base.streak} دن کی سٹریک! 🔥`,
                headlineEn: `${base.streak}-Day Learning Streak`,
                subtext: `مسلسل سیکھ رہا ہوں — Urdu AI پر`,
                emoji: '🔥',
            };

        case 'certificate':
            return {
                ...base,
                headline: `سرٹیفکیٹ حاصل کیا! 🎓`,
                headlineEn: `Earned Urdu AI Master Class Certificate`,
                subtext: `${base.totalDays} دنوں میں مکمل کیا`,
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

        case 'badge_earned':
            return {
                ...base,
                headline: `نیا بیج حاصل کیا! 🎉`,
                headlineEn: `Earned: ${extra.badgeName || 'New Badge'}`,
                subtext: extra.descriptionUr || '',
                emoji: extra.emoji || '🏆',
            };

        case 'weekly_summary': {
            const weekly = extra.weeklySummary || await getWeeklyProgressSummary();
            return {
                ...base,
                headline: `اس ہفتے Urdu Ai کے ساتھ میری پیش رفت`,
                headlineEn: `My Weekly Urdu AI Progress`,
                subtext: `میں اردو AI کے ساتھ AI سیکھ رہا ہوں، آپ بھی شروع کریں`,
                emoji: '✨',
                stats: [
                    { value: weekly.blogsRead || 0, label: '📖 بلاگز' },
                    { value: weekly.videosWatched || 0, label: '🎬 ویڈیوز' },
                    { value: weekly.courseActions || 0, label: '🎓 کورس' },
                ],
                footerTag: 'Learn AI in Urdu and share your progress',
            };
        }

        default:
            return {
                ...base,
                headline: `Urdu AI سیکھ رہا ہوں! 📱`,
                headlineEn: `Learning AI in Urdu`,
                subtext: `${percentage}% مکمل — ${base.streak} دن سٹریک 🔥`,
                emoji: '🚀',
            };
    }
}

// Share the captured card image + text
export async function shareCard(viewRef, type, extra = {}, setCardData) {
    try {
        const data = await getShareCardData(type, extra);

        if (setCardData) {
            setCardData(data);
            await new Promise(r => setTimeout(r, 150)); // Wait for re-render
        }

        // Capture the card component as an image
        const uri = await captureRef(viewRef, {
            format: 'png',
            quality: 1,
        });

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
        // silent
    }
}

export async function getShareCount() {
    return parseInt(await AsyncStorage.getItem(SHARE_COUNT_KEY) || '0');
}
