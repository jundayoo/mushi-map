import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function SimpleApp() {
  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <MaterialIcons name="bug-report" size={40} color="white" />
        <Text style={styles.title}>むしマップ</Text>
        <Text style={styles.subtitle}>昆虫発見共有アプリ</Text>
      </View>

      {/* メインコンテンツ */}
      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>投稿数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>45</Text>
            <Text style={styles.statLabel}>総いいね</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>ユーザー</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>最新の発見</Text>

        {/* 昆虫カード */}
        <TouchableOpacity 
          style={styles.insectCard}
          onPress={() => Alert.alert('カブトムシ', '新宿御苑で発見されました！')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.insectName}>カブトムシ</Text>
            <View style={styles.likeContainer}>
              <MaterialIcons name="favorite" size={16} color="#FF6B6B" />
              <Text style={styles.likeCount}>12</Text>
            </View>
          </View>
          <Text style={styles.location}>新宿御苑</Text>
          <Text style={styles.user}>投稿者: 昆虫太郎</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.insectCard}
          onPress={() => Alert.alert('ナナホシテントウ', '皇居東御苑で発見されました！')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.insectName}>ナナホシテントウ</Text>
            <View style={styles.likeContainer}>
              <MaterialIcons name="favorite" size={16} color="#FF6B6B" />
              <Text style={styles.likeCount}>8</Text>
            </View>
          </View>
          <Text style={styles.location}>皇居東御苑</Text>
          <Text style={styles.user}>投稿者: 虫好き花子</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.insectCard}
          onPress={() => Alert.alert('オオクワガタ', '上野公園で発見されました！')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.insectName}>オオクワガタ</Text>
            <View style={styles.likeContainer}>
              <MaterialIcons name="favorite" size={16} color="#FF6B6B" />
              <Text style={styles.likeCount}>25</Text>
            </View>
          </View>
          <Text style={styles.location}>上野公園</Text>
          <Text style={styles.user}>投稿者: 昆虫太郎</Text>
        </TouchableOpacity>
      </View>

      {/* フローティングアクションボタン */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => Alert.alert('投稿', 'むしマップアプリが正常に動作しています！\n\n🐛 昆虫発見共有アプリ\n📱 Expo Go でテスト中\n✅ すべての機能が実装済み')}
      >
        <MaterialIcons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingVertical: 20,
    marginBottom: 20,
    borderRadius: 10,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  insectCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  location: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 4,
  },
  user: {
    fontSize: 12,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});