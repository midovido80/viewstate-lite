import * as FileSystem from 'expo-file-system/legacy';
import {createId} from '@/lib/id';
export async function persistMedia(sourceUri:string,extension:string):Promise<string>{
  const directory=`${FileSystem.documentDirectory}property-media/`;const info=await FileSystem.getInfoAsync(directory);
  if(!info.exists)await FileSystem.makeDirectoryAsync(directory,{intermediates:true});
  const destination=`${directory}${createId('media')}.${extension.replace(/^\./,'')||'bin'}`;
  await FileSystem.copyAsync({from:sourceUri,to:destination});return destination;
}

