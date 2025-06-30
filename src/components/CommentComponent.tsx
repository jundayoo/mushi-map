import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Image,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Comment, socialService } from '../services/socialService';
import { authService } from '../services/authService';

interface CommentComponentProps {
  comment: Comment;
  onReply?: (parentComment: Comment) => void;
  onUpdate?: () => void;
  showReplies?: boolean;
  isReply?: boolean;
}

const CommentComponent: React.FC<CommentComponentProps> = ({
  comment,
  onReply,
  onUpdate,
  showReplies = true,
  isReply = false,
}) => {
  const [isLiked, setIsLiked] = useState(comment.likedByCurrentUser);
  const [likesCount, setLikesCount] = useState(comment.likesCount);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [showRepliesSection, setShowRepliesSection] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (showReplies && !isReply) {
      loadReplies();
    }
  }, [comment.id, showReplies, isReply]);

  const loadReplies = async () => {
    try {
      const allComments = await socialService.getComments(comment.postId);
      const commentReplies = allComments.filter(c => c.parentCommentId === comment.id);
      setReplies(commentReplies);
    } catch (error) {
      console.error('返信読み込みエラー:', error);
    }
  };

  const handleLike = async () => {
    try {
      // アニメーション
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      const result = await socialService.toggleLike(comment.id, 'comment');
      if (result.success) {
        setIsLiked(result.isLiked);
        setLikesCount(result.likesCount);
      } else {
        Alert.alert('エラー', result.error || 'いいねの処理に失敗しました');
      }
    } catch (error) {
      console.error('いいねエラー:', error);
      Alert.alert('エラー', 'いいねの処理に失敗しました');
    }
  };

  const handleEdit = async () => {
    try {
      const validation = socialService.validateComment(editContent);
      if (!validation.isValid) {
        Alert.alert('エラー', validation.error);
        return;
      }

      const result = await socialService.updateComment(comment.id, editContent);
      if (result.success) {
        setIsEditing(false);
        onUpdate?.();
        Alert.alert('成功', 'コメントを更新しました');
      } else {
        Alert.alert('エラー', result.error || 'コメントの更新に失敗しました');
      }
    } catch (error) {
      console.error('コメント編集エラー:', error);
      Alert.alert('エラー', 'コメントの更新に失敗しました');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'コメント削除',
      'このコメントを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await socialService.deleteComment(comment.id);
              if (result.success) {
                onUpdate?.();
                Alert.alert('成功', 'コメントを削除しました');
              } else {
                Alert.alert('エラー', result.error || 'コメントの削除に失敗しました');
              }
            } catch (error) {
              console.error('コメント削除エラー:', error);
              Alert.alert('エラー', 'コメントの削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const checkIfOwnComment = async (): Promise<boolean> => {
    try {
      const currentUser = await authService.getCurrentUser();
      return currentUser?.id === comment.userId;
    } catch {
      return false;
    }
  };

  const handleOptionsPress = async () => {
    const isOwn = await checkIfOwnComment();
    if (isOwn) {
      Alert.alert(
        'コメントオプション',
        '',
        [
          { text: '編集', onPress: () => setIsEditing(true) },
          { text: '削除', onPress: handleDelete, style: 'destructive' },
          { text: 'キャンセル', style: 'cancel' },
        ]
      );
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    return socialService.formatTimeAgo(dateString);
  };

  return (
    <View style={[styles.container, isReply && styles.replyContainer]}>
      {/* ユーザー情報とコメント内容 */}
      <View style={styles.commentHeader}>
        <Image source={{ uri: comment.userAvatar }} style={styles.userAvatar} />
        
        <View style={styles.commentContent}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{comment.userName}</Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(comment.createdAt)}</Text>
            {comment.updatedAt && (
              <Text style={styles.editedLabel}>編集済み</Text>
            )}
          </View>

          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editContent}
                onChangeText={setEditContent}
                multiline
                placeholder="コメントを編集..."
                maxLength={500}
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.editCancelButton}
                  onPress={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  <Text style={styles.editCancelText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editSaveButton}
                  onPress={handleEdit}
                >
                  <Text style={styles.editSaveText}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.commentText}>{comment.content}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.optionsButton}
          onPress={handleOptionsPress}
        >
          <MaterialIcons name="more-vert" size={16} color="#999" />
        </TouchableOpacity>
      </View>

      {/* アクションボタン */}
      {!isEditing && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <MaterialIcons
                name={isLiked ? 'favorite' : 'favorite-border'}
                size={16}
                color={isLiked ? '#FF6B6B' : '#999'}
              />
            </Animated.View>
            <Text style={[styles.actionText, isLiked && styles.likedText]}>
              {likesCount > 0 ? likesCount : 'いいね'}
            </Text>
          </TouchableOpacity>

          {!isReply && onReply && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onReply(comment)}
            >
              <MaterialIcons name="reply" size={16} color="#999" />
              <Text style={styles.actionText}>返信</Text>
            </TouchableOpacity>
          )}

          {replies.length > 0 && !isReply && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowRepliesSection(!showRepliesSection)}
            >
              <MaterialIcons
                name={showRepliesSection ? 'expand-less' : 'expand-more'}
                size={16}
                color="#999"
              />
              <Text style={styles.actionText}>
                {replies.length}件の返信
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 返信セクション */}
      {showRepliesSection && replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {replies.map((reply) => (
            <CommentComponent
              key={reply.id}
              comment={reply}
              onUpdate={loadReplies}
              showReplies={false}
              isReply={true}
            />
          ))}
        </View>
      )}
    </View>
  );
};

