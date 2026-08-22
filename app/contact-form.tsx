import {useEffect,useState} from 'react';
import {Alert,Pressable,StyleSheet,Text,View} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/components/AppHeader';
import {KeyboardAwareScrollViewCompat} from '@/components/KeyboardAwareScrollViewCompat';
import {FormField} from '@/components/FormField';import {PrimaryButton} from '@/components/PrimaryButton';
import {contactsRepository,draftsRepository} from '@/lib/database';import {createId} from '@/lib/id';import {normalizeKuwaitPhone} from '@/lib/phone';
import {useI18n} from '@/i18n/I18nContext';
import type {ContactRole} from '@/types/domain';import {colors,radius,spacing} from '@/theme/tokens';
type Draft={name:string;phone:string;role:ContactRole;notes:string};const empty:Draft={name:'',phone:'',role:'tenant',notes:''};
export default function ContactForm(){const {t,isRTL,language}=useI18n();const roles:Array<[ContactRole,string]>=[['tenant',t('tenant')],['owner',t('owner')],['broker',t('broker')],['real_estate_company',t('company')],['building_guard',t('guard')]];const {id}=useLocalSearchParams<{id?:string}>();const key=id?`contact:${id}`:'contact:new';const [form,setForm]=useState<Draft>(empty);
  const [ready,setReady]=useState(false);useEffect(()=>{(async()=>{if(id){const item=await contactsRepository.get(id);if(item)setForm({name:item.name,phone:item.phone,role:item.role,notes:item.notes})}
    else {const draft=await draftsRepository.load<Draft>(key);if(draft)setForm(draft)}setReady(true)})()},[id,key]);
  useEffect(()=>{if(ready)draftsRepository.save(key,form)},[form,key,ready]);
  const save=async()=>{const phone=normalizeKuwaitPhone(form.phone);if(!form.name.trim()||!phone){Alert.alert(language==='ar'?'بيانات غير مكتملة':'Missing details',language==='ar'?'اكتب الاسم ورقم كويتي صحيح.':'Enter a name and a valid Kuwait phone number.');return}
    const duplicate=await contactsRepository.findByPhone(phone);if(duplicate&&duplicate.id!==id){Alert.alert(language==='ar'?'رقم مسجل بالفعل':'Phone already saved',language==='ar'?'لن ننشئ نسخة مكررة من الشخص.':'A duplicate person will not be created.',[
      {text:t('cancel'),style:'cancel'},{text:language==='ar'?'فتح السجل الموجود':'Open existing record',onPress:()=>router.replace({pathname:'/contact-detail',params:{id:duplicate.id}})},
    ]);return}
    const contactId=id??createId('contact');const now=new Date().toISOString();await contactsRepository.upsert({id:contactId,name:form.name.trim(),phone,role:form.role,notes:form.notes.trim(),
      source:'manual',createdAt:duplicate?.createdAt??now,updatedAt:now});await draftsRepository.clear(key);router.replace({pathname:'/contact-detail',params:{id:contactId}})};
  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={id?(language==='ar'?'تعديل الشخص':'Edit person'):t('manualAdd')}/><KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <FormField label={t('name')} value={form.name} onChangeText={name=>setForm({...form,name})}/><FormField label={t('phone')} value={form.phone}
      keyboardType="phone-pad" onChangeText={phone=>setForm({...form,phone})}/><Text style={[styles.label,{textAlign:isRTL?'right':'left'}]}>{t('role')}</Text><View style={[styles.roles,{flexDirection:isRTL?'row-reverse':'row'}]}>{roles.map(([value,label])=><Pressable
        key={value} onPress={()=>setForm({...form,role:value})} style={[styles.chip,form.role===value&&styles.active]}><Text style={form.role===value&&styles.activeText}>{label}</Text></Pressable>)}</View>
    <FormField label={t('notes')} value={form.notes} multiline onChangeText={notes=>setForm({...form,notes})}/><PrimaryButton title={t('save')} onPress={save}/>
    </KeyboardAwareScrollViewCompat></SafeAreaView>}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.md,gap:spacing.md,paddingBottom:spacing.xl*2},
  label:{fontSize:15,fontWeight:'600'},roles:{flexWrap:'wrap',gap:spacing.sm},chip:{flexGrow:1,flexBasis:'46%',minHeight:56,borderWidth:1,borderColor:colors.border,
  paddingHorizontal:spacing.sm,paddingVertical:10,borderRadius:radius.lg,alignItems:'center',justifyContent:'center',backgroundColor:'white'},active:{backgroundColor:colors.blue,borderColor:colors.blue},activeText:{color:'white',fontWeight:'700'}});
