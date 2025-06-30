import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  type: 'text' | 'image' | 'location' | 'discovery' | 'system';
  timestamp: string;
  metadata?: any;
  reactions?: MessageReaction[];
  isEdited?: boolean;
  replyTo?: string;
}

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'discovery' | 'location';
  category: 'general' | 'identification' | 'discussion' | 'help' | 'events';
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  lastActivity: string;
  createdAt: string;
  createdBy: string;
  settings: RoomSettings;
  isActive: boolean;
  tags: string[];
}

export interface ChatParticipant {
  userId: string;
  userName: string;
  userAvatar: string;
  role: 'owner' | 'moderator' | 'member';
  joinedAt: string;
  lastSeen: string;
  isOnline: boolean;
  status: 'active' | 'away' | 'busy' | 'invisible';
}

export interface RoomSettings {
  allowImages: boolean;
  allowLocation: boolean;
  moderationLevel: 'none' | 'low' | 'medium' | 'high';
  maxParticipants: number;
  isReadOnly: boolean;
  autoDeleteMessages: boolean;
  autoDeleteHours: number;
}

export interface LiveStream {
  id: string;
  streamerId: string;
  streamerName: string;
  streamerAvatar: string;
  title: string;
  description: string;
  category: 'observation' | 'identification' | 'education' | 'expedition';
  location?: {
    name: string;
    coordinates: { latitude: number; longitude: number };
  };
  startedAt: string;
  endedAt?: string;
  isLive: boolean;
  viewerCount: number;
  viewers: StreamViewer[];
  chatRoomId: string;
  tags: string[];
  thumbnailUrl?: string;
  recordingUrl?: string;
}

export interface StreamViewer {
  userId: string;
  userName: string;
  userAvatar: string;
  joinedAt: string;
  isActive: boolean;
}

export interface CollaborativeDiscovery {
  id: string;
  targetSpecies: string;
  title: string;
  description: string;
  location: {
    name: string;
    coordinates: { latitude: number; longitude: number };
    radius: number; // meters
  };
  organizer: string;
  participants: DiscoveryParticipant[];
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  startTime: string;
  endTime: string;
  findings: DiscoveryFinding[];
  chatRoomId: string;
  maxParticipants: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rewards: string[];
}

export interface DiscoveryParticipant {
  userId: string;
  userName: string;
  userAvatar: string;
  role: 'organizer' | 'guide' | 'participant';
  joinedAt: string;
  location?: { latitude: number; longitude: number };
  lastUpdate: string;
  status: 'joined' | 'on_way' | 'arrived' | 'exploring' | 'completed';
}

export interface DiscoveryFinding {
  id: string;
  discoveredBy: string;
  speciesId: string;
  location: { latitude: number; longitude: number };
  imageUrl: string;
  description: string;
  confidence: number;
  verifiedBy?: string[];
  timestamp: string;
}

class RealtimeService {
  private readonly CHAT_MESSAGES_KEY = '@mushi_map_chat_messages';
  private readonly CHAT_ROOMS_KEY = '@mushi_map_chat_rooms';
  private readonly LIVE_STREAMS_KEY = '@mushi_map_live_streams';
  private readonly DISCOVERIES_KEY = '@mushi_map_collaborative_discoveries';
  
  // WebSocket接続の模擬実装
  private listeners: Map<string, Function[]> = new Map();
  private connectionStatus: 'connected' | 'connecting' | 'disconnected' = 'connected';

  // ============ リアルタイム接続管理 ============

  async connect(): Promise<boolean> {
    try {
      // 実際の実装では WebSocket や Socket.IO を使用
      this.connectionStatus = 'connecting';
      
      // 模擬接続
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.connectionStatus = 'connected';
      this.emit('connection', { status: 'connected' });
      
      // 定期的なハートビート
      this.startHeartbeat();
      
      return true;
    } catch (error) {
      console.error('リアルタイム接続エラー:', error);
      this.connectionStatus = 'disconnected';
      return false;
    }
  }

