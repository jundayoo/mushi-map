import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';
import { unifiedPostService } from './unifiedPostService';
import { socialService } from './socialService';
import { notificationService } from './notificationService';

export interface UserLevel {
  id: string;
  userId: string;
  currentLevel: number;
  currentXP: number;
  totalXP: number;
  nextLevelXP: number;
  levelProgress: number; // 0-1の進捗率
  title: string;
  description: string;
  badge: string;
  updatedAt: string;
}

export interface XPGain {
  id: string;
  userId: string;
  action: string;
  amount: number;
  description: string;
  createdAt: string;
  metadata?: any;
}

export interface LevelDefinition {
  level: number;
  requiredXP: number;
  title: string;
  description: string;
  badge: string;
  rewards?: string[];
}

class LevelService {
  private readonly USER_LEVELS_KEY = '@mushi_map_user_levels';
  private readonly XP_GAINS_KEY = '@mushi_map_xp_gains';

  // レベル定義（1-50レベル）
  private readonly LEVEL_DEFINITIONS: LevelDefinition[] = [
    { level: 1, requiredXP: 0, title: '昆虫初心者', description: 'むしマップへようこそ！', badge: '🐛' },
    { level: 2, requiredXP: 100, title: '観察者', description: '昆虫に興味を持ち始めました', badge: '🔍' },
    { level: 3, requiredXP: 250, title: '発見者', description: '昆虫発見の楽しさを知りました', badge: '👀' },
    { level: 4, requiredXP: 450, title: '記録者', description: '継続的に記録を残しています', badge: '📝' },
    { level: 5, requiredXP: 700, title: '写真家', description: '美しい昆虫写真を撮っています', badge: '📷' },
    { level: 6, requiredXP: 1000, title: '探検家', description: '様々な場所で昆虫を探しています', badge: '🗺️' },
    { level: 7, requiredXP: 1350, title: '分類学者', description: '昆虫の分類に詳しくなりました', badge: '🔬' },
    { level: 8, requiredXP: 1750, title: '生態学者', description: '昆虫の生態を理解しています', badge: '🌿' },
    { level: 9, requiredXP: 2200, title: 'コミュニティメンバー', description: 'コミュニティに積極参加しています', badge: '👥' },
    { level: 10, requiredXP: 2700, title: '専門家', description: '昆虫の専門知識を持っています', badge: '🎓' },
    { level: 11, requiredXP: 3250, title: 'アドバイザー', description: '他の人にアドバイスできます', badge: '💡' },
    { level: 12, requiredXP: 3850, title: 'インフルエンサー', description: 'コミュニティに影響力があります', badge: '⭐' },
    { level: 13, requiredXP: 4500, title: 'レア種ハンター', description: '珍しい昆虫を見つけるのが得意です', badge: '💎' },
    { level: 14, requiredXP: 5200, title: '季節マスター', description: '四季の昆虫を熟知しています', badge: '🍂' },
    { level: 15, requiredXP: 5950, title: '夜行性専門家', description: '夜の昆虫に詳しいです', badge: '🌙' },
    { level: 16, requiredXP: 6750, title: '水生昆虫博士', description: '水辺の昆虫のエキスパートです', badge: '💧' },
    { level: 17, requiredXP: 7600, title: '花訪問者研究家', description: '花と昆虫の関係を研究しています', badge: '🌸' },
    { level: 18, requiredXP: 8500, title: '行動学者', description: '昆虫の行動パターンを熟知しています', badge: '🎭' },
    { level: 19, requiredXP: 9450, title: '保護活動家', description: '昆虫保護に貢献しています', badge: '🛡️' },
    { level: 20, requiredXP: 10450, title: 'マスター観察者', description: '観察技術が極めて高いです', badge: '👁️' },
    { level: 21, requiredXP: 11500, title: '生息地専門家', description: '様々な環境の昆虫を知っています', badge: '🏞️' },
    { level: 22, requiredXP: 12600, title: 'マクロ写真家', description: '接写撮影の達人です', badge: '📸' },
    { level: 23, requiredXP: 13750, title: '同定エキスパート', description: '昆虫の同定が非常に正確です', badge: '🔍' },
    { level: 24, requiredXP: 14950, title: 'フィールドワーカー', description: '野外調査のプロフェッショナルです', badge: '⛰️' },
    { level: 25, requiredXP: 16200, title: 'むしマップアンバサダー', description: 'コミュニティの代表的存在です', badge: '👑' },
    { level: 26, requiredXP: 17500, title: '生物多様性研究者', description: '生物多様性の理解が深いです', badge: '🌍' },
    { level: 27, requiredXP: 18850, title: '昆虫生理学者', description: '昆虫の体の仕組みに詳しいです', badge: '🧬' },
    { level: 28, requiredXP: 20250, title: '発生学者', description: '昆虫の成長過程を熟知しています', badge: '🔄' },
    { level: 29, requiredXP: 21700, title: '進化生物学者', description: '昆虫の進化について深く理解しています', badge: '🧭' },
    { level: 30, requiredXP: 23200, title: 'レジェンド', description: '昆虫界の伝説的存在です', badge: '🏆' },
    { level: 31, requiredXP: 24750, title: '生態系guardian', description: '生態系全体を守護しています', badge: '🌲' },
    { level: 32, requiredXP: 26350, title: '昆虫AI', description: '昆虫に関する知識が人工知能レベルです', badge: '🤖' },
    { level: 33, requiredXP: 28000, title: 'グローバル研究者', description: '世界的な昆虫研究者です', badge: '🌐' },
    { level: 34, requiredXP: 29700, title: '次世代教育者', description: '次世代に昆虫の魅力を伝えています', badge: '👨‍🏫' },
    { level: 35, requiredXP: 31450, title: '持続可能性リーダー', description: '持続可能な昆虫研究をリードしています', badge: '♻️' },
    { level: 36, requiredXP: 33250, title: 'イノベーター', description: '昆虫研究に革新をもたらしています', badge: '💡' },
    { level: 37, requiredXP: 35100, title: 'ウィスダムキーパー', description: '昆虫に関する知恵の番人です', badge: '📚' },
    { level: 38, requiredXP: 37000, title: 'ナチュラリスト', description: '自然界全体を理解する博物学者です', badge: '🦋' },
    { level: 39, requiredXP: 38950, title: 'エコシステムアーキテクト', description: '生態系設計の専門家です', badge: '🏗️' },
    { level: 40, requiredXP: 40950, title: 'プラネタリーガーディアン', description: '地球規模で生物を保護しています', badge: '🌎' },
    { level: 41, requiredXP: 43000, title: 'タイムレスオブザーバー', description: '時を超えた観察者です', badge: '⏰' },
    { level: 42, requiredXP: 45100, title: 'コズミックナチュラリスト', description: '宇宙規模の自然を理解しています', badge: '🌌' },
    { level: 43, requiredXP: 47250, title: 'ディメンショナルリサーチャー', description: '次元を超えた研究を行っています', badge: '🔮' },
    { level: 44, requiredXP: 49450, title: 'クォンタムエントモロジスト', description: '量子昆虫学の先駆者です', badge: '⚛️' },
    { level: 45, requiredXP: 51700, title: 'ユニバーサルセージ', description: '宇宙の知恵を持つ賢者です', badge: '🧙‍♂️' },
    { level: 46, requiredXP: 54000, title: 'エターナルガーディアン', description: '永遠の守護者です', badge: '👼' },
    { level: 47, requiredXP: 56350, title: 'インフィニットオブザーバー', description: '無限の観察者です', badge: '♾️' },
    { level: 48, requiredXP: 58750, title: 'トランセンデントマスター', description: '超越したマスターです', badge: '✨' },
    { level: 49, requiredXP: 61200, title: 'アルティメットセージ', description: '究極の賢者です', badge: '🌟' },
    { level: 50, requiredXP: 63700, title: 'ゴッドオブむしマップ', description: 'むしマップの神です', badge: '🎭' },
  ];

