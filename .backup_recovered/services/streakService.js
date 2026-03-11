import AsyncStorage from '@react-native-async-storage/async-storage';
import { maybeRequestReview } from './reviewPromptService';

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

    const milestones = [7, 14, 30, 60, 100];
    if (milestones.includes(newStreak)) {
        updated.milestoneHit = true;
    }

    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updated));
    await maybeRequestReview('streak', { currentStreak: updated.currentStreak });
    return updated;
}

export async function getStreakData() {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    if (!raw) {
        return { currentStreak: 0, longestStreak: 0, lastActiveDate: null, totalDaysActive: 0 };
    }
    try {
        return JSON.parse(raw);
    } catch (e) {
        return { currentStreak: 0, longestStreak: 0, lastActiveDate: null, totalDaysActive: 0 };
    }
}
