// 商用レベルデザインシステム
export const CommercialDesign = {
  // 🎨 プレミアムカラーパレット
  colors: {
    // メインブランドカラー（自然系グラデーション）
    primary: {
      50: '#E8F7F0',
      100: '#C2E8D4',
      200: '#9DD8B8',
      300: '#77C89C',
      400: '#51B880',
      500: '#4CAF50', // メインカラー
      600: '#3D8B40',
      700: '#2E6730',
      800: '#1E4320',
      900: '#0F1F10',
    },
    
    // セカンダリカラー（昆虫の輝き）
    secondary: {
      50: '#FFF8E1',
      100: '#FFECB3',
      200: '#FFE082',
      300: '#FFD54F',
      400: '#FFCA28',
      500: '#FFC107', // アクセントカラー
      600: '#FFB300',
      700: '#FFA000',
      800: '#FF8F00',
      900: '#FF6F00',
    },
    
    // AI・テクノロジーカラー
    tech: {
      50: '#E3F2FD',
      100: '#BBDEFB',
      200: '#90CAF9',
      300: '#64B5F6',
      400: '#42A5F5',
      500: '#2196F3',
      600: '#1E88E5',
      700: '#1976D2',
      800: '#1565C0',
      900: '#0D47A1',
    },
    
    // グレースケール（高品質）
    gray: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    
    // 状態カラー
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    
    // 背景色
    background: {
      primary: '#FFFFFF',
      secondary: '#F8F9FA',
      tertiary: '#F0F7FF',
    },
    
    // テキストカラー
    text: {
      primary: '#212121',
      secondary: '#757575',
      tertiary: '#9E9E9E',
      inverse: '#FFFFFF',
    },
  },
  
  // 🎭 高級グラデーション
  gradients: {
    // ヒーローセクション用
    hero: ['#4CAF50', '#66BB6A', '#81C784'],
    heroAngle: '135deg',
    
    // カード背景用
    card: ['#FFFFFF', '#F8F9FA'],
    cardSubtle: ['#F0F7FF', '#FFFFFF'],
    
    // ボタン用
    primaryButton: ['#4CAF50', '#66BB6A'],
    secondaryButton: ['#FFC107', '#FFD54F'],
    techButton: ['#2196F3', '#42A5F5'],
    
    // AI機能用
    ai: ['#E3F2FD', '#BBDEFB', '#90CAF9'],
    
    // 昆虫テーマ
    nature: ['#4CAF50', '#8BC34A', '#CDDC39'],
    sunset: ['#FF9800', '#FFC107', '#FFEB3B'],
    
    // プレミアム背景
    premium: ['#4CAF50', '#2E7D32', '#1B5E20'],
  },
  
  // 📏 スペーシング（8ポイントグリッド）
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
    xxxl: 48,
    xxxxl: 64,
  },
  
  // 🔤 タイポグラフィ（商用レベル）
  typography: {
    fonts: {
      primary: 'System', // iOS: San Francisco, Android: Roboto
      heading: 'System', // プラットフォームネイティブ
      body: 'System',
      mono: 'Courier New',
    },
    
    sizes: {
      hero: 32,
      h1: 28,
      h2: 24,
      h3: 20,
      h4: 18,
      h5: 16,
      h6: 14,
      body: 16,
      bodySmall: 14,
      caption: 12,
      micro: 10,
    },
    
    weights: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '800',
    },
    
    lineHeights: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
      loose: 1.8,
    },
  },
  
  // 🎪 アニメーション（プレミアム）
  animations: {
    // デュレーション
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
      slower: 800,
    },
    
    // イージング
    easing: {
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    
    // スケールアニメーション
    scale: {
      small: 0.95,
      normal: 1.0,
      large: 1.05,
      extraLarge: 1.1,
    },
  },
  
  // 🎯 ボーダーと影（商用品質）
  borders: {
    radius: {
      none: 0,
      small: 4,
      medium: 8,
      large: 12,
      xl: 16,
      xxl: 20,
      round: 50,
      circle: 999,
    },
    
    width: {
      thin: 1,
      medium: 2,
      thick: 3,
    },
  },
  
  shadows: {
    // カード用影
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    
    // ボタン用影
    button: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 5,
    },
    
    // フローティング要素
    floating: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    
    // ヒーロー要素
    hero: {
      shadowColor: '#4CAF50',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
  },
  
  // 📱 レスポンシブブレークポイント
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
    wide: 1440,
  },
  
  // 🎨 コンポーネント固有スタイル
  components: {
    // ヒーローセクション
    hero: {
      minHeight: 300,
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    
    // カード
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      marginVertical: 8,
      marginHorizontal: 16,
    },
    
    // ボタン
    button: {
      height: 48,
      borderRadius: 24,
      paddingHorizontal: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    // 入力フィールド
    input: {
      height: 48,
      borderRadius: 8,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
  },
  
  // 🌟 特殊効果
  effects: {
    // グラスモーフィズム
    glass: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    
    // ネオモーフィズム
    neomorphic: {
      backgroundColor: '#F0F0F3',
      shadowColor: '#FFFFFF',
      shadowOffset: { width: -5, height: -5 },
      shadowOpacity: 1,
      shadowRadius: 10,
    },
  },
};

export default CommercialDesign;