  // XP獲得アクション
  private readonly XP_ACTIONS = {
    // 投稿系
    FIRST_POST: { amount: 100, description: '初回投稿' },
    DAILY_POST: { amount: 50, description: '1日1投稿' },
    WEEKLY_POST: { amount: 25, description: '週次投稿' },
    QUALITY_POST: { amount: 75, description: '高品質投稿' },
    DETAILED_POST: { amount: 30, description: '詳細な投稿' },
    
    // 発見系
    NEW_SPECIES: { amount: 200, description: '新種発見' },
    RARE_SPECIES: { amount: 150, description: 'レア種発見' },
    SEASONAL_SPECIES: { amount: 100, description: '季節限定種発見' },
    LOCATION_DIVERSITY: { amount: 80, description: '多様な場所での発見' },
    
    // ソーシャル系
    RECEIVE_LIKE: { amount: 10, description: 'いいね獲得' },
    RECEIVE_COMMENT: { amount: 15, description: 'コメント獲得' },
    GIVE_HELPFUL_COMMENT: { amount: 20, description: '有用なコメント投稿' },
    COMMUNITY_CONTRIBUTION: { amount: 50, description: 'コミュニティ貢献' },
    
    // 継続系
    LOGIN_STREAK_7: { amount: 100, description: '7日連続ログイン' },
    LOGIN_STREAK_30: { amount: 300, description: '30日連続ログイン' },
    LOGIN_STREAK_100: { amount: 1000, description: '100日連続ログイン' },
    
    // 特別系
    COMPLETE_PROFILE: { amount: 50, description: 'プロフィール完成' },
    FIRST_IDENTIFICATION: { amount: 80, description: '初回同定' },
    PHOTO_QUALITY: { amount: 40, description: '高品質写真' },
    EDUCATIONAL_CONTENT: { amount: 60, description: '教育的コンテンツ' },
  };

