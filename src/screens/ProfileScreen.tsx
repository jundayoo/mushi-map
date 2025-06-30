import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Animated,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/SimpleNavigator';
import { authService, User } from '../services/authService';
import { unifiedPostService, InsectPost } from '../services/unifiedPostService';
import { levelService, UserLevel } from '../services/levelService';
import LevelProgressBar from '../components/LevelProgressBar';
import OfflineStatusScreen from './OfflineStatusScreen';
import PrivacySettingsScreen from './PrivacySettingsScreen';
import ErrorDashboardScreen from './ErrorDashboardScreen';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [user, setUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<InsectPost[]>([]);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOfflineStatus, setShowOfflineStatus] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showErrorDashboard, setShowErrorDashboard] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const statistics = useMemo(() => ({
    totalPosts: userPosts.length,
    totalLikes: userPosts.reduce((sum, post) => sum + post.likesCount, 0),
    uniqueSpecies: new Set(userPosts.map(post => post.name.trim().toLowerCase())).size,
  }), [userPosts]);

  const avatarUrl = useMemo(() => {
    return user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.id || 'default'}`;
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      
      if (!currentUser) {
        navigation.navigate('Login');
        return;
      }

      setUser(currentUser);
      
      const posts = await unifiedPostService.getPosts();
      const myPosts = posts.filter(post => post.user.id === currentUser.id);
      setUserPosts(myPosts);

      // ユーザーレベルを取得
      const level = await levelService.getUserLevel(currentUser.id);
      setUserLevel(level);

      // 自動XPチェック
      try {
        await levelService.checkAndAwardXP(currentUser.id);
      } catch (error) {
        console.warn('自動XPチェックエラー:', error);
      }
    } catch (error) {
      console.error('ユーザーデータ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            navigation.navigate('Login');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    if (user) {
      navigation.navigate('EditProfile', { user });
    }
  };

  const handlePostPress = (post: InsectPost) => {
    const insectDetail = {
      id: post.id,
      name: post.name,
      scientificName: post.scientificName,
      locationName: post.location,
      imageUrl: post.images[0],
      user: {
        displayName: post.user.displayName,
        avatar: post.user.avatar,
      },
      createdAt: post.timestamp,
      likesCount: post.likesCount,
      description: post.description,
      tags: post.tags,
    };
    navigation.navigate('InsectDetail', { insect: insectDetail });
  };

  const renderPostItem = (post: InsectPost, index: number) => (
    <Animated.View
      key={post.id}
      style={[
        styles.postCard,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        }
      ]}
    >
      <TouchableOpacity
        onPress={() => handlePostPress(post)}
        activeOpacity={0.8}
      >
        <View style={styles.postImageContainer}>
          <Image
            source={{ uri: post.images[0] }}
            style={styles.postImage}
          />
          <View style={styles.postOverlay}>
            <Text style={styles.postTitle}>{post.name}</Text>
            <View style={styles.postStats}>
              <View style={styles.statItem}>
                <MaterialIcons name="favorite" size={16} color="white" />
                <Text style={styles.statText}>{post.likesCount}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="person" size={48} color="#4CAF50" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadUserData}
            colors={['#4CAF50']}
          />
        }
      >
        {/* プロフィールヘッダー */}
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
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={handleLogout}
              >
                <MaterialIcons name="logout" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                />
                <TouchableOpacity 
                  style={styles.editAvatarButton}
                  onPress={handleEditProfile}
                >
                  <MaterialIcons name="camera-alt" size={16} color="white" />
                </TouchableOpacity>
              </View>

              <Text style={styles.displayName}>{user.displayName}</Text>
              <Text style={styles.email}>{user.email}</Text>
              
              {user.bio && (
                <Text style={styles.bio}>{user.bio}</Text>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={handleEditProfile}
                >
                  <MaterialIcons name="edit" size={16} color="#4CAF50" />
                  <Text style={styles.editButtonText}>プロフィール編集</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.badgeButton}
                  onPress={() => navigation.navigate('Achievements')}
                >
                  <MaterialIcons name="emoji-events" size={16} color="#FF9500" />
                  <Text style={styles.badgeButtonText}>実績・バッジ</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.collectionButton}
                  onPress={() => navigation.navigate('Collection')}
                >
                  <MaterialIcons name="collections" size={16} color="#9C27B0" />
                  <Text style={styles.collectionButtonText}>昆虫図鑑</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.settingsMenuButton}
                  onPress={() => setShowOfflineStatus(true)}
                >
                  <MaterialIcons name="cloud-off" size={16} color="#607D8B" />
                  <Text style={styles.settingsMenuButtonText}>オフライン</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.settingsMenuButton}
                  onPress={() => setShowPrivacySettings(true)}
                >
                  <MaterialIcons name="privacy-tip" size={16} color="#607D8B" />
                  <Text style={styles.settingsMenuButtonText}>プライバシー</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.settingsMenuButton}
                  onPress={() => setShowErrorDashboard(true)}
                >
                  <MaterialIcons name="bug-report" size={16} color="#607D8B" />
                  <Text style={styles.settingsMenuButtonText}>エラー監視</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 統計情報 */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{statistics.totalPosts}</Text>
                <Text style={styles.statLabel}>投稿</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{statistics.totalLikes}</Text>
                <Text style={styles.statLabel}>いいね</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{statistics.uniqueSpecies}</Text>
                <Text style={styles.statLabel}>発見種</Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* レベル情報 */}
        {userLevel && (
          <View style={styles.levelSection}>
            <LevelProgressBar 
              userLevel={userLevel}
              onPress={() => {
                navigation.navigate('Leaderboard');
              }}
            />
          </View>
        )}

        {/* 投稿一覧 */}
        <View style={styles.postsSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="photo-library" size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>私の投稿</Text>
          </View>

          {userPosts.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="camera-alt" size={64} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>まだ投稿がありません</Text>
              <Text style={styles.emptyText}>
                昆虫を発見したら写真を撮って投稿してみましょう！
              </Text>
              <TouchableOpacity
                style={styles.addPostButton}
                onPress={() => Alert.alert('投稿', '投稿タブから昆虫の写真を投稿できます')}
              >
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32']}
                  style={styles.addPostGradient}
                >
                  <MaterialIcons name="add" size={20} color="white" />
                  <Text style={styles.addPostText}>投稿する</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.postsGrid}>
              {userPosts.map((post, index) => renderPostItem(post, index))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* オフライン状態画面のモーダル */}
      {showOfflineStatus && (
        <OfflineStatusScreen onBack={() => setShowOfflineStatus(false)} />
      )}

      {/* プライバシー設定画面のモーダル */}
      {showPrivacySettings && (
        <PrivacySettingsScreen onBack={() => setShowPrivacySettings(false)} />
      )}

      {/* エラーダッシュボード画面のモーダル */}
      {showErrorDashboard && (
        <ErrorDashboardScreen onBack={() => setShowErrorDashboard(false)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  header: {
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  settingsButton: {
    padding: 8,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 25,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'white',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  bio: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  badgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeButtonText: {
    color: '#FF9500',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  collectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  collectionButtonText: {
    color: '#9C27B0',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  settingsMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  settingsMenuButtonText: {
    color: '#607D8B',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
  },
  statCard: {
    flex: 1,
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
  postsSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  addPostButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  addPostGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 12,
  },
  addPostText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  postCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postImageContainer: {
    position: 'relative',
    height: 150,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
  },
  postTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  postStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  levelSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
});

export default ProfileScreen;