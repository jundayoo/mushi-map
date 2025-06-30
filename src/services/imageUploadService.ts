import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

class ImageUploadService {
  // 画像の最大サイズ（MB）
  private readonly MAX_FILE_SIZE = 10;
  
  // 画像圧縮設定
  private readonly IMAGE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8, // 80%品質
    exif: false,
  };

  /**
   * カメラパーミッションを要求
   */
  async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'カメラアクセス許可が必要です',
        'むしマップで写真を撮影するには、カメラへのアクセスを許可してください。',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '設定を開く', onPress: () => {} }
        ]
      );
      return false;
    }
    
    return true;
  }

  /**
   * ギャラリーパーミッションを要求
   */
  async requestGalleryPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'ギャラリーアクセス許可が必要です',
        'むしマップで写真を選択するには、ギャラリーへのアクセスを許可してください。',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '設定を開く', onPress: () => {} }
        ]
      );
      return false;
    }
    
    return true;
  }

  /**
   * カメラから写真を撮影
   */
  async takePhoto(): Promise<ImagePicker.ImagePickerResult | null> {
    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) {
      return null;
    }

    try {
      const result = await ImagePicker.launchCameraAsync(this.IMAGE_PICKER_OPTIONS);
      return result;
    } catch (error) {
      console.error('カメラエラー:', error);
      Alert.alert('エラー', 'カメラの起動に失敗しました');
      return null;
    }
  }

  /**
   * ギャラリーから画像を選択
   */
  async pickImage(): Promise<ImagePicker.ImagePickerResult | null> {
    const hasPermission = await this.requestGalleryPermission();
    if (!hasPermission) {
      return null;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync(this.IMAGE_PICKER_OPTIONS);
      return result;
    } catch (error) {
      console.error('ギャラリーエラー:', error);
      Alert.alert('エラー', '画像の選択に失敗しました');
      return null;
    }
  }

  /**
   * Firebaseに画像をアップロード
   */
  async uploadToFirebase(uri: string, folder: string = 'insects'): Promise<UploadResult> {
    try {
      // ファイルサイズをチェック
      if (Platform.OS !== 'web') {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if ('size' in fileInfo && fileInfo.size) {
          const sizeInMB = fileInfo.size / (1024 * 1024);
          if (sizeInMB > this.MAX_FILE_SIZE) {
            return {
              success: false,
              error: `ファイルサイズが大きすぎます（最大${this.MAX_FILE_SIZE}MB）`
            };
          }
        }
      }

      // 一意のファイル名を生成
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileName = `${folder}/${timestamp}_${randomString}.jpg`;

      // Firebase Storageの参照を作成
      const storageRef = ref(storage, fileName);

      // 画像をBlobに変換
      const response = await fetch(uri);
      const blob = await response.blob();

      // アップロード
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg',
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          folder: folder
        }
      });

      // ダウンロードURLを取得
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        success: true,
        url: downloadURL
      };
    } catch (error: any) {
      console.error('アップロードエラー:', error);
      
      let errorMessage = '画像のアップロードに失敗しました';
      if (error.code === 'storage/unauthorized') {
        errorMessage = '認証が必要です';
      } else if (error.code === 'storage/canceled') {
        errorMessage = 'アップロードがキャンセルされました';
      } else if (error.code === 'storage/unknown') {
        errorMessage = 'ネットワークエラーが発生しました';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 画像を選択してアップロード（統合関数）
   */
  async selectAndUploadImage(
    source: 'camera' | 'gallery',
    folder: string = 'insects'
  ): Promise<UploadResult> {
    try {
      // 画像を選択/撮影
      const result = source === 'camera' 
        ? await this.takePhoto() 
        : await this.pickImage();

      if (!result || result.canceled || !result.assets?.[0]) {
        return {
          success: false,
          error: 'キャンセルされました'
        };
      }

      const asset = result.assets[0];
      
      // アップロード
      return await this.uploadToFirebase(asset.uri, folder);
    } catch (error) {
      console.error('画像選択/アップロードエラー:', error);
      return {
        success: false,
        error: '画像の処理に失敗しました'
      };
    }
  }

  /**
   * ローカルストレージに一時保存（オフライン対応）
   */
  async saveToLocal(uri: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return uri; // Webの場合はそのまま返す
      }

      // ローカルディレクトリを作成
      const localDir = `${FileSystem.documentDirectory}temp_images/`;
      await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });

      // ファイル名を生成
      const fileName = `temp_${Date.now()}.jpg`;
      const localUri = `${localDir}${fileName}`;

      // ファイルをコピー
      await FileSystem.copyAsync({
        from: uri,
        to: localUri
      });

      return localUri;
    } catch (error) {
      console.error('ローカル保存エラー:', error);
      return null;
    }
  }

  /**
   * 一時ファイルをクリーンアップ
   */
  async cleanupTempFiles(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        return;
      }

      const tempDir = `${FileSystem.documentDirectory}temp_images/`;
      const dirInfo = await FileSystem.getInfoAsync(tempDir);
      
      if (dirInfo.exists && dirInfo.isDirectory) {
        await FileSystem.deleteAsync(tempDir, { idempotent: true });
      }
    } catch (error) {
      console.error('クリーンアップエラー:', error);
    }
  }
}

export const imageUploadService = new ImageUploadService();