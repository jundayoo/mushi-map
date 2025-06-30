import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SimpleProfileScreen: React.FC = () => {
  const mockUser = {
    displayName: '昆虫太郎',
    email: 'konchu.taro@example.com',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=taro',
    bio: '昆虫観察歴10年。特にカブトムシとクワガタが大好きです！',
    postsCount: 42,
    likesCount: 156,
    locationsCount: 8,
  };

  const handleEditProfile = () => {
    Alert.alert('プロフィール編集', 'プロフィール編集機能は実装予定です');
  };

  const handleSettings = () => {
    Alert.alert('設定', '設定画面は実装予定です');
  };

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'ログアウト', onPress: () => console.log('ログアウト') },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* プレミアムヘッダー */}
      <LinearGradient
        colors={['#4CAF50', '#2E7D32']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.profileHeader}>
            <Image source={{ uri: mockUser.avatar }} style={styles.avatar} />
            <View style={styles.userInfo}>
              <Text style={styles.displayName}>{mockUser.displayName}</Text>
              <Text style={styles.email}>{mockUser.email}</Text>
            </View>
            <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
              <MaterialIcons name="settings" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* 統計情報 */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{mockUser.postsCount}</Text>
              <Text style={styles.statLabel}>投稿</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{mockUser.likesCount}</Text>
              <Text style={styles.statLabel}>いいね</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{mockUser.locationsCount}</Text>
              <Text style={styles.statLabel}>発見場所</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 自己紹介 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="person" size={20} color="#4CAF50" />
            {'  '}自己紹介
          </Text>
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>{mockUser.bio}</Text>
          </View>
        </View>

        {/* メニュー */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="menu" size={20} color="#4CAF50" />
            {'  '}メニュー
          </Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <LinearGradient
              colors={['#F0F8F0', '#E8F5E8']}
              style={styles.menuGradient}
            >
              <MaterialIcons name="edit" size={24} color="#4CAF50" />
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>プロフィール編集</Text>
                <Text style={styles.menuSubtitle}>名前、自己紹介などを変更</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#666" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <LinearGradient
              colors={['#F0F8F0', '#E8F5E8']}
              style={styles.menuGradient}
            >
              <MaterialIcons name="bookmark" size={24} color="#4CAF50" />
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>お気に入り</Text>
                <Text style={styles.menuSubtitle}>保存した投稿を表示</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#666" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <LinearGradient
              colors={['#F0F8F0', '#E8F5E8']}
              style={styles.menuGradient}
            >
              <MaterialIcons name="history" size={24} color="#4CAF50" />
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>投稿履歴</Text>
                <Text style={styles.menuSubtitle}>これまでの投稿を確認</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#666" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <LinearGradient
              colors={['#F0F8F0', '#E8F5E8']}
              style={styles.menuGradient}
            >
              <MaterialIcons name="help" size={24} color="#4CAF50" />
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>ヘルプ・サポート</Text>
                <Text style={styles.menuSubtitle}>使い方やよくある質問</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#666" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ログアウト */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LinearGradient
              colors={['#FF6B6B', '#E53E3E']}
              style={styles.logoutGradient}
            >
              <MaterialIcons name="logout" size={24} color="white" />
              <Text style={styles.logoutText}>ログアウト</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* バージョン情報 */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>むしマップ v1.0.0</Text>
          <Text style={styles.versionSubtext}>昆虫発見コミュニティアプリ</Text>
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
  header: {
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'white',
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  email: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
  bioCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  bioText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  menuItem: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 12,
  },
  menuGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  menuInfo: {
    flex: 1,
    marginLeft: 15,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  versionSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  bottomPadding: {
    height: 20,
  },
});

export default SimpleProfileScreen;