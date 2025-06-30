import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Animated,
  StatusBar,
  TextInput,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  realtimeService, 
  CollaborativeDiscovery,
  DiscoveryParticipant,
  DiscoveryFinding 
} from '../services/realtimeService';
import { authService } from '../services/authService';
import ChatInterface from '../components/ChatInterface';

const CollaborativeDiscoveryScreen: React.FC = () => {
  const [discoveries, setDiscoveries] = useState<CollaborativeDiscovery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscovery, setSelectedDiscovery] = useState<CollaborativeDiscovery | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeScreen();
    setupRealtimeListeners();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return () => {
      cleanupListeners();
    };
  }, []);

  const initializeScreen = async () => {
    try {
      setIsLoading(true);
      await loadActiveDiscoveries();
    } catch (error) {
      console.error('画面初期化エラー:', error);
      Alert.alert('エラー', 'データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveDiscoveries = async () => {
    try {
      const activeDiscoveries = await realtimeService.getActiveDiscoveries();
      setDiscoveries(activeDiscoveries);
    } catch (error) {
      console.error('探索読み込みエラー:', error);
    }
  };

  const setupRealtimeListeners = () => {
    realtimeService.on('discoveryCreated', handleDiscoveryCreated);
    realtimeService.on('discoveryUpdated', handleDiscoveryUpdated);
    realtimeService.on('participantJoined', handleParticipantJoined);
    realtimeService.on('participantLeft', handleParticipantLeft);
    realtimeService.on('findingAdded', handleFindingAdded);
  };

  const cleanupListeners = () => {
    realtimeService.off('discoveryCreated', handleDiscoveryCreated);
    realtimeService.off('discoveryUpdated', handleDiscoveryUpdated);
    realtimeService.off('participantJoined', handleParticipantJoined);
    realtimeService.off('participantLeft', handleParticipantLeft);
    realtimeService.off('findingAdded', handleFindingAdded);
  };

  const handleDiscoveryCreated = (data: { discovery: CollaborativeDiscovery }) => {
    setDiscoveries(prev => [data.discovery, ...prev]);
  };

  const handleDiscoveryUpdated = (data: { discoveryId: string; discovery: CollaborativeDiscovery }) => {
    setDiscoveries(prev => prev.map(d => 
      d.id === data.discoveryId ? data.discovery : d
    ));
  };

  const handleParticipantJoined = (data: { discoveryId: string; participant: DiscoveryParticipant }) => {
    setDiscoveries(prev => prev.map(discovery => {
      if (discovery.id === data.discoveryId) {
        return {
          ...discovery,
          participants: [...discovery.participants, data.participant],
        };
      }
      return discovery;
    }));
  };

  const handleParticipantLeft = (data: { discoveryId: string; participantId: string }) => {
    setDiscoveries(prev => prev.map(discovery => {
      if (discovery.id === data.discoveryId) {
        return {
          ...discovery,
          participants: discovery.participants.filter(p => p.userId !== data.participantId),
        };
      }
      return discovery;
    }));
  };

  const handleFindingAdded = (data: { discoveryId: string; finding: DiscoveryFinding }) => {
    setDiscoveries(prev => prev.map(discovery => {
      if (discovery.id === data.discoveryId) {
        return {
          ...discovery,
          findings: [...discovery.findings, data.finding],
        };
      }
      return discovery;
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActiveDiscoveries();
    setRefreshing(false);
  };

  const handleCreateDiscovery = () => {
    Alert.alert(
      '🔍 協力探索を開始',
      '新しい昆虫探索プロジェクトを作成しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '作成',
          onPress: () => showDiscoverySetup(),
        },
      ]
    );
  };

  const showDiscoverySetup = () => {
    Alert.prompt(
      '協力探索設定',
      '探索のタイトルを入力してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '探索開始',
          onPress: (title) => startCollaborativeDiscovery(title || '昆虫探索プロジェクト'),
        },
      ],
      'plain-text',
      'カブトムシ探索'
    );
  };

  const startCollaborativeDiscovery = async (title: string) => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        Alert.alert('エラー', 'ログインが必要です');
        return;
      }

      const discoveryData = {
        targetSpecies: 'カブトムシ',
        title,
        description: '協力して昆虫を発見・観察しましょう',
        location: {
          name: '観察地点',
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          radius: 1000, // 1km
        },
        status: 'planning' as const,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4時間後
        maxParticipants: 10,
        difficulty: 'beginner' as const,
        rewards: ['発見バッジ', '協力者バッジ'],
      };

      const result = await realtimeService.createCollaborativeDiscovery(discoveryData);
      
      if (result.success && result.discovery) {
        Alert.alert(
          '🎉 探索プロジェクト作成！',
          `"${title}"の協力探索が作成されました。\n\n他の参加者と協力して昆虫を発見しましょう！`,
          [
            {
              text: '探索に参加',
              onPress: () => setSelectedDiscovery(result.discovery!),
            },
          ]
        );
      } else {
        Alert.alert('エラー', result.error || '探索の作成に失敗しました');
      }
    } catch (error) {
      console.error('探索作成エラー:', error);
      Alert.alert('エラー', '探索の作成に失敗しました');
    }
  };

  const handleJoinDiscovery = async (discovery: CollaborativeDiscovery) => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        Alert.alert('エラー', 'ログインが必要です');
        return;
      }

      if (discovery.participants.length >= discovery.maxParticipants) {
        Alert.alert('満員', 'この探索は満員です');
        return;
      }

      // 参加確認
      Alert.alert(
        '探索に参加',
        `"${discovery.title}"に参加しますか？\n\n目標: ${discovery.targetSpecies}の発見\n場所: ${discovery.location.name}\n難易度: ${getDifficultyLabel(discovery.difficulty)}`,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '参加する',
            onPress: () => joinDiscovery(discovery),
          },
        ]
      );
    } catch (error) {
      console.error('探索参加エラー:', error);
      Alert.alert('エラー', '探索への参加に失敗しました');
    }
  };

  const joinDiscovery = async (discovery: CollaborativeDiscovery) => {
    // 探索に参加
    setSelectedDiscovery(discovery);
    
    // 参加者としてシミュレート
    const currentUser = await authService.getCurrentUser();
    if (currentUser) {
      realtimeService.emit('participantJoined', {
        discoveryId: discovery.id,
        participant: {
          userId: currentUser.id,
          userName: currentUser.displayName,
          userAvatar: currentUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.id}`,
          role: 'participant' as const,
          joinedAt: new Date().toISOString(),
          lastUpdate: new Date().toISOString(),
          status: 'joined' as const,
        }
      });
    }
  };

  const filteredDiscoveries = discoveries.filter(discovery =>
    searchQuery === '' ||
    discovery.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discovery.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discovery.targetSpecies.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderDiscoveryCard = (discovery: CollaborativeDiscovery, index: number) => {
    const timeUntilStart = new Date(discovery.startTime).getTime() - Date.now();
    const isStarted = timeUntilStart <= 0;
    const isExpired = new Date(discovery.endTime).getTime() < Date.now();
    const participantCount = discovery.participants.length;
    const findingsCount = discovery.findings.length;
    
    return (
      <Animated.View
        key={discovery.id}
        style={[
          styles.discoveryCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleJoinDiscovery(discovery)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FA']}
            style={styles.discoveryCardGradient}
          >
            {/* ヘッダー */}
            <View style={styles.discoveryHeader}>
              <View style={styles.discoveryTitleContainer}>
                <Text style={styles.discoveryTitle}>{discovery.title}</Text>
                <View style={styles.discoveryMetadata}>
                  <MaterialIcons name="search" size={14} color="#666" />
                  <Text style={styles.targetSpecies}>{discovery.targetSpecies}</Text>
                  <View style={styles.dot} />
                  <MaterialIcons name="place" size={14} color="#666" />
                  <Text style={styles.locationName}>{discovery.location.name}</Text>
                </View>
              </View>
              
              <View style={[
                styles.statusBadge,
                discovery.status === 'active' && styles.statusBadgeActive,
                discovery.status === 'planning' && styles.statusBadgePlanning,
                discovery.status === 'completed' && styles.statusBadgeCompleted,
              ]}>
                <Text style={[
                  styles.statusText,
                  discovery.status === 'active' && styles.statusTextActive,
                  discovery.status === 'planning' && styles.statusTextPlanning,
                  discovery.status === 'completed' && styles.statusTextCompleted,
                ]}>
                  {getStatusLabel(discovery.status)}
                </Text>
              </View>
            </View>

            {/* 説明 */}
            <Text style={styles.discoveryDescription} numberOfLines={2}>
              {discovery.description}
            </Text>

            {/* 統計情報 */}
            <View style={styles.discoveryStats}>
              <View style={styles.statItem}>
                <MaterialIcons name="people" size={20} color="#4CAF50" />
                <Text style={styles.statValue}>{participantCount}</Text>
                <Text style={styles.statLabel}>参加者</Text>
              </View>
              
              <View style={styles.statItem}>
                <MaterialIcons name="visibility" size={20} color="#2196F3" />
                <Text style={styles.statValue}>{findingsCount}</Text>
                <Text style={styles.statLabel}>発見</Text>
              </View>
              
              <View style={styles.statItem}>
                <MaterialIcons name="trending_up" size={20} color="#FF9800" />
                <Text style={styles.statValue}>{getDifficultyLabel(discovery.difficulty)}</Text>
                <Text style={styles.statLabel}>難易度</Text>
              </View>
              
              <View style={styles.statItem}>
                <MaterialIcons name="schedule" size={20} color="#9C27B0" />
                <Text style={styles.statValue}>
                  {isExpired ? '終了' : isStarted ? '進行中' : formatTimeUntil(timeUntilStart)}
                </Text>
                <Text style={styles.statLabel}>状況</Text>
              </View>
            </View>

            {/* 参加者アバター */}
            {discovery.participants.length > 0 && (
              <View style={styles.participantsContainer}>
                <Text style={styles.participantsLabel}>参加者:</Text>
                <View style={styles.participantAvatars}>
                  {discovery.participants.slice(0, 5).map((participant, pIndex) => (
                    <Image
                      key={participant.userId}
                      source={{ uri: participant.userAvatar }}
                      style={[
                        styles.participantAvatar,
                        { marginLeft: pIndex > 0 ? -8 : 0 }
                      ]}
                    />
                  ))}
                  {discovery.participants.length > 5 && (
                    <View style={[styles.participantAvatar, styles.moreParticipants]}>
                      <Text style={styles.moreParticipantsText}>
                        +{discovery.participants.length - 5}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* 最新の発見 */}
            {discovery.findings.length > 0 && (
              <View style={styles.latestFinding}>
                <MaterialIcons name="new-releases" size={16} color="#4CAF50" />
                <Text style={styles.latestFindingText}>
                  最新発見: {discovery.findings[discovery.findings.length - 1].description}
                </Text>
              </View>
            )}

            {/* 報酬 */}
            <View style={styles.rewardsContainer}>
              <Text style={styles.rewardsLabel}>報酬:</Text>
              <View style={styles.rewards}>
                {discovery.rewards.map((reward, rIndex) => (
                  <View key={rIndex} style={styles.rewardBadge}>
                    <Text style={styles.rewardText}>{reward}</Text>
                  </View>
                ))}
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getStatusLabel = (status: CollaborativeDiscovery['status']): string => {
    const labels = {
      'planning': '計画中',
      'active': '実行中',
      'completed': '完了',
      'cancelled': '中止',
    };
    return labels[status] || status;
  };

  const getDifficultyLabel = (difficulty: CollaborativeDiscovery['difficulty']): string => {
    const labels = {
      'beginner': '初級',
      'intermediate': '中級',
      'advanced': '上級',
    };
    return labels[difficulty] || difficulty;
  };

  const formatTimeUntil = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}時間${minutes}分後`;
    } else if (minutes > 0) {
      return `${minutes}分後`;
    } else {
      return 'まもなく';
    }
  };

  if (selectedDiscovery) {
    // チャットルームを取得
    const chatRoom = {
      id: selectedDiscovery.chatRoomId,
      name: `🔍 ${selectedDiscovery.title}`,
      description: selectedDiscovery.description,
      type: 'private' as const,
      category: 'general' as const,
      participants: selectedDiscovery.participants.map(participant => ({
        userId: participant.userId,
        userName: participant.userName,
        userAvatar: participant.userAvatar,
        role: participant.role === 'organizer' ? 'owner' as const : 'member' as const,
        joinedAt: participant.joinedAt,
        lastSeen: participant.lastUpdate,
        isOnline: participant.status !== 'completed',
        status: 'active' as const,
      })),
      lastActivity: new Date().toISOString(),
      createdAt: selectedDiscovery.startTime,
      createdBy: selectedDiscovery.organizer,
      settings: {
        allowImages: true,
        allowLocation: true,
        moderationLevel: 'low' as const,
        maxParticipants: selectedDiscovery.maxParticipants,
        isReadOnly: false,
        autoDeleteMessages: false,
        autoDeleteHours: 168,
      },
      isActive: true,
      tags: ['協力探索', selectedDiscovery.targetSpecies],
    };

    return (
      <View style={styles.discoveryViewContainer}>
        {/* 探索情報ヘッダー */}
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.discoveryViewHeader}
        >
          <View style={styles.discoveryViewHeaderContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedDiscovery(null)}
            >
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.discoveryViewTitle}>
              <Text style={styles.discoveryViewTitleText}>{selectedDiscovery.title}</Text>
              <Text style={styles.discoveryViewSubtitle}>
                目標: {selectedDiscovery.targetSpecies} | {selectedDiscovery.participants.length}人参加中
              </Text>
            </View>
            
            <TouchableOpacity style={styles.discoveryMenuButton}>
              <MaterialIcons name="more-vert" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* チャット */}
        <ChatInterface
          room={chatRoom}
          onParticipantPress={(userId) => {
            Alert.alert('準備中', 'ユーザープロフィール表示は準備中です');
          }}
          style={styles.discoveryChat}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* ヘッダー */}
      <LinearGradient
        colors={['#4CAF50', '#2E7D32']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>🔍 協力探索</Text>
            <View style={styles.discoveryIndicator}>
              <View style={[styles.dot, { backgroundColor: '#81C784' }]} />
              <Text style={styles.discoveryCount}>{discoveries.length}件進行中</Text>
            </View>
          </View>
          
          <Text style={styles.headerSubtitle}>
            仲間と協力して昆虫を発見しよう
          </Text>

          {/* 検索バー */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="探索を検索..."
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="clear" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* コンテンツ */}
      <View style={styles.content}>
        {/* アクションボタン */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.createDiscoveryButton}
            onPress={handleCreateDiscovery}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.createDiscoveryGradient}
            >
              <MaterialIcons name="add" size={20} color="white" />
              <Text style={styles.createDiscoveryText}>新しい探索</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            activeOpacity={0.8}
          >
            <MaterialIcons name="refresh" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {/* 探索一覧 */}
        <ScrollView
          style={styles.discoveriesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>探索を読み込み中...</Text>
            </View>
          ) : filteredDiscoveries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="explore-off" size={64} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>
                {searchQuery ? '検索結果がありません' : '現在進行中の探索がありません'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? '別のキーワードで検索してみてください' 
                  : '新しい協力探索を始めてみませんか？'
                }
              </Text>
            </View>
          ) : (
            filteredDiscoveries.map((discovery, index) => renderDiscoveryCard(discovery, index))
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  discoveryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discoveryCount: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 12,
  },
  createDiscoveryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  createDiscoveryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  createDiscoveryText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  discoveriesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  discoveryCard: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  discoveryCardGradient: {
    padding: 20,
  },
  discoveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  discoveryTitleContainer: {
    flex: 1,
  },
  discoveryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  discoveryMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetSpecies: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  locationName: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgePlanning: {
    backgroundColor: '#FFF3E0',
  },
  statusBadgeActive: {
    backgroundColor: '#E8F5E8',
  },
  statusBadgeCompleted: {
    backgroundColor: '#F3E5F5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextPlanning: {
    color: '#FF9800',
  },
  statusTextActive: {
    color: '#4CAF50',
  },
  statusTextCompleted: {
    color: '#9C27B0',
  },
  discoveryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  discoveryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 8,
  },
  participantAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
  },
  moreParticipants: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreParticipantsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  latestFinding: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  latestFindingText: {
    fontSize: 12,
    color: '#2E7D32',
    marginLeft: 6,
    flex: 1,
  },
  rewardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 8,
  },
  rewards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rewardBadge: {
    backgroundColor: '#FFE0B2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  rewardText: {
    fontSize: 11,
    color: '#F57C00',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 30,
  },
  // 探索詳細画面
  discoveryViewContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  discoveryViewHeader: {
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 15,
  },
  discoveryViewHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  discoveryViewTitle: {
    flex: 1,
  },
  discoveryViewTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  discoveryViewSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  discoveryMenuButton: {
    padding: 5,
    marginLeft: 10,
  },
  discoveryChat: {
    flex: 1,
  },
});

export default CollaborativeDiscoveryScreen;