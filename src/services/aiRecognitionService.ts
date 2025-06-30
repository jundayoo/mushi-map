import { InsectSpecies, collectionService } from './collectionService';

export interface RecognitionResult {
  speciesId: string;
  species: InsectSpecies;
  confidence: number;
  features: RecognitionFeature[];
  alternativeCandidates: AlternativeCandidate[];
  detectionRegions: DetectionRegion[];
}

export interface RecognitionFeature {
  type: 'color' | 'pattern' | 'shape' | 'size' | 'texture' | 'wing' | 'antenna' | 'leg';
  description: string;
  confidence: number;
  coordinates?: { x: number; y: number; width: number; height: number };
}

export interface AlternativeCandidate {
  speciesId: string;
  species: InsectSpecies;
  confidence: number;
  reason: string;
}

export interface DetectionRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  features: string[];
}

export interface AIAnalysisConfig {
  enableFeatureDetection: boolean;
  minConfidenceThreshold: number;
  maxAlternatives: number;
  detectionSensitivity: 'low' | 'medium' | 'high';
}

class AIRecognitionService {
  private readonly DEFAULT_CONFIG: AIAnalysisConfig = {
    enableFeatureDetection: true,
    minConfidenceThreshold: 0.3,
    maxAlternatives: 3,
    detectionSensitivity: 'medium',
  };

  // ============ メイン画像認識API ============

  async analyzeImage(
    imageUri: string, 
    config: Partial<AIAnalysisConfig> = {}
  ): Promise<{ success: boolean; result?: RecognitionResult; error?: string }> {
    try {
      const analysisConfig = { ...this.DEFAULT_CONFIG, ...config };
      
      console.log('🤖 AI画像認識開始:', imageUri);
      
      // 実際の実装では機械学習APIを呼び出し
      // ここではデモ用の模擬実装
      const mockResult = await this.performMockAnalysis(imageUri, analysisConfig);
      
      if (mockResult.confidence < analysisConfig.minConfidenceThreshold) {
        return {
          success: false,
          error: `信頼度が低すぎます (${Math.round(mockResult.confidence * 100)}% < ${Math.round(analysisConfig.minConfidenceThreshold * 100)}%)`
        };
      }

      return {
        success: true,
        result: mockResult
      };
    } catch (error) {
      console.error('AI画像認識エラー:', error);
      return {
        success: false,
        error: '画像の分析に失敗しました'
      };
    }
  }

  // ============ 模擬AI分析（実装例） ============

  private async performMockAnalysis(
    imageUri: string, 
    config: AIAnalysisConfig
  ): Promise<RecognitionResult> {
    // 実際の実装では、ここで外部AI APIを呼び出し
    // - Google Vision API
    // - Custom ML Model
    // - TensorFlow.js
    // 等を使用

    // シミュレーション用の遅延
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 画像URLから昆虫種を推測（デモ用）
    const allSpecies = await collectionService.getAllSpecies();
    const detectedSpecies = this.detectSpeciesFromImageName(imageUri, allSpecies);
    
    // 特徴検出の模擬実行
    const features = this.generateMockFeatures(detectedSpecies, config);
    
    // 代替候補の生成
    const alternatives = this.generateAlternativeCandidates(detectedSpecies, allSpecies, config.maxAlternatives);
    
    // 検出領域の生成
    const detectionRegions = this.generateDetectionRegions(detectedSpecies, config);

    const confidence = this.calculateConfidence(detectedSpecies, features);

    return {
      speciesId: detectedSpecies.id,
      species: detectedSpecies,
      confidence,
      features,
      alternativeCandidates: alternatives,
      detectionRegions,
    };
  }

