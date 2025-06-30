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
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  realtimeService, 
  LiveStream,
  StreamViewer 
} from '../services/realtimeService';
import { authService } from '../services/authService';
import ChatInterface from '../components/ChatInterface';

const { width } = Dimensions.get('window');

const LiveStreamingScreen: React.FC = () => {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
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
      await loadActiveStreams();
    } catch (error) {
      console.error('画面初期化エラー:', error);
      Alert.alert('エラー', 'データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveStreams = async () => {
    try {
      const activeStreams = await realtimeService.getActiveStreams();
      setStreams(activeStreams);
    } catch (error) {
      console.error('ストリーム読み込みエラー:', error);
    }
  };

  const setupRealtimeListeners = () => {
    realtimeService.on('streamStarted', handleStreamStarted);
    realtimeService.on('streamEnded', handleStreamEnded);
    realtimeService.on('viewerJoined', handleViewerJoined);
    realtimeService.on('viewerLeft', handleViewerLeft);
  };

  const cleanupListeners = () => {
    realtimeService.off('streamStarted', handleStreamStarted);
    realtimeService.off('streamEnded', handleStreamEnded);
    realtimeService.off('viewerJoined', handleViewerJoined);
    realtimeService.off('viewerLeft', handleViewerLeft);
  };

  const handleStreamStarted = (data: { stream: LiveStream }) => {
    setStreams(prev => [data.stream, ...prev]);
  };

  const handleStreamEnded = (data: { streamId: string }) => {
    setStreams(prev => prev.filter(stream => stream.id !== data.streamId));
  };

  const handleViewerJoined = (data: { streamId: string; viewer: StreamViewer }) => {
    setStreams(prev => prev.map(stream => {
      if (stream.id === data.streamId) {
        return {
          ...stream,
          viewerCount: stream.viewerCount + 1,
          viewers: [...stream.viewers, data.viewer],
        };
      }
      return stream;
    }));
  };

  const handleViewerLeft = (data: { streamId: string; viewerId: string }) => {
    setStreams(prev => prev.map(stream => {
      if (stream.id === data.streamId) {
        return {
          ...stream,
          viewerCount: Math.max(0, stream.viewerCount - 1),
          viewers: stream.viewers.filter(v => v.userId !== data.viewerId),
        };
      }
      return stream;
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActiveStreams();
    setRefreshing(false);
  };

  const handleStartStreaming = () => {
    Alert.alert(
      '📺 ライブ配信を開始',
      '昆虫観察の様子をリアルタイムで配信しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '配信開始',
          onPress: () => showStreamSetup(),
        },
      ]
    );
  };

  const showStreamSetup = () => {
    Alert.prompt(
      'ライブ配信設定',
      '配信タイトルを入力してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '配信開始',
          onPress: (title) => startLiveStream(title || '昆虫観察ライブ'),
        },
      ],
      'plain-text',
      '昆虫観察ライブ'
    );
  };

  const startLiveStream = async (title: string) => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        Alert.alert('エラー', 'ログインが必要です');
        return;
      }

      const streamData = {
        title,
        description: '昆虫の生態をリアルタイムで観察・解説',
        category: 'observation' as const,
        location: {
          name: '観察地点',
          coordinates: { latitude: 35.6762, longitude: 139.6503 }
        },
        tags: ['昆虫観察', 'ライブ', '生態'],
      };

      const result = await realtimeService.startLiveStream(streamData);
      
      if (result.success && result.stream) {
        setIsStreaming(true);
        Alert.alert(
          '🎉 配信開始！',
          `"${title}"の配信が開始されました。\n\nチャットで視聴者とコミュニケーションを取りながら配信を楽しみましょう！`,
          [
            {
              text: '配信画面へ',
              onPress: () => setSelectedStream(result.stream!),
            },
          ]
        );
      } else {
        Alert.alert('エラー', result.error || '配信の開始に失敗しました');
      }
    } catch (error) {
      console.error('配信開始エラー:', error);
      Alert.alert('エラー', '配信の開始に失敗しました');
    }
  };

  const handleJoinStream = async (stream: LiveStream) => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        Alert.alert('エラー', 'ログインが必要です');
        return;
      }

      // 視聴者として配信に参加
      setSelectedStream(stream);
      
      // 視聴者カウント更新をシミュレート
      realtimeService.emit('viewerJoined', {
        streamId: stream.id,
        viewer: {
          userId: currentUser.id,
          userName: currentUser.displayName,
          userAvatar: currentUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.id}`,
          joinedAt: new Date().toISOString(),
          isActive: true,
        }
      });
    } catch (error) {
      console.error('配信参加エラー:', error);
      Alert.alert('エラー', '配信への参加に失敗しました');
    }
  };

  const filteredStreams = streams.filter(stream =>
    searchQuery === '' ||
    stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stream.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stream.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderStreamCard = (stream: LiveStream, index: number) => {
    const streamDuration = new Date().getTime() - new Date(stream.startedAt).getTime();
    const hours = Math.floor(streamDuration / (1000 * 60 * 60));
    const minutes = Math.floor((streamDuration % (1000 * 60 * 60)) / (1000 * 60));
    
    return (
      <Animated.View
        key={stream.id}
        style={[
          styles.streamCard,
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
          onPress={() => handleJoinStream(stream)}
          activeOpacity={0.8}
        >
          <View style={styles.streamCardContainer}>
            {/* ストリーム画像/サムネイル */}
            <View style={styles.streamThumbnail}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                style={styles.thumbnailGradient}
              >
                <MaterialIcons name="videocam" size={48} color="white" />
                <Text style={styles.categoryBadge}>
                  {getStreamCategoryLabel(stream.category)}
                </Text>
              </LinearGradient>
              
              {/* ライブバッジ */}
              <View style={styles.liveBadge}>
                <View style={styles.liveIndicator} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              
              {/* 視聴者数 */}
              <View style={styles.viewerBadge}>
                <MaterialIcons name="visibility" size={16} color="white" />
                <Text style={styles.viewerCount}>{stream.viewerCount}</Text>
              </View>
              
              {/* 配信時間 */}
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>
                  {hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : `${minutes}分`}
                </Text>
              </View>
            </View>

            {/* ストリーム情報 */}
            <View style={styles.streamInfo}>
              <Text style={styles.streamTitle} numberOfLines={2}>
                {stream.title}
              </Text>
              
              <View style={styles.streamerInfo}>
                <Image 
                  source={{ uri: stream.streamerAvatar }} 
                  style={styles.streamerAvatar} 
                />
                <View style={styles.streamerDetails}>
                  <Text style={styles.streamerName}>{stream.streamerName}</Text>
                  <Text style={styles.streamDescription} numberOfLines={1}>
                    {stream.description}
                  </Text>
                </View>
              </View>

              {/* 位置情報 */}
              {stream.location && (
                <View style={styles.locationInfo}>
                  <MaterialIcons name="place" size={14} color="#666" />
                  <Text style={styles.locationText}>{stream.location.name}</Text>
                </View>
              )}

              {/* タグ */}
              <View style={styles.tagsContainer}>
                {stream.tags.slice(0, 3).map((tag, tagIndex) => (
                  <View key={tagIndex} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
                {stream.tags.length > 3 && (
                  <Text style={styles.moreTagsText}>+{stream.tags.length - 3}</Text>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getStreamCategoryLabel = (category: LiveStream['category']): string => {
    const labels = {
      'observation': '観察',
      'identification': '識別',
      'education': '学習',
      'expedition': '探検',
    };
    return labels[category] || category;
  };

  if (selectedStream) {
    // チャットルームを取得
    const chatRoom = {
      id: selectedStream.chatRoomId,
      name: `📺 ${selectedStream.title}`,
      description: selectedStream.description,
      type: 'public' as const,
      category: 'general' as const,
      participants: selectedStream.viewers.map(viewer => ({
        userId: viewer.userId,
        userName: viewer.userName,
        userAvatar: viewer.userAvatar,
        role: 'member' as const,
        joinedAt: viewer.joinedAt,
        lastSeen: new Date().toISOString(),
        isOnline: viewer.isActive,
        status: 'active' as const,
      })),
      lastActivity: new Date().toISOString(),
      createdAt: selectedStream.startedAt,
      createdBy: selectedStream.streamerId,
      settings: {
        allowImages: true,
        allowLocation: false,
        moderationLevel: 'medium' as const,
        maxParticipants: 1000,
        isReadOnly: false,
        autoDeleteMessages: true,
        autoDeleteHours: 24,
      },
      isActive: true,
      tags: selectedStream.tags,
    };

    return (
      <View style={styles.streamViewContainer}>
        {/* ストリーム画面 */}
        <View style={styles.streamPlayer}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            style={styles.streamPlayerGradient}
          >
            <MaterialIcons name="videocam" size={80} color="white" />
            <Text style={styles.streamPlayerTitle}>{selectedStream.title}</Text>
            <Text style={styles.streamPlayerSubtitle}>
              配信者: {selectedStream.streamerName}
            </Text>
            
            {/* 視聴者情報 */}
            <View style={styles.streamPlayerInfo}>
              <View style={styles.liveIndicatorLarge}>
                <View style={styles.liveIndicatorDot} />
                <Text style={styles.liveTextLarge}>LIVE</Text>
              </View>
              <View style={styles.viewerInfo}>
                <MaterialIcons name="visibility" size={20} color="white" />
                <Text style={styles.viewerCountLarge}>{selectedStream.viewerCount}人が視聴中</Text>
              </View>
            </View>
          </LinearGradient>
          
          {/* 戻るボタン */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedStream(null)}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* チャット */}
        <View style={styles.streamChatContainer}>
          <ChatInterface
            room={chatRoom}
            onParticipantPress={(userId) => {
              Alert.alert('準備中', 'ユーザープロフィール表示は準備中です');
            }}
            style={styles.streamChat}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />
      
      {/* ヘッダー */}
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>📺 ライブ配信</Text>
            <View style={styles.streamIndicator}>
              <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.streamCount}>{streams.length}配信中</Text>
            </View>
          </View>
          
          <Text style={styles.headerSubtitle}>
            昆虫観察をリアルタイムで共有・視聴しよう
          </Text>

          {/* 検索バー */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="配信を検索..."
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
            style={styles.startStreamButton}
            onPress={handleStartStreaming}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B6B', '#E53E3E']}
              style={styles.startStreamGradient}
            >
              <MaterialIcons name="videocam" size={20} color="white" />
              <Text style={styles.startStreamText}>配信開始</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            activeOpacity={0.8}
          >
            <MaterialIcons name="refresh" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>

        {/* 配信一覧 */}
        <ScrollView
          style={styles.streamsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>配信を読み込み中...</Text>
            </View>
          ) : filteredStreams.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="videocam-off" size={64} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>
                {searchQuery ? '検索結果がありません' : '現在配信中のストリームがありません'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? '別のキーワードで検索してみてください' 
                  : '昆虫観察の配信を開始してみませんか？'
                }
              </Text>
            </View>
          ) : (
            filteredStreams.map((stream, index) => renderStreamCard(stream, index))
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
  streamIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streamCount: {
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
  startStreamButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startStreamGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  startStreamText: {
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
  streamsList: {
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
  streamCard: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    backgroundColor: 'white',
  },
  streamCardContainer: {
    // No additional styles needed
  },
  streamThumbnail: {
    height: 200,
    position: 'relative',
  },
  thumbnailGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginTop: 8,
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: 4,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  viewerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewerCount: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  streamInfo: {
    padding: 16,
  },
  streamTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  streamerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  streamerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  streamerDetails: {
    flex: 1,
  },
  streamerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  streamDescription: {
    fontSize: 12,
    color: '#666',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#999',
    alignSelf: 'center',
  },
  bottomPadding: {
    height: 30,
  },
  // ストリーム視聴画面
  streamViewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  streamPlayer: {
    height: width * 0.6,
    position: 'relative',
  },
  streamPlayerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  streamPlayerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  streamPlayerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  streamPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  liveIndicatorLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 6,
  },
  liveTextLarge: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  viewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  viewerCountLarge: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  streamChatContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  streamChat: {
    flex: 1,
  },
});

export default LiveStreamingScreen;