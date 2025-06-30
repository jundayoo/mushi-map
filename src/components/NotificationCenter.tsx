import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
  RefreshControl,
  Modal,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CommercialDesign } from '../styles/CommercialDesignSystem';
import { notificationService, NotificationData, NotificationSettings } from '../services/notificationService';

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'social' | 'achievement' | 'discovery'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(notificationService.getSettings());
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 通知一覧を取得
      setNotifications(notificationService.getNotifications());
      
      // リスナー登録
      notificationService.addListener(handleNotificationsUpdate);
      
      // スライドインアニメーション
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      // スライドアウト
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      notificationService.removeListener(handleNotificationsUpdate);
    };
  }, [visible]);

  const handleNotificationsUpdate = (updatedNotifications: NotificationData[]) => {
    setNotifications(updatedNotifications);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // 実際のアプリでは、サーバーから最新通知を取得
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleNotificationPress = async (notification: NotificationData) => {
    if (!notification.isRead) {
      await notificationService.markAsRead(notification.id);
    }
    
    // 通知タイプに応じた画面遷移
    switch (notification.type) {
      case 'chat_message':
        // チャット画面に遷移
        break;
      case 'new_post':
        // 投稿詳細画面に遷移
        break;
      case 'live_stream':
        // ライブ配信画面に遷移
        break;
      default:
        // デフォルト処理
        break;
    }
  };

  const getFilteredNotifications = (): NotificationData[] => {
    switch (selectedFilter) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'social':
        return notifications.filter(n => n.category === 'social');
      case 'achievement':
        return notifications.filter(n => n.category === 'achievement');
      case 'discovery':
        return notifications.filter(n => n.category === 'discovery');
      default:
        return notifications;
    }
  };

  const getNotificationIcon = (notification: NotificationData) => {
    const iconMap = {
      new_post: 'photo-camera',
      level_up: 'trending-up',
      badge_earned: 'military-tech',
      chat_message: 'chat',
      live_stream: 'videocam',
      discovery_nearby: 'location-on',
      achievement: 'emoji-events',
      system: 'info',
    };
    return iconMap[notification.type] || 'notifications';
  };

  const getNotificationColor = (notification: NotificationData) => {
    const colorMap = {
      social: CommercialDesign.colors.tech[500],
      achievement: CommercialDesign.colors.secondary[500],
      discovery: CommercialDesign.colors.primary[500],
      system: CommercialDesign.colors.gray[500],
    };
    return colorMap[notification.category] || CommercialDesign.colors.gray[500];
  };

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    
    return new Date(timestamp).toLocaleDateString('ja-JP');
  };

  const updateSetting = async (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await notificationService.updateSettings(newSettings);
  };

  const renderNotificationItem = (notification: NotificationData) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationItem,
        !notification.isRead && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        {/* アイコン */}
        <View style={[
          styles.notificationIcon,
          { backgroundColor: getNotificationColor(notification) + '20' }
        ]}>
          <MaterialIcons
            name={getNotificationIcon(notification) as any}
            size={24}
            color={getNotificationColor(notification)}
          />
        </View>

        {/* コンテンツ */}
        <View style={styles.notificationText}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTimestamp(notification.timestamp)}
            </Text>
          </View>
          
          <Text style={styles.notificationBody} numberOfLines={2}>
            {notification.body}
          </Text>

          {/* アクションボタン */}
          {notification.actionButtons && (
            <View style={styles.actionButtons}>
              {notification.actionButtons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.actionButton}
                  onPress={() => {
                    // アクション実行
                    console.log('アクション実行:', button.action);
                  }}
                >
                  <Text style={styles.actionButtonText}>{button.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 画像 */}
        {notification.imageUrl && (
          <Image
            source={{ uri: notification.imageUrl }}
            style={styles.notificationImage}
          />
        )}

        {/* 未読インジケータ */}
        {!notification.isRead && (
          <View style={styles.unreadIndicator} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilterButtons = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
    >
      {[
        { key: 'all', label: '全て', icon: 'list' },
        { key: 'unread', label: '未読', icon: 'fiber-manual-record' },
        { key: 'social', label: 'ソーシャル', icon: 'people' },
        { key: 'achievement', label: '実績', icon: 'emoji-events' },
        { key: 'discovery', label: '発見', icon: 'explore' },
      ].map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterButton,
            selectedFilter === filter.key && styles.activeFilterButton,
          ]}
          onPress={() => setSelectedFilter(filter.key as any)}
        >
          <MaterialIcons
            name={filter.icon as any}
            size={20}
            color={
              selectedFilter === filter.key
                ? 'white'
                : CommercialDesign.colors.gray[600]
            }
          />
          <Text
            style={[
              styles.filterButtonText,
              selectedFilter === filter.key && styles.activeFilterButtonText,
            ]}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderSettings = () => (
    <Modal
      visible={showSettings}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.settingsContainer}>
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsTitle}>通知設定</Text>
          <TouchableOpacity
            onPress={() => setShowSettings(false)}
            style={styles.closeButton}
          >
            <MaterialIcons name="close" size={24} color={CommercialDesign.colors.gray[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.settingsContent}>
          {/* 通知オン/オフ */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>プッシュ通知</Text>
              <Text style={styles.settingDescription}>通知を受け取る</Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => updateSetting('enabled', value)}
              trackColor={{
                false: CommercialDesign.colors.gray[300],
                true: CommercialDesign.colors.primary[300],
              }}
              thumbColor={
                settings.enabled
                  ? CommercialDesign.colors.primary[500]
                  : CommercialDesign.colors.gray[500]
              }
            />
          </View>

          {/* カテゴリー別設定 */}
          <Text style={styles.settingSectionTitle}>カテゴリー</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>ソーシャル</Text>
              <Text style={styles.settingDescription}>チャット・投稿・フォロー</Text>
            </View>
            <Switch
              value={settings.social}
              onValueChange={(value) => updateSetting('social', value)}
              trackColor={{
                false: CommercialDesign.colors.gray[300],
                true: CommercialDesign.colors.tech[300],
              }}
              thumbColor={
                settings.social
                  ? CommercialDesign.colors.tech[500]
                  : CommercialDesign.colors.gray[500]
              }
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>実績・レベル</Text>
              <Text style={styles.settingDescription}>バッジ・レベルアップ</Text>
            </View>
            <Switch
              value={settings.achievements}
              onValueChange={(value) => updateSetting('achievements', value)}
              trackColor={{
                false: CommercialDesign.colors.gray[300],
                true: CommercialDesign.colors.secondary[300],
              }}
              thumbColor={
                settings.achievements
                  ? CommercialDesign.colors.secondary[500]
                  : CommercialDesign.colors.gray[500]
              }
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>新しい発見</Text>
              <Text style={styles.settingDescription}>近くの発見・珍しい昆虫</Text>
            </View>
            <Switch
              value={settings.discoveries}
              onValueChange={(value) => updateSetting('discoveries', value)}
              trackColor={{
                false: CommercialDesign.colors.gray[300],
                true: CommercialDesign.colors.primary[300],
              }}
              thumbColor={
                settings.discoveries
                  ? CommercialDesign.colors.primary[500]
                  : CommercialDesign.colors.gray[500]
              }
            />
          </View>

          {/* サウンド・振動 */}
          <Text style={styles.settingSectionTitle}>効果</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>サウンド</Text>
              <Text style={styles.settingDescription}>通知音を再生</Text>
            </View>
            <Switch
              value={settings.sound}
              onValueChange={(value) => updateSetting('sound', value)}
              trackColor={{
                false: CommercialDesign.colors.gray[300],
                true: CommercialDesign.colors.primary[300],
              }}
              thumbColor={
                settings.sound
                  ? CommercialDesign.colors.primary[500]
                  : CommercialDesign.colors.gray[500]
              }
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>振動</Text>
              <Text style={styles.settingDescription}>バイブレーション</Text>
            </View>
            <Switch
              value={settings.vibration}
              onValueChange={(value) => updateSetting('vibration', value)}
              trackColor={{
                false: CommercialDesign.colors.gray[300],
                true: CommercialDesign.colors.primary[300],
              }}
              thumbColor={
                settings.vibration
                  ? CommercialDesign.colors.primary[500]
                  : CommercialDesign.colors.gray[500]
              }
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* ヘッダー */}
          <LinearGradient
            colors={CommercialDesign.gradients.primaryButton}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <MaterialIcons name="notifications" size={28} color="white" />
                <Text style={styles.headerTitle}>通知</Text>
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={() => setShowSettings(true)}
                  style={styles.headerButton}
                >
                  <MaterialIcons name="settings" size={24} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => notificationService.markAllAsRead()}
                  style={styles.headerButton}
                >
                  <MaterialIcons name="done-all" size={24} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.headerButton}
                >
                  <MaterialIcons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* フィルター */}
          {renderFilterButtons()}

          {/* 通知一覧 */}
          <ScrollView
            style={styles.notificationsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(renderNotificationItem)
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons
                  name="notifications-none"
                  size={64}
                  color={CommercialDesign.colors.gray[400]}
                />
                <Text style={styles.emptyStateText}>
                  {selectedFilter === 'all' ? '通知はありません' : `${selectedFilter}の通知はありません`}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* 設定モーダル */}
          {renderSettings()}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: CommercialDesign.borders.radius.xl,
    borderTopRightRadius: CommercialDesign.borders.radius.xl,
    maxHeight: '85%',
    ...CommercialDesign.shadows.floating,
  },
  
  // ヘッダー
  header: {
    borderTopLeftRadius: CommercialDesign.borders.radius.xl,
    borderTopRightRadius: CommercialDesign.borders.radius.xl,
    paddingTop: CommercialDesign.spacing.lg,
    paddingBottom: CommercialDesign.spacing.md,
    paddingHorizontal: CommercialDesign.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginLeft: CommercialDesign.spacing.sm,
  },
  unreadBadge: {
    backgroundColor: CommercialDesign.colors.secondary[500],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: CommercialDesign.spacing.sm,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: CommercialDesign.spacing.sm,
    marginLeft: CommercialDesign.spacing.sm,
  },

  // フィルター
  filterContainer: {
    paddingVertical: CommercialDesign.spacing.md,
    paddingHorizontal: CommercialDesign.spacing.lg,
    backgroundColor: CommercialDesign.colors.background.secondary,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CommercialDesign.spacing.md,
    paddingVertical: CommercialDesign.spacing.sm,
    borderRadius: CommercialDesign.borders.radius.medium,
    marginRight: CommercialDesign.spacing.sm,
    backgroundColor: 'white',
    ...CommercialDesign.shadows.card,
  },
  activeFilterButton: {
    backgroundColor: CommercialDesign.colors.primary[500],
  },
  filterButtonText: {
    marginLeft: CommercialDesign.spacing.xs,
    fontSize: 14,
    fontWeight: '500',
    color: CommercialDesign.colors.gray[600],
  },
  activeFilterButtonText: {
    color: 'white',
  },

  // 通知アイテム
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: 'white',
    marginHorizontal: CommercialDesign.spacing.lg,
    marginVertical: CommercialDesign.spacing.xs,
    borderRadius: CommercialDesign.borders.radius.medium,
    ...CommercialDesign.shadows.card,
  },
  unreadNotification: {
    backgroundColor: CommercialDesign.colors.primary[50],
    borderLeftWidth: 4,
    borderLeftColor: CommercialDesign.colors.primary[500],
  },
  notificationContent: {
    flexDirection: 'row',
    padding: CommercialDesign.spacing.md,
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: CommercialDesign.spacing.md,
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: CommercialDesign.spacing.xs,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CommercialDesign.colors.text.primary,
    flex: 1,
    marginRight: CommercialDesign.spacing.sm,
  },
  notificationTime: {
    fontSize: 12,
    color: CommercialDesign.colors.text.tertiary,
  },
  notificationBody: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
    lineHeight: 20,
  },
  notificationImage: {
    width: 48,
    height: 48,
    borderRadius: CommercialDesign.borders.radius.small,
    marginLeft: CommercialDesign.spacing.sm,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CommercialDesign.colors.primary[500],
    position: 'absolute',
    top: CommercialDesign.spacing.md,
    right: CommercialDesign.spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: CommercialDesign.spacing.sm,
  },
  actionButton: {
    backgroundColor: CommercialDesign.colors.primary[100],
    paddingHorizontal: CommercialDesign.spacing.md,
    paddingVertical: CommercialDesign.spacing.xs,
    borderRadius: CommercialDesign.borders.radius.small,
    marginRight: CommercialDesign.spacing.sm,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: CommercialDesign.colors.primary[700],
  },

  // 空状態
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: CommercialDesign.spacing.xxxxl,
  },
  emptyStateText: {
    fontSize: 16,
    color: CommercialDesign.colors.text.tertiary,
    marginTop: CommercialDesign.spacing.md,
  },

  // 設定
  settingsContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: CommercialDesign.spacing.lg,
    paddingVertical: CommercialDesign.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: CommercialDesign.colors.gray[200],
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: CommercialDesign.colors.text.primary,
  },
  closeButton: {
    padding: CommercialDesign.spacing.sm,
  },
  settingsContent: {
    flex: 1,
    paddingHorizontal: CommercialDesign.spacing.lg,
  },
  settingSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CommercialDesign.colors.text.primary,
    marginTop: CommercialDesign.spacing.lg,
    marginBottom: CommercialDesign.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: CommercialDesign.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: CommercialDesign.colors.gray[100],
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: CommercialDesign.colors.text.primary,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
  },
});

export default NotificationCenter;