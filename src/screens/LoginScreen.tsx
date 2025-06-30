import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/SimpleNavigator';
import { authService } from '../services/authService';
import AccessibleButton from '../components/AccessibleButton';
import AccessibleTextInput from '../components/AccessibleTextInput';
import { announceForAccessibility } from '../utils/accessibility';

const { width, height } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    authService.createDefaultUsers();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      const errorMessage = 'メールアドレスとパスワードを入力してください';
      Alert.alert('エラー', errorMessage);
      announceForAccessibility('エラー: ' + errorMessage);
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (result.success && result.user) {
        const successMessage = `ログイン成功。${result.user.displayName}さん、おかえりなさい`;
        announceForAccessibility(successMessage);
        Alert.alert(
          'ログイン成功！',
          `${result.user.displayName}さん、おかえりなさい！`,
          [
            {
              text: 'むしマップを始める',
              onPress: () => navigation.navigate('MainTabs'),
            },
          ]
        );
      } else {
        const errorMessage = result.error || 'ログインに失敗しました';
        Alert.alert('ログインエラー', errorMessage);
        announceForAccessibility('ログインエラー: ' + errorMessage);
      }
    } catch (error) {
      Alert.alert('エラー', 'ログイン処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await authService.signInWithGoogle();

      if (result.success && result.user) {
        Alert.alert(
          'Google認証成功！',
          `${result.user.displayName}さん、Googleアカウントでログインしました！`,
          [
            {
              text: 'むしマップを始める',
              onPress: () => navigation.navigate('MainTabs'),
            },
          ]
        );
      } else {
        Alert.alert('Google認証エラー', result.error || 'Google認証に失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', 'Google認証処理中にエラーが発生しました');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setFormData({
      email: 'demo@mushimap.com',
      password: 'demo123',
    });
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* バックグラウンドグラデーション */}
      <LinearGradient
        colors={['#4CAF50', '#2E7D32', '#1B5E20']}
        style={styles.background}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* ヘッダー */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="bug-report" size={64} color="white" />
              <Text style={styles.appTitle}>むしマップ</Text>
              <Text style={styles.appSubtitle}>昆虫発見コミュニティ</Text>
            </View>
          </View>

          {/* ログインフォーム */}
          <ScrollView style={styles.formContainer} contentContainerStyle={styles.formScrollContent}>
            <View style={styles.formCard}>
              <Text 
                style={styles.formTitle}
                accessible={true}
                accessibilityRole="header"
                accessibilityLabel="ログインフォーム"
              >
                ログイン
              </Text>
              
              <AccessibleTextInput
                label="メールアドレス"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="メールアドレスを入力してください"
                keyboardType="email-address"
                autoCapitalize="none"
                required
              />

              <AccessibleTextInput
                label="パスワード"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                placeholder="パスワードを入力してください"
                secureTextEntry
                autoCapitalize="none"
                required
              />

              {/* デモ用ボタン */}
              <AccessibleButton
                title="デモアカウントを使用"
                onPress={handleDemoLogin}
                accessibilityLabel="デモアカウントのメールアドレスとパスワードを自動入力"
                accessibilityHint="タップするとデモ用のメールアドレスとパスワードが入力されます"
                variant="secondary"
                size="medium"
                style={styles.demoButton}
              />

              {/* ログインボタン */}
              <AccessibleButton
                title={loading ? 'ログイン中...' : 'ログイン'}
                onPress={handleLogin}
                accessibilityLabel="メールアドレスとパスワードでログイン"
                accessibilityHint="タップすると入力したメールアドレスとパスワードでログインします"
                disabled={loading}
                loading={loading}
                variant="primary"
                size="large"
                style={styles.loginButton}
                icon={!loading ? <MaterialIcons name="login" size={20} color="white" /> : undefined}
              />

              {/* Googleログインボタン */}
              <AccessibleButton
                title={googleLoading ? 'Google認証中...' : 'Googleでログイン'}
                onPress={handleGoogleSignIn}
                accessibilityLabel="Googleアカウントでログイン"
                accessibilityHint="タップするとGoogleアカウントでログインします"
                disabled={googleLoading}
                loading={googleLoading}
                variant="secondary"
                size="large"
                style={[styles.googleButton, { backgroundColor: googleLoading ? '#B3E5FC' : '#4285F4' }]}
                icon={!googleLoading ? <MaterialIcons name="account-circle" size={20} color="white" /> : undefined}
              />

              {/* 区切り線 */}
              <View 
                style={styles.divider}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel="または"
              >
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>または</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* 新規登録ボタン */}
              <AccessibleButton
                title="新規アカウント作成"
                onPress={navigateToRegister}
                accessibilityLabel="新しいアカウントを作成"
                accessibilityHint="タップすると登録画面に移動します"
                variant="secondary"
                size="large"
                style={styles.registerButton}
                textStyle={{ color: '#4CAF50' }}
                icon={<MaterialIcons name="person-add" size={20} color="#4CAF50" />}
              />
            </View>
          </ScrollView>

          {/* フッター */}
          <View 
            style={styles.footer}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="むしマップで昆虫の発見を共有しましょう"
          >
            <Text style={styles.footerText}>
              むしマップで昆虫の発見を共有しましょう！
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginTop: 15,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  formContainer: {
    flex: 1,
    marginBottom: 30,
  },
  formScrollContent: {
    flexGrow: 1,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: '#F8F9FA',
  },
  textInput: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 5,
  },
  demoButton: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFB74D',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  demoButtonText: {
    color: '#F57C00',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 20,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  googleButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 20,
  },
  googleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    paddingHorizontal: 15,
    fontSize: 14,
    color: '#999',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
    backgroundColor: 'white',
  },
  registerButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoginScreen;