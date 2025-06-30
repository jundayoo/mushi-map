import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';
import { levelService } from './levelService';

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  parentCommentId?: string; // 返信機能用
  likesCount: number;
  likedByCurrentUser: boolean;
}

export interface Like {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  createdAt: string;
  type: 'post' | 'comment';
  targetId: string; // postId または commentId
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'reply' | 'achievement';
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

class SocialService {
  private readonly COMMENTS_KEY = '@mushi_map_comments';
  private readonly LIKES_KEY = '@mushi_map_likes';
  private readonly NOTIFICATIONS_KEY = '@mushi_map_notifications';

  // ============ コメント機能 ============

  async addComment(
    postId: string, 
    content: string, 
    parentCommentId?: string
  ): Promise<{ success: boolean; comment?: Comment; error?: string }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'ログインが必要です' };
      }

      if (!content.trim()) {
        return { success: false, error: 'コメント内容を入力してください' };
      }

      if (content.length > 500) {
        return { success: false, error: 'コメントは500文字以内で入力してください' };
      }

      const comments = await this.getComments();
      const newComment: Comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        postId,
        userId: currentUser.id,
        userName: currentUser.displayName,
        userAvatar: currentUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.id}`,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        parentCommentId,
        likesCount: 0,
        likedByCurrentUser: false,
      };

      comments.push(newComment);
      await AsyncStorage.setItem(this.COMMENTS_KEY, JSON.stringify(comments));

      // 通知を送信（投稿者が自分でない場合）
      await this.sendCommentNotification(postId, newComment, !!parentCommentId);

      // XP獲得
      try {
        if (parentCommentId) {
          await levelService.addXP('GIVE_HELPFUL_COMMENT', { commentId: newComment.id, postId });
        } else {
          await levelService.addXP('GIVE_HELPFUL_COMMENT', { commentId: newComment.id, postId });
        }
      } catch (xpError) {
        console.warn('コメントXP獲得エラー:', xpError);
      }

      return { success: true, comment: newComment };
    } catch (error) {
      console.error('コメント追加エラー:', error);
      return { success: false, error: 'コメントの追加に失敗しました' };
    }
  }

  async getComments(postId?: string): Promise<Comment[]> {
    try {
      const commentsJson = await AsyncStorage.getItem(this.COMMENTS_KEY);
      const comments: Comment[] = commentsJson ? JSON.parse(commentsJson) : [];
      
      if (postId) {
        return comments.filter(comment => comment.postId === postId);
      }
      
      return comments;
    } catch (error) {
      console.error('コメント取得エラー:', error);
      return [];
    }
  }

  async updateComment(commentId: string, content: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'ログインが必要です' };
      }

      const comments = await this.getComments();
      const commentIndex = comments.findIndex(comment => 
        comment.id === commentId && comment.userId === currentUser.id
      );

      if (commentIndex === -1) {
        return { success: false, error: 'コメントが見つからないか、編集権限がありません' };
      }

      comments[commentIndex].content = content.trim();
      comments[commentIndex].updatedAt = new Date().toISOString();

      await AsyncStorage.setItem(this.COMMENTS_KEY, JSON.stringify(comments));
      return { success: true };
    } catch (error) {
      console.error('コメント更新エラー:', error);
      return { success: false, error: 'コメントの更新に失敗しました' };
    }
  }

  async deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'ログインが必要です' };
      }

      const comments = await this.getComments();
      const comment = comments.find(c => c.id === commentId);

      if (!comment || comment.userId !== currentUser.id) {
        return { success: false, error: 'コメントが見つからないか、削除権限がありません' };
      }

      // 返信も一緒に削除
      const filteredComments = comments.filter(c => 
        c.id !== commentId && c.parentCommentId !== commentId
      );

      await AsyncStorage.setItem(this.COMMENTS_KEY, JSON.stringify(filteredComments));
      return { success: true };
    } catch (error) {
      console.error('コメント削除エラー:', error);
      return { success: false, error: 'コメントの削除に失敗しました' };
    }
  }

  // ============ いいね機能 ============

  async toggleLike(
    targetId: string, 
    type: 'post' | 'comment'
  ): Promise<{ success: boolean; isLiked: boolean; likesCount: number; error?: string }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, isLiked: false, likesCount: 0, error: 'ログインが必要です' };
      }

      const likes = await this.getLikes();
      const existingLike = likes.find(like => 
        like.targetId === targetId && 
        like.userId === currentUser.id && 
        like.type === type
      );

      let newLikesArray: Like[];
      let isLiked: boolean;

      if (existingLike) {
        // いいね解除
        newLikesArray = likes.filter(like => like.id !== existingLike.id);
        isLiked = false;
      } else {
        // いいね追加
        const newLike: Like = {
          id: `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          postId: type === 'post' ? targetId : '', // postの場合はpostId、commentの場合は空
          userId: currentUser.id,
          userName: currentUser.displayName,
          userAvatar: currentUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.id}`,
          createdAt: new Date().toISOString(),
          type,
          targetId,
        };
        newLikesArray = [...likes, newLike];
        isLiked = true;

        // 通知を送信（自分でない場合）
        await this.sendLikeNotification(targetId, type, newLike);

        // XP獲得
        try {
          await levelService.addXP('RECEIVE_LIKE', { targetId, type, likeId: newLike.id });
        } catch (xpError) {
          console.warn('いいねXP獲得エラー:', xpError);
        }
      }

      await AsyncStorage.setItem(this.LIKES_KEY, JSON.stringify(newLikesArray));

      // 更新後のいいね数を計算
      const likesCount = newLikesArray.filter(like => 
        like.targetId === targetId && like.type === type
      ).length;

      return { success: true, isLiked, likesCount };
    } catch (error) {
      console.error('いいね切り替えエラー:', error);
      return { success: false, isLiked: false, likesCount: 0, error: 'いいねの処理に失敗しました' };
    }
  }

  async getLikes(targetId?: string, type?: 'post' | 'comment'): Promise<Like[]> {
    try {
      const likesJson = await AsyncStorage.getItem(this.LIKES_KEY);
      const likes: Like[] = likesJson ? JSON.parse(likesJson) : [];
      
      if (targetId && type) {
        return likes.filter(like => like.targetId === targetId && like.type === type);
      }
      
      return likes;
    } catch (error) {
      console.error('いいね取得エラー:', error);
      return [];
    }
  }

  async isLikedByUser(targetId: string, type: 'post' | 'comment', userId?: string): Promise<boolean> {
    try {
      const currentUser = userId ? { id: userId } : await authService.getCurrentUser();
      if (!currentUser) return false;

      const likes = await this.getLikes();
      return likes.some(like => 
        like.targetId === targetId && 
        like.userId === currentUser.id && 
        like.type === type
      );
    } catch (error) {
      console.error('いいね状態確認エラー:', error);
      return false;
    }
  }

  // ============ 通知機能 ============

  private async sendCommentNotification(postId: string, comment: Comment, isReply: boolean): Promise<void> {
    try {
      // 投稿者に通知（自分でない場合）
      // TODO: 実際の投稿データから投稿者IDを取得
      
      const notification: Notification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'target_user_id', // 実際の実装では投稿者IDを設定
        type: isReply ? 'reply' : 'comment',
        title: isReply ? '新しい返信があります' : '新しいコメントがあります',
        message: `${comment.userName}さんが${isReply ? '返信' : 'コメント'}しました: "${comment.content.substring(0, 50)}..."`,
        data: {
          postId,
          commentId: comment.id,
          fromUser: {
            id: comment.userId,
            name: comment.userName,
            avatar: comment.userAvatar,
          },
        },
        isRead: false,
        createdAt: comment.createdAt,
      };

      await this.addNotification(notification);
    } catch (error) {
      console.error('コメント通知送信エラー:', error);
    }
  }

  private async sendLikeNotification(targetId: string, type: 'post' | 'comment', like: Like): Promise<void> {
    try {
      const notification: Notification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'target_user_id', // 実際の実装では対象ユーザーIDを設定
        type: 'like',
        title: 'いいねがありました',
        message: `${like.userName}さんがあなたの${type === 'post' ? '投稿' : 'コメント'}にいいねしました`,
        data: {
          targetId,
          type,
          fromUser: {
            id: like.userId,
            name: like.userName,
            avatar: like.userAvatar,
          },
        },
        isRead: false,
        createdAt: like.createdAt,
      };

      await this.addNotification(notification);
    } catch (error) {
      console.error('いいね通知送信エラー:', error);
    }
  }

  async addNotification(notification: Notification): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      notifications.unshift(notification); // 新しい通知を先頭に追加
      
      // 古い通知を削除（最新100件のみ保持）
      const limitedNotifications = notifications.slice(0, 100);
      
      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(limitedNotifications));
    } catch (error) {
      console.error('通知追加エラー:', error);
    }
  }

  async getNotifications(userId?: string): Promise<Notification[]> {
    try {
      const notificationsJson = await AsyncStorage.getItem(this.NOTIFICATIONS_KEY);
      const notifications: Notification[] = notificationsJson ? JSON.parse(notificationsJson) : [];
      
      if (userId) {
        return notifications.filter(notification => notification.userId === userId);
      }
      
      return notifications;
    } catch (error) {
      console.error('通知取得エラー:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const notificationIndex = notifications.findIndex(n => n.id === notificationId);
      
      if (notificationIndex >= 0) {
        notifications[notificationIndex].isRead = true;
        await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('通知既読マークエラー:', error);
    }
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const notifications = await this.getNotifications(userId);
      return notifications.filter(notification => !notification.isRead).length;
    } catch (error) {
      console.error('未読通知数取得エラー:', error);
      return 0;
    }
  }

  // ============ 統計機能 ============

  async getSocialStats(userId: string): Promise<{
    totalLikesReceived: number;
    totalCommentsReceived: number;
    totalLikesGiven: number;
    totalCommentsGiven: number;
  }> {
    try {
      const [likes, comments] = await Promise.all([
        this.getLikes(),
        this.getComments(),
      ]);

      const totalLikesReceived = likes.filter(like => {
        // TODO: 実際の投稿データと照合して、ユーザーの投稿へのいいね数をカウント
        return true; // 仮実装
      }).length;

      const totalCommentsReceived = comments.filter(comment => {
        // TODO: 実際の投稿データと照合して、ユーザーの投稿へのコメント数をカウント
        return true; // 仮実装
      }).length;

      const totalLikesGiven = likes.filter(like => like.userId === userId).length;
      const totalCommentsGiven = comments.filter(comment => comment.userId === userId).length;

      return {
        totalLikesReceived,
        totalCommentsReceived,
        totalLikesGiven,
        totalCommentsGiven,
      };
    } catch (error) {
      console.error('ソーシャル統計取得エラー:', error);
      return {
        totalLikesReceived: 0,
        totalCommentsReceived: 0,
        totalLikesGiven: 0,
        totalCommentsGiven: 0,
      };
    }
  }

  // ============ ユーティリティ ============

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
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}日前`;
    } else {
      return date.toLocaleDateString('ja-JP');
    }
  }

  validateComment(content: string): { isValid: boolean; error?: string } {
    if (!content.trim()) {
      return { isValid: false, error: 'コメントを入力してください' };
    }
    
    if (content.length > 500) {
      return { isValid: false, error: 'コメントは500文字以内で入力してください' };
    }
    
    if (content.trim().length < 1) {
      return { isValid: false, error: 'コメントが短すぎます' };
    }
    
    return { isValid: true };
  }
}

export const socialService = new SocialService();