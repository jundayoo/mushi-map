import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  StatusBar,
  RefreshControl,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/SimpleNavigator';
import { 
  collectionService, 
  InsectSpecies, 
  CollectionStats, 
  UserDiscovery 
} from '../services/collectionService';
import { authService } from '../services/authService';
import SpeciesCard from '../components/SpeciesCard';

type NavigationProp = StackNavigationProp<RootStackParamList>;

type FilterType = 'all' | 'discovered' | 'undiscovered';
type SortType = 'name' | 'rarity' | 'category' | 'recent';

const CollectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [allSpecies, setAllSpecies] = useState<InsectSpecies[]>([]);
  const [filteredSpecies, setFilteredSpecies] = useState<InsectSpecies[]>([]);
  const [userDiscoveries, setUserDiscoveries] = useState<UserDiscovery[]>([]);
  const [collectionStats, setCollectionStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('name');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadCollectionData();
    }, [])
  );

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  React.useEffect(() => {
    applyFiltersAndSort();
  }, [allSpecies, userDiscoveries, searchQuery, filter, sort, selectedCategory, selectedRarity]);

  const loadCollectionData = async () => {
    try {
      setLoading(true);
      
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        navigation.navigate('Login');
        return;
      }

      // 初期化
      await collectionService.initializeCollection();

      // データ取得
      const [species, discoveries, stats] = await Promise.all([
        collectionService.getAllSpecies(),
        collectionService.getUserDiscoveries(currentUser.id),
        collectionService.getCollectionStats(currentUser.id),
      ]);

      setAllSpecies(species);
      setUserDiscoveries(discoveries);
      setCollectionStats(stats);
    } catch (error) {
      console.error('コレクションデータ読み込みエラー:', error);
      Alert.alert('エラー', 'データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...allSpecies];

    // 検索フィルタ
    if (searchQuery.trim()) {
      filtered = filtered.filter(species =>
        species.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        species.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        species.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 発見状態フィルタ
    const discoveredSpeciesIds = new Set(userDiscoveries.map(d => d.speciesId));
    if (filter === 'discovered') {
      filtered = filtered.filter(species => discoveredSpeciesIds.has(species.id));
    } else if (filter === 'undiscovered') {
      filtered = filtered.filter(species => !discoveredSpeciesIds.has(species.id));
    }

    // カテゴリフィルタ
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(species => species.category === selectedCategory);
    }

    // レア度フィルタ
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(species => species.rarity === selectedRarity);
    }

    // ソート
    filtered.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
          return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'recent':
          const aDiscovery = userDiscoveries.find(d => d.speciesId === a.id);
          const bDiscovery = userDiscoveries.find(d => d.speciesId === b.id);
          if (!aDiscovery && !bDiscovery) return 0;
          if (!aDiscovery) return 1;
          if (!bDiscovery) return -1;
          return new Date(bDiscovery.discoveredAt).getTime() - new Date(aDiscovery.discoveredAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredSpecies(filtered);
  };

  const handleSpeciesPress = (species: InsectSpecies) => {
    const isDiscovered = userDiscoveries.some(d => d.speciesId === species.id);
    const discovery = userDiscoveries.find(d => d.speciesId === species.id);

    Alert.alert(
      species.name,
      isDiscovered 
        ? `${species.description}\n\n発見日: ${discovery ? new Date(discovery.discoveredAt).toLocaleDateString('ja-JP') : '不明'}\n発見場所: ${discovery?.location || '不明'}`
        : `まだ発見していない昆虫です。\n\nヒント: ${species.discoveryTips[0] || '特別な場所を探してみましょう'}`,
      [
        {
          text: isDiscovered ? '詳細を見る' : '探しに行く',
          onPress: () => {
            // 詳細画面や地図画面への遷移
          },
        },
        { text: 'OK', style: 'cancel' },
      ]
    );
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* 発見状態フィルタ */}
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.activeFilterButton]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.activeFilterButtonText]}>
            すべて
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filter === 'discovered' && styles.activeFilterButton]}
          onPress={() => setFilter('discovered')}
        >
          <Text style={[styles.filterButtonText, filter === 'discovered' && styles.activeFilterButtonText]}>
            発見済み
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filter === 'undiscovered' && styles.activeFilterButton]}
          onPress={() => setFilter('undiscovered')}
        >
          <Text style={[styles.filterButtonText, filter === 'undiscovered' && styles.activeFilterButtonText]}>
            未発見
          </Text>
        </TouchableOpacity>

        {/* レア度フィルタ */}
        {['common', 'uncommon', 'rare', 'epic', 'legendary'].map((rarity) => (
          <TouchableOpacity
            key={rarity}
            style={[
              styles.filterButton,
              { backgroundColor: collectionService.getRarityColor(rarity as any) },
              selectedRarity === rarity && styles.activeFilterButton
            ]}
            onPress={() => setSelectedRarity(selectedRarity === rarity ? 'all' : rarity)}
          >
            <Text style={[styles.filterButtonText, { color: 'white' }]}>
              {collectionService.getRarityLabel(rarity as any)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStatsHeader = () => {
    if (!collectionStats) return null;

    return (
      <Animated.View style={[styles.statsContainer, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={['#E8F5E8', '#F0F8F0']}
          style={styles.statsGradient}
        >
          <View style={styles.statsHeader}>
            <MaterialIcons name="collections" size={32} color="#4CAF50" />
            <View style={styles.statsText}>
              <Text style={styles.statsTitle}>昆虫図鑑</Text>
              <Text style={styles.statsSubtitle}>
                {collectionStats.discoveredSpecies}/{collectionStats.totalSpecies} 種発見
              </Text>
            </View>
            <Text style={styles.completionPercentage}>
              {collectionStats.completionPercentage}%
            </Text>
          </View>

          {/* プログレスバー */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${collectionStats.completionPercentage}%`],
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
          </View>

          {/* レア度別統計 */}
          <View style={styles.rarityStats}>
            <View style={styles.rarityStatItem}>
              <View style={[styles.rarityDot, { backgroundColor: collectionService.getRarityColor('common') }]} />
              <Text style={styles.rarityStatText}>{collectionStats.commonDiscovered}</Text>
            </View>
            <View style={styles.rarityStatItem}>
              <View style={[styles.rarityDot, { backgroundColor: collectionService.getRarityColor('uncommon') }]} />
              <Text style={styles.rarityStatText}>{collectionStats.uncommonDiscovered}</Text>
            </View>
            <View style={styles.rarityStatItem}>
              <View style={[styles.rarityDot, { backgroundColor: collectionService.getRarityColor('rare') }]} />
              <Text style={styles.rarityStatText}>{collectionStats.rareDiscovered}</Text>
            </View>
            <View style={styles.rarityStatItem}>
              <View style={[styles.rarityDot, { backgroundColor: collectionService.getRarityColor('epic') }]} />
              <Text style={styles.rarityStatText}>{collectionStats.epicDiscovered}</Text>
            </View>
            <View style={styles.rarityStatItem}>
              <View style={[styles.rarityDot, { backgroundColor: collectionService.getRarityColor('legendary') }]} />
              <Text style={styles.rarityStatText}>{collectionStats.legendaryDiscovered}</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderSpeciesItem = ({ item }: { item: InsectSpecies }) => {
    const isDiscovered = userDiscoveries.some(d => d.speciesId === item.id);
    return (
      <SpeciesCard
        species={item}
        isDiscovered={isDiscovered}
        onPress={() => handleSpeciesPress(item)}
        compact={true}
      />
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
            <Text style={styles.headerTitle}>昆虫コレクション</Text>
            <Text style={styles.headerSubtitle}>発見した昆虫を集めよう</Text>
          </View>

          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => {
              Alert.alert(
                'ソート順序',
                '',
                [
                  { text: '名前順', onPress: () => setSort('name') },
                  { text: 'レア度順', onPress: () => setSort('rarity') },
                  { text: 'カテゴリ順', onPress: () => setSort('category') },
                  { text: '発見順', onPress: () => setSort('recent') },
                  { text: 'キャンセル', style: 'cancel' },
                ]
              );
            }}
          >
            <MaterialIcons name="sort" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>

        {/* 検索バー */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="昆虫名で検索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <MaterialIcons name="clear" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* 統計情報 */}
      {renderStatsHeader()}

      {/* フィルターボタン */}
      {renderFilterButtons()}

      {/* 昆虫リスト */}
      <FlatList
        data={filteredSpecies}
        keyExtractor={(item) => item.id}
        renderItem={renderSpeciesItem}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadCollectionData}
            colors={['#4CAF50']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={64} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>昆虫が見つかりません</Text>
            <Text style={styles.emptyText}>
              検索条件を変更するか、新しい昆虫を発見してみましょう！
            </Text>
          </View>
        }
      />
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
    marginBottom: 15,
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
  sortButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  clearButton: {
    padding: 4,
  },
  statsContainer: {
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsGradient: {
    padding: 20,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statsText: {
    flex: 1,
    marginLeft: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  statsSubtitle: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 2,
  },
  completionPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    width: '100%',
    height: '100%',
  },
  rarityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rarityStatItem: {
    alignItems: 'center',
  },
  rarityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  rarityStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  filterContainer: {
    paddingVertical: 10,
    paddingLeft: 20,
  },
  filterButton: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  activeFilterButton: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  listContainer: {
    padding: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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
});

export default CollectionScreen;