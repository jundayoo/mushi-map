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

const { width, height } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      Alert.alert('エラー', 'メールアドレスを入力してください');
      return false;
    }

    if (!validateEmail(formData.email.trim())) {
      Alert.alert('エラー', '有効なメールアドレスを入力してください\n例: example@domain.com');
      return false;
    }

    if (!formData.displayName.trim()) {
      Alert.alert('エラー', '表示名を入力してください');
      return false;
    }

    if (formData.displayName.trim().length < 2 || formData.displayName.trim().length > 30) {
      Alert.alert('エラー', '表示名は2文字以上30文字以下で入力してください');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('エラー', 'パスワードは6文字以上で入力してください');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await authService.register({
        email: sanitizeInput(formData.email),
        password: formData.password,
        displayName: sanitizeInput(formData.displayName),
        bio: sanitizeInput(formData.bio),
      });

      if (result.success && result.user) {
        Alert.alert(
          'アカウント作成完了！',
          `${result.user.displayName}さん、むしマップへようこそ！`,
          [
            {
              text: 'むしマップを始める',
              onPress: () => navigation.navigate('MainTabs'),
            },
          ]
        );
      } else {
        Alert.alert('登録エラー', result.error || 'アカウント作成に失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', '登録処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const result = await authService.signInWithGoogle();

      if (result.success && result.user) {
        Alert.alert(
          'Google登録成功！',
          `${result.user.displayName}さん、Googleアカウントで登録完了しました！`,
          [
            {
              text: 'むしマップを始める',
              onPress: () => navigation.navigate('MainTabs'),
            },
          ]
        );
      } else {
        Alert.alert('Google登録エラー', result.error || 'Google登録に失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', 'Google登録処理中にエラーが発生しました');
    } finally {
      setGoogleLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.goBack();
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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
              <TouchableOpacity 
                style={styles.backButton}
                onPress={navigateToLogin}
              >
                <MaterialIcons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <MaterialIcons name="person-add" size={48} color="white" />
                <Text style={styles.appTitle}>新規登録</Text>
                <Text style={styles.appSubtitle}>むしマップのアカウントを作成</Text>
              </View>
            </View>

            {/* 登録フォーム */}
            <View style={styles.formContainer}>
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>アカウント情報</Text>
                
                {/* メールアドレス */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>メールアドレス *</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="email" size={20} color="#4CAF50" />
                    <TextInput
                      style={styles.textInput}
                      value={formData.email}
                      onChangeText={(value) => handleInputChange('email', value)}
                      placeholder="例: mushilover@example.com"
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* 表示名 */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>表示名 *</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="person" size={20} color="#4CAF50" />
                    <TextInput
                      style={styles.textInput}
                      value={formData.displayName}
                      onChangeText={(value) => handleInputChange('displayName', value)}
                      placeholder="例: 昆虫太郎"
                      placeholderTextColor="#999"
                      maxLength={30}
                    />
                  </View>
                </View>

                {/* 自己紹介 */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>自己紹介（任意）</Text>
                  <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                    <MaterialIcons name="info" size={20} color="#4CAF50" style={styles.textAreaIcon} />
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={formData.bio}
                      onChangeText={(value) => handleInputChange('bio', value)}
                      placeholder="昆虫観察の経験や好きな昆虫について教えてください..."
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={3}
                      maxLength={200}
                    />
                  </View>
                  <Text style={styles.charCount}>{formData.bio.length}/200</Text>
                </View>

                {/* パスワード */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>パスワード *</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="lock" size={20} color="#4CAF50" />
                    <TextInput
                      style={styles.textInput}
                      value={formData.password}
                      onChangeText={(value) => handleInputChange('password', value)}
                      placeholder="6文字以上"
                      placeholderTextColor="#999"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <MaterialIcons 
                        name={showPassword ? "visibility" : "visibility-off"} 
                        size={20} 
                        color="#999" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* パスワード確認 */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>パスワード確認 *</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="lock-outline" size={20} color="#4CAF50" />
                    <TextInput
                      style={styles.textInput}
                      value={formData.confirmPassword}
                      onChangeText={(value) => handleInputChange('confirmPassword', value)}
                      placeholder="パスワードを再入力"
                      placeholderTextColor="#999"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                    >
                      <MaterialIcons 
                        name={showConfirmPassword ? "visibility" : "visibility-off"} 
                        size={20} 
                        color="#999" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Google登録ボタン */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleSignUp}
                  disabled={googleLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#4285F4', '#34A853']}
                    style={styles.googleGradient}
                  >
                    {googleLoading ? (
                      <Text style={styles.googleButtonText}>Google登録中...</Text>
                    ) : (
                      <>
                        <MaterialIcons name="account-circle" size={20} color="white" />
                        <Text style={styles.googleButtonText}>Googleで登録</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* 区切り線 */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>または</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* 登録ボタン */}
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#2E7D32']}
                    style={styles.registerGradient}
                  >
                    {loading ? (
                      <Text style={styles.registerButtonText}>アカウント作成中...</Text>
                    ) : (
                      <>
                        <MaterialIcons name="person-add" size={20} color="white" />
                        <Text style={styles.registerButtonText}>メールで登録</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* ログインリンク */}
                <TouchableOpacity
                  style={styles.loginLink}
                  onPress={navigateToLogin}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loginLinkText}>
                    既にアカウントをお持ちの場合は
                    <Text style={styles.loginLinkBold}> ログイン</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 10,
    padding: 10,
  },
  logoContainer: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginTop: 15,
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  formContainer: {
    flex: 1,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
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
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textAreaIcon: {
    marginTop: 3,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  eyeButton: {
    padding: 5,
  },
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginTop: 20,
    marginBottom: 15,
  },
  registerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  registerButtonText: {
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
    marginBottom: 15,
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
    marginVertical: 15,
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
  loginLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  loginLinkText: {
    color: '#666',
    fontSize: 14,
  },
  loginLinkBold: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default RegisterScreen;