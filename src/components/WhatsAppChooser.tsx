import {useState} from 'react';
import {ActivityIndicator,Modal,Pressable,SafeAreaView,StyleSheet,Text,View} from 'react-native';
import {sendToWhatsApp,type WhatsAppTarget,WhatsAppUnavailableError} from '@/features/sharing/whatsapp';
import {useI18n} from '@/i18n/I18nContext';
import {colors,radius,spacing} from '@/theme/tokens';

export function WhatsAppChooser({visible,message,phone,onClose}:{visible:boolean;message:string;phone?:string;onClose:()=>void}){
  const {t,isRTL}=useI18n();const [busy,setBusy]=useState<WhatsAppTarget|null>(null);const [error,setError]=useState<WhatsAppTarget|null>(null);
  const choose=async(target:WhatsAppTarget)=>{setBusy(target);setError(null);try{await sendToWhatsApp(target,message,phone);onClose()}catch(value){setError(value instanceof WhatsAppUnavailableError?value.target:target)}finally{setBusy(null)}};
  const close=()=>{if(!busy){setError(null);onClose()}};
  return <Modal visible={visible} transparent animationType="fade" hardwareAccelerated onRequestClose={close}>
    <View style={styles.backdrop}><SafeAreaView style={styles.sheet}>
      <Text style={[styles.title,{textAlign:isRTL?'right':'left'}]}>{t('chooseWhatsApp')}</Text>
      <Text style={[styles.hint,{textAlign:isRTL?'right':'left'}]}>{t('chooseWhatsAppHint')}</Text>
      <AppChoice title={t('whatsappStandard')} busy={busy==='whatsapp'} disabled={Boolean(busy)} onPress={()=>void choose('whatsapp')}/>
      <AppChoice title={t('whatsappBusiness')} busy={busy==='whatsapp_business'} disabled={Boolean(busy)} onPress={()=>void choose('whatsapp_business')}/>
      {error?<Text style={[styles.error,{textAlign:isRTL?'right':'left'}]}>{error==='whatsapp'?t('whatsappUnavailable'):t('whatsappBusinessUnavailable')}</Text>:null}
      <Pressable onPress={close} disabled={Boolean(busy)} style={styles.cancel}><Text style={styles.cancelText}>{t('cancel')}</Text></Pressable>
    </SafeAreaView></View>
  </Modal>;
}

function AppChoice({title,busy,disabled,onPress}:{title:string;busy:boolean;disabled:boolean;onPress:()=>void}){return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({pressed})=>[styles.choice,(pressed||disabled)&&styles.pressed]}>
  {busy?<ActivityIndicator color="white"/>:<Text style={styles.choiceText}>{title}</Text>}
</Pressable>}

const styles=StyleSheet.create({backdrop:{flex:1,backgroundColor:'rgba(8,25,45,.48)',justifyContent:'flex-end'},sheet:{backgroundColor:'white',padding:spacing.lg,gap:spacing.md,borderTopLeftRadius:radius.lg,borderTopRightRadius:radius.lg},
  title:{fontSize:22,fontWeight:'900',color:colors.red},hint:{fontSize:15,color:colors.muted,lineHeight:22},choice:{minHeight:54,borderRadius:radius.md,backgroundColor:'#128C7E',alignItems:'center',justifyContent:'center',paddingHorizontal:spacing.md},choiceText:{color:'white',fontSize:17,fontWeight:'800'},pressed:{opacity:.68},error:{color:colors.red,fontWeight:'700',lineHeight:22},cancel:{minHeight:48,alignItems:'center',justifyContent:'center'},cancelText:{color:colors.blue,fontWeight:'800'}});