  private detectSpeciesFromImageName(imageUri: string, allSpecies: InsectSpecies[]): InsectSpecies {
    const imageName = imageUri.toLowerCase();
    
    // 画像名やパスから昆虫種を推測
    if (imageName.includes('kabuto') || imageName.includes('カブト')) {
      return allSpecies.find(s => s.id === 'kabuto_beetle') || allSpecies[0];
    } else if (imageName.includes('kuwagata') || imageName.includes('クワガタ')) {
      return allSpecies.find(s => s.id === 'kuwagata_beetle') || allSpecies[0];
    } else if (imageName.includes('butterfly') || imageName.includes('monarch') || imageName.includes('チョウ')) {
      return allSpecies.find(s => s.category === 'butterfly') || allSpecies[0];
    } else if (imageName.includes('dragonfly') || imageName.includes('トンボ')) {
      return allSpecies.find(s => s.id === 'red_dragonfly') || allSpecies[0];
    } else if (imageName.includes('cicada') || imageName.includes('セミ')) {
      return allSpecies.find(s => s.id === 'cicada_minmin') || allSpecies[0];
    } else if (imageName.includes('grasshopper') || imageName.includes('バッタ')) {
      return allSpecies.find(s => s.id === 'grasshopper') || allSpecies[0];
    } else if (imageName.includes('ladybug') || imageName.includes('テントウ')) {
      return allSpecies.find(s => s.id === 'ladybug') || allSpecies[0];
    } else if (imageName.includes('mantis') || imageName.includes('カマキリ')) {
      return allSpecies.find(s => s.id === 'praying_mantis') || allSpecies[0];
    }
    
    // ランダムに選択（実際の画像認識では発生しない）
    return allSpecies[Math.floor(Math.random() * allSpecies.length)];
  }

  private generateMockFeatures(species: InsectSpecies, config: AIAnalysisConfig): RecognitionFeature[] {
    const features: RecognitionFeature[] = [];

    if (!config.enableFeatureDetection) return features;

    // 色の特徴
    if (species.colors.length > 0) {
      features.push({
        type: 'color',
        description: `主要色: ${species.colors.join(', ')}`,
        confidence: 0.85 + Math.random() * 0.1,
        coordinates: { x: 100, y: 100, width: 200, height: 150 }
      });
    }

    // 形状の特徴
    features.push({
      type: 'shape',
      description: this.getShapeDescription(species),
      confidence: 0.75 + Math.random() * 0.2,
      coordinates: { x: 50, y: 50, width: 300, height: 250 }
    });

    // サイズの特徴
    features.push({
      type: 'size',
      description: `体長: ${this.getSizeDescription(species.size)}`,
      confidence: 0.70 + Math.random() * 0.15
    });

    // カテゴリ特有の特徴
    features.push(...this.getCategorySpecificFeatures(species));

    return features.sort((a, b) => b.confidence - a.confidence);
  }

  private getShapeDescription(species: InsectSpecies): string {
    switch (species.category) {
      case 'beetle':
        return '硬い外殻と特徴的な体型';
      case 'butterfly':
        return '対称的な翅の形状';
      case 'dragonfly':
        return '細長い体と大きな複眼';
      case 'cicada':
        return '透明な翅と太い体';
      case 'grasshopper':
        return '後脚が発達した跳躍型体型';
      default:
        return '昆虫の典型的な体型';
    }
  }

  private getSizeDescription(size: InsectSpecies['size']): string {
    switch (size) {
      case 'tiny': return '5mm未満';
      case 'small': return '5-15mm';
      case 'medium': return '15-40mm';
      case 'large': return '40-80mm';
      case 'huge': return '80mm以上';
      default: return '不明';
    }
  }

