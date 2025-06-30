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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  realtimeService, 
  ChatRoom, 
  ChatParticipant 
} from '../services/realtimeService';
import { authService } from '../services/authService';
import ChatInterface from '../components/ChatInterface';

const ChatRoomsScreen: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('connected');
  
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
      
      // リアルタイム接続確認
      const status = realtimeService.getConnectionStatus();
      setConnectionStatus(status);
      
      if (status !== 'connected') {
        await realtimeService.connect();
      }
      
      await loadRooms();
    } catch (error) {
      console.error('画面初期化エラー:', error);
      Alert.alert('エラー', 'データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const roomsList = await realtimeService.getRooms();
      setRooms(roomsList);
    } catch (error) {
      console.error('ルーム読み込みエラー:', error);
    }
  };

  const setupRealtimeListeners = () => {
    realtimeService.on('connection', handleConnectionChange);
    realtimeService.on('roomCreated', handleRoomCreated);
    realtimeService.on('roomUpdated', handleRoomUpdated);
    realtimeService.on('userJoined', handleUserJoined);
    realtimeService.on('userLeft', handleUserLeft);
  };

  const cleanupListeners = () => {
    realtimeService.off('connection', handleConnectionChange);
    realtimeService.off('roomCreated', handleRoomCreated);
    realtimeService.off('roomUpdated', handleRoomUpdated);
    realtimeService.off('userJoined', handleUserJoined);
    realtimeService.off('userLeft', handleUserLeft);
  };

  const handleConnectionChange = (data: { status: string }) => {
    setConnectionStatus(data.status);
    if (data.status === 'disconnected') {
      Alert.alert(
        '接続エラー',
        'リアルタイム機能への接続が切断されました。',
        [
          { text: '再接続', onPress: () => realtimeService.connect() },
          { text: 'キャンセル', style: 'cancel' },
        ]
      );
    }
  };

  const handleRoomCreated = (data: { room: ChatRoom }) => {
    setRooms(prev => [data.room, ...prev]);
  };

  const handleRoomUpdated = (data: { roomId: string; room: ChatRoom }) => {
    setRooms(prev => prev.map(room => 
      room.id === data.roomId ? data.room : room
    ));
  };

  const handleUserJoined = (data: { roomId: string; user: any }) => {
    setRooms(prev => prev.map(room => {
      if (room.id === data.roomId) {
        // 参加者数を更新（簡易実装）
        return { 
          ...room, 
          lastActivity: new Date().toISOString() 
        };
      }
      return room;
    }));
  };

  const handleUserLeft = (data: { roomId: string; user: any }) => {
    // 同様にユーザー離脱を処理
    handleUserJoined(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  };

  const handleJoinRoom = async (room: ChatRoom) => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        Alert.alert('エラー', 'ログインが必要です');
        return;
      }

      // ルーム満員チェック
      if (room.participants.length >= room.settings.maxParticipants) {
        Alert.alert('満員', 'このルームは満員です');
        return;
      }

      const joined = await realtimeService.joinRoom(room.id);
      if (joined) {
        setSelectedRoom(room);
      } else {
        Alert.alert('エラー', 'ルームへの参加に失敗しました');
      }
    } catch (error) {
      console.error('ルーム参加エラー:', error);
      Alert.alert('エラー', 'ルームへの参加に失敗しました');
    }
  };

  const handleCreateRoom = () => {
    Alert.alert(
      'ルーム作成',
      '新しいチャットルームを作成しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '作成',
          onPress: () => {
            // TODO: ルーム作成画面に遷移
            Alert.alert('準備中', 'ルーム作成機能は準備中です');
          },
        },
      ]
    );
  };

  const filteredRooms = rooms.filter(room =>
    searchQuery === '' ||
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderConnectionStatus = () => (
    <View style={[
      styles.connectionStatus,
      connectionStatus === 'connected' && styles.connectionStatusConnected,
      connectionStatus === 'connecting' && styles.connectionStatusConnecting,
      connectionStatus === 'disconnected' && styles.connectionStatusDisconnected,
    ]}>
      <MaterialIcons
        name={
          connectionStatus === 'connected' ? 'wifi' :
          connectionStatus === 'connecting' ? 'wifi-off' : 'signal-wifi-off'
        }
        size={16}
        color="white"
      />
      <Text style={styles.connectionStatusText}>
        {
          connectionStatus === 'connected' ? 'オンライン' :
          connectionStatus === 'connecting' ? '接続中...' : 'オフライン'
        }
      </Text>
    </View>
  );

  const renderRoomCard = (room: ChatRoom, index: number) => {
    const isJoined = room.participants.some(p => p.userId === 'current_user'); // TODO: 実際のユーザーIDで判定
    const onlineCount = room.participants.filter(p => p.isOnline).length;
    
    return (
      <Animated.View
        key={room.id}
        style={[
          styles.roomCard,
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
          onPress={() => handleJoinRoom(room)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FA']}
            style={styles.roomCardGradient}
          >
            {/* ルームヘッダー */}
            <View style={styles.roomHeader}>
              <View style={styles.roomTitleContainer}>
                <Text style={styles.roomName}>{room.name}</Text>
                <View style={styles.roomInfo}>
                  <MaterialIcons 
                    name={getRoomCategoryIcon(room.category)} 
                    size={14} 
                    color="#666" 
                  />
                  <Text style={styles.roomCategory}>
                    {getRoomCategoryLabel(room.category)}
                  </Text>
                  <View style={styles.dot} />
                  <MaterialIcons name="people" size={14} color="#666" />
                  <Text style={styles.participantCount}>
                    {room.participants.length}/{room.settings.maxParticipants}
                  </Text>
                  {onlineCount > 0 && (
                    <>
                      <View style={styles.dot} />
                      <View style={styles.onlineIndicator} />
                      <Text style={styles.onlineCount}>{onlineCount}人オンライン</Text>
                    </>
                  )}
                </View>
              </View>
              
              {isJoined && (
                <View style={styles.joinedBadge}>
                  <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.joinedText}>参加中</Text>
                </View>
              )}
            </View>

            {/* ルーム説明 */}
            <Text style={styles.roomDescription} numberOfLines={2}>
              {room.description}
            </Text>

            {/* 最後のメッセージ */}
            {room.lastMessage && (
              <View style={styles.lastMessage}>
                <Text style={styles.lastMessageUser}>{room.lastMessage.userName}:</Text>
                <Text style={styles.lastMessageContent} numberOfLines={1}>
                  {room.lastMessage.content}
                </Text>
                <Text style={styles.lastMessageTime}>
                  {realtimeService.formatTimeAgo(room.lastMessage.timestamp)}
                </Text>
              </View>
            )}

            {/* タグ */}
            {room.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {room.tags.slice(0, 3).map((tag, tagIndex) => (
                  <View key={tagIndex} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
                {room.tags.length > 3 && (
                  <Text style={styles.moreTagsText}>+{room.tags.length - 3}個</Text>
                )}
              </View>
            )}

            {/* ルーム設定インジケーター */}
            <View style={styles.roomSettings}>
              {room.settings.allowImages && (
                <MaterialIcons name="image" size={16} color="#4CAF50" />
              )}
              {room.settings.allowLocation && (
                <MaterialIcons name="location-on" size={16} color="#4CAF50" />
              )}
              {room.settings.isReadOnly && (
                <MaterialIcons name="visibility" size={16} color="#FF9800" />
              )}
              <View style={styles.roomTypeIndicator}>
                <MaterialIcons 
                  name={room.type === 'public' ? 'public' : 'lock'} 
                  size={14} 
                  color={room.type === 'public' ? '#4CAF50' : '#FF9800'} 
                />
                <Text style={[
                  styles.roomTypeText,
                  { color: room.type === 'public' ? '#4CAF50' : '#FF9800' }
                ]}>
                  {room.type === 'public' ? '公開' : '限定'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getRoomCategoryIcon = (category: ChatRoom['category']): string => {
    const icons = {
      'general': 'chat',
      'identification': 'search',
      'discussion': 'forum',
      'help': 'help',
      'events': 'event',
    };
    return icons[category] || 'chat';
  };

  const getRoomCategoryLabel = (category: ChatRoom['category']): string => {
    const labels = {
      'general': '総合',
      'identification': '識別',
      'discussion': '議論',
      'help': 'ヘルプ',
      'events': 'イベント',
    };
    return labels[category] || category;
  };

  if (selectedRoom) {
    return (
      <ChatInterface
        room={selectedRoom}
        onBack={() => setSelectedRoom(null)}
        onParticipantPress={(userId) => {
          // TODO: ユーザープロフィール表示
          Alert.alert('準備中', 'ユーザープロフィール表示は準備中です');
        }}
      />
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
            <Text style={styles.headerTitle}>💬 チャットルーム</Text>
            {renderConnectionStatus()}
          </View>
          
          <Text style={styles.headerSubtitle}>
            昆虫愛好家たちとリアルタイムで交流しよう
          </Text>

          {/* 検索バー */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="ルームを検索..."
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
            style={styles.createRoomButton}
            onPress={handleCreateRoom}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2196F3', '#1976D2']}
              style={styles.createRoomGradient}
            >
              <MaterialIcons name="add" size={20} color="white" />
              <Text style={styles.createRoomText}>新しいルーム</Text>
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

        {/* ルーム一覧 */}
        <ScrollView
          style={styles.roomsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>ルームを読み込み中...</Text>
            </View>
          ) : filteredRooms.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="chat-bubble-outline" size={64} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>
                {searchQuery ? '検索結果がありません' : 'ルームがありません'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? '別のキーワードで検索してみてください' 
                  : '新しいルームを作成して会話を始めましょう！'
                }
              </Text>
            </View>
          ) : (
            filteredRooms.map((room, index) => renderRoomCard(room, index))
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
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  connectionStatusConnected: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  connectionStatusConnecting: {
    backgroundColor: 'rgba(255, 152, 0, 0.3)',
  },
  connectionStatusDisconnected: {
    backgroundColor: 'rgba(244, 67, 54, 0.3)',
  },
  connectionStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
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
  createRoomButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  createRoomGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  createRoomText: {
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
  roomsList: {
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
  roomCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  roomCardGradient: {
    padding: 20,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roomTitleContainer: {
    flex: 1,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomCategory: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#999',
    marginHorizontal: 6,
  },
  participantCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  onlineIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginLeft: 4,
  },
  onlineCount: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  joinedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  roomDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  lastMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  lastMessageUser: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 6,
  },
  lastMessageContent: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  lastMessageTime: {
    fontSize: 11,
    color: '#999',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#999',
    alignSelf: 'center',
  },
  roomSettings: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomTypeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  bottomPadding: {
    height: 30,
  },
});

export default ChatRoomsScreen;