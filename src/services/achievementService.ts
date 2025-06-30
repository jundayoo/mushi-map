import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';
import { unifiedPostService } from './unifiedPostService';
import { notificationService } from './notificationService';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'posting' | 'discovery' | 'social' | 'exploration' | 'time';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: number;
  hidden: boolean;
}

export interface UserAchievement {
  badgeId: string;
  userId: string;
  unlockedAt: string;
  progress: number;
  isCompleted: boolean;
}

export interface AchievementProgress {
  badge: Badge;
  progress: number;
  isCompleted: boolean;
  unlockedAt?: string;
}

class AchievementService {
  private readonly ACHIEVEMENTS_KEY = '@mushi_map_achievements';
  private readonly USER_PROGRESS_KEY = '@mushi_map_user_progress';

  // 利用可能なバッジ定義
  private readonly AVAILABLE_BADGES: Badge[] = [
    // 投稿関連
    {
      id: 'first_post',
      name: '初心者昆虫ハンター',
      description: '初めての昆虫投稿をしました！',
      icon: '🐛',
      category: 'posting',
      rarity: 'common',
      requirement: 1,
      hidden: false,
    },
    {
      id: 'photo_master',
      name: '写真マスター',
      description: '10枚の昆虫写真を投稿しました！',
      icon: '📸',
      category: 'posting',
      rarity: 'common',
      requirement: 10,
      hidden: false,
    },
    {
      id: 'prolific_poster',
      name: '多産投稿者',
      description: '50枚の昆虫写真を投稿しました！',
      icon: '📷',
      category: 'posting',
      rarity: 'rare',
      requirement: 50,
      hidden: false,
    },
    {
      id: 'legendary_photographer',
      name: '伝説の写真家',
      description: '100枚の昆虫写真を投稿しました！',
      icon: '🏆',
      category: 'posting',
      rarity: 'legendary',
      requirement: 100,
      hidden: false,
    },

    // 発見関連
    {
      id: 'species_discoverer',
      name: '種族発見者',
      description: '5種類の異なる昆虫を発見しました！',
      icon: '🔍',
      category: 'discovery',
      rarity: 'common',
      requirement: 5,
      hidden: false,
    },
    {
      id: 'diversity_seeker',
      name: '多様性追求者',
      description: '15種類の異なる昆虫を発見しました！',
      icon: '🦋',
      category: 'discovery',
      rarity: 'rare',
      requirement: 15,
      hidden: false,
    },
    {
      id: 'entomologist',
      name: '昆虫学者',
      description: '30種類の異なる昆虫を発見しました！',
      icon: '🎓',
      category: 'discovery',
      rarity: 'epic',
      requirement: 30,
      hidden: false,
    },
    {
      id: 'rare_hunter',
      name: '希少種ハンター',
      description: '珍しい昆虫を発見しました！',
      icon: '💎',
      category: 'discovery',
      rarity: 'epic',
      requirement: 1,
      hidden: true,
    },

    // 探検関連
    {
      id: 'explorer',
      name: '探検家',
      description: '5つの異なる場所で昆虫を発見しました！',
      icon: '🗺️',
      category: 'exploration',
      rarity: 'common',
      requirement: 5,
      hidden: false,
    },
    {
      id: 'world_traveler',
      name: '世界の旅人',
      description: '15の異なる場所で昆虫を発見しました！',
      icon: '🌍',
      category: 'exploration',
      rarity: 'rare',
      requirement: 15,
      hidden: false,
    },

    // 継続関連
    {
      id: 'daily_observer',
      name: '日々の観察者',
      description: '3日連続で投稿しました！',
      icon: '📅',
      category: 'time',
      rarity: 'common',
      requirement: 3,
      hidden: false,
    },
    {
      id: 'weekly_dedicator',
      name: '週間継続者',
      description: '7日連続で投稿しました！',
      icon: '⭐',
      category: 'time',
      rarity: 'rare',
      requirement: 7,
      hidden: false,
    },
    {
      id: 'monthly_champion',
      name: '月間チャンピオン',
      description: '30日連続で投稿しました！',
      icon: '👑',
      category: 'time',
      rarity: 'legendary',
      requirement: 30,
      hidden: false,
    },

    // ソーシャル関連
    {
      id: 'social_butterfly',
      name: 'ソーシャル蝶',
      description: '他のユーザーから10個のいいねを獲得しました！',
      icon: '🦋',
      category: 'social',
      rarity: 'common',
      requirement: 10,
      hidden: false,
    },
    {
      id: 'community_favorite',
      name: 'コミュニティの人気者',
      description: '他のユーザーから50個のいいねを獲得しました！',
      icon: '💖',
      category: 'social',
      rarity: 'rare',
      requirement: 50,
      hidden: false,
    },
  ];