  private getCategorySpecificFeatures(species: InsectSpecies): RecognitionFeature[] {
    const features: RecognitionFeature[] = [];

    switch (species.category) {
      case 'beetle':
        features.push({
          type: 'wing',
          description: '硬い鞘翅（前翅）を検出',
          confidence: 0.8,
          coordinates: { x: 120, y: 80, width: 160, height: 100 }
        });
        if (species.id === 'kabuto_beetle') {
          features.push({
            type: 'pattern',
            description: '頭角の特徴的な形状',
            confidence: 0.9,
            coordinates: { x: 180, y: 50, width: 40, height: 60 }
          });
        }
        break;

      case 'butterfly':
        features.push({
          type: 'wing',
          description: '鱗翅（チョウの翅）の模様',
          confidence: 0.85,
          coordinates: { x: 80, y: 60, width: 240, height: 180 }
        });
        features.push({
          type: 'antenna',
          description: '棍棒状の触角',
          confidence: 0.75,
          coordinates: { x: 190, y: 40, width: 20, height: 40 }
        });
        break;

      case 'dragonfly':
        features.push({
          type: 'wing',
          description: '透明で網状の翅',
          confidence: 0.88,
          coordinates: { x: 60, y: 80, width: 280, height: 120 }
        });
        features.push({
          type: 'pattern',
          description: '大きな複眼',
          confidence: 0.92,
          coordinates: { x: 170, y: 45, width: 60, height: 45 }
        });
        break;

      case 'cicada':
        features.push({
          type: 'wing',
          description: '透明な膜質翅',
          confidence: 0.83,
          coordinates: { x: 90, y: 70, width: 220, height: 140 }
        });
        break;
    }

    return features;
  }

  private generateAlternativeCandidates(
    detectedSpecies: InsectSpecies,
    allSpecies: InsectSpecies[],
    maxAlternatives: number
  ): AlternativeCandidate[] {
    const alternatives: AlternativeCandidate[] = [];
    
    // 同じカテゴリの昆虫を候補に
    const sameCategory = allSpecies.filter(s => 
      s.category === detectedSpecies.category && s.id !== detectedSpecies.id
    );

    for (let i = 0; i < Math.min(maxAlternatives, sameCategory.length); i++) {
      const candidate = sameCategory[i];
      alternatives.push({
        speciesId: candidate.id,
        species: candidate,
        confidence: 0.3 + Math.random() * 0.4, // 低めの信頼度
        reason: `同じ${collectionService.getCategoryLabel(candidate.category)}の仲間`
      });
    }

    // 色が似ている昆虫も候補に
    const similarColors = allSpecies.filter(s => 
      s.id !== detectedSpecies.id &&
      s.colors.some(color => detectedSpecies.colors.includes(color))
    );

    if (alternatives.length < maxAlternatives && similarColors.length > 0) {
      const candidate = similarColors[0];
      alternatives.push({
        speciesId: candidate.id,
        species: candidate,
        confidence: 0.2 + Math.random() * 0.3,
        reason: `似た色合い（${candidate.colors.join(', ')}）`
      });
    }

    return alternatives.sort((a, b) => b.confidence - a.confidence);
  }

  private generateDetectionRegions(species: InsectSpecies, config: AIAnalysisConfig): DetectionRegion[] {
    const regions: DetectionRegion[] = [];

    // メイン検出領域
    regions.push({
      x: 50,
      y: 50,
      width: 300,
      height: 250,
      confidence: 0.9,
      features: ['全体', '体型', '基本構造']
    });

    // 頭部領域
    regions.push({
      x: 150,
      y: 60,
      width: 100,
      height: 80,
      confidence: 0.85,
      features: ['頭部', '複眼', '触角']
    });

    // 翅領域（飛ぶ昆虫の場合）
    if (['butterfly', 'dragonfly', 'cicada', 'beetle'].includes(species.category)) {
      regions.push({
        x: 80,
        y: 90,
        width: 240,
        height: 120,
        confidence: 0.88,
        features: ['翅', '翅脈', '模様']
      });
    }

    // 特殊な特徴領域
    if (species.id === 'kabuto_beetle') {
      regions.push({
        x: 170,
        y: 40,
        width: 60,
        height: 70,
        confidence: 0.92,
        features: ['角', '頭角', '特徴的構造']
      });
    }

    return regions.sort((a, b) => b.confidence - a.confidence);
  }

