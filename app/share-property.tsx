import {useEffect,useMemo,useState} from 'react';
import {Alert,ScrollView,Share,StyleSheet,Switch,Text,View} from 'react-native';
import {useLocalSearchParams} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/components/AppHeader';
import {PrimaryButton} from '@/components/PrimaryButton';
import {createPropertyMessage} from '@/features/sharing/propertyMessage';
import {propertiesRepository} from '@/lib/database';
import type {Property} from '@/types/domain';
import {colors,radius,spacing} from '@/theme/tokens';
import {useI18n} from '@/i18n/I18nContext';

export default function ShareProperty(){const {id}=useLocalSearchParams<{id:string}>();const {t,language,isRTL}=useI18n();const [property,setProperty]=useState<Property|null>(null);const [includeDescription,setIncludeDescription]=useState(true);const [includePaci,setIncludePaci]=useState(false);const [includeLocation,setIncludeLocation]=useState(false);
  useEffect(()=>{if(id)void propertiesRepository.get(id).then(setProperty)},[id]);const message=useMemo(()=>property?createPropertyMessage(property,{includeDescription,includePaci,includeLocation,language}):'',[includeDescription,includeLocation,includePaci,language,property]);
  const share=async()=>{if(!property)return;try{await Share.share({title:property.title,message})}catch{Alert.alert(t('shareFailed'),t('shareFailedMessage'))}};
  if(!property)return <SafeAreaView style={styles.page}><Text style={styles.loading}>{t('preparingPreview')}</Text></SafeAreaView>;
  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={t('safeSharePreview')}/><ScrollView contentContainerStyle={styles.content}>
    <Text style={[styles.safety,{textAlign:isRTL?'right':'left'}]}>{t('safeShareInfo')}</Text>
    <Toggle label={t('sendDescription')} value={includeDescription} onChange={setIncludeDescription}/><Toggle label={t('sendPaci')} value={includePaci} onChange={setIncludePaci} disabled={!property.paci}/><Toggle label={t('sendLocation')} value={includeLocation} onChange={setIncludeLocation} disabled={!property.mapUrl}/>
    <View style={styles.preview}><Text style={[styles.previewTitle,{textAlign:isRTL?'right':'left'}]}>{t('messageToSend')}</Text><Text selectable style={[styles.message,{textAlign:isRTL?'right':'left'}]}>{message}</Text></View><PrimaryButton title={t('shareChooseWhatsapp')} onPress={share} color={colors.green}/>
    <Text style={[styles.mediaNote,{textAlign:isRTL?'right':'left'}]}>{t('mediaShareNote')}</Text>
  </ScrollView></SafeAreaView>;
}

function Toggle({label,value,onChange,disabled=false}:{label:string;value:boolean;onChange:(value:boolean)=>void;disabled?:boolean}){return <View style={[styles.toggle,disabled&&styles.disabled]}><Switch value={value} onValueChange={onChange} disabled={disabled} trackColor={{false:colors.border,true:colors.blue}}/><Text style={styles.toggleLabel}>{label}</Text></View>}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},loading:{textAlign:'center',marginTop:80,color:colors.muted},content:{padding:spacing.md,gap:spacing.md,paddingBottom:spacing.xl},safety:{backgroundColor:'#EBF8EF',padding:spacing.md,borderRadius:radius.md,textAlign:'right',lineHeight:23,color:colors.text,fontWeight:'700'},toggle:{minHeight:58,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:spacing.md,backgroundColor:'white',flexDirection:'row',justifyContent:'space-between',alignItems:'center'},disabled:{opacity:.45},toggleLabel:{fontSize:16,fontWeight:'700',color:colors.text,textAlign:'right'},preview:{borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.md,backgroundColor:colors.surface,gap:spacing.sm},previewTitle:{fontSize:17,fontWeight:'900',color:colors.red,textAlign:'right'},message:{fontSize:16,lineHeight:28,textAlign:'right',color:colors.text,backgroundColor:'white',padding:spacing.md,borderRadius:radius.sm},mediaNote:{fontSize:13,color:colors.muted,textAlign:'right',lineHeight:21}});
