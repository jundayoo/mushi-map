import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// シンプルな画面コンポーネント
const HomeScreen = () => (
  <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.container}>
    <MaterialIcons name="bug-report" size={80} color="white" />
    <Text style={styles.title}>🐛 むしマップ</Text>
    <Text style={styles.subtitle}>昆虫発見アプリ</Text>
    <Text style={styles.description}>
      AI機能付き昆虫発見・記録・共有アプリ
    </Text>
  </LinearGradient>
);

const DiscoverScreen = () => (
  <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.container}>
    <MaterialIcons name="search" size={80} color="white" />
    <Text style={styles.title}>🔍 発見</Text>
    <Text style={styles.subtitle}>昆虫を探そう</Text>
    <Text style={styles.description}>
      AI画像認識で昆虫を識別
    </Text>
  </LinearGradient>
);

const ChatScreen = () => (
  <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.container}>
    <MaterialIcons name="chat" size={80} color="white" />
    <Text style={styles.title}>💬 チャット</Text>
    <Text style={styles.subtitle}>みんなと交流</Text>
    <Text style={styles.description}>
      リアルタイムチャット・ライブ配信
    </Text>
  </LinearGradient>
);

const ProfileScreen = () => (
  <LinearGradient colors={['#9C27B0', '#7B1FA2']} style={styles.container}>
    <MaterialIcons name="person" size={80} color="white" />
    <Text style={styles.title}>👤 プロフィール</Text>
    <Text style={styles.subtitle}>レベル・実績</Text>
    <Text style={styles.description}>
      XP・バッジ・コレクション
    </Text>
  </LinearGradient>
);

const Tab = createBottomTabNavigator();

export default function MinimalNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof MaterialIcons.glyphMap;

            if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'Discover') {
              iconName = 'search';
            } else if (route.name === 'Chat') {
              iconName = 'chat';
            } else {
              iconName = 'person';
            }

            return <MaterialIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4CAF50',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ tabBarLabel: 'ホーム' }}
        />
        <Tab.Screen 
          name="Discover" 
          component={DiscoverScreen}
          options={{ tabBarLabel: '発見' }}
        />
        <Tab.Screen 
          name="Chat" 
          component={ChatScreen}
          options={{ tabBarLabel: 'チャット' }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ tabBarLabel: 'プロフィール' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
});