import React, { useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ShareCard from './ShareCard';
import { shareCard } from '../services/shareCardService';

const { width } = Dimensions.get('window');

export default function BadgeCelebration({ badge, visible, onClose }: { badge: any, visible: boolean, onClose: () => void }) {
    const shareCardRef = useRef(null);
    const [shareData, setShareData] = React.useState<any>({});

    if (!badge || !visible) return null;

    const handleShare = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // We capture the offscreen ShareCard exactly as we do for module progress
        await shareCard(shareCardRef, 'badge_earned', {
            badgeId: badge.id,
            badgeName: badge.title,
            emoji: badge.emoji,
            descriptionUr: badge.descriptionUr,
        }, setShareData);
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <LinearGradient colors={['rgba(0,51,102,0.95)', 'rgba(0,25,51,0.98)']} style={styles.container}>

                    {/* The celebration UI */}
                    <Text style={styles.emojiLarge}>{badge.emoji}</Text>
                    <Text style={styles.titleUr}>نیا بیج حاصل کیا! 🎉</Text>
                    <Text style={styles.titleEn}>New Badge Earned!</Text>

                    <View style={styles.badgeBox}>
                        <Text style={styles.badgeNameUr}>{badge.titleUr}</Text>
                        <Text style={styles.badgeNameEn}>{badge.title}</Text>
                        <Text style={styles.badgeDesc}>{badge.descriptionUr}</Text>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                            <Text style={styles.shareButtonText}>شیئر کریں</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                            <Text style={styles.closeButtonText}>ٹھیک ہے</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Offscreen ShareCard for capturing */}
                    <View style={styles.offscreenContainer}>
                        <ShareCard ref={shareCardRef} data={shareData} />
                    </View>

                </LinearGradient>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.85,
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    emojiLarge: {
        fontSize: 80,
        marginBottom: 20,
        textShadowColor: 'rgba(255, 215, 0, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    titleUr: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 22,
        color: '#FFD700',
        marginBottom: 4,
    },
    titleEn: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 24,
    },
    badgeBox: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        width: '100%',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    badgeNameUr: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 20,
        color: '#fff',
        marginBottom: 4,
    },
    badgeNameEn: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        color: '#FFD700',
        marginBottom: 12,
    },
    badgeDesc: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 20,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    shareButton: {
        flex: 1,
        backgroundColor: '#4CD964',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    shareButtonText: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        color: '#fff',
    },
    closeButton: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        color: '#fff',
    },
    offscreenContainer: {
        position: 'absolute',
        top: -10000,
        left: -10000,
    }
});
