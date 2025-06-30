import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { Alert } from 'react-native';

export interface SecurityConfig {
  enableEncryption: boolean;
  enableBiometrics: boolean;
  sessionTimeout: number; // ミリ秒
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireStrongPassword: boolean;
  enableDeviceBinding: boolean;
  enableTamperDetection: boolean;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'login_attempt' | 'unauthorized_access' | 'data_breach' | 'suspicious_activity' | 'password_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  deviceId: string;
  ipAddress: string;
  details: Record<string, any>;
  resolved: boolean;
}

export interface EncryptionKey {
  keyId: string;
  algorithm: 'AES-256';
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface SecurityAudit {
  auditId: string;
  timestamp: string;
  component: string;
  action: string;
  userId?: string;
  result: 'success' | 'failure' | 'warning';
  details: Record<string, any>;
}

class SecurityService {
  private readonly SECURITY_CONFIG_KEY = '@mushi_map_security_config';
  private readonly SECURITY_EVENTS_KEY = '@mushi_map_security_events';
  private readonly ENCRYPTION_KEYS_KEY = '@mushi_map_encryption_keys';
  private readonly SECURITY_AUDIT_KEY = '@mushi_map_security_audit';
  private readonly LOGIN_ATTEMPTS_KEY = '@mushi_map_login_attempts';
  private readonly DEVICE_FINGERPRINT_KEY = '@mushi_map_device_fingerprint';
  
  private encryptionKey: string = '';
  private deviceFingerprint: string = '';
  private securityConfig: SecurityConfig;
  private isInitialized = false;

  constructor() {
    this.securityConfig = this.getDefaultSecurityConfig();
  }

  // 🛡️ セキュリティサービス初期化
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // セキュリティ設定の読み込み
      await this.loadSecurityConfig();
      
      // 暗号化キーの初期化
      await this.initializeEncryption();
      
      // デバイスフィンガープリント生成
      await this.generateDeviceFingerprint();
      
      // 改ざん検出の有効化
      if (this.securityConfig.enableTamperDetection) {
        await this.enableTamperDetection();
      }
      
      // セキュリティ監査ログ
      await this.logSecurityAudit('security_service', 'initialize', 'success', {
        config: this.securityConfig,
      });

