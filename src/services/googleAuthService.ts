import { Alert } from 'react-native';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
}

class GoogleAuthService {
  async signInWithGoogle(): Promise<{ success: boolean; user?: GoogleUser; error?: string }> {
    try {
      console.log('Google認証をシミュレートします...');
      
      // 開発・デモ用のGoogle認証シミュレーション
      return this.mockGoogleSignIn();
    } catch (error) {
      console.error('Google認証エラー:', error);
      return { success: false, error: 'Google認証に失敗しました' };
    }
  }

  private async mockGoogleSignIn(): Promise<{ success: boolean; user?: GoogleUser; error?: string }> {
    // ユーザーに選択してもらう
    return new Promise((resolve) => {
      Alert.alert(
        'Google認証デモ',
        'どのGoogleアカウントでログインしますか？',
        [
          {
            text: '田中太郎',
            onPress: () => {
              const user = {
                id: 'google_user_1',
                email: 'taro.google@gmail.com',
                name: '田中太郎',
                picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=taro-google',
                given_name: '太郎',
                family_name: '田中',
              };
              setTimeout(() => resolve({ success: true, user }), 800);
            },
          },
          {
            text: '佐藤花子',
            onPress: () => {
              const user = {
                id: 'google_user_2',
                email: 'hanako.google@gmail.com',
                name: '佐藤花子',
                picture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=hanako-google',
                given_name: '花子',
                family_name: '佐藤',
              };
              setTimeout(() => resolve({ success: true, user }), 800);
            },
          },
          {
            text: 'キャンセル',
            style: 'cancel',
            onPress: () => resolve({ success: false, error: 'Google認証をキャンセルしました' }),
          },
        ]
      );
    });
  }

}

export const googleAuthService = new GoogleAuthService();