import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  StatusBar,
  Animated,
  ScrollView,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/SimpleNavigator';

const { width, height } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface InsectData {
  id: string;
  name: string;
  scientificName: string;
  imageUrl: string;
  user: { displayName: string; avatar: string };
  createdAt: string;
  likesCount: number;
  description: string;
  tags: string[];
}

interface LocationData {
  id: string;
  name: string;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  environment: string;
  imageUrl: string;
  insects: InsectData[];
  totalInsects: number;
  recentActivity: string;
}

const mockLocationData: LocationData[] = [
  {
    id: '1',
    name: '新宿御苑',
    type: '都市公園',
    description: '東京都心にある広大な庭園。多様な樹木と豊かな自然環境が特徴。',
    latitude: 35.6852,
    longitude: 139.7104,
    environment: '広葉樹林・針葉樹林・草地',
    imageUrl: 'https://images.unsplash.com/photo-1544892504-5ee30c8a8c0d?w=800',
    totalInsects: 15,
    recentActivity: '2時間前',
    insects: [
      {
        id: '1-1',
        name: 'カブトムシ',
        scientificName: 'Trypoxylus dichotomus',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
        user: { displayName: '昆虫太郎', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=taro' },
        createdAt: '2024-06-29',
        likesCount: 24,
        description: '夏の代表的な昆虫。力強い角が特徴的で、クヌギの樹液を好みます。',
        tags: ['成虫', 'カブトムシ', '夏'],
      },
      {
        id: '1-2',
        name: 'アオスジアゲハ',
        scientificName: 'Graphium sarpedon',
        imageUrl: 'https://images.unsplash.com/photo-1587869536670-ee78cd20c7e8?w=800',
        user: { displayName: '蝶々花子', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=hanako2' },
        createdAt: '2024-06-29',
        likesCount: 12,
        description: '美しい青緑色の筋が特徴的なアゲハチョウ。都市部でも見かけることができます。',
        tags: ['成虫', 'アゲハチョウ', '都市部'],
      },
    ],
  },
  {
    id: '2',
    name: '皇居東御苑',
    type: '皇室庭園',
    description: '皇居の一部として管理される歴史ある庭園。四季折々の自然が楽しめます。',
    latitude: 35.6839,
    longitude: 139.7544,
    environment: '日本庭園・雑木林・芝生',
    imageUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800',
    totalInsects: 8,
    recentActivity: '1日前',
    insects: [
      {
        id: '2-1',
        name: 'ナナホシテントウ',
        scientificName: 'Coccinella septempunctata',
        imageUrl: 'https://images.unsplash.com/photo-1551154994-c51b9b2b8ef7?w=800',
        user: { displayName: '虫好き花子', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=hanako' },
        createdAt: '2024-06-28',
        likesCount: 18,
        description: '7つの黒い斑点が特徴的なテントウムシ。アブラムシを食べる益虫です。',
        tags: ['成虫', 'テントウムシ', '益虫'],
      },
    ],
  },
  {
    id: '3',
    name: '上野公園',
    type: '都市公園',
    description: '桜で有名な上野公園。博物館や動物園もあり、多様な昆虫が生息しています。',
    latitude: 35.7148,
    longitude: 139.7742,
    environment: '桜並木・雑木林・池',
    imageUrl: 'https://images.unsplash.com/photo-1493804714600-6edb30129018?w=800',
    totalInsects: 23,
    recentActivity: '30分前',
    insects: [
      {
        id: '3-1',
        name: 'オオクワガタ',
        scientificName: 'Dorcus hopei binodulosus',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
        user: { displayName: '昆虫太郎', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=taro' },
        createdAt: '2024-06-27',
        likesCount: 42,
        description: '日本最大級のクワガタムシ。希少価値が高く、コレクターに人気です。',
        tags: ['成虫', 'クワガタ', '希少'],
      },
      {
        id: '3-2',
        name: 'ミヤマクワガタ',
        scientificName: 'Lucanus maculifemoratus',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
        user: { displayName: 'クワガタ博士', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=doctor' },
        createdAt: '2024-06-26',
        likesCount: 35,
        description: '山地に生息するクワガタムシ。黄金色の体毛が美しい。',
        tags: ['成虫', 'クワガタ', '山地'],
      },
    ],
  },
];

const SimpleMapViewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent' | 'popular'>('all');
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [selectedInsect, setSelectedInsect] = useState<InsectData | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLocationPress = (location: LocationData) => {
    setSelectedLocation(location);
    setSelectedInsect(null);
  };

  const handleInsectPress = (insect: InsectData) => {
    setSelectedInsect(insect);
  };

  const handleViewInsectDetails = () => {
    if (selectedInsect) {
      const insectWithLocation = {
        ...selectedInsect,
        locationName: selectedLocation?.name || '',
      };
      navigation.navigate('InsectDetail', { insect: insectWithLocation });
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      Alert.alert('検索', '検索キーワードを入力してください');
      return;
    }
    Alert.alert('検索結果', `"${searchQuery}"の検索機能は実装予定です`);
  };

  const filteredLocations = mockLocationData.filter(location => {
    if (selectedFilter === 'popular') {
      return location.totalInsects > 15;
    }
    if (selectedFilter === 'recent') {
      return location.recentActivity.includes('時間前') || location.recentActivity.includes('分前');
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* プレミアム検索ヘッダー */}
      <Animated.View 
        style={[
          styles.searchHeader,
          {
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          }
        ]}
      >
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.searchGradient}
        >
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <MaterialIcons name="search" size={24} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="昆虫、場所で検索..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity onPress={handleSearch}>
                <MaterialIcons name="arrow-forward" size={24} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </View>

          {/* フィルターボタン */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            {[
              { key: 'all', label: '全て', icon: 'apps' },
              { key: 'recent', label: '最新', icon: 'access-time' },
              { key: 'popular', label: '人気', icon: 'trending-up' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.key && styles.activeFilterButton
                ]}
                onPress={() => setSelectedFilter(filter.key as any)}
              >
                <MaterialIcons 
                  name={filter.icon as any} 
                  size={18} 
                  color={selectedFilter === filter.key ? 'white' : 'rgba(255,255,255,0.8)'} 
                />
                <Text style={[
                  styles.filterText,
                  selectedFilter === filter.key && styles.activeFilterText
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>
      </Animated.View>

      {/* 地図風背景 */}
      <View style={styles.mapBackground}>
        <LinearGradient
          colors={['#E8F5E8', '#F0F8F0']}
          style={styles.mapGradient}
        >
          {/* 地図グリッド */}
          <View style={styles.gridOverlay}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View key={`h-${i}`} style={[styles.gridLine, { top: i * 30 }]} />
            ))}
            {Array.from({ length: 15 }).map((_, i) => (
              <View key={`v-${i}`} style={[styles.gridLineVertical, { left: i * 25 }]} />
            ))}
          </View>

          {/* 場所マーカー */}
          {filteredLocations.map((location, index) => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationMarker,
                {
                  top: 150 + index * 80,
                  left: 50 + index * 70,
                },
                selectedLocation?.id === location.id && styles.selectedMarker
              ]}
              onPress={() => handleLocationPress(location)}
            >
              <LinearGradient
                colors={selectedLocation?.id === location.id ? ['#FF6B6B', '#E53E3E'] : ['#4CAF50', '#2E7D32']}
                style={styles.markerGradient}
              >
                <MaterialIcons 
                  name={location.type === '都市公園' ? 'park' : location.type === '皇室庭園' ? 'account-balance' : 'nature'} 
                  size={20} 
                  color="white" 
                />
              </LinearGradient>
              <View style={styles.markerLabel}>
                <Text style={styles.markerText}>{location.name}</Text>
                <Text style={styles.markerSubtext}>{location.totalInsects}種</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* 現在地マーカー */}
          <View style={styles.currentLocationMarker}>
            <LinearGradient
              colors={['#2196F3', '#1976D2']}
              style={styles.currentLocationGradient}
            >
              <MaterialIcons name="my-location" size={16} color="white" />
            </LinearGradient>
          </View>
        </LinearGradient>
      </View>

      {/* 場所詳細パネル */}
      {selectedLocation && !selectedInsect && (
        <Animated.View style={[styles.detailPanel, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.95)']}
            style={styles.detailGradient}
          >
            <View style={styles.detailHeader}>
              <Image source={{ uri: selectedLocation.imageUrl }} style={styles.detailImage} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailTitle}>{selectedLocation.name}</Text>
                <Text style={styles.detailScientific}>{selectedLocation.type}</Text>
                <View style={styles.detailLocation}>
                  <MaterialIcons name="nature" size={16} color="#4CAF50" />
                  <Text style={styles.detailLocationText}>{selectedLocation.environment}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedLocation(null)}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.detailStats}>
              <View style={styles.detailStat}>
                <MaterialIcons name="bug-report" size={16} color="#4CAF50" />
                <Text style={styles.detailStatText}>{selectedLocation.totalInsects}種類</Text>
              </View>
              <View style={styles.detailStat}>
                <MaterialIcons name="access-time" size={16} color="#666" />
                <Text style={styles.detailStatText}>{selectedLocation.recentActivity}</Text>
              </View>
            </View>

            <Text style={styles.insectsTitle}>発見された昆虫</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.insectsScroll}>
              {selectedLocation.insects.map((insect) => (
                <TouchableOpacity
                  key={insect.id}
                  style={styles.insectCard}
                  onPress={() => handleInsectPress(insect)}
                >
                  <Image source={{ uri: insect.imageUrl }} style={styles.insectCardImage} />
                  <Text style={styles.insectCardName}>{insect.name}</Text>
                  <View style={styles.insectCardStats}>
                    <MaterialIcons name="favorite" size={12} color="#FF6B6B" />
                    <Text style={styles.insectCardLikes}>{insect.likesCount}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      )}

      {/* 昆虫詳細パネル */}
      {selectedInsect && (
        <Animated.View style={[styles.detailPanel, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.95)']}
            style={styles.detailGradient}
          >
            <View style={styles.detailHeader}>
              <Image source={{ uri: selectedInsect.imageUrl }} style={styles.detailImage} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailTitle}>{selectedInsect.name}</Text>
                <Text style={styles.detailScientific}>{selectedInsect.scientificName}</Text>
                <View style={styles.detailLocation}>
                  <MaterialIcons name="place" size={16} color="#4CAF50" />
                  <Text style={styles.detailLocationText}>{selectedLocation?.name}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedInsect(null)}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.detailStats}>
              <View style={styles.detailStat}>
                <MaterialIcons name="favorite" size={16} color="#FF6B6B" />
                <Text style={styles.detailStatText}>{selectedInsect.likesCount}</Text>
              </View>
              <View style={styles.detailStat}>
                <MaterialIcons name="person" size={16} color="#666" />
                <Text style={styles.detailStatText}>{selectedInsect.user.displayName}</Text>
              </View>
            </View>

            <Text style={styles.descriptionText}>{selectedInsect.description}</Text>

            <TouchableOpacity style={styles.viewDetailsButton} onPress={handleViewInsectDetails}>
              <LinearGradient
                colors={['#4CAF50', '#2E7D32']}
                style={styles.viewDetailsGradient}
              >
                <MaterialIcons name="visibility" size={20} color="white" />
                <Text style={styles.viewDetailsText}>詳細を見る</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      {/* 統計パネル */}
      <Animated.View 
        style={[
          styles.statsPanel,
          { opacity: fadeAnim }
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
          style={styles.statsPanelGradient}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="place" size={20} color="#4CAF50" />
              <Text style={styles.statNumber}>{filteredLocations.length}</Text>
              <Text style={styles.statLabel}>発見地点</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="visibility" size={20} color="#2196F3" />
              <Text style={styles.statNumber}>5km</Text>
              <Text style={styles.statLabel}>表示範囲</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: StatusBar.currentHeight || 40,
  },
  searchGradient: {
    paddingBottom: 15,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  filterContainer: {
    paddingHorizontal: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  activeFilterButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '600',
  },
  mapBackground: {
    flex: 1,
    marginTop: 140,
  },
  mapGradient: {
    flex: 1,
    position: 'relative',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  locationMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  selectedMarker: {
    transform: [{ scale: 1.2 }],
  },
  markerGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  markerLabel: {
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  markerText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  markerSubtext: {
    fontSize: 10,
    color: '#666',
    marginTop: 1,
  },
  currentLocationMarker: {
    position: 'absolute',
    bottom: 200,
    right: 100,
  },
  currentLocationGradient: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  detailPanel: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  detailGradient: {
    padding: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  detailInfo: {
    flex: 1,
    marginLeft: 15,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  detailScientific: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 2,
  },
  detailLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  detailLocationText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
  },
  detailStats: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 20,
  },
  detailStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailStatText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  viewDetailsButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  viewDetailsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  viewDetailsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  insectsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 5,
  },
  insectsScroll: {
    marginBottom: 15,
  },
  insectCard: {
    width: 80,
    marginRight: 12,
    alignItems: 'center',
  },
  insectCardImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 6,
  },
  insectCardName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  insectCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  insectCardLikes: {
    fontSize: 11,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  statsPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsPanelGradient: {
    padding: 15,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 15,
  },
});

export default SimpleMapViewScreen;