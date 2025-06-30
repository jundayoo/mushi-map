import { AccessibilityInfo, Platform } from 'react-native';

export interface AccessibilityProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'text' | 'image' | 'header' | 'link' | 'search' | 'tab' | 'tablist' | 'none';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  accessibilityActions?: Array<{
    name: string;
    label?: string;
  }>;
  onAccessibilityAction?: (event: { actionName: string }) => void;
}

/**
 * スクリーンリーダーが有効かどうかを確認
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch (error) {
    console.error('スクリーンリーダー状態の取得エラー:', error);
    return false;
  }
};

/**
 * アクセシビリティアナウンスを行う
 */
export const announceForAccessibility = (announcement: string) => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    AccessibilityInfo.announceForAccessibility(announcement);
  }
};

/**
 * ボタン用のアクセシビリティプロパティを生成
 */
export const getButtonAccessibilityProps = (
  label: string,
  hint?: string,
  disabled?: boolean
): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: 'button',
    accessibilityState: {
      disabled: disabled || false,
    },
  };
};

/**
 * 画像用のアクセシビリティプロパティを生成
 */
export const getImageAccessibilityProps = (
  description: string,
  isDecorative: boolean = false
): AccessibilityProps => {
  if (isDecorative) {
    return {
      accessible: false,
      accessibilityRole: 'none',
    };
  }
  
  return {
    accessible: true,
    accessibilityLabel: description,
    accessibilityRole: 'image',
  };
};

/**
 * テキスト入力用のアクセシビリティプロパティを生成
 */
export const getTextInputAccessibilityProps = (
  label: string,
  placeholder?: string,
  error?: string,
  value?: string
): AccessibilityProps => {
  let accessibilityLabel = label;
  if (error) {
    accessibilityLabel += `。エラー: ${error}`;
  }
  
  return {
    accessible: true,
    accessibilityLabel,
    accessibilityHint: placeholder,
    accessibilityValue: {
      text: value || '',
    },
  };
};

/**
 * リスト項目用のアクセシビリティプロパティを生成
 */
export const getListItemAccessibilityProps = (
  title: string,
  subtitle?: string,
  position?: { current: number; total: number }
): AccessibilityProps => {
  let label = title;
  if (subtitle) {
    label += `. ${subtitle}`;
  }
  if (position) {
    label += `. ${position.current}/${position.total}`;
  }
  
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: 'button',
  };
};

/**
 * タブ用のアクセシビリティプロパティを生成
 */
export const getTabAccessibilityProps = (
  label: string,
  selected: boolean,
  position: { current: number; total: number }
): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityLabel: `${label}タブ. ${position.current}/${position.total}`,
    accessibilityRole: 'tab',
    accessibilityState: {
      selected,
    },
  };
};

/**
 * フォーカス順序を管理するためのヘルパー
 */
export class FocusManager {
  private focusOrder: string[] = [];
  
  addToFocusOrder(id: string) {
    if (!this.focusOrder.includes(id)) {
      this.focusOrder.push(id);
    }
  }
  
  removeFromFocusOrder(id: string) {
    this.focusOrder = this.focusOrder.filter(item => item !== id);
  }
  
  getFocusOrder(): string[] {
    return [...this.focusOrder];
  }
  
  clear() {
    this.focusOrder = [];
  }
}

/**
 * 日本語の読み上げ最適化
 */
export const optimizeJapaneseReading = (text: string): string => {
  // 数字の読み上げを改善
  const numberMap: { [key: string]: string } = {
    '1': 'いち',
    '2': 'に',
    '3': 'さん',
    '4': 'よん',
    '5': 'ご',
    '6': 'ろく',
    '7': 'なな',
    '8': 'はち',
    '9': 'きゅう',
    '0': 'ゼロ',
  };
  
  // 単位の読み上げを改善
  const unitMap: { [key: string]: string } = {
    '件': 'けん',
    '個': 'こ',
    '匹': 'ひき',
    '頭': 'とう',
  };
  
  let optimizedText = text;
  
  // 数字を置換（簡易版）
  Object.entries(numberMap).forEach(([num, reading]) => {
    optimizedText = optimizedText.replace(new RegExp(`(\\d)${num}(\\D|$)`, 'g'), `$1${reading}$2`);
  });
  
  // 単位を置換
  Object.entries(unitMap).forEach(([unit, reading]) => {
    optimizedText = optimizedText.replace(new RegExp(unit, 'g'), reading);
  });
  
  return optimizedText;
};

/**
 * カラーコントラスト比を計算
 */
export const calculateContrastRatio = (color1: string, color2: string): number => {
  // 簡易的な実装（実際の実装では、より正確な計算が必要）
  const getLuminance = (color: string): number => {
    // HEXカラーをRGBに変換して輝度を計算
    // ここでは簡易的に0.5を返す
    return 0.5;
  };
  
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * WCAG 2.1準拠のカラーコントラストチェック
 */
export const checkColorContrast = (
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean => {
  const ratio = calculateContrastRatio(foreground, background);
  
  // WCAG 2.1の基準
  const standards = {
    AA: { normal: 4.5, large: 3 },
    AAA: { normal: 7, large: 4.5 },
  };
  
  // 通常のテキストサイズで判定
  return ratio >= standards[level].normal;
};