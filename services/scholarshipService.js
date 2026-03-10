import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const SCHOLARSHIP_URL = Constants.expoConfig?.extra?.SCHOLARSHIP_URL || 'https://script.google.com/macros/s/AKfycbzSPWYoZ18ry0ih3Sb1nv2UTsaUYmHWmCxlqaqXmSy0nIxpB4nwVKR-LTLdKAOrwTUQ/exec';
const SCHOLARSHIP_API_KEY = Constants.expoConfig?.extra?.SCHOLARSHIP_API_KEY || 'URAI-SCHOLARSHIP-2026';
const STORAGE_KEY = '@urai_scholarship';

function getScholarshipConfigError() {
    if (!SCHOLARSHIP_URL) {
        return 'Scholarship server URL is not configured.';
    }
    if (!SCHOLARSHIP_API_KEY) {
        return 'Scholarship API key is not configured.';
    }
    return null;
}

// ── Check if user has completed the Urdu AI course ──
export async function hasCourseCompletion() {
    // Check if certificate exists in local storage
    // The masterclass is courseId "ai-masterclass"
    const courseData = await AsyncStorage.getItem('course_progress_ai-masterclass');
    if (courseData) {
        const parsed = JSON.parse(courseData);
        return !!parsed.certificateId;
    }
    return false;
}

// ── Apply for scholarship ──
export async function applyForScholarship({ fullName, email, city, phone }) {
    try {
        const configError = getScholarshipConfigError();
        if (configError) {
            return { success: false, error: configError };
        }

        const deviceId = await getDeviceId();

        const response = await fetch(SCHOLARSHIP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: SCHOLARSHIP_API_KEY,
                fullName: fullName.trim(),
                email: email.trim().toLowerCase(),
                city: city.trim(),
                phone: phone ? phone.trim() : '',
                deviceId: deviceId,
            }),
        });

        const data = await response.json();

        if (data.success) {
            await AsyncStorage.setItem(STORAGE_KEY + '_applied', JSON.stringify({
                applied: true,
                date: new Date().toISOString(),
                fullName: fullName,
                email: email,
            }));
        }

        return data;
    } catch (error) {
        return { success: false, error: error.message || 'Network request failed' };
    }
}

// ── Get spots info with smart display logic ──
// Returns { spotsRemaining, totalSpots, showCount, displayText }
// showCount = true only when <50% spots remain (creates urgency)
// Works automatically whether max is 500, 1000, or 5000
export async function getSpotsInfo() {
    try {
        if (!SCHOLARSHIP_URL) {
            throw new Error('Scholarship server URL is not configured.');
        }

        const response = await fetch(SCHOLARSHIP_URL + '?action=spots');
        const data = await response.json();
        const remaining = data.spotsRemaining;
        const total = data.totalSpots || 500; // fallback for old backend

        // Cache both values
        await AsyncStorage.setItem(STORAGE_KEY + '_spots', JSON.stringify({
            remaining,
            total,
        }));

        return buildSpotsDisplay(remaining, total);
    } catch (error) {
        // Return cached value if offline
        const cached = await AsyncStorage.getItem(STORAGE_KEY + '_spots');
        if (cached) {
            try {
                const { remaining, total } = JSON.parse(cached);
                return buildSpotsDisplay(remaining, total);
            } catch {
                // Legacy cache was just a number
                const num = parseInt(cached);
                return buildSpotsDisplay(num, 500);
            }
        }
        return { spotsRemaining: null, totalSpots: null, showCount: false, displayText: 'سکالرشپ دستیاب ہے ✅' };
    }
}

// Smart display: only show exact number when urgency matters (<50%)
function buildSpotsDisplay(remaining, total) {
    const percentage = (remaining / total) * 100;
    const showCount = percentage < 50;

    let displayText;
    if (remaining <= 0) {
        displayText = 'اس ہفتے جگہیں ختم ہو گئیں — اگلے ہفتے کوشش کریں';
    } else if (percentage < 20) {
        displayText = `🔥 صرف ${remaining} جگہیں باقی ہیں! جلدی کریں`;
    } else if (percentage < 50) {
        displayText = `⚡ ${remaining} جگہیں باقی — ابھی اپلائی کریں`;
    } else {
        displayText = 'سکالرشپ دستیاب ہے ✅';
    }

    return { spotsRemaining: remaining, totalSpots: total, showCount, displayText };
}

// ── Legacy wrapper (backward compatible) ──
export async function getSpotsRemaining() {
    const info = await getSpotsInfo();
    return info.spotsRemaining;
}

// ── Check if already applied ──
export async function getApplicationStatus() {
    const local = await AsyncStorage.getItem(STORAGE_KEY + '_applied');
    return local ? JSON.parse(local) : null;
}

// ── Share messages ──
export function getScholarshipShareMessage() {
    return '🎓 مفت Google AI سرٹیفیکیشن حاصل کریں!\n\n' +
        'Urdu AI app ڈاؤنلوڈ کریں اور Google Professional Certificate ' +
        'کے لیے سکالرشپ حاصل کریں۔\n\n' +
        '7 courses — 100% FREE!\n\n' +
        '📱 Download: https://urduai.org/app\n\n' +
        '#UrduAI #GoogleAI #FreeScholarship';
}

// ── Helper ──
async function getDeviceId() {
    let id = await AsyncStorage.getItem('device_id');
    if (!id) {
        id = 'xxxxxxxx-xxxx-4xxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        await AsyncStorage.setItem('device_id', id);
    }
    return id;
}
