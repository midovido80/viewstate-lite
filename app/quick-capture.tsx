import {Ionicons} from '@expo/vector-icons';
import {router,useFocusEffect} from 'expo-router';
import {useCallback,useState} from 'react';
import {Alert,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/components/AppHeader';
import {KeyboardAwareScrollViewCompat} from '@/components/KeyboardAwareScrollViewCompat';
import {PrimaryButton} from '@/components/PrimaryButton';
import {useI18n} from '@/i18n/I18nContext';
import {quickCapturesRepository} from '@/lib/database';
import {createId} from '@/lib/id';
import type {QuickCaptureDraft} from '@/types/domain';
import {colors,radius,spacing} from '@/theme/tokens';

export default function QuickCaptureScreen(){const {t,isRTL,language}=useI18n();const [text,setText]=useState('');const [items,setItems]=useState<QuickCaptureDraft[]>([]);const [saving,setSaving]=useState(false);
  const load=useCallback(async()=>{setItems(await quickCapturesRepository.list())},[]);useFocusEffect(useCallback(()=>{void load()},[load]));
  const save=async()=>{const value=text.trim();if(!value)return;setSaving(true);try{const now=new Date().toISOString();await quickCapturesRepository.upsert({id:createId('capture'),text:value,createdAt:now,updatedAt:now});setText('');await load()}finally{setSaving(false)}};
  const remove=(item:QuickCaptureDraft)=>Alert.alert(language==='ar'?'حذف المسودة؟':'Delete draft?',language==='ar'?'لن يتم حذفها إلا بعد تأكيدك.':'It will only be removed after confirmation.',[
    {text:t('cancel'),style:'cancel'},{text:language==='ar'?'حذف':'Delete',style:'destructive',onPress:()=>void quickCapturesRepository.remove(item.id).then(load)}]);
  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={t('quickCapture')}/><KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={[styles.intro,{flexDirection:isRTL?'row-reverse':'row'}]}><View style={styles.flash}><Ionicons name="flash" size={27} color="#C67B00"/></View><View style={styles.introCopy}><Text style={[styles.title,{textAlign:isRTL?'right':'left'}]}>{t('quickCapture')}</Text><Text style={[styles.hint,{textAlign:isRTL?'right':'left'}]}>{t('captureFirstHint')}</Text></View></View>
    <View style={styles.editor}><TextInput autoFocus multiline value={text} onChangeText={setText} placeholder={t('quickPrompt')} placeholderTextColor={colors.muted} selectionColor={colors.blue} cursorColor={colors.blue} textAlignVertical="top" style={[styles.input,{textAlign:isRTL?'right':'left'}]}/><View style={[styles.editorFooter,{flexDirection:isRTL?'row-reverse':'row'}]}><Text style={styles.local}>🔒 {language==='ar'?'حفظ محلي':'Local save'}</Text><Text style={styles.count}>{text.length}</Text></View></View>
    <PrimaryButton title={t('saveDraft')} onPress={save} disabled={!text.trim()||saving}/>
    <View style={[styles.listHeader,{flexDirection:isRTL?'row-reverse':'row'}]}><Text style={styles.listTitle}>{t('savedDrafts')}</Text><View style={styles.badge}><Text style={styles.badgeText}>{items.length}</Text></View></View>
    {!items.length?<View style={styles.empty}><Ionicons name="document-text-outline" size={34} color={colors.muted}/><Text style={styles.emptyText}>{t('noDrafts')}</Text></View>:items.map(item=><Pressable key={item.id} onPress={()=>router.push({pathname:'/whatsapp-import',params:{draftId:item.id}})} onLongPress={()=>remove(item)} style={[styles.draft,{flexDirection:isRTL?'row-reverse':'row'}]}>
      <View style={styles.draftIcon}><Ionicons name="document-text-outline" size={23} color="#C67B00"/></View><View style={styles.draftCopy}><Text numberOfLines={2} style={[styles.draftText,{textAlign:isRTL?'right':'left'}]}>{item.text}</Text><Text style={[styles.date,{textAlign:isRTL?'right':'left'}]}>{new Date(item.updatedAt).toLocaleString(language==='ar'?'ar-KW':'en-KW')}</Text></View><Text style={styles.complete}>{t('completeNow')}</Text>
    </Pressable>)}
  </KeyboardAwareScrollViewCompat></SafeAreaView>}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.md,gap:spacing.md,paddingBottom:spacing.xl*2},intro:{backgroundColor:'#FFF8E1',borderWidth:1,borderColor:'#F5E4AE',borderRadius:radius.lg,padding:spacing.md,flexDirection:'row-reverse',alignItems:'center',gap:spacing.md},flash:{width:49,height:49,borderRadius:15,backgroundColor:'#FFEDBD',alignItems:'center',justifyContent:'center'},introCopy:{flex:1},title:{fontSize:18,fontWeight:'900'},hint:{fontSize:12,color:colors.muted,lineHeight:20,marginTop:3},editor:{borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,overflow:'hidden',backgroundColor:'white'},input:{minHeight:190,padding:spacing.md,fontSize:16,lineHeight:25,color:colors.text},editorFooter:{height:38,backgroundColor:colors.surface,borderTopWidth:1,borderColor:colors.border,paddingHorizontal:spacing.md,alignItems:'center',justifyContent:'space-between'},local:{fontSize:11,color:colors.muted},count:{fontSize:11,color:colors.muted},listHeader:{alignItems:'center',justifyContent:'space-between',marginTop:spacing.sm},listTitle:{fontSize:17,fontWeight:'900'},badge:{minWidth:30,height:30,borderRadius:10,backgroundColor:'#EEF5FF',alignItems:'center',justifyContent:'center'},badgeText:{color:colors.blue,fontWeight:'900'},empty:{paddingVertical:spacing.xl,alignItems:'center',gap:spacing.sm},emptyText:{color:colors.muted},draft:{minHeight:78,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.sm,backgroundColor:'white',flexDirection:'row-reverse',alignItems:'center',gap:spacing.sm},draftIcon:{width:43,height:43,borderRadius:13,backgroundColor:'#FFF8E1',alignItems:'center',justifyContent:'center'},draftCopy:{flex:1,minWidth:0},draftText:{fontSize:13,fontWeight:'700',lineHeight:20},date:{fontSize:10,color:colors.muted,marginTop:4},complete:{fontSize:10,color:colors.blue,fontWeight:'900'}});
