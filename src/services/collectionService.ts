import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';
import { unifiedPostService } from './unifiedPostService';

export interface InsectSpecies {
  id: string;
  name: string;
  scientificName: string;
  category: 'beetle' | 'butterfly' | 'moth' | 'ant' | 'bee' | 'wasp' | 'fly' | 'dragonfly' | 'grasshopper' | 'cricket' | 'cicada' | 'bug' | 'other';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  description: string;
  habitat: string[];
  season: ('spring' | 'summer' | 'autumn' | 'winter')[];
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  colors: string[];
  characteristics: string[];
  discoveryTips: string[];
  funFacts: string[];
  defaultImage: string;
}

export interface UserDiscovery {
  id: string;
  userId: string;
  speciesId: string;
  postId: string;
  imageUrl: string;
  location: string;
  discoveredAt: string;
  isFirstDiscovery: boolean; // そのユーザーの初発見かどうか
  notes?: string;
}

export interface CollectionStats {
  totalSpecies: number;
  discoveredSpecies: number;
  completionPercentage: number;
  commonDiscovered: number;
  uncommonDiscovered: number;
  rareDiscovered: number;
  epicDiscovered: number;
  legendaryDiscovered: number;
  categoriesCompleted: string[];
  recentDiscoveries: UserDiscovery[];
}

class CollectionService {
  private readonly SPECIES_KEY = '@mushi_map_species';
  private readonly DISCOVERIES_KEY = '@mushi_map_discoveries';

