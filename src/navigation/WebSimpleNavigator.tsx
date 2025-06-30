import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';

// Web版で動作確認済みの画面のみインポート
import PremiumAddScreen from '../screens/PremiumAddScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatRoomsScreen from '../screens/ChatRoomsScreen';
import LiveStreamingScreen from '../screens/LiveStreamingScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  InsectDetail: { insect: any };
  MapView: undefined;
  Achievements: undefined;
  Leaderboard: undefined;
  Collection: undefined;
  ChatRooms: undefined;
  LiveStreaming: undefined;
  CollaborativeDiscovery: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          switch (route.name) {
            case 'Add':
              iconName = 'add-circle';
              break;
            case 'Chat':
              iconName = 'chat';
              break;
            case 'Live':
              iconName = 'videocam';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'home';
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
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="Add" 
        component={PremiumAddScreen}
        options={{ 
          tabBarLabel: '📷 投稿',
          tabBarBadge: '🔥'
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatRoomsScreen}
        options={{ 
          tabBarLabel: '💬 チャット',
          tabBarBadge: '3'
        }}
      />
      <Tab.Screen 
        name="Live" 
        component={LiveStreamingScreen}
        options={{ 
          tabBarLabel: '📺 ライブ',
          tabBarBadge: '🔴'
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          tabBarLabel: '👤 プロフィール'
        }}
      />
    </Tab.Navigator>
  );
}

export default function WebSimpleNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="MainTabs"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#f8f9fa' },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}