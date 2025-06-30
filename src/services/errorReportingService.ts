import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { authService } from './authService';

export interface ErrorReport {
  id: string;
  timestamp: string;
  type: 'crash' | 'error' | 'warning' | 'network' | 'performance';
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  sessionId: string;
  deviceInfo: DeviceInfo;
  appInfo: AppInfo;
  context: ErrorContext;
  resolved: boolean;
  reportedToServer: boolean;
}

export interface DeviceInfo {
  platform: string;
  version: string;
  model: string;
  osVersion: string;
  appVersion: string;
  buildNumber: string;
  isEmulator: boolean;
  screenSize: { width: number; height: number };
  memoryUsage?: number;
  batteryLevel?: number;
  networkType?: string;
}

export interface AppInfo {
  version: string;
  buildNumber: string;
  environment: 'development' | 'staging' | 'production';
  bundleIdentifier: string;
  lastUpdateTime: string;
}

export interface ErrorContext {
  route?: string;
  action?: string;
  additionalData?: Record<string, any>;
  breadcrumbs: Breadcrumb[];
  userActions: UserAction[];
}

export interface Breadcrumb {
  timestamp: string;
  category: 'navigation' | 'user' | 'network' | 'system';
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

export interface UserAction {
  timestamp: string;
  type: 'tap' | 'scroll' | 'input' | 'navigation';
  target: string;
  value?: any;
}

export interface CrashReport {
  crashId: string;
  timestamp: string;
  isNativeCrash: boolean;
  jsStack?: string;
  nativeStack?: string;
  lastJSException?: string;
  appState: 'active' | 'background' | 'inactive';
  freeMemory?: number;
  usedMemory?: number;
}

class ErrorReportingService {
  private readonly ERROR_REPORTS_KEY = '@mushi_map_error_reports';
  private readonly SESSION_ID_KEY = '@mushi_map_session_id';
  private readonly MAX_REPORTS = 100;
  
  private sessionId: string = '';
  private breadcrumbs: Breadcrumb[] = [];
  private userActions: UserAction[] = [];
  private isInitialized = false;
  private originalConsoleError: any;
  private originalConsoleWarn: any;

  constructor() {
    this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  // 🚀 初期化
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // セッションIDの復元または生成
      const storedSessionId = await AsyncStorage.getItem(this.SESSION_ID_KEY);
      if (storedSessionId) {
        this.sessionId = storedSessionId;
      }

      // アプリ起動時のコンテキスト収集
      await this.collectInitialContext();
      
      // 古いエラーレポートのクリーンアップ
      await this.cleanupOldReports();
      
      // 未送信レポートの送信
      await this.uploadPendingReports();

      this.isInitialized = true;
      this.addBreadcrumb('system', 'Error reporting service initialized', 'info');
      
      console.log('🚀 エラーレポートサービス初期化完了');
    } catch (error) {
      console.error('エラーレポートサービス初期化失敗:', error);
    }
  }

