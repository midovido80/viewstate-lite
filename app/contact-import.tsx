import {useEffect,useMemo,useState} from 'react';import * as ExpoContacts from 'expo-contacts';
import {Alert,ActivityIndicator,FlatList,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';import {router} from 'expo-router';import {SafeAreaView} from 'react-native-safe-area-context';
import {PrimaryButton} from '@/components/PrimaryButton';import {contactsRepository} from '@/lib/database';import {normalizeKuwaitPhone} from '@/lib/phone';import {createId} from '@/lib/id';
import {AppHeader} from '@/components/AppHeader';
import {preserveDeviceContactName,preserveDeviceContactNotes} from '@/features/contacts/deviceImport';
import type {ContactRole} from '@/types/domain';import {colors,radius,spacing} from '@/theme/tokens';
import {getRoleLabel,useI18n} from '@/i18n/I18nContext';
type Candidate={key:string;name:string;phone:string;notes:string;existingId:string|null};
export default function ContactImport(){const {t,language,isRTL}=useI18n();const [items,setItems]=useState<Candidate[]>([]);const [selected,setSelected]=useState<Set<string>>(()=>new Set());const [role,setRole]=useState<ContactRole>('tenant');
  const [query,setQuery]=useState('');const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{const permission=await ExpoContacts.requestPermissionsAsync();if(permission.status!=='granted'){setLoading(false);Alert.alert(t('permissionRequired'),t('permissionContacts'));return}
    try{const [result,existing]=await Promise.all([
      ExpoContacts.getContactsAsync({fields:[ExpoContacts.Fields.PhoneNumbers,ExpoContacts.Fields.Note],sort:ExpoContacts.SortTypes.FirstName}),contactsRepository.list(),
    ]);const existingByPhone=new Map(existing.map(contact=>[contact.phone,contact.id]));const seen=new Set<string>();const candidates:Candidate[]=[];
      for(const c of result.data){for(const number of c.phoneNumbers??[]){const phone=normalizeKuwaitPhone(number.number??'');if(phone&&!seen.has(phone)){seen.add(phone);candidates.push({key:phone,name:preserveDeviceContactName(c.name,phone),phone,notes:preserveDeviceContactNotes(c.note),existingId:existingByPhone.get(phone)??null});break}}}
      setItems(candidates)}finally{setLoading(false)}})()},[]);
  const filtered=useMemo(()=>{const needle=query.trim().toLocaleLowerCase('ar-KW');return items.filter(item=>!needle||item.name.toLocaleLowerCase('ar-KW').includes(needle)||item.phone.includes(needle))},[items,query]);
  const toggle=(key:string)=>setSelected(old=>{const next=new Set(old);if(next.has(key))next.delete(key);else next.add(key);return next});
  const run=async()=>{const now=new Date().toISOString();const values=items.filter(x=>selected.has(x.key)&&!x.existingId).map(item=>({id:createId('contact'),name:item.name,phone:item.phone,
    role,notes:item.notes,source:'device' as const,createdAt:now,updatedAt:now}));await contactsRepository.importMany(values);Alert.alert(t('importDone'),t('peopleImported',{count:values.length}));router.back()};
  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={t('importContacts')}/><View style={styles.body}><Text style={[styles.hint,{textAlign:isRTL?'right':'left'}]}>{t('importNoneSelected')}</Text>
    <View style={[styles.roles,{flexDirection:isRTL?'row-reverse':'row'}]}>{(['tenant','owner','broker','real_estate_company','building_guard'] as ContactRole[])
    .map(value=><Pressable key={value} onPress={()=>setRole(value)} style={[styles.chip,role===value&&styles.active]}><Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78} style={[styles.chipText,role===value&&styles.activeText]}>{getRoleLabel(language,value)}</Text></Pressable>)}</View>
    <TextInput value={query} onChangeText={setQuery} placeholder={t('contactSearch')} placeholderTextColor={colors.muted} selectionColor={colors.blue} cursorColor={colors.blue} style={[styles.search,{textAlign:isRTL?'right':'left'}]}/>
    <FlatList data={filtered} extraData={selected} keyExtractor={x=>x.key} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.empty}>{t('noImportableContacts')}</Text>}
      initialNumToRender={20} maxToRenderPerBatch={20} windowSize={7} removeClippedSubviews keyboardShouldPersistTaps="handled"
      ListHeaderComponent={loading?<ActivityIndicator color={colors.blue}/>:null}
      renderItem={({item})=><Pressable onPress={()=>item.existingId?router.push({pathname:'/contact-detail',params:{id:item.existingId}}):toggle(item.key)}
      style={[styles.row,{flexDirection:isRTL?'row-reverse':'row'},item.existingId&&styles.existing]}><Text style={styles.check}>{item.existingId?'↗':selected.has(item.key)?'✓':'○'}</Text><View style={styles.rowText}><Text style={[styles.name,{textAlign:isRTL?'right':'left'}]}>{item.name}</Text><Text style={[styles.phone,{textAlign:isRTL?'right':'left'}]}>{item.phone}</Text>{item.existingId?<Text style={[styles.existsText,{textAlign:isRTL?'right':'left'}]}>{t('alreadyExists')}</Text>:item.notes?<Text numberOfLines={1} style={[styles.note,{textAlign:isRTL?'right':'left'}]}>{item.notes}</Text>:null}</View></Pressable>}/>
    <View style={styles.footer}><PrimaryButton title={`${t('importSelected')} (${selected.size})`} onPress={run} disabled={!selected.size}/></View></View></SafeAreaView>}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},body:{flex:1,padding:spacing.md},
  hint:{color:colors.muted,textAlign:'right',marginBottom:spacing.md},search:{minHeight:48,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,
    backgroundColor:'white',color:colors.text,paddingHorizontal:spacing.md,textAlign:'right',fontSize:16,marginTop:spacing.md},
  roles:{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.xs},chip:{width:'48%',minHeight:48,padding:8,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:'white'},active:{backgroundColor:colors.blue},
  chipText:{color:colors.text,fontWeight:'700',textAlign:'center'},activeText:{color:'white',fontWeight:'700'},list:{gap:spacing.sm,paddingVertical:spacing.md},row:{minHeight:76,flexDirection:'row-reverse',alignItems:'center',gap:spacing.md,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.md,backgroundColor:'white'},existing:{backgroundColor:colors.surface},
  rowText:{flex:1},check:{fontSize:24,color:colors.blue},name:{fontSize:17,fontWeight:'700',textAlign:'right'},phone:{textAlign:'right',color:colors.muted},note:{textAlign:'right',color:colors.muted},existsText:{textAlign:'right',color:colors.blue,fontWeight:'700',marginTop:4},footer:{paddingTop:spacing.sm},empty:{textAlign:'center',color:colors.muted,marginTop:40}});
