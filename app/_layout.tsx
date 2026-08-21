import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {SQLiteProvider} from 'expo-sqlite';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {I18nProvider} from '@/i18n/I18nContext';
import {getDatabase} from '@/lib/database';

export default function RootLayout(){return <SafeAreaProvider><I18nProvider>
  <SQLiteProvider databaseName="viewstate-lite.db" onInit={async()=>{await getDatabase()}}>
    <StatusBar style="light"/><Stack screenOptions={{headerShown:false}}/>
  </SQLiteProvider>
</I18nProvider></SafeAreaProvider>}

