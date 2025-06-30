import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, ActivityIndicator } from 'react-native';
import 'react-native-gesture-handler'; // 実機テストで必要
import CommercialNavigator from './src/navigation/CommercialNavigator';
import { authService } from './src/services/authService';
import { errorReportingService } from './src/services/errorReportingService';

function App(): React.JSX.Element {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🐛 むしマップ初期化開始...');
        
        // エラーレポートサービス初期化
        try {
          await errorReportingService.initialize();
          console.log('✅ エラーレポートサービス初期化完了');
        } catch (errorServiceError) {
          console.warn('⚠️ エラーレポートサービス初期化警告:', errorServiceError);
        }
        
        // Web版用軽量初期化（SQLiteなし）
        try {
          await authService.createDefaultUsers();
          console.log('✅ 認証サービス初期化完了');
        } catch (authError) {
          console.warn('⚠️ 認証サービス初期化警告:', authError);
          // エラーレポートサービスにレポート
          errorReportingService.reportError(authError as Error, {
            level: 'warning',
            type: 'error',
            component: 'App_AuthService',
          });
        }

        setIsInitialized(true);
        console.log('🎉 むしマップ全機能初期化完了');
        
      } catch (error) {
        console.error('❌ アプリ初期化エラー:', error);
        setInitError('初期化に失敗しました');
        
        // 初期化エラーをレポート
        errorReportingService.reportError(error as Error, {
          level: 'fatal',
          type: 'crash',
          component: 'App_Initialize',
        });
        
        setIsInitialized(true); // エラーでも画面は表示
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4CAF50' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', marginTop: 16, fontSize: 18 }}>
          🐛 むしマップ起動中...
        </Text>
      </View>
    );
  }

  if (initError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <Text style={{ color: '#FF6B6B', fontSize: 16, textAlign: 'center', margin: 20 }}>
          {initError}
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      <CommercialNavigator />
    </>
  );
}

export default App;
