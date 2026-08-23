import * as IntentLauncher from 'expo-intent-launcher';
import {Linking,Platform} from 'react-native';

export type WhatsAppTarget='whatsapp'|'whatsapp_business';

const PACKAGES:Record<WhatsAppTarget,string>={
  whatsapp:'com.whatsapp',
  whatsapp_business:'com.whatsapp.w4b',
};

export class WhatsAppUnavailableError extends Error{
  constructor(public readonly target:WhatsAppTarget){super('Selected WhatsApp application is unavailable');this.name='WhatsAppUnavailableError'}
}

export async function sendToWhatsApp(target:WhatsAppTarget,message:string,phone?:string):Promise<void>{
  const digits=phone?.replace(/\D/g,'')??'';
  const url=digits?`https://wa.me/${digits}${message?`?text=${encodeURIComponent(message)}`:''}`:`whatsapp://send?text=${encodeURIComponent(message)}`;
  try{
    if(Platform.OS==='android'){
      if(digits)await IntentLauncher.startActivityAsync('android.intent.action.VIEW',{data:url,packageName:PACKAGES[target]});
      else await IntentLauncher.startActivityAsync('android.intent.action.SEND',{type:'text/plain',packageName:PACKAGES[target],extra:{'android.intent.extra.TEXT':message}});
      return;
    }
    await Linking.openURL(url);
  }catch{
    throw new WhatsAppUnavailableError(target);
  }
}
