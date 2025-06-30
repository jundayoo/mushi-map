import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  Animated,
  Alert,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/SimpleNavigator';
import { unifiedPostService, InsectPost } from '../services/unifiedPostService';

const { width, height } = Dimensions.get('window');

const mockInsects = [
  {
    id: '1',
    name: 'カブトムシ',
    scientificName: 'Trypoxylus dichotomus',
    locationName: '新宿御苑',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    user: { displayName: '昆虫太郎', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=taro' },
    createdAt: '2024-06-29',
    likesCount: 24,
    description: '夏の代表的な昆虫。力強い角が特徴的で、クヌギの樹液を好みます。',
    tags: ['成虫', 'カブトムシ', '夏'],
  },
  {
    id: '2',
    name: 'ナナホシテントウ',
    scientificName: 'Coccinella septempunctata',
    locationName: '皇居東御苑',
    imageUrl: 'https://images.unsplash.com/photo-1551154994-c51b9b2b8ef7?w=800',
    user: { displayName: '虫好き花子', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=hanako' },
    createdAt: '2024-06-28',
    likesCount: 18,
    description: '7つの黒い斑点が特徴的なテントウムシ。アブラムシを食べる益虫です。',
    tags: ['成虫', 'テントウムシ', '益虫'],
  },
  {
    id: '3',
    name: 'オオクワガタ',
    scientificName: 'Dorcus hopei binodulosus',
    locationName: '上野公園',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    user: { displayName: '昆虫太郎', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=taro' },
    createdAt: '2024-06-27',
    likesCount: 42,
    description: '日本最大級のクワガタムシ。希少価値が高く、コレクターに人気です。',
    tags: ['成虫', 'クワガタ', '希少'],
  },
];

type NavigationProp = StackNavigationProp<RootStackParamList>;

const PremiumMapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedTab, setSelectedTab] = useState<'recent' | 'popular' | 'nearby'>('recent');
  const [posts, setPosts] = useState<InsectPost[]>([]);
  const [statistics, setStatistics] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalSpecies: 0,
  });
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const savedPosts = await unifiedPostService.getPosts();
      const stats = {
        totalPosts: savedPosts.length,
        totalLikes: savedPosts.reduce((sum, post) => sum + post.likesCount, 0),
        totalSpecies: new Set(savedPosts.map(post => post.name)).size,
        totalLocations: new Set(savedPosts.map(post => post.location)).size,
      };
      
      // モックデータと実際のデータを組み合わせ
      const combinedPosts = [...savedPosts, ...mockInsects.map(mock => ({
        id: mock.id,
        name: mock.name,
        scientificName: mock.scientificName,
        location: mock.locationName,
        description: mock.description,
        environment: '',
        isPublic: true,
        images: [mock.imageUrl],
        timestamp: mock.createdAt,
        user: {
          id: 'mock_user',
          displayName: mock.user.displayName,
          avatar: mock.user.avatar,
        },
        likesCount: mock.likesCount,
        tags: mock.tags,
      }))];
      
      setPosts(combinedPosts);
      setStatistics(stats);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInsectPress = (insect: any) => {
    navigation.navigate('InsectDetail', { insect });
  };

  const renderInsectCard = ({ item, index }: { item: any; index: number }) => (
    <Animated.View 
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          }],
        }
      ]}
    >
      <TouchableOpacity
        style={styles.insectCard}
        onPress={() => handleInsectPress(item)}
        activeOpacity={0.9}
      >
        <View style={styles.cardImageContainer}>
          <Image
            source={{ uri: item.images?.[0] || item.imageUrl }}
            style={styles.cardImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          <View style={styles.cardBadge}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardScientificName}>{item.scientificName}</Text>
            </View>
            <View style={styles.likeContainer}>
              <MaterialIcons name="favorite" size={20} color="#FF6B6B" />
              <Text style={styles.likeCount}>{item.likesCount}</Text>
            </View>
          </View>

          <View style={styles.locationContainer}>
            <MaterialIcons name="place" size={16} color="#4CAF50" />
            <Text style={styles.locationText}>{item.location || item.locationName}</Text>
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
              <View key={tagIndex} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.userInfo}>
              <Image source={{ uri: item.user.avatar }} style={styles.userAvatar} />
              <Text style={styles.userName}>{item.user.displayName}</Text>
            </View>
            <Text style={styles.timeAgo}>2時間前</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* プレミアムヘッダー */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={styles.logoContainer}>
                <MaterialIcons name="bug-report" size={32} color="white" />
                <View style={styles.titleContainer}>
                  <Text style={styles.headerTitle}>むしマップ</Text>
                  <Text style={styles.headerSubtitle}>昆虫発見コミュニティ</Text>
                </View>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={() => navigation.navigate('MapView' as any)}
                >
                  <MaterialIcons name="map" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.notificationButton}>
                  <MaterialIcons name="notifications" size={24} color="white" />
                  <View style={styles.notificationBadge} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 統計ダッシュボード */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{statistics.totalPosts}</Text>
                <Text style={styles.statLabel}>総投稿</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{statistics.totalLikes}</Text>
                <Text style={styles.statLabel}>いいね</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{statistics.totalSpecies}</Text>
                <Text style={styles.statLabel}>昆虫種</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* タブ切り替え */}
      <View style={styles.tabContainer}>
        {[
          { key: 'recent', label: '最新', icon: 'access-time' },
          { key: 'popular', label: '人気', icon: 'trending-up' },
          { key: 'nearby', label: '近くの発見', icon: 'near-me' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <MaterialIcons 
              name={tab.icon as any} 
              size={18} 
              color={selectedTab === tab.key ? '#4CAF50' : '#999'} 
            />
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 昆虫リスト */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <MaterialIcons name="bug-report" size={48} color="#4CAF50" />
          <Text style={styles.loadingText}>投稿を読み込み中...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderInsectCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      )}

      {/* プレミアムFAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => Alert.alert('投稿', '新しい昆虫を発見しましたか？')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.fabGradient}
        >
          <MaterialIcons name="add" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>
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
  },
  headerGradient: {
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#E8F5E8',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 20,
  },
  insectCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardImageContainer: {
    position: 'relative',
    height: 200,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  cardBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  cardScientificName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 2,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
  },
  likeCount: {
    fontSize: 14,
    color: '#FF6B6B',
    marginLeft: 4,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  tag: {
    backgroundColor: '#F0F8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    fontWeight: '500',
  },
});

export default PremiumMapScreen;