  private calculateConfidence(species: InsectSpecies, features: RecognitionFeature[]): number {
    if (features.length === 0) return 0.5;

    // 特徴の信頼度の重み付き平均
    const totalWeight = features.reduce((sum, feature) => {
      const weight = this.getFeatureWeight(feature.type);
      return sum + weight;
    }, 0);

    const weightedSum = features.reduce((sum, feature) => {
      const weight = this.getFeatureWeight(feature.type);
      return sum + (feature.confidence * weight);
    }, 0);

    let baseConfidence = weightedSum / totalWeight;

    // レア度による調整（レアな昆虫は信頼度を下げる）
    const rarityPenalty = {
      'common': 0,
      'uncommon': 0.05,
      'rare': 0.1,
      'epic': 0.15,
      'legendary': 0.2
    };

    baseConfidence -= rarityPenalty[species.rarity];

    // 0.1から1.0の範囲に制限
    return Math.max(0.1, Math.min(1.0, baseConfidence));
  }

  private getFeatureWeight(featureType: RecognitionFeature['type']): number {
    const weights = {
      'shape': 1.0,     // 最重要
      'pattern': 0.9,   // 高重要
      'color': 0.8,     // 重要
      'wing': 0.9,      // 高重要
      'size': 0.7,      // 中重要
      'antenna': 0.6,   // 中重要
      'texture': 0.5,   // 低重要
      'leg': 0.4        // 最低重要
    };

    return weights[featureType] || 0.5;
  }

  // ============ ユーティリティメソッド ============

  getConfidenceLevel(confidence: number): { level: string; color: string; description: string } {
    if (confidence >= 0.9) {
      return {
        level: '非常に高い',
        color: '#4CAF50',
        description: 'ほぼ確実にこの昆虫です'
      };
    } else if (confidence >= 0.7) {
      return {
        level: '高い',
        color: '#8BC34A',
        description: 'この昆虫の可能性が高いです'
      };
    } else if (confidence >= 0.5) {
      return {
        level: '中程度',
        color: '#FF9800',
        description: 'この昆虫かもしれません'
      };
    } else if (confidence >= 0.3) {
      return {
        level: '低い',
        color: '#FF5722',
        description: '判定が困難です'
      };
    } else {
      return {
        level: '不明',
        color: '#9E9E9E',
        description: '識別できませんでした'
      };
    }
  }

  formatConfidencePercentage(confidence: number): string {
    return `${Math.round(confidence * 100)}%`;
  }

  // ============ バッチ処理 ============

  async analyzeMultipleImages(
    imageUris: string[],
    config: Partial<AIAnalysisConfig> = {}
  ): Promise<RecognitionResult[]> {
    const results: RecognitionResult[] = [];

    for (const imageUri of imageUris) {
      try {
        const result = await this.analyzeImage(imageUri, config);
        if (result.success && result.result) {
          results.push(result.result);
        }
      } catch (error) {
        console.warn('バッチ処理中のエラー:', imageUri, error);
      }
    }

    return results;
  }

  // ============ 学習データ収集 ============

  async submitUserCorrection(
    imageUri: string,
    predictedSpeciesId: string,
    actualSpeciesId: string,
    confidence: number
  ): Promise<void> {
    try {
      // 実際の実装では、ユーザーの修正データを収集してモデルの改善に活用
      const correctionData = {
        timestamp: new Date().toISOString(),
        imageUri,
        predicted: predictedSpeciesId,
        actual: actualSpeciesId,
        originalConfidence: confidence,
        userFeedback: true
      };

      console.log('ユーザー修正データを記録:', correctionData);
      
      // 将来的にはサーバーに送信してモデルの再学習に使用
    } catch (error) {
      console.error('ユーザー修正データ送信エラー:', error);
    }
  }
}

export const aiRecognitionService = new AIRecognitionService();