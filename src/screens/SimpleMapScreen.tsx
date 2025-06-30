import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// モックデータ
const mockInsects = [
  {
    id: '1',
    name: 'カブトムシ',
    locationName: '新宿御苑',
    latitude: 35.6762,
    longitude: 139.6503,
    user: { displayName: '昆虫太郎' },
    createdAt: '2024-06-29',
    likesCount: 12,
  },
  {
    id: '2',
    name: 'ナナホシテントウ',
    locationName: '皇居東御苑',
    latitude: 35.6584,
    longitude: 139.7017,
    user: { displayName: '虫好き花子' },
    createdAt: '2024-06-28',
    likesCount: 8,
  },
  {
    id: '3',
    name: 'オオクワガタ',
    locationName: '上野公園',
    latitude: 35.7219,
    longitude: 139.7653,
    user: { displayName: '昆虫太郎' },
    createdAt: '2024-06-27',
    likesCount: 25,
  },
];

const SimpleMapScreen: React.FC = () => {
  const [selectedInsect, setSelectedInsect] = useState<any>(null);

  const handleInsectPress = (insect: any) => {
    setSelectedInsect(insect);
    Alert.alert(
      `${insect.name}`,
      `場所: ${insect.locationName}\n投稿者: ${insect.user.displayName}\nいいね: ${insect.likesCount}`,
      [
        { text: 'いいね！', onPress: () => console.log('いいね！') },
        { text: '閉じる', style: 'cancel' },
      ]
    );
  };

  const renderInsectCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.insectCard}
      onPress={() => handleInsectPress(item)}
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

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>むしマップ</Text>
        <Text style={styles.headerSubtitle}>昆虫発見共有アプリ</Text>
      </View>

      {/* 統計情報 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{mockInsects.length}</Text>
          <Text style={styles.statLabel}>投稿数</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {mockInsects.reduce((sum, insect) => sum + insect.likesCount, 0)}
          </Text>
          <Text style={styles.statLabel}>総いいね</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>2</Text>
          <Text style={styles.statLabel}>ユーザー</Text>
        </View>
      </View>

      {/* 昆虫リスト */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>最新の発見</Text>
        <FlatList
          data={mockInsects}
          renderItem={renderInsectCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* フローティングアクションボタン */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => Alert.alert('投稿', '投稿機能は開発中です')}
      >
        <MaterialIcons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statsContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingVertical: 20,
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 10,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  listContent: {
    paddingBottom: 80,
  },
  insectCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  location: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 4,
  },
  user: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});

export default SimpleMapScreen;