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
import { errorReportingService, ErrorReport } from '../services/errorReportingService';

interface ErrorDashboardScreenProps {
  onBack: () => void;
}

interface ErrorStats {
  totalReports: number;
  pendingUpload: number;
  recentErrors: number;
  topErrors: Array<{ message: string; count: number }>;
}

interface HealthStatus {
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
}

const ErrorDashboardScreen: React.FC<ErrorDashboardScreenProps> = ({ onBack }) => {
  const [errorStats, setErrorStats] = useState<ErrorStats>({
    totalReports: 0,
    pendingUpload: 0,
    recentErrors: 0,
    topErrors: [],
  });
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    isHealthy: true,
    issues: [],
    recommendations: [],
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [stats, health] = await Promise.all([
        errorReportingService.getErrorStats(),
        errorReportingService.performHealthCheck(),
      ]);
      
      setErrorStats(stats);
      setHealthStatus(health);
    } catch (error) {
      console.error('ダッシュボードデータ読み込みエラー:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleClearReports = () => {
    Alert.alert(
      'エラーレポート削除',
      'すべてのエラーレポートを削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            await errorReportingService.clearAllReports();
            await loadDashboardData();
            Alert.alert('完了', 'すべてのエラーレポートを削除しました');
          },
        },
      ]
    );
  };

  const handleTestError = () => {
    // デモ用のテストエラー
    const testError = new Error('これはテスト用のエラーです');
    errorReportingService.reportError(testError, {
      level: 'error',
      type: 'error',
      component: 'ErrorDashboard',
      context: { testMode: true },
    });
    
    Alert.alert('テストエラー', 'テスト用のエラーレポートを生成しました');
    setTimeout(() => loadDashboardData(), 1000);
  };

  const handleTestCrash = () => {
    Alert.alert(
      'クラッシュテスト',
      'テスト用のクラッシュレポートを生成しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '実行',
          onPress: () => {
            errorReportingService.reportCrash({
              lastJSException: 'Test crash simulation',
              appState: 'active',
              isNativeCrash: false,
            });
            Alert.alert('完了', 'テスト用のクラッシュレポートを生成しました');
            setTimeout(() => loadDashboardData(), 1000);
          },
        },
      ]
    );
  };

  const getHealthColor = () => {
    if (healthStatus.isHealthy) return CommercialDesign.colors.success;
    return errorStats.recentErrors > 5 ? CommercialDesign.colors.error : CommercialDesign.colors.warning;
  };

  const getHealthIcon = () => {
    if (healthStatus.isHealthy) return 'check-circle';
    return errorStats.recentErrors > 5 ? 'error' : 'warning';
  };

  const renderHealthStatus = () => (
    <View style={[styles.healthCard, { borderLeftColor: getHealthColor() }]}>
      <View style={styles.healthHeader}>
        <MaterialIcons name={getHealthIcon()} size={24} color={getHealthColor()} />
        <Text style={styles.healthTitle}>
          {healthStatus.isHealthy ? 'アプリは正常です' : 'アプリに問題があります'}
        </Text>
      </View>
      
      {!healthStatus.isHealthy && (
        <>
          {healthStatus.issues.length > 0 && (
            <View style={styles.healthSection}>
              <Text style={styles.healthSectionTitle}>⚠️ 問題</Text>
              {healthStatus.issues.map((issue, index) => (
                <Text key={index} style={styles.healthIssue}>• {issue}</Text>
              ))}
            </View>
          )}
          
          {healthStatus.recommendations.length > 0 && (
            <View style={styles.healthSection}>
              <Text style={styles.healthSectionTitle}>💡 推奨事項</Text>
              {healthStatus.recommendations.map((rec, index) => (
                <Text key={index} style={styles.healthRecommendation}>• {rec}</Text>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderStatsGrid = () => (
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <MaterialIcons name="bug-report" size={24} color={CommercialDesign.colors.primary[500]} />
        <Text style={styles.statValue}>{errorStats.totalReports}</Text>
        <Text style={styles.statLabel}>総エラー数</Text>
      </View>
      
      <View style={styles.statCard}>
        <MaterialIcons name="cloud-upload" size={24} color={CommercialDesign.colors.warning} />
        <Text style={styles.statValue}>{errorStats.pendingUpload}</Text>
        <Text style={styles.statLabel}>未送信</Text>
      </View>
      
      <View style={styles.statCard}>
        <MaterialIcons name="schedule" size={24} color={CommercialDesign.colors.error} />
        <Text style={styles.statValue}>{errorStats.recentErrors}</Text>
        <Text style={styles.statLabel}>24時間以内</Text>
      </View>
      
      <View style={styles.statCard}>
        <MaterialIcons name="trending-up" size={24} color={CommercialDesign.colors.secondary[500]} />
        <Text style={styles.statValue}>
          {errorStats.recentErrors > 0 ? Math.round((errorStats.recentErrors / errorStats.totalReports) * 100) : 0}%
        </Text>
        <Text style={styles.statLabel}>最近のエラー率</Text>
      </View>
    </View>
  );

  const renderTopErrors = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🔥 よく発生するエラー</Text>
      
      {errorStats.topErrors.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="check-circle" size={48} color={CommercialDesign.colors.success} />
          <Text style={styles.emptyStateText}>エラーはありません</Text>
        </View>
      ) : (
        <View style={styles.errorsList}>
          {errorStats.topErrors.map((error, index) => (
            <View key={index} style={styles.errorItem}>
              <View style={styles.errorHeader}>
                <MaterialIcons 
                  name="error-outline" 
                  size={20} 
                  color={CommercialDesign.colors.error} 
                />
                <Text style={styles.errorCount}>{error.count}回</Text>
              </View>
              <Text style={styles.errorMessage} numberOfLines={2}>
                {error.message}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🛠️ デバッグ操作</Text>
      
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionButton} onPress={handleTestError}>
          <MaterialIcons name="bug-report" size={20} color={CommercialDesign.colors.primary[500]} />
          <Text style={styles.actionButtonText}>テストエラー</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleTestCrash}>
          <MaterialIcons name="warning" size={20} color={CommercialDesign.colors.warning} />
          <Text style={styles.actionButtonText}>クラッシュテスト</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerButton]} 
          onPress={handleClearReports}
        >
          <MaterialIcons name="delete-forever" size={20} color={CommercialDesign.colors.error} />
          <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
            レポート削除
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleRefresh}>
          <MaterialIcons name="refresh" size={20} color={CommercialDesign.colors.tech[500]} />
          <Text style={styles.actionButtonText}>データ更新</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderErrorReportingInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>ℹ️ エラーレポート機能について</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoItem}>
          <MaterialIcons name="auto-fix-high" size={16} color={CommercialDesign.colors.primary[500]} />
          <Text style={styles.infoText}>自動エラー検出とレポート生成</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="cloud-sync" size={16} color={CommercialDesign.colors.primary[500]} />
          <Text style={styles.infoText}>オンライン時にサーバーへ自動送信</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="privacy-tip" size={16} color={CommercialDesign.colors.primary[500]} />
          <Text style={styles.infoText}>個人情報を除外した安全なレポート</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="timeline" size={16} color={CommercialDesign.colors.primary[500]} />
          <Text style={styles.infoText}>ユーザー操作履歴の記録</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="healing" size={16} color={CommercialDesign.colors.primary[500]} />
          <Text style={styles.infoText}>アプリの安定性向上に活用</Text>
        </View>
      </View>
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
          <Text style={styles.headerTitle}>エラーダッシュボード</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderHealthStatus()}
        {renderStatsGrid()}
        {renderTopErrors()}
        {renderActions()}
        {renderErrorReportingInfo()}
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

  // ヘルスステータス
  healthCard: {
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.lg,
    marginTop: CommercialDesign.spacing.lg,
    borderLeftWidth: 4,
    ...CommercialDesign.shadows.card,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: CommercialDesign.spacing.md,
  },
  healthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: CommercialDesign.colors.text.primary,
    marginLeft: CommercialDesign.spacing.sm,
  },
  healthSection: {
    marginTop: CommercialDesign.spacing.md,
  },
  healthSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: CommercialDesign.colors.text.primary,
    marginBottom: CommercialDesign.spacing.sm,
  },
  healthIssue: {
    fontSize: 14,
    color: CommercialDesign.colors.error,
    marginBottom: 4,
  },
  healthRecommendation: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
    marginBottom: 4,
  },

  // 統計グリッド
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: CommercialDesign.spacing.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.md,
    alignItems: 'center',
    marginBottom: CommercialDesign.spacing.md,
    ...CommercialDesign.shadows.card,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: CommercialDesign.colors.text.primary,
    marginTop: CommercialDesign.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: CommercialDesign.colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },

  // セクション
  section: {
    marginTop: CommercialDesign.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CommercialDesign.colors.text.primary,
    marginBottom: CommercialDesign.spacing.md,
  },

  // エラーリスト
  errorsList: {
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    ...CommercialDesign.shadows.card,
  },
  errorItem: {
    padding: CommercialDesign.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: CommercialDesign.colors.gray[200],
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: CommercialDesign.spacing.xs,
  },
  errorCount: {
    fontSize: 14,
    fontWeight: '600',
    color: CommercialDesign.colors.error,
    backgroundColor: CommercialDesign.colors.error + '20',
    paddingHorizontal: CommercialDesign.spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
    lineHeight: 18,
  },

  // アクショングリッド
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.md,
    marginBottom: CommercialDesign.spacing.md,
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

export default ErrorDashboardScreen;