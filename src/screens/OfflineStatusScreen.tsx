import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CommercialDesign } from '../styles/CommercialDesignSystem';
import { offlineService, CacheStats, OfflineAction } from '../services/offlineService';

interface OfflineStatusScreenProps {
  onBack: () => void;
}

const OfflineStatusScreen: React.FC<OfflineStatusScreenProps> = ({ onBack }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    totalItems: 0,
    totalSize: 0,
    expiredItems: 0,
    diskUsage: '0 B',
    lastCleanup: 0,
  });
  const [offlineActions, setOfflineActions] = useState<OfflineAction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);

  useEffect(() => {
    loadData();
    
    // 接続状態監視
    const connectionListener = (connected: boolean) => {
      setIsOnline(connected);
    };
    
    offlineService.addConnectionListener(connectionListener);
    
    return () => {
      offlineService.removeConnectionListener(connectionListener);
    };
  }, []);

  const loadData = async () => {
    try {
      const [stats, actions, connectionStatus] = await Promise.all([
        offlineService.getCacheStats(),
        offlineService.getOfflineActions(),
        offlineService.getConnectionStatus(),
      ]);
      
      setCacheStats(stats);
      setOfflineActions(actions);
      setIsOnline(connectionStatus);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSyncOfflineActions = async () => {
    if (!isOnline) {
      Alert.alert('オフライン', 'インターネット接続が必要です');
      return;
    }

    setSyncInProgress(true);
    try {
      const result = await offlineService.syncOfflineActions();
      await loadData();
      
      Alert.alert(
        '同期完了',
        `成功: ${result.success}件\n失敗: ${result.failed}件`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('エラー', '同期に失敗しました');
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleCleanupCache = async () => {
    Alert.alert(
      'キャッシュクリーンアップ',
      '期限切れのキャッシュを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          onPress: async () => {
            const result = await offlineService.cleanupExpiredCache();
            await loadData();
            
            Alert.alert(
              'クリーンアップ完了',
              `${result.removed}件のアイテムを削除しました\n${formatBytes(result.freedBytes)}の容量を解放しました`,
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const handleClearAllCache = async () => {
    Alert.alert(
      '全キャッシュ削除',
      'すべてのキャッシュを削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            const success = await offlineService.clearAllCache();
            if (success) {
              await loadData();
              Alert.alert('完了', 'すべてのキャッシュを削除しました');
            } else {
              Alert.alert('エラー', 'キャッシュ削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getActionIcon = (type: OfflineAction['type']) => {
    switch (type) {
      case 'create': return 'add-circle';
      case 'update': return 'edit';
      case 'delete': return 'delete';
      case 'like': return 'favorite';
      case 'comment': return 'comment';
      default: return 'sync';
    }
  };

  const getActionColor = (retryCount: number, maxRetries: number) => {
    if (retryCount === 0) return CommercialDesign.colors.primary[500];
    if (retryCount < maxRetries * 0.5) return CommercialDesign.colors.warning;
    return CommercialDesign.colors.error;
  };

  const renderConnectionStatus = () => (
    <View style={[styles.statusCard, isOnline ? styles.onlineCard : styles.offlineCard]}>
      <View style={styles.statusHeader}>
        <MaterialIcons 
          name={isOnline ? 'wifi' : 'wifi-off'} 
          size={24} 
          color={isOnline ? CommercialDesign.colors.success : CommercialDesign.colors.error} 
        />
        <Text style={styles.statusTitle}>
          {isOnline ? 'オンライン' : 'オフライン'}
        </Text>
      </View>
      <Text style={styles.statusDescription}>
        {isOnline 
          ? 'インターネットに接続されています' 
          : 'オフラインモードで動作中です'}
      </Text>
    </View>
  );

  const renderCacheStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📊 キャッシュ統計</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <MaterialIcons name="storage" size={20} color={CommercialDesign.colors.primary[500]} />
          <Text style={styles.statValue}>{cacheStats.totalItems}</Text>
          <Text style={styles.statLabel}>アイテム数</Text>
        </View>
        
        <View style={styles.statItem}>
          <MaterialIcons name="data-usage" size={20} color={CommercialDesign.colors.secondary[500]} />
          <Text style={styles.statValue}>{cacheStats.diskUsage}</Text>
          <Text style={styles.statLabel}>使用容量</Text>
        </View>
        
        <View style={styles.statItem}>
          <MaterialIcons name="schedule" size={20} color={CommercialDesign.colors.warning} />
          <Text style={styles.statValue}>{cacheStats.expiredItems}</Text>
          <Text style={styles.statLabel}>期限切れ</Text>
        </View>
        
        <View style={styles.statItem}>
          <MaterialIcons name="cleaning-services" size={20} color={CommercialDesign.colors.tech[500]} />
          <Text style={styles.statValue}>
            {cacheStats.lastCleanup ? new Date(cacheStats.lastCleanup).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }) : 'なし'}
          </Text>
          <Text style={styles.statLabel}>最終整理</Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCleanupCache}>
          <MaterialIcons name="cleaning-services" size={18} color={CommercialDesign.colors.primary[500]} />
          <Text style={styles.actionButtonText}>期限切れ削除</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={handleClearAllCache}>
          <MaterialIcons name="delete-forever" size={18} color={CommercialDesign.colors.error} />
          <Text style={[styles.actionButtonText, styles.dangerButtonText]}>全削除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOfflineActions = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📱 オフライン操作</Text>
        {offlineActions.length > 0 && isOnline && (
          <TouchableOpacity 
            style={styles.syncButton} 
            onPress={handleSyncOfflineActions}
            disabled={syncInProgress}
          >
            <MaterialIcons 
              name={syncInProgress ? 'hourglass-empty' : 'sync'} 
              size={18} 
              color="white" 
            />
            <Text style={styles.syncButtonText}>
              {syncInProgress ? '同期中...' : '同期'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {offlineActions.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="check-circle" size={48} color={CommercialDesign.colors.success} />
          <Text style={styles.emptyStateText}>同期待ちの操作はありません</Text>
        </View>
      ) : (
        <View style={styles.actionsList}>
          {offlineActions.map((action) => (
            <View key={action.id} style={styles.actionItem}>
              <View style={styles.actionHeader}>
                <MaterialIcons 
                  name={getActionIcon(action.type)} 
                  size={20} 
                  color={getActionColor(action.retryCount, action.maxRetries)} 
                />
                <Text style={styles.actionType}>{action.type.toUpperCase()}</Text>
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>
                    {action.retryCount}/{action.maxRetries}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.actionEndpoint}>{action.endpoint}</Text>
              <Text style={styles.actionTimestamp}>
                {new Date(action.timestamp).toLocaleString('ja-JP')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <LinearGradient
        colors={CommercialDesign.gradients.primaryButton}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>オフライン・キャッシュ</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderConnectionStatus()}
        {renderCacheStats()}
        {renderOfflineActions()}

        {/* 機能説明 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ オフライン機能について</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <MaterialIcons name="offline-bolt" size={16} color={CommercialDesign.colors.primary[500]} />
              <Text style={styles.infoText}>
                オフライン時でも投稿・いいね・コメントが可能
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="cached" size={16} color={CommercialDesign.colors.primary[500]} />
              <Text style={styles.infoText}>
                よく見るコンテンツを自動でキャッシュ
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="sync" size={16} color={CommercialDesign.colors.primary[500]} />
              <Text style={styles.infoText}>
                オンライン復帰時に自動で同期
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="storage" size={16} color={CommercialDesign.colors.primary[500]} />
              <Text style={styles.infoText}>
                最大50MBまでのキャッシュ容量
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CommercialDesign.colors.background.primary,
  },

  // ヘッダー
  header: {
    paddingTop: CommercialDesign.spacing.md,
    paddingBottom: CommercialDesign.spacing.lg,
    paddingHorizontal: CommercialDesign.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  // コンテンツ
  content: {
    flex: 1,
    paddingHorizontal: CommercialDesign.spacing.lg,
  },

  // ステータスカード
  statusCard: {
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.lg,
    marginTop: CommercialDesign.spacing.lg,
    ...CommercialDesign.shadows.card,
  },
  onlineCard: {
    backgroundColor: CommercialDesign.colors.success + '10',
    borderLeftWidth: 4,
    borderLeftColor: CommercialDesign.colors.success,
  },
  offlineCard: {
    backgroundColor: CommercialDesign.colors.error + '10',
    borderLeftWidth: 4,
    borderLeftColor: CommercialDesign.colors.error,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: CommercialDesign.spacing.sm,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: CommercialDesign.colors.text.primary,
    marginLeft: CommercialDesign.spacing.sm,
  },
  statusDescription: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
  },

  // セクション
  section: {
    marginVertical: CommercialDesign.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: CommercialDesign.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CommercialDesign.colors.text.primary,
  },

  // 統計グリッド
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: CommercialDesign.spacing.lg,
  },
  statItem: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.md,
    alignItems: 'center',
    marginBottom: CommercialDesign.spacing.md,
    ...CommercialDesign.shadows.card,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: CommercialDesign.colors.text.primary,
    marginTop: CommercialDesign.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: CommercialDesign.colors.text.secondary,
    marginTop: 2,
  },

  // ボタン行
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.md,
    marginHorizontal: CommercialDesign.spacing.xs,
    ...CommercialDesign.shadows.card,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: CommercialDesign.colors.error + '30',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: CommercialDesign.colors.text.primary,
    marginLeft: CommercialDesign.spacing.xs,
  },
  dangerButtonText: {
    color: CommercialDesign.colors.error,
  },

  // 同期ボタン
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CommercialDesign.colors.primary[500],
    borderRadius: CommercialDesign.borders.radius.small,
    paddingHorizontal: CommercialDesign.spacing.md,
    paddingVertical: CommercialDesign.spacing.sm,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: CommercialDesign.spacing.xs,
  },

  // オフラインアクション
  actionsList: {
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    ...CommercialDesign.shadows.card,
  },
  actionItem: {
    padding: CommercialDesign.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: CommercialDesign.colors.gray[200],
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: CommercialDesign.spacing.xs,
  },
  actionType: {
    fontSize: 14,
    fontWeight: '600',
    color: CommercialDesign.colors.text.primary,
    marginLeft: CommercialDesign.spacing.sm,
    flex: 1,
  },
  actionBadge: {
    backgroundColor: CommercialDesign.colors.gray[200],
    borderRadius: 10,
    paddingHorizontal: CommercialDesign.spacing.xs,
    paddingVertical: 2,
  },
  actionBadgeText: {
    fontSize: 10,
    color: CommercialDesign.colors.text.secondary,
    fontWeight: '500',
  },
  actionEndpoint: {
    fontSize: 12,
    color: CommercialDesign.colors.text.secondary,
    marginBottom: 2,
  },
  actionTimestamp: {
    fontSize: 11,
    color: CommercialDesign.colors.text.tertiary,
  },

  // 空の状態
  emptyState: {
    alignItems: 'center',
    paddingVertical: CommercialDesign.spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    color: CommercialDesign.colors.text.secondary,
    marginTop: CommercialDesign.spacing.md,
  },

  // 情報カード
  infoCard: {
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.lg,
    ...CommercialDesign.shadows.card,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: CommercialDesign.spacing.md,
  },
  infoText: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
    marginLeft: CommercialDesign.spacing.sm,
    flex: 1,
  },
});

export default OfflineStatusScreen;