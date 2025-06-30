import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { api } from '../services/api';

const { height } = Dimensions.get('window');

interface InsectMarker {
  id: string;
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
  user: { displayName: string };
  createdAt: string;
  likesCount: number;
  imageUrl?: string;
}

// モックデータ（APIが準備できるまでの仮データ）
const mockInsects: InsectMarker[] = [
  {
    id: '1',
    name: 'カブトムシ',
    locationName: '新宿御苑',
    latitude: 35.6857,
    longitude: 139.7104,
    user: { displayName: '昆虫太郎' },
    createdAt: '2024-06-29',
    likesCount: 12,
  },
  {
    id: '2',
    name: 'ナナホシテントウ',
    locationName: '皇居東御苑',
    latitude: 35.6864,
    longitude: 139.7531,
    user: { displayName: '虫好き花子' },
    createdAt: '2024-06-28',
    likesCount: 8,
  },
  {
    id: '3',
    name: 'オオクワガタ',
    locationName: '上野公園',
    latitude: 35.7156,
    longitude: 139.7747,
    user: { displayName: '昆虫太郎' },
    createdAt: '2024-06-27',
    likesCount: 25,
  },
  {
    id: '4',
    name: 'モンシロチョウ',
    locationName: '日比谷公園',
    latitude: 35.6745,
    longitude: 139.7560,
    user: { displayName: '蝶々コレクター' },
    createdAt: '2024-06-26',
    likesCount: 15,
  },
];

const MapWithInsectsScreen: React.FC = () => {
  const [insects, setInsects] = useState<InsectMarker[]>(mockInsects);
  const [selectedInsect, setSelectedInsect] = useState<InsectMarker | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showList, setShowList] = useState(false);
  const mapRef = useRef<MapView>(null);

  // 初期位置（東京）
  const initialRegion = {
    latitude: 35.6762,
    longitude: 139.6503,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    requestLocationPermission();
    loadInsects();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        // 現在地に地図を移動
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }, 1000);
        }
      }
    } catch (error) {
      console.log('位置情報の取得エラー:', error);
    }
  };

  const loadInsects = async () => {
    try {
      setIsLoading(true);
      // TODO: 実際のAPIから昆虫データを取得
      // const response = await api.get('/insects/map');
      // setInsects(response.data);
      
      // 現在はモックデータを使用
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('昆虫データの取得エラー:', error);
      setIsLoading(false);
    }
  };

  const handleMarkerPress = (insect: InsectMarker) => {
    setSelectedInsect(insect);
  };

  const handleCalloutPress = (insect: InsectMarker) => {
    Alert.alert(
      insect.name,
      `場所: ${insect.locationName}\n投稿者: ${insect.user.displayName}\nいいね: ${insect.likesCount}`,
      [
        { 
          text: 'いいね！', 
          onPress: () => {
            // TODO: いいね機能の実装
            console.log('いいね！');
          }
        },
        { 
          text: '詳細を見る',
          onPress: () => {
            // TODO: 詳細画面への遷移
            console.log('詳細画面へ');
          }
        },
        { text: '閉じる', style: 'cancel' },
      ]
    );
  };

  const renderInsectCard = ({ item }: { item: InsectMarker }) => (
    <TouchableOpacity
      style={styles.insectCard}
      onPress={() => {
        setShowList(false);
        setSelectedInsect(item);
        // 地図上の該当マーカーに移動
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: item.latitude,
            longitude: item.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }
      }}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.insectName}>{item.name}</Text>
        <View style={styles.likeContainer}>
          <MaterialIcons name="favorite" size={16} color="#FF6B6B" />
          <Text style={styles.likeCount}>{item.likesCount}</Text>
        </View>
      </View>
      <Text style={styles.location}>{item.locationName}</Text>
      <Text style={styles.user}>投稿者: {item.user.displayName}</Text>
      <Text style={styles.date}>{item.createdAt}</Text>
    </TouchableOpacity>
  );

  const getMarkerColor = (insectName: string) => {
    // 昆虫の種類によってマーカーの色を変える
    if (insectName.includes('カブトムシ')) return '#8B4513';
    if (insectName.includes('クワガタ')) return '#654321';
    if (insectName.includes('チョウ')) return '#FF6B6B';
    if (insectName.includes('テントウ')) return '#FF0000';
    return '#4CAF50';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>地図を読み込んでいます...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
      >
        {insects.map((insect) => (
          <Marker
            key={insect.id}
            coordinate={{
              latitude: insect.latitude,
              longitude: insect.longitude,
            }}
            onPress={() => handleMarkerPress(insect)}
            pinColor={getMarkerColor(insect.name)}
          >
            <Callout onPress={() => handleCalloutPress(insect)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{insect.name}</Text>
                <Text style={styles.calloutLocation}>{insect.locationName}</Text>
                <Text style={styles.calloutUser}>by {insect.user.displayName}</Text>
                <View style={styles.calloutLikes}>
                  <MaterialIcons name="favorite" size={14} color="#FF6B6B" />
                  <Text style={styles.calloutLikeCount}>{insect.likesCount}</Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* 統計情報バー */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <MaterialIcons name="bug-report" size={20} color="#4CAF50" />
          <Text style={styles.statText}>{insects.length} 件</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialIcons name="favorite" size={20} color="#FF6B6B" />
          <Text style={styles.statText}>
            {insects.reduce((sum, insect) => sum + insect.likesCount, 0)} いいね
          </Text>
        </View>
      </View>

      {/* コントロールボタン */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            if (userLocation && mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }, 1000);
            }
          }}
        >
          <MaterialIcons name="my-location" size={24} color="#4CAF50" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowList(!showList)}
        >
          <MaterialIcons name="list" size={24} color="#4CAF50" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={loadInsects}
        >
          <MaterialIcons name="refresh" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* リスト表示 */}
      {showList && (
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>発見された昆虫</Text>
            <TouchableOpacity onPress={() => setShowList(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={insects}
            renderItem={renderInsectCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  statsBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  controls: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    gap: 10,
  },
  controlButton: {
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginVertical: 5,
  },
  callout: {
    width: 150,
    padding: 10,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  calloutUser: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  calloutLikes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutLikeCount: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  listContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    padding: 15,
  },
  insectCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  user: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
});

export default MapWithInsectsScreen;