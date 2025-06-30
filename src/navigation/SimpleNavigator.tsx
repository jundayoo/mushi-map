import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';

import PremiumMapScreen from '../screens/PremiumMapScreen';
import PremiumAddScreen from '../screens/PremiumAddScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SimpleInsectDetailScreen from '../screens/SimpleInsectDetailScreen';
import MapWithInsectsScreen from '../screens/MapWithInsectsScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import CollectionScreen from '../screens/CollectionScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: { screen?: keyof TabParamList } | undefined;
  InsectDetail: {
    insect: {
      id: string;
      name: string;
      scientificName: string;
      locationName: string;
      imageUrl: string;
      user: { displayName: string; avatar: string };
      createdAt: string;
      likesCount: number;
      description: string;
      tags: string[];
    };
  };
  MapView: undefined;
  EditProfile: {
    user: {
      id: string;
      email: string;
      displayName: string;
      avatar?: string;
      bio?: string;
      createdAt?: string;
    };
  };
  Achievements: undefined;
  Leaderboard: undefined;
  Collection: undefined;
};

export type TabParamList = {
  Map: undefined;
  Add: undefined;
  Profile: undefined;
  MapView: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Map') {
            iconName = 'bug-report';
          } else if (route.name === 'Add') {
            iconName = 'add-circle';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else if (route.name === 'MapView') {
            iconName = 'map';
          } else {
            iconName = 'help';
          }

          return <MaterialIcons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Map" 
        component={PremiumMapScreen} 
        options={{ title: 'ホーム' }} 
      />
      <Tab.Screen 
        name="Add" 
        component={PremiumAddScreen} 
        options={{ title: '投稿' }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'プロフィール' }} 
      />
      <Tab.Screen 
        name="MapView" 
        component={MapWithInsectsScreen} 
        options={{ title: '地図' }} 
      />
    </Tab.Navigator>
  );
}

export default function SimpleNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="InsectDetail" component={SimpleInsectDetailScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="Collection" component={CollectionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}