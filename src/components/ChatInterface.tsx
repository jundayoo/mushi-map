import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  realtimeService, 
  ChatMessage, 
  ChatRoom, 
  MessageReaction 
} from '../services/realtimeService';
import { authService } from '../services/authService';

interface ChatInterfaceProps {
  room: ChatRoom;
  onBack?: () => void;
  onParticipantPress?: (userId: string) => void;
  style?: any;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  room,
  onBack,
  onParticipantPress,
  style,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadMessages();
    setupRealtimeListeners();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    return () => {
      cleanupListeners();
    };
  }, [room.id]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const roomMessages = await realtimeService.getMessages(room.id, 100);
      setMessages(roomMessages);
      setOnlineUsers(room.participants.filter(p => p.isOnline).length);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('メッセージ読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeListeners = () => {
    realtimeService.on('message', handleNewMessage);
    realtimeService.on('messageUpdated', handleMessageUpdate);
    realtimeService.on('userJoined', handleUserJoined);
    realtimeService.on('userLeft', handleUserLeft);
    realtimeService.on('typing', handleTyping);
  };

  const cleanupListeners = () => {
    realtimeService.off('message', handleNewMessage);
    realtimeService.off('messageUpdated', handleMessageUpdate);
    realtimeService.off('userJoined', handleUserJoined);
    realtimeService.off('userLeft', handleUserLeft);
    realtimeService.off('typing', handleTyping);
  };

  const handleNewMessage = (data: { roomId: string; message: ChatMessage }) => {
    if (data.roomId === room.id) {
      setMessages(prev => [...prev, data.message]);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleMessageUpdate = (data: { messageId: string; message: ChatMessage }) => {
    setMessages(prev => 
      prev.map(msg => msg.id === data.messageId ? data.message : msg)
    );
  };

  const handleUserJoined = (data: { roomId: string; user: any }) => {
    if (data.roomId === room.id) {
      setOnlineUsers(prev => prev + 1);
    }
  };

  const handleUserLeft = (data: { roomId: string; user: any }) => {
    if (data.roomId === room.id) {
      setOnlineUsers(prev => Math.max(0, prev - 1));
    }
  };

  const handleTyping = (data: { roomId: string; userId: string; isTyping: boolean }) => {
    if (data.roomId === room.id) {
      setIsTyping(data.isTyping);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    try {
      setInputText('');
      const result = await realtimeService.sendMessage(room.id, text, 'text');
      
      if (!result.success) {
        Alert.alert('エラー', result.error || 'メッセージの送信に失敗しました');
        setInputText(text); // 元に戻す
      }
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      Alert.alert('エラー', 'メッセージの送信に失敗しました');
      setInputText(text);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await realtimeService.addReaction(messageId, emoji);
    } catch (error) {
      console.error('リアクション追加エラー:', error);
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isOwn = message.userId === authService.getCurrentUser()?.then(user => user?.id);
    const isSystem = message.type === 'system';
    const showAvatar = index === 0 || messages[index - 1].userId !== message.userId;
    const showTimestamp = index === 0 || 
      new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000; // 5分

    if (isSystem) {
      return (
        <View key={message.id} style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{message.content}</Text>
        </View>
      );
    }

    return (
      <Animated.View 
        key={message.id} 
        style={[
          styles.messageContainer,
          { opacity: fadeAnim }
        ]}
      >
        {showTimestamp && (
          <Text style={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString('ja-JP', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        )}
        
        <View style={[styles.messageRow, isOwn && styles.ownMessageRow]}>
          {!isOwn && showAvatar && (
            <TouchableOpacity
              onPress={() => onParticipantPress?.(message.userId)}
            >
              <Image 
                source={{ uri: message.userAvatar }} 
                style={styles.messageAvatar} 
              />
            </TouchableOpacity>
          )}
          
          {!isOwn && !showAvatar && <View style={styles.avatarSpacer} />}

          <TouchableOpacity
            style={[styles.messageBubble, isOwn && styles.ownMessageBubble]}
            onLongPress={() => showMessageOptions(message)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isOwn ? ['#4CAF50', '#2E7D32'] : ['#F5F5F5', '#EEEEEE']}
              style={styles.messageBubbleGradient}
            >
              {!isOwn && showAvatar && (
                <Text style={styles.messageSender}>{message.userName}</Text>
              )}
              
              <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
                {message.content}
              </Text>

              {message.isEdited && (
                <Text style={[styles.editedLabel, isOwn && styles.ownEditedLabel]}>
                  編集済み
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* リアクション */}
        {message.reactions && message.reactions.length > 0 && (
          <View style={[styles.reactionsContainer, isOwn && styles.ownReactionsContainer]}>
            {message.reactions.map((reaction, reactionIndex) => (
              <TouchableOpacity
                key={reactionIndex}
                style={styles.reactionBubble}
                onPress={() => handleReaction(message.id, reaction.emoji)}
              >
                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                <Text style={styles.reactionCount}>{reaction.count}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addReactionButton}
              onPress={() => showReactionPicker(message.id)}
            >
              <MaterialIcons name="add" size={16} color="#999" />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  };

  const showMessageOptions = (message: ChatMessage) => {
    const currentUserId = authService.getCurrentUser()?.then(user => user?.id);
    const isOwn = message.userId === currentUserId;

    const options = [
      { text: 'リアクション', onPress: () => showReactionPicker(message.id) },
    ];

    if (isOwn) {
      options.push(
        { text: '編集', onPress: () => editMessage(message) },
        { text: '削除', onPress: () => deleteMessage(message.id), style: 'destructive' as const }
      );
    }

    options.push({ text: 'キャンセル', style: 'cancel' as const });

    Alert.alert('メッセージオプション', '', options);
  };

  const showReactionPicker = (messageId: string) => {
    const reactions = ['👍', '❤️', '😄', '😮', '😢', '😡'];
    
    Alert.alert(
      'リアクションを選択',
      '',
      reactions.map(emoji => ({
        text: emoji,
        onPress: () => handleReaction(messageId, emoji)
      })).concat([{ text: 'キャンセル', style: 'cancel' }])
    );
  };

  const editMessage = (message: ChatMessage) => {
    // TODO: メッセージ編集機能の実装
    Alert.alert('機能準備中', 'メッセージ編集機能は準備中です');
  };

  const deleteMessage = async (messageId: string) => {
    // TODO: メッセージ削除機能の実装
    Alert.alert('機能準備中', 'メッセージ削除機能は準備中です');
  };

  const renderRoomHeader = () => (
    <LinearGradient
      colors={['#4CAF50', '#2E7D32']}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        )}
        
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}>{room.name}</Text>
          <Text style={styles.roomStatus}>
            {onlineUsers}人がオンライン
            {isTyping && ' • 誰かが入力中...'}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.roomMenuButton}
          onPress={() => showRoomMenu()}
        >
          <MaterialIcons name="more-vert" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const showRoomMenu = () => {
    Alert.alert(
      'ルームメニュー',
      '',
      [
        { text: '参加者一覧', onPress: () => showParticipants() },
        { text: 'ルーム情報', onPress: () => showRoomInfo() },
        { text: '通知設定', onPress: () => showNotificationSettings() },
        { text: 'キャンセル', style: 'cancel' },
      ]
    );
  };

  const showParticipants = () => {
    const participantList = room.participants
      .map(p => `${p.isOnline ? '🟢' : '⚫'} ${p.userName}`)
      .join('\n');
    
    Alert.alert(
      `参加者 (${room.participants.length}人)`,
      participantList,
      [{ text: 'OK' }]
    );
  };

  const showRoomInfo = () => {
    Alert.alert(
      room.name,
      `${room.description}\n\n作成日: ${new Date(room.createdAt).toLocaleDateString('ja-JP')}\nカテゴリ: ${room.category}\nタグ: ${room.tags.join(', ')}`,
      [{ text: 'OK' }]
    );
  };

  const showNotificationSettings = () => {
    Alert.alert('機能準備中', '通知設定は準備中です');
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {renderRoomHeader()}

      {/* メッセージ一覧 */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>メッセージを読み込み中...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="chat-bubble-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>まだメッセージがありません</Text>
            <Text style={styles.emptyText}>最初のメッセージを送信してみましょう！</Text>
          </View>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
      </ScrollView>

      {/* 入力エリア */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachButton}>
            <MaterialIcons name="add" size={24} color="#4CAF50" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="メッセージを入力..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <LinearGradient
              colors={inputText.trim() ? ['#4CAF50', '#2E7D32'] : ['#E0E0E0', '#BDBDBD']}
              style={styles.sendButtonGradient}
            >
              <MaterialIcons 
                name="send" 
                size={20} 
                color={inputText.trim() ? 'white' : '#999'} 
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  roomStatus: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  roomMenuButton: {
    padding: 5,
    marginLeft: 10,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
    paddingBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 10,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarSpacer: {
    width: 40,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ownMessageBubble: {
    maxWidth: '75%',
  },
  messageBubbleGradient: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 3,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  editedLabel: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 3,
  },
  ownEditedLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginVertical: 5,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 5,
    marginLeft: 40,
  },
  ownReactionsContainer: {
    justifyContent: 'flex-end',
    marginLeft: 0,
    marginRight: 0,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  addReactionButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatInterface;