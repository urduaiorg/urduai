import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ==========================================
// CONFIGURATION
// ==========================================
export const STORAGE_KEY = '@urai_notifications';
const TOTAL_MODULES = 8;

// Notification content — bilingual (Urdu + English)
const MESSAGES = {
    inactivity_48h: {
        title: 'اپنا AI سفر جاری رکھیں!',
        body: 'Continue your AI journey! You have modules waiting for you.',
    },
    inactivity_7d: {
        title: 'ہم آپ کو یاد کر رہے ہیں! 🌟',
        body: 'It has been a week! Come back and continue learning AI in Urdu.',
    },
    module_complete: {
        title: 'شاباش! ماڈیول مکمل! 🎉',
        body: 'Great job completing Module {MODULE}! Ready for the next one?',
    },
    halfway: {
        title: 'آپ آدھے راستے پر ہیں! 🚀',
        body: 'You are halfway through the course! Keep going — your certificate awaits.',
    },
    almost_done: {
        title: 'بس تھوڑا سا باقی ہے! 💪',
        body: 'Only {REMAINING} modules left! You are so close to your certificate.',
    },
    quiz_retry: {
        title: 'دوبارہ کوشش کریں! 📝',
        body: 'You scored {SCORE}% on Module {MODULE}. Try again — you can do better!',
    },
    certificate_share: {
        title: 'اپنی کامیابی شیئر کریں! 🏆',
        body: 'Share your Urdu AI certificate with friends on WhatsApp and LinkedIn!',
    },
    daily_reminder: {
        title: 'آج کی AI سیکھنے کا وقت ⏰',
        body: '10 minutes of AI learning today? Open the app and continue your course.',
    },
};

// ==========================================
// SETUP — Call once on app start
// ==========================================
export async function setupNotifications() {
    // Set how notifications appear when app is in foreground
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });

    // Request permission
    if (Device.isDevice) {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            return false;
        }
    }

    // Android channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('urai-learning', {
            name: 'Urdu AI Learning',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FFD700',
        });
    }

    return true;
}

// ==========================================
// SCHEDULE INACTIVITY REMINDERS
// Call this every time the user opens the app
// ==========================================
export async function scheduleInactivityReminders() {
    // Cancel any existing inactivity reminders
    await cancelNotificationsByTag('inactivity');

    // Save last active time
    await AsyncStorage.setItem(STORAGE_KEY + '_lastActive', new Date().toISOString());

    // Schedule 48-hour reminder
    await scheduleNotification(
        MESSAGES.inactivity_48h.title,
        MESSAGES.inactivity_48h.body,
        48 * 60 * 60, // 48 hours in seconds
        'inactivity_48h'
    );

    // Schedule 7-day reminder
    await scheduleNotification(
        MESSAGES.inactivity_7d.title,
        MESSAGES.inactivity_7d.body,
        7 * 24 * 60 * 60, // 7 days in seconds
        'inactivity_7d'
    );
}

// ==========================================
// MODULE COMPLETION NOTIFICATION
// Call this when user completes a module
// ==========================================
export async function onModuleComplete(moduleNumber) {
    const remaining = TOTAL_MODULES - moduleNumber;

    // Immediate celebration
    await scheduleNotification(
        MESSAGES.module_complete.title,
        MESSAGES.module_complete.body.replace('{MODULE}', String(moduleNumber)),
        2, // 2 seconds — almost immediate
        'module_complete_' + moduleNumber
    );

    // Halfway milestone
    if (moduleNumber === Math.floor(TOTAL_MODULES / 2)) {
        await scheduleNotification(
            MESSAGES.halfway.title,
            MESSAGES.halfway.body,
            10, // 10 seconds after module complete notification
            'halfway'
        );
    }

    // Almost done nudge (2 or fewer modules left)
    if (remaining > 0 && remaining <= 2) {
        await scheduleNotification(
            MESSAGES.almost_done.title,
            MESSAGES.almost_done.body.replace('{REMAINING}', String(remaining)),
            10,
            'almost_done'
        );
    }

    // Schedule "continue" reminder for next day if not the last module
    if (remaining > 0) {
        await scheduleNotification(
            'ماڈیول ' + (moduleNumber + 1) + ' آپ کا منتظر ہے!',
            'Module ' + (moduleNumber + 1) + ' is waiting for you. Continue learning!',
            24 * 60 * 60, // 24 hours
            'continue_' + moduleNumber
        );
    }

    // Reset inactivity timers since user is active
    await scheduleInactivityReminders();
}

