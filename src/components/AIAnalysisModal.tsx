import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  aiRecognitionService, 
  RecognitionResult, 
  RecognitionFeature,
  AlternativeCandidate 
} from '../services/aiRecognitionService';
import { collectionService } from '../services/collectionService';

interface AIAnalysisModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onSpeciesConfirmed: (speciesId: string, confidence: number) => void;
  onAnalysisComplete?: (result: RecognitionResult) => void;
}

const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
  visible,
  imageUri,
  onClose,
  onSpeciesConfirmed,
  onAnalysisComplete,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('');
  const [showFeatures, setShowFeatures] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && imageUri) {
      startAnalysis();
      // アニメーション開始
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // リセット
      setResult(null);
      setSelectedSpeciesId('');
      setAnalyzing(false);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      progressAnim.setValue(0);
    }
  }, [visible, imageUri]);

  const startAnalysis = async () => {
    try {
      setAnalyzing(true);
      
      // プログレスアニメーション
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }).start();

      const analysisResult = await aiRecognitionService.analyzeImage(imageUri, {
        enableFeatureDetection: true,
        minConfidenceThreshold: 0.1, // モーダルでは低い閾値で表示
        maxAlternatives: 3,
        detectionSensitivity: 'high',
      });

      if (analysisResult.success && analysisResult.result) {
        setResult(analysisResult.result);
        setSelectedSpeciesId(analysisResult.result.speciesId);
        onAnalysisComplete?.(analysisResult.result);
      } else {
        Alert.alert(
          'AI分析失敗',
          analysisResult.error || '昆虫の識別ができませんでした。手動で種類を選択してください。',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('AI分析エラー:', error);
      Alert.alert('エラー', 'AI分析中にエラーが発生しました');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSpeciesSelect = (speciesId: string) => {
    setSelectedSpeciesId(speciesId);
  };

  const handleConfirm = () => {
    if (!selectedSpeciesId || !result) return;

    const confidence = selectedSpeciesId === result.speciesId 
      ? result.confidence 
      : result.alternativeCandidates.find(alt => alt.speciesId === selectedSpeciesId)?.confidence || 0.5;

    // ユーザーが修正した場合はフィードバックを送信
    if (selectedSpeciesId !== result.speciesId) {
      aiRecognitionService.submitUserCorrection(
        imageUri,
        result.speciesId,
        selectedSpeciesId,
        result.confidence
      );
    }

    onSpeciesConfirmed(selectedSpeciesId, confidence);
    onClose();
  };

  const renderAnalysisProgress = () => (
    <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#E3F2FD', '#BBDEFB']}
        style={styles.progressGradient}
      >
        <MaterialIcons name="auto-awesome" size={48} color="#2196F3" />
        <Text style={styles.progressTitle}>🤖 AI分析中...</Text>
        <Text style={styles.progressSubtitle}>昆虫を識別しています</Text>
        
        {/* プログレスバー */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={['#2196F3', '#1976D2']}
              style={styles.progressFillGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>

        <View style={styles.progressSteps}>
          <Text style={styles.progressStep}>🔍 画像解析</Text>
          <Text style={styles.progressStep}>🧠 特徴抽出</Text>
          <Text style={styles.progressStep}>📊 種類判定</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderConfidenceIndicator = (confidence: number) => {
    const confidenceInfo = aiRecognitionService.getConfidenceLevel(confidence);
    
    return (
      <View style={styles.confidenceContainer}>
        <View style={styles.confidenceBar}>
          <View 
            style={[
              styles.confidenceFill, 
              { 
                width: `${confidence * 100}%`,
                backgroundColor: confidenceInfo.color 
              }
            ]} 
          />
        </View>
        <View style={styles.confidenceInfo}>
          <Text style={[styles.confidenceLevel, { color: confidenceInfo.color }]}>
            信頼度: {confidenceInfo.level}
          </Text>
          <Text style={styles.confidencePercentage}>
            {aiRecognitionService.formatConfidencePercentage(confidence)}
          </Text>
        </View>
        <Text style={styles.confidenceDescription}>
          {confidenceInfo.description}
        </Text>
      </View>
    );
  };

  const renderFeatureDetection = (features: RecognitionFeature[]) => (
    <View style={styles.featuresSection}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setShowFeatures(!showFeatures)}
      >
        <MaterialIcons name="visibility" size={20} color="#4CAF50" />
        <Text style={styles.sectionTitle}>検出された特徴 ({features.length})</Text>
        <MaterialIcons 
          name={showFeatures ? "expand-less" : "expand-more"} 
          size={24} 
          color="#4CAF50" 
        />
      </TouchableOpacity>

      {showFeatures && (
        <ScrollView style={styles.featuresList} nestedScrollEnabled>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureHeader}>
                <MaterialIcons 
                  name={getFeatureIcon(feature.type)} 
                  size={16} 
                  color="#666" 
                />
                <Text style={styles.featureType}>
                  {getFeatureTypeLabel(feature.type)}
                </Text>
                <Text style={styles.featureConfidence}>
                  {Math.round(feature.confidence * 100)}%
                </Text>
              </View>
              <Text style={styles.featureDescription}>
                {feature.description}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderAlternativeCandidates = (alternatives: AlternativeCandidate[]) => (
    <View style={styles.alternativesSection}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setShowAlternatives(!showAlternatives)}
      >
        <MaterialIcons name="compare" size={20} color="#FF9800" />
        <Text style={styles.sectionTitle}>他の候補 ({alternatives.length})</Text>
        <MaterialIcons 
          name={showAlternatives ? "expand-less" : "expand-more"} 
          size={24} 
          color="#FF9800" 
        />
      </TouchableOpacity>

      {showAlternatives && (
        <ScrollView style={styles.alternativesList} nestedScrollEnabled>
          {alternatives.map((candidate, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.alternativeItem,
                selectedSpeciesId === candidate.speciesId && styles.selectedAlternative
              ]}
              onPress={() => handleSpeciesSelect(candidate.speciesId)}
            >
              <View style={styles.alternativeHeader}>
                <Text style={styles.alternativeName}>
                  {candidate.species.name}
                </Text>
                <Text style={styles.alternativeConfidence}>
                  {Math.round(candidate.confidence * 100)}%
                </Text>
              </View>
              <Text style={styles.alternativeReason}>
                {candidate.reason}
              </Text>
              <Text style={styles.alternativeScientific}>
                {candidate.species.scientificName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderAnalysisResult = () => {
    if (!result) return null;

    return (
      <Animated.View 
        style={[
          styles.resultContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <ScrollView style={styles.resultContent} showsVerticalScrollIndicator={false}>
          {/* メイン結果 */}
          <TouchableOpacity
            style={[
              styles.mainResult,
              selectedSpeciesId === result.speciesId && styles.selectedResult
            ]}
            onPress={() => handleSpeciesSelect(result.speciesId)}
          >
            <LinearGradient
              colors={['#E8F5E8', '#F0F8F0']}
              style={styles.mainResultGradient}
            >
              <View style={styles.resultHeader}>
                <View style={styles.resultTitleContainer}>
                  <Text style={styles.resultSpecies}>{result.species.name}</Text>
                  <Text style={styles.resultScientific}>
                    {result.species.scientificName}
                  </Text>
                </View>
                {selectedSpeciesId === result.speciesId && (
                  <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                )}
              </View>

              {renderConfidenceIndicator(result.confidence)}

              <View style={styles.speciesInfo}>
                <View style={styles.speciesTag}>
                  <MaterialIcons name="category" size={16} color="#666" />
                  <Text style={styles.speciesTagText}>
                    {collectionService.getCategoryLabel(result.species.category)}
                  </Text>
                </View>
                <View style={[
                  styles.rarityTag, 
                  { backgroundColor: collectionService.getRarityColor(result.species.rarity) }
                ]}>
                  <Text style={styles.rarityTagText}>
                    {collectionService.getRarityLabel(result.species.rarity)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* 特徴検出結果 */}
          {result.features.length > 0 && renderFeatureDetection(result.features)}

          {/* 代替候補 */}
          {result.alternativeCandidates.length > 0 && renderAlternativeCandidates(result.alternativeCandidates)}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </Animated.View>
    );
  };

  const getFeatureIcon = (type: RecognitionFeature['type']): string => {
    const icons = {
      'color': 'palette',
      'pattern': 'texture',
      'shape': 'crop-free',
      'size': 'straighten',
      'texture': 'grain',
      'wing': 'flight',
      'antenna': 'sensors',
      'leg': 'directions-walk',
    };
    return icons[type] || 'help-outline';
  };

  const getFeatureTypeLabel = (type: RecognitionFeature['type']): string => {
    const labels = {
      'color': '色彩',
      'pattern': '模様',
      'shape': '形状',
      'size': 'サイズ',
      'texture': '質感',
      'wing': '翅',
      'antenna': '触角',
      'leg': '脚',
    };
    return labels[type] || type;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* ヘッダー */}
          <LinearGradient
            colors={['#2196F3', '#1976D2']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>🤖 AI昆虫識別</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            {/* 画像プレビュー */}
            {imageUri && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              </View>
            )}
          </LinearGradient>

          {/* コンテンツ */}
          <View style={styles.content}>
            {analyzing ? renderAnalysisProgress() : renderAnalysisResult()}
          </View>

          {/* アクションボタン */}
          {result && !analyzing && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  !selectedSpeciesId && styles.disabledButton
                ]}
                onPress={handleConfirm}
                disabled={!selectedSpeciesId}
              >
                <LinearGradient
                  colors={selectedSpeciesId ? ['#4CAF50', '#2E7D32'] : ['#E0E0E0', '#BDBDBD']}
                  style={styles.confirmButtonGradient}
                >
                  <MaterialIcons 
                    name="check" 
                    size={20} 
                    color={selectedSpeciesId ? 'white' : '#999'} 
                  />
                  <Text style={[
                    styles.confirmButtonText,
                    !selectedSpeciesId && styles.disabledButtonText
                  ]}>
                    この種類で確定
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  imagePreview: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
    minHeight: 300,
  },
  // プログレス表示
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  progressGradient: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 15,
    width: '100%',
  },
  progressTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1976D2',
    marginTop: 15,
    marginBottom: 5,
  },
  progressSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressFillGradient: {
    width: '100%',
    height: '100%',
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  progressStep: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  // 結果表示
  resultContainer: {
    flex: 1,
  },
  resultContent: {
    flex: 1,
    padding: 20,
  },
  mainResult: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedResult: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  mainResultGradient: {
    padding: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  resultTitleContainer: {
    flex: 1,
  },
  resultSpecies: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },
  resultScientific: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#4CAF50',
  },
  confidenceContainer: {
    marginBottom: 15,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  confidenceLevel: {
    fontSize: 14,
    fontWeight: '600',
  },
  confidencePercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  confidenceDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  speciesInfo: {
    flexDirection: 'row',
    gap: 10,
  },
  speciesTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  speciesTagText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  rarityTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rarityTagText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  // セクション
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  featuresSection: {
    marginBottom: 20,
  },
  featuresList: {
    maxHeight: 200,
  },
  featureItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureType: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  featureConfidence: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    marginLeft: 22,
  },
  alternativesSection: {
    marginBottom: 20,
  },
  alternativesList: {
    maxHeight: 150,
  },
  alternativeItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedAlternative: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  alternativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alternativeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  alternativeConfidence: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
  },
  alternativeReason: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  alternativeScientific: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#999',
  },
  // アクション
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButtonText: {
    color: '#999',
  },
  bottomPadding: {
    height: 20,
  },
});

export default AIAnalysisModal;