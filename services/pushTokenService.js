// services/pushTokenService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
// import firestore from '@react-native-firebase/firestore';
const firestore = () => ({ collection: () => ({ doc: () => ({ set: async () => { } }) }) });
firestore.FieldValue = { serverTimestamp: () => new Date() };

const TOKEN_STORAGE_KEY = '@urduai_push_token';
const TOKEN_SYNCED_KEY = '@urduai_token_synced';

// Store token locally
export const storeToken = async (token) => {
    try {
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch (error) {
        // silent
    }
};

// Send token to your backend/Firebase
export const syncTokenToBackend = async (token) => {
    try {
        await firestore().collection('push_tokens').doc(token).set({
            token,
            platform: Platform.OS,
            app_version: '3.0.8',
            registered_at: firestore.FieldValue.serverTimestamp(),
            last_active: firestore.FieldValue.serverTimestamp(),
        });
        await AsyncStorage.setItem(TOKEN_SYNCED_KEY, 'true');
        return true;
    } catch (error) {
        await storeToken(token);
        return false;
    }
};

// Check if token needs syncing
export const needsSync = async () => {
    const synced = await AsyncStorage.getItem(TOKEN_SYNCED_KEY);
    return synced !== 'true';
};
