import {useEffect,useState} from 'react';
import {Alert,Pressable,StyleSheet,Text,View} from 'react-native';
import {router,useLocalSearchParams} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/components/AppHeader';
import {KeyboardAwareScrollViewCompat} from '@/components/KeyboardAwareScrollViewCompat';
import {FormField} from '@/components/FormField';
import {PrimaryButton} from '@/components/PrimaryButton';
import {contactsRepository,draftsRepository,phoneRepository,PhoneConflictError} from '@/lib/database';
import {createId} from '@/lib/id';
import {normalizePhone} from '@/lib/phone';
import type {Contact,ContactPhone,ContactRole} from '@/types/domain';
import {colors,radius,spacing} from '@/theme/tokens';
import {getRoleLabel,useI18n} from '@/i18n/I18nContext';

const roles:ContactRole[]=['tenant','owner','broker','real_estate_company','building_guard'];
type PhoneDraft={key:string;id?:string;display:string;label:string;isPrimary:boolean};
type Draft={name:string;phones:PhoneDraft[];role:ContactRole;notes:string};
const newPhone=(primary=false):PhoneDraft=>({key:createId('phone-draft'),display:'',label:'',isPrimary:primary});
const empty=():Draft=>({name:'',phones:[newPhone(true)],role:'tenant',notes:''});

