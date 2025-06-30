import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CommercialDesign } from '../styles/CommercialDesignSystem';
import { legalService, UserConsent, LegalDocument } from '../services/legalService';
import { authService } from '../services/authService';

const { height } = Dimensions.get('window');

interface LegalConsentScreenProps {
  onConsentComplete: () => void;
  onSkip?: () => void;
}

const LegalConsentScreen: React.FC<LegalConsentScreenProps> = ({
  onConsentComplete,
  onSkip,
}) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showDocument, setShowDocument] = useState<LegalDocument | null>(null);
  const [consents, setConsents] = useState({
    privacyPolicy: false,
    termsOfService: false,
    marketing: false,
    analytics: true,
    location: false,
    camera: false,
    notifications: false,
  });
  const [ageVerified, setAgeVerified] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [needsParentalConsent, setNeedsParentalConsent] = useState(false);
  const [parentalConsent, setParentalConsent] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
  };

  const handleDocumentPress = (type: 'privacy_policy' | 'terms_of_service') => {
    const document = legalService.getLegalDocument(type);
    setShowDocument(document);
  };

  const handleAgeVerification = (date: string) => {
    setBirthDate(date);
    const verification = legalService.verifyAge(date);
    
    if (!verification.isValid) {
      Alert.alert('エラー', '有効な生年月日を入力してください');
      return;
    }

    setAgeVerified(true);
    setNeedsParentalConsent(verification.needsParentalConsent);
    
    if (verification.needsParentalConsent) {
      Alert.alert(
        '保護者の同意が必要です',
        '13歳未満の方は保護者の方に同意していただく必要があります。',
        [{ text: 'OK' }]
      );
    }
  };

  const canProceed = () => {
    const basicConsents = consents.privacyPolicy && consents.termsOfService;
    const ageRequirement = ageVerified && (!needsParentalConsent || parentalConsent);
    return basicConsents && ageRequirement;
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      Alert.alert('エラー', '必須項目を確認してください');
      return;
    }

    if (!currentUser) {
      Alert.alert('エラー', 'ユーザー情報の取得に失敗しました');
      return;
    }

    try {
      const consent: Omit<UserConsent, 'consentDate' | 'version'> = {
        userId: currentUser.id,
        privacyPolicyAccepted: consents.privacyPolicy,
        termsOfServiceAccepted: consents.termsOfService,
        marketingConsent: consents.marketing,
        analyticsConsent: consents.analytics,
        locationConsent: consents.location,
        cameraConsent: consents.camera,
        notificationConsent: consents.notifications,
        ageVerified,
        parentalConsent: needsParentalConsent ? parentalConsent : undefined,
        ipAddress: '127.0.0.1', // 実際のアプリではリアルIPを取得
        userAgent: 'MushiMap/1.0.0', // 実際のアプリではリアルユーザーエージェント
      };

      const success = await legalService.saveUserConsent(consent);
      
      if (success) {
        Alert.alert(
          '同意完了',
          'ご同意いただきありがとうございます。むしマップをお楽しみください！',
          [{ text: 'OK', onPress: onConsentComplete }]
        );
      } else {
        Alert.alert('エラー', '同意の保存に失敗しました');
      }
    } catch (error) {
      console.error('同意処理エラー:', error);
      Alert.alert('エラー', '処理中にエラーが発生しました');
    }
  };

  const renderConsentItem = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    required: boolean = false,
    icon: string = 'check-circle'
  ) => (
    <View style={[styles.consentItem, required && styles.requiredItem]}>
      <View style={styles.consentContent}>
        <View style={styles.consentHeader}>
          <MaterialIcons 
            name={icon as any} 
            size={20} 
            color={required ? CommercialDesign.colors.error : CommercialDesign.colors.primary[500]} 
          />
          <Text style={[styles.consentTitle, required && styles.requiredTitle]}>
            {title}
            {required && <Text style={styles.requiredMark}> *</Text>}
          </Text>
        </View>
        <Text style={styles.consentDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: CommercialDesign.colors.gray[300],
          true: CommercialDesign.colors.primary[300],
        }}
        thumbColor={
          value 
            ? CommercialDesign.colors.primary[500] 
            : CommercialDesign.colors.gray[500]
        }
      />
    </View>
  );

  const renderDocumentModal = () => (
    <Modal
      visible={!!showDocument}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{showDocument?.title}</Text>
          <TouchableOpacity
            onPress={() => setShowDocument(null)}
            style={styles.closeButton}
          >
            <MaterialIcons name="close" size={24} color={CommercialDesign.colors.gray[600]} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Text style={styles.documentText}>{showDocument?.content}</Text>
        </ScrollView>
        
        <View style={styles.modalFooter}>
          <Text style={styles.versionText}>
            バージョン: {showDocument?.version} | 最終更新: {new Date(showDocument?.lastUpdated || '').toLocaleDateString('ja-JP')}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <LinearGradient
        colors={CommercialDesign.gradients.primaryButton}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <MaterialIcons name="gavel" size={32} color="white" />
          <Text style={styles.headerTitle}>利用規約・プライバシー</Text>
          <Text style={styles.headerSubtitle}>
            むしマップを安全にご利用いただくために
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 年齢確認セクション */}
        {!ageVerified && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 年齢確認</Text>
            <Text style={styles.sectionDescription}>
              サービス利用のため、年齢確認が必要です
            </Text>
            
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                // 実際のアプリでは日付選択UIを表示
                // デモ用に仮の日付を設定
                const demoDate = '1990-01-01';
                handleAgeVerification(demoDate);
              }}
            >
              <MaterialIcons name="event" size={20} color={CommercialDesign.colors.primary[500]} />
              <Text style={styles.dateButtonText}>
                {birthDate || '生年月日を選択してください'}
              </Text>
            </TouchableOpacity>

            {needsParentalConsent && (
              <View style={styles.parentalSection}>
                <Text style={styles.parentalTitle}>👨‍👩‍👧‍👦 保護者の同意</Text>
                <Text style={styles.parentalDescription}>
                  13歳未満の方は保護者の同意が必要です
                </Text>
                <View style={styles.consentItem}>
                  <Text style={styles.consentTitle}>保護者として同意します</Text>
                  <Switch
                    value={parentalConsent}
                    onValueChange={setParentalConsent}
                    trackColor={{
                      false: CommercialDesign.colors.gray[300],
                      true: CommercialDesign.colors.primary[300],
                    }}
                    thumbColor={
                      parentalConsent 
                        ? CommercialDesign.colors.primary[500] 
                        : CommercialDesign.colors.gray[500]
                    }
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* 法的文書セクション */}
        {ageVerified && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📜 利用規約・プライバシーポリシー</Text>
            
            <TouchableOpacity
              style={styles.documentButton}
              onPress={() => handleDocumentPress('privacy_policy')}
            >
              <View style={styles.documentButtonContent}>
                <MaterialIcons name="privacy-tip" size={24} color={CommercialDesign.colors.primary[500]} />
                <View style={styles.documentButtonText}>
                  <Text style={styles.documentButtonTitle}>プライバシーポリシー</Text>
                  <Text style={styles.documentButtonDescription}>
                    個人情報の取り扱いについて
                  </Text>
                </View>
                <MaterialIcons name="arrow-forward-ios" size={16} color={CommercialDesign.colors.gray[400]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.documentButton}
              onPress={() => handleDocumentPress('terms_of_service')}
            >
              <View style={styles.documentButtonContent}>
                <MaterialIcons name="description" size={24} color={CommercialDesign.colors.primary[500]} />
                <View style={styles.documentButtonText}>
                  <Text style={styles.documentButtonTitle}>利用規約</Text>
                  <Text style={styles.documentButtonDescription}>
                    サービス利用に関するルール
                  </Text>
                </View>
                <MaterialIcons name="arrow-forward-ios" size={16} color={CommercialDesign.colors.gray[400]} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* 同意項目セクション */}
        {ageVerified && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ 同意項目</Text>
            
            {renderConsentItem(
              'プライバシーポリシーに同意',
              '個人情報の取り扱いに同意します',
              consents.privacyPolicy,
              (value) => setConsents(prev => ({ ...prev, privacyPolicy: value })),
              true,
              'privacy-tip'
            )}

            {renderConsentItem(
              '利用規約に同意',
              'サービス利用規約に同意します',
              consents.termsOfService,
              (value) => setConsents(prev => ({ ...prev, termsOfService: value })),
              true,
              'description'
            )}

            <Text style={styles.optionalTitle}>📋 オプション設定</Text>

            {renderConsentItem(
              'マーケティング通知',
              '新機能やキャンペーンの通知を受け取る',
              consents.marketing,
              (value) => setConsents(prev => ({ ...prev, marketing: value })),
              false,
              'campaign'
            )}

            {renderConsentItem(
              '分析データ利用',
              'サービス改善のための分析に協力する',
              consents.analytics,
              (value) => setConsents(prev => ({ ...prev, analytics: value })),
              false,
              'analytics'
            )}

            {renderConsentItem(
              '位置情報利用',
              '発見場所の記録に位置情報を利用する',
              consents.location,
              (value) => setConsents(prev => ({ ...prev, location: value })),
              false,
              'location-on'
            )}

            {renderConsentItem(
              'カメラ利用',
              '昆虫写真の撮影にカメラを利用する',
              consents.camera,
              (value) => setConsents(prev => ({ ...prev, camera: value })),
              false,
              'camera-alt'
            )}

            {renderConsentItem(
              'プッシュ通知',
              '重要な通知をプッシュ通知で受け取る',
              consents.notifications,
              (value) => setConsents(prev => ({ ...prev, notifications: value })),
              false,
              'notifications'
            )}
          </View>
        )}

        {/* 同意ボタン */}
        {ageVerified && (
          <View style={styles.submitSection}>
            <TouchableOpacity
              style={[styles.submitButton, !canProceed() && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canProceed()}
            >
              <LinearGradient
                colors={
                  canProceed() 
                    ? CommercialDesign.gradients.primaryButton 
                    : [CommercialDesign.colors.gray[400], CommercialDesign.colors.gray[400]]
                }
                style={styles.submitButtonGradient}
              >
                <MaterialIcons name="check" size={24} color="white" />
                <Text style={styles.submitButtonText}>同意してサービスを開始</Text>
              </LinearGradient>
            </TouchableOpacity>

            {onSkip && (
              <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipButtonText}>後で設定する</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.noteText}>
              ※ プライバシーポリシーと利用規約への同意は必須です{'\n'}
              ※ その他の項目は後から設定で変更できます
            </Text>
          </View>
        )}
      </ScrollView>

      {renderDocumentModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CommercialDesign.colors.background.primary,
  },

  // ヘッダー
  header: {
    paddingTop: 50,
    paddingBottom: CommercialDesign.spacing.xl,
    paddingHorizontal: CommercialDesign.spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: CommercialDesign.spacing.md,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: CommercialDesign.spacing.sm,
    textAlign: 'center',
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
    fontSize: 20,
    fontWeight: '700',
    color: CommercialDesign.colors.text.primary,
    marginBottom: CommercialDesign.spacing.md,
  },
  sectionDescription: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
    marginBottom: CommercialDesign.spacing.lg,
    lineHeight: 20,
  },

  // 日付選択
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.md,
    borderWidth: 1,
    borderColor: CommercialDesign.colors.gray[300],
    ...CommercialDesign.shadows.card,
  },
  dateButtonText: {
    marginLeft: CommercialDesign.spacing.sm,
    fontSize: 16,
    color: CommercialDesign.colors.text.primary,
  },

  // 保護者同意
  parentalSection: {
    marginTop: CommercialDesign.spacing.lg,
    backgroundColor: CommercialDesign.colors.secondary[50],
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: CommercialDesign.colors.secondary[500],
  },
  parentalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CommercialDesign.colors.text.primary,
    marginBottom: CommercialDesign.spacing.sm,
  },
  parentalDescription: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
    marginBottom: CommercialDesign.spacing.md,
    lineHeight: 20,
  },

  // 文書ボタン
  documentButton: {
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    marginBottom: CommercialDesign.spacing.md,
    ...CommercialDesign.shadows.card,
  },
  documentButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: CommercialDesign.spacing.lg,
  },
  documentButtonText: {
    flex: 1,
    marginLeft: CommercialDesign.spacing.md,
  },
  documentButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CommercialDesign.colors.text.primary,
  },
  documentButtonDescription: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
    marginTop: 2,
  },

  // 同意項目
  consentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: CommercialDesign.borders.radius.medium,
    padding: CommercialDesign.spacing.lg,
    marginBottom: CommercialDesign.spacing.md,
    ...CommercialDesign.shadows.card,
  },
  requiredItem: {
    borderLeftWidth: 4,
    borderLeftColor: CommercialDesign.colors.error,
  },
  consentContent: {
    flex: 1,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: CommercialDesign.spacing.xs,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: CommercialDesign.colors.text.primary,
    marginLeft: CommercialDesign.spacing.sm,
  },
  requiredTitle: {
    fontWeight: '600',
  },
  requiredMark: {
    color: CommercialDesign.colors.error,
    fontWeight: '700',
  },
  consentDescription: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
    lineHeight: 18,
  },

  optionalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: CommercialDesign.colors.text.primary,
    marginTop: CommercialDesign.spacing.lg,
    marginBottom: CommercialDesign.spacing.md,
  },

  // 送信セクション
  submitSection: {
    marginVertical: CommercialDesign.spacing.xl,
    alignItems: 'center',
  },
  submitButton: {
    width: '100%',
    height: 56,
    marginBottom: CommercialDesign.spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CommercialDesign.borders.radius.large,
    ...CommercialDesign.shadows.button,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: CommercialDesign.spacing.sm,
  },
  skipButton: {
    paddingVertical: CommercialDesign.spacing.md,
    paddingHorizontal: CommercialDesign.spacing.lg,
  },
  skipButtonText: {
    fontSize: 16,
    color: CommercialDesign.colors.text.secondary,
    textDecorationLine: 'underline',
  },
  noteText: {
    fontSize: 12,
    color: CommercialDesign.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: CommercialDesign.spacing.lg,
    paddingHorizontal: CommercialDesign.spacing.md,
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
  closeButton: {
    padding: CommercialDesign.spacing.sm,
  },
  modalContent: {
    flex: 1,
    padding: CommercialDesign.spacing.lg,
  },
  documentText: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
    lineHeight: 22,
  },
  modalFooter: {
    padding: CommercialDesign.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: CommercialDesign.colors.gray[200],
  },
  versionText: {
    fontSize: 12,
    color: CommercialDesign.colors.text.tertiary,
    textAlign: 'center',
  },
});

export default LegalConsentScreen;