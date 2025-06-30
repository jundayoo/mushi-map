import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { imageUploadService } from '../services/imageUploadService';
import { authService } from '../services/authService';

const SimpleAddScreen: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    isPublic: true,
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageSelection = async (source: 'camera' | 'gallery') => {
    try {
      // ログイン確認
      const isLoggedIn = await authService.isLoggedIn();
      if (!isLoggedIn) {
        Alert.alert('ログインが必要です', '写真を投稿するにはログインしてください');
        return;
      }

      setIsUploading(true);
      
      // 画像を選択または撮影
      const pickerResult = source === 'camera' 
        ? await imageUploadService.takePhoto()
        : await imageUploadService.pickImage();

      if (!pickerResult || pickerResult.canceled || !pickerResult.assets?.[0]) {
        setIsUploading(false);
        return;
      }

      const asset = pickerResult.assets[0];
      setSelectedImage(asset.uri);

      // Firebaseにアップロード
      const uploadResult = await imageUploadService.uploadToFirebase(asset.uri, 'insects');
      
      if (uploadResult.success && uploadResult.url) {
        setUploadedImageUrl(uploadResult.url);
        Alert.alert('成功', '写真がアップロードされました');
      } else {
        Alert.alert('エラー', uploadResult.error || 'アップロードに失敗しました');
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('画像選択エラー:', error);
      Alert.alert('エラー', '写真の処理中にエラーが発生しました');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('エラー', '昆虫名を入力してください');
      return;
    }

    // TODO: バックエンドAPIへの投稿処理
    const postData = {
      name: formData.name,
      location: formData.location,
      description: formData.description,
      isPublic: formData.isPublic,
      imageUrl: uploadedImageUrl,
    };

    console.log('投稿データ:', postData);

    Alert.alert(
      '投稿完了',
      `${formData.name}の投稿が完了しました！\n場所: ${formData.location || '未設定'}`,
      [
        {
          text: 'OK',
          onPress: () => {
            setFormData({
              name: '',
              location: '',
              description: '',
              isPublic: true,
            });
            setSelectedImage(null);
            setUploadedImageUrl(null);
          },
        },
      ]
    );
  };

  const showImageOptions = () => {
    Alert.alert(
      '写真を追加',
      '選択してください',
      [
        { text: 'カメラで撮影', onPress: () => handleImageSelection('camera') },
        { text: 'ギャラリーから選択', onPress: () => handleImageSelection('gallery') },
        { text: 'キャンセル', style: 'cancel' },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>昆虫を投稿</Text>
        <Text style={styles.headerSubtitle}>新しい発見を共有しましょう</Text>
      </View>

      <View style={styles.form}>
        {/* 写真追加エリア */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>写真</Text>
          {selectedImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              {isUploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.uploadingText}>アップロード中...</Text>
                </View>
              )}
              {!isUploading && (
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => {
                    setSelectedImage(null);
                    setUploadedImageUrl(null);
                  }}
                >
                  <MaterialIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.photoButton}
              onPress={showImageOptions}
              disabled={isUploading}
            >
              <MaterialIcons name="add-a-photo" size={48} color="#4CAF50" />
              <Text style={styles.photoButtonText}>写真を追加</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 昆虫名 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>昆虫名 *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.name}
            onChangeText={(value) => setFormData(prev => ({ ...prev, name: value }))}
            placeholder="例: カブトムシ"
            placeholderTextColor="#999"
          />
        </View>

        {/* 発見場所 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>発見場所</Text>
          <View style={styles.locationContainer}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              value={formData.location}
              onChangeText={(value) => setFormData(prev => ({ ...prev, location: value }))}
              placeholder="例: 新宿御苑"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => Alert.alert('開発中', 'GPS機能は実装予定です')}
            >
              <MaterialIcons name="my-location" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 詳細情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>詳細情報</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => setFormData(prev => ({ ...prev, description: value }))}
            placeholder="昆虫の特徴、行動、発見時の状況など..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* 公開設定 */}
        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <Text style={styles.sectionTitle}>公開設定</Text>
            <Switch
              value={formData.isPublic}
              onValueChange={(value) => setFormData(prev => ({ ...prev, isPublic: value }))}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={formData.isPublic ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.switchDescription}>
            {formData.isPublic ? '他のユーザーに公開されます' : '自分のみ閲覧可能です'}
          </Text>
        </View>

        {/* 投稿ボタン */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <MaterialIcons name="send" size={20} color="white" />
          <Text style={styles.submitButtonText}>投稿する</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  photoButton: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  photoButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationButton: {
    marginLeft: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SimpleAddScreen;