  async initializeAchievements(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.ACHIEVEMENTS_KEY);
      if (!stored) {
        await AsyncStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(this.AVAILABLE_BADGES));
      }
    } catch (error) {
      console.error('実績初期化エラー:', error);
    }
  }

  async getUserProgress(userId: string): Promise<AchievementProgress[]> {
    try {
      const progressKey = `${this.USER_PROGRESS_KEY}_${userId}`;
      const storedProgress = await AsyncStorage.getItem(progressKey);
      const userProgress: UserAchievement[] = storedProgress ? JSON.parse(storedProgress) : [];

      return this.AVAILABLE_BADGES.map(badge => {
        const progress = userProgress.find(p => p.badgeId === badge.id);
        return {
          badge,
          progress: progress?.progress || 0,
          isCompleted: progress?.isCompleted || false,
          unlockedAt: progress?.unlockedAt,
        };
      }).filter(item => !item.badge.hidden || item.isCompleted);
    } catch (error) {
      console.error('ユーザー進捗取得エラー:', error);
      return [];
    }
  }

  async checkAchievements(userId: string): Promise<Badge[]> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser || currentUser.id !== userId) return [];

      const posts = await unifiedPostService.getPosts();
      const userPosts = posts.filter(post => post.user.id === userId);
      
      const newlyUnlocked: Badge[] = [];
      const progressKey = `${this.USER_PROGRESS_KEY}_${userId}`;
      const storedProgress = await AsyncStorage.getItem(progressKey);
      const userProgress: UserAchievement[] = storedProgress ? JSON.parse(storedProgress) : [];

      for (const badge of this.AVAILABLE_BADGES) {
        const existingProgress = userProgress.find(p => p.badgeId === badge.id);
        if (existingProgress?.isCompleted) continue;

        const currentProgress = await this.calculateProgress(badge, userPosts);
        const isCompleted = currentProgress >= badge.requirement;

        if (isCompleted && !existingProgress?.isCompleted) {
          newlyUnlocked.push(badge);
          
          // バッジ獲得通知送信
          notificationService.sendBadgeEarnedNotification(badge.name, badge.icon);
        }

        // 進捗を更新
        const updatedProgress: UserAchievement = {
          badgeId: badge.id,
          userId,
          progress: currentProgress,
          isCompleted,
          unlockedAt: isCompleted ? new Date().toISOString() : (existingProgress?.unlockedAt || ''),
        };

        const progressIndex = userProgress.findIndex(p => p.badgeId === badge.id);
        if (progressIndex >= 0) {
          userProgress[progressIndex] = updatedProgress;
        } else {
          userProgress.push(updatedProgress);
        }
      }

      await AsyncStorage.setItem(progressKey, JSON.stringify(userProgress));
      return newlyUnlocked;
    } catch (error) {
      console.error('実績チェックエラー:', error);
      return [];
    }
  }

  private async calculateProgress(badge: Badge, userPosts: any[]): Promise<number> {
    switch (badge.id) {
      case 'first_post':
      case 'photo_master':
      case 'prolific_poster':
      case 'legendary_photographer':
        return userPosts.length;

      case 'species_discoverer':
      case 'diversity_seeker':
      case 'entomologist':
        return new Set(userPosts.map(post => post.name.toLowerCase().trim())).size;

      case 'explorer':
      case 'world_traveler':
        return new Set(userPosts.map(post => post.location.toLowerCase().trim())).size;

      case 'social_butterfly':
      case 'community_favorite':
        return userPosts.reduce((sum, post) => sum + post.likesCount, 0);

      case 'daily_observer':
      case 'weekly_dedicator':
      case 'monthly_champion':
        return this.calculateConsecutiveDays(userPosts);

      case 'rare_hunter':
        return this.checkForRareSpecies(userPosts) ? 1 : 0;

      default:
        return 0;
    }
  }

  private calculateConsecutiveDays(posts: any[]): number {
    if (posts.length === 0) return 0;

    const sortedDates = posts
      .map(post => new Date(post.timestamp).toDateString())
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const uniqueDates = [...new Set(sortedDates)];
    let consecutiveDays = 1;
    const today = new Date().toDateString();

    if (uniqueDates[0] !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (uniqueDates[0] !== yesterday.toDateString()) {
        return 0;
      }
    }

    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i - 1]);
      const previousDate = new Date(uniqueDates[i]);
      const diffTime = currentDate.getTime() - previousDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays;
  }

  private checkForRareSpecies(posts: any[]): boolean {
    const rareSpecies = ['クワガタ', 'カブトムシ', 'オオクワガタ', 'ヘラクレス', 'コクワガタ'];
    return posts.some(post => 
      rareSpecies.some(rare => post.name.toLowerCase().includes(rare.toLowerCase()))
    );
  }

  getBadgesByCategory(category: string): Badge[] {
    return this.AVAILABLE_BADGES.filter(badge => badge.category === category);
  }

  getBadgeById(badgeId: string): Badge | undefined {
    return this.AVAILABLE_BADGES.find(badge => badge.id === badgeId);
  }

  getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'common': return '#8E8E93';
      case 'rare': return '#007AFF';
      case 'epic': return '#AF52DE';
      case 'legendary': return '#FF9500';
      default: return '#8E8E93';
    }
  }
}

export const achievementService = new AchievementService();