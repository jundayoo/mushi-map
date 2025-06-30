import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CommercialDesign } from '../styles/CommercialDesignSystem';
import { adminService, AdminUser } from '../services/adminService';

interface AdminLoginScreenProps {
  onLoginSuccess: (admin: AdminUser) => void;
  onBack: () => void;
}

const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({
  onLoginSuccess,
  onBack,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    setLoading(true);
    
    try {
      const result = await adminService.adminLogin(email.trim(), password);
      
      if (result.success && result.admin) {
        onLoginSuccess(result.admin);
      } else {
        Alert.alert('ログイン失敗', result.error || 'ログインに失敗しました');
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      Alert.alert('エラー', 'ログイン処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'admin' | 'moderator') => {
    if (role === 'admin') {
      setEmail('admin@mushimap.com');
      setPassword('admin123');
    } else {
      setEmail('moderator@mushimap.com');
      setPassword('mod123');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 背景グラデーション */}
      <LinearGradient
        colors={CommercialDesign.gradients.premium}
        style={styles.background}
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>管理者ログイン</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ロゴセクション */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="admin-panel-settings" size={64} color="white" />
            </View>
            <Text style={styles.logoTitle}>むしマップ</Text>
            <Text style={styles.logoSubtitle}>管理者ダッシュボード</Text>
          </View>

          {/* ログインフォーム */}
          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>管理者認証</Text>
              
              {/* メールアドレス入力 */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>メールアドレス</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons
                    name="email"
                    size={20}
                    color={CommercialDesign.colors.gray[500]}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="admin@mushimap.com"
                    placeholderTextColor={CommercialDesign.colors.gray[400]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* パスワード入力 */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>パスワード</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons
                    name="lock"
                    size={20}
                    color={CommercialDesign.colors.gray[500]}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="パスワードを入力"
                    placeholderTextColor={CommercialDesign.colors.gray[400]}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <MaterialIcons
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color={CommercialDesign.colors.gray[500]}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ログインボタン */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={CommercialDesign.gradients.primaryButton}
                  style={styles.loginButtonGradient}
                >
                  <MaterialIcons
                    name={loading ? 'hourglass-empty' : 'login'}
                    size={24}
                    color="white"
                  />
                  <Text style={styles.loginButtonText}>
                    {loading ? 'ログイン中...' : 'ログイン'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* デモ認証情報 */}
              <View style={styles.demoSection}>
                <Text style={styles.demoTitle}>🧪 デモ用認証情報</Text>
                
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={() => fillDemoCredentials('admin')}
                >
                  <View style={styles.demoButtonContent}>
                    <MaterialIcons name="admin-panel-settings" size={20} color={CommercialDesign.colors.primary[500]} />
                    <View style={styles.demoButtonText}>
                      <Text style={styles.demoButtonTitle}>スーパー管理者</Text>
                      <Text style={styles.demoButtonSubtitle}>admin@mushimap.com</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={() => fillDemoCredentials('moderator')}
                >
                  <View style={styles.demoButtonContent}>
                    <MaterialIcons name="shield" size={20} color={CommercialDesign.colors.secondary[500]} />
                    <View style={styles.demoButtonText}>
                      <Text style={styles.demoButtonTitle}>モデレーター</Text>
                      <Text style={styles.demoButtonSubtitle}>moderator@mushimap.com</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* 権限情報 */}
              <View style={styles.permissionsSection}>
                <Text style={styles.permissionsTitle}>🔐 管理者権限</Text>
                <View style={styles.permissionsList}>
                  <View style={styles.permissionItem}>
                    <MaterialIcons name="people" size={16} color={CommercialDesign.colors.primary[500]} />
                    <Text style={styles.permissionText}>ユーザー管理</Text>
                  </View>
                  <View style={styles.permissionItem}>
                    <MaterialIcons name="photo-library" size={16} color={CommercialDesign.colors.primary[500]} />
                    <Text style={styles.permissionText}>投稿モデレート</Text>
                  </View>
                  <View style={styles.permissionItem}>
                    <MaterialIcons name="analytics" size={16} color={CommercialDesign.colors.primary[500]} />
                    <Text style={styles.permissionText}>システム分析</Text>
                  </View>
                  <View style={styles.permissionItem}>
                    <MaterialIcons name="notifications" size={16} color={CommercialDesign.colors.primary[500]} />
                    <Text style={styles.permissionText}>通知管理</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
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

  // ヘッダー
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: CommercialDesign.spacing.lg,
    paddingBottom: CommercialDesign.spacing.md,
  },
  backButton: {
    padding: CommercialDesign.spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },

  // スクロールビュー
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: CommercialDesign.spacing.lg,
  },

  // ロゴセクション
  logoSection: {
    alignItems: 'center',
    paddingVertical: CommercialDesign.spacing.xl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: CommercialDesign.spacing.md,
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  logoSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // フォームコンテナ
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.xl,
    padding: CommercialDesign.spacing.xl,
    ...CommercialDesign.shadows.floating,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: CommercialDesign.colors.text.primary,
    textAlign: 'center',
    marginBottom: CommercialDesign.spacing.xl,
  },

  // 入力フィールド
  inputContainer: {
    marginBottom: CommercialDesign.spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: CommercialDesign.colors.text.primary,
    marginBottom: CommercialDesign.spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CommercialDesign.colors.gray[300],
    borderRadius: CommercialDesign.borders.radius.medium,
    paddingHorizontal: CommercialDesign.spacing.md,
    backgroundColor: CommercialDesign.colors.background.primary,
  },
  inputIcon: {
    marginRight: CommercialDesign.spacing.sm,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: CommercialDesign.colors.text.primary,
  },
  eyeButton: {
    padding: CommercialDesign.spacing.sm,
  },

  // ログインボタン
  loginButton: {
    marginVertical: CommercialDesign.spacing.lg,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: CommercialDesign.borders.radius.medium,
    ...CommercialDesign.shadows.button,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: CommercialDesign.spacing.sm,
  },

  // デモセクション
  demoSection: {
    marginTop: CommercialDesign.spacing.lg,
    paddingTop: CommercialDesign.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: CommercialDesign.colors.gray[200],
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CommercialDesign.colors.text.secondary,
    marginBottom: CommercialDesign.spacing.md,
    textAlign: 'center',
  },
  demoButton: {
    borderWidth: 1,
    borderColor: CommercialDesign.colors.gray[200],
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.md,
    marginBottom: CommercialDesign.spacing.sm,
  },
  demoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  demoButtonText: {
    marginLeft: CommercialDesign.spacing.md,
  },
  demoButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CommercialDesign.colors.text.primary,
  },
  demoButtonSubtitle: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
    marginTop: 2,
  },

  // 権限セクション
  permissionsSection: {
    marginTop: CommercialDesign.spacing.lg,
    paddingTop: CommercialDesign.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: CommercialDesign.colors.gray[200],
  },
  permissionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CommercialDesign.colors.text.secondary,
    marginBottom: CommercialDesign.spacing.md,
    textAlign: 'center',
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: CommercialDesign.spacing.sm,
  },
  permissionText: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
    marginLeft: CommercialDesign.spacing.xs,
  },
});

export default AdminLoginScreen;