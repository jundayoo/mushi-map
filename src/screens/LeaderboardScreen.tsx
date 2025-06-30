import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  StatusBar,
  RefreshControl,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/SimpleNavigator';
import { levelService, UserLevel } from '../services/levelService';
import { authService } from '../services/authService';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const LeaderboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [leaderboard, setLeaderboard] = useState<UserLevel[]>([]);
  const [currentUserLevel, setCurrentUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
    }, [])
  );

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      
      // リーダーボードデータを取得
      const topUsers = await levelService.getLeaderboard(50);
      setLeaderboard(topUsers);

      // 現在のユーザーレベルを取得
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        const userLevel = await levelService.getUserLevel(currentUser.id);
        setCurrentUserLevel(userLevel);
      }
    } catch (error) {
      console.error('リーダーボード読み込みエラー:', error);
      Alert.alert('エラー', 'リーダーボードの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (userLevel: UserLevel) => {
    const timeToNext = levelService.calculateTimeToNextLevel(userLevel);
    
    Alert.alert(
      `${userLevel.badge} ${userLevel.title}`,
      `レベル ${userLevel.currentLevel}\n\n${userLevel.description}\n\n📊 総XP: ${levelService.formatXP(userLevel.totalXP)}\n⏳ 次のレベルまで: ${levelService.formatXP(userLevel.nextLevelXP - userLevel.totalXP)}\n📅 予想到達時間: ${timeToNext}`,
      [{ text: 'OK' }]
    );
  };

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#4CAF50';
    }
  };

  const renderLeaderboardItem = (userLevel: UserLevel, index: number) => {
    const rank = index + 1;
    const isCurrentUser = currentUserLevel?.userId === userLevel.userId;

    return (
      <TouchableOpacity
        key={userLevel.id}
        style={[
          styles.leaderboardItem,
          isCurrentUser && styles.currentUserItem,
        ]}
        onPress={() => handleUserPress(userLevel)}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.itemContent,
            {
              opacity: fadeAnim,
              transform: [{
                translateX: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              }],
            }
          ]}
        >
          <LinearGradient
            colors={isCurrentUser ? ['#E8F5E8', '#F0F8F0'] : ['#FFFFFF', '#F8F9FA']}
            style={styles.itemGradient}
          >
            {/* 順位 */}
            <View style={[styles.rankContainer, { backgroundColor: getRankColor(rank) }]}>
              <Text style={styles.rankIcon}>{getRankIcon(rank)}</Text>
              <Text style={styles.rankNumber}>{rank}</Text>
            </View>

            {/* ユーザー情報 */}
            <View style={styles.userInfo}>
              <View style={styles.userHeader}>
                <View style={styles.userBasic}>
                  <Text style={styles.userBadge}>{userLevel.badge}</Text>
                  <View style={styles.userText}>
                    <Text style={[styles.userTitle, isCurrentUser && styles.currentUserText]}>
                      {userLevel.title}
                    </Text>
                    <Text style={styles.userLevel}>レベル {userLevel.currentLevel}</Text>
                  </View>
                </View>
                {isCurrentUser && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youText}>あなた</Text>
                  </View>
                )}
              </View>

              {/* プログレスバー */}
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${Math.min(userLevel.levelProgress * 100, 100)}%`,
                        backgroundColor: getRankColor(rank),
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.xpText}>
                  {levelService.formatXP(userLevel.totalXP)}
                </Text>
              </View>
            </View>

            {/* 詳細アイコン */}
            <MaterialIcons name="keyboard-arrow-right" size={24} color="#999" />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderCurrentUserPosition = () => {
    if (!currentUserLevel) return null;

    const currentUserRank = leaderboard.findIndex(level => level.userId === currentUserLevel.userId) + 1;
    
    if (currentUserRank <= 10) return null; // すでにトップ10内

    return (
      <View style={styles.currentPositionSection}>
        <Text style={styles.sectionTitle}>あなたの順位</Text>
        {renderLeaderboardItem(currentUserLevel, currentUserRank - 1)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* ヘッダー */}
      <LinearGradient
        colors={['#4CAF50', '#2E7D32']}
        style={styles.header}
      >
        <Animated.View 
          style={[
            styles.headerContent,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>リーダーボード</Text>
            <Text style={styles.headerSubtitle}>昆虫マスターランキング</Text>
          </View>

          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => {
              Alert.alert(
                'ランキングについて',
                'レベルと総XPによってランキングが決まります。\n\n📝 投稿、🤝 コミュニティ活動、🔍 発見などでXPを獲得してレベルアップしましょう！',
                [{ text: 'OK' }]
              );
            }}
          >
            <MaterialIcons name="info-outline" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadLeaderboard}
            colors={['#4CAF50']}
          />
        }
      >
        {/* トップ3表彰台 */}
        {leaderboard.length >= 3 && (
          <View style={styles.podiumSection}>
            <Text style={styles.sectionTitle}>🏆 トップ3</Text>
            <View style={styles.podium}>
              {/* 2位 */}
              <TouchableOpacity 
                style={[styles.podiumItem, styles.secondPlace]}
                onPress={() => handleUserPress(leaderboard[1])}
              >
                <Text style={styles.podiumBadge}>{leaderboard[1].badge}</Text>
                <Text style={styles.podiumLevel}>Lv.{leaderboard[1].currentLevel}</Text>
                <Text style={styles.podiumTitle}>{leaderboard[1].title}</Text>
                <Text style={styles.podiumXP}>{levelService.formatXP(leaderboard[1].totalXP)}</Text>
                <View style={[styles.podiumRank, { backgroundColor: '#C0C0C0' }]}>
                  <Text style={styles.podiumRankText}>2</Text>
                </View>
              </TouchableOpacity>

              {/* 1位 */}
              <TouchableOpacity 
                style={[styles.podiumItem, styles.firstPlace]}
                onPress={() => handleUserPress(leaderboard[0])}
              >
                <Text style={styles.podiumBadge}>{leaderboard[0].badge}</Text>
                <Text style={styles.podiumLevel}>Lv.{leaderboard[0].currentLevel}</Text>
                <Text style={styles.podiumTitle}>{leaderboard[0].title}</Text>
                <Text style={styles.podiumXP}>{levelService.formatXP(leaderboard[0].totalXP)}</Text>
                <View style={[styles.podiumRank, { backgroundColor: '#FFD700' }]}>
                  <Text style={styles.podiumRankText}>1</Text>
                </View>
              </TouchableOpacity>

              {/* 3位 */}
              <TouchableOpacity 
                style={[styles.podiumItem, styles.thirdPlace]}
                onPress={() => handleUserPress(leaderboard[2])}
              >
                <Text style={styles.podiumBadge}>{leaderboard[2].badge}</Text>
                <Text style={styles.podiumLevel}>Lv.{leaderboard[2].currentLevel}</Text>
                <Text style={styles.podiumTitle}>{leaderboard[2].title}</Text>
                <Text style={styles.podiumXP}>{levelService.formatXP(leaderboard[2].totalXP)}</Text>
                <View style={[styles.podiumRank, { backgroundColor: '#CD7F32' }]}>
                  <Text style={styles.podiumRankText}>3</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 全ランキング */}
        <View style={styles.fullRankingSection}>
          <Text style={styles.sectionTitle}>📊 全ランキング</Text>
          
          {leaderboard.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="emoji-events" size={64} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>まだランキングがありません</Text>
              <Text style={styles.emptyText}>
                投稿や活動を通じてXPを獲得し、\nランキングに参加しましょう！
              </Text>
            </View>
          ) : (
            leaderboard.map((userLevel, index) => renderLeaderboardItem(userLevel, index))
          )}
        </View>

        {/* 現在のユーザー位置 */}
        {renderCurrentUserPosition()}

        {/* 統計情報 */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📈 統計情報</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialIcons name="people" size={32} color="#4CAF50" />
              <Text style={styles.statNumber}>{leaderboard.length}</Text>
              <Text style={styles.statLabel}>参加者</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="trending-up" size={32} color="#FF9500" />
              <Text style={styles.statNumber}>
                {leaderboard.length > 0 ? `Lv.${Math.max(...leaderboard.map(u => u.currentLevel))}` : '-'}
              </Text>
              <Text style={styles.statLabel}>最高レベル</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="stars" size={32} color="#9C27B0" />
              <Text style={styles.statNumber}>
                {leaderboard.length > 0 ? levelService.formatXP(Math.max(...leaderboard.map(u => u.totalXP))) : '-'}
              </Text>
              <Text style={styles.statLabel}>最高XP</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  infoButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  podiumSection: {
    marginVertical: 20,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 5,
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  firstPlace: {
    marginTop: -10,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  secondPlace: {
    marginTop: 0,
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  thirdPlace: {
    marginTop: 5,
    borderWidth: 2,
    borderColor: '#CD7F32',
  },
  podiumBadge: {
    fontSize: 32,
    marginBottom: 8,
  },
  podiumLevel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  podiumTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  podiumXP: {
    fontSize: 10,
    color: '#666',
    marginBottom: 12,
  },
  podiumRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumRankText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  fullRankingSection: {
    marginVertical: 10,
  },
  leaderboardItem: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  currentUserItem: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  itemContent: {
    flex: 1,
  },
  itemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  rankContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userBasic: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userBadge: {
    fontSize: 24,
    marginRight: 12,
  },
  userText: {
    flex: 1,
  },
  userTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  currentUserText: {
    color: '#4CAF50',
  },
  userLevel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  youBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  youText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    minWidth: 60,
    textAlign: 'right',
  },
  currentPositionSection: {
    marginVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsSection: {
    marginVertical: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  bottomPadding: {
    height: 30,
  },
});

export default LeaderboardScreen;