  disconnect(): void {
    this.connectionStatus = 'disconnected';
    this.emit('connection', { status: 'disconnected' });
  }

  private startHeartbeat(): void {
    setInterval(() => {
      if (this.connectionStatus === 'connected') {
        this.emit('heartbeat', { timestamp: new Date().toISOString() });
      }
    }, 30000); // 30秒間隔
  }

  // ============ イベントリスナー管理 ============

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('イベントコールバックエラー:', error);
        }
      });
    }
  }

  // ============ チャット機能 ============

  async sendMessage(
    roomId: string,
    content: string,
    type: ChatMessage['type'] = 'text',
    metadata?: any
  ): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'ログインが必要です' };
      }

      const message: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId,
        userId: currentUser.id,
        userName: currentUser.displayName,
        userAvatar: currentUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.id}`,
        content: content.trim(),
        type,
        timestamp: new Date().toISOString(),
        metadata,
        reactions: [],
      };

      // ローカルストレージに保存
      await this.saveMessage(message);

      // リアルタイム配信
      this.emit('message', { roomId, message });

      // ルーム情報更新
      await this.updateRoomLastMessage(roomId, message);

      return { success: true, message };
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      return { success: false, error: 'メッセージの送信に失敗しました' };
    }
  }

  async getMessages(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const messagesJson = await AsyncStorage.getItem(this.CHAT_MESSAGES_KEY);
      const messages: ChatMessage[] = messagesJson ? JSON.parse(messagesJson) : [];
      
      return messages
        .filter(message => message.roomId === roomId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
        .reverse();
    } catch (error) {
      console.error('メッセージ取得エラー:', error);
      return [];
    }
  }

  private async saveMessage(message: ChatMessage): Promise<void> {
    try {
      const messagesJson = await AsyncStorage.getItem(this.CHAT_MESSAGES_KEY);
      const messages: ChatMessage[] = messagesJson ? JSON.parse(messagesJson) : [];
      
      messages.push(message);
      
      // 最新1000件のみ保持
      const limitedMessages = messages.slice(-1000);
      
      await AsyncStorage.setItem(this.CHAT_MESSAGES_KEY, JSON.stringify(limitedMessages));
    } catch (error) {
      console.error('メッセージ保存エラー:', error);
    }
  }

  async addReaction(messageId: string, emoji: string): Promise<boolean> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) return false;

      const messagesJson = await AsyncStorage.getItem(this.CHAT_MESSAGES_KEY);
      const messages: ChatMessage[] = messagesJson ? JSON.parse(messagesJson) : [];
      
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) return false;

      const message = messages[messageIndex];
      if (!message.reactions) message.reactions = [];

      const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);
      
      if (reactionIndex === -1) {
        // 新しいリアクション
        message.reactions.push({
          emoji,
          users: [currentUser.id],
          count: 1,
        });
      } else {
        // 既存のリアクションに追加/削除
        const reaction = message.reactions[reactionIndex];
        const userIndex = reaction.users.indexOf(currentUser.id);
        
        if (userIndex === -1) {
          reaction.users.push(currentUser.id);
          reaction.count++;
        } else {
          reaction.users.splice(userIndex, 1);
          reaction.count--;
          
          if (reaction.count === 0) {
            message.reactions.splice(reactionIndex, 1);
          }
        }
      }

      await AsyncStorage.setItem(this.CHAT_MESSAGES_KEY, JSON.stringify(messages));
      this.emit('messageUpdated', { messageId, message });
      
      return true;
    } catch (error) {
      console.error('リアクション追加エラー:', error);
      return false;
    }
  }

  // ============ チャットルーム管理 ============

  async createRoom(roomData: Omit<ChatRoom, 'id' | 'participants' | 'lastActivity' | 'createdAt' | 'isActive'>): Promise<{ success: boolean; room?: ChatRoom; error?: string }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'ログインが必要です' };
      }

      const room: ChatRoom = {
        ...roomData,
        id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        participants: [{
          userId: currentUser.id,
          userName: currentUser.displayName,
          userAvatar: currentUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.id}`,
          role: 'owner',
          joinedAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          isOnline: true,
          status: 'active',
        }],
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      await this.saveRoom(room);
      this.emit('roomCreated', { room });

      return { success: true, room };
    } catch (error) {
      console.error('ルーム作成エラー:', error);
      return { success: false, error: 'ルームの作成に失敗しました' };
    }
  }

  async getRooms(): Promise<ChatRoom[]> {
    try {
      const roomsJson = await AsyncStorage.getItem(this.CHAT_ROOMS_KEY);
      const rooms: ChatRoom[] = roomsJson ? JSON.parse(roomsJson) : [];
      
      // デフォルトルームが存在しない場合は作成
      if (rooms.length === 0) {
        await this.createDefaultRooms();
        return this.getRooms();
      }
      
      return rooms.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    } catch (error) {
      console.error('ルーム取得エラー:', error);
      return [];
    }
  }

  private async createDefaultRooms(): Promise<void> {
    const defaultRooms = [
      {
        name: '🌍 総合チャット',
        description: 'むしマップユーザーの総合雑談ルーム',
        type: 'public' as const,
        category: 'general' as const,
        createdBy: 'system',
        settings: {
          allowImages: true,
          allowLocation: true,
          moderationLevel: 'medium' as const,
          maxParticipants: 1000,
          isReadOnly: false,
          autoDeleteMessages: false,
          autoDeleteHours: 24,
        },
        tags: ['雑談', '交流', '初心者歓迎'],
      },
      {
        name: '🔍 昆虫識別ヘルプ',
        description: '昆虫の名前がわからない時の質問ルーム',
        type: 'public' as const,
        category: 'identification' as const,
        createdBy: 'system',
        settings: {
          allowImages: true,
          allowLocation: true,
          moderationLevel: 'low' as const,
          maxParticipants: 500,
          isReadOnly: false,
          autoDeleteMessages: false,
          autoDeleteHours: 48,
        },
        tags: ['識別', '質問', 'ヘルプ'],
      },
      {
        name: '📚 昆虫学習ディスカッション',
        description: '昆虫に関する学習や知識共有',
        type: 'public' as const,
        category: 'discussion' as const,
        createdBy: 'system',
        settings: {
          allowImages: true,
          allowLocation: false,
          moderationLevel: 'medium' as const,
          maxParticipants: 200,
          isReadOnly: false,
          autoDeleteMessages: false,
          autoDeleteHours: 168, // 1週間
        },
        tags: ['学習', '知識', 'ディスカッション'],
      }
    ];

    for (const roomData of defaultRooms) {
      await this.createRoom(roomData);
    }
  }

  private async saveRoom(room: ChatRoom): Promise<void> {
    try {
      const roomsJson = await AsyncStorage.getItem(this.CHAT_ROOMS_KEY);
      const rooms: ChatRoom[] = roomsJson ? JSON.parse(roomsJson) : [];
      
      const existingIndex = rooms.findIndex(r => r.id === room.id);
      if (existingIndex >= 0) {
        rooms[existingIndex] = room;
      } else {
        rooms.push(room);
      }
      
      await AsyncStorage.setItem(this.CHAT_ROOMS_KEY, JSON.stringify(rooms));
    } catch (error) {
      console.error('ルーム保存エラー:', error);
    }
  }

  private async updateRoomLastMessage(roomId: string, message: ChatMessage): Promise<void> {
    try {
      const roomsJson = await AsyncStorage.getItem(this.CHAT_ROOMS_KEY);
      const rooms: ChatRoom[] = roomsJson ? JSON.parse(roomsJson) : [];
      
      const roomIndex = rooms.findIndex(r => r.id === roomId);
      if (roomIndex >= 0) {
        rooms[roomIndex].lastMessage = message;
        rooms[roomIndex].lastActivity = message.timestamp;
        await AsyncStorage.setItem(this.CHAT_ROOMS_KEY, JSON.stringify(rooms));
        this.emit('roomUpdated', { roomId, room: rooms[roomIndex] });
      }
    } catch (error) {
      console.error('ルーム更新エラー:', error);
    }
  }

  async joinRoom(roomId: string): Promise<boolean> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) return false;

      const roomsJson = await AsyncStorage.getItem(this.CHAT_ROOMS_KEY);
      const rooms: ChatRoom[] = roomsJson ? JSON.parse(roomsJson) : [];
      
      const roomIndex = rooms.findIndex(r => r.id === roomId);
      if (roomIndex === -1) return false;

      const room = rooms[roomIndex];
      const existingParticipant = room.participants.find(p => p.userId === currentUser.id);
      
      if (!existingParticipant) {
        if (room.participants.length >= room.settings.maxParticipants) {
          return false; // 満員
        }

        room.participants.push({
          userId: currentUser.id,
          userName: currentUser.displayName,
          userAvatar: currentUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.id}`,
          role: 'member',
          joinedAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          isOnline: true,
          status: 'active',
        });

        await AsyncStorage.setItem(this.CHAT_ROOMS_KEY, JSON.stringify(rooms));
        this.emit('userJoined', { roomId, user: currentUser });
      }

      return true;
    } catch (error) {
      console.error('ルーム参加エラー:', error);
      return false;
    }
  }

  // ============ ライブストリーミング ============

  async startLiveStream(streamData: Omit<LiveStream, 'id' | 'startedAt' | 'isLive' | 'viewerCount' | 'viewers' | 'chatRoomId'>): Promise<{ success: boolean; stream?: LiveStream; error?: string }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'ログインが必要です' };
      }

      // ストリーム用チャットルーム作成
      const chatRoomResult = await this.createRoom({
        name: `📺 ${streamData.title}`,
        description: `${streamData.description} のライブチャット`,
        type: 'public',
        category: 'general',
        createdBy: currentUser.id,
        settings: {
          allowImages: true,
          allowLocation: false,
          moderationLevel: 'medium',
          maxParticipants: 1000,
          isReadOnly: false,
          autoDeleteMessages: true,
          autoDeleteHours: 24,
        },
        tags: ['ライブ', streamData.category],
      });

      if (!chatRoomResult.success || !chatRoomResult.room) {
        return { success: false, error: 'チャットルームの作成に失敗しました' };
      }

      const stream: LiveStream = {
        ...streamData,
        id: `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        streamerId: currentUser.id,
        streamerName: currentUser.displayName,
        streamerAvatar: currentUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.id}`,
        startedAt: new Date().toISOString(),
        isLive: true,
        viewerCount: 0,
        viewers: [],
        chatRoomId: chatRoomResult.room.id,
      };

      await this.saveStream(stream);
      this.emit('streamStarted', { stream });

      return { success: true, stream };
    } catch (error) {
      console.error('ライブストリーム開始エラー:', error);
      return { success: false, error: 'ライブストリームの開始に失敗しました' };
    }
  }

  async getActiveStreams(): Promise<LiveStream[]> {
    try {
      const streamsJson = await AsyncStorage.getItem(this.LIVE_STREAMS_KEY);
      const streams: LiveStream[] = streamsJson ? JSON.parse(streamsJson) : [];
      
      return streams
        .filter(stream => stream.isLive)
        .sort((a, b) => b.viewerCount - a.viewerCount);
    } catch (error) {
      console.error('アクティブストリーム取得エラー:', error);
      return [];
    }
  }

  private async saveStream(stream: LiveStream): Promise<void> {
    try {
      const streamsJson = await AsyncStorage.getItem(this.LIVE_STREAMS_KEY);
      const streams: LiveStream[] = streamsJson ? JSON.parse(streamsJson) : [];
      
      const existingIndex = streams.findIndex(s => s.id === stream.id);
      if (existingIndex >= 0) {
        streams[existingIndex] = stream;
      } else {
        streams.push(stream);
      }
      
      await AsyncStorage.setItem(this.LIVE_STREAMS_KEY, JSON.stringify(streams));
    } catch (error) {
      console.error('ストリーム保存エラー:', error);
    }
  }

  // ============ 協力探索機能 ============

  async createCollaborativeDiscovery(discoveryData: Omit<CollaborativeDiscovery, 'id' | 'participants' | 'findings' | 'chatRoomId'>): Promise<{ success: boolean; discovery?: CollaborativeDiscovery; error?: string }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'ログインが必要です' };
      }

      // 探索用チャットルーム作成
      const chatRoomResult = await this.createRoom({
        name: `🔍 ${discoveryData.title}`,
        description: discoveryData.description,
        type: 'private',
        category: 'general',
        createdBy: currentUser.id,
        settings: {
          allowImages: true,
          allowLocation: true,
          moderationLevel: 'low',
          maxParticipants: discoveryData.maxParticipants,
          isReadOnly: false,
          autoDeleteMessages: false,
          autoDeleteHours: 168, // 1週間
        },
        tags: ['協力探索', discoveryData.targetSpecies],
      });

      if (!chatRoomResult.success || !chatRoomResult.room) {
        return { success: false, error: 'チャットルームの作成に失敗しました' };
      }

      const discovery: CollaborativeDiscovery = {
        ...discoveryData,
        id: `discovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizer: currentUser.id,
        participants: [{
          userId: currentUser.id,
          userName: currentUser.displayName,
          userAvatar: currentUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.id}`,
          role: 'organizer',
          joinedAt: new Date().toISOString(),
          lastUpdate: new Date().toISOString(),
          status: 'joined',
        }],
        findings: [],
        chatRoomId: chatRoomResult.room.id,
      };

      await this.saveDiscovery(discovery);
      this.emit('discoveryCreated', { discovery });

      return { success: true, discovery };
    } catch (error) {
      console.error('協力探索作成エラー:', error);
      return { success: false, error: '協力探索の作成に失敗しました' };
    }
  }

  async getActiveDiscoveries(): Promise<CollaborativeDiscovery[]> {
    try {
      const discoveriesJson = await AsyncStorage.getItem(this.DISCOVERIES_KEY);
      const discoveries: CollaborativeDiscovery[] = discoveriesJson ? JSON.parse(discoveriesJson) : [];
      
      return discoveries
        .filter(discovery => discovery.status === 'active' || discovery.status === 'planning')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    } catch (error) {
      console.error('アクティブ探索取得エラー:', error);
      return [];
    }
  }

  private async saveDiscovery(discovery: CollaborativeDiscovery): Promise<void> {
    try {
      const discoveriesJson = await AsyncStorage.getItem(this.DISCOVERIES_KEY);
      const discoveries: CollaborativeDiscovery[] = discoveriesJson ? JSON.parse(discoveriesJson) : [];
      
      const existingIndex = discoveries.findIndex(d => d.id === discovery.id);
      if (existingIndex >= 0) {
        discoveries[existingIndex] = discovery;
      } else {
        discoveries.push(discovery);
      }
      
      await AsyncStorage.setItem(this.DISCOVERIES_KEY, JSON.stringify(discoveries));
    } catch (error) {
      console.error('探索保存エラー:', error);
    }
  }

  // ============ ユーティリティ ============

  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  async updateUserStatus(status: ChatParticipant['status']): Promise<void> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) return;

      // すべてのルームでユーザーステータスを更新
      const roomsJson = await AsyncStorage.getItem(this.CHAT_ROOMS_KEY);
      const rooms: ChatRoom[] = roomsJson ? JSON.parse(roomsJson) : [];
      
      let updated = false;
      for (const room of rooms) {
        const participant = room.participants.find(p => p.userId === currentUser.id);
        if (participant) {
          participant.status = status;
          participant.lastSeen = new Date().toISOString();
          updated = true;
        }
      }

      if (updated) {
        await AsyncStorage.setItem(this.CHAT_ROOMS_KEY, JSON.stringify(rooms));
        this.emit('userStatusUpdated', { userId: currentUser.id, status });
      }
    } catch (error) {
      console.error('ユーザーステータス更新エラー:', error);
    }
  }

  formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'たった今';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}分前`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}時間前`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}日前`;
    }
  }
}

export const realtimeService = new RealtimeService();