  // 昆虫種データベース（実際の実装では外部データベースから取得）
  private readonly INSECT_SPECIES: InsectSpecies[] = [
    // カブトムシ・クワガタ
    {
      id: 'kabuto_beetle',
      name: 'カブトムシ',
      scientificName: 'Trypoxylus dichotomus',
      category: 'beetle',
      rarity: 'common',
      description: '日本を代表する甲虫で、雄は大きな角を持つ。夜行性で樹液に集まる。',
      habitat: ['雑木林', '公園', '山地'],
      season: ['summer'],
      size: 'large',
      colors: ['黒', '茶色'],
      characteristics: ['角がある', '夜行性', '樹液に集まる'],
      discoveryTips: ['夜間にクヌギやコナラの樹液を探す', '街灯の下を確認'],
      funFacts: ['幼虫は腐葉土の中で1年以上過ごす', '成虫の寿命は2-3ヶ月'],
      defaultImage: 'https://example.com/kabuto.jpg',
    },
    {
      id: 'kuwagata_beetle',
      name: 'ノコギリクワガタ',
      scientificName: 'Prosopocoilus inclinatus',
      category: 'beetle',
      rarity: 'uncommon',
      description: 'ノコギリのような大顎を持つクワガタムシ。樹液や果実に集まる。',
      habitat: ['雑木林', '山地'],
      season: ['summer'],
      size: 'medium',
      colors: ['黒', '赤茶'],
      characteristics: ['ノコギリ状の大顎', '樹液に集まる'],
      discoveryTips: ['クヌギの樹液を夜間に探す', '果物トラップを仕掛ける'],
      funFacts: ['大顎の形は個体差が大きい', '♀は♂より小さな顎を持つ'],
      defaultImage: 'https://example.com/kuwagata.jpg',
    },

    // チョウ類
    {
      id: 'monarch_butterfly',
      name: 'オオカバマダラ',
      scientificName: 'Danaus plexippus',
      category: 'butterfly',
      rarity: 'rare',
      description: '美しいオレンジと黒の模様を持つ大型のチョウ。長距離移動で有名。',
      habitat: ['草原', '公園', '花畑'],
      season: ['spring', 'summer', 'autumn'],
      size: 'large',
      colors: ['オレンジ', '黒', '白'],
      characteristics: ['長距離移動', '毒を持つ', '花の蜜を吸う'],
      discoveryTips: ['トウワタの花を探す', '晴れた日の花畑'],
      funFacts: ['3000km以上移動することがある', '幼虫はトウワタのみを食べる'],
      defaultImage: 'https://example.com/monarch.jpg',
    },
    {
      id: 'swallowtail',
      name: 'アゲハチョウ',
      scientificName: 'Papilio xuthus',
      category: 'butterfly',
      rarity: 'common',
      description: '黄色と黒の縞模様が美しい大型のチョウ。都市部でも見られる。',
      habitat: ['公園', '庭', '街路'],
      season: ['spring', 'summer', 'autumn'],
      size: 'large',
      colors: ['黄色', '黒'],
      characteristics: ['大型', '花の蜜を吸う', '都市適応'],
      discoveryTips: ['柑橘類の木を探す', '花壇の周り'],
      funFacts: ['幼虫はミカンの葉を食べる', '年に数回羽化する'],
      defaultImage: 'https://example.com/swallowtail.jpg',
    },

    // トンボ類
    {
      id: 'red_dragonfly',
      name: 'アキアカネ',
      scientificName: 'Sympetrum frequens',
      category: 'dragonfly',
      rarity: 'common',
      description: '秋に真っ赤になる美しいトンボ。日本の秋の風物詩。',
      habitat: ['池', '田んぼ', '湿地'],
      season: ['summer', 'autumn'],
      size: 'medium',
      colors: ['赤', '茶色'],
      characteristics: ['成熟すると赤くなる', '水辺に生息'],
      discoveryTips: ['池や田んぼの周り', '秋の晴れた日'],
      funFacts: ['若い個体は茶色', '群れで移動することがある'],
      defaultImage: 'https://example.com/red_dragonfly.jpg',
    },

    // セミ類
    {
      id: 'cicada_minmin',
      name: 'ミンミンゼミ',
      scientificName: 'Hyalessa maculaticollis',
      category: 'cicada',
      rarity: 'common',
      description: '「ミーンミーン」と鳴く夏の代表的なセミ。緑と黒の美しい体色。',
      habitat: ['公園', '街路樹', '雑木林'],
      season: ['summer'],
      size: 'medium',
      colors: ['緑', '黒', '透明'],
      characteristics: ['特徴的な鳴き声', '昼間活動'],
      discoveryTips: ['鳴き声を頼りに探す', 'ケヤキやサクラの木'],
      funFacts: ['地中で数年過ごしてから羽化', '雄だけが鳴く'],
      defaultImage: 'https://example.com/minmin_cicada.jpg',
    },

    // バッタ類
    {
      id: 'grasshopper',
      name: 'トノサマバッタ',
      scientificName: 'Locusta migratoria',
      category: 'grasshopper',
      rarity: 'uncommon',
      description: '大型で跳躍力に優れたバッタ。緑色と茶色の個体がいる。',
      habitat: ['草原', '河川敷', '農地'],
      season: ['summer', 'autumn'],
      size: 'large',
      colors: ['緑', '茶色'],
      characteristics: ['大型', '高い跳躍力', '群生することがある'],
      discoveryTips: ['背の低い草地', '河川敷の草むら'],
      funFacts: ['環境により体色が変わる', '飛翔能力も高い'],
      defaultImage: 'https://example.com/grasshopper.jpg',
    },

    // レア種
    {
      id: 'atlas_beetle',
      name: 'アトラスオオカブト',
      scientificName: 'Chalcosoma atlas',
      category: 'beetle',
      rarity: 'epic',
      description: '世界最大級のカブトムシ。3本の角が特徴的な東南アジア原産の種。',
      habitat: ['熱帯雨林', '温室'],
      season: ['summer'],
      size: 'huge',
      colors: ['黒', '茶色'],
      characteristics: ['巨大', '3本の角', '強力な力'],
      discoveryTips: ['昆虫館や温室', '特別なイベント'],
      funFacts: ['世界最大級のカブトムシ', '力持ちで有名'],
      defaultImage: 'https://example.com/atlas_beetle.jpg',
    },
    {
      id: 'morpho_butterfly',
      name: 'モルフォチョウ',
      scientificName: 'Morpho menelaus',
      category: 'butterfly',
      rarity: 'legendary',
      description: '息をのむほど美しい青い翅を持つ熱帯のチョウ。光の角度で色が変わる。',
      habitat: ['熱帯雨林', '温室'],
      season: ['spring', 'summer', 'autumn', 'winter'],
      size: 'large',
      colors: ['青', '黒', '茶色'],
      characteristics: ['構造色', '美しい青色', '大型'],
      discoveryTips: ['昆虫館', '熱帯植物園'],
      funFacts: ['翅の色は構造色による', '世界で最も美しいチョウの一つ'],
      defaultImage: 'https://example.com/morpho.jpg',
    },

    // 小型昆虫
    {
      id: 'ladybug',
      name: 'ナナホシテントウ',
      scientificName: 'Coccinella septempunctata',
      category: 'beetle',
      rarity: 'common',
      description: '7つの黒い斑点がある赤いテントウムシ。アブラムシを食べる益虫。',
      habitat: ['花畑', '農地', '公園'],
      season: ['spring', 'summer', 'autumn'],
      size: 'tiny',
      colors: ['赤', '黒'],
      characteristics: ['小型', '益虫', 'アブラムシを食べる'],
      discoveryTips: ['アブラムシがいる植物', '花の上'],
      funFacts: ['一日に100匹のアブラムシを食べる', '集団で越冬する'],
      defaultImage: 'https://example.com/ladybug.jpg',
    },

    // 追加の一般種
    {
      id: 'praying_mantis',
      name: 'オオカマキリ',
      scientificName: 'Tenodera aridifolia',
      category: 'other',
      rarity: 'uncommon',
      description: '大型のカマキリで、前脚が鎌状に発達している肉食昆虫。',
      habitat: ['草原', '庭', '公園'],
      season: ['summer', 'autumn'],
      size: 'large',
      colors: ['緑', '茶色'],
      characteristics: ['肉食', '待ち伏せ型', '首が回る'],
      discoveryTips: ['草むらや低木', '花壇の周り'],
      funFacts: ['360度首を回せる', '交尾後にメスがオスを食べることがある'],
      defaultImage: 'https://example.com/mantis.jpg',
    },
  ];

