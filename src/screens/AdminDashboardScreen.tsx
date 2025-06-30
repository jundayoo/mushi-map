import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Switch,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CommercialDesign } from '../styles/CommercialDesignSystem';
import { adminService, SystemStats, AdminUser, UserManagementData, PostModerationData } from '../services/adminService';

const { width } = Dimensions.get('window');

interface AdminDashboardScreenProps {
  onLogout: () => void;
}

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onLogout }) => {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'posts' | 'system' | 'analytics'>('overview');
  const [users, setUsers] = useState<UserManagementData[]>([]);
  const [posts, setPosts] = useState<PostModerationData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const admin = await adminService.getCurrentAdmin();
      setCurrentAdmin(admin);

      if (admin) {
        const [statsData, usersData, postsData] = await Promise.all([
          adminService.getSystemStats(),
          adminService.getUserManagementData(),
          adminService.getPostModerationData(),
        ]);

        setStats(statsData);
        setUsers(usersData);
        setPosts(postsData);
      }
    } catch (error) {
      console.error('管理者データ読み込みエラー:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  };

  const handleUserAction = async (userId: string, action: string) => {
    const result = await adminService.executeUserAction(userId, action as any);
    Alert.alert(
      result.success ? '成功' : 'エラー',
      result.message
    );
    if (result.success) {
      await loadAdminData();
    }
  };

  const handlePostAction = async (postId: string, action: string) => {
    const result = await adminService.executePostAction(postId, action as any);
    Alert.alert(
      result.success ? '成功' : 'エラー',
      result.message
    );
    if (result.success) {
      await loadAdminData();
    }
  };

  const sendNotification = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      Alert.alert('エラー', 'タイトルとメッセージを入力してください');
      return;
    }

    const result = await adminService.sendAdminNotification(
      'announcement',
      notificationTitle,
      notificationMessage
    );

    Alert.alert(
      result.success ? '送信完了' : 'エラー',
      result.message
    );

    if (result.success) {
      setShowNotificationModal(false);
      setNotificationTitle('');
      setNotificationMessage('');
    }
  };

  const performCleanup = async () => {
    Alert.alert(
      'システムクリーンアップ',
      '本当にクリーンアップを実行しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '実行',
          style: 'destructive',
          onPress: async () => {
            const result = await adminService.performSystemCleanup();
            Alert.alert(
              result.success ? '完了' : 'エラー',
              result.success ? 
                `${result.message}\n\n${result.details.join('\n')}` : 
                result.message
            );
          },
        },
      ]
    );
  };

  const renderStatsCard = (title: string, value: string | number, icon: string, color: string, subtitle?: string) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsCardContent}>
        <View style={styles.statsCardLeft}>
          <Text style={styles.statsCardTitle}>{title}</Text>
          <Text style={styles.statsCardValue}>{value}</Text>
          {subtitle && <Text style={styles.statsCardSubtitle}>{subtitle}</Text>}
        </View>
        <View style={[styles.statsCardIcon, { backgroundColor: color + '20' }]}>
          <MaterialIcons name={icon as any} size={32} color={color} />
        </View>
      </View>
    </View>
  );

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {stats && (
        <>
          {/* 主要統計 */}
          <Text style={styles.sectionTitle}>📊 主要統計</Text>
          <View style={styles.statsGrid}>
            {renderStatsCard(
              '総ユーザー数',
              stats.users.total,
              'people',
              CommercialDesign.colors.primary[500],
              `今日 +${stats.users.newToday}`
            )}
            {renderStatsCard(
              '総投稿数',
              stats.posts.total,
              'photo-camera',
              CommercialDesign.colors.secondary[500],
              `今日 +${stats.posts.today}`
            )}
            {renderStatsCard(
              '総XP',
              stats.activity.totalXP.toLocaleString(),
              'trending-up',
              CommercialDesign.colors.tech[500],
              `バッジ ${stats.activity.badgesEarned}個`
            )}
            {renderStatsCard(
              'システム稼働率',
              '99.9%',
              'cloud-done',
              CommercialDesign.colors.success,
              `${stats.system.uptime}時間`
            )}
          </View>

          {/* クイックアクション */}
          <Text style={styles.sectionTitle}>⚡ クイックアクション</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: CommercialDesign.colors.primary[500] }]}
              onPress={() => setShowNotificationModal(true)}
            >
              <MaterialIcons name="campaign" size={24} color="white" />
              <Text style={styles.quickActionText}>通知送信</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: CommercialDesign.colors.secondary[500] }]}
              onPress={performCleanup}
            >
              <MaterialIcons name="cleaning-services" size={24} color="white" />
              <Text style={styles.quickActionText}>クリーンアップ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: CommercialDesign.colors.tech[500] }]}
              onPress={() => setActiveTab('analytics')}
            >
              <MaterialIcons name="analytics" size={24} color="white" />
              <Text style={styles.quickActionText}>分析</Text>
            </TouchableOpacity>
          </View>

          {/* 最近のアクティビティ */}
          <Text style={styles.sectionTitle}>📈 最近のアクティビティ</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <MaterialIcons name="person-add" size={20} color={CommercialDesign.colors.primary[500]} />
              <Text style={styles.activityText}>{stats.users.newToday}人の新規ユーザー（今日）</Text>
            </View>
            <View style={styles.activityItem}>
              <MaterialIcons name="photo-camera" size={20} color={CommercialDesign.colors.secondary[500]} />
              <Text style={styles.activityText}>{stats.posts.today}件の新規投稿（今日）</Text>
            </View>
            <View style={styles.activityItem}>
              <MaterialIcons name="flag" size={20} color={CommercialDesign.colors.error} />
              <Text style={styles.activityText}>{stats.posts.reported}件の報告済み投稿</Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderUsersTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>👥 ユーザー管理</Text>
      {users.map(user => (
        <View key={user.id} style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <MaterialIcons name="person" size={24} color={CommercialDesign.colors.gray[600]} />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.displayName}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userStats}>
                Lv.{user.level} • {user.postsCount}投稿 • {user.totalXP} XP
              </Text>
            </View>
          </View>
          <View style={styles.userActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: CommercialDesign.colors.primary[500] }]}
              onPress={() => handleUserAction(user.id, 'grant_xp')}
            >
              <MaterialIcons name="add" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: CommercialDesign.colors.warning }]}
              onPress={() => handleUserAction(user.id, 'suspend')}
            >
              <MaterialIcons name="pause" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderPostsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>📝 投稿管理</Text>
      {posts.map(post => (
        <View key={post.id} style={styles.postCard}>
          <View style={styles.postInfo}>
            <Text style={styles.postTitle} numberOfLines={1}>{post.title}</Text>
            <Text style={styles.postAuthor}>by {post.author}</Text>
            <Text style={styles.postStats}>
              ❤️ {post.likesCount} • 💬 {post.commentsCount} • 🏷️ {post.tags.join(', ')}
            </Text>
          </View>
          <View style={styles.postActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: CommercialDesign.colors.primary[500] }]}
              onPress={() => handlePostAction(post.id, 'feature')}
            >
              <MaterialIcons name="star" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: CommercialDesign.colors.error }]}
              onPress={() => handlePostAction(post.id, 'remove')}
            >
              <MaterialIcons name="delete" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderSystemTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>⚙️ システム設定</Text>
      
      <View style={styles.systemCard}>
        <Text style={styles.systemCardTitle}>アプリバージョン</Text>
        <Text style={styles.systemCardValue}>v{stats?.system.version}</Text>
      </View>

      <View style={styles.systemCard}>
        <Text style={styles.systemCardTitle}>サーバー稼働時間</Text>
        <Text style={styles.systemCardValue}>{stats?.system.uptime}時間</Text>
      </View>

      <View style={styles.systemCard}>
        <Text style={styles.systemCardTitle}>使用ストレージ</Text>
        <Text style={styles.systemCardValue}>{stats?.system.storage} GB</Text>
      </View>

      <TouchableOpacity
        style={styles.systemButton}
        onPress={performCleanup}
      >
        <LinearGradient
          colors={[CommercialDesign.colors.error, '#E53E3E']}
          style={styles.systemButtonGradient}
        >
          <MaterialIcons name="cleaning-services" size={24} color="white" />
          <Text style={styles.systemButtonText}>システムクリーンアップ</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderAnalyticsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>📈 分析データ</Text>
      
      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsTitle}>ユーザー成長率</Text>
        <Text style={styles.analyticsValue}>+15.3%</Text>
        <Text style={styles.analyticsSubtitle}>過去7日間</Text>
      </View>

      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsTitle}>投稿エンゲージメント</Text>
        <Text style={styles.analyticsValue}>4.2/投稿</Text>
        <Text style={styles.analyticsSubtitle}>平均いいね数</Text>
      </View>

      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsTitle}>アクティブユーザー</Text>
        <Text style={styles.analyticsValue}>78%</Text>
        <Text style={styles.analyticsSubtitle}>週間アクティブ率</Text>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'users': return renderUsersTab();
      case 'posts': return renderPostsTab();
      case 'system': return renderSystemTab();
      case 'analytics': return renderAnalyticsTab();
      default: return renderOverviewTab();
    }
  };

  if (!currentAdmin) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>管理者認証が必要です</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <LinearGradient
        colors={CommercialDesign.gradients.premium}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>管理者ダッシュボード</Text>
            <Text style={styles.headerSubtitle}>
              {currentAdmin.email} • {currentAdmin.role}
            </Text>
          </View>
          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* タブナビゲーション */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
      >
        {[
          { key: 'overview', label: '概要', icon: 'dashboard' },
          { key: 'users', label: 'ユーザー', icon: 'people' },
          { key: 'posts', label: '投稿', icon: 'photo-library' },
          { key: 'system', label: 'システム', icon: 'settings' },
          { key: 'analytics', label: '分析', icon: 'analytics' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? CommercialDesign.colors.primary[500] : CommercialDesign.colors.gray[600]}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.activeTabLabel,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* コンテンツ */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>

      {/* 通知送信モーダル */}
      <Modal
        visible={showNotificationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>全体通知送信</Text>
            <TouchableOpacity
              onPress={() => setShowNotificationModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialIcons name="close" size={24} color={CommercialDesign.colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>タイトル</Text>
            <TextInput
              style={styles.textInput}
              value={notificationTitle}
              onChangeText={setNotificationTitle}
              placeholder="通知のタイトルを入力"
            />

            <Text style={styles.inputLabel}>メッセージ</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notificationMessage}
              onChangeText={setNotificationMessage}
              placeholder="通知メッセージを入力"
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendNotification}
            >
              <LinearGradient
                colors={CommercialDesign.gradients.primaryButton}
                style={styles.sendButtonGradient}
              >
                <MaterialIcons name="send" size={24} color="white" />
                <Text style={styles.sendButtonText}>送信</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CommercialDesign.colors.background.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: CommercialDesign.colors.error,
  },

  // ヘッダー
  header: {
    paddingTop: 50,
    paddingBottom: CommercialDesign.spacing.lg,
    paddingHorizontal: CommercialDesign.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  logoutButton: {
    padding: CommercialDesign.spacing.sm,
  },

  // タブバー
  tabBar: {
    backgroundColor: 'white',
    paddingVertical: CommercialDesign.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: CommercialDesign.colors.gray[200],
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CommercialDesign.spacing.md,
    paddingVertical: CommercialDesign.spacing.sm,
    marginHorizontal: CommercialDesign.spacing.xs,
    borderRadius: CommercialDesign.borders.radius.medium,
  },
  activeTab: {
    backgroundColor: CommercialDesign.colors.primary[50],
  },
  tabLabel: {
    marginLeft: CommercialDesign.spacing.xs,
    fontSize: 14,
    fontWeight: '500',
    color: CommercialDesign.colors.gray[600],
  },
  activeTabLabel: {
    color: CommercialDesign.colors.primary[500],
  },

  // コンテンツ
  content: {
    flex: 1,
  },
  tabContent: {
    padding: CommercialDesign.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CommercialDesign.colors.text.primary,
    marginBottom: CommercialDesign.spacing.md,
  },

  // 統計カード
  statsGrid: {
    marginBottom: CommercialDesign.spacing.xl,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    marginBottom: CommercialDesign.spacing.md,
    borderLeftWidth: 4,
    ...CommercialDesign.shadows.card,
  },
  statsCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: CommercialDesign.spacing.lg,
  },
  statsCardLeft: {
    flex: 1,
  },
  statsCardTitle: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
    marginBottom: 4,
  },
  statsCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: CommercialDesign.colors.text.primary,
  },
  statsCardSubtitle: {
    fontSize: 12,
    color: CommercialDesign.colors.text.tertiary,
    marginTop: 2,
  },
  statsCardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // クイックアクション
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: CommercialDesign.spacing.xl,
  },
  quickActionButton: {
    flex: 1,
    height: 60,
    borderRadius: CommercialDesign.borders.radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: CommercialDesign.spacing.xs,
    ...CommercialDesign.shadows.button,
  },
  quickActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  // アクティビティ
  activityCard: {
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.lg,
    ...CommercialDesign.shadows.card,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: CommercialDesign.spacing.md,
  },
  activityText: {
    marginLeft: CommercialDesign.spacing.sm,
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
  },

  // ユーザーカード
  userCard: {
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.md,
    marginBottom: CommercialDesign.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...CommercialDesign.shadows.card,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CommercialDesign.colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: CommercialDesign.spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: CommercialDesign.colors.text.primary,
  },
  userEmail: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
  },
  userStats: {
    fontSize: 12,
    color: CommercialDesign.colors.text.tertiary,
    marginTop: 2,
  },
  userActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: CommercialDesign.spacing.xs,
  },

  // 投稿カード
  postCard: {
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.md,
    marginBottom: CommercialDesign.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...CommercialDesign.shadows.card,
  },
  postInfo: {
    flex: 1,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CommercialDesign.colors.text.primary,
  },
  postAuthor: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
  },
  postStats: {
    fontSize: 12,
    color: CommercialDesign.colors.text.tertiary,
    marginTop: 2,
  },
  postActions: {
    flexDirection: 'row',
  },

  // システムカード
  systemCard: {
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.lg,
    marginBottom: CommercialDesign.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...CommercialDesign.shadows.card,
  },
  systemCardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: CommercialDesign.colors.text.primary,
  },
  systemCardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: CommercialDesign.colors.primary[500],
  },
  systemButton: {
    marginTop: CommercialDesign.spacing.lg,
  },
  systemButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: CommercialDesign.spacing.md,
    borderRadius: CommercialDesign.borders.radius.medium,
  },
  systemButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: CommercialDesign.spacing.sm,
  },

  // 分析カード
  analyticsCard: {
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.lg,
    marginBottom: CommercialDesign.spacing.md,
    alignItems: 'center',
    ...CommercialDesign.shadows.card,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: CommercialDesign.colors.text.secondary,
    marginBottom: CommercialDesign.spacing.sm,
  },
  analyticsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: CommercialDesign.colors.primary[500],
  },
  analyticsSubtitle: {
    fontSize: 14,
    color: CommercialDesign.colors.text.tertiary,
    marginTop: 4,
  },

  // モーダル
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: CommercialDesign.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: CommercialDesign.colors.gray[200],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: CommercialDesign.colors.text.primary,
  },
  modalCloseButton: {
    padding: CommercialDesign.spacing.sm,
  },
  modalContent: {
    flex: 1,
    padding: CommercialDesign.spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: CommercialDesign.colors.text.primary,
    marginBottom: CommercialDesign.spacing.sm,
    marginTop: CommercialDesign.spacing.md,
  },
  textInput: {
    borderWidth: 1,
    borderColor: CommercialDesign.colors.gray[300],
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.md,
    fontSize: 16,
    color: CommercialDesign.colors.text.primary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    marginTop: CommercialDesign.spacing.xl,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: CommercialDesign.spacing.md,
    borderRadius: CommercialDesign.borders.radius.medium,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: CommercialDesign.spacing.sm,
  },
});

export default AdminDashboardScreen;