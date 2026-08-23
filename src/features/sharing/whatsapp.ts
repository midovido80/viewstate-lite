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
  const query=[digits?`phone=${digits}`:'',`text=${encodeURIComponent(message)}`].filter(Boolean).join('&');
  const url=`whatsapp://send?${query}`;
  try{
    if(Platform.OS==='android'){
      const intentUrl=`intent://send?${query}#Intent;scheme=whatsapp;package=${PACKAGES[target]};end`;
      await Linking.openURL(intentUrl);
      return;
    }
    await Linking.openURL(url);
  }catch{
    throw new WhatsAppUnavailableError(target);
  }
}