  // ============ 初期化 ============

  async initializeCollection(): Promise<void> {
    try {
      // 種データベースが空の場合は初期データを保存
      const speciesJson = await AsyncStorage.getItem(this.SPECIES_KEY);
      if (!speciesJson) {
        await AsyncStorage.setItem(this.SPECIES_KEY, JSON.stringify(this.INSECT_SPECIES));
        console.log('昆虫種データベースを初期化しました');
      }
    } catch (error) {
      console.error('コレクション初期化エラー:', error);
    }
  }

  // ============ 種データ管理 ============

  async getAllSpecies(): Promise<InsectSpecies[]> {
    try {
      const speciesJson = await AsyncStorage.getItem(this.SPECIES_KEY);
      return speciesJson ? JSON.parse(speciesJson) : this.INSECT_SPECIES;
    } catch (error) {
      console.error('種データ取得エラー:', error);
      return this.INSECT_SPECIES;
    }
  }

  async getSpeciesById(speciesId: string): Promise<InsectSpecies | null> {
    try {
      const allSpecies = await this.getAllSpecies();
      return allSpecies.find(species => species.id === speciesId) || null;
    } catch (error) {
      console.error('種データ取得エラー:', error);
      return null;
    }
  }

  async getSpeciesByCategory(category: InsectSpecies['category']): Promise<InsectSpecies[]> {
    try {
      const allSpecies = await this.getAllSpecies();
      return allSpecies.filter(species => species.category === category);
    } catch (error) {
      console.error('カテゴリ別種データ取得エラー:', error);
      return [];
    }
  }

  async getSpeciesByRarity(rarity: InsectSpecies['rarity']): Promise<InsectSpecies[]> {
    try {
      const allSpecies = await this.getAllSpecies();
      return allSpecies.filter(species => species.rarity === rarity);
    } catch (error) {
      console.error('レア度別種データ取得エラー:', error);
      return [];
    }
  }

  // ============ 発見記録管理 ============