interface CommentListProps {
  postId: string;
  comments: Comment[];
  onUpdate?: () => void;
}

export const CommentList: React.FC<CommentListProps> = ({
  postId,
  comments,
  onUpdate,
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyToComment, setReplyToComment] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleReply = (parentComment: Comment) => {
    setReplyToComment(parentComment);
    setShowReplyInput(true);
  };

  const submitReply = async () => {
    try {
      if (!replyToComment) return;

      const validation = socialService.validateComment(replyContent);
      if (!validation.isValid) {
        Alert.alert('エラー', validation.error);
        return;
      }

      const result = await socialService.addComment(
        postId,
        replyContent,
        replyToComment.id
      );

      if (result.success) {
        setReplyContent('');
        setShowReplyInput(false);
        setReplyToComment(null);
        onUpdate?.();
        Alert.alert('成功', '返信を投稿しました');
      } else {
        Alert.alert('エラー', result.error || '返信の投稿に失敗しました');
      }
    } catch (error) {
      console.error('返信投稿エラー:', error);
      Alert.alert('エラー', '返信の投稿に失敗しました');
    }
  };

  // 親コメントのみを表示（返信は各コメント内で表示）
  const parentComments = comments.filter(comment => !comment.parentCommentId);

  return (
    <View style={styles.listContainer}>
      {parentComments.map((comment) => (
        <CommentComponent
          key={comment.id}
          comment={comment}
          onReply={handleReply}
          onUpdate={onUpdate}
          showReplies={true}
        />
      ))}

      {/* 返信入力モーダル */}
      <Modal
        visible={showReplyInput}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReplyInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.replyModal}>
            <View style={styles.replyHeader}>
              <Text style={styles.replyTitle}>
                {replyToComment?.userName}さんに返信
              </Text>
              <TouchableOpacity
                onPress={() => setShowReplyInput(false)}
              >
                <MaterialIcons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.replyInput}
              value={replyContent}
              onChangeText={setReplyContent}
              placeholder="返信を入力..."
              multiline
              maxLength={500}
              autoFocus
            />

            <View style={styles.replyActions}>
              <TouchableOpacity
                style={styles.replyCancelButton}
                onPress={() => setShowReplyInput(false)}
              >
                <Text style={styles.replyCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.replySubmitButton}
                onPress={submitReply}
              >
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32']}
                  style={styles.replySubmitGradient}
                >
                  <Text style={styles.replySubmitText}>返信</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  replyContainer: {
    marginLeft: 20,
    marginTop: 8,
    backgroundColor: '#F8F9FA',
    borderLeftWidth: 2,
    borderLeftColor: '#4CAF50',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
    marginRight: 6,
  },
  editedLabel: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  optionsButton: {
    padding: 4,
  },
  editContainer: {
    marginTop: 4,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  editCancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editCancelText: {
    color: '#999',
    fontSize: 14,
  },
  editSaveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editSaveText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
    paddingLeft: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  likedText: {
    color: '#FF6B6B',
  },
  repliesContainer: {
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  replyModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  replyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  replyCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  replyCancelText: {
    color: '#999',
    fontSize: 16,
  },
  replySubmitButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  replySubmitGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  replySubmitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CommentComponent;