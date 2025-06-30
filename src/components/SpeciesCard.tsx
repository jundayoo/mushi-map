import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { InsectSpecies, collectionService } from '../services/collectionService';

interface SpeciesCardProps {
  species: InsectSpecies;
  isDiscovered: boolean;
  onPress?: () => void;
  showDiscoveryBadge?: boolean;
  compact?: boolean;
}

const SpeciesCard: React.FC<SpeciesCardProps> = ({
  species,
  isDiscovered,
  onPress,
  showDiscoveryBadge = true,
  compact = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const rarityColor = collectionService.getRarityColor(species.rarity);
  const rarityLabel = collectionService.getRarityLabel(species.rarity);
  const categoryLabel = collectionService.getCategoryLabel(species.category);
  const sizeLabel = collectionService.getSizeLabel(species.size);

  const getRarityIcon = (rarity: InsectSpecies['rarity']): string => {
    switch (rarity) {
      case 'common': return '⭐';
      case 'uncommon': return '⭐⭐';
      case 'rare': return '⭐⭐⭐';
      case 'epic': return '💎';
      case 'legendary': return '👑';
      default: return '❓';
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, !isDiscovered && styles.undiscoveredCard]}
        onPress={onPress}
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={isDiscovered ? ['#FFFFFF', '#F8F9FA'] : ['#F5F5F5', '#E0E0E0']}
            style={styles.compactGradient}
          >
            {/* 画像エリア */}
            <View style={styles.compactImageContainer}>
              {isDiscovered ? (
                <Image 
                  source={{ uri: species.defaultImage }} 
                  style={styles.compactImage}
                />
              ) : (
                <View style={styles.mysteryImage}>
                  <MaterialIcons name="help-outline" size={32} color="#999" />
                </View>
              )}
              
              {/* レア度バッジ */}
              <View style={[styles.compactRarityBadge, { backgroundColor: rarityColor }]}>
                <Text style={styles.compactRarityIcon}>{getRarityIcon(species.rarity)}</Text>
              </View>
            </View>

            {/* 情報エリア */}
            <View style={styles.compactInfo}>
              <Text style={[styles.compactName, !isDiscovered && styles.mysteryText]}>
                {isDiscovered ? species.name : '???'}
              </Text>
              <Text style={styles.compactCategory}>{categoryLabel}</Text>
              {isDiscovered && showDiscoveryBadge && (
                <View style={styles.discoveredBadge}>
                  <MaterialIcons name="check-circle" size={12} color="#4CAF50" />
                  <Text style={styles.discoveredText}>発見済み</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, !isDiscovered && styles.undiscoveredCard]}
      onPress={onPress}
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={isDiscovered ? ['#FFFFFF', '#F8F9FA'] : ['#F5F5F5', '#E0E0E0']}
          style={styles.gradient}
        >
          {/* ヘッダー */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={[styles.name, !isDiscovered && styles.mysteryText]}>
                {isDiscovered ? species.name : '???'}
              </Text>
              {isDiscovered && (
                <Text style={styles.scientificName}>{species.scientificName}</Text>
              )}
            </View>
            
            {/* 発見済みバッジ */}
            {isDiscovered && showDiscoveryBadge && (
              <View style={styles.discoveredBadge}>
                <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                <Text style={styles.discoveredText}>発見済み</Text>
              </View>
            )}
          </View>

          {/* 画像エリア */}
          <View style={styles.imageContainer}>
            {isDiscovered ? (
              <Image source={{ uri: species.defaultImage }} style={styles.image} />
            ) : (
              <View style={styles.mysteryImage}>
                <MaterialIcons name="help-outline" size={64} color="#999" />
                <Text style={styles.mysteryImageText}>未発見</Text>
              </View>
            )}
            
            {/* レア度バッジ */}
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
              <Text style={styles.rarityIcon}>{getRarityIcon(species.rarity)}</Text>
              <Text style={styles.rarityText}>{rarityLabel}</Text>
            </View>
          </View>

          {/* 詳細情報 */}
          {isDiscovered && (
            <View style={styles.details}>
              <View style={styles.detailRow}>
                <MaterialIcons name="category" size={16} color="#666" />
                <Text style={styles.detailText}>{categoryLabel}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <MaterialIcons name="straighten" size={16} color="#666" />
                <Text style={styles.detailText}>{sizeLabel}</Text>
              </View>

              {species.season.length > 0 && (
                <View style={styles.detailRow}>
                  <MaterialIcons name="calendar-today" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {species.season.map(s => {
                      switch (s) {
                        case 'spring': return '春';
                        case 'summer': return '夏';
                        case 'autumn': return '秋';
                        case 'winter': return '冬';
                        default: return s;
                      }
                    }).join('・')}
                  </Text>
                </View>
              )}

              {species.habitat.length > 0 && (
                <View style={styles.detailRow}>
                  <MaterialIcons name="place" size={16} color="#666" />
                  <Text style={styles.detailText}>{species.habitat.slice(0, 2).join('・')}</Text>
                </View>
              )}
            </View>
          )}

          {/* 説明文 */}
          {isDiscovered && (
            <Text style={styles.description} numberOfLines={2}>
              {species.description}
            </Text>
          )}

          {/* 未発見のヒント */}
          {!isDiscovered && species.discoveryTips.length > 0 && (
            <View style={styles.hintContainer}>
              <MaterialIcons name="lightbulb-outline" size={16} color="#FF9500" />
              <Text style={styles.hintText} numberOfLines={2}>
                ヒント: {species.discoveryTips[0]}
              </Text>
            </View>
          )}

          {/* アクションボタン */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="info-outline" size={20} color="#4CAF50" />
              <Text style={styles.actionText}>詳細</Text>
            </TouchableOpacity>
            
            {!isDiscovered && (
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="search" size={20} color="#FF9500" />
                <Text style={styles.actionText}>探す</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  undiscoveredCard: {
    opacity: 0.7,
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  mysteryText: {
    color: '#999',
    fontStyle: 'italic',
  },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 2,
  },
  discoveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discoveredText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  imageContainer: {
    position: 'relative',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  mysteryImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mysteryImageText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    fontWeight: '500',
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  rarityText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  hintText: {
    fontSize: 14,
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    color: '#666',
  },
  // コンパクトスタイル
  compactCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  compactGradient: {
    padding: 12,
  },
  compactImageContainer: {
    position: 'relative',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  compactImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  compactRarityBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactRarityIcon: {
    fontSize: 12,
  },
  compactInfo: {
    alignItems: 'center',
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  compactCategory: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default SpeciesCard;