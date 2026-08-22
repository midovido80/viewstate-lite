import {useEffect,useState} from 'react';
import {Alert,Pressable,StyleSheet,Text,View} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/components/AppHeader';
import {KeyboardAwareScrollViewCompat} from '@/components/KeyboardAwareScrollViewCompat';
import {FormField} from '@/components/FormField';import {PrimaryButton} from '@/components/PrimaryButton';
import {contactsRepository,draftsRepository} from '@/lib/database';import {createId} from '@/lib/id';import {normalizeKuwaitPhone} from '@/lib/phone';
import type {ContactRole} from '@/types/domain';import {colors,radius,spacing} from '@/theme/tokens';
import {getRoleLabel,useI18n} from '@/i18n/I18nContext';
const roles:ContactRole[]=['tenant','owner','broker','real_estate_company','building_guard'];
type Draft={name:string;phone:string;role:ContactRole;notes:string};const empty:Draft={name:'',phone:'',role:'tenant',notes:''};
export default function ContactForm(){const {id}=useLocalSearchParams<{id?:string}>();const {t,language,isRTL}=useI18n();const key=id?`contact:${id}`:'contact:new';const [form,setForm]=useState<Draft>(empty);
  const [ready,setReady]=useState(false);useEffect(()=>{(async()=>{if(id){const item=await contactsRepository.get(id);if(item)setForm({name:item.name,phone:item.phone,role:item.role,notes:item.notes})}
    else {const draft=await draftsRepository.load<Draft>(key);if(draft)setForm(draft)}setReady(true)})()},[id,key]);
  useEffect(()=>{if(ready)draftsRepository.save(key,form)},[form,key,ready]);
  const save=async()=>{const phone=normalizeKuwaitPhone(form.phone);if(!form.name.trim()||!phone){Alert.alert(t('incompleteData'),t('validKuwaitPhone'));return}
    const duplicate=await contactsRepository.findByPhone(phone);if(duplicate&&duplicate.id!==id){Alert.alert(t('duplicatePhone'),t('duplicatePhoneMessage'),[
      {text:t('cancel'),style:'cancel'},{text:t('openExisting'),onPress:()=>router.replace({pathname:'/contact-detail',params:{id:duplicate.id}})},
    ]);return}
    const contactId=id??createId('contact');const now=new Date().toISOString();await contactsRepository.upsert({id:contactId,name:form.name.trim(),phone,role:form.role,notes:form.notes.trim(),
      source:'manual',createdAt:duplicate?.createdAt??now,updatedAt:now});await draftsRepository.clear(key);router.replace({pathname:'/contact-detail',params:{id:contactId}})};
  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={id?t('editPerson'):t('addManualPerson')}/><KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <FormField label={t('name')} value={form.name} onChangeText={name=>setForm({...form,name})}/><FormField label={t('phone')} value={form.phone}
      keyboardType="phone-pad" onChangeText={phone=>setForm({...form,phone})}/><Text style={[styles.label,{textAlign:isRTL?'right':'left'}]}>{t('role')}</Text><View style={[styles.roles,{flexDirection:isRTL?'row-reverse':'row'}]}>{roles.map(value=><Pressable
        key={value} onPress={()=>setForm({...form,role:value})} style={[styles.chip,form.role===value&&styles.active]}><Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.chipText,form.role===value&&styles.activeText]}>{getRoleLabel(language,value)}</Text></Pressable>)}</View>
    <FormField label={t('notes')} value={form.notes} multiline onChangeText={notes=>setForm({...form,notes})}/><PrimaryButton title={t('save')} onPress={save}/>
    </KeyboardAwareScrollViewCompat></SafeAreaView>}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.md,gap:spacing.md,paddingBottom:spacing.xl*2},
  label:{fontSize:15,fontWeight:'600',textAlign:'right'},roles:{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.sm},chip:{width:'48%',minHeight:56,borderWidth:1,borderColor:colors.border,
  paddingHorizontal:spacing.sm,paddingVertical:10,borderRadius:radius.lg,alignItems:'center',justifyContent:'center',backgroundColor:'white'},chipText:{fontWeight:'700',color:colors.text,textAlign:'center'},active:{backgroundColor:colors.blue,borderColor:colors.blue},activeText:{color:'white',fontWeight:'700'}});
