import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/SimpleNavigator';

const { width, height } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface InsectMarker {
  id: string;
  name: string;
  scientificName: string;
  locationName: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  user: { displayName: string; avatar: string };
  createdAt: string;
  likesCount: number;
  description: string;
  tags: string[];
}

const mockInsectMarkers: InsectMarker[] = [
  {
    id: '1',
    name: 'カブトムシ',
    scientificName: 'Trypoxylus dichotomus',
    locationName: '新宿御苑',
    latitude: 35.6852,
    longitude: 139.7104,
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
    latitude: 35.6839,
    longitude: 139.7544,
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
    latitude: 35.7148,
    longitude: 139.7742,
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    user: { displayName: '昆虫太郎', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=taro' },
    createdAt: '2024-06-27',
    likesCount: 42,
    description: '日本最大級のクワガタムシ。希少価値が高く、コレクターに人気です。',
    tags: ['成虫', 'クワガタ', '希少'],
  },
];

const PremiumMapViewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [region, setRegion] = useState({
    latitude: 35.6762,
    longitude: 139.6503,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent' | 'popular'>('all');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const mapRef = useRef<MapView>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getCurrentLocation();
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

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('位置情報', '位置情報の使用が許可されていません');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    } catch (error) {
      console.error('位置情報取得エラー:', error);
      Alert.alert('エラー', '位置情報を取得できませんでした');
    }
  };

  const handleMarkerPress = (insect: InsectMarker) => {
    navigation.navigate('InsectDetail', { insect });
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      Alert.alert('検索', '検索キーワードを入力してください');
      return;
    }
    
    setShowSearchResults(true);
    Alert.alert('検索結果', `"${searchQuery}"の検索機能は実装予定です`);
  };

  const filteredMarkers = mockInsectMarkers.filter(marker => {
    if (selectedFilter === 'popular') {
      return marker.likesCount > 20;
    }
    if (selectedFilter === 'recent') {
      return marker.createdAt === '2024-06-29';
    }
    return true;
  });

  const handleMyLocation = () => {
    if (userLocation) {
      const newRegion = {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    } else {
      getCurrentLocation();
    }
  };

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

      {/* 地図 */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        toolbarEnabled={false}
      >
        {filteredMarkers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            onPress={() => handleMarkerPress(marker)}
          >
            <View style={styles.markerContainer}>
              <LinearGradient
                colors={['#4CAF50', '#2E7D32']}
                style={styles.markerGradient}
              >
                <MaterialIcons name="bug-report" size={20} color="white" />
              </LinearGradient>
            </View>
            <Callout tooltip>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{marker.name}</Text>
                <Text style={styles.calloutDescription}>{marker.locationName}</Text>
                <View style={styles.calloutFooter}>
                  <MaterialIcons name="favorite" size={14} color="#FF6B6B" />
                  <Text style={styles.calloutLikes}>{marker.likesCount}</Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* マップコントロール */}
      <View style={styles.mapControls}>
        {/* 現在地ボタン */}
        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleMyLocation}
        >
          <LinearGradient
            colors={['#4CAF50', '#2E7D32']}
            style={styles.controlButtonGradient}
          >
            <MaterialIcons name="my-location" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        {/* ズームコントロール */}
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => {
              const newRegion = {
                ...region,
                latitudeDelta: region.latitudeDelta * 0.5,
                longitudeDelta: region.longitudeDelta * 0.5,
              };
              setRegion(newRegion);
              mapRef.current?.animateToRegion(newRegion, 500);
            }}
          >
            <MaterialIcons name="add" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => {
              const newRegion = {
                ...region,
                latitudeDelta: region.latitudeDelta * 2,
                longitudeDelta: region.longitudeDelta * 2,
              };
              setRegion(newRegion);
              mapRef.current?.animateToRegion(newRegion, 500);
            }}
          >
            <MaterialIcons name="remove" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

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
              <Text style={styles.statNumber}>{filteredMarkers.length}</Text>
              <Text style={styles.statLabel}>発見地点</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="visibility" size={20} color="#2196F3" />
              <Text style={styles.statNumber}>
                {Math.round(region.latitudeDelta * 111)}km
              </Text>
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
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    minWidth: 150,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  calloutDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  calloutFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  calloutLikes: {
    fontSize: 12,
    color: '#FF6B6B',
    marginLeft: 4,
    fontWeight: '500',
  },
  mapControls: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'center',
  },
  locationButton: {
    marginBottom: 15,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  controlButtonGradient: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomControls: {
    backgroundColor: 'white',
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  zoomButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  statsPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 80,
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

export default PremiumMapViewScreen;