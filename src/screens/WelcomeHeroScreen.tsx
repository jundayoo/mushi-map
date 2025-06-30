import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { CommercialDesign } from '../styles/CommercialDesignSystem';

const { width, height } = Dimensions.get('window');

interface WelcomeHeroScreenProps {
  onGetStarted: () => void;
}

const WelcomeHeroScreen: React.FC<WelcomeHeroScreenProps> = ({ onGetStarted }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: 'camera-alt',
      title: 'AI昆虫識別',
      description: '写真を撮るだけで、AIが自動で昆虫を識別します',
      color: CommercialDesign.colors.tech[500],
    },
    {
      icon: 'explore',
      title: '発見マップ',
      description: '世界中の昆虫発見スポットをリアルタイムで共有',
      color: CommercialDesign.colors.primary[500],
    },
    {
      icon: 'people',
      title: 'コミュニティ',
      description: '昆虫愛好家とつながり、知識を共有しましょう',
      color: CommercialDesign.colors.secondary[500],
    },
    {
      icon: 'videocam',
      title: 'ライブ配信',
      description: '昆虫観察をリアルタイムで世界に配信',
      color: CommercialDesign.colors.tech[600],
    },
  ];

  useEffect(() => {
    // ヒーローアニメーション
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // 機能スライドショー
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const renderFeatureCard = (feature: any, index: number) => (
    <Animated.View
      key={index}
      style={[
        styles.featureCard,
        {
          opacity: currentFeature === index ? 1 : 0.6,
          transform: [
            {
              scale: currentFeature === index ? 1 : 0.95,
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={[feature.color + '20', feature.color + '10']}
        style={styles.featureCardGradient}
      >
        <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
          <MaterialIcons name={feature.icon} size={32} color="white" />
        </View>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={CommercialDesign.colors.primary[600]} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ヒーローセクション */}
        <LinearGradient
          colors={CommercialDesign.gradients.hero}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* 背景パターン */}
          <View style={styles.backgroundPattern}>
            {[...Array(20)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.backgroundDot,
                  {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    opacity: fadeAnim,
                    transform: [
                      {
                        scale: scaleAnim,
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>

          <Animated.View
            style={[
              styles.heroContent,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim,
                  },
                  {
                    scale: scaleAnim,
                  },
                ],
              },
            ]}
          >
            {/* メインロゴ・アイコン */}
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#FFFFFF', '#F0F7FF']}
                style={styles.logoBackground}
              >
                <MaterialIcons name="eco" size={60} color={CommercialDesign.colors.primary[500]} />
              </LinearGradient>
            </View>

            {/* アプリタイトル */}
            <Text style={styles.heroTitle}>むしマップ</Text>
            <Text style={styles.heroSubtitle}>AI昆虫発見・記録・共有アプリ</Text>

            {/* キャッチコピー */}
            <View style={styles.catchphraseContainer}>
              <Text style={styles.catchphrase}>
                📱 撮るだけで識別 
              </Text>
              <Text style={styles.catchphrase}>
                🌍 世界とつながる
              </Text>
              <Text style={styles.catchphrase}>
                🏆 発見を楽しもう
              </Text>
            </View>

            {/* 統計情報 */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>10K+</Text>
                <Text style={styles.statLabel}>発見数</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>500+</Text>
                <Text style={styles.statLabel}>昆虫種</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>1K+</Text>
                <Text style={styles.statLabel}>ユーザー</Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* 機能紹介セクション */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>✨ 主な機能</Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.featuresScroll}
          >
            {features.map(renderFeatureCard)}
          </ScrollView>

          {/* インジケーター */}
          <View style={styles.indicator}>
            {features.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicatorDot,
                  {
                    backgroundColor:
                      currentFeature === index
                        ? CommercialDesign.colors.primary[500]
                        : CommercialDesign.colors.gray[300],
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* 価値提案セクション */}
        <View style={styles.valueSection}>
          <Text style={styles.sectionTitle}>🎯 なぜむしマップ？</Text>
          
          <View style={styles.valueGrid}>
            <View style={styles.valueItem}>
              <LinearGradient
                colors={[CommercialDesign.colors.tech[100], CommercialDesign.colors.tech[50]]}
                style={styles.valueIcon}
              >
                <MaterialIcons name="auto-awesome" size={24} color={CommercialDesign.colors.tech[600]} />
              </LinearGradient>
              <Text style={styles.valueTitle}>AI技術</Text>
              <Text style={styles.valueDescription}>最新のAI技術で99%の精度</Text>
            </View>

            <View style={styles.valueItem}>
              <LinearGradient
                colors={[CommercialDesign.colors.primary[100], CommercialDesign.colors.primary[50]]}
                style={styles.valueIcon}
              >
                <MaterialIcons name="groups" size={24} color={CommercialDesign.colors.primary[600]} />
              </LinearGradient>
              <Text style={styles.valueTitle}>コミュニティ</Text>
              <Text style={styles.valueDescription}>世界中の専門家とつながる</Text>
            </View>

            <View style={styles.valueItem}>
              <LinearGradient
                colors={[CommercialDesign.colors.secondary[100], CommercialDesign.colors.secondary[50]]}
                style={styles.valueIcon}
              >
                <MaterialIcons name="star" size={24} color={CommercialDesign.colors.secondary[600]} />
              </LinearGradient>
              <Text style={styles.valueTitle}>ゲーミフィケーション</Text>
              <Text style={styles.valueDescription}>楽しみながら学習</Text>
            </View>
          </View>
        </View>

        {/* CTAセクション */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={onGetStarted}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={CommercialDesign.gradients.primaryButton}
              style={styles.ctaButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialIcons name="explore" size={24} color="white" />
              <Text style={styles.ctaButtonText}>今すぐ始める</Text>
              <MaterialIcons name="arrow-forward" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.ctaSubtext}>
            無料で利用開始　・　アカウント作成不要
          </Text>
        </View>

        {/* フッター */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 むしマップ. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CommercialDesign.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  
  // ヒーローセクション
  heroSection: {
    minHeight: height * 0.7,
    paddingTop: 60,
    paddingHorizontal: CommercialDesign.spacing.lg,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: CommercialDesign.spacing.lg,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...CommercialDesign.shadows.hero,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: CommercialDesign.spacing.sm,
    letterSpacing: 1.2,
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: CommercialDesign.spacing.xl,
  },
  catchphraseContainer: {
    alignItems: 'center',
    marginBottom: CommercialDesign.spacing.xl,
  },
  catchphrase: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginVertical: 4,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: CommercialDesign.borders.radius.medium,
    paddingVertical: CommercialDesign.spacing.md,
    paddingHorizontal: CommercialDesign.spacing.lg,
    marginTop: CommercialDesign.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: CommercialDesign.spacing.md,
  },

  // 機能セクション
  featuresSection: {
    paddingVertical: CommercialDesign.spacing.xl,
    backgroundColor: CommercialDesign.colors.background.secondary,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: CommercialDesign.colors.text.primary,
    textAlign: 'center',
    marginBottom: CommercialDesign.spacing.lg,
    marginHorizontal: CommercialDesign.spacing.lg,
  },
  featuresScroll: {
    paddingLeft: CommercialDesign.spacing.lg,
  },
  featureCard: {
    width: width * 0.8,
    marginRight: CommercialDesign.spacing.md,
  },
  featureCardGradient: {
    borderRadius: CommercialDesign.borders.radius.large,
    padding: CommercialDesign.spacing.lg,
    alignItems: 'center',
    ...CommercialDesign.shadows.card,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: CommercialDesign.spacing.md,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: CommercialDesign.colors.text.primary,
    marginBottom: CommercialDesign.spacing.sm,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  indicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: CommercialDesign.spacing.lg,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },

  // 価値提案セクション
  valueSection: {
    paddingVertical: CommercialDesign.spacing.xl,
    paddingHorizontal: CommercialDesign.spacing.lg,
  },
  valueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  valueItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: CommercialDesign.spacing.lg,
  },
  valueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: CommercialDesign.spacing.sm,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CommercialDesign.colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  valueDescription: {
    fontSize: 12,
    color: CommercialDesign.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },

  // CTAセクション
  ctaSection: {
    paddingVertical: CommercialDesign.spacing.xl,
    paddingHorizontal: CommercialDesign.spacing.lg,
    alignItems: 'center',
    backgroundColor: CommercialDesign.colors.background.tertiary,
  },
  ctaButton: {
    width: '100%',
    maxWidth: 280,
    height: 56,
    marginBottom: CommercialDesign.spacing.md,
  },
  ctaButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    paddingHorizontal: CommercialDesign.spacing.lg,
    ...CommercialDesign.shadows.button,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginHorizontal: CommercialDesign.spacing.sm,
  },
  ctaSubtext: {
    fontSize: 14,
    color: CommercialDesign.colors.text.secondary,
    textAlign: 'center',
  },

  // フッター
  footer: {
    paddingVertical: CommercialDesign.spacing.lg,
    alignItems: 'center',
    backgroundColor: CommercialDesign.colors.gray[50],
  },
  footerText: {
    fontSize: 12,
    color: CommercialDesign.colors.text.tertiary,
  },
});

export default WelcomeHeroScreen;