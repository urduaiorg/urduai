import React, { useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import ShareCard from './ShareCard';
import { shareCard } from '../services/shareCardService';

const { width } = Dimensions.get('window');

export default function WeeklyProgressModal({
  visible,
  summary,
  onClose,
}: {
  visible: boolean;
  summary: any;
  onClose: () => void;
}) {
  const shareCardRef = useRef(null);
  const [shareData, setShareData] = useState<any>({});

  if (!visible || !summary) return null;

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await shareCard(
      shareCardRef,
      'weekly_summary',
      { weeklySummary: summary },
      setShareData
    );
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient colors={['rgba(0,51,102,0.96)', 'rgba(0,25,51,0.99)']} style={styles.container}>
          <View style={styles.eyebrowPill}>
            <Text style={styles.eyebrowPillText}>ہفتہ وار لرننگ مومنٹ</Text>
          </View>
          <Text style={styles.title}>آپ کا ہفتہ وار <Text style={styles.titleBrandUrdu}>Urdu </Text><Text style={styles.titleBrandAi}>Ai</Text> اپڈیٹ تیار ہے</Text>
          <Text style={styles.subtitle}>
            اس ہفتے آپ نے {summary.blogsRead} بلاگز پڑھے، {summary.videosWatched} ویڈیوز دیکھیں، اور {summary.courseActions} کورس ایکشن مکمل کیے۔
          </Text>

          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{summary.blogsRead}</Text>
              <Text style={styles.statLabel}>بلاگز</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{summary.videosWatched}</Text>
              <Text style={styles.statLabel}>ویڈیوز</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{summary.courseActions}</Text>
              <Text style={styles.statLabel}>کورس</Text>
            </View>
          </View>

          <Text style={styles.quote}>میں Urdu Ai کے ساتھ AI سیکھ رہا ہوں، آپ بھی شروع کریں</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Text style={styles.shareButtonText}>ہفتہ وار کارڈ شیئر کریں</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>ابھی نہیں</Text>
            </TouchableOpacity>
          </View>

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
    backgroundColor: 'rgba(0,0,0,0.64)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.88,
    borderRadius: 26,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.34)',
  },
  eyebrowPill: {
    alignSelf: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  eyebrowPillText: {
    color: '#003366',
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
  },
  title: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 22,
    lineHeight: 31,
    textAlign: 'center',
  },
  titleBrandUrdu: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
  },
  titleBrandAi: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
  },
  subtitle: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Bold',
    fontSize: 22,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.74)',
    fontFamily: 'Montserrat-Regular',
    fontSize: 11,
    marginTop: 5,
  },
  quote: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 18,
  },
  actionRow: {
    marginTop: 22,
    gap: 10,
  },
  shareButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#003366',
    fontFamily: 'Montserrat-Bold',
    fontSize: 15,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
  },
  offscreenContainer: {
    position: 'absolute',
    top: -10000,
    left: -10000,
  },
});