  // ============ ユーザーレベル管理 ============

  async getUserLevel(userId?: string): Promise<UserLevel | null> {
    try {
      const currentUser = userId ? { id: userId } : await authService.getCurrentUser();
      if (!currentUser) return null;

      const levelsJson = await AsyncStorage.getItem(this.USER_LEVELS_KEY);
      const levels: UserLevel[] = levelsJson ? JSON.parse(levelsJson) : [];
      
      let userLevel = levels.find(level => level.userId === currentUser.id);
      
      if (!userLevel) {
        // 新規ユーザーのレベル作成
        userLevel = await this.createUserLevel(currentUser.id);
      }

      return userLevel;
    } catch (error) {
      console.error('ユーザーレベル取得エラー:', error);
      return null;
    }
  }

  private async createUserLevel(userId: string): Promise<UserLevel> {
    const initialLevel = this.LEVEL_DEFINITIONS[0];
    const newUserLevel: UserLevel = {
      id: `level_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      currentLevel: 1,
      currentXP: 0,
      totalXP: 0,
      nextLevelXP: this.LEVEL_DEFINITIONS[1].requiredXP,
      levelProgress: 0,
      title: initialLevel.title,
      description: initialLevel.description,
      badge: initialLevel.badge,
      updatedAt: new Date().toISOString(),
    };

    await this.saveUserLevel(newUserLevel);
    return newUserLevel;
  }

  private async saveUserLevel(userLevel: UserLevel): Promise<void> {
    try {
      const levelsJson = await AsyncStorage.getItem(this.USER_LEVELS_KEY);
      const levels: UserLevel[] = levelsJson ? JSON.parse(levelsJson) : [];
      
      const existingIndex = levels.findIndex(level => level.userId === userLevel.userId);
      
      if (existingIndex >= 0) {
        levels[existingIndex] = userLevel;
      } else {
        levels.push(userLevel);
      }

      await AsyncStorage.setItem(this.USER_LEVELS_KEY, JSON.stringify(levels));
    } catch (error) {
      console.error('ユーザーレベル保存エラー:', error);
    }
  }

  // ============ XP獲得システム ============

  async addXP(
    action: keyof typeof this.XP_ACTIONS,
    metadata?: any
  ): Promise<{ success: boolean; xpGain?: XPGain; levelUp?: boolean; newLevel?: UserLevel; error?: string }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'ログインが必要です' };
      }

      const actionConfig = this.XP_ACTIONS[action];
      if (!actionConfig) {
        return { success: false, error: '無効なアクションです' };
      }

      // XP獲得記録を作成
      const xpGain: XPGain = {
        id: `xp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: currentUser.id,
        action,
        amount: actionConfig.amount,
        description: actionConfig.description,
        createdAt: new Date().toISOString(),
        metadata,
      };

      // XP獲得履歴を保存
      await this.saveXPGain(xpGain);

      // ユーザーレベルを更新
      const currentLevel = await this.getUserLevel(currentUser.id);
      if (!currentLevel) {
        return { success: false, error: 'ユーザーレベルの取得に失敗しました' };
      }

      const newTotalXP = currentLevel.totalXP + actionConfig.amount;
      const levelUpResult = this.calculateLevel(newTotalXP);

      const updatedLevel: UserLevel = {
        ...currentLevel,
        currentLevel: levelUpResult.level,
        currentXP: newTotalXP - levelUpResult.currentLevelXP,
        totalXP: newTotalXP,
        nextLevelXP: levelUpResult.nextLevelXP,
        levelProgress: levelUpResult.progress,
        title: levelUpResult.title,
        description: levelUpResult.description,
        badge: levelUpResult.badge,
        updatedAt: new Date().toISOString(),
      };

      await this.saveUserLevel(updatedLevel);

      const levelUp = updatedLevel.currentLevel > currentLevel.currentLevel;

      // レベルアップ通知送信
      if (levelUp) {
        notificationService.sendLevelUpNotification(
          updatedLevel.currentLevel,
          updatedLevel.title
        );
      }

      return {
        success: true,
        xpGain,
        levelUp,
        newLevel: updatedLevel,
      };
    } catch (error) {
      console.error('XP追加エラー:', error);
      return { success: false, error: 'XPの追加に失敗しました' };
    }
  }

  private calculateLevel(totalXP: number): {
    level: number;
    currentLevelXP: number;
    nextLevelXP: number;
    progress: number;
    title: string;
    description: string;
    badge: string;
  } {
    let currentLevel = 1;
    let currentLevelXP = 0;

    // 現在のレベルを計算
    for (let i = this.LEVEL_DEFINITIONS.length - 1; i >= 0; i--) {
      if (totalXP >= this.LEVEL_DEFINITIONS[i].requiredXP) {
        currentLevel = this.LEVEL_DEFINITIONS[i].level;
        currentLevelXP = this.LEVEL_DEFINITIONS[i].requiredXP;
        break;
      }
    }

    // 次のレベルのXPを計算
    const nextLevelIndex = Math.min(currentLevel, this.LEVEL_DEFINITIONS.length - 1);
    const nextLevelXP = this.LEVEL_DEFINITIONS[nextLevelIndex] ? 
      this.LEVEL_DEFINITIONS[nextLevelIndex].requiredXP : 
      this.LEVEL_DEFINITIONS[this.LEVEL_DEFINITIONS.length - 1].requiredXP;

    // 進捗率を計算
    const currentXPInLevel = totalXP - currentLevelXP;
    const xpForNextLevel = nextLevelXP - currentLevelXP;
    const progress = xpForNextLevel > 0 ? currentXPInLevel / xpForNextLevel : 1;

    const levelDef = this.LEVEL_DEFINITIONS[currentLevel - 1];

    return {
      level: currentLevel,
      currentLevelXP,
      nextLevelXP,
      progress: Math.min(progress, 1),
      title: levelDef.title,
      description: levelDef.description,
      badge: levelDef.badge,
    };
  }

  private async saveXPGain(xpGain: XPGain): Promise<void> {
    try {
      const gainsJson = await AsyncStorage.getItem(this.XP_GAINS_KEY);
      const gains: XPGain[] = gainsJson ? JSON.parse(gainsJson) : [];
      
      gains.unshift(xpGain); // 新しい記録を先頭に追加
      
      // 最新1000件のみ保持
      const limitedGains = gains.slice(0, 1000);
      
      await AsyncStorage.setItem(this.XP_GAINS_KEY, JSON.stringify(limitedGains));
    } catch (error) {
      console.error('XP獲得履歴保存エラー:', error);
    }
  }

  // ============ 自動XP計算 ============

  async checkAndAwardXP(userId: string): Promise<XPGain[]> {
    try {
      const awardedXP: XPGain[] = [];

      // 投稿数チェック
      const posts = await unifiedPostService.getUserPosts(userId);
      
      if (posts.length === 1) {
        const result = await this.addXP('FIRST_POST');
        if (result.success && result.xpGain) {
          awardedXP.push(result.xpGain);
        }
      }

      // 今日の投稿チェック
      const today = new Date().toDateString();
      const todayPosts = posts.filter(post => 
        new Date(post.timestamp).toDateString() === today
      );

      if (todayPosts.length === 1) {
        const result = await this.addXP('DAILY_POST');
        if (result.success && result.xpGain) {
          awardedXP.push(result.xpGain);
        }
      }

      // ソーシャル活動チェック
      const socialStats = await socialService.getSocialStats(userId);
      
      // プロフィール完成チェック
      const user = await authService.getCurrentUser();
      if (user && user.displayName && user.avatar && posts.length > 0) {
        const result = await this.addXP('COMPLETE_PROFILE');
        if (result.success && result.xpGain) {
          awardedXP.push(result.xpGain);
        }
      }

      return awardedXP;
    } catch (error) {
      console.error('自動XP計算エラー:', error);
      return [];
    }
  }

  // ============ 統計・情報取得 ============

  async getXPHistory(userId: string, limit: number = 50): Promise<XPGain[]> {
    try {
      const gainsJson = await AsyncStorage.getItem(this.XP_GAINS_KEY);
      const gains: XPGain[] = gainsJson ? JSON.parse(gainsJson) : [];
      
      return gains
        .filter(gain => gain.userId === userId)
        .slice(0, limit);
    } catch (error) {
      console.error('XP履歴取得エラー:', error);
      return [];
    }
  }

  async getLeaderboard(limit: number = 20): Promise<UserLevel[]> {
    try {
      const levelsJson = await AsyncStorage.getItem(this.USER_LEVELS_KEY);
      const levels: UserLevel[] = levelsJson ? JSON.parse(levelsJson) : [];
      
      return levels
        .sort((a, b) => {
          if (a.currentLevel !== b.currentLevel) {
            return b.currentLevel - a.currentLevel;
          }
          return b.totalXP - a.totalXP;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('リーダーボード取得エラー:', error);
      return [];
    }
  }

  getLevelDefinitions(): LevelDefinition[] {
    return this.LEVEL_DEFINITIONS;
  }

  getXPActions() {
    return this.XP_ACTIONS;
  }

  // ============ ユーティリティ ============

  formatXP(xp: number): string {
    if (xp >= 1000000) {
      return `${(xp / 1000000).toFixed(1)}M XP`;
    } else if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K XP`;
    }
    return `${xp} XP`;
  }

  calculateTimeToNextLevel(userLevel: UserLevel): string {
    const xpNeeded = userLevel.nextLevelXP - userLevel.totalXP;
    const averageXPPerDay = 150; // 仮定値
    
    const daysNeeded = Math.ceil(xpNeeded / averageXPPerDay);
    
    if (daysNeeded <= 1) {
      return '今日中';
    } else if (daysNeeded <= 7) {
      return `約${daysNeeded}日`;
    } else if (daysNeeded <= 30) {
      return `約${Math.ceil(daysNeeded / 7)}週間`;
    } else {
      return `約${Math.ceil(daysNeeded / 30)}ヶ月`;
    }
  }
}

export const levelService = new LevelService();