      this.isInitialized = true;
      console.log('🛡️ セキュリティサービス初期化完了');
    } catch (error) {
      console.error('セキュリティサービス初期化エラー:', error);
      await this.logSecurityEvent('suspicious_activity', 'critical', {
        error: error.message,
        context: 'initialization_failure',
      });
      throw error;
    }
  }

  // 🔐 暗号化サービス
  async encrypt(data: string, keyId?: string): Promise<string> {
    try {
      if (!this.securityConfig.enableEncryption) {
        return data; // 暗号化無効時はそのまま返す
      }

      const key = keyId ? await this.getEncryptionKey(keyId) : this.encryptionKey;
      if (!key) {
        throw new Error('暗号化キーが見つかりません');
      }

      const encrypted = CryptoJS.AES.encrypt(data, key).toString();
      
      await this.logSecurityAudit('encryption', 'encrypt', 'success', {
        dataLength: data.length,
        keyId: keyId || 'default',
      });

      return encrypted;
    } catch (error) {
      await this.logSecurityEvent('data_breach', 'high', {
        operation: 'encryption_failure',
        error: error.message,
      });
      throw error;
    }
  }

  // 🔓 復号化サービス
  async decrypt(encryptedData: string, keyId?: string): Promise<string> {
    try {
      if (!this.securityConfig.enableEncryption) {
        return encryptedData; // 暗号化無効時はそのまま返す
      }

      const key = keyId ? await this.getEncryptionKey(keyId) : this.encryptionKey;
      if (!key) {
        throw new Error('復号化キーが見つかりません');
      }

      const decrypted = CryptoJS.AES.decrypt(encryptedData, key).toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('復号化に失敗しました');
      }

      await this.logSecurityAudit('encryption', 'decrypt', 'success', {
        dataLength: decrypted.length,
        keyId: keyId || 'default',
      });

      return decrypted;
    } catch (error) {
      await this.logSecurityEvent('data_breach', 'high', {
        operation: 'decryption_failure',
        error: error.message,
      });
      throw error;
    }
  }

  // 🔒 安全なデータ保存
  async secureStore(key: string, value: string): Promise<void> {
    try {
      const encryptedValue = await this.encrypt(value);
      await AsyncStorage.setItem(key, encryptedValue);
      
      await this.logSecurityAudit('data_storage', 'secure_store', 'success', {
        key,
        dataLength: value.length,
      });
    } catch (error) {
      await this.logSecurityEvent('data_breach', 'medium', {
        operation: 'secure_store_failure',
        key,
        error: error.message,
      });
      throw error;
    }
  }

  // 🔓 安全なデータ取得
  async secureRetrieve(key: string): Promise<string | null> {
    try {
      const encryptedValue = await AsyncStorage.getItem(key);
      if (!encryptedValue) return null;

      const decryptedValue = await this.decrypt(encryptedValue);
      
      await this.logSecurityAudit('data_storage', 'secure_retrieve', 'success', {
        key,
        dataLength: decryptedValue.length,
      });

      return decryptedValue;
    } catch (error) {
      await this.logSecurityEvent('data_breach', 'medium', {
        operation: 'secure_retrieve_failure',
        key,
        error: error.message,
      });
      return null;
    }
  }

  // 🏠 ログイン試行監視
  async monitorLoginAttempt(userId: string, success: boolean, metadata: Record<string, any> = {}): Promise<boolean> {
    try {
      const attempts = await this.getLoginAttempts(userId);
      const now = Date.now();
      
      // 1時間以内の試行をカウント
      const recentAttempts = attempts.filter(attempt => 
        now - attempt.timestamp < 60 * 60 * 1000
      );

      if (success) {
        // 成功時は試行履歴をクリア
        await this.clearLoginAttempts(userId);
        
        await this.logSecurityEvent('login_attempt', 'low', {
          userId,
          success: true,
          metadata,
        });

        return true;
      } else {
        // 失敗時は試行を記録
        recentAttempts.push({
          timestamp: now,
          ipAddress: '127.0.0.1', // 実際のアプリでは実IPを取得
          metadata,
        });

        await this.saveLoginAttempts(userId, recentAttempts);

        // 最大試行回数チェック
        if (recentAttempts.length >= this.securityConfig.maxLoginAttempts) {
          await this.logSecurityEvent('unauthorized_access', 'high', {
            userId,
            attemptCount: recentAttempts.length,
            suspiciousActivity: true,
          });

          return false; // アカウントロック
        }

        await this.logSecurityEvent('login_attempt', 'medium', {
          userId,
          success: false,
          attemptCount: recentAttempts.length,
          metadata,
        });

        return true; // まだ試行可能
      }
    } catch (error) {
      console.error('ログイン監視エラー:', error);
      return true; // エラー時は継続可能とする
    }
  }

  // 💪 パスワード強度チェック
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    requirements: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      numbers: boolean;
      symbols: boolean;
    };
    suggestions: string[];
  } {
    const requirements = {
      length: password.length >= this.securityConfig.passwordMinLength,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /[0-9]/.test(password),
      symbols: /[^A-Za-z0-9]/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;
    const suggestions: string[] = [];

    if (!requirements.length) {
      suggestions.push(`最低${this.securityConfig.passwordMinLength}文字以上にしてください`);
    }
    if (!requirements.uppercase) {
      suggestions.push('大文字を含めてください');
    }
    if (!requirements.lowercase) {
      suggestions.push('小文字を含めてください');
    }
    if (!requirements.numbers) {
      suggestions.push('数字を含めてください');
    }
    if (!requirements.symbols) {
      suggestions.push('記号を含めてください');
    }

    const isValid = this.securityConfig.requireStrongPassword 
      ? score >= 4 
      : requirements.length;

    return {
      isValid,
      score,
      requirements,
      suggestions,
    };
  }

  // 🕵️ セッション管理
  async validateSession(sessionToken: string): Promise<{
    isValid: boolean;
    shouldRefresh: boolean;
    remainingTime: number;
  }> {
    try {
      const sessionData = await this.secureRetrieve(`session_${sessionToken}`);
      if (!sessionData) {
        return { isValid: false, shouldRefresh: false, remainingTime: 0 };
      }

      const session = JSON.parse(sessionData);
      const now = Date.now();
      const elapsed = now - session.createdAt;
      const remaining = this.securityConfig.sessionTimeout - elapsed;

      if (remaining <= 0) {
        // セッション期限切れ
        await this.invalidateSession(sessionToken);
        
        await this.logSecurityEvent('unauthorized_access', 'medium', {
          sessionToken: sessionToken.substring(0, 8) + '...',
          reason: 'session_expired',
        });

        return { isValid: false, shouldRefresh: true, remainingTime: 0 };
      }

      // セッション自動延長（残り時間が30%以下の場合）
      const shouldRefresh = remaining < (this.securityConfig.sessionTimeout * 0.3);

      return {
        isValid: true,
        shouldRefresh,
        remainingTime: remaining,
      };
    } catch (error) {
      console.error('セッション検証エラー:', error);
      return { isValid: false, shouldRefresh: false, remainingTime: 0 };
    }
  }

  // 🚫 セッション無効化
  async invalidateSession(sessionToken: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`session_${sessionToken}`);
      
      await this.logSecurityAudit('session_management', 'invalidate_session', 'success', {
        sessionToken: sessionToken.substring(0, 8) + '...',
      });
    } catch (error) {
      console.error('セッション無効化エラー:', error);
    }
  }

  // 🔍 改ざん検出
  async enableTamperDetection(): Promise<void> {
    try {
      // アプリの整合性チェック（デモ実装）
      const appChecksum = await this.calculateAppChecksum();
      const storedChecksum = await AsyncStorage.getItem('app_checksum');
      
      if (storedChecksum && storedChecksum !== appChecksum) {
        await this.logSecurityEvent('suspicious_activity', 'critical', {
          type: 'app_tampering_detected',
          expectedChecksum: storedChecksum,
          actualChecksum: appChecksum,
        });

        Alert.alert(
          'セキュリティ警告',
          'アプリの改ざんが検出されました。安全のためアプリを再インストールしてください。',
          [{ text: 'OK' }]
        );
      } else if (!storedChecksum) {
        await AsyncStorage.setItem('app_checksum', appChecksum);
      }
    } catch (error) {
      console.error('改ざん検出エラー:', error);
    }
  }

  // 📊 セキュリティ統計
  async getSecurityStats(): Promise<{
    totalEvents: number;
    criticalEvents: number;
    recentEvents: number;
    topThreats: Array<{ type: string; count: number }>;
    securityScore: number;
  }> {
    try {
      const events = await this.getSecurityEvents();
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      const recentEvents = events.filter(event => 
        new Date(event.timestamp).getTime() > oneDayAgo
      ).length;
      
      const criticalEvents = events.filter(event => 
        event.severity === 'critical'
      ).length;

      // 脅威タイプの集計
      const threatCounts = new Map<string, number>();
      events.forEach(event => {
        const count = threatCounts.get(event.type) || 0;
        threatCounts.set(event.type, count + 1);
      });

      const topThreats = Array.from(threatCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // セキュリティスコア計算（100点満点）
      let securityScore = 100;
      securityScore -= criticalEvents * 20; // 重大イベント1件につき-20点
      securityScore -= recentEvents * 5; // 最近のイベント1件につき-5点
      securityScore = Math.max(0, securityScore);

      return {
        totalEvents: events.length,
        criticalEvents,
        recentEvents,
        topThreats,
        securityScore,
      };
    } catch (error) {
      console.error('セキュリティ統計取得エラー:', error);
      return {
        totalEvents: 0,
        criticalEvents: 0,
        recentEvents: 0,
        topThreats: [],
        securityScore: 100,
      };
    }
  }

  // 🛠️ プライベートメソッド

  private getDefaultSecurityConfig(): SecurityConfig {
    return {
      enableEncryption: true,
      enableBiometrics: false,
      sessionTimeout: 30 * 60 * 1000, // 30分
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireStrongPassword: true,
      enableDeviceBinding: true,
      enableTamperDetection: true,
    };
  }

  private async loadSecurityConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.SECURITY_CONFIG_KEY);
      if (stored) {
        this.securityConfig = { ...this.getDefaultSecurityConfig(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('セキュリティ設定読み込みエラー:', error);
    }
  }

  private async initializeEncryption(): Promise<void> {
    try {
      // 既存キーの確認
      let key = await AsyncStorage.getItem('encryption_master_key');
      
      if (!key) {
        // 新しい暗号化キーを生成
        key = CryptoJS.lib.WordArray.random(256/8).toString();
        await AsyncStorage.setItem('encryption_master_key', key);
      }
      
      this.encryptionKey = key;
    } catch (error) {
      console.error('暗号化初期化エラー:', error);
      throw error;
    }
  }

  private async generateDeviceFingerprint(): Promise<void> {
    try {
      let fingerprint = await AsyncStorage.getItem(this.DEVICE_FINGERPRINT_KEY);
      
      if (!fingerprint) {
        // デバイス固有の情報から指紋を生成（デモ実装）
        const deviceInfo = {
          platform: 'android',
          model: 'simulator',
          timestamp: Date.now(),
          random: Math.random().toString(36),
        };
        
        fingerprint = CryptoJS.SHA256(JSON.stringify(deviceInfo)).toString();
        await AsyncStorage.setItem(this.DEVICE_FINGERPRINT_KEY, fingerprint);
      }
      
      this.deviceFingerprint = fingerprint;
    } catch (error) {
      console.error('デバイス指紋生成エラー:', error);
    }
  }

  private async calculateAppChecksum(): Promise<string> {
    // 実際のアプリでは、アプリバンドルのハッシュを計算
    // デモでは固定値を返す
    return CryptoJS.SHA256('mushi_map_v1.0.0').toString();
  }

  private async getEncryptionKey(keyId: string): Promise<string | null> {
    try {
      const keys = await AsyncStorage.getItem(this.ENCRYPTION_KEYS_KEY);
      if (!keys) return null;

      const keyStore: EncryptionKey[] = JSON.parse(keys);
      const key = keyStore.find(k => k.keyId === keyId && k.isActive);
      
      return key ? key.keyId : null; // 実際は暗号化された実キーを返す
    } catch (error) {
      console.error('暗号化キー取得エラー:', error);
      return null;
    }
  }

  private async logSecurityEvent(
    type: SecurityEvent['type'],
    severity: SecurityEvent['severity'],
    details: Record<string, any>
  ): Promise<void> {
    try {
      const event: SecurityEvent = {
        id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type,
        severity,
        deviceId: this.deviceFingerprint,
        ipAddress: '127.0.0.1', // 実際のアプリでは実IPを取得
        details,
        resolved: false,
      };

      const events = await this.getSecurityEvents();
      events.push(event);
      
      // 最新100件まで保持
      const trimmed = events.slice(-100);
      await AsyncStorage.setItem(this.SECURITY_EVENTS_KEY, JSON.stringify(trimmed));

      console.log(`🚨 セキュリティイベント: ${type} (${severity})`);
    } catch (error) {
      console.error('セキュリティイベントログエラー:', error);
    }
  }

  private async logSecurityAudit(
    component: string,
    action: string,
    result: SecurityAudit['result'],
    details: Record<string, any>
  ): Promise<void> {
    try {
      const audit: SecurityAudit = {
        auditId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        component,
        action,
        result,
        details,
      };

      const audits = await this.getSecurityAudits();
      audits.push(audit);
      
      // 最新500件まで保持
      const trimmed = audits.slice(-500);
      await AsyncStorage.setItem(this.SECURITY_AUDIT_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('セキュリティ監査ログエラー:', error);
    }
  }

  private async getSecurityEvents(): Promise<SecurityEvent[]> {
    try {
      const stored = await AsyncStorage.getItem(this.SECURITY_EVENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('セキュリティイベント取得エラー:', error);
      return [];
    }
  }

  private async getSecurityAudits(): Promise<SecurityAudit[]> {
    try {
      const stored = await AsyncStorage.getItem(this.SECURITY_AUDIT_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('セキュリティ監査取得エラー:', error);
      return [];
    }
  }

  private async getLoginAttempts(userId: string): Promise<Array<{
    timestamp: number;
    ipAddress: string;
    metadata: Record<string, any>;
  }>> {
    try {
      const stored = await AsyncStorage.getItem(`${this.LOGIN_ATTEMPTS_KEY}_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  private async saveLoginAttempts(userId: string, attempts: Array<{
    timestamp: number;
    ipAddress: string;
    metadata: Record<string, any>;
  }>): Promise<void> {
    try {
      await AsyncStorage.setItem(`${this.LOGIN_ATTEMPTS_KEY}_${userId}`, JSON.stringify(attempts));
    } catch (error) {
      console.error('ログイン試行保存エラー:', error);
    }
  }

  private async clearLoginAttempts(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.LOGIN_ATTEMPTS_KEY}_${userId}`);
    } catch (error) {
      console.error('ログイン試行クリアエラー:', error);
    }
  }

  // 🧹 セキュリティデータクリーンアップ
  async cleanupSecurityData(): Promise<void> {
    try {
      // 古いイベントとログの削除
      const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      const events = await this.getSecurityEvents();
      const recentEvents = events.filter(event => 
        new Date(event.timestamp).getTime() > oneMonthAgo
      );
      
      await AsyncStorage.setItem(this.SECURITY_EVENTS_KEY, JSON.stringify(recentEvents));
      
      console.log('🧹 セキュリティデータクリーンアップ完了');
    } catch (error) {
      console.error('セキュリティデータクリーンアップエラー:', error);
    }
  }
}

export const securityService = new SecurityService();
export default securityService;