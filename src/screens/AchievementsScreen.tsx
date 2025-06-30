import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/SimpleNavigator';
import { BadgeGrid } from '../components/BadgeComponent';
import { achievementService, AchievementProgress, Badge } from '../services/achievementService';
import { authService } from '../services/authService';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const categories = [
    { id: 'all', name: 'すべて', icon: '🏆' },
    { id: 'posting', name: '投稿', icon: '📸' },
    { id: 'discovery', name: '発見', icon: '🔍' },
    { id: 'exploration', name: '探検', icon: '🗺️' },
    { id: 'time', name: '継続', icon: '⏰' },
    { id: 'social', name: 'ソーシャル', icon: '👥' },
  ];

  useFocusEffect(
    useCallback(() => {
      loadAchievements();
    }, [])
  );

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      
      if (!currentUser) {
        navigation.navigate('Login');
        return;
      }

      await achievementService.initializeAchievements();
      
      // 実績をチェックして新しく獲得したバッジがあるか確認
      const newBadges = await achievementService.checkAchievements(currentUser.id);
      
      // 新しいバッジがあれば通知
      if (newBadges.length > 0) {
        showNewBadgeAlert(newBadges);
      }
      
      const userProgress = await achievementService.getUserProgress(currentUser.id);
      setAchievements(userProgress);
    } catch (error) {
      console.error('実績読み込みエラー:', error);
      Alert.alert('エラー', '実績の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const showNewBadgeAlert = (newBadges: Badge[]) => {
    const badgeNames = newBadges.map(badge => `${badge.icon} ${badge.name}`).join('\n');
    Alert.alert(
      '🎉 新しいバッジを獲得！',
      `おめでとうございます！\n\n${badgeNames}`,
      [{ text: 'すごい！', style: 'default' }]
    );
  };

  const handleBadgePress = (badge: Badge) => {
    Alert.alert(
      `${badge.icon} ${badge.name}`,
      `${badge.description}\n\n要件: ${badge.requirement}個\nレアリティ: ${getRarityText(badge.rarity)}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const getRarityText = (rarity: string): string => {
    switch (rarity) {
      case 'common': return 'コモン';
      case 'rare': return 'レア';
      case 'epic': return 'エピック';
      case 'legendary': return 'レジェンダリー';
      default: return 'コモン';
    }
  };

  const getFilteredAchievements = (): AchievementProgress[] => {
    if (selectedCategory === 'all') {
      return achievements;
    }
    return achievements.filter(achievement => achievement.badge.category === selectedCategory);
  };

  const getCompletionStats = () => {
    const total = achievements.length;
    const completed = achievements.filter(a => a.isCompleted).length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const stats = getCompletionStats();
  const filteredAchievements = getFilteredAchievements();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* プレミアムヘッダー */}
      <LinearGradient
        colors={['#4CAF50', '#2E7D32']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>実績・バッジ</Text>
            <Text style={styles.headerSubtitle}>あなたの昆虫観察の記録</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadAchievements}
          >
            <MaterialIcons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* 統計情報 */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>獲得済み</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>総数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.percentage}%</Text>
            <Text style={styles.statLabel}>達成率</Text>
          </View>
        </View>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* カテゴリフィルター */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScrollView}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text 
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* バッジグリッド */}
        <ScrollView 
          style={styles.badgeScrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadAchievements}
              colors={['#4CAF50']}
            />
          }
        >
          {filteredAchievements.length > 0 ? (
            <BadgeGrid
              achievements={filteredAchievements}
              onBadgePress={handleBadgePress}
              columns={3}
              badgeSize="medium"
            />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="emoji-events" size={64} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>バッジがありません</Text>
              <Text style={styles.emptyText}>
                昆虫を発見して投稿すると、バッジを獲得できます！
              </Text>
            </View>
          )}
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      </Animated.View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    marginHorizontal: 20,
    paddingVertical: 15,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  categoryScrollView: {
    maxHeight: 60,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryButtonActive: {
    backgroundColor: '#4CAF50',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: 'white',
  },
  badgeScrollView: {
    flex: 1,
    paddingTop: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    paddingHorizontal: 40,
  },
  bottomPadding: {
    height: 30,
  },
});

export default AchievementsScreen;