export default function ContactForm(){
  const {id}=useLocalSearchParams<{id?:string}>();const {t,language,isRTL}=useI18n();const key=id?`contact:${id}`:'contact:new';
  const [contactId]=useState(()=>id??createId('contact'));const [form,setForm]=useState<Draft>(()=>empty());const [existing,setExisting]=useState<Contact|null>(null);const [ready,setReady]=useState(false);
  useEffect(()=>{void(async()=>{if(id){const [item,phones]=await Promise.all([contactsRepository.get(id),phoneRepository.listForContact(id)]);if(item){setExisting(item);setForm({name:item.name,
      phones:phones.map(phone=>({key:phone.id,id:phone.id,display:phone.display,label:phone.label,isPrimary:phone.isPrimary})),role:item.role,notes:item.notes})}}
    else{const draft=await draftsRepository.load<Draft>(key);if(draft?.phones?.length)setForm(draft)}setReady(true)})()},[id,key]);
  useEffect(()=>{if(ready)void draftsRepository.save(key,form)},[form,key,ready]);

  const updatePhone=(keyValue:string,change:Partial<PhoneDraft>)=>setForm(old=>({...old,phones:old.phones.map(phone=>phone.key===keyValue?{...phone,...change}:phone)}));
  const choosePrimary=(keyValue:string)=>setForm(old=>({...old,phones:old.phones.map(phone=>({...phone,isPrimary:phone.key===keyValue}))}));
  const removePhone=(keyValue:string)=>setForm(old=>{if(old.phones.length===1)return old;const remaining=old.phones.filter(phone=>phone.key!==keyValue);
    if(!remaining.some(phone=>phone.isPrimary)){const first=remaining[0];if(first)remaining[0]={...first,isPrimary:true}}return {...old,phones:remaining}});

  const save=async()=>{
    if(!form.name.trim()){Alert.alert(t('incompleteData'),t('phoneRequired'));return}
    const prepared=form.phones.filter(phone=>phone.display.length>0).map(phone=>({...phone,normalized:normalizePhone(phone.display)}));
    if(!prepared.length||prepared.some(phone=>!phone.normalized)){Alert.alert(t('invalidPhoneTitle'),t('validInternationalPhone'));return}
    const normalized=prepared.map(phone=>phone.normalized!);if(new Set(normalized).size!==normalized.length){Alert.alert(t('duplicatePhone'),t('duplicateWithinPerson'));return}
    if(!prepared.some(phone=>phone.isPrimary)){const first=prepared[0];if(first)first.isPrimary=true}
    await savePrepared(prepared);
  };

  const savePrepared=async(prepared:Array<PhoneDraft&{normalized:string|null}>)=>{
    for(const phone of prepared){const conflicts=await phoneRepository.conflicts(phone.normalized!,contactId);const conflict=conflicts[0];if(conflict){Alert.alert(t('phoneConflictTitle'),t('phoneConflictMessage',{name:conflict.name}),[
      {text:t('cancel'),style:'cancel'},
      {text:t('skipNumber'),onPress:()=>{const remaining=prepared.filter(item=>item.key!==phone.key);if(!remaining.length)Alert.alert(t('phoneRequired'),t('phoneRequired'));else void savePrepared(ensurePrimary(remaining))}},
      {text:t('openExisting'),onPress:()=>router.replace({pathname:'/contact-detail',params:{id:conflict.id}})},
    ]);return}}
    const now=new Date().toISOString();const primary=prepared.find(phone=>phone.isPrimary)??prepared[0];if(!primary)return;
    const contact:Contact={id:contactId,name:form.name.trim(),phone:primary.normalized!,role:form.role,notes:form.notes.trim(),source:existing?.source??'manual',createdAt:existing?.createdAt??now,updatedAt:now};
    const phones:ContactPhone[]=prepared.map(phone=>({id:phone.id??createId('phone'),contactId,normalized:phone.normalized!,display:phone.display,label:phone.label,
      isPrimary:phone.key===primary.key,createdAt:now,updatedAt:now}));
    try{await contactsRepository.upsertWithPhones(contact,phones);await draftsRepository.clear(key);router.replace({pathname:'/contact-detail',params:{id:contactId}})}
    catch(error){if(error instanceof PhoneConflictError)Alert.alert(t('phoneConflictTitle'),t('phoneConflictGeneric'));else throw error}
  };

  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={id?t('editPerson'):t('addManualPerson')}/><KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <FormField testID="contact-name" label={t('name')} value={form.name} onChangeText={name=>setForm({...form,name})}/>
    <Text style={[styles.sectionLabel,{textAlign:isRTL?'right':'left'}]}>{t('phoneNumbers')}</Text>
    {form.phones.map((phone,index)=><View key={phone.key} style={styles.phoneCard}>
      <View style={[styles.phoneHeader,{flexDirection:isRTL?'row-reverse':'row'}]}><Pressable onPress={()=>choosePrimary(phone.key)}><Text style={[styles.primary,phone.isPrimary&&styles.primaryActive]}>{phone.isPrimary?t('primaryPhone'):t('makePrimary')}</Text></Pressable>
        {form.phones.length>1?<Pressable onPress={()=>removePhone(phone.key)}><Text style={styles.remove}>{t('removePhone')}</Text></Pressable>:null}</View>
      <FormField testID={`contact-phone-${index}`} label={`${t('phone')} ${index+1}`} value={phone.display} keyboardType="phone-pad" onChangeText={display=>updatePhone(phone.key,{display})}/>
      <FormField testID={`contact-phone-label-${index}`} label={t('phoneLabel')} value={phone.label} onChangeText={label=>updatePhone(phone.key,{label})}/>
    </View>)}
    <PrimaryButton title={t('addPhoneNumber')} onPress={()=>setForm(old=>({...old,phones:[...old.phones,newPhone(false)]}))}/>
    <Text style={[styles.label,{textAlign:isRTL?'right':'left'}]}>{t('role')}</Text><View style={[styles.roles,{flexDirection:isRTL?'row-reverse':'row'}]}>{roles.map(value=><Pressable
      testID={`contact-role-${value}`} key={value} onPress={()=>setForm({...form,role:value})} style={[styles.chip,form.role===value&&styles.active]}><Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.chipText,form.role===value&&styles.activeText]}>{getRoleLabel(language,value)}</Text></Pressable>)}</View>
    <FormField testID="contact-notes" label={t('notes')} value={form.notes} multiline onChangeText={notes=>setForm({...form,notes})}/><PrimaryButton testID="contact-save" title={t('save')} onPress={save}/>
  </KeyboardAwareScrollViewCompat></SafeAreaView>;
}

function ensurePrimary<T extends {isPrimary:boolean}>(phones:T[]):T[]{if(phones.some(phone=>phone.isPrimary))return phones;return phones.map((phone,index)=>({...phone,isPrimary:index===0}))}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.md,gap:spacing.md,paddingBottom:spacing.xl*2},
  sectionLabel:{fontSize:18,fontWeight:'800',color:colors.red},phoneCard:{gap:spacing.sm,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.md,backgroundColor:'white'},
  phoneHeader:{justifyContent:'space-between'},primary:{color:colors.blue,fontWeight:'700'},primaryActive:{color:colors.green},remove:{color:colors.red,fontWeight:'700'},
  label:{fontSize:15,fontWeight:'600',textAlign:'right'},roles:{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.sm},chip:{width:'48%',minHeight:56,borderWidth:1,borderColor:colors.border,
  paddingHorizontal:spacing.sm,paddingVertical:10,borderRadius:radius.lg,alignItems:'center',justifyContent:'center',backgroundColor:'white'},chipText:{fontWeight:'700',color:colors.text,textAlign:'center'},active:{backgroundColor:colors.blue,borderColor:colors.blue},activeText:{color:'white',fontWeight:'700'}});