  // 🛡️ グローバルエラーハンドラーの設定
  private setupGlobalErrorHandlers(): void {
    // JavaScript例外のキャッチ
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      this.reportError(error, {
        level: isFatal ? 'fatal' : 'error',
        type: isFatal ? 'crash' : 'error',
        component: 'GlobalHandler',
      });

      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });

    // Promiseの未処理rejectionをキャッチ
    const trackingOptions = { allRejections: true };
    require('promise/setimmediate/rejection-tracking').enable(trackingOptions);
    
    // コンソールエラーのインターセプト
    this.interceptConsoleErrors();
  }

  // 📋 コンソールエラーのインターセプト
  private interceptConsoleErrors(): void {
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;

    console.error = (...args) => {
      this.originalConsoleError.apply(console, args);
      
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      this.reportError(new Error(message), {
        level: 'error',
        type: 'error',
        component: 'Console',
      });
    };

    console.warn = (...args) => {
      this.originalConsoleWarn.apply(console, args);
      
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      this.reportError(new Error(message), {
        level: 'warning',
        type: 'warning',
        component: 'Console',
      });
    };
  }

  // 🆔 セッションIDの生成
  private generateSessionId(): void {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    AsyncStorage.setItem(this.SESSION_ID_KEY, this.sessionId);
  }

  // 📊 初期コンテキストの収集
  private async collectInitialContext(): Promise<void> {
    try {
      // デバイス情報の収集（実際のアプリではReact Native Device Infoを使用）
      const deviceInfo: DeviceInfo = {
        platform: 'android', // Platform.OS
        version: '14', // Platform.Version
        model: 'Simulator', // DeviceInfo.getModel()
        osVersion: '14.0', // DeviceInfo.getSystemVersion()
        appVersion: '1.0.0',
        buildNumber: '1',
        isEmulator: true,
        screenSize: { width: 393, height: 851 }, // Dimensions.get('screen')
        networkType: await this.getNetworkType(),
      };

      this.addBreadcrumb('system', 'Initial context collected', 'info', { deviceInfo });
    } catch (error) {
      console.error('初期コンテキスト収集エラー:', error);
    }
  }

  // 🌐 ネットワークタイプの取得
  private async getNetworkType(): Promise<string> {
    try {
      const state = await NetInfo.fetch();
      return state.type || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  // 🚨 エラーの報告
  async reportError(
    error: Error, 
    options: {
      level?: ErrorReport['level'];
      type?: ErrorReport['type'];
      component?: string;
      context?: Record<string, any>;
    } = {}
  ): Promise<string> {
    try {
      const user = await authService.getCurrentUser();
      
      const errorReport: ErrorReport = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type: options.type || 'error',
        level: options.level || 'error',
        message: error.message || 'Unknown error',
        stack: error.stack,
        component: options.component,
        userId: user?.id,
        sessionId: this.sessionId,
        deviceInfo: await this.getDeviceInfo(),
        appInfo: this.getAppInfo(),
        context: {
          route: this.getCurrentRoute(),
          action: this.getLastUserAction(),
          additionalData: options.context,
          breadcrumbs: [...this.breadcrumbs],
          userActions: [...this.userActions],
        },
        resolved: false,
        reportedToServer: false,
      };

      // ローカルに保存
      await this.saveErrorReport(errorReport);
      
      // 即座にサーバーに送信を試行
      await this.uploadErrorReport(errorReport);

      // 重要なエラーの場合はユーザーに通知
      if (options.level === 'fatal' || options.level === 'error') {
        this.showErrorNotification(errorReport);
      }

      console.log(`🚨 エラー報告: ${errorReport.id} - ${error.message}`);
      
      // パンくずリストに追加
      this.addBreadcrumb('system', `Error reported: ${error.message}`, 'error');
      
      return errorReport.id;
    } catch (reportingError) {
      console.error('エラー報告失敗:', reportingError);
      return '';
    }
  }

  // 💥 クラッシュの報告
  async reportCrash(crashInfo: Partial<CrashReport>): Promise<string> {
    try {
      const crashReport: CrashReport = {
        crashId: `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        isNativeCrash: false,
        appState: 'active',
        ...crashInfo,
      };

      // エラーレポートとしても記録
      const error = new Error(crashReport.lastJSException || 'Application crash');
      await this.reportError(error, {
        level: 'fatal',
        type: 'crash',
        context: { crashReport },
      });

      console.log(`💥 クラッシュ報告: ${crashReport.crashId}`);
      return crashReport.crashId;
    } catch (error) {
      console.error('クラッシュ報告失敗:', error);
      return '';
    }
  }

  // 🍞 パンくずリストの追加
  addBreadcrumb(
    category: Breadcrumb['category'],
    message: string,
    level: Breadcrumb['level'] = 'info',
    data?: Record<string, any>
  ): void {
    const breadcrumb: Breadcrumb = {
      timestamp: new Date().toISOString(),
      category,
      message,
      level,
      data,
    };

    this.breadcrumbs.push(breadcrumb);
    
    // 最新50件まで保持
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs = this.breadcrumbs.slice(-50);
    }
  }

  // 👆 ユーザーアクションの記録
  recordUserAction(
    type: UserAction['type'],
    target: string,
    value?: any
  ): void {
    const action: UserAction = {
      timestamp: new Date().toISOString(),
      type,
      target,
      value,
    };

    this.userActions.push(action);
    
    // 最新20件まで保持
    if (this.userActions.length > 20) {
      this.userActions = this.userActions.slice(-20);
    }

    // パンくずリストにも追加
    this.addBreadcrumb('user', `${type}: ${target}`, 'info', { value });
  }

  // 📱 デバイス情報の取得
  private async getDeviceInfo(): Promise<DeviceInfo> {
    // 実際のアプリでは React Native Device Info を使用
    return {
      platform: 'android',
      version: '14',
      model: 'Simulator',
      osVersion: '14.0',
      appVersion: '1.0.0',
      buildNumber: '1',
      isEmulator: true,
      screenSize: { width: 393, height: 851 },
      networkType: await this.getNetworkType(),
    };
  }

  // 📱 アプリ情報の取得
  private getAppInfo(): AppInfo {
    return {
      version: '1.0.0',
      buildNumber: '1',
      environment: 'development',
      bundleIdentifier: 'com.mushimap.app',
      lastUpdateTime: new Date().toISOString(),
    };
  }

  // 🛣️ 現在のルートの取得
  private getCurrentRoute(): string {
    // 実際のアプリではナビゲーションから取得
    return 'Unknown';
  }

  // 👆 最後のユーザーアクションの取得
  private getLastUserAction(): string {
    if (this.userActions.length === 0) return 'None';
    const lastAction = this.userActions[this.userActions.length - 1];
    return `${lastAction.type}: ${lastAction.target}`;
  }

  // 💾 エラーレポートの保存
  private async saveErrorReport(report: ErrorReport): Promise<void> {
    try {
      const existing = await this.getStoredReports();
      existing.push(report);
      
      // 最新100件まで保持
      const trimmed = existing.slice(-this.MAX_REPORTS);
      
      await AsyncStorage.setItem(this.ERROR_REPORTS_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('エラーレポート保存失敗:', error);
    }
  }

  // 📖 保存されたレポートの取得
  private async getStoredReports(): Promise<ErrorReport[]> {
    try {
      const stored = await AsyncStorage.getItem(this.ERROR_REPORTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('エラーレポート取得失敗:', error);
      return [];
    }
  }

  // ⬆️ エラーレポートのアップロード
  private async uploadErrorReport(report: ErrorReport): Promise<boolean> {
    try {
      const isOnline = await NetInfo.fetch().then(state => state.isConnected);
      if (!isOnline) {
        console.log('オフラインのため、エラーレポートのアップロードを延期');
        return false;
      }

      // 実際のアプリではAPIエンドポイントに送信
      console.log('📤 エラーレポートアップロード:', report.id);
      
      // デモ用の遅延
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 送信済みフラグを更新
      report.reportedToServer = true;
      await this.updateErrorReport(report);
      
      return true;
    } catch (error) {
      console.error('エラーレポートアップロード失敗:', error);
      return false;
    }
  }

  // ♻️ 未送信レポートのアップロード
  private async uploadPendingReports(): Promise<void> {
    try {
      const reports = await this.getStoredReports();
      const pendingReports = reports.filter(report => !report.reportedToServer);
      
      console.log(`♻️ 未送信エラーレポート: ${pendingReports.length}件`);
      
      for (const report of pendingReports) {
        await this.uploadErrorReport(report);
      }
    } catch (error) {
      console.error('未送信レポートアップロード失敗:', error);
    }
  }

  // ✏️ エラーレポートの更新
  private async updateErrorReport(updatedReport: ErrorReport): Promise<void> {
    try {
      const reports = await this.getStoredReports();
      const index = reports.findIndex(report => report.id === updatedReport.id);
      
      if (index >= 0) {
        reports[index] = updatedReport;
        await AsyncStorage.setItem(this.ERROR_REPORTS_KEY, JSON.stringify(reports));
      }
    } catch (error) {
      console.error('エラーレポート更新失敗:', error);
    }
  }

  // 🔔 エラー通知の表示
  private showErrorNotification(report: ErrorReport): void {
    // 開発環境でのみ表示
    if (__DEV__) {
      Alert.alert(
        'エラーが発生しました',
        `${report.message}\n\nエラーレポートが自動送信されました。`,
        [
          { text: 'OK' },
          { 
            text: '詳細', 
            onPress: () => this.showErrorDetails(report)
          },
        ]
      );
    }
  }

  // 📋 エラー詳細の表示
  private showErrorDetails(report: ErrorReport): void {
    const details = `
ID: ${report.id}
時刻: ${new Date(report.timestamp).toLocaleString('ja-JP')}
タイプ: ${report.type}
レベル: ${report.level}
コンポーネント: ${report.component || 'Unknown'}
メッセージ: ${report.message}
    `.trim();

    Alert.alert('エラー詳細', details, [{ text: 'OK' }]);
  }

  // 🧹 古いレポートのクリーンアップ
  private async cleanupOldReports(): Promise<void> {
    try {
      const reports = await this.getStoredReports();
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      const recentReports = reports.filter(report => 
        new Date(report.timestamp).getTime() > oneWeekAgo
      );
      
      if (recentReports.length !== reports.length) {
        await AsyncStorage.setItem(this.ERROR_REPORTS_KEY, JSON.stringify(recentReports));
        console.log(`🧹 古いエラーレポートを削除: ${reports.length - recentReports.length}件`);
      }
    } catch (error) {
      console.error('エラーレポートクリーンアップ失敗:', error);
    }
  }

  // 📊 エラー統計の取得
  async getErrorStats(): Promise<{
    totalReports: number;
    pendingUpload: number;
    recentErrors: number;
    topErrors: Array<{ message: string; count: number }>;
  }> {
    try {
      const reports = await this.getStoredReports();
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      const recentErrors = reports.filter(report => 
        new Date(report.timestamp).getTime() > oneDayAgo
      ).length;
      
      const pendingUpload = reports.filter(report => !report.reportedToServer).length;
      
      // エラーメッセージの集計
      const errorCounts = new Map<string, number>();
      reports.forEach(report => {
        const count = errorCounts.get(report.message) || 0;
        errorCounts.set(report.message, count + 1);
      });
      
      const topErrors = Array.from(errorCounts.entries())
        .map(([message, count]) => ({ message, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalReports: reports.length,
        pendingUpload,
        recentErrors,
        topErrors,
      };
    } catch (error) {
      console.error('エラー統計取得失敗:', error);
      return {
        totalReports: 0,
        pendingUpload: 0,
        recentErrors: 0,
        topErrors: [],
      };
    }
  }

  // 🗑️ 全レポートの削除
  async clearAllReports(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.ERROR_REPORTS_KEY);
      console.log('🗑️ 全エラーレポートを削除しました');
    } catch (error) {
      console.error('エラーレポート削除失敗:', error);
    }
  }

  // 📱 ヘルスチェック
  async performHealthCheck(): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const stats = await this.getErrorStats();
      
      // エラー率の確認
      if (stats.recentErrors > 10) {
        issues.push('過去24時間のエラー件数が多すぎます');
        recommendations.push('アプリの安定性を確認してください');
      }
      
      // 未送信レポートの確認
      if (stats.pendingUpload > 5) {
        issues.push('未送信のエラーレポートが蓄積されています');
        recommendations.push('ネットワーク接続を確認してください');
      }
      
      // メモリ使用量の確認（デモ）
      const memoryWarning = false; // 実際のアプリではメモリ使用量をチェック
      if (memoryWarning) {
        issues.push('メモリ使用量が高くなっています');
        recommendations.push('アプリを再起動することをお勧めします');
      }

      return {
        isHealthy: issues.length === 0,
        issues,
        recommendations,
      };
    } catch (error) {
      console.error('ヘルスチェック失敗:', error);
      return {
        isHealthy: false,
        issues: ['ヘルスチェックの実行に失敗しました'],
        recommendations: ['システム管理者にお問い合わせください'],
      };
    }
  }
}

export const errorReportingService = new ErrorReportingService();
export default errorReportingService;