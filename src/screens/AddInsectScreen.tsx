import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { CreateInsectDto } from '../types';
import { apiService } from '../services/api';

const AddInsectScreen: React.FC = () => {
  const [formData, setFormData] = useState<CreateInsectDto>({
    name: '',
    scientificName: '',
    imageUrls: [],
    description: '',
    latitude: 35.6762,
    longitude: 139.6503,
    locationName: '',
    weather: '',
    temperature: undefined,
    environment: '',
    tags: [],
    isPublic: true,
  });

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof CreateInsectDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImagePicker = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.8,
        selectionLimit: 3 - selectedImages.length,
      },
      (response: ImagePickerResponse) => {
        if (response.assets) {
          const newImages = response.assets
            .filter(asset => asset.uri)
            .map(asset => asset.uri!);
          
          setSelectedImages(prev => [...prev, ...newImages]);
          setFormData(prev => ({
            ...prev,
            imageUrls: [...prev.imageUrls, ...newImages],
          }));
        }
      }
    );
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const getCurrentLocation = () => {
    Alert.alert('位置情報取得', 'GPS機能は実装予定です');
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('エラー', '昆虫名を入力してください');
      return;
    }

    if (formData.imageUrls.length === 0) {
      Alert.alert('エラー', '最低1枚の写真を選択してください');
      return;
    }

    try {
      setLoading(true);
      await apiService.createInsect(formData);
      Alert.alert('成功', '昆虫の投稿が完了しました', [
        { text: 'OK', onPress: resetForm }
      ]);
    } catch (error) {
      console.error('Error creating insect:', error);
      Alert.alert('エラー', '投稿に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      scientificName: '',
      imageUrls: [],
      description: '',
      latitude: 35.6762,
      longitude: 139.6503,
      locationName: '',
      weather: '',
      temperature: undefined,
      environment: '',
      tags: [],
      isPublic: true,
    });
    setSelectedImages([]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* 写真選択 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>写真 *</Text>
          <View style={styles.imageContainer}>
            {selectedImages.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.selectedImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Icon name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
            {selectedImages.length < 3 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleImagePicker}
              >
                <Icon name="add-a-photo" size={32} color="#4CAF50" />
                <Text style={styles.addImageText}>写真を追加</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 昆虫名 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>昆虫名 *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder="例: カブトムシ"
          />
        </View>

        {/* 学名 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>学名</Text>
          <TextInput
            style={styles.textInput}
            value={formData.scientificName}
            onChangeText={(value) => handleInputChange('scientificName', value)}
            placeholder="例: Trypoxylus dichotomus"
          />
        </View>

        {/* 発見場所 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>発見場所</Text>
          <View style={styles.locationContainer}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              value={formData.locationName}
              onChangeText={(value) => handleInputChange('locationName', value)}
              placeholder="例: 新宿御苑"
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
            >
              <Icon name="my-location" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 詳細情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>詳細情報</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="昆虫の特徴、行動、発見時の状況など..."
            multiline
            numberOfLines={4}
          />
        </View>

        {/* 環境情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>環境情報</Text>
          <View style={styles.environmentContainer}>
            <TextInput
              style={[styles.textInput, { flex: 1, marginRight: 10 }]}
              value={formData.weather}
              onChangeText={(value) => handleInputChange('weather', value)}
              placeholder="天気"
            />
            <TextInput
              style={[styles.textInput, { width: 80 }]}
              value={formData.temperature?.toString() || ''}
              onChangeText={(value) => handleInputChange('temperature', value ? parseFloat(value) : undefined)}
              placeholder="気温"
              keyboardType="numeric"
            />
          </View>
          <TextInput
            style={styles.textInput}
            value={formData.environment}
            onChangeText={(value) => handleInputChange('environment', value)}
            placeholder="植生、環境など"
          />
        </View>

        {/* 公開設定 */}
        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <Text style={styles.sectionTitle}>公開設定</Text>
            <Switch
              value={formData.isPublic}
              onValueChange={(value) => handleInputChange('isPublic', value)}
            />
          </View>
          <Text style={styles.switchDescription}>
            {formData.isPublic ? '他のユーザーに公開されます' : '自分のみ閲覧可能です'}
          </Text>
        </View>

        {/* 投稿ボタン */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? '投稿中...' : '投稿する'}
          </Text>
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
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageWrapper: {
    position: 'relative',
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  addImageText: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationButton: {
    marginLeft: 10,
    padding: 10,
  },
  environmentContainer: {
    flexDirection: 'row',
    marginBottom: 10,
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
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddInsectScreen;