import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
// import { LogLevel, OneSignal } from 'react-native-onesignal';
const LogLevel = { Verbose: 0 };
const OneSignal: any = { User: { pushSubscription: { getOptedIn: () => false, optIn: () => { }, optOut: () => { } } } };
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { STORAGE_KEY, setDailyReminder, isDailyReminderEnabled, isNotificationsPaused } from '../services/localNotifications';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export default function SettingsScreen() {
    const router = useRouter();

    const [dailyEnabled, setDailyEnabled] = useState(true);
    const [paused, setPaused] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const daily = await isDailyReminderEnabled();
        setDailyEnabled(daily);

        const isPaused = await isNotificationsPaused();
        setPaused(isPaused);

        if (!isExpoGo) {
            try {
                const pushState = OneSignal.User.pushSubscription.getOptedIn();
                setPushEnabled(pushState);
            } catch (e) {
                setPushEnabled(false);
            }
        } else {
            setPushEnabled(false);
        }
    };

    const handleToggleDaily = async (val: boolean) => {
        Haptics.selectionAsync();
        setDailyEnabled(val);
        await setDailyReminder(val, 9, 0); // Default to 9:00 AM
    };

    const handleTogglePause = async (val: boolean) => {
        Haptics.selectionAsync();
        setPaused(val);
        await AsyncStorage.setItem(STORAGE_KEY + '_paused', JSON.stringify(val));
    };

    const handleTogglePush = (val: boolean) => {
        Haptics.selectionAsync();
        setPushEnabled(val);

        if (isExpoGo) {
            Alert.alert('Notice', 'Push Notifications require a custom native build and cannot be fully toggled in Expo Go.');
            return;
        }

        try {
            if (val) {
                OneSignal.User.pushSubscription.optIn();
            } else {
                OneSignal.User.pushSubscription.optOut();
            }
        } catch (e) {
            // Failed to toggle OneSignal
        }
    };

    const renderSettingItem = (icon: any, titleUr: string, titleEn: string, descriptionEn: string, value: boolean, onValueChange: (val: boolean) => void, tintColor = '#FFD700') => (
        <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
                <Ionicons name={icon} size={24} color={tintColor} />
            </View>
            <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitleUr}>{titleUr}</Text>
                <Text style={styles.settingTitleEn}>{titleEn}</Text>
                <Text style={styles.settingDescription}>{descriptionEn}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: tintColor }}
                thumbColor={'#ffffff'}
            />
        </View>
    );

    return (
        <LinearGradient colors={['#003366', '#001933']} style={styles.container}>
            <StatusBar style="light" backgroundColor="#003366" />
            <SafeAreaView style={{ flex: 1 }}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTitles}>
                        <Text style={styles.headerTitleUr}>ترتیبات</Text>
                        <Text style={styles.headerTitleEn}>Settings</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <Text style={styles.sectionHeader}>نوٹیفیکیشنز / Notifications</Text>
                    <View style={styles.card}>

                        {renderSettingItem(
                            'notifications-outline',
                            'ڈیلی ریمائنڈرز',
                            'Daily Reminders',
                            'Get notified every morning to continue your learning journey.',
                            dailyEnabled,
                            handleToggleDaily
                        )}

                        <View style={styles.divider} />

                        {renderSettingItem(
                            'globe-outline',
                            'خبریں اور اپڈیٹس',
                            'News & Updates',
                            'Receive remote announcements and incoming app updates.',
                            pushEnabled,
                            handleTogglePush,
                            '#4CD964'
                        )}

                        <View style={styles.divider} />

                        {renderSettingItem(
                            'moon-outline',
                            'نوٹیفیکیشنز روکیں',
                            'Pause All Local Alerts',
                            'Temporarily mute STREAK and MODULE completion alerts.',
                            paused,
                            handleTogglePause,
                            '#FF4444'
                        )}

                    </View>

                    <Text style={styles.sectionHeader}>ایپ کے بارے میں / About App</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.linkItem} onPress={() => Alert.alert('Version', 'Urdu AI Web Wrapper\nVersion 3.0.8')}>
                            <Ionicons name="information-circle-outline" size={24} color="#8899A6" />
                            <Text style={styles.linkText}>App Version</Text>
                            <Text style={styles.versionText}>3.0.8</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitles: {
        alignItems: 'center',
    },
    headerTitleUr: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 24,
        color: '#fff',
    },
    headerTitleEn: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 14,
        color: '#FFD700',
        marginTop: -5,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sectionHeader: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 20,
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    settingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    settingTextContainer: {
        flex: 1,
        marginRight: 10,
    },
    settingTitleUr: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        color: '#fff',
        textAlign: 'left',
    },
    settingTitleEn: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        color: '#fff',
        marginBottom: 4,
    },
    settingDescription: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginLeft: 70,
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    linkText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        color: '#fff',
        marginLeft: 15,
        flex: 1,
    },
    versionText: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
    },
});
