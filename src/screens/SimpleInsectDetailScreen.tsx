import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  Share,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/SimpleNavigator';
import { CommentList } from '../components/CommentComponent';
import { socialService, Comment } from '../services/socialService';
import { authService } from '../services/authService';

const { width, height } = Dimensions.get('window');

type InsectDetailScreenRouteProp = RouteProp<RootStackParamList, 'InsectDetail'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

const SimpleInsectDetailScreen: React.FC = () => {
  const route = useRoute<InsectDetailScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { insect } = route.params;
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(insect.likesCount);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  React.useEffect(() => {
    checkLikeStatus();
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  const checkLikeStatus = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        const liked = await socialService.isLikedByUser(insect.id, 'post', currentUser.id);
        setIsLiked(liked);
      }
    } catch (error) {
      console.error('いいね状態確認エラー:', error);
    }
  };

  const handleLike = async () => {
    try {
      const result = await socialService.toggleLike(insect.id, 'post');
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

  const loadComments = useCallback(async () => {
    try {
      setCommentsLoading(true);
      const postComments = await socialService.getComments(insect.id);
      setComments(postComments);
    } catch (error) {
      console.error('コメント読み込みエラー:', error);
    } finally {
      setCommentsLoading(false);
    }
  }, [insect.id]);

  const handleAddComment = async () => {
    try {
      const validation = socialService.validateComment(newComment);
      if (!validation.isValid) {
        Alert.alert('エラー', validation.error);
        return;
      }

      const result = await socialService.addComment(insect.id, newComment);
      if (result.success) {
        setNewComment('');
        await loadComments();
        Alert.alert('成功', 'コメントを投稿しました');
      } else {
        Alert.alert('エラー', result.error || 'コメントの投稿に失敗しました');
      }
    } catch (error) {
      console.error('コメント投稿エラー:', error);
      Alert.alert('エラー', 'コメントの投稿に失敗しました');
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `むしマップで${insect.name}を発見！\n${insect.description}\n📍 ${insect.locationName}`,
        title: `${insect.name} - むしマップ`,
      });
    } catch (error) {
      console.error('共有エラー:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* ヘッダー画像 */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: insect.imageUrl }} style={styles.headerImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.imageOverlay}
        />
        
        {/* 戻るボタン */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
            style={styles.backButtonGradient}
          >
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </LinearGradient>
        </TouchableOpacity>

        {/* 共有ボタン */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
            style={styles.shareButtonGradient}
          >
            <MaterialIcons name="share" size={24} color="#333" />
          </LinearGradient>
        </TouchableOpacity>

        {/* タイトル部分 */}
        <View style={styles.titleContainer}>
          <Text style={styles.insectName}>{insect.name}</Text>
          <Text style={styles.scientificName}>{insect.scientificName}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* いいねとアクション */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.likeButton, isLiked && styles.likeButtonActive]}
            onPress={handleLike}
          >
            <MaterialIcons 
              name={isLiked ? "favorite" : "favorite-border"} 
              size={24} 
              color={isLiked ? "white" : "#FF6B6B"} 
            />
            <Text style={[styles.likeText, isLiked && styles.likeTextActive]}>
              {likesCount}
            </Text>
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialIcons name="visibility" size={20} color="#666" />
              <Text style={styles.statText}>127</Text>
            </View>
            <TouchableOpacity style={styles.statItem} onPress={toggleComments}>
              <MaterialIcons name="comment" size={20} color="#666" />
              <Text style={styles.statText}>{comments.length}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 位置情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="place" size={20} color="#4CAF50" />
            {'  '}発見場所
          </Text>
          <TouchableOpacity style={styles.locationCard}>
            <LinearGradient
              colors={['#F0F8F0', '#E8F5E8']}
              style={styles.locationGradient}
            >
              <MaterialIcons name="location-on" size={32} color="#4CAF50" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{insect.locationName}</Text>
                <Text style={styles.locationSubtext}>詳細な位置を表示</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#4CAF50" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 詳細情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="description" size={20} color="#4CAF50" />
            {'  '}詳細情報
          </Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.description}>{insect.description}</Text>
          </View>
        </View>

        {/* タグ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="local-offer" size={20} color="#4CAF50" />
            {'  '}タグ
          </Text>
          <View style={styles.tagsContainer}>
            {insect.tags.map((tag, index) => (
              <TouchableOpacity key={index} style={styles.tag}>
                <LinearGradient
                  colors={['#E8F5E8', '#F0F8F0']}
                  style={styles.tagGradient}
                >
                  <Text style={styles.tagText}>#{tag}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 投稿者情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="person" size={20} color="#4CAF50" />
            {'  '}投稿者
          </Text>
          <TouchableOpacity style={styles.userCard}>
            <Image source={{ uri: insect.user.avatar }} style={styles.userAvatar} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{insect.user.displayName}</Text>
              <Text style={styles.userSubtext}>プロフィールを見る</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* 投稿日時 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="schedule" size={20} color="#4CAF50" />
            {'  '}投稿日時
          </Text>
          <Text style={styles.dateText}>{insect.createdAt} 投稿</Text>
        </View>

        {/* コメントセクション */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.commentSectionHeader}
            onPress={toggleComments}
          >
            <View style={styles.commentTitleContainer}>
              <MaterialIcons name="comment" size={20} color="#4CAF50" />
              <Text style={styles.sectionTitle}>
                {'  '}コメント ({comments.length})
              </Text>
            </View>
            <MaterialIcons 
              name={showComments ? "expand-less" : "expand-more"} 
              size={24} 
              color="#4CAF50" 
            />
          </TouchableOpacity>

          {showComments && (
            <View style={styles.commentsContainer}>
              {/* コメント入力 */}
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="コメントを入力..."
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={styles.commentSubmitButton}
                  onPress={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  <LinearGradient
                    colors={newComment.trim() ? ['#4CAF50', '#2E7D32'] : ['#E0E0E0', '#BDBDBD']}
                    style={styles.commentSubmitGradient}
                  >
                    <MaterialIcons 
                      name="send" 
                      size={20} 
                      color={newComment.trim() ? 'white' : '#999'} 
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* コメント一覧 */}
              {commentsLoading ? (
                <View style={styles.commentsLoading}>
                  <Text style={styles.loadingText}>コメントを読み込み中...</Text>
                </View>
              ) : comments.length > 0 ? (
                <CommentList
                  postId={insect.id}
                  comments={comments}
                  onUpdate={loadComments}
                />
              ) : (
                <View style={styles.noComments}>
                  <MaterialIcons name="chat-bubble-outline" size={48} color="#E0E0E0" />
                  <Text style={styles.noCommentsText}>まだコメントがありません</Text>
                  <Text style={styles.noCommentsSubtext}>最初のコメントを投稿してみましょう！</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  imageContainer: {
    height: height * 0.4,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  backButton: {
    position: 'absolute',
    top: StatusBar.currentHeight || 40,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  backButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: StatusBar.currentHeight || 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  shareButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  insectName: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 16,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  likeButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  likeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginLeft: 8,
  },
  likeTextActive: {
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationCard: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 15,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  locationSubtext: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 2,
  },
  descriptionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  tagGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
  },
  bottomPadding: {
    height: 30,
  },
  commentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  commentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  commentInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
    paddingRight: 12,
  },
  commentSubmitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  commentSubmitGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default SimpleInsectDetailScreen;