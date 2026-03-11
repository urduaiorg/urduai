import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';

const SYNC_URL = Constants.expoConfig?.extra?.CERTIFICATE_SYNC_URL ?? '';
const API_KEY = Constants.expoConfig?.extra?.CERTIFICATE_API_KEY ?? '';
const QUEUE_KEY = 'certificate_sync_queue';
const DEVICE_ID_KEY = 'device_id';

function getConfigError() {
    if (!SYNC_URL) {
        return 'Certificate sync server URL is not configured.';
    }
    if (!API_KEY) {
        return 'Certificate sync API key is not configured.';
    }
    return null;
}

// ==========================================
// DEVICE ID — Anonymous identifier
// ==========================================
export async function getDeviceId() {
    try {
        let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
        if (!deviceId) {
            deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
        }
        return deviceId;
    } catch (error) {
        return 'unknown-device';
    }
}

// ==========================================
// QUEUE — Add certificate to local queue
// ==========================================
export async function queueCertificate(certificateData) {
    try {
        const queue = await getQueue();
        const item = {
            ...certificateData,
            queuedAt: new Date().toISOString(),
            synced: false
        };
        queue.push(item);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        return item;
    } catch (error) {
        return null;
    }
}

// ==========================================
// SYNC — Send queued certificates to backend
// ==========================================
export async function syncCertificates() {
    try {
        const queue = await getQueue();
        const unsynced = queue.filter(item => !item.synced);

        if (unsynced.length === 0) {
            return { synced: 0, pending: 0 };
        }

        // Check internet
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
            return { synced: 0, pending: unsynced.length };
        }

        const configError = getConfigError();
        if (configError) {
            return { synced: 0, pending: unsynced.length, error: configError };
        }

        // POST to Apps Script using exact JSON layout required by new Backend Script revision using exact JSON layout required by new Backend Script revision
        const response = await fetch(SYNC_URL, {
            method: 'POST',
            redirect: 'follow', // Keep follow logic just in case Google routes it
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: API_KEY,
                certificates: unsynced.map(item => ({
                    certificateId: item.certificateId,
                    nameEn: item.nameEn,
                    nameUr: item.nameUr || '',
                    email: item.email || '',
                    score: item.score,
                    courseName: item.courseName,
                    issuedAt: item.issuedAt,
                    deviceId: item.deviceId
                }))
            })
        });

        const responseText = await response.text();
        let result = {};
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            throw new Error("Invalid response from Google Servers: " + responseText.substring(0, 100));
        }

        if (result.success) {
            // Mark all sent items as synced
            const syncedIds = new Set(
                result.results
                    .filter(r => r.status === 'sent' || r.status === 'saved_no_email' || r.status === 'duplicate')
                    .map(r => r.certificateId)
            );

            const updatedQueue = queue.map(item => {
                if (syncedIds.has(item.certificateId)) {
                    return { ...item, synced: true, syncedAt: new Date().toISOString() };
                }
                return item;
            });

            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));

            const remaining = updatedQueue.filter(item => !item.synced).length;
            return { synced: syncedIds.size, pending: remaining };
        } else {
            return { synced: 0, pending: unsynced.length, error: result.error };
        }
    } catch (error) {
        return { synced: 0, pending: -1, error: error.message };
    }
}

// ==========================================
// STATUS — Check how many are pending
// ==========================================
export async function getSyncStatus() {
    try {
        const queue = await getQueue();
        const pending = queue.filter(item => !item.synced).length;
        const total = queue.length;
        return { pending, total, synced: total - pending };
    } catch (error) {
        return { pending: 0, total: 0, synced: 0 };
    }
}

// ==========================================
// AUTO SYNC — Sync when internet becomes available
// ==========================================
export function setupAutoSync() {
    const configError = getConfigError();
    if (configError) {
        return () => { };
    }

    // Sync when connectivity changes to online
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
        if (state.isConnected) {
            syncCertificates();
        }
    });

    // Also try every 5 minutes
    const intervalId = setInterval(() => {
        syncCertificates();
    }, 5 * 60 * 1000);

    // Return cleanup function
    return () => {
        unsubscribeNetInfo();
        clearInterval(intervalId);
    };
}

// ==========================================
// HELPER — Get queue from storage
// ==========================================
async function getQueue() {
    try {
        const raw = await AsyncStorage.getItem(QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        return [];
    }
}
