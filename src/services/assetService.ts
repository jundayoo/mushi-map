// 商用レベルアセット管理サービス
export class AssetService {
  // 🎨 プレミアムイラスト・画像URL
  static illustrations = {
    // ヒーロー画像
    hero: {
      nature: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
      insects: 'https://images.unsplash.com/photo-1504006833117-8886a355efbf?w=800&q=80',
      ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    },
    
    // 昆虫イラスト（商用ライセンス）
    insects: {
      butterfly: 'https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?w=400&q=80',
      beetle: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80',
      dragonfly: 'https://images.unsplash.com/photo-1516646085441-e1719f13aa3e?w=400&q=80',
      spider: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
      ant: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5d?w=400&q=80',
      bee: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
      moth: 'https://images.unsplash.com/photo-1520637836862-4d197d17c3a4?w=400&q=80',
      ladybug: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&q=80',
    },
    
    // 機能説明イラスト
    features: {
      camera: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&q=80',
      ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80',
      community: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80',
      map: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&q=80',
      live: 'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=400&q=80',
      education: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80',
    },
    
    // 背景パターン
    patterns: {
      nature: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80',
      leaves: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&q=80',
      forest: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80',
    },
    
    // アバター（デフォルトユーザー画像）
    avatars: {
      default1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      default2: 'https://images.unsplash.com/photo-1494790108755-2616b612b977?w=200&q=80',
      default3: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&q=80',
      default4: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&q=80',
    },
  };
  
  // 🎯 アイコンセット（MaterialIcons拡張）
  static icons = {
    // 昆虫カテゴリー
    insects: {
      butterfly: 'flutter_dash',
      beetle: 'bug_report',
      spider: 'pest_control',
      bee: 'eco',
      ant: 'scatter_plot',
      dragonfly: 'flight',
      moth: 'nightlight',
      grasshopper: 'grass',
    },
    
    // 機能アイコン
    features: {
      camera: 'camera_alt',
      ai: 'auto_awesome',
      community: 'groups',
      map: 'map',
      live: 'videocam',
      chat: 'chat',
      upload: 'cloud_upload',
      location: 'location_on',
      favorite: 'favorite',
      share: 'share',
      search: 'search',
      filter: 'filter_list',
    },
    
    // ゲーミフィケーション
    gamification: {
      trophy: 'emoji_events',
      star: 'star',
      badge: 'military_tech',
      level: 'trending_up',
      xp: 'bolt',
      achievement: 'workspace_premium',
      leaderboard: 'leaderboard',
      collection: 'collections',
    },
    
    // UI要素
    ui: {
      home: 'home',
      profile: 'person',
      settings: 'settings',
      notifications: 'notifications',
      menu: 'menu',
      close: 'close',
      back: 'arrow_back',
      forward: 'arrow_forward',
      up: 'keyboard_arrow_up',
      down: 'keyboard_arrow_down',
      edit: 'edit',
      delete: 'delete',
      add: 'add',
      check: 'check',
      info: 'info',
      warning: 'warning',
      error: 'error',
    },
  };
  
  // 🎵 サウンドエフェクト（オプション）
  static sounds = {
    // UI効果音
    ui: {
      tap: 'tap.mp3',
      success: 'success.mp3',
      error: 'error.mp3',
      notification: 'notification.mp3',
    },
    
    // ゲーミフィケーション
    gamification: {
      levelUp: 'level-up.mp3',
      achievement: 'achievement.mp3',
      xpGain: 'xp-gain.mp3',
      badgeUnlock: 'badge-unlock.mp3',
    },
    
    // 自然音（BGM）
    ambient: {
      forest: 'forest-ambience.mp3',
      birds: 'bird-sounds.mp3',
      crickets: 'cricket-sounds.mp3',
    },
  };
  
  // 📱 デバイス別アセット管理
  static getOptimizedImage = (url: string, size: 'small' | 'medium' | 'large' | 'xl' = 'medium') => {
    const sizeMap = {
      small: '?w=200&q=80',
      medium: '?w=400&q=80',
      large: '?w=800&q=80',
      xl: '?w=1200&q=80',
    };
    
    return url + sizeMap[size];
  };
  
  // 🎨 プレースホルダー画像生成
  static generatePlaceholder = (width: number, height: number, text?: string) => {
    const baseUrl = 'https://via.placeholder.com';
    const bgColor = '4CAF50';
    const textColor = 'FFFFFF';
    const placeholderText = text ? encodeURIComponent(text) : 'むしマップ';
    
    return `${baseUrl}/${width}x${height}/${bgColor}/${textColor}?text=${placeholderText}`;
  };
  
  // 🌈 グラデーション画像生成
  static generateGradientPlaceholder = (
    width: number, 
    height: number, 
    colors: string[] = ['4CAF50', '66BB6A']
  ) => {
    // CSS Gradientを使用したSVG画像生成
    const svgGradient = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#${colors[0]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#${colors[1]};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad1)" />
      </svg>
    `;
    
    return 'data:image/svg+xml;base64,' + btoa(svgGradient);
  };
  
  // 🏆 バッジ画像生成
  static generateBadgeImage = (
    icon: string, 
    color: string = '4CAF50',
    size: number = 64
  ) => {
    return this.generatePlaceholder(size, size, icon);
  };
  
  // 📊 チャート・グラフ用カラーパレット
  static chartColors = [
    '#4CAF50', // プライマリーグリーン
    '#FFC107', // セカンダリーイエロー
    '#2196F3', // テックブルー
    '#FF9800', // オレンジ
    '#9C27B0', // パープル
    '#00BCD4', // シアン
    '#795548', // ブラウン
    '#607D8B', // ブルーグレー
  ];
  
  // 🎯 ローディング画像
  static loadingImages = {
    spinner: this.generateGradientPlaceholder(100, 100),
    dots: this.generatePlaceholder(200, 50, '読み込み中...'),
    nature: this.illustrations.hero.nature,
  };
  
  // 🚀 パフォーマンス最適化
  static preloadImages = async () => {
    const criticalImages = [
      this.illustrations.hero.nature,
      this.illustrations.insects.butterfly,
      this.illustrations.features.camera,
      this.illustrations.features.ai,
    ];
    
    try {
      await Promise.all(
        criticalImages.map(url => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
          });
        })
      );
      console.log('✅ 重要画像のプリロード完了');
    } catch (error) {
      console.warn('⚠️ 画像プリロードエラー:', error);
    }
  };
  
  // 📱 レスポンシブ画像選択
  static getResponsiveImage = (baseUrl: string, screenWidth: number) => {
    if (screenWidth < 400) {
      return this.getOptimizedImage(baseUrl, 'small');
    } else if (screenWidth < 800) {
      return this.getOptimizedImage(baseUrl, 'medium');
    } else if (screenWidth < 1200) {
      return this.getOptimizedImage(baseUrl, 'large');
    } else {
      return this.getOptimizedImage(baseUrl, 'xl');
    }
  };
  
  // 🎨 テーマ別アセット
  static getThemedAssets = (theme: 'light' | 'dark' | 'nature' = 'light') => {
    const themes = {
      light: {
        background: this.illustrations.patterns.nature,
        primary: '#4CAF50',
        secondary: '#FFC107',
      },
      dark: {
        background: this.generateGradientPlaceholder(400, 600, ['2E7D32', '1B5E20']),
        primary: '#66BB6A',
        secondary: '#FFD54F',
      },
      nature: {
        background: this.illustrations.patterns.forest,
        primary: '#4CAF50',
        secondary: '#8BC34A',
      },
    };
    
    return themes[theme];
  };
}

export default AssetService;