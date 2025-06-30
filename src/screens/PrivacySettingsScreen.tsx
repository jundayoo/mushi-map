import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CommercialDesign } from '../styles/CommercialDesignSystem';
import { legalService, UserConsent } from '../services/legalService';
import { authService } from '../services/authService';

interface PrivacySettingsScreenProps {
  onBack: () => void;
}

const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({ onBack }) => {
  const [currentConsent, setCurrentConsent] = useState<UserConsent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentConsent();
  }, []);

  const loadCurrentConsent = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const consent = await legalService.checkUserConsent(user.id);
        setCurrentConsent(consent);
      }
    } catch (error) {
      console.error('同意情報読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConsent = async (field: keyof UserConsent, value: boolean) => {
    if (!currentConsent) return;

    const updatedConsent = { ...currentConsent, [field]: value };
    const success = await legalService.saveUserConsent(updatedConsent);
    
    if (success) {
      setCurrentConsent(updatedConsent);
    } else {
      Alert.alert('エラー', '設定の更新に失敗しました');
    }
  };

  const requestDataExport = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        Alert.alert('エラー', 'ユーザー情報を取得できません');
        return;
      }

      const exportData = await legalService.exportUserData(user.id);
      
      Alert.alert(
        'データエクスポート',
        'データのエクスポートが完了しました。実際のアプリでは、データをファイルとして保存またはメール送信します。',
        [
          {
            text: 'プレビュー',
            onPress: () => {
              Alert.alert('エクスポートデータ', exportData.substring(0, 500) + '...');
            },
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      Alert.alert('エラー', 'データエクスポートに失敗しました');
    }
  };

  const requestDataDeletion = () => {
    Alert.alert(
      'データ削除の確認',
      'すべての個人データを削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            const user = await authService.getCurrentUser();
            if (user) {
              const success = await legalService.deleteUserData(user.id, 'ユーザー要求');
              if (success) {
                Alert.alert('完了', 'データ削除要求を受け付けました');
              }
            }
          },
        },
      ]
    );
  };

  const renderConsentSwitch = (
    title: string,
    description: string,
    field: keyof UserConsent,
    icon: string,
    required: boolean = false
  ) => (
    <View style={[styles.settingItem, required && styles.requiredSetting]}>
      <View style={styles.settingContent}>
        <View style={styles.settingHeader}>
          <MaterialIcons name={icon as any} size={20} color={CommercialDesign.colors.primary[500]} />
          <Text style={styles.settingTitle}>
            {title}
            {required && <Text style={styles.requiredMark}> *</Text>}
          </Text>
        </View>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={currentConsent ? currentConsent[field] as boolean : false}
        onValueChange={(value) => updateConsent(field, value)}
        disabled={required}
        trackColor={{
          false: CommercialDesign.colors.gray[300],
          true: CommercialDesign.colors.primary[300],
        }}
        thumbColor={
          (currentConsent ? currentConsent[field] as boolean : false)
            ? CommercialDesign.colors.primary[500]
            : CommercialDesign.colors.gray[500]
        }
      />
    </View>
  );

  const renderComplianceStatus = () => {
    const status = legalService.getComplianceStatus();
    return (
      <View style={styles.complianceCard}>
        <Text style={styles.complianceTitle}>🛡️ コンプライアンス状況</Text>
        <View style={styles.complianceGrid}>
          <View style={styles.complianceItem}>
            <MaterialIcons 
              name={status.gdprCompliant ? 'check-circle' : 'error'} 
              size={16} 
              color={status.gdprCompliant ? CommercialDesign.colors.success : CommercialDesign.colors.error} 
            />
            <Text style={styles.complianceText}>GDPR準拠</Text>
          </View>
          <View style={styles.complianceItem}>
            <MaterialIcons 
              name={status.pipaCompliant ? 'check-circle' : 'error'} 
              size={16} 
              color={status.pipaCompliant ? CommercialDesign.colors.success : CommercialDesign.colors.error} 
            />
            <Text style={styles.complianceText}>個人情報保護法</Text>
          </View>
          <View style={styles.complianceItem}>
            <MaterialIcons 
              name={status.coppaCompliant ? 'check-circle' : 'error'} 
              size={16} 
              color={status.coppaCompliant ? CommercialDesign.colors.success : CommercialDesign.colors.error} 
            />
            <Text style={styles.complianceText}>COPPA準拠</Text>
          </View>
          <View style={styles.complianceItem}>
            <MaterialIcons 
              name={status.ccpaCompliant ? 'check-circle' : 'error'} 
              size={16} 
              color={status.ccpaCompliant ? CommercialDesign.colors.success : CommercialDesign.colors.error} 
            />
            <Text style={styles.complianceText}>CCPA準拠</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="privacy-tip" size={64} color={CommercialDesign.colors.primary[500]} />
        <Text style={styles.loadingText}>プライバシー設定を読み込み中...</Text>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>プライバシー設定</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 同意ステータス */}
        {currentConsent && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <MaterialIcons name="check-circle" size={24} color={CommercialDesign.colors.success} />
              <Text style={styles.statusTitle}>同意済み</Text>
            </View>
            <Text style={styles.statusDate}>
              同意日: {new Date(currentConsent.consentDate).toLocaleDateString('ja-JP')}
            </Text>
            <Text style={styles.statusVersion}>
              バージョン: {currentConsent.version}
            </Text>
          </View>
        )}

        {/* 必須同意項目 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 基本同意項目</Text>
          <Text style={styles.sectionNote}>
            ※ これらの項目は必須のため変更できません
          </Text>
          
          {renderConsentSwitch(
            'プライバシーポリシー',
            '個人情報の取り扱いに関する同意',
            'privacyPolicyAccepted',
            'privacy-tip',
            true
          )}

          {renderConsentSwitch(
            '利用規約',
            'サービス利用に関する規約への同意',
            'termsOfServiceAccepted',
            'description',
            true
          )}
        </View>

        {/* オプション項目 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ オプション設定</Text>
          
          {renderConsentSwitch(
            'マーケティング通知',
            '新機能やキャンペーンの通知を受け取る',
            'marketingConsent',
            'campaign'
          )}

          {renderConsentSwitch(
            '分析データ利用',
            'サービス改善のための分析に協力する',
            'analyticsConsent',
            'analytics'
          )}

          {renderConsentSwitch(
            '位置情報利用',
            '発見場所の記録に位置情報を利用する',
            'locationConsent',
            'location-on'
          )}

          {renderConsentSwitch(
            'カメラ利用',
            '昆虫写真の撮影にカメラを利用する',
            'cameraConsent',
            'camera-alt'
          )}

          {renderConsentSwitch(
            'プッシュ通知',
            '重要な通知をプッシュ通知で受け取る',
            'notificationConsent',
            'notifications'
          )}
        </View>

        {/* データ権利 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 データの権利</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={requestDataExport}>
            <MaterialIcons name="download" size={20} color={CommercialDesign.colors.primary[500]} />
            <Text style={styles.actionButtonText}>データのエクスポート</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color={CommercialDesign.colors.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={requestDataDeletion}>
            <MaterialIcons name="delete-forever" size={20} color={CommercialDesign.colors.error} />
            <Text style={[styles.actionButtonText, { color: CommercialDesign.colors.error }]}>
              データの削除
            </Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color={CommercialDesign.colors.gray[400]} />
          </TouchableOpacity>
        </View>

        {/* コンプライアンス情報 */}
        {renderComplianceStatus()}

        {/* 問い合わせ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 お問い合わせ</Text>
          <View style={styles.contactCard}>
            <Text style={styles.contactText}>
              プライバシーに関するご質問はこちら:
            </Text>
            <Text style={styles.contactEmail}>privacy@mushimap.com</Text>
            <Text style={styles.contactHours}>
              受付時間: 平日 9:00-18:00
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CommercialDesign.colors.background.primary,
  },
  loadingText: {
    marginTop: CommercialDesign.spacing.md,
    fontSize: 16,
    color: CommercialDesign.colors.text.secondary,
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
  section: {
    marginVertical: CommercialDesign.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CommercialDesign.colors.text.primary,
    marginBottom: CommercialDesign.spacing.md,
  },
  sectionNote: {
    fontSize: 14,
    color: CommercialDesign.colors.text.tertiary,
    marginBottom: CommercialDesign.spacing.md,
    fontStyle: 'italic',
  },

  // ステータスカード
  statusCard: {
    backgroundColor: CommercialDesign.colors.success + '10',
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.lg,
    marginTop: CommercialDesign.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: CommercialDesign.colors.success,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: CommercialDesign.spacing.sm,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CommercialDesign.colors.success,
    marginLeft: CommercialDesign.spacing.sm,
  },
  statusDate: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
  },
  statusVersion: {
    fontSize: 12,
    color: CommercialDesign.colors.text.tertiary,
    marginTop: 2,
  },

  // 設定項目
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.lg,
    marginBottom: CommercialDesign.spacing.md,
    ...CommercialDesign.shadows.card,
  },
  requiredSetting: {
    borderLeftWidth: 4,
    borderLeftColor: CommercialDesign.colors.warning,
  },
  settingContent: {
    flex: 1,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: CommercialDesign.spacing.xs,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: CommercialDesign.colors.text.primary,
    marginLeft: CommercialDesign.spacing.sm,
  },
  requiredMark: {
    color: CommercialDesign.colors.warning,
    fontWeight: '700',
  },
  settingDescription: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
    lineHeight: 18,
  },

  // アクションボタン
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.lg,
    marginBottom: CommercialDesign.spacing.md,
    ...CommercialDesign.shadows.card,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: CommercialDesign.colors.text.primary,
    marginLeft: CommercialDesign.spacing.sm,
  },

  // コンプライアンス
  complianceCard: {
    backgroundColor: CommercialDesign.colors.tech[50],
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.lg,
    marginBottom: CommercialDesign.spacing.lg,
  },
  complianceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CommercialDesign.colors.text.primary,
    marginBottom: CommercialDesign.spacing.md,
  },
  complianceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: CommercialDesign.spacing.sm,
  },
  complianceText: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
    marginLeft: CommercialDesign.spacing.xs,
  },

  // 問い合わせ
  contactCard: {
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.lg,
    ...CommercialDesign.shadows.card,
  },
  contactText: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
    marginBottom: CommercialDesign.spacing.sm,
  },
  contactEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: CommercialDesign.colors.primary[500],
    marginBottom: CommercialDesign.spacing.xs,
  },
  contactHours: {
    fontSize: 12,
    color: CommercialDesign.colors.text.tertiary,
  },
});

export default PrivacySettingsScreen;