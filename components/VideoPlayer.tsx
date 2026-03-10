import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useLocalization } from '../hooks/useLocalization';
import * as Haptics from 'expo-haptics';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  title,
  onProgress,
  onComplete,
}) => {
  const { t } = useLocalization();
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const webviewRef = useRef<WebView>(null);

  const { width, height } = Dimensions.get('window');
  const videoHeight = isFullscreen ? height : (width * 9) / 16;

  const toggleFullscreen = async () => {
    try {
      if (isFullscreen) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      }
      setIsFullscreen(!isFullscreen);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Screen orientation error
    }
  };

  const handleVideoMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'timeupdate':
          setCurrentTime(data.currentTime);
          if (onProgress && duration > 0) {
            onProgress((data.currentTime / duration) * 100);
          }
          break;
        case 'durationchange':
          setDuration(data.duration);
          break;
        case 'ended':
          if (onComplete) {
            onComplete();
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'fullscreenchange':
          toggleFullscreen();
          break;
      }
    } catch (error) {
      // Video message error
    }
  };

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const youtubeHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #000;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          direction: rtl;
        }
        .video-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        .video-overlay {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 5px 10px;
          border-radius: 5px;
          font-family: 'Montserrat', sans-serif;
          font-size: 12px;
        }
        .progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 4px;
          background: #FFD700;
          transition: width 0.1s ease;
        }
      </style>
    </head>
    <body>
      <div class="video-container">
        <iframe
          src="https://www.youtube.com/embed/${videoId}?enablejsapi=1&modestbranding=1&showinfo=0&fs=1&cc_load_policy=1&cc_lang_pref=ur&hl=ur"
          allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
        <div class="video-overlay">
          <span id="time-display">0:00 / 0:00</span>
        </div>
        <div class="progress-bar" id="progress-bar"></div>
      </div>

      <script>
        // YouTube API integration
        function onYouTubeIframeAPIReady() {
        }

        // Simulate video events for demonstration
        let currentTime = 0;
        let duration = 0;
        
        function updateProgress() {
          currentTime += 1;
          if (currentTime <= duration) {
            const progress = (currentTime / duration) * 100;
            document.getElementById('progress-bar').style.width = progress + '%';
            document.getElementById('time-display').textContent = 
              formatTime(currentTime) + ' / ' + formatTime(duration);
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'timeupdate',
              currentTime: currentTime
            }));
          }
        }

        function formatTime(seconds) {
          const mins = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return mins + ':' + (secs < 10 ? '0' : '') + secs;
        }

        // Initialize video (simulated)
        setTimeout(() => {
          duration = 300; // 5 minutes example
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'durationchange',
            duration: duration
          }));
          
          // Update progress every second
          setInterval(updateProgress, 1000);
        }, 2000);

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'fullscreenchange'
          }));
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height: videoHeight }]}>
      {/* Video Header */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <TouchableOpacity style={styles.fullscreenButton} onPress={toggleFullscreen}>
          <Text style={styles.fullscreenIcon}>
            {isFullscreen ? '🔲' : '⛶'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Video Player */}
      <WebView
        ref={webviewRef}
        source={{ html: youtubeHTML }}
        style={styles.webview}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onLoadEnd={() => setIsLoading(false)}
        onMessage={handleVideoMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsFullscreenVideo={true}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      )}

      {/* Progress Information */}
      {!isFullscreen && duration > 0 && (
        <View style={styles.progressInfo}>
          <Text style={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${(currentTime / duration) * 100}%` }
              ]} 
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderRadius: 10,
    overflow: 'hidden',
    margin: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    textAlign: 'right',
  },
  fullscreenButton: {
    padding: 8,
    marginLeft: 10,
  },
  fullscreenIcon: {
    fontSize: 20,
    color: '#FFD700',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontFamily: 'Montserrat-Regular',
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
  },
  timeText: {
    color: '#CCCCCC',
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    marginRight: 10,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
});

export default VideoPlayer; 