// ==========================================
// QUIZ SCORE NOTIFICATION
// Call this after quiz results
// ==========================================
export async function onQuizComplete(moduleNumber, score) {
    if (score < 70) {
        // Below passing — encourage retry
        await scheduleNotification(
            MESSAGES.quiz_retry.title,
            MESSAGES.quiz_retry.body
                .replace('{SCORE}', String(score))
                .replace('{MODULE}', String(moduleNumber)),
            4 * 60 * 60, // Remind in 4 hours
            'quiz_retry_' + moduleNumber
        );
    }
}

// ==========================================
// CERTIFICATE EARNED NOTIFICATION
// Call this when certificate is generated
// ==========================================
export async function onCertificateEarned() {
    // Cancel all course-related reminders
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Share reminder after 1 hour
    await scheduleNotification(
        MESSAGES.certificate_share.title,
        MESSAGES.certificate_share.body,
        60 * 60, // 1 hour
        'certificate_share'
    );

    // Second share reminder after 24 hours
    await scheduleNotification(
        'اپنا سرٹیفکیٹ LinkedIn پر شیئر کریں! 💼',
        'Add your Urdu AI certificate to LinkedIn to boost your profile!',
        24 * 60 * 60, // 24 hours
        'certificate_share_linkedin'
    );

    // Google Scholarship unlock reminder after 2 hours
    await scheduleNotification(
        'مفت Google AI سکالرشپ دستیاب ہے! 🎓',
        'You unlocked Google AI Scholarship! Apply now in the app.',
        2 * 60 * 60, // 2 hours
        'scholarship_unlock'
    );
}

// ==========================================
// DAILY REMINDER — User can opt in/out
// ==========================================
export async function setDailyReminder(enabled, hour = 9, minute = 0) {
    await cancelNotificationsByTag('daily');

    if (enabled) {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: MESSAGES.daily_reminder.title,
                body: MESSAGES.daily_reminder.body,
                data: { tag: 'daily', type: 'daily_reminder' },
                ...(Platform.OS === 'android' && { channelId: 'urai-learning' }),
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: hour,
                minute: minute,
            },
        });
        await saveNotificationId('daily', id);
    }

    await AsyncStorage.setItem(STORAGE_KEY + '_dailyEnabled', JSON.stringify(enabled));
}

export async function isDailyReminderEnabled() {
    const val = await AsyncStorage.getItem(STORAGE_KEY + '_dailyEnabled');
    return val ? JSON.parse(val) : false;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
export async function isNotificationsPaused() {
    try {
        const val = await AsyncStorage.getItem(STORAGE_KEY + '_paused');
        return val ? JSON.parse(val) : false;
    } catch (e) {
        return false;
    }
}

async function scheduleNotification(title, body, delaySeconds, tag) {
    if (await isNotificationsPaused()) {
        return null; // Do not schedule
    }

    try {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: title,
                body: body,
                data: { tag: tag, type: tag },
                ...(Platform.OS === 'android' && { channelId: 'urai-learning' }),
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: delaySeconds,
            },
        });
        await saveNotificationId(tag, id);
        return id;
    } catch (err) {
        return null;
    }
}

async function saveNotificationId(tag, id) {
    try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY + '_ids');
        const ids = stored ? JSON.parse(stored) : {};
        ids[tag] = id;
        await AsyncStorage.setItem(STORAGE_KEY + '_ids', JSON.stringify(ids));
    } catch (e) { }
}

async function cancelNotificationsByTag(tagPrefix) {
    try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY + '_ids');
        const ids = stored ? JSON.parse(stored) : {};
        for (const [tag, id] of Object.entries(ids)) {
            if (tag.startsWith(tagPrefix)) {
                await Notifications.cancelScheduledNotificationAsync(id);
                delete ids[tag];
            }
        }
        await AsyncStorage.setItem(STORAGE_KEY + '_ids', JSON.stringify(ids));
    } catch (e) { }
}

// ==========================================
// LEARNING STREAKS REMINDER
// ==========================================
export async function scheduleStreakReminder(currentStreak) {
    // Suppress if Notifications Paused
    if (await isNotificationsPaused()) return;

    await cancelNotificationsByTag('streak_reminder');

    if (currentStreak > 0) {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'اپنی سٹریک برقرار رکھیں! 🔥',
                body: `Your ${currentStreak}-day learning streak is at risk. Complete a module to keep it going!`,
                data: { tag: 'streak_reminder', type: 'streak' },
                ...(Platform.OS === 'android' && { channelId: 'urai-learning' }),
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 20 * 60 * 60, // 20 hours from Last Activity
            },
        });
        await saveNotificationId('streak_reminder', id);
    }
}
