import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from '../services/notificationService';
import { adminService, AdminUser } from '../services/adminService';
import { legalService } from '../services/legalService';
import NotificationCenter from '../components/NotificationCenter';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import LegalConsentScreen from '../screens/LegalConsentScreen';

// ヒーローセクション
import WelcomeHeroScreen from '../screens/WelcomeHeroScreen';

// 商用レベル画面
import PremiumAddScreen from '../screens/PremiumAddScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatRoomsScreen from '../screens/ChatRoomsScreen';
import LiveStreamingScreen from '../screens/LiveStreamingScreen';
import CollaborativeDiscoveryScreen from '../screens/CollaborativeDiscoveryScreen';

// デザインシステム
import { CommercialDesign } from '../styles/CommercialDesignSystem';

export type RootStackParamList = {
  Welcome: undefined;
  MainTabs: undefined;
  InsectDetail: { insect: any };
  MapView: undefined;
  Achievements: undefined;
  Leaderboard: undefined;
  Collection: undefined;
  ChatRooms: undefined;
  LiveStreaming: undefined;
  CollaborativeDiscovery: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

// 🎨 商用レベルタブバー
function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8F9FA']}
      style={{
        flexDirection: 'row',
        height: 80,
        paddingBottom: 20,
        paddingTop: 10,
        paddingHorizontal: 16,
        ...CommercialDesign.shadows.floating,
      }}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // アイコンマッピング
        const iconMap: { [key: string]: keyof typeof MaterialIcons.glyphMap } = {
          Discover: 'add-circle',
          Chat: 'chat',
          Live: 'videocam',
          Profile: 'person',
        };

        const icon = iconMap[route.name] || 'home';
        const badgeMap: { [key: string]: string } = {
          Discover: '🔥',
          Chat: '3',
          Live: '🔴',
          Profile: '',
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            {isFocused ? (
              <LinearGradient
                colors={CommercialDesign.gradients.primaryButton}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 4,
                  ...CommercialDesign.shadows.button,
                }}
              >
                <MaterialIcons name={icon} size={24} color="white" />
              </LinearGradient>
            ) : (
              <View
                style={{
                  width: 48,
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 4,
                  position: 'relative',
                }}
              >
                <MaterialIcons 
                  name={icon} 
                  size={24} 
                  color={CommercialDesign.colors.gray[500]} 
                />
                {badgeMap[route.name] && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      backgroundColor: CommercialDesign.colors.error,
                      borderRadius: 10,
                      minWidth: 16,
                      height: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                    >
                      {badgeMap[route.name]}
                    </Text>
                  </View>
                )}
              </View>
            )}
            <Text
              style={{
                fontSize: 12,
                fontWeight: isFocused ? '600' : '400',
                color: isFocused 
                  ? CommercialDesign.colors.primary[500] 
                  : CommercialDesign.colors.gray[500],
                textAlign: 'center',
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </LinearGradient>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Discover" 
        component={PremiumAddScreen}
        options={{ 
          tabBarLabel: '📷 発見',
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatRoomsScreen}
        options={{ 
          tabBarLabel: '💬 チャット',
        }}
      />
      <Tab.Screen 
        name="Live" 
        component={LiveStreamingScreen}
        options={{ 
          tabBarLabel: '📺 ライブ',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          tabBarLabel: '👤 プロフィール',
        }}
      />
    </Tab.Navigator>
  );
}

export default function CommercialNavigator() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [needsLegalConsent, setNeedsLegalConsent] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkFirstTime();
    setupNotifications();
    checkAdminSession();
    checkLegalConsent();
  }, []);

  const checkAdminSession = async () => {
    const admin = await adminService.getCurrentAdmin();
    if (admin) {
      setCurrentAdmin(admin);
    }
  };

  const checkLegalConsent = async () => {
    try {
      // 現在のユーザーを取得
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // 法的同意が必要かチェック
        const needsConsent = await legalService.needsConsent(user.id);
        setNeedsLegalConsent(needsConsent);
        
        if (needsConsent) {
          console.log('📜 法的同意が必要です');
        }
      }
    } catch (error) {
      console.error('法的同意チェックエラー:', error);
    }
  };

  const setupNotifications = async () => {
    // 通知権限リクエスト
    await notificationService.requestPermissions();
    
    // 未読通知数リスナー
    notificationService.addListener((notifications) => {
      const unread = notifications.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    });
    
    setUnreadCount(notificationService.getUnreadCount());
  };

  const checkFirstTime = async () => {
    try {
      const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
      if (hasSeenWelcome === 'true') {
        setShowWelcome(false);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('初回起動チェックエラー:', error);
      setIsLoading(false);
    }
  };

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
      setShowWelcome(false);
    } catch (error) {
      console.error('初回起動フラグ保存エラー:', error);
      setShowWelcome(false);
    }
  };

  const handleAdminLogin = (admin: AdminUser) => {
    setCurrentAdmin(admin);
    setShowAdminLogin(false);
    console.log('🔑 管理者ログイン:', admin.email);
  };

  const handleAdminLogout = async () => {
    await adminService.adminLogout();
    setCurrentAdmin(null);
    console.log('🚪 管理者ログアウト');
  };

  // 隠し管理者アクセス（ロゴを7回タップ）
  const handleLogoTap = () => {
    setAdminTapCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 7) {
        setShowAdminLogin(true);
        return 0;
      }
      
      // カウントリセット（5秒後）
      setTimeout(() => setAdminTapCount(0), 5000);
      return newCount;
    });
  };

  const handleLegalConsentComplete = () => {
    setNeedsLegalConsent(false);
    console.log('✅ 法的同意完了');
  };

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: CommercialDesign.colors.primary[500],
      }}>
        <TouchableOpacity onPress={handleLogoTap} activeOpacity={0.8}>
          <MaterialIcons name="eco" size={64} color="white" />
        </TouchableOpacity>
        <Text style={{ 
          color: 'white', 
          fontSize: 18, 
          fontWeight: '600',
          marginTop: 16,
        }}>
          むしマップ起動中...
        </Text>
        {adminTapCount > 0 && (
          <Text style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: 12,
            marginTop: 8,
          }}>
            管理者モード: {adminTapCount}/7
          </Text>
        )}
      </View>
    );
  }

  // 管理者ログイン画面
  if (showAdminLogin) {
    return (
      <AdminLoginScreen
        onLoginSuccess={handleAdminLogin}
        onBack={() => setShowAdminLogin(false)}
      />
    );
  }

  // 管理者ダッシュボード
  if (currentAdmin) {
    return <AdminDashboardScreen onLogout={handleAdminLogout} />;
  }

  // 法的同意が必要
  if (needsLegalConsent && !showWelcome) {
    return (
      <LegalConsentScreen
        onConsentComplete={handleLegalConsentComplete}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName={showWelcome ? "Welcome" : "MainTabs"}
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: CommercialDesign.colors.background.primary },
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                      }),
                    },
                  ],
                },
              };
            },
          }}
        >
          {showWelcome && (
            <Stack.Screen name="Welcome">
              {() => <WelcomeHeroScreen onGetStarted={handleGetStarted} />}
            </Stack.Screen>
          )}
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="CollaborativeDiscovery" 
            component={CollaborativeDiscoveryScreen}
            options={{
              headerShown: true,
              title: '協力探索',
              headerStyle: {
                backgroundColor: CommercialDesign.colors.primary[500],
              },
              headerTintColor: 'white',
              headerTitleStyle: {
                fontWeight: '700',
              },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>

      {/* フローティングボタン */}
      {!showWelcome && (
        <View style={{
          position: 'absolute',
          top: 50,
          right: 20,
          zIndex: 1000,
        }}>
          {/* 通知ボタン */}
          <TouchableOpacity
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: CommercialDesign.colors.primary[500],
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12,
              ...CommercialDesign.shadows.floating,
            }}
            onPress={() => setShowNotifications(true)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="notifications" size={24} color="white" />
            {unreadCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: CommercialDesign.colors.error,
                  borderRadius: 12,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 管理者アクセスボタン（隠し） */}
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: CommercialDesign.colors.gray[700],
              justifyContent: 'center',
              alignItems: 'center',
              opacity: adminTapCount > 0 ? 0.8 : 0.3,
              ...CommercialDesign.shadows.card,
            }}
            onPress={handleLogoTap}
            activeOpacity={0.8}
          >
            <MaterialIcons name="admin-panel-settings" size={20} color="white" />
            {adminTapCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: CommercialDesign.colors.secondary[500],
                  borderRadius: 8,
                  minWidth: 16,
                  height: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                >
                  {adminTapCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* 通知センター */}
      <NotificationCenter
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
}