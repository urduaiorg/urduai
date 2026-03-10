import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

interface AnnouncementBannerProps {
    text: string;
    link?: string;
    onDismiss: () => void;
}

export default function AnnouncementBanner({ text, link, onDismiss }: AnnouncementBannerProps) {
    if (!text) return null;

    const handlePress = async () => {
        if (link) {
            if (link.startsWith('http')) {
                await WebBrowser.openBrowserAsync(link, {
                    toolbarColor: '#003366',
                    enableBarCollapsing: true,
                    showTitle: true,
                    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
                    createTask: false
                });
            } else {
                Linking.openURL(link);
            }
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.contentContainer}
                onPress={handlePress}
                disabled={!link}
            >
                <Ionicons name="megaphone-outline" size={20} color="#003366" style={styles.icon} />
                <Text style={styles.text} numberOfLines={2}>
                    {text}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
                <Ionicons name="close" size={20} color="#003366" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFD700', // Urdu AI Yellow
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 12,
    },
    text: {
        flex: 1,
        color: '#003366',
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        lineHeight: 20,
    },
    closeButton: {
        padding: 8,
        marginLeft: 8,
    },
});
