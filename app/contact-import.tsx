import {useEffect,useMemo,useState} from 'react';
import * as ExpoContacts from 'expo-contacts';
import {Alert,ActivityIndicator,FlatList,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {router} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {PrimaryButton} from '@/components/PrimaryButton';
import {contactsRepository,phoneRepository} from '@/lib/database';
import {createId} from '@/lib/id';
import {AppHeader} from '@/components/AppHeader';
import {prepareDevicePhones,preserveDeviceContactName,preserveDeviceContactNotes,type PreparedDevicePhone} from '@/features/contacts/deviceImport';
import type {Contact,ContactPhone,ContactRole} from '@/types/domain';
import {colors,radius,spacing} from '@/theme/tokens';
import {getRoleLabel,useI18n} from '@/i18n/I18nContext';

type Candidate={key:string;name:string;phones:PreparedDevicePhone[];notes:string;conflictId:string|null;invalid:number;duplicates:number};

export default function ContactImport(){const {t,language,isRTL}=useI18n();const [items,setItems]=useState<Candidate[]>([]);const [selected,setSelected]=useState<Set<string>>(()=>new Set());const [role,setRole]=useState<ContactRole>('tenant');
  const [query,setQuery]=useState('');const [loading,setLoading]=useState(true);
  useEffect(()=>{void(async()=>{const permission=await ExpoContacts.requestPermissionsAsync();if(permission.status!=='granted'){setLoading(false);Alert.alert(t('permissionRequired'),t('permissionContacts'));return}
    try{const [result,storedPhones]=await Promise.all([ExpoContacts.getContactsAsync({fields:[ExpoContacts.Fields.PhoneNumbers,ExpoContacts.Fields.Note],sort:ExpoContacts.SortTypes.FirstName}),phoneRepository.listAll()]);
      const ownerByPhone=new Map(storedPhones.map(phone=>[phone.normalized,phone.contactId]));const deviceOwner=new Map<string,string>();const candidates:Candidate[]=[];
      result.data.forEach((contact,index)=>{const prepared=prepareDevicePhones(contact.phoneNumbers??[]);if(!prepared.phones.length)return;const key=contact.id||`device:${index}`;
        let conflictId:string|null=null;const uniquePhones=prepared.phones.filter(phone=>{const stored=ownerByPhone.get(phone.normalized);if(stored){conflictId=stored;return false}
          const earlier=deviceOwner.get(phone.normalized);if(earlier&&earlier!==key)return false;deviceOwner.set(phone.normalized,key);return true});
        const firstPrepared=prepared.phones[0];if((uniquePhones.length||conflictId)&&firstPrepared)candidates.push({key,name:preserveDeviceContactName(contact.name,firstPrepared.normalized),phones:uniquePhones,notes:preserveDeviceContactNotes(contact.note),conflictId,invalid:prepared.invalid,duplicates:prepared.duplicates})});
      setItems(candidates)}finally{setLoading(false)}})()},[t]);
  const filtered=useMemo(()=>{const needle=query.trim().toLocaleLowerCase('ar-KW');return items.filter(item=>!needle||item.name.toLocaleLowerCase('ar-KW').includes(needle)||item.phones.some(phone=>phone.display.includes(needle)||phone.normalized.includes(needle)))},[items,query]);
  const toggle=(key:string)=>setSelected(old=>{const next=new Set(old);if(next.has(key))next.delete(key);else next.add(key);return next});
  const run=async()=>{const now=new Date().toISOString();const selectedItems=items.filter(item=>selected.has(item.key)&&!item.conflictId&&item.phones.length);let phoneCount=0;
    const values=selectedItems.flatMap(item=>{const primary=item.phones[0];if(!primary)return[];const contactId=createId('contact');phoneCount+=item.phones.length;
      const contact:Contact={id:contactId,name:item.name,phone:primary.normalized,role,notes:item.notes,source:'device',createdAt:now,updatedAt:now};
      const phones:ContactPhone[]=item.phones.map((phone,index)=>({id:createId('phone'),contactId,normalized:phone.normalized,display:phone.display,label:phone.label,isPrimary:index===0,createdAt:now,updatedAt:now}));return {contact,phones}});
    await contactsRepository.importManyWithPhones(values);Alert.alert(t('importDone'),t('peopleAndPhonesImported',{people:values.length,phones:phoneCount}));router.back()};
  return <SafeAreaView style={styles.page} edges={['top']}><AppHeader title={t('importContacts')}/><View style={styles.body}><Text style={[styles.hint,{textAlign:isRTL?'right':'left'}]}>{t('importNoneSelected')}</Text>
    <View style={[styles.roles,{flexDirection:isRTL?'row-reverse':'row'}]}>{(['tenant','owner','broker','real_estate_company','building_guard'] as ContactRole[]).map(value=><Pressable key={value} onPress={()=>setRole(value)} style={[styles.chip,role===value&&styles.active]}><Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78} style={[styles.chipText,role===value&&styles.activeText]}>{getRoleLabel(language,value)}</Text></Pressable>)}</View>
    <TextInput value={query} onChangeText={setQuery} placeholder={t('contactSearch')} placeholderTextColor={colors.muted} selectionColor={colors.blue} cursorColor={colors.blue} style={[styles.search,{textAlign:isRTL?'right':'left'}]}/>
    <FlatList data={filtered} extraData={selected} keyExtractor={item=>item.key} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.empty}>{t('noImportableContacts')}</Text>}
      initialNumToRender={20} maxToRenderPerBatch={20} windowSize={7} removeClippedSubviews keyboardShouldPersistTaps="handled" ListHeaderComponent={loading?<ActivityIndicator color={colors.blue}/>:null}
      renderItem={({item})=><Pressable onPress={()=>item.conflictId?router.push({pathname:'/contact-detail',params:{id:item.conflictId}}):toggle(item.key)} style={[styles.row,{flexDirection:isRTL?'row-reverse':'row'},item.conflictId&&styles.existing]}>
        <Text style={styles.check}>{item.conflictId?'↗':selected.has(item.key)?'✓':'○'}</Text><View style={styles.rowText}><Text style={[styles.name,{textAlign:isRTL?'right':'left'}]}>{item.name}</Text>
          {item.phones.map(phone=><Text key={phone.normalized} style={[styles.phone,{textAlign:isRTL?'right':'left'}]}>{phone.display}{phone.label?` · ${phone.label}`:''}</Text>)}
          {item.conflictId?<Text style={[styles.existsText,{textAlign:isRTL?'right':'left'}]}>{t('phoneConflictOpen')}</Text>:item.invalid||item.duplicates?<Text style={[styles.note,{textAlign:isRTL?'right':'left'}]}>{t('phoneImportNotes',{invalid:item.invalid,duplicates:item.duplicates})}</Text>:null}</View></Pressable>}/>
    <View style={styles.footer}><PrimaryButton title={`${t('importSelected')} (${selected.size})`} onPress={run} disabled={!selected.size}/></View></View></SafeAreaView>}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},body:{flex:1,padding:spacing.md},hint:{color:colors.muted,textAlign:'right',marginBottom:spacing.md},search:{minHeight:48,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,
  backgroundColor:'white',color:colors.text,paddingHorizontal:spacing.md,textAlign:'right',fontSize:16,marginTop:spacing.md},roles:{flexDirection:'row-reverse',flexWrap:'wrap',gap:spacing.xs},chip:{width:'48%',minHeight:48,padding:8,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:'white'},active:{backgroundColor:colors.blue},
  chipText:{color:colors.text,fontWeight:'700',textAlign:'center'},activeText:{color:'white',fontWeight:'700'},list:{gap:spacing.sm,paddingVertical:spacing.md},row:{minHeight:76,flexDirection:'row-reverse',alignItems:'center',gap:spacing.md,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:spacing.md,backgroundColor:'white'},existing:{backgroundColor:colors.surface},
  rowText:{flex:1},check:{fontSize:24,color:colors.blue},name:{fontSize:17,fontWeight:'700',textAlign:'right'},phone:{textAlign:'right',color:colors.muted},note:{textAlign:'right',color:colors.muted},existsText:{textAlign:'right',color:colors.blue,fontWeight:'700',marginTop:4},footer:{paddingTop:spacing.sm},empty:{textAlign:'center',color:colors.muted,marginTop:40}});
