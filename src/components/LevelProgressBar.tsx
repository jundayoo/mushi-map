import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserLevel, levelService } from '../services/levelService';

interface LevelProgressBarProps {
  userLevel: UserLevel;
  onPress?: () => void;
  showAnimation?: boolean;
  compact?: boolean;
}

const LevelProgressBar: React.FC<LevelProgressBarProps> = ({
  userLevel,
  onPress,
  showAnimation = true,
  compact = false,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showAnimation) {
      Animated.timing(progressAnim, {
        toValue: userLevel.levelProgress,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(userLevel.levelProgress);
    }
  }, [userLevel.levelProgress, showAnimation, progressAnim]);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // デフォルトのアクション: レベル詳細を表示
      showLevelDetails();
    }

    // タップアニメーション
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showLevelDetails = () => {
    const timeToNext = levelService.calculateTimeToNextLevel(userLevel);
    const xpNeeded = userLevel.nextLevelXP - userLevel.totalXP;
    
    Alert.alert(
      `${userLevel.badge} レベル ${userLevel.currentLevel}`,
      `${userLevel.title}\n\n${userLevel.description}\n\n📊 総XP: ${levelService.formatXP(userLevel.totalXP)}\n⏳ 次のレベルまで: ${levelService.formatXP(xpNeeded)}\n📅 予想到達時間: ${timeToNext}`,
      [
        {
          text: 'リーダーボードを見る',
          onPress: () => {
            onPress?.();
          },
        },
        { text: 'OK', style: 'default' },
      ]
    );
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={['#4CAF50', '#2E7D32']}
            style={styles.compactGradient}
          >
            <Text style={styles.compactBadge}>{userLevel.badge}</Text>
            <View style={styles.compactInfo}>
              <Text style={styles.compactLevel}>Lv.{userLevel.currentLevel}</Text>
              <Text style={styles.compactTitle}>{userLevel.title}</Text>
            </View>
            <MaterialIcons name="keyboard-arrow-right" size={20} color="white" />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={['#F8FFF8', '#E8F5E8']}
          style={styles.gradient}
        >
          {/* ヘッダー部分 */}
          <View style={styles.header}>
            <View style={styles.levelInfo}>
              <Text style={styles.badge}>{userLevel.badge}</Text>
              <View style={styles.levelTextContainer}>
                <Text style={styles.levelNumber}>レベル {userLevel.currentLevel}</Text>
                <Text style={styles.levelTitle}>{userLevel.title}</Text>
              </View>
            </View>
            <View style={styles.xpContainer}>
              <Text style={styles.xpText}>
                {levelService.formatXP(userLevel.totalXP)}
              </Text>
              <MaterialIcons name="info-outline" size={20} color="#4CAF50" />
            </View>
          </View>

          {/* プログレスバー */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={['#4CAF50', '#66BB6A']}
                  style={styles.progressGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            </View>
            
            {/* 進捗テキスト */}
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {Math.round(userLevel.levelProgress * 100)}% 
                {userLevel.currentLevel < 50 ? ' 次のレベルまで' : ' 最高レベル達成！'}
              </Text>
              {userLevel.currentLevel < 50 && (
                <Text style={styles.xpNeededText}>
                  あと {levelService.formatXP(userLevel.nextLevelXP - userLevel.totalXP)}
                </Text>
              )}
            </View>
          </View>

          {/* 説明文 */}
          <Text style={styles.description}>{userLevel.description}</Text>

          {/* レベルアップ予想時間 */}
          {userLevel.currentLevel < 50 && (
            <View style={styles.estimateContainer}>
              <MaterialIcons name="schedule" size={16} color="#666" />
              <Text style={styles.estimateText}>
                予想到達時間: {levelService.calculateTimeToNextLevel(userLevel)}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badge: {
    fontSize: 32,
    marginRight: 12,
  },
  levelTextContainer: {
    flex: 1,
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 2,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressTrack: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressGradient: {
    width: '100%',
    height: '100%',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  xpNeededText: {
    fontSize: 12,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 18,
  },
  estimateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  estimateText: {
    fontSize: 12,
    color: '#666',
  },
  // コンパクトスタイル
  compactContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  compactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  compactBadge: {
    fontSize: 24,
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactLevel: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  compactTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
});

export default LevelProgressBar;