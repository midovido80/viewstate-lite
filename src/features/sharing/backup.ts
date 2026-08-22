import * as FileSystem from 'expo-file-system/legacy';import * as Sharing from 'expo-sharing';import * as DocumentPicker from 'expo-document-picker';
import {exportSnapshot,restoreSnapshot} from '@/lib/database';
export async function createAndShareBackup(dialogTitle='Save ViewState Lite backup'):Promise<void>{const json=await exportSnapshot();const uri=`${FileSystem.cacheDirectory}viewstate-lite-backup-${new Date().toISOString().slice(0,10)}.json`;
  await FileSystem.writeAsStringAsync(uri,json,{encoding:FileSystem.EncodingType.UTF8});if(!await Sharing.isAvailableAsync())throw new Error('Sharing unavailable');
  await Sharing.shareAsync(uri,{mimeType:'application/json',dialogTitle});}
export async function pickAndRestoreBackup():Promise<void>{const result=await DocumentPicker.getDocumentAsync({type:'application/json',copyToCacheDirectory:true});
  if(result.canceled||!result.assets[0])return;const json=await FileSystem.readAsStringAsync(result.assets[0].uri,{encoding:FileSystem.EncodingType.UTF8});await restoreSnapshot(json);}
