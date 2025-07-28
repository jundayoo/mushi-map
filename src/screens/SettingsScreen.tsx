import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
  Switch,
  Linking,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/CommercialNavigator';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { settingsService } from '../services/settingsService';
import { accountDeletionService } from '../services/accountDeletionService';
import { Theme } from '../context/ThemeContext';
import * as Application from 'expo-application';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface SettingSection {
  title: string;
  items: SettingItem[];
}

interface SettingItem {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  toggle?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
}

interface SettingsScreenProps {
  isDarkMode?: boolean;
  setDarkMode?: (value: boolean) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ isDarkMode = false, setDarkMode }) => {
  const navigation = useNavigation<NavigationProp>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [darkModeLocal, setDarkModeLocal] = useState(isDarkMode);
  
  React.useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      await settingsService.initialize();
      const settings = settingsService.getSettings();
      setNotificationsEnabled(settings.notifications.enabled);
      setLocationEnabled(settings.privacy.locationEnabled);
    } catch (error) {
      console.error('設定読み込みエラー:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしてもよろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert('エラー', 'ログアウトに失敗しました');
            }
          },
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://jundayoo.github.io/mushi-map/privacy-policy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://jundayoo.github.io/mushi-map/terms-of-service');
  };

  const handleContact = () => {
    Alert.alert(
      'お問い合わせ',
      'メールアプリを開いてお問い合わせしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '開く',
          onPress: () => {
            Linking.openURL('mailto:mushimap.contact@gmail.com?subject=虫マップへのお問い合わせ');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ アカウント削除',
      'アカウントを削除すると、すべてのデータが失われます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '最終確認',
              '本当にアカウントを削除しますか？',
              [
                { text: 'キャンセル', style: 'cancel' },
                {
                  text: '削除',
                  style: 'destructive',
                  onPress: async () => {
                    const stats = await accountDeletionService.preDeleteCheck();
                    
                    Alert.alert(
                      'アカウント削除の確認',
                      `以下のデータがすべて削除されます：\n\n投稿数: ${stats.postsCount}件\nフォロワー数: ${stats.followersCount}人\nフォロー中: ${stats.followingCount}人\n\n本当に削除しますか？`,
                      [
                        { text: 'キャンセル', style: 'cancel' },
                        {
                          text: '削除',
                          style: 'destructive',
                          onPress: () => {
                            Alert.prompt(
                              'パスワード確認',
                              'アカウント削除を実行するにはパスワードを入力してください',
                              [
                                { text: 'キャンセル', style: 'cancel' },
                                {
                                  text: '削除',
                                  style: 'destructive',
                                  onPress: async (password) => {
                                    if (!password) {
                                      Alert.alert('エラー', 'パスワードを入力してください');
                                      return;
                                    }
                                    
                                    try {
                                      setLoading(true);
                                      await accountDeletionService.deleteAccount(password);
                                      
                                      // ログイン画面に遷移
                                      navigation.reset({
                                        index: 0,
                                        routes: [{ name: 'Login' }],
                                      });
                                    } catch (error: any) {
                                      Alert.alert('エラー', error.message || 'アカウントの削除に失敗しました');
                                    } finally {
                                      setLoading(false);
                                    }
                                  },
                                },
                              ],
                              'secure-text'
                            );
                          },
                        },
                      ]
                    );
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const sections: SettingSection[] = [
    {
      title: 'アカウント',
      items: [
        {
          icon: 'person',
          title: 'プロフィール編集',
          onPress: () => {
            authService.getCurrentUser().then(user => {
              if (user) {
                navigation.navigate('EditProfile', { user });
              }
            });
          },
        },
        {
          icon: 'lock',
          title: 'パスワード変更',
          onPress: () => navigation.navigate('ChangePassword'),
        },
      ],
    },
    {
      title: '通知',
      items: [
        {
          icon: 'notifications',
          title: '通知を受け取る',
          toggle: true,
          value: notificationsEnabled,
          onValueChange: async (value) => {
            try {
              await settingsService.updateNotificationSettings({ enabled: value });
              setNotificationsEnabled(value);
            } catch (error) {
              Alert.alert('エラー', '通知設定の更新に失敗しました');
            }
          },
        },
        {
          icon: 'notifications-active',
          title: '通知テスト',
          subtitle: '本番通知機能をテスト',
          onPress: () => navigation.navigate('TestNotification' as never),
        },
        {
          icon: 'bug-report',
          title: '環境変数デバッグ',
          subtitle: '環境変数の読み込み状態を確認',
          onPress: () => navigation.navigate('DebugEnv' as never),
        },
      ],
    },
    {
      title: 'プライバシー',
      items: [
        {
          icon: 'location-on',
          title: '位置情報の使用',
          subtitle: '周辺の昆虫を発見',
          toggle: true,
          value: locationEnabled,
          onValueChange: async (value) => {
            try {
              await settingsService.updatePrivacySettings({ locationEnabled: value });
              setLocationEnabled(value);
            } catch (error) {
              Alert.alert('エラー', '位置情報設定の更新に失敗しました');
              setLocationEnabled(false);
            }
          },
        },
        {
          icon: 'block',
          title: 'ブロックリスト',
          onPress: () => navigation.navigate('BlockList'),
        },
      ],
    },
    {
      title: 'アプリ設定',
      items: [
        {
          icon: 'brightness-6',
          title: 'ダークモード',
          toggle: true,
          value: darkModeLocal,
          onValueChange: async (value) => {
            try {
              setDarkModeLocal(value);
              if (setDarkMode) {
                setDarkMode(value);
              }
              await settingsService.updateAppearanceSettings({ darkMode: value });
            } catch (error) {
              console.error('ダークモード設定エラー:', error);
            }
          },
        },
        {
          icon: 'language',
          title: '言語',
          subtitle: '日本語',
          onPress: () => Alert.alert('準備中', 'この機能は現在開発中です'),
        },
      ],
    },
    {
      title: 'サポート',
      items: [
        {
          icon: 'help',
          title: 'ヘルプセンター',
          onPress: () => navigation.navigate('HelpCenter'),
        },
        {
          icon: 'mail',
          title: 'お問い合わせ',
          onPress: handleContact,
        },
        {
          icon: 'bug-report',
          title: 'バグ報告',
          onPress: () => navigation.navigate('BugReport'),
        },
      ],
    },
    {
      title: '情報',
      items: [
        {
          icon: 'policy',
          title: 'プライバシーポリシー',
          onPress: handlePrivacyPolicy,
        },
        {
          icon: 'description',
          title: '利用規約',
          onPress: handleTermsOfService,
        },
        {
          icon: 'info',
          title: 'バージョン情報',
          subtitle: `v${Application.nativeApplicationVersion || '1.0.0'}`,
          onPress: () => {},
        },
      ],
    },
    {
      title: 'アカウント管理',
      items: [
        {
          icon: 'logout',
          title: 'ログアウト',
          onPress: handleLogout,
        },
        {
          icon: 'delete-forever',
          title: 'アカウント削除',
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem, isLast: boolean) => (
    <TouchableOpacity
      key={item.title}
      style={[styles.settingItem, isLast && styles.lastSettingItem]}
      onPress={item.onPress}
      disabled={item.toggle}
    >
      <View style={styles.settingItemLeft}>
        <MaterialIcons name={item.icon as any} size={24} color="#666" />
        <View style={styles.settingItemText}>
          <Text style={styles.settingItemTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.settingItemSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      {item.toggle ? (
        <Switch
          value={item.value}
          onValueChange={item.onValueChange}
          trackColor={{ false: '#E0E0E0', true: '#81C784' }}
          thumbColor={item.value ? '#4CAF50' : '#f4f3f4'}
        />
      ) : (
        <MaterialIcons name="chevron-right" size={24} color="#999" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>設定</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => 
                renderSettingItem(item, itemIndex === section.items.length - 1)
              )}
            </View>
          </View>
        ))}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>虫マップ</Text>
          <Text style={styles.footerSubtext}>昆虫発見・記録アプリ</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    marginLeft: 16,
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    color: '#333',
  },
  settingItemSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  footerSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});

export default SettingsScreen;