  async recordDiscovery(postId: string): Promise<{ success: boolean; discovery?: UserDiscovery; error?: string }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'ログインが必要です' };
      }

      // 投稿データから種を特定
      const posts = await unifiedPostService.getPosts();
      const post = posts.find(p => p.id === postId);
      if (!post) {
        return { success: false, error: '投稿が見つかりません' };
      }

      // 昆虫名から種IDを推定（実際の実装では画像認識APIを使用）
      const species = await this.identifySpeciesFromPost(post);
      if (!species) {
        return { success: false, error: '昆虫種を特定できませんでした' };
      }

      // 既存の発見記録をチェック
      const existingDiscoveries = await this.getUserDiscoveries(currentUser.id);
      const isFirstDiscovery = !existingDiscoveries.some(d => d.speciesId === species.id);

      const discovery: UserDiscovery = {
        id: `discovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: currentUser.id,
        speciesId: species.id,
        postId,
        imageUrl: post.images[0],
        location: post.location,
        discoveredAt: new Date().toISOString(),
        isFirstDiscovery,
        notes: post.description,
      };

      // 発見記録を保存
      await this.saveDiscovery(discovery);

      return { success: true, discovery };
    } catch (error) {
      console.error('発見記録エラー:', error);
      return { success: false, error: '発見記録の保存に失敗しました' };
    }
  }

  private async identifySpeciesFromPost(post: any): Promise<InsectSpecies | null> {
    // 簡易的な識別ロジック（実際の実装では機械学習APIを使用）
    const allSpecies = await this.getAllSpecies();
    const postName = post.name.toLowerCase();
    
    // 名前での完全一致
    let species = allSpecies.find(s => 
      s.name.toLowerCase().includes(postName) || 
      postName.includes(s.name.toLowerCase())
    );

    if (!species) {
      // 学名での一致
      species = allSpecies.find(s => 
        s.scientificName.toLowerCase().includes(postName) ||
        postName.includes(s.scientificName.toLowerCase())
      );
    }

    if (!species) {
      // 部分的なキーワードマッチ
      if (postName.includes('カブト') || postName.includes('kabuto')) {
        species = allSpecies.find(s => s.id === 'kabuto_beetle');
      } else if (postName.includes('クワガタ') || postName.includes('kuwagata')) {
        species = allSpecies.find(s => s.id === 'kuwagata_beetle');
      } else if (postName.includes('アゲハ') || postName.includes('swallowtail')) {
        species = allSpecies.find(s => s.id === 'swallowtail');
      } else if (postName.includes('トンボ') || postName.includes('dragonfly')) {
        species = allSpecies.find(s => s.id === 'red_dragonfly');
      } else if (postName.includes('セミ') || postName.includes('cicada')) {
        species = allSpecies.find(s => s.id === 'cicada_minmin');
      } else if (postName.includes('バッタ') || postName.includes('grasshopper')) {
        species = allSpecies.find(s => s.id === 'grasshopper');
      } else if (postName.includes('テントウ') || postName.includes('ladybug')) {
        species = allSpecies.find(s => s.id === 'ladybug');
      } else if (postName.includes('カマキリ') || postName.includes('mantis')) {
        species = allSpecies.find(s => s.id === 'praying_mantis');
      }
    }

    return species || null;
  }

  private async saveDiscovery(discovery: UserDiscovery): Promise<void> {
    try {
      const discoveriesJson = await AsyncStorage.getItem(this.DISCOVERIES_KEY);
      const discoveries: UserDiscovery[] = discoveriesJson ? JSON.parse(discoveriesJson) : [];
      
      discoveries.unshift(discovery); // 新しい発見を先頭に追加
      
      // 最新1000件のみ保持
      const limitedDiscoveries = discoveries.slice(0, 1000);
      
      await AsyncStorage.setItem(this.DISCOVERIES_KEY, JSON.stringify(limitedDiscoveries));
    } catch (error) {
      console.error('発見記録保存エラー:', error);
    }
  }

  async getUserDiscoveries(userId?: string): Promise<UserDiscovery[]> {
    try {
      const currentUser = userId ? { id: userId } : await authService.getCurrentUser();
      if (!currentUser) return [];

      const discoveriesJson = await AsyncStorage.getItem(this.DISCOVERIES_KEY);
      const discoveries: UserDiscovery[] = discoveriesJson ? JSON.parse(discoveriesJson) : [];
      
      return discoveries.filter(discovery => discovery.userId === currentUser.id);
    } catch (error) {
      console.error('ユーザー発見記録取得エラー:', error);
      return [];
    }
  }

  // ============ 統計情報 ============

  async getCollectionStats(userId?: string): Promise<CollectionStats> {
    try {
      const currentUser = userId ? { id: userId } : await authService.getCurrentUser();
      if (!currentUser) {
        return this.getEmptyStats();
      }

      const [allSpecies, userDiscoveries] = await Promise.all([
        this.getAllSpecies(),
        this.getUserDiscoveries(currentUser.id),
      ]);

      // 発見済み種のユニークセット
      const discoveredSpeciesIds = new Set(userDiscoveries.map(d => d.speciesId));
      const discoveredSpecies = allSpecies.filter(s => discoveredSpeciesIds.has(s.id));

      // レア度別カウント
      const rarityCount = {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
      };

      discoveredSpecies.forEach(species => {
        rarityCount[species.rarity]++;
      });

      // カテゴリ別完成度
      const categories = [...new Set(allSpecies.map(s => s.category))];
      const categoriesCompleted = categories.filter(category => {
        const categorySpecies = allSpecies.filter(s => s.category === category);
        const discoveredInCategory = discoveredSpecies.filter(s => s.category === category);
        return discoveredInCategory.length === categorySpecies.length;
      });

      // 最近の発見（最新5件）
      const recentDiscoveries = userDiscoveries.slice(0, 5);

      return {
        totalSpecies: allSpecies.length,
        discoveredSpecies: discoveredSpecies.length,
        completionPercentage: Math.round((discoveredSpecies.length / allSpecies.length) * 100),
        commonDiscovered: rarityCount.common,
        uncommonDiscovered: rarityCount.uncommon,
        rareDiscovered: rarityCount.rare,
        epicDiscovered: rarityCount.epic,
        legendaryDiscovered: rarityCount.legendary,
        categoriesCompleted,
        recentDiscoveries,
      };
    } catch (error) {
      console.error('コレクション統計取得エラー:', error);
      return this.getEmptyStats();
    }
  }

  private getEmptyStats(): CollectionStats {
    return {
      totalSpecies: 0,
      discoveredSpecies: 0,
      completionPercentage: 0,
      commonDiscovered: 0,
      uncommonDiscovered: 0,
      rareDiscovered: 0,
      epicDiscovered: 0,
      legendaryDiscovered: 0,
      categoriesCompleted: [],
      recentDiscoveries: [],
    };
  }

  // ============ 検索・フィルタ ============

  async searchSpecies(query: string): Promise<InsectSpecies[]> {
    try {
      const allSpecies = await this.getAllSpecies();
      const lowerQuery = query.toLowerCase();
      
      return allSpecies.filter(species => 
        species.name.toLowerCase().includes(lowerQuery) ||
        species.scientificName.toLowerCase().includes(lowerQuery) ||
        species.description.toLowerCase().includes(lowerQuery) ||
        species.characteristics.some(char => char.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('種検索エラー:', error);
      return [];
    }
  }

  async getDiscoveredSpecies(userId?: string): Promise<InsectSpecies[]> {
    try {
      const userDiscoveries = await this.getUserDiscoveries(userId);
      const discoveredSpeciesIds = new Set(userDiscoveries.map(d => d.speciesId));
      const allSpecies = await this.getAllSpecies();
      
      return allSpecies.filter(species => discoveredSpeciesIds.has(species.id));
    } catch (error) {
      console.error('発見済み種取得エラー:', error);
      return [];
    }
  }

  async getUndiscoveredSpecies(userId?: string): Promise<InsectSpecies[]> {
    try {
      const userDiscoveries = await this.getUserDiscoveries(userId);
      const discoveredSpeciesIds = new Set(userDiscoveries.map(d => d.speciesId));
      const allSpecies = await this.getAllSpecies();
      
      return allSpecies.filter(species => !discoveredSpeciesIds.has(species.id));
    } catch (error) {
      console.error('未発見種取得エラー:', error);
      return [];
    }
  }

  // ============ ユーティリティ ============

  getRarityColor(rarity: InsectSpecies['rarity']): string {
    switch (rarity) {
      case 'common': return '#4CAF50';
      case 'uncommon': return '#2196F3';
      case 'rare': return '#9C27B0';
      case 'epic': return '#FF9800';
      case 'legendary': return '#F44336';
      default: return '#666';
    }
  }

  getRarityLabel(rarity: InsectSpecies['rarity']): string {
    switch (rarity) {
      case 'common': return 'コモン';
      case 'uncommon': return 'アンコモン';
      case 'rare': return 'レア';
      case 'epic': return 'エピック';
      case 'legendary': return 'レジェンダリー';
      default: return '不明';
    }
  }

  getCategoryLabel(category: InsectSpecies['category']): string {
    switch (category) {
      case 'beetle': return 'コウチュウ目';
      case 'butterfly': return 'チョウ目（チョウ）';
      case 'moth': return 'チョウ目（ガ）';
      case 'ant': return 'ハチ目（アリ）';
      case 'bee': return 'ハチ目（ハチ）';
      case 'wasp': return 'ハチ目（スズメバチ）';
      case 'fly': return 'ハエ目';
      case 'dragonfly': return 'トンボ目';
      case 'grasshopper': return 'バッタ目';
      case 'cricket': return 'バッタ目（コオロギ）';
      case 'cicada': return 'カメムシ目（セミ）';
      case 'bug': return 'カメムシ目';
      case 'other': return 'その他';
      default: return '分類不明';
    }
  }

  getSizeLabel(size: InsectSpecies['size']): string {
    switch (size) {
      case 'tiny': return '極小（5mm未満）';
      case 'small': return '小型（5-15mm）';
      case 'medium': return '中型（15-40mm）';
      case 'large': return '大型（40-80mm）';
      case 'huge': return '巨大（80mm以上）';
      default: return 'サイズ不明';
    }
  }
}

export const collectionService = new CollectionService();