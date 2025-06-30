import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  StatusBar,
  Switch,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { authService } from '../services/authService';
import { unifiedPostService } from '../services/unifiedPostService';
import { achievementService } from '../services/achievementService';
import { levelService } from '../services/levelService';
import AIAnalysisModal from '../components/AIAnalysisModal';
import { aiRecognitionService, RecognitionResult } from '../services/aiRecognitionService';

// const { width } = Dimensions.get('window');

const PremiumAddScreen: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    scientificName: '',
    location: '',
    description: '',
    environment: '',
    isPublic: true,
    selectedImages: [] as string[],
  });

  const [activeStep] = useState(0);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAnalysisResult, setAIAnalysisResult] = useState<RecognitionResult | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImagePicker = () => {
    Alert.alert(
      '写真を追加',
      '昆虫の写真を選択してください',
      [
        { text: 'カメラで撮影', onPress: () => openCamera() },
        { text: 'ギャラリーから選択', onPress: () => openGallery() },
        { text: 'キャンセル', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('権限エラー', 'カメラの使用許可が必要です');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...formData.selectedImages, result.assets[0].uri];
        setFormData(prev => ({ ...prev, selectedImages: newImages }));
        
        // AI分析を提案
        Alert.alert(
          '写真が追加されました！',
          'AI機能で昆虫を自動識別しますか？',
          [
            { text: '後で', style: 'cancel' },
            {
              text: 'AI識別を開始',
              onPress: () => {
                setShowAIModal(true);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('カメラエラー:', error);
      Alert.alert('エラー', 'カメラの起動に失敗しました');
    }
  };

  const openGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('権限エラー', 'フォトライブラリの使用許可が必要です');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 3,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        const totalImages = [...formData.selectedImages, ...newImages];
        const limitedImages = totalImages.slice(0, 3);
        
        setFormData(prev => ({ ...prev, selectedImages: limitedImages }));
        
        // 最初の画像でAI分析を提案
        Alert.alert(
          `${newImages.length}枚の写真が追加されました！`,
          'AI機能で昆虫を自動識別しますか？',
          [
            { text: '後で', style: 'cancel' },
            {
              text: 'AI識別を開始',
              onPress: () => {
                setShowAIModal(true);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('ギャラリーエラー:', error);
      Alert.alert('エラー', 'ギャラリーの起動に失敗しました');
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.selectedImages.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, selectedImages: newImages }));
  };

  const handleLocationPicker = () => {
    Alert.alert('位置情報', 'GPS機能は実装予定です', [
      { text: '現在地を取得', onPress: () => {
        setFormData(prev => ({ ...prev, location: '現在地（東京都新宿区）' }));
      }},
      { text: 'キャンセル', style: 'cancel' },
    ]);
  };

  const handleAISpeciesConfirmed = (speciesId: string, confidence: number) => {
    if (aiAnalysisResult) {
      // AI結果からフォームを自動入力
      const species = aiAnalysisResult.species;
      setFormData(prev => ({
        ...prev,
        name: species.name,
        scientificName: species.scientificName,
        description: `${species.description}\n\n🤖 AI識別: ${aiRecognitionService.formatConfidencePercentage(confidence)} (${aiRecognitionService.getConfidenceLevel(confidence).level})`,
        environment: species.habitat.join(', '),
      }));

      Alert.alert(
        '✨ AI識別完了！',
        `${species.name}として識別されました。\n信頼度: ${aiRecognitionService.formatConfidencePercentage(confidence)}\n\nフォームが自動入力されました。内容を確認して投稿してください。`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleAIAnalysisComplete = (result: RecognitionResult) => {
    setAIAnalysisResult(result);
  };

  const handleAIModalClose = () => {
    setShowAIModal(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('エラー', '昆虫名を入力してください');
      return;
    }

    if (formData.selectedImages.length === 0) {
      Alert.alert('エラー', '写真を最低1枚選択してください');
      return;
    }

    try {
      // ユーザー認証確認
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        Alert.alert('エラー', 'ログインが必要です');
        return;
      }

      // ローディング状態を示すアラート
      Alert.alert('投稿中...', '投稿を保存しています');

      const postData = {
        name: formData.name,
        scientificName: formData.scientificName,
        location: formData.location,
        description: formData.description,
        environment: formData.environment,
        isPublic: formData.isPublic,
        images: formData.selectedImages,
        timestamp: new Date().toISOString(),
      };

      // 統合データサービスで保存（AsyncStorage + SQLite）
      const savedPost = await unifiedPostService.addPost(postData);
      console.log('保存された投稿:', savedPost);

      // XP獲得とレベル計算
      const xpResults = [];
      try {
        // 投稿に対するXP獲得
        const firstPostResult = await levelService.addXP('DAILY_POST', { postId: savedPost.id });
        if (firstPostResult.success) {
          xpResults.push(firstPostResult);
        }

        // 詳細な投稿の場合
        if (formData.description.length > 50) {
          const detailedResult = await levelService.addXP('DETAILED_POST', { postId: savedPost.id });
          if (detailedResult.success) {
            xpResults.push(detailedResult);
          }
        }

        // 高品質投稿（複数の画像、環境情報等）
        if (formData.selectedImages.length > 1 && formData.environment) {
          const qualityResult = await levelService.addXP('QUALITY_POST', { postId: savedPost.id });
          if (qualityResult.success) {
            xpResults.push(qualityResult);
          }
        }
      } catch (xpError) {
        console.warn('XP獲得エラー:', xpError);
      }

      // 実績チェック
      try {
        const newBadges = await achievementService.checkAchievements(currentUser.id);
        
        // レベルアップ確認
        const levelUpResults = xpResults.filter(result => result.levelUp);
        
        if (newBadges.length > 0 || levelUpResults.length > 0) {
          let alertTitle = '🎉 投稿完了！';
          let alertMessage = `${formData.name}の投稿が保存されました！\n\n`;
          
          // XP獲得情報
          const totalXP = xpResults.reduce((sum, result) => sum + (result.xpGain?.amount || 0), 0);
          if (totalXP > 0) {
            alertMessage += `🌟 ${totalXP} XP獲得！\n`;
          }

          // レベルアップ情報
          if (levelUpResults.length > 0) {
            const newLevel = levelUpResults[0].newLevel;
            alertMessage += `📈 レベルアップ！ Lv.${newLevel?.currentLevel} ${newLevel?.title}\n`;
          }

          // バッジ獲得情報
          if (newBadges.length > 0) {
            const badgeNames = newBadges.map(badge => `${badge.icon} ${badge.name}`).join('\n');
            alertMessage += `🏆 新しいバッジ獲得！\n${badgeNames}\n`;
          }

          alertMessage += `\n📸 ${formData.selectedImages.length}枚の写真\n📍 ${formData.location || '場所未設定'}\n🌍 ${formData.isPublic ? '公開' : '非公開'}投稿\n🏷️ タグ: ${savedPost.tags.join(', ')}`;

          Alert.alert(
            alertTitle,
            alertMessage,
            [
              {
                text: '実績・レベルを見る',
                onPress: () => {
                  // ナビゲーションが利用可能な場合は実績画面に遷移
                },
              },
              {
                text: '続けて投稿',
                onPress: () => {
                  setFormData({
                    name: '',
                    scientificName: '',
                    location: '',
                    description: '',
                    environment: '',
                    isPublic: true,
                    selectedImages: [],
                  });
                },
              },
              { text: 'ホームに戻る', style: 'cancel' },
            ]
          );
        } else {
          Alert.alert(
            '投稿完了！',
            `${formData.name}の投稿が保存されました！\n\n📸 ${formData.selectedImages.length}枚の写真\n📍 ${formData.location || '場所未設定'}\n🌍 ${formData.isPublic ? '公開' : '非公開'}投稿\n🏷️ タグ: ${savedPost.tags.join(', ')}`,
            [
              {
                text: '続けて投稿',
                onPress: () => {
                  setFormData({
                    name: '',
                    scientificName: '',
                    location: '',
                    description: '',
                    environment: '',
                    isPublic: true,
                    selectedImages: [],
                  });
                },
              },
              { text: 'ホームに戻る', style: 'cancel' },
            ]
          );
        }
      } catch (achievementError) {
        console.warn('実績チェックエラー:', achievementError);
        Alert.alert(
          '投稿完了！',
          `${formData.name}の投稿が保存されました！\n\n📸 ${formData.selectedImages.length}枚の写真\n📍 ${formData.location || '場所未設定'}\n🌍 ${formData.isPublic ? '公開' : '非公開'}投稿\n🏷️ タグ: ${savedPost.tags.join(', ')}`,
          [
            {
              text: '続けて投稿',
              onPress: () => {
                setFormData({
                  name: '',
                  scientificName: '',
                  location: '',
                  description: '',
                  environment: '',
                  isPublic: true,
                  selectedImages: [],
                });
              },
            },
            { text: 'ホームに戻る', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('投稿エラー:', error);
      Alert.alert('エラー', '投稿の保存に失敗しました。もう一度お試しください。');
    }
  };

  const steps = ['基本情報', '写真・場所', '詳細・公開設定'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* プレミアムヘッダー */}
      <LinearGradient
        colors={['#4CAF50', '#2E7D32']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <MaterialIcons name="add-circle" size={32} color="white" />
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>新しい発見を投稿</Text>
              <Text style={styles.headerSubtitle}>昆虫の記録を共有しましょう</Text>
            </View>
          </View>

          {/* プログレスバー */}
          <View style={styles.progressContainer}>
            {steps.map((step, index) => (
              <View key={index} style={styles.progressStep}>
                <View style={[
                  styles.progressDot,
                  index <= activeStep && styles.progressDotActive
                ]}>
                  {index < activeStep ? (
                    <MaterialIcons name="check" size={16} color="white" />
                  ) : (
                    <Text style={styles.progressNumber}>{index + 1}</Text>
                  )}
                </View>
                <Text style={styles.progressLabel}>{step}</Text>
                {index < steps.length - 1 && (
                  <View style={[
                    styles.progressLine,
                    index < activeStep && styles.progressLineActive
                  ]} />
                )}
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>

      <Animated.View style={[
        styles.content,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}>
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* 写真セクション */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <MaterialIcons name="camera-alt" size={20} color="#4CAF50" />
              {'  '}写真を追加 * ({formData.selectedImages.length}/3)
            </Text>
            
            {/* 選択された写真の表示 */}
            {formData.selectedImages.length > 0 && (
              <View style={styles.selectedImagesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {formData.selectedImages.map((imageUri, index) => (
                    <View key={index} style={styles.selectedImageWrapper}>
                      <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <LinearGradient
                          colors={['#FF6B6B', '#E53E3E']}
                          style={styles.removeImageGradient}
                        >
                          <MaterialIcons name="close" size={16} color="white" />
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 写真追加ボタン */}
            {formData.selectedImages.length < 3 && (
              <TouchableOpacity
                style={styles.imageUploadContainer}
                onPress={handleImagePicker}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#F8FFF8', '#E8F5E8']}
                  style={styles.imageUploadGradient}
                >
                  <MaterialIcons name="add-a-photo" size={48} color="#4CAF50" />
                  <Text style={styles.imageUploadText}>
                    {formData.selectedImages.length === 0 ? '写真を追加する' : '写真を追加する'}
                  </Text>
                  <Text style={styles.imageUploadSubtext}>
                    残り{3 - formData.selectedImages.length}枚選択可能
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            {/* AI識別ボタン */}
            {formData.selectedImages.length > 0 && (
              <TouchableOpacity
                style={styles.aiAnalysisButton}
                onPress={() => setShowAIModal(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#E3F2FD', '#BBDEFB']}
                  style={styles.aiAnalysisGradient}
                >
                  <MaterialIcons name="auto-awesome" size={24} color="#2196F3" />
                  <Text style={styles.aiAnalysisText}>🤖 AI識別を開始</Text>
                  <Text style={styles.aiAnalysisSubtext}>
                    人工知能が昆虫を自動識別します
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* 基本情報セクション */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <MaterialIcons name="bug-report" size={20} color="#4CAF50" />
              {'  '}基本情報
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>昆虫名 *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="例: カブトムシ"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>学名</Text>
              <TextInput
                style={styles.textInput}
                value={formData.scientificName}
                onChangeText={(value) => handleInputChange('scientificName', value)}
                placeholder="例: Trypoxylus dichotomus"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* 場所セクション */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <MaterialIcons name="place" size={20} color="#4CAF50" />
              {'  '}発見場所
            </Text>
            
            <View style={styles.locationInputContainer}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={formData.location}
                onChangeText={(value) => handleInputChange('location', value)}
                placeholder="例: 新宿御苑"
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.locationButton}
                onPress={handleLocationPicker}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32']}
                  style={styles.locationButtonGradient}
                >
                  <MaterialIcons name="my-location" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* 詳細情報セクション */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <MaterialIcons name="description" size={20} color="#4CAF50" />
              {'  '}詳細情報
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>特徴・行動</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="昆虫の特徴、行動、発見時の状況などを詳しく記録してください..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>環境・植生</Text>
              <TextInput
                style={styles.textInput}
                value={formData.environment}
                onChangeText={(value) => handleInputChange('environment', value)}
                placeholder="例: 雑木林、花壇、草むら"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* 公開設定セクション */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <MaterialIcons name="public" size={20} color="#4CAF50" />
              {'  '}公開設定
            </Text>
            
            <View style={styles.switchContainer}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>投稿を公開する</Text>
                <Text style={styles.switchDescription}>
                  {formData.isPublic 
                    ? 'この投稿は他のユーザーに公開されます' 
                    : 'この投稿は自分のみ閲覧可能です'
                  }
                </Text>
              </View>
              <Switch
                value={formData.isPublic}
                onValueChange={(value) => handleInputChange('isPublic', value)}
                trackColor={{ false: '#E0E0E0', true: '#C8E6C9' }}
                thumbColor={formData.isPublic ? '#4CAF50' : '#999'}
                ios_backgroundColor="#E0E0E0"
              />
            </View>
          </View>

          {/* 投稿ボタン */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.submitGradient}
            >
              <MaterialIcons name="send" size={24} color="white" />
              <Text style={styles.submitButtonText}>投稿する</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </Animated.View>

      {/* AI分析モーダル */}
      <AIAnalysisModal
        visible={showAIModal}
        imageUri={formData.selectedImages[0] || ''}
        onClose={handleAIModalClose}
        onSpeciesConfirmed={handleAISpeciesConfirmed}
        onAnalysisComplete={handleAIAnalysisComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStep: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  progressDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressDotActive: {
    backgroundColor: 'white',
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  progressLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  progressLine: {
    position: 'absolute',
    top: 15,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressLineActive: {
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageUploadContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageUploadGradient: {
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8F5E8',
    borderStyle: 'dashed',
  },
  imageUploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 12,
  },
  imageUploadSubtext: {
    fontSize: 12,
    color: '#81C784',
    marginTop: 4,
  },
  selectedImagesContainer: {
    marginBottom: 15,
  },
  selectedImageWrapper: {
    position: 'relative',
    marginRight: 15,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  removeImageGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'white',
    fontSize: 16,
    color: '#333',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  locationButtonGradient: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 20,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  bottomPadding: {
    height: 50,
  },
  aiAnalysisButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 15,
  },
  aiAnalysisGradient: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BBDEFB',
    borderStyle: 'dashed',
  },
  aiAnalysisText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginTop: 8,
  },
  aiAnalysisSubtext: {
    fontSize: 12,
    color: '#1976D2',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default PremiumAddScreen;