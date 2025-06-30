import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Badge, AchievementProgress } from '../services/achievementService';

const { width } = Dimensions.get('window');

interface BadgeComponentProps {
  achievementProgress: AchievementProgress;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const BadgeComponent: React.FC<BadgeComponentProps> = ({ 
  achievementProgress, 
  onPress, 
  size = 'medium' 
}) => {
  const { badge, progress, isCompleted } = achievementProgress;
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 80, height: 100 },
          badge: { width: 50, height: 50 },
          icon: 24,
          title: 10,
          description: 8,
        };
      case 'large':
        return {
          container: { width: 140, height: 180 },
          badge: { width: 80, height: 80 },
          icon: 40,
          title: 16,
          description: 12,
        };
      default: // medium
        return {
          container: { width: 110, height: 140 },
          badge: { width: 60, height: 60 },
          icon: 30,
          title: 12,
          description: 10,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  
  const getRarityGradient = (rarity: string): string[] => {
    switch (rarity) {
      case 'common':
        return ['#8E8E93', '#636366'];
      case 'rare':
        return ['#007AFF', '#0051D0'];
      case 'epic':
        return ['#AF52DE', '#8E44AD'];
      case 'legendary':
        return ['#FF9500', '#FF6B00'];
      default:
        return ['#8E8E93', '#636366'];
    }
  };

  const progressPercentage = Math.min((progress / badge.requirement) * 100, 100);

  return (
    <TouchableOpacity
      style={[styles.container, sizeStyles.container]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <View style={styles.badgeContainer}>
        <LinearGradient
          colors={isCompleted ? getRarityGradient(badge.rarity) : ['#E5E5EA', '#C7C7CC']}
          style={[styles.badgeCircle, sizeStyles.badge]}
        >
          {isCompleted ? (
            <Text style={[styles.badgeIcon, { fontSize: sizeStyles.icon }]}>
              {badge.icon}
            </Text>
          ) : (
            <MaterialIcons 
              name="lock" 
              size={sizeStyles.icon * 0.6} 
              color="#8E8E93" 
            />
          )}
        </LinearGradient>
        
        {/* 進捗バー */}
        {!isCompleted && progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progressPercentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {progress}/{badge.requirement}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.textContainer}>
        <Text 
          style={[
            styles.badgeName, 
            { fontSize: sizeStyles.title },
            isCompleted && { color: getRarityGradient(badge.rarity)[0] }
          ]}
          numberOfLines={2}
        >
          {badge.name}
        </Text>
        
        <Text 
          style={[styles.badgeDescription, { fontSize: sizeStyles.description }]}
          numberOfLines={3}
        >
          {badge.description}
        </Text>

        {isCompleted && achievementProgress.unlockedAt && (
          <Text style={styles.unlockedDate}>
            獲得: {new Date(achievementProgress.unlockedAt).toLocaleDateString('ja-JP')}
          </Text>
        )}
      </View>

      {/* レアリティインジケーター */}
      <View style={[styles.rarityIndicator, { backgroundColor: getRarityGradient(badge.rarity)[0] }]} />
    </TouchableOpacity>
  );
};

interface BadgeGridProps {
  achievements: AchievementProgress[];
  onBadgePress?: (badge: Badge) => void;
  columns?: number;
  badgeSize?: 'small' | 'medium' | 'large';
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({ 
  achievements, 
  onBadgePress, 
  columns = 3,
  badgeSize = 'medium'
}) => {
  const itemWidth = (width - 60) / columns - 10;

  return (
    <View style={styles.gridContainer}>
      {achievements.map((achievement, index) => (
        <View key={achievement.badge.id} style={[styles.gridItem, { width: itemWidth }]}>
          <BadgeComponent
            achievementProgress={achievement}
            onPress={() => onBadgePress?.(achievement.badge)}
            size={badgeSize}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 10,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeCircle: {
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  badgeIcon: {
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 5,
    alignItems: 'center',
    width: '100%',
  },
  progressBackground: {
    width: '80%',
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 8,
    color: '#8E8E93',
    marginTop: 2,
  },
  textContainer: {
    alignItems: 'center',
    flex: 1,
  },
  badgeName: {
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeDescription: {
    color: '#666',
    textAlign: 'center',
    lineHeight: 12,
  },
  unlockedDate: {
    fontSize: 8,
    color: '#8E8E93',
    marginTop: 4,
  },
  rarityIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  gridItem: {
    marginBottom: 15,
  },
});

export default BadgeComponent;